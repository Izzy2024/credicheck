import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';
import logger from '../utils/logger.util';

/**
 * Obtiene las notificaciones del usuario autenticado
 */
export async function getNotifications(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const status = req.query['status'] as
      | notificationService.NotificationStatus
      | undefined;
    const limit = req.query['limit']
      ? parseInt(req.query['limit'] as string)
      : 50;
    const offset = req.query['offset']
      ? parseInt(req.query['offset'] as string)
      : 0;

    const result = await notificationService.getUserNotifications(userId, {
      ...(status && { status }),
      limit,
      offset,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error getting notifications', {
      context: 'notification_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al obtener las notificaciones' });
  }
}

/**
 * Obtiene el conteo de notificaciones no leídas
 */
export async function getUnreadCount(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    logger.error('Error getting unread count', {
      context: 'notification_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res
      .status(500)
      .json({ error: 'Error al obtener el conteo de notificaciones' });
  }
}

/**
 * Marca una notificación como leída
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID de notificación requerido' });
      return;
    }

    await notificationService.markNotificationAsRead(id, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking notification as read', {
      context: 'notification_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res
      .status(500)
      .json({ error: 'Error al marcar la notificación como leída' });
  }
}

/**
 * Marca todas las notificaciones como leídas
 */
export async function markAllAsRead(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const result = await notificationService.markAllNotificationsAsRead(userId);
    res.json({ count: result.count });
  } catch (error) {
    logger.error('Error marking all notifications as read', {
      context: 'notification_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res
      .status(500)
      .json({ error: 'Error al marcar todas las notificaciones como leídas' });
  }
}

/**
 * Archiva una notificación
 */
export async function archiveNotification(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID de notificación requerido' });
      return;
    }

    await notificationService.archiveNotification(id, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error archiving notification', {
      context: 'notification_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al archivar la notificación' });
  }
}
