"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const policy_controller_1 = require("../controllers/policy.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Viewing policies is open to both ADMIN and SECURITY_ANALYST
router.get('/', auth_1.authenticateToken, policy_controller_1.getPolicies);
// Modifying policies requires ADMIN role
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)('ADMIN'), policy_controller_1.updatePolicy);
exports.default = router;
