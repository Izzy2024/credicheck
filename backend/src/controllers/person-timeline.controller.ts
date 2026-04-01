import { Request, Response } from 'express';
import * as personTimelineService from '../services/person-timeline.service';
import logger from '../utils/logger.util';

/**
 * Obtiene el timeline completo de una persona
 */
export async function getPersonTimeline(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { searchType, searchValue } = req.query;

    if (!searchType || !searchValue) {
      res.status(400).json({
        error: 'searchType y searchValue son requeridos',
        details: 'searchType debe ser "idNumber" o "name"',
      });
      return;
    }

    if (searchType !== 'idNumber' && searchType !== 'name') {
      res.status(400).json({
        error: 'searchType inválido',
        details: 'searchType debe ser "idNumber" o "name"',
      });
      return;
    }

    const result = await personTimelineService.getPersonTimeline(
      searchType as 'idNumber' | 'name',
      searchValue as string
    );

    if (!result) {
      res.status(404).json({
        error: 'No se encontraron registros para esta persona',
      });
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error getting person timeline', {
      context: 'person_timeline_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res
      .status(500)
      .json({ error: 'Error al obtener el timeline de la persona' });
  }
}

/**
 * Obtiene estadísticas de timelines
 */
export async function getTimelineStatistics(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const stats = await personTimelineService.getTimelineStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting timeline statistics', {
      context: 'person_timeline_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res
      .status(500)
      .json({ error: 'Error al obtener estadísticas de timeline' });
  }
}
