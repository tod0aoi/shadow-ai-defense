import { Router } from 'express';
import { getRiskWeights, updateRiskWeights } from '../controllers/risk.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/weights', authenticateToken, getRiskWeights);
router.put('/weights', authenticateToken, requireRole('ADMIN'), updateRiskWeights);

export default router;
