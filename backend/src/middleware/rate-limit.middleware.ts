import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.config';

// Configuración de rate limiting para endpoints públicos
export const publicRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 requests por ventana
  standardHeaders: true, // Devolver información de límite en headers
  legacyHeaders: false, // Deshabilitar headers X-RateLimit-*
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes. Por favor, inténtelo de nuevo más tarde.',
    },
  },
  keyGenerator: (req: Request) => {
    // Usar IP como clave, o un identificador de sesión si existe
    return req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  },
  skip: (req: Request) => {
    // Saltar rate limiting para health checks
    if (req.path === '/health' || req.path.startsWith('/api/v1/info')) {
      return true;
    }
    return false;
  },
});

// Rate limiting estricto para autenticación (prevenir brute force)
export const authRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos de login por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de autenticación. Por favor, inténtelo de nuevo en 15 minutos.',
    },
  },
  keyGenerator: (req: Request) => {
    // Usar email + IP para prevenir ataques distribuidos
    const email = req.body?.email || 'unknown';
    const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    return `${email}_${ip}`;
  },
  skipSuccessfulRequests: false, // Contar también requests exitosos
});

// Rate limiting para password reset (muy restrictivo)
export const passwordResetRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Solo 3 resets por hora
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes de restablecimiento. Por favor, inténtelo de nuevo en una hora.',
    },
  },
  keyGenerator: (req: Request) => {
    const email = req.body?.email || 'unknown';
    const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    return `${email}_${ip}`;
  },
});

// Rate limiting para búsqueda de referencias (prevenir scraping)
export const searchRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // 30 búsquedas por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas búsquedas. Por favor, espere unos minutos.',
    },
  },
  keyGenerator: (req: Request) => {
    // Usar ID de usuario autenticado o IP
    return req.user?.id || req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  },
});

// Rate limiting para exportación de datos (costoso en recursos)
export const exportRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 exportaciones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'EXPORT_RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas exportaciones. Por favor, espere unos minutos.',
    },
  },
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  },
});

// Rate limiting para usuarios autenticados (más permisivo)
export const authenticatedRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests por ventana para usuarios autenticados
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes. Por favor, inténtelo de nuevo más tarde.',
    },
  },
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  },
});

// Rate limiting para creación de registros
export const createRecordRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // 20 creaciones por ventana
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'CREATE_RECORD_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados registros creados. Por favor, espere unos minutos.',
    },
  },
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  },
});

// Store en memoria para rate limiting (para usar en middleware personalizado)
export const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Middleware personalizado de rate limiting con store compartido
 */
export const customRateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const userLimit = rateLimitStore.get(key);

    if (!userLimit || now > userLimit.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (userLimit.count >= maxRequests) {
      const resetInSeconds = Math.ceil((userLimit.resetTime - now) / 1000);
      res.setHeader('Retry-After', resetInSeconds.toString());
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
          retryAfter: resetInSeconds,
        },
      });
      return;
    }

    userLimit.count++;
    next();
  };
};

/**
 * Limpieza periódica del store de rate limiting
 */
export const cleanupRateLimitStore = () => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
};

// Limpiar el store cada 5 minutos
if (config.server.nodeEnv !== 'test') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
