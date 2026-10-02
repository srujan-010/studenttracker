import { Router } from 'express';
import multer from 'multer';
import {
  getStudents,
  getStudentById,
  getMyProfile,
  createStudent,
  updateStudent,
  importStudentsCSV,
  getStudentMetrics,
} from '../controllers/studentController';
import { authenticateToken, requireRole, authorizeStudentAccess } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticateToken);

router.get('/', getStudents);
router.get('/me', getMyProfile);
router.post('/', requireRole('ADMIN', 'TEACHER'), createStudent);
router.post('/import-csv', requireRole('ADMIN', 'TEACHER'), upload.single('file'), importStudentsCSV);
router.get('/:id', authorizeStudentAccess, getStudentById);
router.get('/:id/metrics', authorizeStudentAccess, getStudentMetrics);
router.put('/:id', requireRole('ADMIN', 'TEACHER'), authorizeStudentAccess, updateStudent);

export default router;
