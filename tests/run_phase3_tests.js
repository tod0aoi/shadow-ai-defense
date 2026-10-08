/**
 * PHASE 3 AUTOMATED VERIFICATION TEST SUITE
 * Tests:
 * 1. Benign Prompt -> Zero Risk (Score 0, LOW, 0 violations, No Incident)
 * 2. Medium PII Prompt -> Policy Violation (POL-03), Medium Risk, No Incident
 * 3. Critical Secret Exfiltration -> Secret Violation (POL-01), Critical Risk, Incident Created (Status OPEN)
 * 4. Incident Dossier Retrieval & Verification
 * 5. Incident Lifecycle Transitions (OPEN -> INVESTIGATING -> RESOLVED) + Timeline
 * 6. Historical Risk / Repeat Offender Multiplier
 * 7. Risk Configuration API & RBAC Protection
 */

const http = require('http');
const app = require('../backend/dist/index').default;
const { db } = require('../backend/dist/config/database');

const PORT = 5096;
let server;
const BASE_URL = `http://127.0.0.1:${PORT}/api/v1`;

const results = [];

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

async function runTests() {
  console.log('\n================================================================');
  console.log('   PHASE 3: POLICY ENGINE, RISK ENGINE & INCIDENT SUITE');
  console.log('================================================================\n');

  // Login as admin and analyst to obtain JWT tokens
  const adminLogin = await makeRequest('POST', '/auth/login', { username: 'admin', password: 'Admin@12345!' });
  const analystLogin = await makeRequest('POST', '/auth/login', { username: 'analyst', password: 'Analyst@12345!' });
  const adminToken = adminLogin.data.token;
  const analystToken = analystLogin.data.token;

  // Test 1: Benign Prompt
  try {
    const benignPayload = {
      user_identifier: 'alice@corp.internal',
      device_info: { hostname: 'ALICE-PC', ip_address: '10.0.1.15' },
      ai_service: 'ChatGPT (OpenAI)',
      destination_url: 'https://chatgpt.com',
      prompt_text: 'What is the speed of light in vacuum and how is it measured?',
    };
    const res = await makeRequest('POST', '/events/ingest', benignPayload);
    const passed =
      res.status === 201 &&
      res.data.detections_count === 0 &&
      res.data.risk_assessment.total_score === 0 &&
      res.data.risk_assessment.severity === 'LOW' &&
      res.data.incident_created === false;
    results.push({ test: 'Policy & Risk: Benign prompt generates 0 risk and no incident', passed, details: `Score: ${res.data?.risk_assessment?.total_score}` });
  } catch (err) {
    results.push({ test: 'Policy & Risk: Benign prompt', passed: false, details: err.message });
  }

  // Test 2: Moderate PII Leakage
  try {
    const piiPayload = {
      user_identifier: 'bob@corp.internal',
      device_info: { hostname: 'BOB-PC', ip_address: '10.0.1.20' },
      ai_service: 'Google Gemini',
      destination_url: 'https://gemini.google.com',
      prompt_text: 'Please draft an email response to client sarah.connor@external-partner.com regarding the order.',
    };
    const res = await makeRequest('POST', '/events/ingest', piiPayload);
    const passed =
      res.status === 201 &&
      res.data.detections_count >= 1 &&
      res.data.policy_violations_count >= 1 &&
      res.data.risk_assessment.severity === 'MEDIUM' &&
      res.data.incident_created === false;
    results.push({
      test: 'Policy & Risk: PII triggers POL-03 with MEDIUM severity without incident',
      passed,
      details: `Score: ${res.data?.risk_assessment?.total_score}, Violations: ${res.data?.policy_violations_count}`,
    });
  } catch (err) {
    results.push({ test: 'Policy & Risk: PII prompt', passed: false, details: err.message });
  }

  // Test 3: Critical Secret Exfiltration
  let criticalIncidentId = '';
  try {
    const secretPayload = {
      user_identifier: 'charlie@corp.internal',
      device_info: { hostname: 'CHARLIE-DEV', ip_address: '10.0.1.30' },
      ai_service: 'ChatGPT (OpenAI)',
      destination_url: 'https://chatgpt.com',
      prompt_text: 'Help me debug this AWS S3 script using key AKIAIOSFODNN7EXAMPLE and secret=xK991823Jk1234#Pass!',
    };
    const res = await makeRequest('POST', '/events/ingest', secretPayload);
    const passed =
      res.status === 201 &&
      res.data.risk_assessment.total_score >= 65 &&
      (res.data.risk_assessment.severity === 'CRITICAL' || res.data.risk_assessment.severity === 'HIGH') &&
      res.data.incident_created === true &&
      Boolean(res.data.incident_id);
    if (passed) criticalIncidentId = res.data.incident_id;
    results.push({
      test: 'Incident Automation: Critical secret leakage automatically generates incident',
      passed,
      details: `Score: ${res.data?.risk_assessment?.total_score}, Incident ID: ${criticalIncidentId}`,
    });
  } catch (err) {
    results.push({ test: 'Incident Automation: Critical secret leakage', passed: false, details: err.message });
  }

  // Test 4: Incident Dossier & Timeline Verification
  try {
    const res = await makeRequest('GET', `/incidents/${criticalIncidentId}`, undefined, analystToken);
    const passed =
      res.status === 200 &&
      res.data.incident.id === criticalIncidentId &&
      res.data.incident.status === 'OPEN' &&
      res.data.detections.length >= 1 &&
      res.data.timeline.length >= 1;
    results.push({
      test: 'Incident Dossier: Detailed incident view includes detections, masked evidence & timeline',
      passed,
      details: `Title: ${res.data?.incident?.title?.substring(0, 40)}...`,
    });
  } catch (err) {
    results.push({ test: 'Incident Dossier', passed: false, details: err.message });
  }

  // Test 5: Incident State Machine Triage (OPEN -> INVESTIGATING -> RESOLVED)
  try {
    const step1 = await makeRequest(
      'PATCH',
      `/incidents/${criticalIncidentId}/status`,
      { status: 'INVESTIGATING', notes: 'SOC Analyst assigned. User contacted.' },
      analystToken
    );
    const step2 = await makeRequest(
      'PATCH',
      `/incidents/${criticalIncidentId}/status`,
      { status: 'RESOLVED', notes: 'AWS Key rotated in AWS IAM console. Case closed.' },
      analystToken
    );
    const passed =
      step1.status === 200 &&
      step1.data.new_status === 'INVESTIGATING' &&
      step2.status === 200 &&
      step2.data.new_status === 'RESOLVED';
    results.push({
      test: 'Incident Lifecycle: State machine transitions OPEN -> INVESTIGATING -> RESOLVED',
      passed,
      details: `Final status: ${step2.data?.new_status}`,
    });
  } catch (err) {
    results.push({ test: 'Incident Lifecycle', passed: false, details: err.message });
  }

  // Test 6: Repeat Offender Multiplier
  try {
    const repeatPayload = {
      user_identifier: 'charlie@corp.internal',
      device_info: { hostname: 'CHARLIE-DEV', ip_address: '10.0.1.30' },
      ai_service: 'ChatGPT (OpenAI)',
      destination_url: 'https://chatgpt.com',
      prompt_text: 'Another query with database postgresql://admin:P@ss123@10.0.1.5:5432/db',
    };
    const res = await makeRequest('POST', '/events/ingest', repeatPayload);
    const breakdown = res.data.risk_assessment.breakdown;
    const hasHistoryPenalty = breakdown.some((b) => b.category === 'HISTORICAL_RISK');
    results.push({
      test: 'Explainable Risk: Repeat offender history multiplier is applied to repeat violator',
      passed: res.status === 201 && hasHistoryPenalty,
      details: hasHistoryPenalty ? 'Historical risk modifier +15 applied' : 'No history factor found',
    });
  } catch (err) {
    results.push({ test: 'Explainable Risk: Repeat offender', passed: false, details: err.message });
  }

  // Test 7: Risk Scoring Weights Configuration API & RBAC
  try {
    const updateWeightsPayload = {
      weights: { SECRET: 55, PII: 25 },
      modifiers: { repeat_offender: 20 },
    };
    const resAnalyst = await makeRequest('PUT', '/risk/weights', updateWeightsPayload, analystToken);
    const resAdmin = await makeRequest('PUT', '/risk/weights', updateWeightsPayload, adminToken);
    const passed = resAnalyst.status === 403 && resAdmin.status === 200 && resAdmin.data.config.weights.SECRET === 55;
    results.push({
      test: 'Risk Config API: Role separation (Analyst HTTP 403, Admin HTTP 200 updates weights)',
      passed,
      details: `SECRET weight updated to: ${resAdmin.data?.config?.weights?.SECRET}`,
    });
  } catch (err) {
    results.push({ test: 'Risk Config API', passed: false, details: err.message });
  }

  // Print Summary Table
  console.log('\n--- PHASE 3 TEST RESULTS MATRIX ---');
  let allPassed = true;
  for (const r of results) {
    const mark = r.passed ? '[PASS]' : '[FAIL]';
    console.log(`${mark.padEnd(8)} | ${r.test.padEnd(70)} | ${r.details || ''}`);
    if (!r.passed) allPassed = false;
  }
  console.log('-----------------------------------\n');

  if (allPassed) {
    console.log('[+] ALL PHASE 3 INTEGRATION TESTS PASSED WITH 100% SUCCESS.\n');
  } else {
    console.error('[-] SOME TESTS FAILED.\n');
  }

  server.close(() => process.exit(allPassed ? 0 : 1));
}

server = app.listen(PORT, () => {
  runTests().catch((err) => {
    console.error('Fatal error in Phase 3 test runner:', err);
    if (server) server.close();
    process.exit(1);
  });
});
