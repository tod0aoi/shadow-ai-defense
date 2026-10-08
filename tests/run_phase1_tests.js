/**
 * PHASE 1 AUTOMATED INTEGRATION & VERIFICATION TEST SUITE (Pure Node runner)
 * Tests:
 * 1. Health check endpoint
 * 2. Database integrity & seed users
 * 3. Bcrypt password authentication & JWT issuance
 * 4. Protected route guard & RBAC enforcement (ADMIN vs SECURITY_ANALYST)
 * 5. Event ingestion gateway with payload sanitization & SHA-256 calculation
 * 6. Non-repudiation audit logging verification
 */

const http = require('http');
const path = require('path');

// Require compiled backend application and database manager
const app = require('../backend/dist/index').default;
const { db } = require('../backend/dist/config/database');

const PORT = 5099;
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
  console.log('\n============================================================');
  console.log('   PHASE 1: BACKEND, DB & SECURITY ARCHITECTURE TEST RUNNER');
  console.log('============================================================\n');

  // Test 1: Health Check
  try {
    const res = await makeRequest('GET', '/health');
    const passed = res.status === 200 && res.data.status === 'HEALTHY';
    results.push({ test: 'API Gateway Health Check', passed, details: `HTTP ${res.status}` });
  } catch (err) {
    results.push({ test: 'API Gateway Health Check', passed: false, details: err.message });
  }

  // Test 2: Invalid Login Rejection
  try {
    const res = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'WrongPassword123!',
    });
    const passed = res.status === 401;
    results.push({ test: 'Auth: Reject Invalid Password', passed, details: `HTTP ${res.status}` });
  } catch (err) {
    results.push({ test: 'Auth: Reject Invalid Password', passed: false, details: err.message });
  }

  // Test 3: Admin Login & JWT Issuance
  let adminToken = '';
  try {
    const res = await makeRequest('POST', '/auth/login', {
      username: 'admin',
      password: 'Admin@12345!',
    });
    const passed = res.status === 200 && Boolean(res.data.token) && res.data.user.role === 'ADMIN';
    if (passed) adminToken = res.data.token;
    results.push({ test: 'Auth: Admin Login & JWT Issuance', passed, details: `Role: ${res.data.user?.role}` });
  } catch (err) {
    results.push({ test: 'Auth: Admin Login & JWT Issuance', passed: false, details: err.message });
  }

  // Test 4: Analyst Login
  let analystToken = '';
  try {
    const res = await makeRequest('POST', '/auth/login', {
      username: 'analyst',
      password: 'Analyst@12345!',
    });
    const passed = res.status === 200 && Boolean(res.data.token) && res.data.user.role === 'SECURITY_ANALYST';
    if (passed) analystToken = res.data.token;
    results.push({ test: 'Auth: Analyst Login & JWT Issuance', passed, details: `Role: ${res.data.user?.role}` });
  } catch (err) {
    results.push({ test: 'Auth: Analyst Login & JWT Issuance', passed: false, details: err.message });
  }

  // Test 5: Protected Route Authentication Guard
  try {
    const resNoAuth = await makeRequest('GET', '/auth/me');
    const resWithAuth = await makeRequest('GET', '/auth/me', undefined, adminToken);
    const passed = resNoAuth.status === 401 && resWithAuth.status === 200 && resWithAuth.data.user.username === 'admin';
    results.push({ test: 'Auth: JWT Guard (Reject unauthenticated, accept authenticated)', passed, details: `Auth HTTP ${resWithAuth.status}` });
  } catch (err) {
    results.push({ test: 'Auth: JWT Guard', passed: false, details: err.message });
  }

  // Test 6: RBAC Authorization (Analyst forbidden from updating policy, Admin allowed)
  try {
    const updatePayload = { severity: 'CRITICAL', action: 'ALERT', is_active: true };
    const resAnalyst = await makeRequest('PUT', '/policies/p1111111-1111-1111-1111-111111111111', updatePayload, analystToken);
    const resAdmin = await makeRequest('PUT', '/policies/p1111111-1111-1111-1111-111111111111', updatePayload, adminToken);
    const passed = resAnalyst.status === 403 && resAdmin.status === 200;
    results.push({ test: 'RBAC: Role Isolation (Analyst HTTP 403, Admin HTTP 200)', passed, details: `Analyst: ${resAnalyst.status}, Admin: ${resAdmin.status}` });
  } catch (err) {
    results.push({ test: 'RBAC: Role Isolation', passed: false, details: err.message });
  }

  // Test 7: Event Ingestion Gateway
  let createdEventId = '';
  try {
    const sampleEvent = {
      user_identifier: 'engineer.bob@corp.internal',
      device_info: {
        hostname: 'BOB-WORKSTATION',
        ip_address: '10.0.4.55',
        os: 'Windows 11',
        department: 'Backend Infrastructure',
      },
      ai_service: 'ChatGPT (OpenAI)',
      destination_url: 'https://chatgpt.com/backend-api/conversation',
      prompt_text: 'Review this internal function: db_connect(host="10.0.1.25", pass="SuperSecretKey123!")',
    };

    const res = await makeRequest('POST', '/events/ingest', sampleEvent);
    const passed = res.status === 201 && Boolean(res.data.event_id) && Boolean(res.data.prompt_sha256);
    if (passed) createdEventId = res.data.event_id;
    results.push({ test: 'Ingestion Gateway: Process AIServiceEvent & Compute SHA-256', passed, details: `Event ID: ${createdEventId}` });
  } catch (err) {
    results.push({ test: 'Ingestion Gateway', passed: false, details: err.message });
  }

  // Test 8: Query Ingested Event & Privacy Redaction Verification
  try {
    const res = await makeRequest('GET', `/events/${createdEventId}`, undefined, analystToken);
    const passed = res.status === 200 && res.data.event.id === createdEventId && res.data.event.redacted_payload.includes('REDACTED');
    results.push({ test: 'Privacy Verification: Ingested event payload is masked before return', passed, details: `Masked: ${res.data?.event?.redacted_payload}` });
  } catch (err) {
    results.push({ test: 'Privacy Verification', passed: false, details: err.message });
  }

  // Test 9: Analytics Aggregation API
  try {
    const res = await makeRequest('GET', '/analytics/overview', undefined, analystToken);
    const passed = res.status === 200 && res.data.overview.total_events >= 1;
    results.push({ test: 'Analytics API: Real Database Aggregation Metrics', passed, details: `Total Events: ${res.data?.overview?.total_events}` });
  } catch (err) {
    results.push({ test: 'Analytics API', passed: false, details: err.message });
  }

  // Test 10: Non-repudiation Audit Trail Verification
  try {
    const auditEntries = await db.query(
      'SELECT action, target_entity, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 5'
    );
    const passed = auditEntries.length > 0;
    results.push({
      test: 'Audit Logging: Non-repudiation audit trail recorded in database',
      passed,
      details: `Logged actions: ${auditEntries.map((a) => a.action).join(', ')}`,
    });
  } catch (err) {
    results.push({ test: 'Audit Logging', passed: false, details: err.message });
  }

  // Print Summary Table
  console.log('\n--- TEST RESULTS MATRIX ---');
  let allPassed = true;
  for (const r of results) {
    const mark = r.passed ? '[PASS]' : '[FAIL]';
    console.log(`${mark.padEnd(8)} | ${r.test.padEnd(65)} | ${r.details || ''}`);
    if (!r.passed) allPassed = false;
  }
  console.log('---------------------------\n');

  if (allPassed) {
    console.log('[+] ALL PHASE 1 INTEGRATION TESTS PASSED WITH 100% SUCCESS.\n');
  } else {
    console.error('[-] SOME TESTS FAILED.\n');
  }

  server.close();
  process.exit(allPassed ? 0 : 1);
}

// Start server on test port and execute suite
server = app.listen(PORT, () => {
  runTests().catch((err) => {
    console.error('Test runner fatal error:', err);
    if (server) server.close();
    process.exit(1);
  });
});
