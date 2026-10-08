"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncidents = getIncidents;
exports.getIncidentById = getIncidentById;
exports.updateIncidentStatus = updateIncidentStatus;
exports.triggerAIAnalysis = triggerAIAnalysis;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const audit_1 = require("../middleware/audit");
async function getIncidents(req, res) {
    const status = req.query.status;
    const severity = req.query.severity;
    try {
        let sql = `
      SELECT 
        i.id, i.event_id, i.title, i.severity, i.risk_score, i.status, i.ai_summary, i.created_at, i.updated_at,
        u.username as assigned_user,
        e.timestamp as event_timestamp,
        s.name as service_name
      FROM incidents i
      LEFT JOIN users u ON i.assigned_to = u.id
      LEFT JOIN events e ON i.event_id = e.id
      LEFT JOIN ai_services s ON e.ai_service_id = s.id
      WHERE 1=1
    `;
        const params = [];
        if (status) {
            params.push(status.toUpperCase());
            sql += ` AND i.status = $${params.length}`;
        }
        if (severity) {
            params.push(severity.toUpperCase());
            sql += ` AND i.severity = $${params.length}`;
        }
        sql += ' ORDER BY i.created_at DESC';
        const incidents = await database_1.db.query(sql, params);
        res.status(200).json({ incidents });
    }
    catch (err) {
        console.error('[-] Error fetching incidents:', err);
        res.status(500).json({ error: 'Database Error', message: 'Failed to retrieve security incidents.' });
    }
}
async function getIncidentById(req, res) {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    try {
        const incident = await database_1.db.queryOne(`SELECT 
        i.*,
        u.username as assigned_user,
        e.redacted_payload, e.destination_url, e.prompt_length, e.timestamp as event_timestamp,
        s.name as service_name, s.is_sanctioned as service_sanctioned,
        d.hostname as device_hostname, d.ip_address as device_ip
       FROM incidents i
       LEFT JOIN users u ON i.assigned_to = u.id
       LEFT JOIN events e ON i.event_id = e.id
       LEFT JOIN ai_services s ON e.ai_service_id = s.id
       LEFT JOIN devices d ON e.device_id = d.id
       WHERE i.id = $1`, [id]);
        if (!incident) {
            res.status(404).json({ error: 'Not Found', message: `Incident ${id} not found.` });
            return;
        }
        // Fetch detections
        const detections = await database_1.db.query('SELECT id, category, subcategory, confidence, evidence_masked, entropy_score FROM detections WHERE event_id = $1', [incident.event_id]);
        // Fetch timeline
        const timeline = await database_1.db.query(`SELECT t.id, t.action, t.notes, t.timestamp, u.username as actor_name
       FROM incident_timeline t
       LEFT JOIN users u ON t.actor_id = u.id
       WHERE t.incident_id = $1
       ORDER BY t.timestamp ASC`, [id]);
        res.status(200).json({
            incident,
            detections,
            timeline,
        });
    }
    catch (err) {
        console.error('[-] Error fetching incident detail:', err);
        res.status(500).json({ error: 'Database Error', message: 'Failed to load incident detail.' });
    }
}
async function updateIncidentStatus(req, res) {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    const { status, notes } = req.body;
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.socket.remoteAddress || '127.0.0.1';
    const validStatuses = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
        res.status(400).json({
            error: 'Invalid Status',
            message: `Status must be one of: ${validStatuses.join(', ')}`,
        });
        return;
    }
    const targetStatus = status.toUpperCase();
    try {
        const incident = await database_1.db.queryOne('SELECT id, status FROM incidents WHERE id = $1', [id]);
        if (!incident) {
            res.status(404).json({ error: 'Not Found', message: `Incident ${id} not found.` });
            return;
        }
        const previousStatus = incident.status;
        // Update incident status
        await database_1.db.execute('UPDATE incidents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [targetStatus, id]);
        // Insert timeline entry
        const timelineId = (0, uuid_1.v4)();
        await database_1.db.execute(`INSERT INTO incident_timeline (id, incident_id, actor_id, action, notes)
       VALUES ($1, $2, $3, $4, $5)`, [
            timelineId,
            id,
            req.user?.id || null,
            `STATUS_CHANGED_TO_${targetStatus}`,
            notes || `Status transitioned from ${previousStatus} to ${targetStatus}`,
        ]);
        // Audit log
        await (0, audit_1.logAuditEvent)({
            actor_id: req.user?.id,
            action: 'INCIDENT_STATUS_UPDATED',
            target_entity: 'incidents',
            target_id: id,
            details: { previousStatus, newStatus: targetStatus, notes },
            ip_address: clientIp,
        });
        res.status(200).json({
            message: 'Incident status updated successfully',
            incident_id: id,
            previous_status: previousStatus,
            new_status: targetStatus,
        });
    }
    catch (err) {
        console.error('[-] Error updating incident status:', err);
        res.status(500).json({ error: 'Database Error', message: 'Failed to update incident status.' });
    }
}
async function triggerAIAnalysis(req, res) {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    try {
        const { runAIIncidentAnalysis } = await Promise.resolve().then(() => __importStar(require('../services/ai.analyst.service')));
        const analysis = await runAIIncidentAnalysis(id);
        res.status(200).json({
            message: 'AI Incident Analysis successfully updated',
            incident_id: id,
            analysis,
        });
    }
    catch (err) {
        console.error('[-] Error executing AI analysis:', err);
        res.status(500).json({ error: 'AI Analysis Error', message: err.message });
    }
}
