import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export async function getIncidents(req: Request, res: Response): Promise<void> {
  const status = req.query.status as string;
  const severity = req.query.severity as string;

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
    const params: any[] = [];

    if (status) {
      params.push(status.toUpperCase());
      sql += ` AND i.status = $${params.length}`;
    }

    if (severity) {
      params.push(severity.toUpperCase());
      sql += ` AND i.severity = $${params.length}`;
    }

    sql += ' ORDER BY i.created_at DESC';

    const incidents = await db.query(sql, params);
    res.status(200).json({ incidents });
  } catch (err: any) {
    console.error('[-] Error fetching incidents:', err);
    res.status(500).json({ error: 'Database Error', message: 'Failed to retrieve security incidents.' });
  }
}

export async function getIncidentById(req: Request, res: Response): Promise<void> {
  const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

  try {
    const incident = await db.queryOne(
      `SELECT 
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
       WHERE i.id = $1`,
      [id]
    );

    if (!incident) {
      res.status(404).json({ error: 'Not Found', message: `Incident ${id} not found.` });
      return;
    }

    // Fetch detections
    const detections = await db.query(
      'SELECT id, category, subcategory, confidence, evidence_masked, entropy_score FROM detections WHERE event_id = $1',
      [incident.event_id]
    );

    // Fetch timeline
    const timeline = await db.query(
      `SELECT t.id, t.action, t.notes, t.timestamp, u.username as actor_name
       FROM incident_timeline t
       LEFT JOIN users u ON t.actor_id = u.id
       WHERE t.incident_id = $1
       ORDER BY t.timestamp ASC`,
      [id]
    );

    res.status(200).json({
      incident,
      detections,
      timeline,
    });
  } catch (err: any) {
    console.error('[-] Error fetching incident detail:', err);
    res.status(500).json({ error: 'Database Error', message: 'Failed to load incident detail.' });
  }
}

export async function updateIncidentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
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
    const incident = await db.queryOne('SELECT id, status FROM incidents WHERE id = $1', [id]);
    if (!incident) {
      res.status(404).json({ error: 'Not Found', message: `Incident ${id} not found.` });
      return;
    }

    const previousStatus = incident.status;

    // Update incident status
    await db.execute(
      'UPDATE incidents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [targetStatus, id]
    );

    // Insert timeline entry
    const timelineId = uuidv4();
    await db.execute(
      `INSERT INTO incident_timeline (id, incident_id, actor_id, action, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        timelineId,
        id,
        req.user?.id || null,
        `STATUS_CHANGED_TO_${targetStatus}`,
        notes || `Status transitioned from ${previousStatus} to ${targetStatus}`,
      ]
    );

    // Audit log
    await logAuditEvent({
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
  } catch (err: any) {
    console.error('[-] Error updating incident status:', err);
    res.status(500).json({ error: 'Database Error', message: 'Failed to update incident status.' });
  }
}

export async function triggerAIAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;

  try {
    const { runAIIncidentAnalysis } = await import('../services/ai.analyst.service');
    const analysis = await runAIIncidentAnalysis(id);

    res.status(200).json({
      message: 'AI Incident Analysis successfully updated',
      incident_id: id,
      analysis,
    });
  } catch (err: any) {
    console.error('[-] Error executing AI analysis:', err);
    res.status(500).json({ error: 'AI Analysis Error', message: err.message });
  }
}
