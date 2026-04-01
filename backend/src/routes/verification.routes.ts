import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import * as verificationController from '../controllers/verification.controller';

const router = Router();

router.use(authenticateToken);

router.get('/:recordId', verificationController.getVerificationSummary);
router.post('/:recordId', verificationController.upsertVerification);
router.delete('/:recordId', verificationController.deleteMyVerification);

export default router;
