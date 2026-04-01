import { Request, Response } from 'express';
import { prisma } from '../config/database.config';
import { updateSettingsSchema } from '../schemas/settings.schema';
import { ZodError } from 'zod';

export class SettingsController {
  static async getAllSettings(_req: Request, res: Response): Promise<void> {
    try {
      const configs = await prisma.appConfig.findMany({
        orderBy: { key: 'asc' },
      });
      const settingsMap: Record<string, string> = {};
      configs.forEach(c => {
        settingsMap[c.key] = c.value;
      });

      res.status(200).json({
        success: true,
        data: settingsMap,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: _req.headers['x-request-id'] as string,
        },
      });
    } catch (error) {
      console.error('Error getting settings:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
          timestamp: new Date().toISOString(),
          requestId: _req.headers['x-request-id'] as string,
        },
      });
    }
  }

  static async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { configs } = updateSettingsSchema.parse(req.body);

      const updates = configs.map(c =>
        prisma.appConfig.upsert({
          where: { key: c.key },
          update: { value: c.value, updatedBy: req.user!.id },
          create: { key: c.key, value: c.value, updatedBy: req.user!.id },
        })
      );
      await prisma.$transaction(updates);

      const allConfigs = await prisma.appConfig.findMany({
        orderBy: { key: 'asc' },
      });
      const settingsMap: Record<string, string> = {};
      allConfigs.forEach(c => {
        settingsMap[c.key] = c.value;
      });

      res.status(200).json({
        success: true,
        data: settingsMap,
        meta: {
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
            message: 'Datos inválidos',
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string,
          },
        });
        return;
      }
      console.error('Error updating settings:', error);
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
