import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { sha256, maskEvidence } from '../utils/security';
import { executeDetectionScan } from '../services/detection.service';
import { AIService, Device, User } from '../types';

export async function scanText(req: Request, res: Response): Promise<void> {
  const { prompt_text } = req.body;
  if (!prompt_text || typeof prompt_text !== 'string') {
    res.status(400).json({ error: 'Validation Error', message: 'Field "prompt_text" is required.' });
    return;
  }

  try {
    const results = await executeDetectionScan(prompt_text);
    res.status(200).json(results);
  } catch (err: any) {
    console.error('[-] Error executing direct text scan:', err);
    res.status(500).json({ error: 'Detection Error', message: err.message });
  }
}

export async function ingestEvent(req: Request, res: Response): Promise<void> {
  const { user_identifier, device_info, ai_service, destination_url, prompt_text, event_type } = req.body;

  try {
    // 1. Resolve or register user
    let user = await db.queryOne<User>(
      'SELECT id, username, email FROM users WHERE email = $1 OR username = $1',
      [user_identifier]
    );

    if (!user) {
      const newUserId = uuidv4();
      const username = user_identifier.split('@')[0];
      await db.execute(
        `INSERT INTO users (id, username, email, password_hash, role, full_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [newUserId, username, user_identifier, 'UNMANAGED_ENDPOINT_USER', 'SECURITY_ANALYST', username, true]
      );
      user = { id: newUserId, username, email: user_identifier, role: 'SECURITY_ANALYST', full_name: username, is_active: true, created_at: '', updated_at: '' };
    }

    // 2. Resolve or register device
    let device = await db.queryOne<Device>(
      'SELECT id, hostname, ip_address FROM devices WHERE hostname = $1 OR ip_address = $2',
      [device_info.hostname, device_info.ip_address]
    );

    if (!device) {
      const newDeviceId = uuidv4();
      await db.execute(
        `INSERT INTO devices (id, hostname, ip_address, os, department)
         VALUES ($1, $2, $3, $4, $5)`,
        [newDeviceId, device_info.hostname, device_info.ip_address, device_info.os || 'Unknown OS', device_info.department || 'General']
      );
      device = { id: newDeviceId, hostname: device_info.hostname, ip_address: device_info.ip_address, last_seen: '' };
    }

    // 3. Resolve or register AI service
    let service = await db.queryOne<AIService>(
      'SELECT id, name, is_sanctioned, base_risk_weight FROM ai_services WHERE LOWER(name) LIKE $1',
      [`%${ai_service.toLowerCase()}%`]
    );

    if (!service) {
      const newServiceId = uuidv4();
      const domain = destination_url ? new URL(destination_url).hostname : 'unknown-ai.cloud';
      await db.execute(
        `INSERT INTO ai_services (id, name, domains, is_sanctioned, base_risk_weight)
         VALUES ($1, $2, $3, $4, $5)`,
        [newServiceId, ai_service, domain, false, 20] // Default unsanctioned AI service weight
      );
      service = { id: newServiceId, name: ai_service, category: 'LLM', domains: domain, is_sanctioned: false, base_risk_weight: 20, created_at: '' };
    }

    // 4. Execute Detection Scan (Python Core)
    const detectionResult = await executeDetectionScan(prompt_text);

    // 5. Compute privacy-by-design cryptographic properties
    const eventId = uuidv4();
    const promptLength = prompt_text.length;
    const promptHash = sha256(prompt_text);
    const sanitizedPayload = detectionResult.redacted_text || maskEvidence(prompt_text);

    // 6. Persist raw event record
    await db.execute(
      `INSERT INTO events (id, user_id, device_id, ai_service_id, event_type, prompt_length, prompt_sha256, redacted_payload, destination_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        eventId,
        user.id,
        device.id,
        service.id,
        event_type || 'PROMPT_SUBMISSION',
        promptLength,
        promptHash,
        sanitizedPayload,
        destination_url,
      ]
    );

    // 7. Persist individual sensitive detections
    for (const d of detectionResult.detections) {
      const detectionId = uuidv4();
      await db.execute(
        `INSERT INTO detections (id, event_id, category, subcategory, confidence, evidence_masked, entropy_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          detectionId,
          eventId,
          d.category,
          d.subcategory,
          d.confidence,
          d.evidence_masked,
          d.entropy_score || null,
        ]
      );
    }

    // 8. Evaluate organizational security policies
    const { policyEngine } = await import('../services/policy.engine');
    const violations = await policyEngine.evaluate(eventId, detectionResult);

    // 9. Deterministically calculate risk score and persist assessment
    const { riskEngine } = await import('../services/risk.engine');
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
    const { incidentService } = await import('../services/incident.service');
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
  } catch (err: any) {
    console.error('[-] Error ingesting AI service event:', err);
    res.status(500).json({ error: 'Ingestion Error', message: 'Failed to process AI usage event.' });
  }
}

export async function getEvents(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(100, parseInt(req.query.limit as string, 10) || 20);
  const offset = (page - 1) * limit;

  try {
    const events = await db.query(
      `SELECT 
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
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countRes = await db.queryOne<{ count: number | string }>('SELECT count(*) as count FROM events');
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
  } catch (err: any) {
    console.error('[-] Error fetching events:', err);
    res.status(500).json({ error: 'Database Error', message: 'Failed to fetch events.' });
  }
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

  try {
    const event = await db.queryOne(
      `SELECT 
        e.*,
        u.username, u.email as user_email,
        d.hostname as device_hostname, d.ip_address as device_ip, d.os as device_os,
        s.name as service_name, s.is_sanctioned as service_sanctioned
       FROM events e
       LEFT JOIN users u ON e.user_id = u.id
       LEFT JOIN devices d ON e.device_id = d.id
       LEFT JOIN ai_services s ON e.ai_service_id = s.id
       WHERE e.id = $1`,
      [id]
    );

    if (!event) {
      res.status(404).json({ error: 'Not Found', message: `Event with id ${id} does not exist.` });
      return;
    }

    const detections = await db.query(
      'SELECT id, category, subcategory, confidence, evidence_masked, entropy_score, created_at FROM detections WHERE event_id = $1',
      [id]
    );

    const violations = await db.query(
      `SELECT pv.id, pv.severity, pv.matched_criteria, p.name as policy_name, p.target_category
       FROM policy_violations pv
       JOIN policies p ON pv.policy_id = p.id
       WHERE pv.event_id = $1`,
      [id]
    );

    const risk = await db.queryOne(
      'SELECT total_score, severity_level, breakdown_factors, calculated_at FROM risk_assessments WHERE event_id = $1',
      [id]
    );

    const incident = await db.queryOne(
      'SELECT id, title, severity, risk_score, status, ai_summary, ai_remediation FROM incidents WHERE event_id = $1',
      [id]
    );

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
  } catch (err: any) {
    console.error('[-] Error fetching event by ID:', err);
    res.status(500).json({ error: 'Database Error', message: 'Failed to retrieve event details.' });
  }
}
