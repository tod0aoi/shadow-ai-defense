import { Request, Response } from 'express';
import { db } from '../config/database';

export async function getOverview(req: Request, res: Response): Promise<void> {
  try {
    const eventsCount = await db.queryOne<{ count: number | string }>('SELECT count(*) as count FROM events');
    const violationsCount = await db.queryOne<{ count: number | string }>('SELECT count(*) as count FROM policy_violations');
    const criticalIncidents = await db.queryOne<{ count: number | string }>(
      "SELECT count(*) as count FROM incidents WHERE severity = 'CRITICAL'"
    );
    const highIncidents = await db.queryOne<{ count: number | string }>(
      "SELECT count(*) as count FROM incidents WHERE severity = 'HIGH'"
    );
    const openIncidents = await db.queryOne<{ count: number | string }>(
      "SELECT count(*) as count FROM incidents WHERE status = 'OPEN'"
    );
    const activeServices = await db.queryOne<{ count: number | string }>(
      'SELECT count(DISTINCT ai_service_id) as count FROM events'
    );

    res.status(200).json({
      overview: {
        total_events: Number(eventsCount?.count || 0),
        total_violations: Number(violationsCount?.count || 0),
        critical_incidents: Number(criticalIncidents?.count || 0),
        high_incidents: Number(highIncidents?.count || 0),
        open_incidents: Number(openIncidents?.count || 0),
        active_ai_services: Number(activeServices?.count || 0),
      },
    });
  } catch (err: any) {
    console.error('[-] Error fetching analytics overview:', err);
    res.status(500).json({ error: 'Database Error', message: 'Failed to compute analytics overview.' });
  }
}

export async function getTrends(req: Request, res: Response): Promise<void> {
  try {
    // 1. Events by AI Service
    const byService = await db.query(
      `SELECT s.name, s.is_sanctioned, count(e.id) as event_count
       FROM ai_services s
       LEFT JOIN events e ON s.id = e.ai_service_id
       GROUP BY s.id, s.name, s.is_sanctioned
       ORDER BY event_count DESC`
    );

    // 2. Detections by Category
    const byCategory = await db.query(
      `SELECT category, count(*) as count
       FROM detections
       GROUP BY category
       ORDER BY count DESC`
    );

    // 3. Incidents by Severity
    const bySeverity = await db.query(
      `SELECT severity, count(*) as count
       FROM incidents
       GROUP BY severity
       ORDER BY count DESC`
    );

    // 4. Incidents by Status
    const byStatus = await db.query(
      `SELECT status, count(*) as count
       FROM incidents
       GROUP BY status`
    );

    res.status(200).json({
      trends: {
        by_service: byService.map((s) => ({
          name: s.name,
          is_sanctioned: Boolean(s.is_sanctioned),
          count: Number(s.event_count || 0),
        })),
        by_category: byCategory.map((c) => ({
          category: c.category,
          count: Number(c.count || 0),
        })),
        by_severity: bySeverity.map((s) => ({
          severity: s.severity,
          count: Number(s.count || 0),
        })),
        by_status: byStatus.map((st) => ({
          status: st.status,
          count: Number(st.count || 0),
        })),
      },
    });
  } catch (err: any) {
    console.error('[-] Error fetching trends:', err);
    res.status(500).json({ error: 'Database Error', message: 'Failed to compute analytics trends.' });
  }
}
