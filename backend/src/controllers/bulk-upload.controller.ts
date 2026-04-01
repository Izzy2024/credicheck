import { Request, Response } from 'express';
import * as bulkUploadService from '../services/bulk-upload.service';
import logger from '../utils/logger.util';

/**
 * Procesa un archivo CSV y carga los registros en batch
 */
export async function uploadCSV(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { csvContent } = req.body;

    if (!csvContent) {
      res.status(400).json({
        error: 'No se proporcionó contenido CSV',
        details: 'Enviar el contenido del CSV en el campo "csvContent"',
      });
      return;
    }

    // Procesar el CSV
    const result = await bulkUploadService.bulkUploadFromCSV(
      csvContent,
      userId
    );

    res.json(result);
  } catch (error) {
    logger.error('Error uploading CSV', {
      context: 'bulk_upload_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al procesar el archivo CSV' });
  }
}

/**
 * Descarga un template CSV de ejemplo
 */
export async function downloadTemplate(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const template = bulkUploadService.generateCSVTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="template.csv"');
    res.send(template);
  } catch (error) {
    logger.error('Error downloading template', {
      context: 'bulk_upload_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al generar el template' });
  }
}
