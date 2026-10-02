import { Router } from 'express';
import {
  getAssignments,
  createAssignment,
  getAssignmentSubmissions,
  updateSubmissionStatus,
  submitMyAssignment,
} from '../controllers/assignmentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getAssignments);
router.post('/', requireRole('ADMIN', 'TEACHER'), createAssignment);
router.get('/:id/submissions', requireRole('ADMIN', 'TEACHER'), getAssignmentSubmissions);
router.post('/submissions/status', requireRole('ADMIN', 'TEACHER'), updateSubmissionStatus);
router.post('/:id/submit', requireRole('STUDENT'), submitMyAssignment);

export default router;
