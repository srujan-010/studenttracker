import { Router } from 'express';
import { getStudentReport, getClassRiskReport } from '../controllers/reportController';
import { authenticateToken, requireRole, authorizeStudentAccess } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/students/:id', authorizeStudentAccess, getStudentReport);
router.get('/class-risk', requireRole('ADMIN', 'TEACHER'), getClassRiskReport);

export default router;
