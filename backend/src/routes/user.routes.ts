import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  requireAdmin,
  logAdminAction
} from '../middleware/admin.middleware';
import logger from '../utils/logger.util';

const router = Router();

// Middleware para logging de requests con Winston
router.use((req, _res, next) => {
  logger.debug(`User Route: ${req.method} ${req.path} - ${new Date().toISOString()}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    requestId: req.headers['x-request-id'],
  });
  next();
});

// Todas las rutas de usuarios requieren autenticación
router.use(authenticateToken);

// Rutas para gestión de usuarios (solo administradores)

/**
 * GET /api/v1/users
 * Obtener lista de usuarios con filtros y paginación
 */
router.get('/', requireAdmin, UserController.getUsers);

/**
 * GET /api/v1/users/stats
 * Obtener estadísticas de usuarios
 */
router.get('/stats', requireAdmin, UserController.getUserStats);

/**
 * GET /api/v1/users/:id
 * Obtener un usuario específico por ID
 */
router.get('/:id', requireAdmin, UserController.getUserById);

/**
 * POST /api/v1/users
 * Crear un nuevo usuario
 */
router.post('/', requireAdmin, logAdminAction('CREATE_USER'), UserController.createUser);

/**
 * PUT /api/v1/users/:id
 * Actualizar un usuario existente
 */
router.put('/:id', requireAdmin, logAdminAction('UPDATE_USER'), UserController.updateUser);

/**
 * POST /api/v1/users/:id/toggle-status
 * Activar/desactivar un usuario
 */
router.post('/:id/toggle-status', requireAdmin, logAdminAction('TOGGLE_USER_STATUS'), UserController.toggleUserStatus);

/**
 * DELETE /api/v1/users/:id
 * Eliminar un usuario (soft delete)
 */
router.delete('/:id', requireAdmin, logAdminAction('DELETE_USER'), UserController.deleteUser);

export default router;