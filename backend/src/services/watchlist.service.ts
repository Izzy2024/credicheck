import { prisma } from '../config/database.config';
import logger from '../utils/logger.util';

export type WatchType = 'NAME' | 'ID_NUMBER' | 'PHONE' | 'EMAIL';

interface CreateWatchlistItemInput {
  userId: string;
  watchType: WatchType;
  watchValue: string;
  notes?: string;
}

/**
 * Agrega un item a la watchlist del usuario
 */
export async function addToWatchlist(input: CreateWatchlistItemInput) {
  try {
    // Verifica si ya existe
    const existing = await prisma.watchlistItem.findFirst({
      where: {
        userId: input.userId,
        watchType: input.watchType,
        watchValue: input.watchValue,
        isActive: true,
      },
    });

    if (existing) {
      return { item: existing, isNew: false };
    }

    const item = await prisma.watchlistItem.create({
      data: {
        userId: input.userId,
        watchType: input.watchType,
        watchValue: input.watchValue,
        notes: input.notes || null,
        isActive: true,
      },
    });

    logger.info('Watchlist item added', {
      context: 'watchlist_service',
      itemId: item.id,
      userId: input.userId,
      watchType: input.watchType,
    });

    return { item, isNew: true };
  } catch (error) {
    logger.error('Error adding to watchlist', {
      context: 'watchlist_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });
    throw error;
  }
}

/**
 * Obtiene la watchlist de un usuario
 */
export async function getUserWatchlist(
  userId: string,
  options?: {
    isActive?: boolean;
    watchType?: WatchType;
  }
) {
  const where: any = { userId };
  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }
  if (options?.watchType) {
    where.watchType = options.watchType;
  }

  const items = await prisma.watchlistItem.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return items;
}

/**
 * Elimina (desactiva) un item de la watchlist
 */
export async function removeFromWatchlist(itemId: string, userId: string) {
  try {
    const item = await prisma.watchlistItem.updateMany({
      where: {
        id: itemId,
        userId, // Asegura que el usuario solo pueda eliminar sus propios items
      },
      data: {
        isActive: false,
      },
    });

    logger.info('Watchlist item removed', {
      context: 'watchlist_service',
      itemId,
      userId,
    });

    return item;
  } catch (error) {
    logger.error('Error removing from watchlist', {
      context: 'watchlist_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      itemId,
      userId,
    });
    throw error;
  }
}

/**
 * Actualiza un item de la watchlist
 */
export async function updateWatchlistItem(
  itemId: string,
  userId: string,
  updates: {
    notes?: string;
    isActive?: boolean;
  }
) {
  try {
    const item = await prisma.watchlistItem.updateMany({
      where: {
        id: itemId,
        userId,
      },
      data: updates,
    });

    logger.info('Watchlist item updated', {
      context: 'watchlist_service',
      itemId,
      userId,
      updates,
    });

    return item;
  } catch (error) {
    logger.error('Error updating watchlist item', {
      context: 'watchlist_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      itemId,
      userId,
    });
    throw error;
  }
}

/**
 * Obtiene estadísticas de la watchlist del usuario
 */
export async function getWatchlistStats(userId: string) {
  const total = await prisma.watchlistItem.count({
    where: { userId, isActive: true },
  });

  const byType = await prisma.watchlistItem.groupBy({
    by: ['watchType'],
    where: { userId, isActive: true },
    _count: true,
  });

  return {
    total,
    byType: byType.map(item => ({
      type: item.watchType,
      count: item._count,
    })),
  };
}
