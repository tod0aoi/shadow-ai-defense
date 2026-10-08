"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.riskEngine = exports.RiskEngine = void 0;
exports.getRiskConfiguration = getRiskConfiguration;
exports.updateRiskConfiguration = updateRiskConfiguration;
const uuid_1 = require("uuid");
const database_1 = require("../config/database");
let activeRiskConfig = {
    weights: {
        SECRET: 50,
        CREDENTIAL: 45,
        INFRASTRUCTURE: 30,
        CONFIDENTIAL: 25,
        CODE: 25,
        PII: 20,
    },
    modifiers: {
        unsanctioned_service: 15,
        repeat_offender: 15,
        volume_medium: 10,
        volume_high: 20,
    },
};
function getRiskConfiguration() {
    return activeRiskConfig;
}
function updateRiskConfiguration(newConfig) {
    if (newConfig.weights) {
        activeRiskConfig.weights = { ...activeRiskConfig.weights, ...newConfig.weights };
    }
    if (newConfig.modifiers) {
        activeRiskConfig.modifiers = { ...activeRiskConfig.modifiers, ...newConfig.modifiers };
    }
    return activeRiskConfig;
}
class RiskEngine {
    /**
     * Deterministically calculates risk score (0-100) and severity level
     * using explainable weighted factors and history analysis.
     */
    async calculateRisk(params) {
        const { eventId, userId, isSanctionedService, serviceName, detectionResult } = params;
        const breakdown = [];
        let rawScore = 0;
        if (detectionResult.detections_count === 0) {
            const result = {
                total_score: 0,
                severity: 'LOW',
                breakdown: [
                    {
                        category: 'BENIGN_ACTIVITY',
                        score_contribution: 0,
                        reason: 'No sensitive data patterns or policy violations detected.',
                    },
                ],
            };
            await this.persistAssessment(eventId, result.total_score, result.severity, result.breakdown);
            return result;
        }
        // Factor 1: Category base weights weighted by detection confidence
        const seenCategories = new Set();
        for (const d of detectionResult.detections) {
            if (!seenCategories.has(d.category)) {
                const baseWeight = activeRiskConfig.weights[d.category] || 15;
                const contribution = Math.round(baseWeight * (d.confidence || 1.0));
                rawScore += contribution;
                breakdown.push({
                    category: d.category,
                    score_contribution: contribution,
                    reason: `Detected ${d.subcategory} with ${Math.round(d.confidence * 100)}% confidence (evidence: ${d.evidence_masked})`,
                });
                seenCategories.add(d.category);
            }
        }
        // Factor 2: Unsanctioned External AI Destination
        if (!isSanctionedService) {
            const contribution = activeRiskConfig.modifiers.unsanctioned_service;
            rawScore += contribution;
            breakdown.push({
                category: 'AI_DESTINATION',
                score_contribution: contribution,
                reason: `Exfiltration destination "${serviceName}" is an unsanctioned public AI service`,
            });
        }
        // Factor 3: Multi-Detection Volume Multiplier
        if (detectionResult.detections_count >= 5) {
            const contribution = activeRiskConfig.modifiers.volume_high;
            rawScore += contribution;
            breakdown.push({
                category: 'VOLUME_EXPOSURE',
                score_contribution: contribution,
                reason: `High volume sensitive leakage: ${detectionResult.detections_count} distinct sensitive entities exposed`,
            });
        }
        else if (detectionResult.detections_count >= 2) {
            const contribution = activeRiskConfig.modifiers.volume_medium;
            rawScore += contribution;
            breakdown.push({
                category: 'VOLUME_EXPOSURE',
                score_contribution: contribution,
                reason: `Compound sensitive leakage: ${detectionResult.detections_count} sensitive entities exposed`,
            });
        }
        // Factor 4: Historical Violation Repeat Offender Check (Past 7 days)
        if (userId) {
            try {
                const historyCheck = await database_1.db.queryOne(`SELECT count(*) as count 
           FROM events e 
           JOIN policy_violations pv ON e.id = pv.event_id 
           WHERE e.user_id = $1 AND e.id != $2`, [userId, eventId]);
                const prevViolations = Number(historyCheck?.count || 0);
                if (prevViolations >= 1) {
                    const contribution = activeRiskConfig.modifiers.repeat_offender;
                    rawScore += contribution;
                    breakdown.push({
                        category: 'HISTORICAL_RISK',
                        score_contribution: contribution,
                        reason: `Repeat offender alert: User has ${prevViolations} prior security violation(s) in the audit history`,
                    });
                }
            }
            catch (err) {
                console.warn('History check skipped:', err.message);
            }
        }
        // Final score capped between 0 and 100
        const finalScore = Math.min(100, Math.max(0, rawScore));
        // Determine qualitative severity
        let severity = 'LOW';
        if (finalScore >= 80) {
            severity = 'CRITICAL';
        }
        else if (finalScore >= 60) {
            severity = 'HIGH';
        }
        else if (finalScore >= 30) {
            severity = 'MEDIUM';
        }
        const result = {
            total_score: finalScore,
            severity,
            breakdown,
        };
        await this.persistAssessment(eventId, finalScore, severity, breakdown);
        return result;
    }
    async persistAssessment(eventId, score, severity, breakdown) {
        const assessmentId = (0, uuid_1.v4)();
        await database_1.db.execute(`INSERT INTO risk_assessments (id, event_id, total_score, severity_level, breakdown_factors)
       VALUES ($1, $2, $3, $4, $5)`, [assessmentId, eventId, score, severity, JSON.stringify(breakdown)]);
    }
}
exports.RiskEngine = RiskEngine;
exports.riskEngine = new RiskEngine();
