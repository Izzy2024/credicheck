import { Request, Response } from 'express';
import { ExportService } from '../services/export.service';

export class ExportController {
  static async exportRecords(req: Request, res: Response): Promise<void> {
    try {
      const format = (req.query['format'] as string) || 'csv';
      const tenantId = req.user?.tenantId || 'default';

      if (format === 'excel') {
        const buffer = await ExportService.exportRecordsExcel(tenantId);
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=registros_${new Date().toISOString().split('T')[0]}.xlsx`
        );
        res.send(buffer);
        return;
      }

      const csv = await ExportService.exportRecordsCSV(tenantId);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=registros_${new Date().toISOString().split('T')[0]}.csv`
      );
      res.send('\uFEFF' + csv);
    } catch (error) {
      console.error('Error exporting records:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Error al exportar registros',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      });
    }
  }

  static async exportHistory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const userId = req.user?.role === 'ADMIN' ? undefined : req.user?.id;
      const csv = await ExportService.exportHistoryCSV(tenantId, userId);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=historial_${new Date().toISOString().split('T')[0]}.csv`
      );
      res.send('\uFEFF' + csv);
    } catch (error) {
      console.error('Error exporting history:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Error al exportar historial',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      });
    }
  }
}
