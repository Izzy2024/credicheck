import { Router } from 'express';
import * as personTimelineController from '../controllers/person-timeline.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/person-timeline?searchType=idNumber&searchValue=123456 - Obtiene el timeline de una persona
router.get('/', personTimelineController.getPersonTimeline);

// GET /api/person-timeline/statistics - Obtiene estadísticas de timelines
router.get('/statistics', personTimelineController.getTimelineStatistics);

export default router;
