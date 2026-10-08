"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
const security_1 = require("../utils/security");
const database_1 = require("../config/database");
/**
 * Middleware to verify JWT authentication token in Authorization header.
 * Attaches verified user object to request.
 */
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Access token missing or invalid format. Provide Bearer token.',
        });
        return;
    }
    try {
        const decoded = (0, security_1.verifyToken)(token);
        const user = await database_1.db.queryOne('SELECT id, username, email, role, full_name, is_active FROM users WHERE id = $1', [decoded.id]);
        if (!user) {
            res.status(401).json({ error: 'Unauthorized', message: 'User account no longer exists.' });
            return;
        }
        if (!user.is_active) {
            res.status(403).json({ error: 'Forbidden', message: 'User account is deactivated.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired authentication token.',
        });
    }
}
/**
 * Role-Based Access Control (RBAC) guard.
 * Restricts endpoint to specified authorized roles.
 */
function requireRole(allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: 'Forbidden',
                message: `Insufficient permissions. Required role: [${roles.join(', ')}], current: ${req.user.role}`,
            });
            return;
        }
        next();
    };
}
