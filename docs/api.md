# REST API Specification

## AI-Powered Shadow AI Data Leakage Detection & Risk Assessment Platform
*Version: 1.0.0*  
*Base URL: `http://localhost:5000/api/v1`*

All API endpoints accept and return `application/json`. Authenticated routes require an HTTP Bearer JWT token in the `Authorization` header:
```http
Authorization: Bearer <jwt_token>
```

---

## 1. System & Health

### `GET /health`
*Public* — Verifies API Gateway operational status and database connectivity.

**Response (200 OK):**
```json
{
  "status": "HEALTHY",
  "service": "Shadow AI Defense API Gateway",
  "timestamp": "2026-10-08T03:30:00.000Z"
}
```

---

## 2. Authentication & Identity (`/auth`)

### `POST /auth/login`
*Public* — Authenticates an administrator or SOC analyst and returns a signed JSON Web Token (JWT).

**Request Body:**
```json
{
  "username": "analyst",
  "password": "Analyst@12345!"
}
```

**Response (200 OK):**
```json
{
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "u-002",
    "username": "analyst",
    "email": "analyst@shadow-ai-defense.local",
    "role": "SECURITY_ANALYST",
    "full_name": "Tier-2 Security Analyst"
  }
}
```

### `GET /auth/me`
*Authenticated (`ADMIN`, `SECURITY_ANALYST`)* — Retrieves active user profile information decoded from JWT.

---

## 3. Events & Detection (`/events`)

### `POST /events/scan`
*Public / Sandbox* — Sub-millisecond in-memory sensitive data analysis. Does not persist records to the database. Used for pre-submission DLP checks.

**Request Body:**
```json
{
  "prompt_text": "Need help reviewing this code with AWS key AKIAIOSFODNN7EXAMPLE and IP 192.168.1.50"
}
```

**Response (200 OK):**
```json
{
  "detections_count": 2,
  "categories": ["SECRET", "INFRASTRUCTURE"],
  "overall_severity": "CRITICAL",
  "detections": [
    {
      "category": "SECRET",
      "subcategory": "AWS_ACCESS_KEY",
      "confidence": 0.99,
      "evidence_masked": "AKIA*************PLE",
      "entropy_score": 4.52
    },
    {
      "category": "INFRASTRUCTURE",
      "subcategory": "RFC1918_PRIVATE_IP",
      "confidence": 0.95,
      "evidence_masked": "[REDACTED_RFC1918_PRIVATE_IP: 192.168.*.*]"
    }
  ],
  "redacted_text": "Need help reviewing this code with AWS key AKIA*************PLE and IP [REDACTED_RFC1918_PRIVATE_IP: 192.168.*.*]",
  "detection_latency_ms": 0.42
}
```

### `POST /events/ingest`
*Public / Endpoint Agent* — Core pipeline entry point. Ingests usage telemetry, executes multi-category detection, evaluates policy violations, computes deterministic risk scores, and escalates incidents.

**Request Body:**
```json
{
  "user_identifier": "sarah.engineer@megacorp.internal",
  "device_info": {
    "hostname": "ENG-WIN11-042",
    "ip_address": "10.0.1.42",
    "os": "Windows 11",
    "department": "Engineering"
  },
  "ai_service": "ChatGPT (OpenAI)",
  "destination_url": "https://chatgpt.com/backend-api/conversation",
  "prompt_text": "CONFIDENTIAL: Debug this script with AKIA1111222233334444 and Postgres postgresql://dbuser:SecretPass123@10.0.1.25:5432/finance_db",
  "event_type": "PROMPT_SUBMISSION"
}
```

**Response (201 Created):**
```json
{
  "message": "AI usage event successfully analyzed and persisted",
  "event_id": "4bbfe67e-1234-5678-90ab-cdef12345678",
  "user_id": "u-eng-042",
  "device_id": "d-eng-042",
  "service": {
    "id": "chatgpt",
    "name": "ChatGPT (OpenAI)",
    "is_sanctioned": false
  },
  "prompt_length": 142,
  "prompt_sha256": "38b8c9fad32440c5...",
  "detections_count": 3,
  "detections": [...],
  "policy_violations_count": 2,
  "policy_violations": [
    {
      "policy_id": "pol-01",
      "policy_code": "POL-01",
      "policy_name": "Zero-Tolerance Secret & Credential Exfiltration",
      "severity": "CRITICAL"
    }
  ],
  "risk_assessment": {
    "total_score": 100,
    "severity": "CRITICAL",
    "breakdown": [
      { "category": "SECRET", "weight": 50, "count": 1, "subtotal": 50 },
      { "category": "INFRASTRUCTURE", "weight": 25, "count": 1, "subtotal": 25 },
      { "category": "CONFIDENTIAL", "weight": 20, "count": 1, "subtotal": 20 },
      { "category": "UNSANCTIONED_SERVICE", "subtotal": 20 }
    ]
  },
  "incident_created": true,
  "incident_id": "efd46c98-805d-4f3f-bdea-d51ad5e79885",
  "timestamp": "2026-10-08T03:35:00.000Z"
}
```

