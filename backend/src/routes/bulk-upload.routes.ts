import { Router } from 'express';
import * as bulkUploadController from '../controllers/bulk-upload.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// Todas las rutas requieren autenticación y permisos de admin
router.use(authenticateToken);
router.use(requireAdmin);

// POST /api/bulk-upload/csv - Carga masiva de registros desde CSV
router.post('/csv', bulkUploadController.uploadCSV);

// GET /api/bulk-upload/template - Descarga el template CSV
router.get('/template', bulkUploadController.downloadTemplate);

export default router;
