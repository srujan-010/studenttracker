import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);
router.get('/', requireRole('ADMIN'), getAuditLogs);

export default router;
