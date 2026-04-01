import { Request, Response } from 'express';
import * as riskScoreService from '../services/risk-score.service';
import logger from '../utils/logger.util';

/**
 * Calcula el score de riesgo para una persona
 */
export async function calculateRiskScore(
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

    const result = await riskScoreService.calculateRiskScore(
      searchType as 'idNumber' | 'name',
      searchValue as string
    );

    if (!result) {
      res.status(404).json({
        error: 'No se encontraron registros para calcular el score',
      });
      return;
    }

    res.json(result);
  } catch (error) {
    logger.error('Error calculating risk score', {
      context: 'risk_score_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al calcular el score de riesgo' });
  }
}

/**
 * Obtiene estadísticas de riesgo crediticio
 */
export async function getRiskStatistics(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const stats = await riskScoreService.getRiskStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Error getting risk statistics', {
      context: 'risk_score_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al obtener estadísticas de riesgo' });
  }
}
