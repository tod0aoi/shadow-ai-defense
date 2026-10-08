"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Sandbox scan endpoint (immediate scan without persistence)
router.post('/scan', event_controller_1.scanText);
// Ingestion endpoint (public/token-authenticated for monitored endpoints)
router.post('/ingest', validation_1.validateIngestPayload, event_controller_1.ingestEvent);
// Query endpoints (protected for SOC analysts & admins)
router.get('/', auth_1.authenticateToken, event_controller_1.getEvents);
router.get('/:id', auth_1.authenticateToken, event_controller_1.getEventById);
exports.default = router;
