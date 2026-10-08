"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRiskWeights = getRiskWeights;
exports.updateRiskWeights = updateRiskWeights;
const risk_engine_1 = require("../services/risk.engine");
const audit_1 = require("../middleware/audit");
async function getRiskWeights(req, res) {
    const config = (0, risk_engine_1.getRiskConfiguration)();
    res.status(200).json({ config });
}
async function updateRiskWeights(req, res) {
    const { weights, modifiers } = req.body;
    const clientIp = (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for']) || req.socket.remoteAddress || '127.0.0.1';
    try {
        const updated = (0, risk_engine_1.updateRiskConfiguration)({ weights, modifiers });
        await (0, audit_1.logAuditEvent)({
            actor_id: req.user?.id,
            action: 'RISK_WEIGHTS_MODIFIED',
            target_entity: 'risk_configuration',
            details: { weights, modifiers },
            ip_address: clientIp,
        });
        res.status(200).json({
            message: 'Risk scoring weights successfully updated',
            config: updated,
        });
    }
    catch (err) {
        console.error('[-] Error updating risk weights:', err);
        res.status(500).json({ error: 'Config Error', message: 'Failed to update risk configuration.' });
    }
}
