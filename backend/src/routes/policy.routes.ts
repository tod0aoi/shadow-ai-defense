import { Router } from 'express';
import { getPolicies, updatePolicy } from '../controllers/policy.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Viewing policies is open to both ADMIN and SECURITY_ANALYST
router.get('/', authenticateToken, getPolicies);

// Modifying policies requires ADMIN role
router.put('/:id', authenticateToken, requireRole('ADMIN'), updatePolicy);

export default router;
