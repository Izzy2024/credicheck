import { Request, Response } from 'express';
import * as aggregateReportsService from '../services/aggregate-reports.service';
import logger from '../utils/logger.util';

/**
 * Obtiene todos los reportes agregados
 */
export async function getAggregatedReports(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const reports = await aggregateReportsService.getAggregatedReports();
    res.json(reports);
  } catch (error) {
    logger.error('Error getting aggregated reports', {
      context: 'aggregate_reports_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al obtener los reportes agregados' });
  }
}

/**
 * Obtiene el top de deudores
 */
export async function getTopDebtors(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const limit = req.query['limit']
      ? parseInt(req.query['limit'] as string)
      : 10;
    const topDebtors = await aggregateReportsService.getTopDebtors(limit);
    res.json(topDebtors);
  } catch (error) {
    logger.error('Error getting top debtors', {
      context: 'aggregate_reports_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al obtener el top de deudores' });
  }
}

/**
 * Obtiene deudas por ciudad
 */
export async function getDebtsByCity(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const debtsByCity = await aggregateReportsService.getDebtsByCity();
    res.json(debtsByCity);
  } catch (error) {
    logger.error('Error getting debts by city', {
      context: 'aggregate_reports_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al obtener deudas por ciudad' });
  }
}

/**
 * Obtiene deudas por acreedor
 */
export async function getDebtsByCreditor(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const debtsByCreditor = await aggregateReportsService.getDebtsByCreditor();
    res.json(debtsByCreditor);
  } catch (error) {
    logger.error('Error getting debts by creditor', {
      context: 'aggregate_reports_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al obtener deudas por acreedor' });
  }
}

/**
 * Obtiene deudas por estado
 */
export async function getDebtsByStatus(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const debtsByStatus = await aggregateReportsService.getDebtsByStatus();
    res.json(debtsByStatus);
  } catch (error) {
    logger.error('Error getting debts by status', {
      context: 'aggregate_reports_controller',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    res.status(500).json({ error: 'Error al obtener deudas por estado' });
  }
}
