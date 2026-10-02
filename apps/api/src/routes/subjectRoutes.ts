import { Router } from 'express';
import { getSubjects, createSubject } from '../controllers/subjectController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getSubjects);
router.post('/', requireRole('ADMIN'), createSubject);

export default router;
