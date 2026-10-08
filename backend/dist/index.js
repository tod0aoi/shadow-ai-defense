"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
exports.app = app;
// Security Middlewares
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: '*', // Configurable in production
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Body parsing
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// API Version 1 Router
app.use('/api/v1', routes_1.default);
// Serve Frontend SPA if built
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const candidateDirs = [
    path_1.default.resolve(__dirname, '../../../frontend/build'),
    path_1.default.resolve(__dirname, '../../frontend/build'),
    path_1.default.resolve(__dirname, '../../../frontend/dist'),
    path_1.default.resolve(__dirname, '../../frontend/dist'),
];
const activeDist = candidateDirs.find((dir) => fs_1.default.existsSync(dir)) || null;
if (activeDist) {
    app.use(express_1.default.static(activeDist));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api'))
            return next();
        res.sendFile(path_1.default.join(activeDist, 'index.html'));
    });
}
else {
    app.get('/', (req, res) => {
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
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `API endpoint ${req.method} ${req.baseUrl} does not exist.`,
    });
});
// Global Error Handler (prevents leaking internal stack traces)
app.use((err, req, res, next) => {
    console.error('[-] Unhandled Exception:', err);
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: env_1.config.nodeEnv === 'production' ? 'An unexpected error occurred.' : err.message,
    });
});
// Start Server & Bootstrap Database
async function startServer() {
    try {
        console.log('[*] Checking database initialization status...');
        await database_1.db.initSchema();
        await database_1.db.seedDefaults();
        console.log('[+] Database verified and ready.');
        app.listen(env_1.config.port, () => {
            console.log(`[+] Shadow AI Defense Backend running on port ${env_1.config.port}`);
            console.log(`[+] Environment: ${env_1.config.nodeEnv}`);
            console.log(`[+] Base API: http://localhost:${env_1.config.port}/api/v1`);
        });
    }
    catch (err) {
        console.error('[-] Fatal Error during backend startup:', err);
        process.exit(1);
    }
}
if (require.main === module) {
    startServer();
}
exports.default = app;