### `GET /events`
*Authenticated (`ADMIN`, `SECURITY_ANALYST`)* — Returns paginated audit trail of ingested events with user and device associations.
*Query params: `page` (default: 1), `limit` (default: 20)*.

---

## 4. Incidents & SOC Investigation (`/incidents`)

### `GET /incidents`
*Authenticated (`ADMIN`, `SECURITY_ANALYST`)* — Queries SOC incident queue with optional status and severity filtering.
*Query params: `status` (`OPEN`, `INVESTIGATING`, `CONTAINED`, `RESOLVED`, `CLOSED`), `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)*.

### `GET /incidents/:id`
*Authenticated (`ADMIN`, `SECURITY_ANALYST`)* — Retrieves complete incident dossier including:
* Core metadata (title, severity, composite risk score, status)
* Linked event metadata and cryptographic SHA-256 hash
* Irreversibly masked detection evidence table
* Additive risk factor breakdown
* Complete audit timeline with timestamp and analyst actor IDs

### `PATCH /incidents/:id/status`
*Authenticated (`ADMIN`, `SECURITY_ANALYST`)* — Advances incident lifecycle through the formal SOC state machine.
*State Machine: `OPEN` $\rightarrow$ `INVESTIGATING` $\rightarrow$ `CONTAINED` $\rightarrow$ `RESOLVED` $\rightarrow$ `CLOSED`*

**Request Body:**
```json
{
  "status": "INVESTIGATING",
  "notes": "Analyst assigned. IAM team alerted to rotate cloud credentials."
}
```

**Response (200 OK):**
```json
{
  "message": "Incident status updated successfully",
  "incident_id": "efd46c98-805d-4f3f-bdea-d51ad5e79885",
  "previous_status": "OPEN",
  "new_status": "INVESTIGATING"
}
```

### `POST /incidents/:id/ai-analyze`
*Authenticated (`ADMIN`, `SECURITY_ANALYST`)* — Triggers the AI Security Analyst to generate a context-tailored threat assessment, adversary perspective, and NIST-aligned containment runbook.

**Response (200 OK):**
```json
{
  "message": "AI analysis completed and incident dossier updated",
  "analysis": {
    "incident_summary": "Automated detection of SECRET, INFRASTRUCTURE exfiltration to unsanctioned external service 'ChatGPT'...",
    "threat_actor_perspective": "Exposed cryptographic tokens or cloud access keys can be harvested if external sessions are cached...",
    "potential_impact": "Critical cloud compromise, unauthorized access to S3/blob storage...",
    "investigation_steps": [
      "Identify AWS/cloud account identity linked to the masked key prefix.",
      "Search AWS CloudTrail for unusual API calls originating from non-corporate IPs.",
      "Confirm whether exposed database port is firewalled from public internet access."
    ],
    "remediation_runbook": [
      "IMMEDIATE ERADICATION: Revoke and rotate the exposed access key in the AWS IAM Console.",
      "Verify firewall ingress rules to ensure database endpoints reject non-VPC traffic.",
      "Audit all active session tokens and invalidate long-lived credentials."
    ],
    "engine": "EXPERT_RULE_SYNTHESIZER (Local Fallback)"
  }
}
```

---

## 5. Security Policies (`/policies`)

### `GET /policies`
*Authenticated (`ADMIN`, `SECURITY_ANALYST`)* — Returns active organizational DLP policies, trigger categories, and severity thresholds.

### `PUT /policies/:id`
*Authenticated (`ADMIN` ONLY — RBAC Guarded)* — Updates policy parameters, description, or activation toggle.

**Request Body:**
```json
{
  "name": "Updated Secret Policy",
  "severity": "CRITICAL",
  "is_active": true
}
```

---

## 6. Risk Weights Configuration (`/risk`)

### `GET /risk/weights`
*Authenticated (`ADMIN`, `SECURITY_ANALYST`)* — Returns active mathematical risk weighting factors.

### `PUT /risk/weights`
*Authenticated (`ADMIN` ONLY — RBAC Guarded)* — Adjusts category sensitivity weights or service modifiers.

**Request Body:**
```json
{
  "category_weights": {
    "SECRET": 50,
    "CREDENTIAL": 40,
    "INFRASTRUCTURE": 25,
    "CONFIDENTIAL": 20,
    "PII": 15,
    "CODE": 10
  },
  "service_modifiers": {
    "UNSANCTIONED": 20
  }
}
```

---

## 7. SOC Analytics (`/analytics`)

### `GET /analytics/overview`
*Authenticated (`ADMIN`, `SECURITY_ANALYST`)* — Aggregates real database metrics:
* `total_events`: Cumulative telemetry entries
* `total_violations`: Distinct policy breach records
* `critical_incidents`: High-severity incidents requiring triage
* `high_incidents`: Sub-critical security alerts
* `open_incidents`: Unresolved security backlog
* `active_ai_services`: Unique AI services recorded in telemetry

### `GET /analytics/trends`
*Authenticated (`ADMIN`, `SECURITY_ANALYST`)* — Aggregates metric distributions for dashboard charting:
* Breakdown by AI service (Sanctioned vs Unsanctioned)
* Breakdown by detection category (Secret, Credential, Infra, PII, Code, Confidential)
* Breakdown by incident severity and current state machine status
