"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyEngine = exports.PolicyEngine = void 0;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
class PolicyEngine {
    /**
     * Evaluates detected entities against active organizational security policies.
     */
    async evaluate(eventId, detectionResult) {
        if (detectionResult.detections_count === 0) {
            return [];
        }
        // Fetch all active security policies
        const policies = await database_1.db.query('SELECT id, name, description, target_category, severity, action, is_active FROM policies WHERE is_active = 1 OR is_active = true');
        const violations = [];
        // Group detected findings by category
        const findingsByCategory = {};
        for (const d of detectionResult.detections) {
            if (!findingsByCategory[d.category]) {
                findingsByCategory[d.category] = [];
            }
            findingsByCategory[d.category].push(`${d.subcategory} (${d.evidence_masked})`);
        }
        // Evaluate each active policy
        for (const policy of policies) {
            const matchedFindings = findingsByCategory[policy.target_category];
            if (matchedFindings && matchedFindings.length > 0) {
                const violationId = (0, uuid_1.v4)();
                // Persist policy violation to database
                await database_1.db.execute(`INSERT INTO policy_violations (id, event_id, policy_id, severity, matched_criteria)
           VALUES ($1, $2, $3, $4, $5)`, [
                    violationId,
                    eventId,
                    policy.id,
                    policy.severity,
                    JSON.stringify(matchedFindings),
                ]);
                violations.push({
                    policy_id: policy.id,
                    policy_name: policy.name,
                    category: policy.target_category,
                    severity: policy.severity,
                    action: policy.action,
                    matched_findings: matchedFindings,
                });
            }
        }
        return violations;
    }
}
exports.PolicyEngine = PolicyEngine;
exports.policyEngine = new PolicyEngine();
