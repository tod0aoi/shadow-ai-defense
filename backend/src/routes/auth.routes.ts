import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { validateLoginPayload } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', validateLoginPayload, login);
router.get('/me', authenticateToken, getMe);

export default router;
