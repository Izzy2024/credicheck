import { Router } from 'express';
import * as riskScoreController from '../controllers/risk-score.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/risk-score/calculate?searchType=idNumber&searchValue=123456 - Calcula el score de riesgo
router.get('/calculate', riskScoreController.calculateRiskScore);

// GET /api/risk-score/statistics - Obtiene estadísticas de riesgo
router.get('/statistics', riskScoreController.getRiskStatistics);

export default router;
