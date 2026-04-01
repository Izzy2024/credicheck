import { Router } from 'express';
import * as fuzzySearchController from '../controllers/fuzzy-search.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/fuzzy-search?q=TERM&type=both&threshold=0.7 - Búsqueda fuzzy combinada
router.get('/', fuzzySearchController.fuzzySearch);

// GET /api/fuzzy-search/name?q=TERM&threshold=0.7 - Búsqueda fuzzy por nombre
router.get('/name', fuzzySearchController.fuzzySearchByName);

// GET /api/fuzzy-search/id?q=TERM&threshold=0.8 - Búsqueda fuzzy por ID
router.get('/id', fuzzySearchController.fuzzySearchById);

export default router;
