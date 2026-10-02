import { Router } from 'express';
import { generatePrediction, getPredictions } from '../controllers/predictionController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', getPredictions);
router.post('/', requireRole('ADMIN', 'TEACHER'), generatePrediction);

export default router;
