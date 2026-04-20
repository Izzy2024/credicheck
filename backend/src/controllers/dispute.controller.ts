import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.config';
import logger from '../utils/logger.util';

type RecordSummary = {
  id: string;
  fullName: string;
  idType: string;
  idNumber: string;
  debtAmount: unknown;
  creditorName: string;
  debtStatus: string;
};

async function attachRecordsToDisputes<T extends { recordId: string }>(
  disputes: T[],
  tenantId: string
): Promise<Array<T & { record: RecordSummary | null }>> {
  const recordIds = [...new Set(disputes.map((dispute) => dispute.recordId))];

  if (recordIds.length === 0) {
    return disputes.map((dispute) => ({ ...dispute, record: null }));
  }

  const records = await prisma.creditReference.findMany({
    where: { id: { in: recordIds }, tenantId },
    select: {
      id: true,
      fullName: true,
      idType: true,
      idNumber: true,
      debtAmount: true,
      creditorName: true,
      debtStatus: true,
    },
  });

  const recordsById = new Map(records.map((record) => [record.id, record]));

  return disputes.map((dispute) => ({
    ...dispute,
    record: recordsById.get(dispute.recordId) ?? null,
  }));
}

const createDisputeSchema = z.object({
  recordId: z.string(),
  reason: z.string().min(10).max(500),
  description: z.string().min(20).max(2000),
});

const resolveDisputeSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNotes: z.string().max(1000).optional(),
  applyPaidStatus: z.boolean().optional(),
});

const createDisputeMessageSchema = z.object({
  message: z.string().min(1).max(2000),
});

/**
 * Create a dispute for a record (authenticated user only)
 */
export async function createDispute(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const parsed = createDisputeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: parsed.error.errors,
      });
      return;
    }

    const { recordId, reason, description } = parsed.data;
    const tenantId = req.user?.tenantId || 'default';

    // Check if record exists
    const record = await prisma.creditReference.findFirst({
      where: { id: recordId, tenantId },
    });

    if (!record) {
      res.status(404).json({ error: 'Referencia no encontrada' });
      return;
    }

    // Check if user already has a pending dispute for this record
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        recordId,
        userId,
        status: 'PENDING',
      },
    });

    if (existingDispute) {
      res.status(409).json({
        error: 'Ya tienes una disputa pendiente para esta referencia',
      });
      return;
    }

    const dispute = await prisma.$transaction(async (tx) => {
      const createdDispute = await tx.dispute.create({
        data: {
          recordId,
          userId,
          reason,
          description,
        },
      });

      await tx.creditReference.update({
        where: { id: recordId },
        data: { debtStatus: 'DISPUTED' },
      });

      return createdDispute;
    });

    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    logger.error('Error creating dispute', {
      context: 'dispute_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al crear la disputa' });
  }
}

/**
 * Get user's own disputes
 */
