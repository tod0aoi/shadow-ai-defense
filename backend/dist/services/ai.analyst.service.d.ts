export interface AIAnalysisResult {
    incident_summary: string;
    threat_actor_perspective: string;
    potential_impact: string;
    investigation_steps: string[];
    remediation_runbook: string[];
    engine: string;
}
export declare function runAIIncidentAnalysis(incidentId: string): Promise<AIAnalysisResult>;
