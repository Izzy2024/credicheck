import { prisma } from '../config/database.config';
import logger from '../utils/logger.util';

export type NotificationType =
  | 'NEW_RECORD_MATCH'
  | 'SEARCH_MATCH'
  | 'STATUS_CHANGE'
  | 'DISPUTE_UPDATE';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedRecordId?: string;
  relatedSearchId?: string;
  metadata?: Record<string, any>;
}

/**
 * Crea una notificación para un usuario
 */
export async function createNotification(input: CreateNotificationInput) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        relatedRecordId: input.relatedRecordId || null,
        relatedSearchId: input.relatedSearchId || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        status: 'UNREAD',
      },
    });

    logger.info('Notification created', {
      context: 'notification_service',
      notificationId: notification.id,
      userId: input.userId,
      type: input.type,
    });

    return notification;
  } catch (error) {
    logger.error('Error creating notification', {
      context: 'notification_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });
    throw error;
  }
}

/**
 * Obtiene las notificaciones de un usuario
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    status?: NotificationStatus;
    limit?: number;
    offset?: number;
  }
) {
  const where: any = { userId };
  if (options?.status) {
    where.status = options.status;
  }

  const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
  });

  const total = await prisma.notification.count({ where });

  return { notifications, total };
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  const notification = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // Asegura que el usuario solo pueda marcar sus propias notificaciones
    },
    data: {
      status: 'READ',
      readAt: new Date(),
    },
  });

  return notification;
}

/**
 * Marca todas las notificaciones de un usuario como leídas
 */
export async function markAllNotificationsAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      status: 'UNREAD',
    },
    data: {
      status: 'READ',
      readAt: new Date(),
    },
  });

  logger.info('Marked all notifications as read', {
    context: 'notification_service',
    userId,
    count: result.count,
  });

  return result;
}

/**
 * Archiva una notificación
 */
export async function archiveNotification(
  notificationId: string,
  userId: string
) {
  const notification = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      status: 'ARCHIVED',
    },
  });

  return notification;
}

/**
 * Obtiene el conteo de notificaciones no leídas
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return await prisma.notification.count({
    where: {
      userId,
      status: 'UNREAD',
    },
  });
}

/**
 * Verifica si hay coincidencias en la watchlist y crea notificaciones
 */
export async function checkWatchlistMatches(
  searchType: string,
  searchValue: string,
  relatedRecordId?: string,
  relatedSearchId?: string
) {
  try {
    // Busca items de watchlist activos que coincidan
    const watchlistMatches = await prisma.watchlistItem.findMany({
      where: {
        isActive: true,
        watchType: searchType.toUpperCase(),
        watchValue: {
          contains: searchValue,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Crea notificaciones para cada coincidencia
    for (const match of watchlistMatches) {
      await createNotification({
        userId: match.userId,
        type: relatedRecordId ? 'NEW_RECORD_MATCH' : 'SEARCH_MATCH',
        title: relatedRecordId
          ? 'Nueva referencia coincide con tu watchlist'
          : 'Búsqueda coincide con tu watchlist',
        message: `Se ha ${relatedRecordId ? 'registrado una nueva referencia' : 'realizado una búsqueda'} para: ${searchValue}`,
        ...(relatedRecordId && { relatedRecordId }),
        ...(relatedSearchId && { relatedSearchId }),
        metadata: {
          watchlistItemId: match.id,
          watchType: match.watchType,
          watchValue: match.watchValue,
          searchValue,
        },
      });
    }

    logger.info('Watchlist matches checked', {
      context: 'notification_service',
      searchType,
      searchValue,
      matchesFound: watchlistMatches.length,
    });

    return watchlistMatches.length;
  } catch (error) {
    logger.error('Error checking watchlist matches', {
      context: 'notification_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      searchType,
      searchValue,
    });
    return 0;
  }
}
