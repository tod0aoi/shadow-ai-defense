import { Request, Response } from 'express';
import { getRiskConfiguration, updateRiskConfiguration } from '../services/risk.engine';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export async function getRiskWeights(req: Request, res: Response): Promise<void> {
  const config = getRiskConfiguration();
  res.status(200).json({ config });
}

export async function updateRiskWeights(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { weights, modifiers } = req.body;
  const clientIp = (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for']) || req.socket.remoteAddress || '127.0.0.1';

  try {
    const updated = updateRiskConfiguration({ weights, modifiers });

    await logAuditEvent({
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
  } catch (err: any) {
    console.error('[-] Error updating risk weights:', err);
    res.status(500).json({ error: 'Config Error', message: 'Failed to update risk configuration.' });
  }
}
