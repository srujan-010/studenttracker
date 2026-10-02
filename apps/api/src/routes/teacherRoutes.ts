import { Router } from 'express';
import { getTeachers, createTeacher, updateTeacher } from '../controllers/teacherController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getTeachers);
router.post('/', requireRole('ADMIN'), createTeacher);
router.put('/:id', requireRole('ADMIN'), updateTeacher);

export default router;
