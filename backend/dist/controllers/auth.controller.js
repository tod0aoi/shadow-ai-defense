"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.getMe = getMe;
const database_1 = require("../config/database");
const security_1 = require("../utils/security");
const audit_1 = require("../middleware/audit");
async function login(req, res) {
    const { username, password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    try {
        const user = await database_1.db.queryOne('SELECT id, username, email, password_hash, role, full_name, is_active FROM users WHERE username = $1', [username]);
        if (!user || !user.password_hash) {
            res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid username or password.',
            });
            return;
        }
        if (!user.is_active) {
            res.status(403).json({
                error: 'Account Suspended',
                message: 'This account has been deactivated by an administrator.',
            });
            return;
        }
        const isMatch = await (0, security_1.comparePassword)(password, user.password_hash);
        if (!isMatch) {
            // Log failed authentication attempt
            await (0, audit_1.logAuditEvent)({
                actor_id: user.id,
                action: 'AUTH_LOGIN_FAILED',
                target_entity: 'users',
                target_id: user.id,
                details: { reason: 'Invalid password' },
                ip_address: clientIp,
            });
            res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid username or password.',
            });
            return;
        }
        // Generate JWT token
        const token = (0, security_1.generateToken)({
            id: user.id,
            username: user.username,
            role: user.role,
        });
        // Log successful authentication
        await (0, audit_1.logAuditEvent)({
            actor_id: user.id,
            action: 'AUTH_LOGIN_SUCCESS',
            target_entity: 'users',
            target_id: user.id,
            details: { role: user.role },
            ip_address: clientIp,
        });
        res.status(200).json({
            message: 'Authentication successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
            },
        });
    }
    catch (err) {
        console.error('[-] Error during login:', err);
        res.status(500).json({ error: 'Server Error', message: 'Internal server error during authentication.' });
    }
}
async function getMe(req, res) {
    if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    res.status(200).json({
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            full_name: req.user.full_name,
            is_active: req.user.is_active,
        },
    });
}
