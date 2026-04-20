import { Request, Response } from 'express';
import { RecordStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { prisma } from '../config/database.config';
import {
  createCreditReferenceSchema,
  updateCreditReferenceStatusSchema,
  bulkUpdateStatusSchema,
} from '../schemas/credit-reference.schema';
import { ZodError } from 'zod';
import { checkWatchlistMatches } from '../services/notification.service';
import {
  buildTrustFromUserSignals,
  calculateCreditScoreSummary,
  evaluateRecordRisk,
  getCreateWindowStart,
  getDailyCreateLimitByTrust,
  getRecentDuplicateWindowStart,
  parseCreditScoreWeights,
} from '../services/record-moderation.service';

export class CreditReferenceController {
  static async getRecordAuditLogs(req: Request, res: Response): Promise<void> {
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

      const logs = await prisma.auditLog.findMany({
        where: {
          resource: 'credit_reference',
          resourceId: id,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              email: true,
            },
          },
        },
      });

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      console.error('Error getting record audit logs:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }

  static async getMyCreatedReferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const tenantId = req.user?.tenantId || 'default';
      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no autenticado.',
          },
        });
        return;
      }

      const records = await prisma.creditReference.findMany({
        where: {
          createdBy: userId,
          tenantId,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({
        success: true,
        data: records,
      });
    } catch (error) {
      console.error('Error getting my created references:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }
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

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, trustLevel: true, tenantId: true },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'No se encontró el usuario autenticado.',
          },
        });
        return;
      }

      const createWindowStart = getCreateWindowStart();
      const duplicateWindowStart = getRecentDuplicateWindowStart();

      const [userTotalRecords, userDailyCreates, sameDebtorByUser, sameDebtorGlobalRecent, userRecordIds] =
        await Promise.all([
          prisma.creditReference.count({
            where: { createdBy: userId, deletedAt: null, tenantId: user.tenantId || 'default' },
          }),
          prisma.creditReference.count({
            where: {
              createdBy: userId,
              tenantId: user.tenantId || 'default',
              createdAt: { gte: createWindowStart },
              deletedAt: null,
            },
          }),
          prisma.creditReference.count({
            where: {
              createdBy: userId,
              tenantId: user.tenantId || 'default',
              idNumber: validatedData.idNumber,
              createdAt: { gte: duplicateWindowStart },
              deletedAt: null,
            },
          }),
          prisma.creditReference.count({
            where: {
              idNumber: validatedData.idNumber,
              tenantId: user.tenantId || 'default',
              createdAt: { gte: createWindowStart },
              deletedAt: null,
            },
          }),
          prisma.creditReference.findMany({
            where: { createdBy: userId, deletedAt: null, tenantId: user.tenantId || 'default' },
            select: { id: true },
          }),
        ]);

      const userRejectedDisputesAgainstHim =
        userRecordIds.length > 0
          ? await prisma.dispute.count({
              where: {
                status: 'APPROVED',
                recordId: { in: userRecordIds.map((r) => r.id) },
              },
            })
          : 0;

      const inferredTrustLevel = buildTrustFromUserSignals(
        user,
        userTotalRecords,
        userRejectedDisputesAgainstHim,
      );

      const dailyLimit = getDailyCreateLimitByTrust(inferredTrustLevel);
      if (userDailyCreates >= dailyLimit) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Has alcanzado el límite de ${dailyLimit} registros en 24 horas para tu nivel de confianza.`,
          },
        });
        return;
      }

      const moderation = evaluateRecordRisk({
        trustLevel: inferredTrustLevel,
        debtAmount: Number(validatedData.debtAmount),
        notes: validatedData.notes ?? null,
        hasContactInfo: Boolean(
          validatedData.phone || validatedData.email || validatedData.address,
        ),
        dailyCreateCount: userDailyCreates,
        sameDebtorRecentByUserCount: sameDebtorByUser,
        sameDebtorRecentGlobalCount: sameDebtorGlobalRecent,
        caseType: validatedData.caseType,
      });

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
          caseType: validatedData.caseType || 'FORMAL',
          publishState: moderation.publishState,
          reviewStatus: moderation.reviewStatus,
          riskScore: moderation.riskScore,
          riskReasons: JSON.stringify(moderation.riskReasons),
          reviewedAt: moderation.reviewStatus === 'AUTO_APPROVED' ? new Date() : null,
          notes: validatedData.notes || null,
          tenantId: user.tenantId || 'default',
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
        moderation: {
          trustLevel: inferredTrustLevel,
          riskScore: moderation.riskScore,
          reviewStatus: moderation.reviewStatus,
          publishState: moderation.publishState,
          reasons: moderation.riskReasons,
        },
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

      const tenantId = req.user.tenantId || 'default';

      const history = await prisma.searchHistory.findMany({
        where: {
          userId: req.user.id,
          tenantId,
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

  static async getAllReferences(req: Request, res: Response): Promise<void> {
    try {
      const isAdmin = req.user?.role === 'ADMIN';
      const requesterId = req.user?.id;
      const tenantId = req.user?.tenantId || 'default';

      const references = await prisma.creditReference.findMany({
        where: {
          deletedAt: null,
          tenantId,
          ...(isAdmin
            ? {}
            : {
                OR: [
                  { publishState: 'PUBLISHED' },
                  ...(requesterId ? [{ createdBy: requesterId }] : []),
                ],
              }),
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

  static async getReferenceById(req: Request, res: Response): Promise<void> {
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

      const isAdmin = req.user?.role === 'ADMIN';
      const requesterId = req.user?.id;
      const tenantId = req.user?.tenantId || 'default';

      const record = await prisma.creditReference.findFirst({
        where: {
          id,
          deletedAt: null,
          tenantId,
          ...(isAdmin
            ? {}
            : {
                OR: [
                  { publishState: 'PUBLISHED' },
                  ...(requesterId ? [{ createdBy: requesterId }] : []),
                ],
              }),
        },
      });

      if (!record) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RECORD_NOT_FOUND',
            message: 'Registro no encontrado o sin permisos para verlo.',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error) {
      console.error('Error obteniendo registro por ID:', error);
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

      const tenantFromQuery = req.query['tenantId'];
      const requestedTenantId =
        typeof tenantFromQuery === 'string' && tenantFromQuery.trim().length > 0
          ? tenantFromQuery.trim()
          : undefined;
      const headerTenantId =
        typeof req.headers['x-tenant-id'] === 'string' && req.headers['x-tenant-id'].trim().length > 0
          ? req.headers['x-tenant-id'].trim()
          : undefined;
      const tenantId = req.user?.tenantId || requestedTenantId || headerTenantId || 'default';

      let whereClause: any = {
        deletedAt: null, // Solo buscar registros no eliminados
        tenantId,
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

      if (!req.user) {
        whereClause.publishState = 'PUBLISHED';
      } else if (req.user.role !== 'ADMIN') {
        whereClause.OR = [
          { publishState: 'PUBLISHED' },
          { createdBy: req.user.id },
        ];
      }

      const references = await prisma.creditReference.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const scoreWeightConfig = await prisma.appConfig.findUnique({
        where: { key: 'credit_score_weights' },
      });
      const scoreWeights = parseCreditScoreWeights(scoreWeightConfig?.value);

      const creditScoreSummary = calculateCreditScoreSummary(
        references.map((ref) => ({
          debtAmount: Number(ref.debtAmount),
          debtStatus: ref.debtStatus,
          debtDate: ref.debtDate,
        })),
        scoreWeights,
      );

      const endTime = Date.now();
      const executionTimeMs = endTime - startTime;

      if (req.user) {
        await prisma.searchHistory.create({
          data: {
            userId: req.user.id,
            tenantId,
            searchType: searchTypeEnum,
            searchTerm: query as string,
            resultsCount: references.length,
            executionTimeMs,
            ipAddress: req.ip || '',
            userAgent: req.get('User-Agent') || '',
          },
        });
      }

      // Si no hay usuario autenticado, devolvemos un preview limitado (UX + protección)
      if (!req.user) {
        const maskName = (name: string) => {
          const parts = name.split(' ').filter(Boolean);
          return parts
            .map((p) =>
              p.length <= 1
                ? '*'
                : `${p.charAt(0)}${'*'.repeat(Math.min(6, p.length - 1))}`
            )
            .join(' ');
        };

        const maskId = (id: string) => {
          const clean = id.replace(/\s+/g, '');
          if (clean.length <= 4) return '****';
          return `${'*'.repeat(clean.length - 4)}${clean.slice(-4)}`;
        };

        const previewLimit = 5;
        const preview = references.slice(0, previewLimit).map((ref) => ({
          id: ref.id,
          fullName: maskName(ref.fullName),
          idType: ref.idType,
          idNumber: maskId(ref.idNumber),
          debtStatus: ref.debtStatus,
        }));

        res.status(200).json({
          success: true,
          data: preview,
          count: references.length,
          meta: {
            visibility: 'public',
            previewLimit,
            locked: true,
            creditScore: creditScoreSummary,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: references,
        count: references.length,
        meta: {
          visibility: 'full',
          locked: false,
          creditScore: creditScoreSummary,
        },
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

  static async getRecordsCount(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.user?.tenantId || 'default';
      const count = await prisma.creditReference.count({
        where: {
          deletedAt: null, // Solo contar registros no eliminados
          tenantId,
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
      const { status, notes, creditorName, debtAmount, debtDate } = req.body;
      const tenantId = req.user?.tenantId || 'default';

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

      const hasAnyUpdateField =
        status !== undefined ||
        (notes && typeof notes === 'string' && notes.trim().length > 0) ||
        creditorName !== undefined ||
        debtAmount !== undefined ||
        debtDate !== undefined;

      if (!hasAnyUpdateField) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETERS',
            message:
              'Debe enviar al menos un campo a actualizar (status, creditorName, debtAmount, debtDate o notes).',
          },
        });
        return;
      }

      if (status !== undefined && !Object.values(RecordStatus).includes(status)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Estado inválido. Los valores permitidos son: ${Object.values(RecordStatus).join(', ')}`,
          },
        });
        return;
      }

      // Verificar que el registro existe y no está eliminado
      const existingRecord = await prisma.creditReference.findFirst({
        where: { id, deletedAt: null, tenantId },
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

      const updateData: any = {};

      if (status !== undefined) {
        updateData.debtStatus = status;
      }

      if (creditorName !== undefined) {
        if (typeof creditorName !== 'string' || creditorName.trim().length < 2) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_CREDITOR_NAME',
              message: 'El nombre del acreedor debe ser un texto válido.',
            },
          });
          return;
        }
        updateData.creditorName = creditorName.trim();
      }

      if (debtAmount !== undefined) {
        const amountNum =
          typeof debtAmount === 'string' ? parseFloat(debtAmount) : debtAmount;
        if (typeof amountNum !== 'number' || Number.isNaN(amountNum) || amountNum < 0) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_DEBT_AMOUNT',
              message: 'El monto de la deuda debe ser un número válido.',
            },
          });
          return;
        }
        // Prisma Decimal acepta number o string
        updateData.debtAmount = String(amountNum);
      }

      if (debtDate !== undefined) {
        const parsedDate = new Date(debtDate);
        if (Number.isNaN(parsedDate.getTime())) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_DEBT_DATE',
              message: 'La fecha de la deuda no es válida.',
            },
          });
          return;
        }
        updateData.debtDate = parsedDate;
      }

      const { notesMode } = req.body as any;

      if (notes && typeof notes === 'string' && notes.trim().length > 0) {
        const trimmed = notes.trim();

        if (notesMode === 'replace') {
          // Reemplazar por completo (ojo: esto sobrescribe el historial)
          updateData.notes = trimmed;
        } else {
          // append (default)
          const timestamp = new Date().toISOString();
          const notesWithTimestamp = `[${timestamp}] ${trimmed}`;
          updateData.notes = existingRecord.notes
            ? `${existingRecord.notes}\n${notesWithTimestamp}`
            : notesWithTimestamp;
        }
      }

      const updatedReference = await prisma.creditReference.update({
        where: { id },
        data: updateData,
      });

      // Auditoría por registro (quién cambió qué). No bloquea si falla.
      try {
        const actorId = req.user?.id;
        if (actorId) {
          const truncate = (s: any, max = 2000) => {
            if (s === null || s === undefined) return s;
            const str = String(s);
            return str.length > max ? `${str.slice(0, max)}…` : str;
          };

          const changes: any[] = [];

          if (status !== undefined && existingRecord.debtStatus !== status) {
            changes.push({ field: 'debtStatus', from: existingRecord.debtStatus, to: status });
          }

          if (creditorName !== undefined) {
            changes.push({
              field: 'creditorName',
              from: truncate(existingRecord.creditorName),
              to: truncate(updateData.creditorName),
            });
          }

          if (debtAmount !== undefined) {
            changes.push({
              field: 'debtAmount',
              from: truncate(existingRecord.debtAmount),
              to: truncate(updateData.debtAmount),
            });
          }

          if (debtDate !== undefined) {
            changes.push({
              field: 'debtDate',
              from: existingRecord.debtDate?.toISOString?.() || existingRecord.debtDate,
              to: updateData.debtDate?.toISOString?.() || updateData.debtDate,
            });
          }

          if (notes && typeof notes === 'string' && notes.trim().length > 0) {
            const newNotes = notes.trim();

            if (notesMode === 'replace') {
              const prevNotes = existingRecord.notes || '';
              const prevHash = crypto
                .createHash('sha256')
                .update(prevNotes)
                .digest('hex');
              const newHash = crypto
                .createHash('sha256')
                .update(newNotes)
                .digest('hex');

              changes.push({
                field: 'notes',
                mode: 'replace',
                previous: {
                  length: prevNotes.length,
                  sha256: prevHash,
                },
                next: {
                  length: newNotes.length,
                  sha256: newHash,
                },
                snippet: truncate(newNotes, 300),
              });
            } else {
              changes.push({
                field: 'notes',
                mode: 'append',
                snippet: truncate(newNotes, 800),
              });
            }
          }

          await prisma.auditLog.create({
            data: {
              userId: actorId,
              action: 'UPDATE_RECORD',
              resource: 'credit_reference',
              resourceId: id,
              details: JSON.stringify({ changes }),
              ipAddress: (req.headers['x-forwarded-for'] as string) || req.ip || null,
              userAgent: (req.headers['user-agent'] as string) || null,
            },
          });
        }
      } catch (e) {
        console.warn('Audit log failed (non-blocking):', e);
      }

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

      const tenantId = req.user.tenantId || 'default';

      // Validar datos con el schema específico para actualización de estado
      const validatedData = updateCreditReferenceStatusSchema.parse(req.body);

      // Verificar que el registro existe y no está eliminado
      const existingRecord = await prisma.creditReference.findFirst({
        where: {
          id: id as string,
          deletedAt: null,
          tenantId,
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

      const tenantId = req.user.tenantId || 'default';

      // Validar datos con el schema específico para actualización masiva
      const validatedData = bulkUpdateStatusSchema.parse(req.body);

      // Verificar que todos los registros existen y no están eliminados
      const existingRecords = await prisma.creditReference.findMany({
        where: {
          id: { in: validatedData.recordIds },
          deletedAt: null,
          tenantId,
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
          tenantId,
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

  static async getModerationQueue(req: Request, res: Response): Promise<void> {
    try {
      const minRisk = Number(req.query['minRisk'] ?? 55);
      const maxRisk = Number(req.query['maxRisk'] ?? 100);
      const limit = Math.min(Number(req.query['limit'] ?? 100), 200);

      const safeMinRisk = Number.isNaN(minRisk) ? 55 : Math.max(0, minRisk);
      const safeMaxRisk = Number.isNaN(maxRisk) ? 100 : Math.min(100, maxRisk);
      const tenantId = req.user?.tenantId || 'default';

      const records = await prisma.creditReference.findMany({
        where: {
          deletedAt: null,
          tenantId,
          OR: [{ publishState: 'PENDING_REVIEW' }, { reviewStatus: 'NEEDS_REVIEW' }],
          riskScore: { gte: Math.min(safeMinRisk, safeMaxRisk), lte: Math.max(safeMinRisk, safeMaxRisk) },
        },
        orderBy: [{ riskScore: 'desc' }, { createdAt: 'desc' }],
        take: Number.isNaN(limit) ? 100 : limit,
      });

      res.status(200).json({
        success: true,
        data: records,
        count: records.length,
      });
    } catch (error) {
      console.error('Error obteniendo cola de moderación:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
        },
      });
    }
  }

  static async moderateReference(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { action, notes } = req.body as {
        action?: 'APPROVE' | 'REJECT';
        notes?: string;
      };
      const tenantId = req.user?.tenantId || 'default';

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

      if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'La acción debe ser APPROVE o REJECT.',
          },
        });
        return;
      }

      const existingRecord = await prisma.creditReference.findFirst({
        where: { id, deletedAt: null, tenantId },
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

      const moderationNote = notes?.trim();
      const prefixedNote = moderationNote
        ? `[MODERATION:${action}] ${moderationNote}`
        : undefined;

      const nextNotes = prefixedNote
        ? existingRecord.notes
          ? `${existingRecord.notes}\n${prefixedNote}`
          : prefixedNote
        : existingRecord.notes;

      const updated = await prisma.creditReference.update({
        where: { id },
        data: {
          publishState: action === 'APPROVE' ? 'PUBLISHED' : 'REJECTED',
          reviewStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          reviewedBy: req.user?.id ?? null,
          reviewedAt: new Date(),
          notes: nextNotes ?? null,
        },
      });

      res.status(200).json({
        success: true,
        data: updated,
        message:
          action === 'APPROVE'
            ? 'Registro aprobado y publicado.'
            : 'Registro rechazado en moderación.',
      });
    } catch (error) {
      console.error('Error moderando referencia:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Error interno del servidor',
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

      const tenantId = req.user?.tenantId || 'default';

      // Soft delete: marcar como eliminado en lugar de borrar físicamente
      const deleted = await prisma.creditReference.updateMany({
        where: { id, tenantId },
        data: { deletedAt: new Date() },
      });

      if (deleted.count === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'RECORD_NOT_FOUND',
            message: 'Registro no encontrado para este tenant.',
          },
        });
        return;
      }

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
      const tenantId = req.user?.tenantId || 'default';

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
          tenantId,
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
