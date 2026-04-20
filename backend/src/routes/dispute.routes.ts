import { Router } from 'express';
import * as disputeController from '../controllers/dispute.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';
import { requireDisputeOwnerOrAdmin } from '../middleware/dispute-owner.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User routes - create and view own disputes
router.post('/', disputeController.createDispute);
router.get('/me', disputeController.getMyDisputes);

// Messages (owner or admin)
router.get(
  '/:disputeId/messages',
  requireDisputeOwnerOrAdmin,
  disputeController.getDisputeMessages
);
router.post(
  '/:disputeId/messages',
  requireDisputeOwnerOrAdmin,
  disputeController.createDisputeMessage
);

// Admin routes - view all pending and resolve
router.get('/pending', requireAdmin, disputeController.getPendingDisputes);
router.patch('/:id/resolve', requireAdmin, disputeController.resolveDispute);

export default router;
