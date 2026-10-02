import { Router } from 'express';
import {
  getStudyLogs,
  createStudyLog,
  deleteStudyLog,
} from '../controllers/studyLogController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', getStudyLogs);
router.post('/', createStudyLog);
router.delete('/:id', deleteStudyLog);

export default router;
