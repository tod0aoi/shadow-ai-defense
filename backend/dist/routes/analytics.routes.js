"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/overview', auth_1.authenticateToken, analytics_controller_1.getOverview);
router.get('/trends', auth_1.authenticateToken, analytics_controller_1.getTrends);
exports.default = router;
