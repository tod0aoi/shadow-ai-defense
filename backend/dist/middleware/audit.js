"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAuditEvent = logAuditEvent;
exports.auditAction = auditAction;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
/**
 * Creates an immutable audit log entry in the audit_logs table.
 */
async function logAuditEvent(params) {
    const id = (0, uuid_1.v4)();
    const detailsStr = typeof params.details === 'object' ? JSON.stringify(params.details) : params.details || null;
    try {
        await database_1.db.execute(`INSERT INTO audit_logs (id, actor_id, action, target_entity, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            id,
            params.actor_id || null,
            params.action,
            params.target_entity,
            params.target_id || null,
            detailsStr,
            params.ip_address || null,
        ]);
    }
    catch (err) {
        console.error('[-] Failed to write audit log:', err.message);
    }
}
/**
 * Express middleware helper to log operations after successful response.
 */
function auditAction(actionName, entityType) {
    return (req, res, next) => {
        const originalSend = res.send;
        res.send = function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const forwarded = req.headers['x-forwarded-for'];
                const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.socket.remoteAddress || '127.0.0.1';
                const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
                logAuditEvent({
                    actor_id: req.user?.id,
                    action: actionName,
                    target_entity: entityType,
                    target_id: targetId || undefined,
                    details: { method: req.method, path: req.originalUrl },
                    ip_address: clientIp,
                }).catch((err) => console.error('Audit middleware error:', err));
            }
            return originalSend.apply(res, arguments);
        };
        next();
    };
}
