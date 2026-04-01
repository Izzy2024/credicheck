import { Request, Response } from 'express';
import { prisma } from '../config/database.config';
import { getAuditLogsSchema } from '../schemas/audit.schema';
import { ZodError } from 'zod';

export class AuditController {
  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters = getAuditLogsSchema.parse(req.query);
      const { page, limit, action, resource, userId, fromDate, toDate } =
        filters;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (action) where.action = action;
      if (resource) where.resource = resource;
      if (userId) where.userId = userId;
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = new Date(fromDate);
        if (toDate) where.createdAt.lte = new Date(toDate);
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: logs,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parámetros inválidos',
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        });
        return;
      }
      console.error('Error getting audit logs:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      });
    }
  }
}
