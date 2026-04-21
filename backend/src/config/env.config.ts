import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config();

// Schema de validación para variables de entorno
const envSchema = z.object({
  // Configuración del servidor
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3001'),
  API_VERSION: z.string().default('v1'),
  LOGS_DIR: z.string().optional().default('logs'),

  // Base de datos
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  DATABASE_SSL: z.string().transform(val => val === 'true').default('false'),

  // Redis (opcional - no utilizado actualmente)
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Encriptación
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY debe tener al menos 32 caracteres'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(val => parseInt(val, 10)).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(val => parseInt(val, 10)).default('1000'),
  AUTH_RATE_LIMIT_MAX: z.string().transform(val => parseInt(val, 10)).default('5'),
  SEARCH_RATE_LIMIT_MAX: z.string().transform(val => parseInt(val, 10)).default('100'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  CORS_CREDENTIALS: z.string().transform(val => val === 'true').default('true'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),

  // Monitoreo
  HEALTH_CHECK_INTERVAL: z.string().transform(val => parseInt(val, 10)).default('30000'),

  // Email (opcional por ahora)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(val => parseInt(val, 10)).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
});

// Validar y exportar configuración
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.errors.map(err => 
      `${err.path.join('.')}: ${err.message}`
    ).join('\n');
    
    throw new Error(`Error en configuración de entorno:\n${errorMessages}`);
  }
  throw error;
}

export const config = {
  // Servidor
  server: {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    apiVersion: env.API_VERSION,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    logsDir: path.resolve(process.cwd(), env.LOGS_DIR),
  },

  // Base de datos
  database: {
    url: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
  },

  // Redis
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
  },

  // JWT
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // Encriptación
  encryption: {
    key: env.ENCRYPTION_KEY,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    authMaxRequests: env.AUTH_RATE_LIMIT_MAX,
    searchMaxRequests: env.SEARCH_RATE_LIMIT_MAX,
  },

  // CORS
  cors: {
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  },

  // Logging
  logging: {
    level: env.LOG_LEVEL,
    file: env.LOG_FILE,
  },

  // Monitoreo
  monitoring: {
    healthCheckInterval: env.HEALTH_CHECK_INTERVAL,
  },

  // Email
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.FROM_EMAIL,
  },
} as const;

export type Config = typeof config;