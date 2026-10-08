import { PolicySeverity } from '../types';
import { DetectionResult } from './detection.service';
import { EvaluatedViolation } from './policy.engine';
export declare class IncidentService {
    /**
     * Evaluates if event warrants incident creation and generates SOC incident ticket.
     */
    evaluateAndCreateIncident(params: {
        eventId: string;
        userId?: string;
        serviceName: string;
        riskScore: number;
        severity: PolicySeverity;
        detectionResult: DetectionResult;
        violations: EvaluatedViolation[];
    }): Promise<{
        incidentCreated: boolean;
        incidentId?: string;
    }>;
}
export declare const incidentService: IncidentService;
