import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { DetectionResult } from './detection.service';
import { Policy, PolicyViolation } from '../types';

export interface EvaluatedViolation {
  policy_id: string;
  policy_name: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  action: 'LOG' | 'ALERT' | 'BLOCK_SIMULATED';
  matched_findings: string[];
}

export class PolicyEngine {
  /**
   * Evaluates detected entities against active organizational security policies.
   */
  async evaluate(eventId: string, detectionResult: DetectionResult): Promise<EvaluatedViolation[]> {
    if (detectionResult.detections_count === 0) {
      return [];
    }

    // Fetch all active security policies
    const policies = await db.query<Policy>(
      'SELECT id, name, description, target_category, severity, action, is_active FROM policies WHERE is_active = 1 OR is_active = true'
    );

    const violations: EvaluatedViolation[] = [];

    // Group detected findings by category
    const findingsByCategory: Record<string, string[]> = {};
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
        const violationId = uuidv4();

        // Persist policy violation to database
        await db.execute(
          `INSERT INTO policy_violations (id, event_id, policy_id, severity, matched_criteria)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            violationId,
            eventId,
            policy.id,
            policy.severity,
            JSON.stringify(matchedFindings),
          ]
        );

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

export const policyEngine = new PolicyEngine();
