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
  disputes: T[]
): Promise<Array<T & { record: RecordSummary | null }>> {
  const recordIds = [...new Set(disputes.map((dispute) => dispute.recordId))];

  if (recordIds.length === 0) {
    return disputes.map((dispute) => ({ ...dispute, record: null }));
  }

  const records = await prisma.creditReference.findMany({
    where: { id: { in: recordIds } },
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

    // Check if record exists
    const record = await prisma.creditReference.findUnique({
      where: { id: recordId },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    const disputesWithRecords = await attachRecordsToDisputes(disputes);

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

    const { status, adminNotes } = parsed.data;

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

    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        adminNotes: adminNotes || null,
        resolvedBy: userId,
        resolvedAt: new Date(),
      },
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

    const disputesWithRecords = await attachRecordsToDisputes(disputes);

    res.status(200).json({ success: true, data: disputesWithRecords });
  } catch (error) {
    logger.error('Error fetching pending disputes', {
      context: 'dispute_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al obtener disputas pendientes' });
  }
}
