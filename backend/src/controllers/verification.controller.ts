import { Request, Response } from 'express';
import { z } from 'zod';
import * as verificationService from '../services/verification.service';
import logger from '../utils/logger.util';

const upsertVerificationSchema = z.object({
  type: z.enum(['CONFIRMED', 'DISPUTED']),
  confidence: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function upsertVerification(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const recordId = req.params['recordId'];
    if (!recordId) {
      res.status(400).json({ error: 'recordId es requerido' });
      return;
    }

    const parsed = upsertVerificationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: 'Datos inválidos',
        details: parsed.error.errors,
      });
      return;
    }

    const verification = await verificationService.upsertVerification(
      recordId,
      userId,
      {
        type: parsed.data.type,
        confidence: parsed.data.confidence,
        ...(parsed.data.comment !== undefined && {
          comment: parsed.data.comment,
        }),
      }
    );

    res.status(200).json({ success: true, data: verification });
  } catch (error) {
    if (error instanceof Error && error.message === 'RECORD_NOT_FOUND') {
      res.status(404).json({ error: 'Referencia no encontrada' });
      return;
    }

    logger.error('Error upserting verification', {
      context: 'verification_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al guardar la verificación' });
  }
}

export async function getVerificationSummary(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const recordId = req.params['recordId'];
    if (!recordId) {
      res.status(400).json({ error: 'recordId es requerido' });
      return;
    }

    const summary = await verificationService.getVerificationSummary(recordId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    if (error instanceof Error && error.message === 'RECORD_NOT_FOUND') {
      res.status(404).json({ error: 'Referencia no encontrada' });
      return;
    }

    logger.error('Error getting verification summary', {
      context: 'verification_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res
      .status(500)
      .json({ error: 'Error al obtener el resumen de verificación' });
  }
}

export async function deleteMyVerification(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const recordId = req.params['recordId'];
    if (!recordId) {
      res.status(400).json({ error: 'recordId es requerido' });
      return;
    }

    const deletedCount = await verificationService.deleteVerification(
      recordId,
      userId
    );
    res.status(200).json({ success: true, deletedCount });
  } catch (error) {
    logger.error('Error deleting verification', {
      context: 'verification_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al eliminar la verificación' });
  }
}
