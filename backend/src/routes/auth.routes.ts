import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import {
  authenticateToken,
  requireActiveUser,
  checkTokenExpiry,
  logUserActivity
} from '../middleware/auth.middleware';
import {
  authRateLimit,
  passwordResetRateLimit,
  authenticatedRateLimit,
} from '../middleware/rate-limit.middleware';
import logger from '../utils/logger.util';

const router = Router();

// Middleware para logging de requests con Winston
router.use((req, _res, next) => {
  logger.debug(`Auth Route: ${req.method} ${req.path} - ${new Date().toISOString()}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    requestId: req.headers['x-request-id'],
  });
  next();
});

// Rutas públicas (no requieren autenticación)

/**
 * POST /api/auth/login
 * Autentica un usuario con email y contraseña
 */
router.post('/login', authRateLimit, AuthController.login);

/**
 * POST /api/auth/signup
 * Crea un nuevo usuario
 */
router.post('/signup', authRateLimit, AuthController.signup);

/**
 * POST /api/auth/refresh
 * Refresca un access token usando un refresh token válido
 */
router.post('/refresh', AuthController.refresh);

/**
 * POST /api/auth/validate-token
 * Valida un token de acceso
 */
router.post('/validate-token', AuthController.validateToken);

/**
 * POST /api/auth/forgot-password
 * Genera un token para reset de contraseña
 */
router.post('/forgot-password', passwordResetRateLimit, AuthController.forgotPassword);

/**
 * POST /api/auth/reset-password
 * Restablece la contraseña usando un token temporal
 */
router.post('/reset-password', AuthController.resetPassword);

/**
 * GET /api/auth/password-strength
 * Evalúa la fortaleza de una contraseña
 */
router.get('/password-strength', AuthController.checkPasswordStrength);

// Middleware de autenticación para rutas protegidas
router.use(authenticateToken);
router.use(requireActiveUser);
router.use(checkTokenExpiry);
router.use(logUserActivity);

// Rate limiting para usuarios autenticados (200 requests por minuto)
router.use(authenticatedRateLimit);

// Rutas protegidas (requieren autenticación)

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario
 */
router.post('/logout', AuthController.logout);

/**
 * GET /api/auth/profile
 * Obtiene el perfil del usuario autenticado
 */
router.get('/profile', AuthController.getProfile);

/**
 * PUT /api/auth/profile
 * Actualiza el perfil del usuario autenticado
 */
router.put('/profile', AuthController.updateProfile);

/**
 * POST /api/auth/change-password
 * Cambia la contraseña del usuario autenticado
 */
router.post('/change-password', AuthController.changePassword);

/**
 * GET /api/auth/login-stats
 * Obtiene estadísticas de login del usuario autenticado
 */
router.get('/login-stats', AuthController.getLoginStats);

export default router;