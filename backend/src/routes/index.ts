import { Router } from 'express';
import authRoutes from './auth.routes';
import eventRoutes from './event.routes';
import policyRoutes from './policy.routes';
import incidentRoutes from './incident.routes';
import analyticsRoutes from './analytics.routes';
import riskRoutes from './risk.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/events', eventRoutes);
apiRouter.use('/policies', policyRoutes);
apiRouter.use('/incidents', incidentRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/risk', riskRoutes);

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'Shadow AI Defense API Gateway',
    timestamp: new Date().toISOString(),
  });
});

export default apiRouter;
