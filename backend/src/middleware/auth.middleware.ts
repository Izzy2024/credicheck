import { Request, Response, NextFunction } from 'express';
import { JWTUtil, JWTPayload } from '../utils/jwt.util';
import { TokenBlacklistUtil } from '../utils/token-blacklist.util';
import logger, { logContext } from '../utils/logger.util';

// Extender la interfaz Request para incluir información del usuario
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: 'ANALYST' | 'ADMIN';
      };
    }
  }
}

// Interfaz para respuesta de error de autenticación
interface AuthError {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    requestId: string;
  };
}

// Middleware de autenticación
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requestId = req.headers['x-request-id'] as string;

  try {
    // Extraer token del header Authorization
    const authHeader = req.headers.authorization;
    const token = JWTUtil.extractTokenFromHeader(authHeader);

    if (!token) {
      logger.warn('Token missing', logContext.authError('unknown', 'Token no proporcionado', req.ip));
      const errorResponse: AuthError = {
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Token de acceso requerido',
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Verificar formato del token
    if (!JWTUtil.isValidJWTFormat(token)) {
      logger.warn('Token formato inválido', logContext.authError('unknown', 'Formato de token inválido', req.ip));
      const errorResponse: AuthError = {
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Formato de token inválido',
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Verificar y decodificar token
    const decoded: JWTPayload = JWTUtil.verifyAccessToken(token);

    // Verificar que el token no esté en la blacklist
    const isBlacklisted = await TokenBlacklistUtil.isBlacklisted(token);
    if (isBlacklisted) {
      logger.warn('Token revocado', logContext.authError(decoded.email, 'Token en blacklist', req.ip));
      const errorResponse: AuthError = {
        success: false,
        error: {
          code: 'AUTH_TOKEN_REVOKED',
          message: 'Token invalidado. Inicie sesión nuevamente.',
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Agregar información del usuario al request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    let errorCode = 'AUTH_TOKEN_INVALID';
    let errorMessage = 'Token inválido';

    if (error instanceof Error) {
      if (error.message.includes('expirado')) {
        errorCode = 'AUTH_TOKEN_EXPIRED';
        errorMessage = 'Token expirado';
      } else if (error.message.includes('inválido')) {
        errorCode = 'AUTH_TOKEN_INVALID';
        errorMessage = 'Token inválido';
      }
    }

    logger.warn(`Error de autenticación: ${errorMessage}`, {
      requestId,
      ip: req.ip,
      errorCode,
    });

    const errorResponse: AuthError = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.status(401).json(errorResponse);
  }
};

// Middleware de autorización por rol
export const requireRole = (...allowedRoles: ('ANALYST' | 'ADMIN')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.headers['x-request-id'] as string;

    if (!req.user) {
      const errorResponse: AuthError = {
        success: false,
        error: {
          code: 'AUTH_USER_NOT_FOUND',
          message: 'Información de usuario no encontrada',
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(401).json(errorResponse);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      const errorResponse: AuthError = {
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message: 'Permisos insuficientes para acceder a este recurso',
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(403).json(errorResponse);
      return;
    }

    next();
  };
};

// Middleware para verificar si el usuario está activo (requiere consulta a BD)
export const requireActiveUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requestId = req.headers['x-request-id'] as string;

  if (!req.user) {
    const errorResponse: AuthError = {
      success: false,
      error: {
        code: 'AUTH_USER_NOT_FOUND',
        message: 'Información de usuario no encontrada',
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(401).json(errorResponse);
    return;
  }

  try {
    // Aquí se haría la consulta a la base de datos para verificar si el usuario está activo
    // Por ahora, asumimos que el usuario está activo si tiene un token válido
    // En la implementación real, se consultaría la base de datos:
    // const user = await userRepository.findById(req.user.id);
    // if (!user || !user.isActive) { ... }

    next();
  } catch (error) {
    const errorResponse: AuthError = {
      success: false,
      error: {
        code: 'AUTH_USER_VERIFICATION_FAILED',
        message: 'Error al verificar el estado del usuario',
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
    res.status(500).json(errorResponse);
  }
};

// Middleware opcional de autenticación (no falla si no hay token)
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = JWTUtil.extractTokenFromHeader(authHeader);

    if (token && JWTUtil.isValidJWTFormat(token)) {
      try {
        const decoded: JWTPayload = JWTUtil.verifyAccessToken(token);
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      } catch {
        // Ignorar errores de token en autenticación opcional
      }
    }

    next();
  } catch {
    // Ignorar todos los errores en autenticación opcional
    next();
  }
};

// Middleware para verificar refresh token
export const authenticateRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string;

  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const errorResponse: AuthError = {
        success: false,
        error: {
          code: 'AUTH_REFRESH_TOKEN_MISSING',
          message: 'Refresh token requerido',
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Verificar formato del refresh token
    if (!JWTUtil.isValidJWTFormat(refreshToken)) {
      const errorResponse: AuthError = {
        success: false,
        error: {
          code: 'AUTH_REFRESH_TOKEN_INVALID',
          message: 'Formato de refresh token inválido',
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Verificar refresh token
    const decoded: JWTPayload = JWTUtil.verifyRefreshToken(refreshToken);

    // Agregar información del usuario al request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    let errorCode = 'AUTH_REFRESH_TOKEN_INVALID';
    let errorMessage = 'Refresh token inválido';

    if (error instanceof Error) {
      if (error.message.includes('expirado')) {
        errorCode = 'AUTH_REFRESH_TOKEN_EXPIRED';
        errorMessage = 'Refresh token expirado';
      }
    }

    const errorResponse: AuthError = {
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.status(401).json(errorResponse);
  }
};

// Middleware para logging de actividad de usuario autenticado
export const logUserActivity = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user) {
    logger.info(
      `User activity: ${req.user.email} (${req.user.role}) - ${req.method} ${req.path}`,
      logContext.userActivity(
        req.user.id,
        req.user.email,
        `${req.method} ${req.path}`,
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: req.headers['x-request-id'],
        }
      )
    );
  }

  next();
};

// Función helper para verificar permisos específicos
export const hasPermission = (
  userRole: 'ANALYST' | 'ADMIN',
  requiredPermissions: string[]
): boolean => {
  // Definir permisos por rol
  const rolePermissions = {
    ANALYST: [
      'search:read',
      'records:read',
      'history:read',
      'profile:read',
      'profile:update',
    ],
    ADMIN: [
      'search:read',
      'search:write',
      'records:read',
      'records:write',
      'records:delete',
      'history:read',
      'history:export',
      'users:read',
      'users:write',
      'users:delete',
      'dashboard:read',
      'profile:read',
      'profile:update',
    ],
  };

  const userPermissions = rolePermissions[userRole] || [];
  return requiredPermissions.every(permission =>
    userPermissions.includes(permission)
  );
};

// Middleware para verificar permisos específicos
export const requirePermissions = (...requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = req.headers['x-request-id'] as string;

    if (!req.user) {
      const errorResponse: AuthError = {
        success: false,
        error: {
          code: 'AUTH_USER_NOT_FOUND',
          message: 'Información de usuario no encontrada',
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(401).json(errorResponse);
      return;
    }

    if (!hasPermission(req.user.role, requiredPermissions)) {
      const errorResponse: AuthError = {
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message: `Permisos insuficientes. Se requieren: ${requiredPermissions.join(', ')}`,
          timestamp: new Date().toISOString(),
          requestId,
        },
      };
      res.status(403).json(errorResponse);
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario sea administrador
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Middleware para verificar que el usuario sea analista o administrador
 */
export const requireAnalystOrAdmin = requireRole('ANALYST', 'ADMIN');

/**
 * Middleware para verificar que el usuario pueda acceder a sus propios datos
 */
export const requireOwnershipOrAdmin = (userIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const error: AuthError = {
        success: false,
        error: {
          code: 'AUTH_USER_NOT_FOUND',
          message: 'Usuario no encontrado en la solicitud',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(401).json(error);
      return;
    }

    const targetUserId = req.params[userIdParam];
    const isOwner = req.user.id === targetUserId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      const error: AuthError = {
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_PERMISSIONS',
          message:
            'Solo puedes acceder a tus propios datos o ser administrador',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(403).json(error);
      return;
    }

    next();
  };
};

/**
 * Middleware para verificar que el token no esté próximo a expirar
 */
export const checkTokenExpiry = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Verificar si hay token en el request (extendiendo la interfaz Request)
  const token = (req as any).token;
  if (!token) {
    next();
    return;
  }

  if (JWTUtil.isTokenNearExpiry(token)) {
    res.setHeader('X-Token-Refresh-Needed', 'true');
    res.setHeader(
      'X-Token-Expires-In',
      JWTUtil.getTimeUntilExpiry(token).toString()
    );
  }

  next();
};

/**
 * Middleware para logging de actividad de usuarios autenticados
 */
export const logUserActivity2 = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user) {
    // Aquí se podría implementar logging más sofisticado
    console.log(
      `User activity: ${req.user.email} - ${req.method} ${req.path} - ${new Date().toISOString()}`
    );
  }

  next();
};

/**
 * Middleware para rate limiting por usuario
 */
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const userRequests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next();
      return;
    }

    const userId = req.user.id;
    const now = Date.now();
    const userLimit = userRequests.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (userLimit.count >= maxRequests) {
      const error: AuthError = {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Demasiadas solicitudes. Intente nuevamente más tarde',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      };
      res.status(429).json(error);
      return;
    }

    userLimit.count++;
    next();
  };
};
