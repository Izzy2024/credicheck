import { Router } from 'express';
import * as attachmentController from '../controllers/dispute-attachment.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireDisputeOwnerOrAdmin } from '../middleware/dispute-owner.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Upload attachments to a dispute (with ownership check in controller)
router.post(
  '/:disputeId/attachments',
  requireDisputeOwnerOrAdmin,
  attachmentController.upload.array('files', 5),
  attachmentController.uploadAttachments
);

// Get attachments for a dispute
router.get(
  '/:disputeId/attachments',
  requireDisputeOwnerOrAdmin,
  attachmentController.getAttachments
);

// View/download one attachment (owner/admin)
router.get(
  '/:disputeId/attachments/:attachmentId/download',
  requireDisputeOwnerOrAdmin,
  attachmentController.downloadAttachment
);

export default router;
