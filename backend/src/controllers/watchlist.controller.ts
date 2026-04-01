import { Request, Response } from 'express';
import * as watchlistService from '../services/watchlist.service';
import logger from '../utils/logger.util';
import { z } from 'zod';

const addToWatchlistSchema = z.object({
  watchType: z.enum(['NAME', 'ID_NUMBER', 'PHONE', 'EMAIL']),
  watchValue: z.string().min(1),
  notes: z.string().optional(),
});

const updateWatchlistItemSchema = z.object({
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Agrega un item a la watchlist del usuario
 */
export async function addToWatchlist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const validation = addToWatchlistSchema.safeParse(req.body);
    if (!validation.success) {
      res
        .status(400)
        .json({ error: 'Datos inválidos', details: validation.error.errors });
      return;
    }

    const result = await watchlistService.addToWatchlist({
      userId,
      watchType: validation.data.watchType,
      watchValue: validation.data.watchValue,
      ...(validation.data.notes && { notes: validation.data.notes }),
    });

    res.status(result.isNew ? 201 : 200).json(result);
  } catch (error) {
    logger.error('Error adding to watchlist', {
      context: 'watchlist_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al agregar a la watchlist' });
  }
}

/**
 * Obtiene la watchlist del usuario
 */
export async function getWatchlist(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const isActive = req.query['isActive'] === 'false' ? false : true;
    const watchType = req.query['watchType'] as
      | watchlistService.WatchType
      | undefined;

    const items = await watchlistService.getUserWatchlist(userId, {
      isActive,
      ...(watchType && { watchType }),
    });

    res.json({ items });
  } catch (error) {
    logger.error('Error getting watchlist', {
      context: 'watchlist_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al obtener la watchlist' });
  }
}

/**
 * Elimina un item de la watchlist
 */
export async function removeFromWatchlist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID de item requerido' });
      return;
    }

    await watchlistService.removeFromWatchlist(id, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error removing from watchlist', {
      context: 'watchlist_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al eliminar de la watchlist' });
  }
}

/**
 * Actualiza un item de la watchlist
 */
export async function updateWatchlistItem(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'ID de item requerido' });
      return;
    }

    const validation = updateWatchlistItemSchema.safeParse(req.body);
    if (!validation.success) {
      res
        .status(400)
        .json({ error: 'Datos inválidos', details: validation.error.errors });
      return;
    }

    const updates: { notes?: string; isActive?: boolean } = {};
    if (validation.data.notes !== undefined) {
      updates.notes = validation.data.notes;
    }
    if (validation.data.isActive !== undefined) {
      updates.isActive = validation.data.isActive;
    }

    await watchlistService.updateWatchlistItem(id, userId, updates);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating watchlist item', {
      context: 'watchlist_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res
      .status(500)
      .json({ error: 'Error al actualizar el item de la watchlist' });
  }
}

/**
 * Obtiene estadísticas de la watchlist
 */
export async function getWatchlistStats(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Usuario no autenticado' });
      return;
    }

    const stats = await watchlistService.getWatchlistStats(userId);
    res.json(stats);
  } catch (error) {
    logger.error('Error getting watchlist stats', {
      context: 'watchlist_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res
      .status(500)
      .json({ error: 'Error al obtener estadísticas de la watchlist' });
  }
}
