import { Router } from 'express';
import { getSettings, updateRiskThresholds } from '../controllers/settingsController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getSettings);
router.put('/thresholds', requireRole('ADMIN'), updateRiskThresholds);

export default router;
