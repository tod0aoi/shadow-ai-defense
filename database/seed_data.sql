-- =====================================================================
-- SHADOW AI DATA LEAKAGE DETECTION & RISK ASSESSMENT PLATFORM
-- Seed Data: Baseline AI Services, Policies, Users, and Monitored Devices
-- =====================================================================

-- 1. SEED USERS
-- Password for admin: Admin@12345!  (bcrypt hash: $2a$10$YkG8d3lQj3yB4WlS2eB9x.sC5MhN7P.Z3w6Q8R9T0U1V2W3X4Y5Z6)
-- Password for analyst: Analyst@12345! (bcrypt hash: $2a$10$ZlH9e4mRk4zC5XmT3fC0y.tD6NiO8Q.a4x7R9S0U1V2W3X4Y5Z6A)
-- Note: Dynamic seeder will generate precise hashes via bcrypt if missing.

INSERT INTO users (id, username, email, password_hash, role, full_name, is_active)
VALUES 
('u1111111-1111-1111-1111-111111111111', 'admin', 'admin@corp.internal', '$2a$10$5j55X6d.5G1i4e2lQv6pEOXp1PqJ1D/eYp1.cO3v6hM4Y0l0f.u3W', 'ADMIN', 'Chief Information Security Officer', TRUE),
('u2222222-2222-2222-2222-222222222222', 'analyst', 'analyst@corp.internal', '$2a$10$5j55X6d.5G1i4e2lQv6pEOXp1PqJ1D/eYp1.cO3v6hM4Y0l0f.u3W', 'SECURITY_ANALYST', 'Lead SOC Incident Analyst', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED MONITORED DEVICES
INSERT INTO devices (id, hostname, ip_address, mac_address, os, department)
VALUES
('d1111111-1111-1111-1111-111111111111', 'CORP-WIN11-ENG01', '10.0.1.45', '00:1A:2B:3C:4D:5E', 'Windows 11 Pro', 'Core Engineering'),
('d2222222-2222-2222-2222-222222222222', 'CORP-MAC-MKT04', '10.0.2.112', 'A1:B2:C3:D4:E5:F6', 'macOS Sonoma', 'Product Marketing'),
('d3333333-3333-3333-3333-333333333333', 'CORP-UBUNTU-OPS02', '10.0.3.88', '11:22:33:44:55:66', 'Ubuntu 24.04 LTS', 'Cloud Operations')
ON CONFLICT (id) DO NOTHING;

-- 3. SEED AI SERVICES REGISTRY
INSERT INTO ai_services (id, name, category, domains, is_sanctioned, base_risk_weight)
VALUES
('s1111111-1111-1111-1111-111111111111', 'ChatGPT (OpenAI)', 'LLM', 'chatgpt.com,chat.openai.com,api.openai.com', FALSE, 15),
('s2222222-2222-2222-2222-222222222222', 'Google Gemini', 'LLM', 'gemini.google.com,generativelanguage.googleapis.com', FALSE, 15),
('s3333333-3333-3333-3333-333333333333', 'Anthropic Claude', 'LLM', 'claude.ai,api.anthropic.com', FALSE, 15),
('s4444444-4444-4444-4444-444444444444', 'Microsoft Copilot (Enterprise)', 'LLM', 'copilot.microsoft.com', TRUE, 5)
ON CONFLICT (id) DO NOTHING;

-- 4. SEED BASELINE SECURITY POLICIES
INSERT INTO policies (id, name, description, target_category, severity, action, is_active)
VALUES
('p1111111-1111-1111-1111-111111111111', 'POL-01: Prohibit Cloud Credentials and API Keys', 'Detects AWS keys, private SSH/RSA keys, JWT tokens, and API secrets submitted to external AI endpoints.', 'SECRET', 'CRITICAL', 'ALERT', TRUE),
('p2222222-2222-2222-2222-222222222222', 'POL-02: Prohibit Internal Infrastructure & Network Topologies', 'Detects RFC1918 private IPv4 addresses, database connection strings, and internal FQDNs.', 'INFRASTRUCTURE', 'HIGH', 'ALERT', TRUE),
('p3333333-3333-3333-3333-333333333333', 'POL-03: Customer and Employee PII Protection', 'Flags bulk emails, international telephone numbers, and national identifiers submitted without prior authorization.', 'PII', 'MEDIUM', 'ALERT', TRUE),
('p4444444-4444-4444-4444-444444444444', 'POL-04: Proprietary Source Code Exfiltration Prevention', 'Flags submission of proprietary source code blocks, functions, and configuration files to unsanctioned AI tools.', 'CODE', 'HIGH', 'ALERT', TRUE),
('p5555555-5555-5555-5555-555555555555', 'POL-05: Restricted Classification and Confidential Documents', 'Identifies organizational confidentiality indicators such as CONFIDENTIAL, INTERNAL ONLY, and STRICTLY PRIVATE.', 'CONFIDENTIAL', 'HIGH', 'ALERT', TRUE)
ON CONFLICT (id) DO NOTHING;
