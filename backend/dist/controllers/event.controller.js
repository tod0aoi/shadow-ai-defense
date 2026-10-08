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
exports.scanText = scanText;
exports.ingestEvent = ingestEvent;
exports.getEvents = getEvents;
exports.getEventById = getEventById;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
const security_1 = require("../utils/security");
const detection_service_1 = require("../services/detection.service");
async function scanText(req, res) {
    const { prompt_text } = req.body;
    if (!prompt_text || typeof prompt_text !== 'string') {
        res.status(400).json({ error: 'Validation Error', message: 'Field "prompt_text" is required.' });
        return;
    }
    try {
        const results = await (0, detection_service_1.executeDetectionScan)(prompt_text);
        res.status(200).json(results);
    }
    catch (err) {
        console.error('[-] Error executing direct text scan:', err);
        res.status(500).json({ error: 'Detection Error', message: err.message });
    }
}
async function ingestEvent(req, res) {
    const { user_identifier, device_info, ai_service, destination_url, prompt_text, event_type } = req.body;
    try {
        // 1. Resolve or register user
        let user = await database_1.db.queryOne('SELECT id, username, email FROM users WHERE email = $1 OR username = $1', [user_identifier]);
        if (!user) {
            const newUserId = (0, uuid_1.v4)();
            const username = user_identifier.split('@')[0];
            await database_1.db.execute(`INSERT INTO users (id, username, email, password_hash, role, full_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [newUserId, username, user_identifier, 'UNMANAGED_ENDPOINT_USER', 'SECURITY_ANALYST', username, true]);
            user = { id: newUserId, username, email: user_identifier, role: 'SECURITY_ANALYST', full_name: username, is_active: true, created_at: '', updated_at: '' };
        }
        // 2. Resolve or register device
        let device = await database_1.db.queryOne('SELECT id, hostname, ip_address FROM devices WHERE hostname = $1 OR ip_address = $2', [device_info.hostname, device_info.ip_address]);
        if (!device) {
            const newDeviceId = (0, uuid_1.v4)();
            await database_1.db.execute(`INSERT INTO devices (id, hostname, ip_address, os, department)
         VALUES ($1, $2, $3, $4, $5)`, [newDeviceId, device_info.hostname, device_info.ip_address, device_info.os || 'Unknown OS', device_info.department || 'General']);
            device = { id: newDeviceId, hostname: device_info.hostname, ip_address: device_info.ip_address, last_seen: '' };
        }
        // 3. Resolve or register AI service
        let service = await database_1.db.queryOne('SELECT id, name, is_sanctioned, base_risk_weight FROM ai_services WHERE LOWER(name) LIKE $1', [`%${ai_service.toLowerCase()}%`]);
        if (!service) {
            const newServiceId = (0, uuid_1.v4)();
            const domain = destination_url ? new URL(destination_url).hostname : 'unknown-ai.cloud';
            await database_1.db.execute(`INSERT INTO ai_services (id, name, domains, is_sanctioned, base_risk_weight)
         VALUES ($1, $2, $3, $4, $5)`, [newServiceId, ai_service, domain, false, 20] // Default unsanctioned AI service weight
            );
            service = { id: newServiceId, name: ai_service, category: 'LLM', domains: domain, is_sanctioned: false, base_risk_weight: 20, created_at: '' };
        }
        // 4. Execute Detection Scan (Python Core)
        const detectionResult = await (0, detection_service_1.executeDetectionScan)(prompt_text);
        // 5. Compute privacy-by-design cryptographic properties
        const eventId = (0, uuid_1.v4)();
        const promptLength = prompt_text.length;
        const promptHash = (0, security_1.sha256)(prompt_text);
        const sanitizedPayload = detectionResult.redacted_text || (0, security_1.maskEvidence)(prompt_text);
        // 6. Persist raw event record
        await database_1.db.execute(`INSERT INTO events (id, user_id, device_id, ai_service_id, event_type, prompt_length, prompt_sha256, redacted_payload, destination_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
            eventId,
            user.id,
            device.id,
            service.id,
            event_type || 'PROMPT_SUBMISSION',
            promptLength,
            promptHash,
            sanitizedPayload,
            destination_url,
        ]);
        // 7. Persist individual sensitive detections
        for (const d of detectionResult.detections) {
            const detectionId = (0, uuid_1.v4)();
            await database_1.db.execute(`INSERT INTO detections (id, event_id, category, subcategory, confidence, evidence_masked, entropy_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
                detectionId,
                eventId,
                d.category,
                d.subcategory,
                d.confidence,
                d.evidence_masked,
                d.entropy_score || null,
            ]);
        }
        // 8. Evaluate organizational security policies
        const { policyEngine } = await Promise.resolve().then(() => __importStar(require('../services/policy.engine')));
        const violations = await policyEngine.evaluate(eventId, detectionResult);
        // 9. Deterministically calculate risk score and persist assessment
        const { riskEngine } = await Promise.resolve().then(() => __importStar(require('../services/risk.engine')));
        const isSanctioned = Boolean(service.is_sanctioned);
        const risk = await riskEngine.calculateRisk({
            eventId,
            userId: user.id,
            isSanctionedService: isSanctioned,
            serviceName: service.name,
            detectionResult,
            violations,
        });
        // 10. Evaluate and trigger incident if high risk
        const { incidentService } = await Promise.resolve().then(() => __importStar(require('../services/incident.service')));
        const incidentRes = await incidentService.evaluateAndCreateIncident({
            eventId,
            userId: user.id,
            serviceName: service.name,
            riskScore: risk.total_score,
            severity: risk.severity,
            detectionResult,
            violations,
        });
        res.status(201).json({
            message: 'AI usage event successfully analyzed and persisted',
            event_id: eventId,
            user_id: user.id,
            device_id: device.id,
            service: {
                id: service.id,
                name: service.name,
                is_sanctioned: isSanctioned,
            },
            prompt_length: promptLength,
            prompt_sha256: promptHash,
            detections_count: detectionResult.detections_count,
            detections: detectionResult.detections,
            policy_violations_count: violations.length,
            policy_violations: violations,
            risk_assessment: risk,
            incident_created: incidentRes.incidentCreated,
            incident_id: incidentRes.incidentId || null,
            timestamp: new Date().toISOString(),
        });
    }
    catch (err) {
        console.error('[-] Error ingesting AI service event:', err);
        res.status(500).json({ error: 'Ingestion Error', message: 'Failed to process AI usage event.' });
    }
}
async function getEvents(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;
    try {
        const events = await database_1.db.query(`SELECT 
        e.id, e.event_type, e.prompt_length, e.prompt_sha256, e.redacted_payload, e.destination_url, e.timestamp,
        u.username, u.email as user_email,
        d.hostname as device_hostname, d.ip_address as device_ip,
        s.name as service_name, s.is_sanctioned as service_sanctioned,
        r.total_score as risk_score, r.severity_level as severity,
        i.id as incident_id, i.status as incident_status
       FROM events e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN devices d ON e.device_id = d.id
       LEFT JOIN ai_services s ON e.ai_service_id = s.id
       LEFT JOIN risk_assessments r ON e.id = r.event_id
       LEFT JOIN incidents i ON e.id = i.event_id
       ORDER BY e.timestamp DESC
       LIMIT $1 OFFSET $2`, [limit, offset]);
        const countRes = await database_1.db.queryOne('SELECT count(*) as count FROM events');
        const total = Number(countRes?.count || 0);
        res.status(200).json({
            events,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (err) {
        console.error('[-] Error fetching events:', err);
        res.status(500).json({ error: 'Database Error', message: 'Failed to fetch events.' });
    }
}
async function getEventById(req, res) {
    const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
    try {
        const event = await database_1.db.queryOne(`SELECT 
        e.*,
        u.username, u.email as user_email,
        d.hostname as device_hostname, d.ip_address as device_ip, d.os as device_os,
        s.name as service_name, s.is_sanctioned as service_sanctioned
       FROM events e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN devices d ON e.device_id = d.id
       LEFT JOIN ai_services s ON e.ai_service_id = s.id
       WHERE e.id = $1`, [id]);
        if (!event) {
            res.status(404).json({ error: 'Not Found', message: `Event with id ${id} does not exist.` });
            return;
        }
        const detections = await database_1.db.query('SELECT id, category, subcategory, confidence, evidence_masked, entropy_score, created_at FROM detections WHERE event_id = $1', [id]);
        const violations = await database_1.db.query(`SELECT pv.id, pv.severity, pv.matched_criteria, p.name as policy_name, p.target_category
       FROM policy_violations pv
       JOIN policies p ON pv.policy_id = p.id
       WHERE pv.event_id = $1`, [id]);
        const risk = await database_1.db.queryOne('SELECT total_score, severity_level, breakdown_factors, calculated_at FROM risk_assessments WHERE event_id = $1', [id]);
        const incident = await database_1.db.queryOne('SELECT id, title, severity, risk_score, status, ai_summary, ai_remediation FROM incidents WHERE event_id = $1', [id]);
        res.status(200).json({
            event,
            detections,
            policy_violations: violations,
            risk_assessment: risk ? {
                ...risk,
                breakdown_factors: typeof risk.breakdown_factors === 'string' ? JSON.parse(risk.breakdown_factors) : risk.breakdown_factors,
            } : null,
            incident,
        });
    }
    catch (err) {
        console.error('[-] Error fetching event by ID:', err);
        res.status(500).json({ error: 'Database Error', message: 'Failed to retrieve event details.' });
    }
}
