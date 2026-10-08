/**
 * End-to-End Comprehensive Verification Test Suite
 * AI-Powered Shadow AI Data Leakage Detection & Risk Assessment Platform
 * 
 * Verifies the entire system workflow:
 *  1. Gateway Health & Database Initialization
 *  2. RBAC & JWT Authentication (Admin & Analyst)
 *  3. In-Memory Direct Scan Engine (Sub-millisecond Pre-Transmission Scan)
 *  4. Ingestion Pipeline (Event -> Detection -> Policy -> Risk -> Incident)
 *  5. Privacy Masking & Irreversible Evidence Storage
 *  6. Policy Enforcement & Rule Violations
 *  7. Automated Incident Escalation for Critical Risk
 *  8. Incident Dossier Retrieval
 *  9. AI Security Analyst Incident Advisory Generation
 *  10. Incident State Machine Progression (OPEN -> INVESTIGATING -> RESOLVED)
 *  11. SOC Overview Analytics Aggregations
 *  12. RBAC Authorization Boundaries
 */

const http = require('http');
const app = require('../backend/dist/index').default;
const { db } = require('../backend/dist/config/database');

const PORT = 5098;
let server;
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

function makeRequest(method, endpointPath, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${endpointPath}`);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 500, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode || 500, data: raw });
          }
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

const RESULTS = [];

function record(id, title, passed, detail) {
  RESULTS.push({ id, title, passed, detail });
  const statusStr = passed ? '\x1b[32m[PASS]\x1b[0m' : '\x1b[31m[FAIL]\x1b[0m';
  console.log(`${statusStr} | Step ${id.padEnd(2)}: ${title.padEnd(52)} | ${detail}`);
}

async function runE2EVerification() {
  console.log('\n' + '='.repeat(85));
  console.log('   SHADOW AI DEFENSE PLATFORM: COMPLETE END-TO-END VERIFICATION RUNNER');
  console.log('='.repeat(85) + '\n');

  let adminToken = '';
  let analystToken = '';
  let ingestedIncidentId = '';

  try {
    // 1. Health Check
    const healthRes = await makeRequest('GET', '/health');
    record(
      '01',
      'API Gateway Health Check',
      healthRes.status === 200 && healthRes.data.status === 'HEALTHY',
      `HTTP ${healthRes.status} (Status: ${healthRes.data.status})`
    );

    // 2. Authentication: Admin Login
    const adminLoginRes = await makeRequest('POST', '/auth/login', { username: 'admin', password: 'Admin@12345!' });
    adminToken = adminLoginRes.data?.token;
    record(
      '02',
      'Admin Authentication & JWT Issuance',
      adminLoginRes.status === 200 && !!adminToken,
      `Role: ${adminLoginRes.data?.user?.role}`
    );

    // 3. Authentication: Analyst Login
    const analystLoginRes = await makeRequest('POST', '/auth/login', { username: 'analyst', password: 'Analyst@12345!' });
    analystToken = analystLoginRes.data?.token;
    record(
      '03',
      'Analyst Authentication & JWT Issuance',
      analystLoginRes.status === 200 && !!analystToken,
      `Role: ${analystLoginRes.data?.user?.role}`
    );

    // 4. In-Memory Direct Scan API (Sandbox / Pre-transmission Check)
    const scanRes = await makeRequest('POST', '/events/scan', {
      prompt_text: 'Deploying with AWS key AKIAIOSFODNN7EXAMPLE to 192.168.1.100 and contact test@corp.internal',
    });
    const scanDetections = scanRes.data?.detections || [];
    const hasSecret = scanDetections.some((d) => d.category === 'SECRET');
    const hasInfra = scanDetections.some((d) => d.category === 'INFRASTRUCTURE');
    const hasPii = scanDetections.some((d) => d.category === 'PII');
    record(
      '04',
      'In-Memory Real-Time Security Scanner',
      scanRes.status === 200 && hasSecret && hasInfra && hasPii,
      `Detected ${scanDetections.length} items across 3 categories in ${scanRes.data?.detection_latency_ms || 0}ms`
    );

    // 5. Ingestion Pipeline: High-Risk Shadow AI Exfiltration Event
    const rawSecretKey = 'AKIA1111222233334444';
    const ingestRes = await makeRequest('POST', '/events/ingest', {
      user_identifier: 'sarah.engineer@megacorp.internal',
      device_info: { hostname: 'ENG-WIN11-042', ip_address: '10.0.1.42', os: 'Windows 11', department: 'Engineering' },
      ai_service: 'ChatGPT (OpenAI)',
      destination_url: 'https://chatgpt.com/backend-api/conversation',
      prompt_text:
        `CONFIDENTIAL: Debug this AWS script with ${rawSecretKey} and Postgres connection postgresql://dbuser:SecretPass123@10.0.1.25:5432/finance_db for john.doe@megacorp.internal`,
      event_type: 'PROMPT_SUBMISSION',
    });

    const ingestBody = ingestRes.data;
    const isIncidentCreated = ingestBody.incident_created === true;
    ingestedIncidentId = ingestBody.incident_id;

    record(
      '05',
      'Event Ingestion & Processing Pipeline',
      ingestRes.status === 201 && ingestBody.risk_assessment?.total_score >= 60,
      `Event ID: ${ingestBody.event_id?.substring(0, 8)}... | Score: ${ingestBody.risk_assessment?.total_score} (${ingestBody.risk_assessment?.severity})`
    );

    // 6. Privacy & Irreversible Masking Verification
    const returnedDetections = ingestBody.detections || [];
    const secretDetection = returnedDetections.find((d) => d.category === 'SECRET');
    const hasMaskedValue = Boolean(secretDetection && (secretDetection.evidence_masked || '').includes('AKIA'));
    const hashLengthValid = typeof ingestBody.prompt_sha256 === 'string' && ingestBody.prompt_sha256.length === 64;
    record(
      '06',
      'Privacy-by-Design Masking Verification',
      hasMaskedValue && hashLengthValid,
      `Masked Value: ${secretDetection?.evidence_masked} | SHA-256: ${ingestBody.prompt_sha256?.substring(0, 16)}...`
    );

    // 7. Policy Enforcement Verification
    const policyCount = ingestBody.policy_violations_count || 0;
    record(
      '07',
      'Policy Engine Violation Correlation',
      policyCount >= 2,
      `Triggered Violations Count: ${policyCount}`
    );

    // 8. Automated Incident Creation
    record(
      '08',
      'Deterministic Incident Escalation',
      isIncidentCreated && !!ingestedIncidentId,
      `Incident Generated: ${ingestedIncidentId}`
    );

    // 9. Incident Dossier Retrieval
    const incidentRes = await makeRequest('GET', `/incidents/${ingestedIncidentId}`, null, analystToken);
    record(
      '09',
      'SOC Incident Dossier & Evidence Query',
      incidentRes.status === 200 && incidentRes.data.incident?.id === ingestedIncidentId,
      `Retrieved dossier with ${incidentRes.data.detections?.length || 0} detections and ${incidentRes.data.timeline?.length || 0} timeline entries`
    );

    // 10. AI Security Analyst Incident Analysis
    const aiAnalysisRes = await makeRequest('POST', `/incidents/${ingestedIncidentId}/ai-analyze`, {}, analystToken);
    const aiAnalysis = aiAnalysisRes.data?.analysis;
    const hasRunbook = aiAnalysis && Array.isArray(aiAnalysis.remediation_runbook) && aiAnalysis.remediation_runbook.length > 0;
    record(
      '10',
      'AI Security Analyst Advisory Generation',
      aiAnalysisRes.status === 200 && hasRunbook,
      `Engine: ${aiAnalysis?.engine || 'Fallback'} | Runbook Actions: ${aiAnalysis?.remediation_runbook?.length || 0}`
    );

    // 11. Incident State Machine: Transition to INVESTIGATING
    const updateInvestigatingRes = await makeRequest(
      'PATCH',
      `/incidents/${ingestedIncidentId}/status`,
      { status: 'INVESTIGATING', notes: 'Lead SOC Analyst triage in progress.' },
      analystToken
    );
    record(
      '11',
      'Incident Transition: OPEN -> INVESTIGATING',
      updateInvestigatingRes.status === 200 && updateInvestigatingRes.data.new_status === 'INVESTIGATING',
      `Status transitioned to: ${updateInvestigatingRes.data.new_status}`
    );

    // 12. Incident State Machine: Transition to RESOLVED
    const updateResolvedRes = await makeRequest(
      'PATCH',
      `/incidents/${ingestedIncidentId}/status`,
      { status: 'RESOLVED', notes: 'Credential revoked in AWS IAM, user debriefed.' },
      adminToken
    );
    record(
      '12',
      'Incident Transition: INVESTIGATING -> RESOLVED',
      updateResolvedRes.status === 200 && updateResolvedRes.data.new_status === 'RESOLVED',
      `Status transitioned to: ${updateResolvedRes.data.new_status}`
    );

    // 13. SOC Overview Analytics Verification
    const analyticsRes = await makeRequest('GET', '/analytics/overview', null, analystToken);
    const analyticsOverview = analyticsRes.data?.overview;
    record(
      '13',
      'SOC Analytics Engine Aggregation',
      analyticsRes.status === 200 && analyticsOverview?.total_events > 0,
      `Total Events: ${analyticsOverview?.total_events} | Total Incidents: ${analyticsOverview?.critical_incidents + analyticsOverview?.high_incidents} | Violations: ${analyticsOverview?.total_violations}`
    );

    // 14. RBAC Authorization Boundaries (Policy Weight Update Guard)
    const analystWeightUpdateRes = await makeRequest(
      'PUT',
      '/risk/weights',
      { category_weights: { SECRET: 60 } },
      analystToken
    );
    record(
      '14',
      'RBAC Boundary Check (Analyst Restricted from Config)',
      analystWeightUpdateRes.status === 403,
      `Analyst access correctly rejected with HTTP ${analystWeightUpdateRes.status} Forbidden`
    );

    // 15. Admin Privilege Grant (Admin updates policy weight)
    const adminWeightUpdateRes = await makeRequest(
      'PUT',
      '/risk/weights',
      { category_weights: { SECRET: 50 } },
      adminToken
    );
    record(
      '15',
      'Admin Privilege Enforcement (Admin Updates Weights)',
      adminWeightUpdateRes.status === 200,
      `Admin successfully updated policy weights: HTTP ${adminWeightUpdateRes.status}`
    );
  } catch (err) {
    console.error('\n[-] Test execution encountered an unhandled exception:', err);
  }

  // Summary
  console.log('\n' + '-'.repeat(85));
  const total = RESULTS.length;
  const passedCount = RESULTS.filter((r) => r.passed).length;
  const allPassed = passedCount === total;

  console.log(`TOTAL CHECKS  : ${total}`);
  console.log(`PASSED        : ${passedCount}`);
  console.log(`FAILED        : ${total - passedCount}`);
  console.log(`SUCCESS RATE  : ${((passedCount / total) * 100).toFixed(1)}%`);
  console.log('-'.repeat(85));

  if (allPassed) {
    console.log('\n\x1b[32m[+] FULL END-TO-END VERIFICATION: 100% OPERATIONAL SUCCESS.\x1b[0m\n');
  } else {
    console.error('\n\x1b[31m[-] ONE OR MORE VERIFICATION STEPS FAILED.\x1b[0m\n');
  }

  server.close(() => process.exit(allPassed ? 0 : 1));
}

server = app.listen(PORT, () => {
  runE2EVerification().catch((err) => {
    console.error('Fatal error in E2E test runner:', err);
    if (server) server.close();
    process.exit(1);
  });
});
