import { Router } from 'express';
import * as aggregateReportsController from '../controllers/aggregate-reports.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/reports - Obtiene todos los reportes agregados
router.get('/', aggregateReportsController.getAggregatedReports);

// GET /api/reports/top-debtors?limit=10 - Obtiene el top de deudores
router.get('/top-debtors', aggregateReportsController.getTopDebtors);

// GET /api/reports/by-city - Obtiene deudas por ciudad
router.get('/by-city', aggregateReportsController.getDebtsByCity);

// GET /api/reports/by-creditor - Obtiene deudas por acreedor
router.get('/by-creditor', aggregateReportsController.getDebtsByCreditor);

// GET /api/reports/by-status - Obtiene deudas por estado
router.get('/by-status', aggregateReportsController.getDebtsByStatus);

export default router;
