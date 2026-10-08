import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../types';
export interface AuthenticatedRequest extends Request {
    user?: User;
}
/**
 * Middleware to verify JWT authentication token in Authorization header.
 * Attaches verified user object to request.
 */
export declare function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Role-Based Access Control (RBAC) guard.
 * Restricts endpoint to specified authorized roles.
 */
export declare function requireRole(allowedRoles: UserRole | UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
