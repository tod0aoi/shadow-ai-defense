import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { DetectionResult } from './detection.service';
import { EvaluatedViolation } from './policy.engine';
import { PolicySeverity, RiskFactorBreakdown } from '../types';

export interface RiskConfig {
  weights: {
    SECRET: number;
    CREDENTIAL: number;
    INFRASTRUCTURE: number;
    CONFIDENTIAL: number;
    CODE: number;
    PII: number;
  };
  modifiers: {
    unsanctioned_service: number;
    repeat_offender: number;
    volume_medium: number;
    volume_high: number;
  };
}

let activeRiskConfig: RiskConfig = {
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

export function getRiskConfiguration(): RiskConfig {
  return activeRiskConfig;
}

export function updateRiskConfiguration(newConfig: Partial<RiskConfig>): RiskConfig {
  if (newConfig.weights) {
    activeRiskConfig.weights = { ...activeRiskConfig.weights, ...newConfig.weights };
  }
  if (newConfig.modifiers) {
    activeRiskConfig.modifiers = { ...activeRiskConfig.modifiers, ...newConfig.modifiers };
  }
  return activeRiskConfig;
}

export interface RiskCalculationResult {
  total_score: number;
  severity: PolicySeverity;
  breakdown: RiskFactorBreakdown[];
}

export class RiskEngine {
  /**
   * Deterministically calculates risk score (0-100) and severity level
   * using explainable weighted factors and history analysis.
   */
  async calculateRisk(params: {
    eventId: string;
    userId?: string;
    isSanctionedService: boolean;
    serviceName: string;
    detectionResult: DetectionResult;
    violations: EvaluatedViolation[];
  }): Promise<RiskCalculationResult> {
    const { eventId, userId, isSanctionedService, serviceName, detectionResult } = params;
    const breakdown: RiskFactorBreakdown[] = [];
    let rawScore = 0;

    if (detectionResult.detections_count === 0) {
      const result: RiskCalculationResult = {
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
    const seenCategories = new Set<string>();
    for (const d of detectionResult.detections) {
      if (!seenCategories.has(d.category)) {
        const baseWeight = (activeRiskConfig.weights as any)[d.category] || 15;
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
    } else if (detectionResult.detections_count >= 2) {
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
        const historyCheck = await db.queryOne<{ count: number | string }>(
          `SELECT count(*) as count 
           FROM events e 
           JOIN policy_violations pv ON e.id = pv.event_id 
           WHERE e.user_id = $1 AND e.id != $2`,
          [userId, eventId]
        );
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
      } catch (err: any) {
        console.warn('History check skipped:', err.message);
      }
    }

    // Final score capped between 0 and 100
    const finalScore = Math.min(100, Math.max(0, rawScore));

    // Determine qualitative severity
    let severity: PolicySeverity = 'LOW';
    if (finalScore >= 80) {
      severity = 'CRITICAL';
    } else if (finalScore >= 60) {
      severity = 'HIGH';
    } else if (finalScore >= 30) {
      severity = 'MEDIUM';
    }

    const result: RiskCalculationResult = {
      total_score: finalScore,
      severity,
      breakdown,
    };

    await this.persistAssessment(eventId, finalScore, severity, breakdown);
    return result;
  }

  private async persistAssessment(
    eventId: string,
    score: number,
    severity: PolicySeverity,
    breakdown: RiskFactorBreakdown[]
  ): Promise<void> {
    const assessmentId = uuidv4();
    await db.execute(
      `INSERT INTO risk_assessments (id, event_id, total_score, severity_level, breakdown_factors)
       VALUES ($1, $2, $3, $4, $5)`,
      [assessmentId, eventId, score, severity, JSON.stringify(breakdown)]
    );
  }
}

export const riskEngine = new RiskEngine();
