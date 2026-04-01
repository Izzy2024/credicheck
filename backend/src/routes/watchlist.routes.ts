import { Router } from 'express';
import * as watchlistController from '../controllers/watchlist.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/watchlist - Obtiene la watchlist del usuario
router.get('/', watchlistController.getWatchlist);

// GET /api/watchlist/stats - Obtiene estadísticas de la watchlist
router.get('/stats', watchlistController.getWatchlistStats);

// POST /api/watchlist - Agrega un item a la watchlist
router.post('/', watchlistController.addToWatchlist);

// PUT /api/watchlist/:id - Actualiza un item de la watchlist
router.put('/:id', watchlistController.updateWatchlistItem);

// DELETE /api/watchlist/:id - Elimina un item de la watchlist
router.delete('/:id', watchlistController.removeFromWatchlist);

export default router;
