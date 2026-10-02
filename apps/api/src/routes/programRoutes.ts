import { Router } from 'express';
import { getPrograms, createProgram, deleteProgram } from '../controllers/programController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getPrograms);
router.post('/', requireRole('ADMIN'), createProgram);
router.delete('/:id', requireRole('ADMIN'), deleteProgram);

export default router;
