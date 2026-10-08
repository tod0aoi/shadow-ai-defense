export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'SECURITY_ANALYST';
  full_name: string;
}

export interface SecurityEvent {
  id: string;
  user_email?: string;
  username?: string;
  device_hostname?: string;
  device_ip?: string;
  service_name?: string;
  service_sanctioned?: boolean | number;
  event_type: string;
  prompt_length: number;
  prompt_sha256: string;
  redacted_payload: string;
  destination_url: string;
  timestamp: string;
  risk_score?: number;
  severity?: SeverityLevel;
  incident_id?: string;
  incident_status?: IncidentStatus;
}

export interface Detection {
  id: string;
  category: string;
  subcategory: string;
  confidence: number;
  evidence_masked: string;
  entropy_score?: number;
  created_at?: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  target_category: string;
  severity: SeverityLevel;
  action: 'LOG' | 'ALERT' | 'BLOCK_SIMULATED';
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface RiskFactor {
  category: string;
  score_contribution: number;
  reason: string;
}

export interface RiskAssessment {
  total_score: number;
  severity_level: SeverityLevel;
  breakdown_factors: RiskFactor[];
  calculated_at: string;
}

export interface Incident {
  id: string;
  event_id: string;
  title: string;
  severity: SeverityLevel;
  risk_score: number;
  status: IncidentStatus;
  assigned_user?: string;
  ai_summary?: string;
  ai_remediation?: string;
  created_at: string;
  updated_at: string;
  service_name?: string;
  event_timestamp?: string;
}

export interface IncidentDetail {
  incident: Incident & {
    redacted_payload?: string;
    destination_url?: string;
    prompt_length?: number;
    device_hostname?: string;
    device_ip?: string;
    service_sanctioned?: boolean | number;
  };
  detections: Detection[];
  timeline: Array<{
    id: string;
    action: string;
    notes?: string;
    actor_name?: string;
    timestamp: string;
  }>;
}

export interface AnalyticsOverview {
  total_events: number;
  total_violations: number;
  critical_incidents: number;
  high_incidents: number;
  open_incidents: number;
  active_ai_services: number;
}

export interface AnalyticsTrends {
  by_service: Array<{ name: string; is_sanctioned: boolean; count: number }>;
  by_category: Array<{ category: string; count: number }>;
  by_severity: Array<{ severity: string; count: number }>;
  by_status: Array<{ status: string; count: number }>;
}
