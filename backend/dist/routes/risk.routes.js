"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const risk_controller_1 = require("../controllers/risk.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/weights', auth_1.authenticateToken, risk_controller_1.getRiskWeights);
router.put('/weights', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), risk_controller_1.updateRiskWeights);
exports.default = router;
