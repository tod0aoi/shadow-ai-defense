-- =====================================================================
-- SHADOW AI DATA LEAKAGE DETECTION & RISK ASSESSMENT PLATFORM
-- Relational Database Schema (PostgreSQL Compatible DDL)
-- =====================================================================

-- 1. USERS & ACCESS CONTROL (RBAC)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'SECURITY_ANALYST')),
    full_name VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. MONITORED DEVICES (Asset Inventory)
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(36) PRIMARY KEY,
    hostname VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    mac_address VARCHAR(17),
    os VARCHAR(50),
    department VARCHAR(50) DEFAULT 'Engineering',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. AI SERVICES REGISTRY
CREATE TABLE IF NOT EXISTS ai_services (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'LLM',
    domains TEXT NOT NULL, -- Comma-separated or JSON array of domains
    is_sanctioned BOOLEAN NOT NULL DEFAULT FALSE,
    base_risk_weight INT NOT NULL DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. RAW AI USAGE EVENTS (Normalized event stream)
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    device_id VARCHAR(36) REFERENCES devices(id) ON DELETE SET NULL,
    ai_service_id VARCHAR(36) REFERENCES ai_services(id) ON DELETE RESTRICT,
    event_type VARCHAR(50) NOT NULL DEFAULT 'PROMPT_SUBMISSION',
    prompt_length INT NOT NULL,
    prompt_sha256 CHAR(64) NOT NULL,
    redacted_payload TEXT NOT NULL,
    destination_url VARCHAR(500) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. DETECTIONS (Individual sensitive findings per event)
CREATE TABLE IF NOT EXISTS detections (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,       -- PII, CREDENTIAL, SECRET, INFRASTRUCTURE, CODE, CONFIDENTIAL
    subcategory VARCHAR(50) NOT NULL,    -- AWS_KEY, JWT, RFC1918_IP, EMAIL, etc.
    confidence NUMERIC(3, 2) NOT NULL,   -- 0.00 to 1.00
    evidence_masked VARCHAR(255) NOT NULL,
    entropy_score NUMERIC(4, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SECURITY POLICIES
CREATE TABLE IF NOT EXISTS policies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    target_category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    action VARCHAR(20) NOT NULL CHECK (action IN ('LOG', 'ALERT', 'BLOCK_SIMULATED')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. POLICY VIOLATIONS
CREATE TABLE IF NOT EXISTS policy_violations (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    policy_id VARCHAR(36) NOT NULL REFERENCES policies(id) ON DELETE RESTRICT,
    severity VARCHAR(20) NOT NULL,
    matched_criteria TEXT NOT NULL, -- JSON string of matched items
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. RISK ASSESSMENTS
CREATE TABLE IF NOT EXISTS risk_assessments (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    total_score INT NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    breakdown_factors TEXT NOT NULL, -- JSON string storing all additive calculation weights
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. INCIDENTS (Security Operations triage dossier)
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) UNIQUE NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    risk_score INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE')),
    assigned_to VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    ai_summary TEXT,
    ai_remediation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. INCIDENT TIMELINE
CREATE TABLE IF NOT EXISTS incident_timeline (
    id VARCHAR(36) PRIMARY KEY,
    incident_id VARCHAR(36) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    actor_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. AUDIT LOGS (Non-repudiation security trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    actor_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(50) NOT NULL,
    target_id VARCHAR(36),
    details TEXT, -- JSON string
    ip_address VARCHAR(45),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_detections_event_id ON detections(event_id);
CREATE INDEX IF NOT EXISTS idx_detections_category ON detections(category);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_score ON risk_assessments(total_score);
