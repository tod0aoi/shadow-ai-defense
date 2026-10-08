import { Request, Response } from 'express';
import { db } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export async function getPolicies(req: Request, res: Response): Promise<void> {
  try {
    const policies = await db.query(
      'SELECT id, name, description, target_category, severity, action, is_active, created_at, updated_at FROM policies ORDER BY created_at ASC'
    );
    res.status(200).json({ policies });
  } catch (err: any) {
    console.error('[-] Error fetching policies:', err);
    res.status(500).json({ error: 'Database Error', message: 'Failed to retrieve security policies.' });
  }
}

export async function updatePolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
  const id = (Array.isArray(req.params.id) ? req.params.id[0] : req.params.id) as string;
  const { severity, action, is_active } = req.body;
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || req.socket.remoteAddress || '127.0.0.1';

  try {
    const policy = await db.queryOne('SELECT * FROM policies WHERE id = $1', [id]);
    if (!policy) {
      res.status(404).json({ error: 'Not Found', message: `Policy with id ${id} not found.` });
      return;
    }

    const updatedSeverity = severity || policy.severity;
    const updatedAction = action || policy.action;
    const updatedIsActive = typeof is_active === 'boolean' ? is_active : policy.is_active;

    await db.execute(
      `UPDATE policies 
       SET severity = $1, action = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [updatedSeverity, updatedAction, updatedIsActive, id]
    );

    // Audit the policy change
    await logAuditEvent({
      actor_id: req.user?.id,
      action: 'POLICY_MODIFIED',
      target_entity: 'policies',
      target_id: id,
      details: {
        previous: { severity: policy.severity, action: policy.action, is_active: policy.is_active },
        updated: { severity: updatedSeverity, action: updatedAction, is_active: updatedIsActive },
      },
      ip_address: clientIp,
    });

    res.status(200).json({
      message: 'Policy successfully updated',
      policy: {
        id,
        name: policy.name,
        severity: updatedSeverity,
        action: updatedAction,
        is_active: updatedIsActive,
      },
    });
  } catch (err: any) {
    console.error('[-] Error updating policy:', err);
    res.status(500).json({ error: 'Database Error', message: 'Failed to update security policy.' });
  }
}
