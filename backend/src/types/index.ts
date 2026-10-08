// =====================================================================
// DOMAIN MODELS & TYPES FOR SHADOW AI DEFENSE PLATFORM
// =====================================================================

export type UserRole = 'ADMIN' | 'SECURITY_ANALYST';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  hostname: string;
  ip_address: string;
  mac_address?: string;
  os?: string;
  department?: string;
  last_seen: string;
}

export interface AIService {
  id: string;
  name: string;
  category: string;
  domains: string;
  is_sanctioned: boolean;
  base_risk_weight: number;
  created_at: string;
}

export type EventType = 'PROMPT_SUBMISSION' | 'FILE_UPLOAD' | 'CONVERSATION_EXPORT';

export interface IngestEventDTO {
  user_identifier: string;
  device_info: {
    hostname: string;
    ip_address: string;
    os?: string;
    department?: string;
  };
  ai_service: string;
  destination_url: string;
  event_type?: EventType;
  prompt_text: string;
}

export interface SecurityEvent {
  id: string;
  user_id?: string;
  device_id?: string;
  ai_service_id: string;
  event_type: EventType;
  prompt_length: number;
  prompt_sha256: string;
  redacted_payload: string;
  destination_url: string;
  timestamp: string;
}

export type DetectionCategory =
  | 'PII'
  | 'CREDENTIAL'
  | 'SECRET'
  | 'INFRASTRUCTURE'
  | 'CODE'
  | 'CONFIDENTIAL';

export interface Detection {
  id: string;
  event_id: string;
  category: DetectionCategory;
  subcategory: string;
  confidence: number;
  evidence_masked: string;
  entropy_score?: number;
  created_at: string;
}

export type PolicySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PolicyAction = 'LOG' | 'ALERT' | 'BLOCK_SIMULATED';

export interface Policy {
  id: string;
  name: string;
  description: string;
  target_category: DetectionCategory;
  severity: PolicySeverity;
  action: PolicyAction;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PolicyViolation {
  id: string;
  event_id: string;
  policy_id: string;
  severity: PolicySeverity;
  matched_criteria: string;
  created_at: string;
}

export interface RiskFactorBreakdown {
  category: string;
  score_contribution: number;
  reason: string;
}

export interface RiskAssessment {
  id: string;
  event_id: string;
  total_score: number;
  severity_level: PolicySeverity;
  breakdown_factors: RiskFactorBreakdown[];
  calculated_at: string;
}

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';

export interface Incident {
  id: string;
  event_id: string;
  title: string;
  severity: PolicySeverity;
  risk_score: number;
  status: IncidentStatus;
  assigned_to?: string;
  ai_summary?: string;
  ai_remediation?: string;
  created_at: string;
  updated_at: string;
}

export interface IncidentTimeline {
  id: string;
  incident_id: string;
  actor_id?: string;
  action: string;
  notes?: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  target_entity: string;
  target_id?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}
