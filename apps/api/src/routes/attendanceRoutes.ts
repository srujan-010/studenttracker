import { Router } from 'express';
import {
  getAttendance,
  getClassAttendanceSheet,
  recordAttendanceBatch,
  updateAttendanceRecord,
} from '../controllers/attendanceController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getAttendance);
router.get('/sheet', getClassAttendanceSheet);
router.post('/batch', requireRole('ADMIN', 'TEACHER'), recordAttendanceBatch);
router.put('/:id', requireRole('ADMIN', 'TEACHER'), updateAttendanceRecord);

export default router;
