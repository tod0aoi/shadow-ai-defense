/**
 * Shadow AI Defense - Content Script (Manifest V3)
 * Monitors user prompt submissions on Generative AI web portals.
 */

(function () {
  console.log('[Shadow AI Defense Agent] Monitoring active on:', window.location.hostname);

  // Identify service
  function detectAIService() {
    const host = window.location.hostname.toLowerCase();
    if (host.includes('chatgpt') || host.includes('openai')) return 'ChatGPT (OpenAI)';
    if (host.includes('gemini.google')) return 'Google Gemini';
    if (host.includes('claude.ai')) return 'Claude (Anthropic)';
    if (host.includes('copilot.microsoft')) return 'Microsoft Copilot';
    return 'External AI Service';
  }

  const SERVICE_NAME = detectAIService();

  // Inject floating agent badge in bottom corner
  function injectStatusBadge() {
    if (document.getElementById('shadow-ai-badge')) return;

    const badge = document.createElement('div');
    badge.id = 'shadow-ai-badge';
    badge.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 999999;
      background: #0f172a;
      color: #38bdf8;
      border: 1px solid #1e293b;
      border-radius: 9999px;
      padding: 6px 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      font-weight: 600;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    `;
    badge.innerHTML = `
      <span style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; display: inline-block;"></span>
      <span>DLP Shield Active</span>
    `;

    badge.title = `Shadow AI Defense Platform - Monitoring ${SERVICE_NAME}`;
    document.body.appendChild(badge);
  }

  // Display security alert banner on sensitive data transmission
  function showWarningBanner(detections, riskAssessment) {
    let banner = document.getElementById('shadow-ai-warning-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'shadow-ai-warning-banner';
      banner.style.cssText = `
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999999;
        background: #1e1b4b;
        color: #f8fafc;
        border: 2px solid #ef4444;
        border-radius: 12px;
        padding: 14px 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.5);
        max-width: 650px;
        width: 90%;
        animation: fadeIn 0.3s ease-out;
      `;
      document.body.appendChild(banner);
    }

    const categories = Array.from(new Set(detections.map((d) => d.category))).join(', ');
    const severity = riskAssessment?.severity || 'HIGH';
    const score = riskAssessment?.total_score || 75;

    banner.innerHTML = `
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <span style="font-size: 24px;">⚠️</span>
          <div>
            <div style="font-weight: 700; font-size: 14px; color: #f87171; letter-spacing: 0.5px;">
              SHADOW AI DEFENSE ALERT [${severity} - Score ${score}/100]
            </div>
            <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
              Sensitive organizational data detected: <strong style="color: #fca5a5;">${categories}</strong>.
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">
              Irreversible telemetry report logged with Corporate Security Operations Center (SOC).
            </div>
          </div>
        </div>
        <button id="shadow-ai-banner-close" style="
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 18px;
          cursor: pointer;
          padding: 0 4px;
        ">&times;</button>
      </div>
    `;

    document.getElementById('shadow-ai-banner-close')?.addEventListener('click', () => {
      banner.remove();
    });

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      if (document.body.contains(banner)) banner.remove();
    }, 10000);
  }

  // Intercept and send prompt telemetry
  let lastCapturedText = '';

  function processPrompt(promptText) {
    const text = (promptText || '').trim();
    if (!text || text.length < 5 || text === lastCapturedText) return;
    lastCapturedText = text;

    console.log('[Shadow AI Agent] Analyzing prompt telemetry of length:', text.length);

    const eventPayload = {
      user_identifier: 'workstation.user@corp.internal',
      device_info: {
        hostname: window.location.hostname,
        ip_address: '127.0.0.1',
        os: navigator.userAgent.includes('Windows') ? 'Windows' : 'macOS/Linux',
        department: 'Operations',
      },
      ai_service: SERVICE_NAME,
      destination_url: window.location.href,
      prompt_text: text,
      event_type: 'PROMPT_SUBMISSION',
    };

    chrome.runtime.sendMessage(
      { action: 'INGEST_PROMPT_EVENT', eventData: eventPayload },
      (response) => {
        if (!response || !response.success) {
          console.warn('[Shadow AI Agent] Ingestion communication error:', response?.error);
          return;
        }

        const data = response.data;
        console.log('[Shadow AI Agent] Telemetry processed. Severity:', data?.risk_assessment?.severity);

        if (data?.detections_count > 0 && (data.risk_assessment?.severity === 'HIGH' || data.risk_assessment?.severity === 'CRITICAL')) {
          showWarningBanner(data.detections, data.risk_assessment);
        }
      }
    );
  }

  // Hook into keydown events on inputs and contenteditable areas
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        const activeEl = document.activeElement;
        if (!activeEl) return;

        let promptContent = '';
        if (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT') {
          promptContent = activeEl.value;
        } else if (activeEl.isContentEditable || activeEl.getAttribute('contenteditable') === 'true') {
          promptContent = activeEl.innerText || activeEl.textContent;
        }

        if (promptContent) {
          processPrompt(promptContent);
        }
      }
    },
    true
  );

  // Hook into form submissions and click events on send buttons
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target;
      const sendBtn = target.closest('button[data-testid="send-button"], button[aria-label*="Send"], button[aria-label*="Submit"], form button[type="submit"]');
      if (sendBtn) {
        const inputContainer = document.querySelector('div#prompt-textarea, textarea, div[contenteditable="true"]');
        if (inputContainer) {
          const content = inputContainer.innerText || inputContainer.value || inputContainer.textContent;
          processPrompt(content);
        }
      }
    },
    true
  );

  // Initialize status badge when DOM loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStatusBadge);
  } else {
    injectStatusBadge();
  }
})();
