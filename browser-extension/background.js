/**
 * Shadow AI Defense - Background Service Worker (Manifest V3)
 * Handles telemetry forwarding to the local SOC Gateway API at http://localhost:5000
 */

const API_GATEWAY_URL = 'http://localhost:5000/api/v1';

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PRE_SCAN_PROMPT') {
    handlePreScan(request.promptText)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === 'INGEST_PROMPT_EVENT') {
    handleIngestEvent(request.eventData)
      .then((data) => {
        incrementLocalStats(data);
        sendResponse({ success: true, data });
      })
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === 'GET_HEALTH') {
    checkGatewayHealth()
      .then((isHealthy) => sendResponse({ healthy: isHealthy }))
      .catch(() => sendResponse({ healthy: false }));
    return true;
  }
});

async function handlePreScan(promptText) {
  try {
    const res = await fetch(`${API_GATEWAY_URL}/events/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt_text: promptText }),
    });

    if (!res.ok) throw new Error(`Gateway returned HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Shadow AI Agent] Scan error or gateway offline:', err);
    throw err;
  }
}

async function handleIngestEvent(eventData) {
  try {
    const res = await fetch(`${API_GATEWAY_URL}/events/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    if (!res.ok) throw new Error(`Gateway returned HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[Shadow AI Agent] Ingestion error:', err);
    throw err;
  }
}

async function checkGatewayHealth() {
  try {
    const res = await fetch(`${API_GATEWAY_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

function incrementLocalStats(resData) {
  chrome.storage.local.get(['scannedCount', 'leakageCount', 'lastEvent'], (items) => {
    const count = (items.scannedCount || 0) + 1;
    const hasLeak = resData?.detections_count > 0;
    const leakages = (items.leakageCount || 0) + (hasLeak ? 1 : 0);

    chrome.storage.local.set({
      scannedCount: count,
      leakageCount: leakages,
      lastEvent: {
        timestamp: new Date().toISOString(),
        service: resData?.service?.name || 'External AI',
        severity: resData?.risk_assessment?.severity || 'LOW',
        risk_score: resData?.risk_assessment?.total_score || 0,
        detections_count: resData?.detections_count || 0,
      },
    });
  });
}
