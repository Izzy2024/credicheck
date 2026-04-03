import { Request, Response } from 'express';
import { prisma } from '../config/database.config';
import logger from '../utils/logger.util';
import * as fs from 'fs';
import * as path from 'path';
import multer from 'multer';

const UPLOAD_DIR = path.join(__dirname, '../../uploads/disputes');
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'application/pdf'];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo JPG y PDF.'));
    }
  },
});

/**
 * Upload attachments to a dispute
 */
export async function uploadAttachments(
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

    // Check if dispute exists and belongs to user
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      res.status(404).json({ error: 'Disputa no encontrada' });
      return;
    }

    if (dispute.userId !== userId) {
      res.status(403).json({
        error: 'No tienes permiso para adjuntar archivos a esta disputa',
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No se proporcionaron archivos' });
      return;
    }

    // Create dispute directory if needed
    const disputeDir = path.join(UPLOAD_DIR, disputeId);
    if (!fs.existsSync(disputeDir)) {
      fs.mkdirSync(disputeDir, { recursive: true });
    }

    // Move files to dispute-specific directory and create records
    const attachments = [];
    for (const file of files) {
      const newPath = path.join(disputeDir, file.filename);
      fs.renameSync(file.path, newPath);

      const attachment = await prisma.disputeAttachment.create({
        data: {
          disputeId,
          fileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storagePath: newPath,
          uploadedById: userId,
        },
      });

      attachments.push(attachment);
    }

    res.status(201).json({ success: true, data: attachments });
  } catch (error) {
    logger.error('Error uploading attachments', {
      context: 'dispute_attachment_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al subir los archivos' });
  }
}

/**
 * Get attachments for a dispute
 */
export async function getAttachments(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const disputeId = req.params['disputeId'];
    if (!disputeId) {
      res.status(400).json({ error: 'ID de disputa requerido' });
      return;
    }

    const attachments = await prisma.disputeAttachment.findMany({
      where: { disputeId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: attachments });
  } catch (error) {
    logger.error('Error fetching attachments', {
      context: 'dispute_attachment_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    res.status(500).json({ error: 'Error al obtener los archivos' });
  }
}
