"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const event_routes_1 = __importDefault(require("./event.routes"));
const policy_routes_1 = __importDefault(require("./policy.routes"));
const incident_routes_1 = __importDefault(require("./incident.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const risk_routes_1 = __importDefault(require("./risk.routes"));
const apiRouter = (0, express_1.Router)();
apiRouter.use('/auth', auth_routes_1.default);
apiRouter.use('/events', event_routes_1.default);
apiRouter.use('/policies', policy_routes_1.default);
apiRouter.use('/incidents', incident_routes_1.default);
apiRouter.use('/analytics', analytics_routes_1.default);
apiRouter.use('/risk', risk_routes_1.default);
// Health check endpoint
apiRouter.get('/health', (req, res) => {
    res.status(200).json({
        status: 'HEALTHY',
        service: 'Shadow AI Defense API Gateway',
        timestamp: new Date().toISOString(),
    });
});
exports.default = apiRouter;
