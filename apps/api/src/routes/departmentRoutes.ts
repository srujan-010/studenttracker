import { Router } from 'express';
import { getDepartments, createDepartment, deleteDepartment } from '../controllers/departmentController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getDepartments);
router.post('/', requireRole('ADMIN'), createDepartment);
router.delete('/:id', requireRole('ADMIN'), deleteDepartment);

export default router;
