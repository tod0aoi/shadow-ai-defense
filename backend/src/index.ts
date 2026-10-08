import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { db } from './config/database';
import apiRouter from './routes';

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: '*', // Configurable in production
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// API Version 1 Router
app.use('/api/v1', apiRouter);

// Serve Frontend SPA if built
import path from 'path';
import fs from 'fs';

const candidateDirs = [
  path.resolve(__dirname, '../../../frontend/build'),
  path.resolve(__dirname, '../../frontend/build'),
  path.resolve(__dirname, '../../../frontend/dist'),
  path.resolve(__dirname, '../../frontend/dist'),
];
const activeDist = candidateDirs.find((dir) => fs.existsSync(dir)) || null;

if (activeDist) {
  app.use(express.static(activeDist));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(activeDist, 'index.html'));
  });
} else {
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      platform: 'AI-Powered Shadow AI Data Leakage Detection & Risk Assessment Platform',
      version: '1.0.0',
      endpoints: {
        health: '/api/v1/health',
        auth: '/api/v1/auth',
        events: '/api/v1/events',
        incidents: '/api/v1/incidents',
        policies: '/api/v1/policies',
        analytics: '/api/v1/analytics',
      },
    });
  });
}

// 404 Handler for API routes
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.baseUrl} does not exist.`,
  });
});

// Global Error Handler (prevents leaking internal stack traces)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[-] Unhandled Exception:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'production' ? 'An unexpected error occurred.' : err.message,
  });
});

// Start Server & Bootstrap Database
async function startServer() {
  try {
    console.log('[*] Checking database initialization status...');
    await db.initSchema();
    await db.seedDefaults();
    console.log('[+] Database verified and ready.');

    app.listen(config.port, () => {
      console.log(`[+] Shadow AI Defense Backend running on port ${config.port}`);
      console.log(`[+] Environment: ${config.nodeEnv}`);
      console.log(`[+] Base API: http://localhost:${config.port}/api/v1`);
    });
  } catch (err: any) {
    console.error('[-] Fatal Error during backend startup:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export { app, startServer };
export default app;
