import { Request, Response } from 'express';
import { RecordStatus } from '@prisma/client';
import { prisma } from '../config/database.config';
import {
  createCreditReferenceSchema,
  updateCreditReferenceStatusSchema,
  bulkUpdateStatusSchema,
} from '../schemas/credit-reference.schema';
import { ZodError } from 'zod';
import { checkWatchlistMatches } from '../services/notification.service';

export class CreditReferenceController {
  static async createReference(req: Request, res: Response): Promise<void> {
    try {
      console.log('Datos recibidos:', req.body);

      // Validar datos
      const validatedData = createCreditReferenceSchema.parse(req.body);
      console.log('Datos validados:', validatedData);

      // En producción, esto debería venir del token de autenticación
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no autenticado.',
          },
        });
        return;
      }

      const userId = req.user.id;

      const newReference = await prisma.creditReference.create({
        data: {
          fullName: validatedData.fullName,
          idNumber: validatedData.idNumber,
          idType: validatedData.idType,
          birthDate: validatedData.birthDate || null,
          phone: validatedData.phone || null,
          email: validatedData.email || null,
          address: validatedData.address || null,
          city: validatedData.city || null,
          department: validatedData.department || null,
          debtAmount: validatedData.debtAmount,
          debtDate: validatedData.debtDate,
          creditorName: validatedData.creditorName,
          debtStatus: validatedData.debtStatus || 'ACTIVE',
          notes: validatedData.notes || null,
          createdBy: userId,
        },
      });

      console.log('Referencia creada:', newReference);

      // M5.1: Verificar si hay coincidencias en watchlist
      try {
        await checkWatchlistMatches(
          'NAME',
          validatedData.fullName,
          newReference.id
        );
        await checkWatchlistMatches(
          'ID_NUMBER',
          validatedData.idNumber,
          newReference.id
        );
        if (validatedData.phone) {
          await checkWatchlistMatches(
            'PHONE',
            validatedData.phone,
            newReference.id
          );
        }
        if (validatedData.email) {
          await checkWatchlistMatches(
            'EMAIL',
            validatedData.email,
            newReference.id
          );
        }
      } catch (notifError) {
        // Log pero no fallar la creación por errores de notificación
        console.error('Error checking watchlist:', notifError);
      }

      res.status(201).json({
        success: true,
        data: newReference,
        message: 'Referencia crediticia creada exitosamente',
      });
    } catch (error) {
      console.error('Error creando referencia crediticia:', error);

      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de entrada inválidos',
            details: error.errors,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
          details: error instanceof Error ? error.message : 'Error desconocido',
        },
      });
    }
  }

  static async getSearchHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no autenticado.',
          },
        });
        return;
      }

      const history = await prisma.searchHistory.findMany({
        where: {
          userId: req.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      console.error('Error getting search history:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }

  static async getAllReferences(_req: Request, res: Response): Promise<void> {
    try {
      const references = await prisma.creditReference.findMany({
        where: {
          deletedAt: null, // Solo mostrar registros no eliminados
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: references,
        count: references.length,
      });
    } catch (error) {
      console.error('Error obteniendo referencias:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }

  static async searchReferences(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    try {
      const { query, type } = req.query;

      if (!query || !type) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'Parámetros query y type son requeridos',
          },
        });
        return;
      }

      let whereClause: any = {
        deletedAt: null, // Solo buscar registros no eliminados
      };
      let searchTypeEnum: string;

      switch (type) {
        case 'name':
          whereClause.fullName = {
            contains: query as string,
          };
          searchTypeEnum = 'NAME';
          break;
        case 'id':
          whereClause.idNumber = query as string;
          searchTypeEnum = 'ID';
          break;
        default:
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_SEARCH_TYPE',
              message: 'Tipo de búsqueda inválido',
            },
          });
          return;
      }

      const references = await prisma.creditReference.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const endTime = Date.now();
      const executionTimeMs = endTime - startTime;

      if (req.user) {
        await prisma.searchHistory.create({
          data: {
            userId: req.user.id,
            searchType: searchTypeEnum,
            searchTerm: query as string,
            resultsCount: references.length,
            executionTimeMs,
            ipAddress: req.ip || '',
            userAgent: req.get('User-Agent') || '',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: references,
        count: references.length,
      });
    } catch (error) {
      console.error('Error buscando referencias:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }

  static async getRecordsCount(_req: Request, res: Response): Promise<void> {
    try {
      const count = await prisma.creditReference.count({
        where: {
          deletedAt: null, // Solo contar registros no eliminados
        },
      });

      res.status(200).json({
        success: true,
        data: {
          count,
        },
      });
    } catch (error) {
      console.error('Error getting records count:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }

  static async updateReference(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'ID del registro es requerido.',
          },
        });
        return;
      }

      if (!status) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message: 'El campo status es requerido',
          },
        });
        return;
      }

      if (!Object.values(RecordStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Estado inválido. Los valores permitidos son: ${Object.values(RecordStatus).join(', ')}`,
          },
        });
        return;
      }

      const updatedReference = await prisma.creditReference.update({
        where: { id },
        data: { debtStatus: status },
      });

      res.status(200).json({
        success: true,
        data: updatedReference,
        message: 'Referencia actualizada exitosamente',
      });
    } catch (error) {
      console.error('Error actualizando referencia:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }

  static async updateReferenceStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no autenticado.',
          },
        });
        return;
      }

      // Validar datos con el schema específico para actualización de estado
      const validatedData = updateCreditReferenceStatusSchema.parse(req.body);

      // Verificar que el registro existe y no está eliminado
      const existingRecord = await prisma.creditReference.findFirst({
        where: {
          id: id as string,
          deletedAt: null,
        },
      });

      if (!existingRecord) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RECORD_NOT_FOUND',
            message: 'Registro no encontrado o eliminado',
          },
        });
        return;
      }

      // Preparar datos de actualización
      const updateData: any = {
        debtStatus: validatedData.status,
      };

      // Si se proporcionan notas, añadirlas a las notas existentes
      if (validatedData.notes) {
        const timestamp = new Date().toISOString();
        const notesWithTimestamp = `[${timestamp}] ${validatedData.notes}`;
        updateData.notes = existingRecord.notes
          ? `${existingRecord.notes}\n${notesWithTimestamp}`
          : notesWithTimestamp;
      }

      const updatedReference = await prisma.creditReference.update({
        where: { id: id as string },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        data: updatedReference,
        message: 'Estado del registro actualizado exitosamente',
      });
    } catch (error) {
      console.error('Error actualizando estado de referencia:', error);

      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de entrada inválidos',
            details: error.errors,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
          details: error instanceof Error ? error.message : 'Error desconocido',
        },
      });
    }
  }

  static async bulkUpdateStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no autenticado.',
          },
        });
        return;
      }

      // Validar datos con el schema específico para actualización masiva
      const validatedData = bulkUpdateStatusSchema.parse(req.body);

      // Verificar que todos los registros existen y no están eliminados
      const existingRecords = await prisma.creditReference.findMany({
        where: {
          id: { in: validatedData.recordIds },
          deletedAt: null,
        },
      });

      if (existingRecords.length !== validatedData.recordIds.length) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RECORDS_NOT_FOUND',
            message:
              'Uno o más registros no fueron encontrados o están eliminados',
          },
        });
        return;
      }

      // Preparar datos de actualización
      const updateData: any = {
        debtStatus: validatedData.status,
      };

      // Si se proporcionan notas, añadirlas a las notas existentes
      if (validatedData.notes) {
        const timestamp = new Date().toISOString();
        const notesWithTimestamp = `[${timestamp}] ${validatedData.notes}`;
        updateData.notes = notesWithTimestamp;
      }

      // Actualizar todos los registros
      const updatedRecords = await prisma.creditReference.updateMany({
        where: {
          id: { in: validatedData.recordIds },
        },
        data: updateData,
      });

      res.status(200).json({
        success: true,
        data: {
          updatedCount: updatedRecords.count,
          recordIds: validatedData.recordIds,
        },
        message: `${updatedRecords.count} registros actualizados exitosamente`,
      });
    } catch (error) {
      console.error('Error actualizando estados masivamente:', error);

      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Datos de entrada inválidos',
            details: error.errors,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
          details: error instanceof Error ? error.message : 'Error desconocido',
        },
      });
    }
  }

  static async deleteReference(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'ID del registro es requerido.',
          },
        });
        return;
      }

      // Soft delete: marcar como eliminado en lugar de borrar físicamente
      await prisma.creditReference.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.status(200).json({
        success: true,
        message: 'Referencia eliminada exitosamente',
      });
    } catch (error) {
      console.error('Error eliminando referencia:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }

  static async getRecordsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;

      if (
        !status ||
        !Object.values(RecordStatus).includes(status as RecordStatus)
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Estado inválido. Los valores permitidos son: ${Object.values(RecordStatus).join(', ')}`,
          },
        });
        return;
      }

      const references = await prisma.creditReference.findMany({
        where: {
          debtStatus: status as RecordStatus,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json({
        success: true,
        data: references,
        count: references.length,
        status,
      });
    } catch (error) {
      console.error('Error obteniendo referencias por estado:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }
}
