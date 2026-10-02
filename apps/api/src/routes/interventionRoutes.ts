import { Router } from 'express';
import {
  createIntervention,
  getInterventions,
  updateIntervention,
} from '../controllers/interventionController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getInterventions);
router.post('/', requireRole('ADMIN', 'TEACHER'), createIntervention);
router.put('/:id', requireRole('ADMIN', 'TEACHER'), updateIntervention);

export default router;
