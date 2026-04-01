import winston from 'winston';
import path from 'path';
import { config } from '../config/env.config';

// Definir niveles de log personalizados
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

// Registrar niveles personalizados
winston.addColors(logLevels.colors);

// Formato de logs para desarrollo (coloreado y legible)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Formato de logs para producción (JSON estructurado)
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'ISO8601' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Formato para archivos de log
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Crear instancia del logger
const logger = winston.createLogger({
  level: config.server.isDevelopment ? 'debug' : 'info',
  levels: logLevels.levels,
  defaultMeta: {
    service: 'credicheck-api',
    environment: config.server.nodeEnv,
    version: config.server.apiVersion,
  },
  transports: [
    // Transporte para errores (siempre se guardan)
    new winston.transports.File({
      filename: path.join(config.server.logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Transporte para logs combinados
    new winston.transports.File({
      filename: path.join(config.server.logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// En desarrollo, agregar transporte a consola
if (config.server.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
}

// En producción, agregar transporte JSON a consola (para stdout/stderr)
if (!config.server.isDevelopment) {
  logger.add(
    new winston.transports.Console({
      format: productionFormat,
    })
  );
}

// Crear stream para Morgan (HTTP request logging)
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Funciones helper para logging estructurado
export const logContext = {
  /**
   * Log de actividad de usuario
   */
  userActivity: (userId: string, email: string, action: string, details?: any) => {
    return {
      userId,
      email,
      action,
      category: 'user_activity',
      ...details,
    };
  },

  /**
   * Log de acción de administrador
   */
  adminAction: (adminId: string, adminEmail: string, action: string, targetEntity?: string, targetId?: string) => {
    return {
      adminId,
      adminEmail,
      action,
      targetEntity,
      targetId,
      category: 'admin_action',
    };
  },

  /**
   * Log de error de base de datos
   */
  databaseError: (operation: string, error: Error, query?: string) => {
    return {
      operation,
      error: error.message,
      stack: error.stack,
      query,
      category: 'database_error',
    };
  },

  /**
   * Log de error de autenticación
   */
  authError: (email: string, reason: string, ip?: string) => {
    return {
      email,
      reason,
      ip,
      category: 'auth_error',
    };
  },

  /**
   * Log de auditoría
   */
  audit: (userId: string, action: string, entity: string, entityId: string, changes?: any) => {
    return {
      userId,
      action,
      entity,
      entityId,
      changes,
      category: 'audit',
    };
  },

  /**
   * Log de seguridad
   */
  security: (eventType: string, details: any) => {
    return {
      eventType,
      ...details,
      category: 'security',
    };
  },

  /**
   * Log de rendimiento
   */
  performance: (operation: string, durationMs: number, details?: any) => {
    return {
      operation,
      durationMs,
      ...details,
      category: 'performance',
    };
  },
};

// Middleware para logging de requests HTTP
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const context = logContext.performance(req.path, duration, {
      method: req.method,
      statusCode: res.statusCode,
      ip: req.ip,
      userId: req.user?.id,
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'],
    });

    if (res.statusCode >= 500) {
      logger.error(`HTTP ${res.statusCode} - ${req.method} ${req.path}`, context);
    } else if (res.statusCode >= 400) {
      logger.warn(`HTTP ${res.statusCode} - ${req.method} ${req.path}`, context);
    } else {
      logger.http(`HTTP ${res.statusCode} - ${req.method} ${req.path}`, context);
    }
  });

  next();
};

// Exportar el logger
export default logger;

// Exportar tipos
export type Logger = winston.Logger;
