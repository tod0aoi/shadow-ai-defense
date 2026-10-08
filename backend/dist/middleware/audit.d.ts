import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
/**
 * Creates an immutable audit log entry in the audit_logs table.
 */
export declare function logAuditEvent(params: {
    actor_id?: string;
    action: string;
    target_entity: string;
    target_id?: string;
    details?: object | string;
    ip_address?: string;
}): Promise<void>;
/**
 * Express middleware helper to log operations after successful response.
 */
export declare function auditAction(actionName: string, entityType: string): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
