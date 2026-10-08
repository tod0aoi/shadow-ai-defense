export interface DetectionResult {
    detections_count: number;
    categories: string[];
    overall_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'NONE';
    detections: Array<{
        category: string;
        subcategory: string;
        confidence: number;
        evidence_masked: string;
        entropy_score?: number;
    }>;
    redacted_text: string;
    processing_time_ms: number;
}
/**
 * Attempts to call Python microservice via HTTP; falls back to direct child_process if service is offline.
 */
export declare function executeDetectionScan(promptText: string): Promise<DetectionResult>;
