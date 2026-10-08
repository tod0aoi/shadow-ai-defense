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
export declare function getRiskConfiguration(): RiskConfig;
export declare function updateRiskConfiguration(newConfig: Partial<RiskConfig>): RiskConfig;
export interface RiskCalculationResult {
    total_score: number;
    severity: PolicySeverity;
    breakdown: RiskFactorBreakdown[];
}
export declare class RiskEngine {
    /**
     * Deterministically calculates risk score (0-100) and severity level
     * using explainable weighted factors and history analysis.
     */
    calculateRisk(params: {
        eventId: string;
        userId?: string;
        isSanctionedService: boolean;
        serviceName: string;
        detectionResult: DetectionResult;
        violations: EvaluatedViolation[];
    }): Promise<RiskCalculationResult>;
    private persistAssessment;
}
export declare const riskEngine: RiskEngine;
