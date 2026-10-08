import { DetectionResult } from './detection.service';
export interface EvaluatedViolation {
    policy_id: string;
    policy_name: string;
    category: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    action: 'LOG' | 'ALERT' | 'BLOCK_SIMULATED';
    matched_findings: string[];
}
export declare class PolicyEngine {
    /**
     * Evaluates detected entities against active organizational security policies.
     */
    evaluate(eventId: string, detectionResult: DetectionResult): Promise<EvaluatedViolation[]>;
}
export declare const policyEngine: PolicyEngine;
