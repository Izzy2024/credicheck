import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin, logAdminAction } from '../middleware/admin.middleware';

const router = Router();

router.use((req, _res, next) => {
  console.log(
    `Settings Route: ${req.method} ${req.path} - ${new Date().toISOString()}`
  );
  next();
});

router.get(
  '/',
  authenticateToken,
  requireAdmin,
  SettingsController.getAllSettings
);
router.put(
  '/',
  authenticateToken,
  requireAdmin,
  logAdminAction('UPDATE_SETTINGS'),
  SettingsController.updateSettings
);

export default router;
