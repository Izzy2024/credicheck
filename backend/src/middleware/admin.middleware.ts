import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.config';
import logger, { logContext } from '../utils/logger.util';

/**
 * Middleware para verificar si el usuario tiene permisos de administrador
 * CORREGIDO: Ahora valida roles en mayúsculas consistentemente
 */
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      logger.warn('Usuario no autenticado - requireAdmin', {
        ip: req.ip,
        path: req.path,
        requestId: req.headers['x-request-id'],
      });
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuario no autenticado.',
        },
      });
      return;
    }

    // Obtener información completa del usuario desde la base de datos
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!user) {
      logger.warn('Usuario no encontrado - requireAdmin', {
        userId: req.user.id,
        ip: req.ip,
      });
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado.',
        },
      });
      return;
    }

    // Verificar que el usuario no esté eliminado (soft delete)
    if (user.deletedAt) {
      logger.warn('Usuario eliminado - requireAdmin', {
        userId: req.user.id,
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'USER_DELETED',
          message: 'La cuenta de usuario ha sido eliminada.',
        },
      });
      return;
    }

    if (!user.isActive) {
      logger.warn('Usuario inactivo - requireAdmin', {
        userId: req.user.id,
        email: user.email,
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'La cuenta de usuario está inactiva.',
        },
      });
      return;
    }

    // CORREGIDO: Verificar si el usuario tiene rol de administrador (mayúsculas)
    if (user.role !== 'ADMIN') {
      logger.warn('Permiso insuficiente - requireAdmin', {
        userId: req.user.id,
        email: user.email,
        role: user.role,
      });
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message:
            'No tienes permisos para realizar esta acción. Se requieren permisos de administrador.',
        },
      });
      return;
    }

    // Actualizar información del usuario en el request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'ANALYST',
    };

    next();
  } catch (error) {
    logger.error('Error en middleware de administrador:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id,
      requestId: req.headers['x-request-id'],
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error interno del servidor.',
      },
    });
  }
};

/**
 * Middleware para registrar acciones de administrador
 */
export const logAdminAction = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Guardar el método original de res.json
    const originalJson = res.json;

    // Sobrescribir res.json para interceptar la respuesta
    res.json = function (data: any) {
      // Si la respuesta fue exitosa, registrar la acción
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        logAction(req, action, data).catch((error) => {
          logger.error('Error registrando acción de administrador:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            action,
            userId: req.user?.id,
          });
        });
      }

      // Llamar al método original
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Función para registrar acciones de administrador en la base de datos
 */
async function logAction(req: Request, action: string, _responseData: any) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action,
        resource: req.path.split('/')[1] || 'unknown',
        resourceId: req.params['id'] || null,
        details: JSON.stringify({
          method: req.method,
          path: req.path,
          body: req.body ? Object.keys(req.body) : [],
        }),
        ipAddress: req.ip || req.socket.remoteAddress || '',
        userAgent: req.get('User-Agent') || '',
      },
    });

    logger.info('Acción de administrador registrada', logContext.adminAction(
      req.user!.id,
      req.user!.email,
      action,
      req.path.split('/')[1],
      req.params['id']
    ));
  } catch (error) {
    logger.error('Error registrando acción de administrador:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      action,
      userId: req.user?.id,
    });
  }
}

/**
 * Middleware para validar límites de operaciones masivas
 */
export const validateBulkOperation = (maxRecords: number = 100) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { recordIds } = req.body;

    if (!recordIds || !Array.isArray(recordIds)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RECORD_IDS',
          message: 'Se debe proporcionar un array de IDs de registros.',
        },
      });
      return;
    }

    if (recordIds.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_RECORD_LIST',
          message: 'Debe seleccionar al menos un registro.',
        },
      });
      return;
    }

    if (recordIds.length > maxRecords) {
      res.status(400).json({
        success: false,
        error: {
          code: 'TOO_MANY_RECORDS',
          message: `No se pueden procesar más de ${maxRecords} registros en una sola operación.`,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para validar transiciones de estado
 */
export const validateStatusTransition = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { status } = req.body;

  // Estados válidos
  const validStatuses = [
    'ACTIVE',
    'PAID',
    'INACTIVE',
    'PAYMENT_PLAN',
    'DISPUTED',
  ];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATUS',
        message: `Estado inválido. Los valores permitidos son: ${validStatuses.join(', ')}`,
      },
    });
    return;
  }

  // No permitir establecer estado como ACTIVE manualmente
  if (status === 'ACTIVE') {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
        message:
          'No se puede establecer el estado como ACTIVO manualmente. Este estado se asigna automáticamente.',
      },
    });
    return;
  }

  next();
};

/**
 * Middleware para validar formato de IDs
 */
export const validateRecordIds = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { recordIds } = req.body;

  if (recordIds && Array.isArray(recordIds)) {
    const invalidIds = recordIds.filter((id: string) => {
      // Validar formato CUID
      const cuidRegex = /^[a-z0-9]{20,}$/i;
      return !cuidRegex.test(id);
    });

    if (invalidIds.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_RECORD_IDS_FORMAT',
          message: 'Algunos IDs de registro tienen un formato inválido.',
          details: { invalidIds },
        },
      });
      return;
    }
  }

  next();
};
