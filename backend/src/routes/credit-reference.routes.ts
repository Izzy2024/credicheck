import { Router } from 'express';
import { CreditReferenceController } from '../controllers/credit-reference.controller';
import { ExportController } from '../controllers/export.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  requireAdmin,
  logAdminAction,
  validateBulkOperation,
  validateStatusTransition,
  validateRecordIds,
} from '../middleware/admin.middleware';

const router = Router();

// Middleware para logging de requests
router.use((req, _res, next) => {
  console.log(
    `Credit Reference Route: ${req.method} ${req.path} - ${new Date().toISOString()}`
  );
  next();
});

// Rutas para referencias crediticias

/**
 * POST /api/v1/records
 * Crear una nueva referencia crediticia
 */
router.post('/', authenticateToken, CreditReferenceController.createReference);

/**
 * GET /api/v1/records
 * Obtener todas las referencias crediticias
 */
router.get('/', authenticateToken, CreditReferenceController.getAllReferences);

/**
 * GET /api/v1/records/search
 * Buscar referencias crediticias
 * Query params: query, type
 */
router.get(
  '/search',
  CreditReferenceController.searchReferences
);

/**
 * GET /api/v1/records/history
 * Obtener el historial de búsquedas
 */
router.get(
  '/history',
  authenticateToken,
  CreditReferenceController.getSearchHistory
);

/**
 * GET /api/v1/records/count
 * Obtener el número total de referencias crediticias
 */
router.get(
  '/count',
  authenticateToken,
  CreditReferenceController.getRecordsCount
);

/**
 * GET /api/v1/records/export
 * Exportar registros a CSV o Excel
 */
router.get(
  '/export',
  authenticateToken,
  requireAdmin,
  ExportController.exportRecords
);

/**
 * GET /api/v1/records/history/export
 * Exportar historial de busquedas a CSV
 */
router.get(
  '/history/export',
  authenticateToken,
  ExportController.exportHistory
);

/**
 * PATCH /api/v1/records/:id
 * Actualizar una referencia crediticia (usado para cambiar estado)
 */
router.patch(
  '/:id',
  authenticateToken,
  CreditReferenceController.updateReference
);

/**
 * PUT /api/v1/records/:id/status
 * Actualizar específicamente el estado de una referencia crediticia
 */
router.put(
  '/:id/status',
  authenticateToken,
  requireAdmin,
  validateStatusTransition,
  logAdminAction('UPDATE_RECORD_STATUS'),
  CreditReferenceController.updateReferenceStatus
);

/**
 * POST /api/v1/records/bulk-update-status
 * Actualizar masivamente el estado de múltiples referencias crediticias
 */
router.post(
  '/bulk-update-status',
  authenticateToken,
  requireAdmin,
  validateRecordIds,
  validateBulkOperation(100),
  validateStatusTransition,
  logAdminAction('BULK_UPDATE_STATUS'),
  CreditReferenceController.bulkUpdateStatus
);

/**
 * GET /api/v1/records/by-status
 * Obtener referencias crediticias filtradas por estado
 */
router.get(
  '/by-status',
  authenticateToken,
  CreditReferenceController.getRecordsByStatus
);

/**
 * DELETE /api/v1/records/:id
 * Eliminar una referencia crediticia (soft delete)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  logAdminAction('DELETE_RECORD'),
  CreditReferenceController.deleteReference
);

export default router;
