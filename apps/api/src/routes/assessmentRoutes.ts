import { Router } from 'express';
import {
  getAssessments,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  saveBatchAssessments,
} from '../controllers/assessmentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssessments);
router.post('/batch', requireRole('ADMIN', 'TEACHER'), saveBatchAssessments);
router.post('/', requireRole('ADMIN', 'TEACHER'), createAssessment);
router.put('/:id', requireRole('ADMIN', 'TEACHER'), updateAssessment);
router.delete('/:id', requireRole('ADMIN', 'TEACHER'), deleteAssessment);

export default router;
