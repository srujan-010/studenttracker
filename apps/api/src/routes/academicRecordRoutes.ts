import { Router } from 'express';
import { getAcademicRecords, upsertAcademicRecord } from '../controllers/academicRecordController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getAcademicRecords);
router.post('/', requireRole('ADMIN', 'TEACHER'), upsertAcademicRecord);

export default router;
