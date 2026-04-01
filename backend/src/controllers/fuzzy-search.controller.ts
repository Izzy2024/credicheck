import { Request, Response } from 'express';
import * as fuzzySearchService from '../services/fuzzy-search.service';
import logger from '../utils/logger.util';

/**
 * Realiza una búsqueda fuzzy
 */
export async function fuzzySearch(req: Request, res: Response): Promise<void> {
  try {
    const { q, type, threshold } = req.query;

    if (!q) {
      res.status(400).json({
        error: 'El parámetro "q" (query) es requerido',
      });
      return;
    }

    const searchType = (type as string) || 'both';
    if (!['name', 'id', 'both'].includes(searchType)) {
      res.status(400).json({
        error: 'El parámetro "type" debe ser "name", "id", o "both"',
      });
      return;
    }

    const searchThreshold = threshold
      ? parseFloat(threshold as string)
      : undefined;
    if (
      searchThreshold !== undefined &&
      (searchThreshold < 0 || searchThreshold > 1)
    ) {
      res.status(400).json({
        error: 'El parámetro "threshold" debe estar entre 0 y 1',
      });
      return;
    }

    const results = await fuzzySearchService.fuzzySearch(
      q as string,
      searchType as 'name' | 'id' | 'both',
      searchThreshold
    );

    res.json({
      query: q,
      searchType,
      threshold: searchThreshold,
      resultsCount: results.length,
      results,
    });
  } catch (error) {
    logger.error('Error in fuzzy search', {
      context: 'fuzzy_search_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al realizar la búsqueda fuzzy' });
  }
}

/**
 * Realiza una búsqueda fuzzy por nombre
 */
export async function fuzzySearchByName(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { q, threshold } = req.query;

    if (!q) {
      res.status(400).json({
        error: 'El parámetro "q" (query) es requerido',
      });
      return;
    }

    const searchThreshold = threshold
      ? parseFloat(threshold as string)
      : undefined;
    const results = await fuzzySearchService.fuzzySearchByName(
      q as string,
      searchThreshold
    );

    res.json({
      query: q,
      threshold: searchThreshold,
      resultsCount: results.length,
      results,
    });
  } catch (error) {
    logger.error('Error in fuzzy search by name', {
      context: 'fuzzy_search_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res
      .status(500)
      .json({ error: 'Error al realizar la búsqueda fuzzy por nombre' });
  }
}

/**
 * Realiza una búsqueda fuzzy por ID
 */
export async function fuzzySearchById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { q, threshold } = req.query;

    if (!q) {
      res.status(400).json({
        error: 'El parámetro "q" (query) es requerido',
      });
      return;
    }

    const searchThreshold = threshold
      ? parseFloat(threshold as string)
      : undefined;
    const results = await fuzzySearchService.fuzzySearchById(
      q as string,
      searchThreshold
    );

    res.json({
      query: q,
      threshold: searchThreshold,
      resultsCount: results.length,
      results,
    });
  } catch (error) {
    logger.error('Error in fuzzy search by ID', {
      context: 'fuzzy_search_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res
      .status(500)
      .json({ error: 'Error al realizar la búsqueda fuzzy por ID' });
  }
}
