import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

router.use((req, _res, next) => {
  console.log(
    `Audit Route: ${req.method} ${req.path} - ${new Date().toISOString()}`
  );
  next();
});

router.get('/', authenticateToken, requireAdmin, AuditController.getAuditLogs);

export default router;
