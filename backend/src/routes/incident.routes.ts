import { Router } from 'express';
import { getIncidents, getIncidentById, updateIncidentStatus, triggerAIAnalysis } from '../controllers/incident.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getIncidents);
router.get('/:id', authenticateToken, getIncidentById);
router.patch('/:id/status', authenticateToken, updateIncidentStatus);
router.post('/:id/ai-analyze', authenticateToken, triggerAIAnalysis);

export default router;
