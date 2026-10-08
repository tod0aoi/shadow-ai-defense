import { Router } from 'express';
import { getOverview, getTrends } from '../controllers/analytics.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/overview', authenticateToken, getOverview);
router.get('/trends', authenticateToken, getTrends);

export default router;
