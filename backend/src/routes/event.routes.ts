import { Router } from 'express';
import { ingestEvent, getEvents, getEventById, scanText } from '../controllers/event.controller';
import { validateIngestPayload } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Sandbox scan endpoint (immediate scan without persistence)
router.post('/scan', scanText);

// Ingestion endpoint (public/token-authenticated for monitored endpoints)
router.post('/ingest', validateIngestPayload, ingestEvent);

// Query endpoints (protected for SOC analysts & admins)
router.get('/', authenticateToken, getEvents);
router.get('/:id', authenticateToken, getEventById);

export default router;
