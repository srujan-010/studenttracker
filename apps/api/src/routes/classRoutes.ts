import { Router } from 'express';
import { getClasses, createClass } from '../controllers/classController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getClasses);
router.post('/', requireRole('ADMIN'), createClass);

export default router;
