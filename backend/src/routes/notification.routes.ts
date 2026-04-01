import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/notifications - Obtiene las notificaciones del usuario
router.get('/', notificationController.getNotifications);

// GET /api/notifications/unread-count - Obtiene el conteo de notificaciones no leídas
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /api/notifications/mark-all-read - Marca todas las notificaciones como leídas
router.put('/mark-all-read', notificationController.markAllAsRead);

// PUT /api/notifications/:id/read - Marca una notificación como leída
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/notifications/:id/archive - Archiva una notificación
router.put('/:id/archive', notificationController.archiveNotification);

export default router;
