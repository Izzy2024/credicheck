import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.config';
import { checkDatabaseConnection } from './config/database.config';
import authRoutes from './routes/auth.routes';
import creditReferenceRoutes from './routes/credit-reference.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/user.routes';
import auditRoutes from './routes/audit.routes';
import settingsRoutes from './routes/settings.routes';
import notificationRoutes from './routes/notification.routes';
import watchlistRoutes from './routes/watchlist.routes';
import riskScoreRoutes from './routes/risk-score.routes';
import fuzzySearchRoutes from './routes/fuzzy-search.routes';
import personTimelineRoutes from './routes/person-timeline.routes';
import bulkUploadRoutes from './routes/bulk-upload.routes';
import aggregateReportsRoutes from './routes/aggregate-reports.routes';
import verificationRoutes from './routes/verification.routes';
import logger, { httpLogger, morganStream } from './utils/logger.util';
import { publicRateLimit } from './middleware/rate-limit.middleware';

// Crear aplicación Express
const app: Application = express();

// Middleware de logging HTTP (Morgan + Winston)
if (config.server.isDevelopment) {
  app.use(morgan('dev', { stream: morganStream }));
} else {
  app.use(morgan('combined', { stream: morganStream }));
}

// Middleware para logging estructurado
app.use(httpLogger);

// Rate limiting global para endpoints públicos
app.use('/api', publicRateLimit);

// Middleware de seguridad con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", config.cors.origin],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        ...(config.server.isProduction && {
          upgradeInsecureRequests: [],
          blockAllMixedContent: [],
        }),
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    dnsPrefetchControl: {
      allow: false,
    },
    ieNoOpen: true,
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
  })
);

// Headers de seguridad adicionales personalizados
app.use((_req: Request, res: Response, next: NextFunction) => {
  // Prevenir MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevenir clickjacking (refuerzo adicional)
  res.setHeader('X-Frame-Options', 'DENY');

  // Activar XSS filter en navegadores antiguos
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Controlar información del servidor
  res.removeHeader('X-Powered-By');

  // Política de referer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
});

// CORS
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  })
);

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para agregar Request ID
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId =
    (req.headers['x-request-id'] as string) ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection();

  const healthCheck = {
    uptime: process.uptime(),
    message: 'CrediCheck API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    version: config.server.apiVersion,
    requestId: req.headers['x-request-id'],
    database: {
      status: dbStatus ? 'connected' : 'disconnected',
      type: 'PostgreSQL',
    },
  };

  const statusCode = dbStatus ? 200 : 503;

  res.status(statusCode).json({
    success: dbStatus,
    data: healthCheck,
  });
});

// Rutas de la API
app.use(`/api/${config.server.apiVersion}/auth`, authRoutes);
app.use(`/api/${config.server.apiVersion}/records`, creditReferenceRoutes);
app.use(`/api/${config.server.apiVersion}/dashboard`, dashboardRoutes);
app.use(`/api/${config.server.apiVersion}/users`, userRoutes);
app.use(`/api/${config.server.apiVersion}/audit`, auditRoutes);
app.use(`/api/${config.server.apiVersion}/settings`, settingsRoutes);
app.use(`/api/${config.server.apiVersion}/notifications`, notificationRoutes);
app.use(`/api/${config.server.apiVersion}/watchlist`, watchlistRoutes);
app.use(`/api/${config.server.apiVersion}/risk-score`, riskScoreRoutes);
app.use(`/api/${config.server.apiVersion}/fuzzy-search`, fuzzySearchRoutes);
app.use(
  `/api/${config.server.apiVersion}/person-timeline`,
  personTimelineRoutes
);
app.use(`/api/${config.server.apiVersion}/bulk-upload`, bulkUploadRoutes);
app.use(`/api/${config.server.apiVersion}/reports`, aggregateReportsRoutes);
app.use(`/api/${config.server.apiVersion}/verifications`, verificationRoutes);

// API Info endpoint
app.get(
  `/api/${config.server.apiVersion}/info`,
  (_req: Request, res: Response) => {
    const apiInfo = {
      name: 'CrediCheck API',
      description: 'API para consulta de referencias crediticias negativas',
      version: config.server.apiVersion,
      environment: config.server.nodeEnv,
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        auth: `/api/${config.server.apiVersion}/auth`,
        search: `/api/${config.server.apiVersion}/search`,
        records: `/api/${config.server.apiVersion}/records`,
        history: `/api/${config.server.apiVersion}/history`,
        dashboard: `/api/${config.server.apiVersion}/dashboard`,
      },
    };

    res.status(200).json({
      success: true,
      data: apiInfo,
    });
  }
);

// Middleware para rutas no encontradas
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Ruta no encontrada',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'],
    },
  });
});

// Middleware global de manejo de errores
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string;

  // Log del error con Winston
  logger.error('Error en API:', {
    error: error.message,
    stack: error.stack,
    requestId,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.server.isDevelopment
        ? error.message
        : 'Error interno del servidor',
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
});

export default app;
