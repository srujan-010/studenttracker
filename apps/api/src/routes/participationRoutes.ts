import { Router } from 'express';
import {
  getParticipation,
  getParticipationSheet,
  recordParticipationBatch,
} from '../controllers/participationController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getParticipation);
router.get('/sheet', getParticipationSheet);
router.post('/batch', requireRole('ADMIN', 'TEACHER'), recordParticipationBatch);

export default router;