export async function getMyDisputes(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const disputes = await prisma.dispute.findMany({
      where: { userId },
      include: {
        attachments: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tenantId = req.user?.tenantId || 'default';
    const disputesWithRecords = await attachRecordsToDisputes(disputes, tenantId);

    res.status(200).json({ success: true, data: disputesWithRecords });
  } catch (error) {
    logger.error('Error fetching disputes', {
      context: 'dispute_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al obtener disputas' });
  }
}

/**
 * Resolve a dispute (admin only)
 */
export async function resolveDispute(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const disputeId = req.params['id'];
    if (!disputeId) {
      res.status(400).json({ error: 'ID de disputa requerido' });
      return;
    }

    const parsed = resolveDisputeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: parsed.error.errors,
      });
      return;
    }

    const { status, adminNotes, applyPaidStatus } = parsed.data;

    // Check if dispute exists
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      res.status(404).json({ error: 'Disputa no encontrada' });
      return;
    }

    if (dispute.status !== 'PENDING') {
      res.status(409).json({ error: 'Esta disputa ya fue resuelta' });
      return;
    }

    const shouldApplyPaidStatus = status === 'APPROVED' && applyPaidStatus === true;

    const resolutionMessageLines: string[] = [];
    resolutionMessageLines.push(
      `Actualización de la disputa: ${status === 'APPROVED' ? 'APROBADA' : 'RECHAZADA'}.`
    );
    if (shouldApplyPaidStatus) {
      resolutionMessageLines.push('');
      resolutionMessageLines.push('Se actualizó automáticamente el registro a estado PAGADA.');
    }
    if (adminNotes && adminNotes.trim().length > 0) {
      resolutionMessageLines.push('');
      resolutionMessageLines.push('Notas del administrador:');
      resolutionMessageLines.push(adminNotes.trim());
    }

    const updatedDispute = await prisma.$transaction(async (tx) => {
      const updated = await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status,
          adminNotes: adminNotes || null,
          resolvedBy: userId,
          resolvedAt: new Date(),
        },
      });

      if (shouldApplyPaidStatus) {
        const previousRecord = await tx.creditReference.findUnique({
          where: { id: dispute.recordId },
          select: { debtStatus: true },
        });

        await tx.creditReference.update({
          where: { id: dispute.recordId },
          data: { debtStatus: 'PAID' },
        });

        await tx.auditLog.create({
          data: {
            userId,
            action: 'UPDATE_RECORD_STATUS_FROM_DISPUTE',
            resource: 'credit_reference',
            resourceId: dispute.recordId,
            details: JSON.stringify({
              disputeId,
              previousDebtStatus: previousRecord?.debtStatus ?? null,
              newDebtStatus: 'PAID',
              reason: 'Disputa aprobada con aplicación de estado pagado',
            }),
            ipAddress: req.ip || null,
            userAgent: req.get('User-Agent') || null,
          },
        });
      }

      await tx.disputeMessage.create({
        data: {
          disputeId,
          userId,
          message: resolutionMessageLines.join('\n'),
        },
      });

      // Notificación al usuario afectado
      await tx.notification.create({
        data: {
          userId: dispute.userId,
          type: 'DISPUTE_UPDATE',
          status: 'UNREAD',
          title:
            status === 'APPROVED'
              ? 'Tu disputa fue aprobada'
              : 'Tu disputa fue rechazada',
          message:
            status === 'APPROVED'
              ? `El administrador aprobó tu disputa para el registro ${dispute.recordId}.`
              : `El administrador rechazó tu disputa para el registro ${dispute.recordId}.`,
          relatedRecordId: dispute.recordId,
          relatedSearchId: null,
          metadata: JSON.stringify({
            disputeId,
            status,
            applyPaidStatus: shouldApplyPaidStatus,
          }),
        },
      });

      return updated;
    });

    res.status(200).json({ success: true, data: updatedDispute });
  } catch (error) {
    logger.error('Error resolving dispute', {
      context: 'dispute_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al resolver la disputa' });
  }
}

/**
 * Get all pending disputes (admin only)
 */
export async function getPendingDisputes(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const disputes = await prisma.dispute.findMany({
      where: { status: 'PENDING' },
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tenantId = _req.user?.tenantId || 'default';
    const disputesWithRecords = await attachRecordsToDisputes(disputes, tenantId);

    res.status(200).json({ success: true, data: disputesWithRecords });
  } catch (error) {
    logger.error('Error fetching pending disputes', {
      context: 'dispute_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al obtener disputas pendientes' });
  }
}

/**
 * Get messages for a dispute (owner or admin)
 */
export async function getDisputeMessages(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const disputeId = req.params['disputeId'];
    if (!disputeId) {
      res.status(400).json({ error: 'ID de disputa requerido' });
      return;
    }

    const messages = await prisma.disputeMessage.findMany({
      where: { disputeId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    logger.error('Error fetching dispute messages', {
      context: 'dispute_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
}

/**
 * Create a message in a dispute (owner or admin)
 */
export async function createDisputeMessage(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const disputeId = req.params['disputeId'];
    if (!disputeId) {
      res.status(400).json({ error: 'ID de disputa requerido' });
      return;
    }

    const parsed = createDisputeMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: parsed.error.errors,
      });
      return;
    }

    const created = await prisma.disputeMessage.create({
      data: {
        disputeId,
        userId,
        message: parsed.data.message,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    logger.error('Error creating dispute message', {
      context: 'dispute_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al crear el mensaje' });
  }
}
