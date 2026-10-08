import React, { useState } from 'react';
import { Terminal, Shield, Play, Send, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { api } from '../api/client';
import { SeverityBadge } from '../components/Badges';

const PRESETS = [
  {
    name: 'AWS Cloud Credential Exfiltration',
    category: 'SECRET',
    service: 'ChatGPT (OpenAI)',
    prompt: 'Configure my S3 bucket backup script with AWS_ACCESS_KEY_ID = AKIAIOSFODNN7EXAMPLE for automated nightly backups.',
  },
  {
    name: 'Internal Database URI with Password',
    category: 'INFRASTRUCTURE',
    service: 'ChatGPT (OpenAI)',
    prompt: 'Help me debug this database connection string: postgresql://db_admin:P@ssw0rd9988#Vault@10.0.1.50:5432/finance_prod',
  },
  {
    name: 'Customer PII Leakage',
    category: 'PII',
    service: 'Google Gemini',
    prompt: 'Please draft a follow-up email for customer alice.cooper@corporate-client.org regarding overdue invoice #9821.',
  },
  {
    name: 'Proprietary Source Code Submission',
    category: 'CODE',
    service: 'Anthropic Claude',
    prompt: 'def calculate_quarterly_bonus(employee_id, salary):\n    tax_rate = 0.28\n    bonus = salary * 0.15\n    return bonus * (1 - tax_rate)',
  },
  {
    name: 'Confidential Strategy Memo',
    category: 'CONFIDENTIAL',
    service: 'ChatGPT (OpenAI)',
    prompt: 'THIS MEMO IS STRICTLY CONFIDENTIAL AND PROPRIETARY. Merger talks with Vendor X will commence in Q4 under project Apollo.',
  },
  {
    name: 'Benign Technical Question (Safe Baseline)',
    category: 'NONE',
    service: 'Microsoft Copilot (Enterprise)',
    prompt: 'What are the main differences between TCP and UDP protocols in computer networking?',
  },
];

export const SandboxPage: React.FC<{ onNavigateToIncidents: () => void }> = ({ onNavigateToIncidents }) => {
  const [selectedService, setSelectedService] = useState('ChatGPT (OpenAI)');
  const [userIdentifier, setUserIdentifier] = useState('developer.sarah@corp.internal');
  const [promptText, setPromptText] = useState(PRESETS[0].prompt);

  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  const [ingestResult, setIngestResult] = useState<any>(null);
  const [ingesting, setIngesting] = useState(false);

  const handleRunScan = async () => {
    if (!promptText.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const res = await api.events.scan(promptText);
      setScanResult(res);
    } catch (err: any) {
      alert(`Scan failed: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const handleSimulateIngest = async () => {
    if (!promptText.trim()) return;
    setIngesting(true);
    setIngestResult(null);
    try {
      const res = await api.events.ingest({
        user_identifier: userIdentifier,
        device_info: {
          hostname: 'SARAH-MACBOOK-PRO',
          ip_address: '10.0.1.92',
          os: 'macOS Sonoma',
          department: 'Product Engineering',
        },
        ai_service: selectedService,
        prompt_text: promptText,
      });
      setIngestResult(res);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[#1f293d]">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span>Interactive Sandbox Scanner & Live Simulator</span>
        </h1>
        <p className="text-xs text-slate-400">
          Simulate controlled Generative AI prompt exfiltration, benchmark detection latency, and test live risk scoring.
        </p>
      </div>

      {/* Preset Vectors Selector */}
      <div className="soc-card p-4 space-y-2">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Preset Attack Vectors & Test Scenarios:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPromptText(preset.prompt);
                setSelectedService(preset.service);
                setScanResult(null);
                setIngestResult(null);
              }}
              className="p-2.5 rounded-lg bg-[#0b0f19] hover:bg-[#1e293b] border border-[#1f293d] hover:border-cyan-500/40 text-left transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-semibold text-slate-200">{preset.name}</div>
                <div className="text-[10px] text-slate-500 font-mono">{preset.service}</div>
              </div>
              <SeverityBadge severity={preset.category === 'SECRET' ? 'CRITICAL' : preset.category === 'NONE' ? 'LOW' : 'HIGH'} />
            </button>
          ))}
        </div>
      </div>

      {/* Input Simulation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Console */}
        <div className="soc-card p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Simulated Endpoint AI Prompt Console</span>
            <span className="text-[10px] text-cyan-400 font-mono">AIServiceEvent Emitter</span>
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Simulated Employee</label>
              <input
                type="text"
                value={userIdentifier}
                onChange={(e) => setUserIdentifier(e.target.value)}
                className="w-full bg-[#0b0f19] border border-[#1f293d] rounded-lg px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Target AI Destination</label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full bg-[#0b0f19] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ChatGPT (OpenAI)">ChatGPT (OpenAI) [Unsanctioned]</option>
                <option value="Google Gemini">Google Gemini [Unsanctioned]</option>
                <option value="Anthropic Claude">Anthropic Claude [Unsanctioned]</option>
                <option value="Microsoft Copilot (Enterprise)">Microsoft Copilot (Enterprise) [Sanctioned]</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Prompt Payload (Paste code, credentials, or questions)</label>
            <textarea
              rows={7}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full bg-[#0b0f19] border border-[#1f293d] rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
              placeholder="Paste raw prompt content here..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleRunScan}
              disabled={scanning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{scanning ? 'Scanning...' : '1. Run In-Memory Scan'}</span>
            </button>

            <button
              onClick={handleSimulateIngest}
              disabled={ingesting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{ingesting ? 'Ingesting...' : '2. Simulate Real Exfiltration to DB'}</span>
            </button>
          </div>
        </div>

        {/* Right: Live Scan Verdict & Redacted Evidence */}
        <div className="soc-card p-5 space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Detection & Privacy-by-Design Results</span>
            {scanResult && (
              <span className="text-[10px] font-mono text-emerald-400">
                ⚡ Processed in {scanResult.processing_time_ms} ms
              </span>
            )}
          </h2>

          {scanResult ? (
            <div className="space-y-4">
              {/* Verdict header */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0b0f19] border border-[#1f293d]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Categorical Verdict:</span>
                  <SeverityBadge severity={scanResult.overall_severity} />
                </div>
                <div className="text-xs font-mono text-slate-300">
                  {scanResult.detections_count} sensitive entity findings
                </div>
              </div>

              {/* Detections chips */}
              {scanResult.detections.length > 0 ? (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Detected Spans & Entropy:
                  </span>
                  <div className="space-y-1.5">
                    {scanResult.detections.map((d: any, idx: number) => (
                      <div key={idx} className="p-2 rounded bg-[#0b0f19] border border-[#1f293d] flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-cyan-400 font-bold">[{d.category}]</span>
                          <span className="text-slate-200">{d.subcategory}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-300 bg-rose-950/30 px-1.5 py-0.5 rounded text-[11px]">{d.evidence_masked}</span>
                          {d.entropy_score && (
                            <span className="text-slate-400 text-[10px]" title="Shannon Entropy">H={d.entropy_score}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Clean Prompt: No credentials, secrets, PII, or internal infrastructure detected.</span>
                </div>
              )}

              {/* Masked Prompt Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Sanitized Redacted Payload Preview:
                </span>
                <div className="p-3 rounded-lg bg-[#0b0f19] border border-[#1f293d] font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {scanResult.redacted_text}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs italic">
              Click &quot;Run In-Memory Scan&quot; or &quot;Simulate Real Exfiltration&quot; to evaluate this prompt.
            </div>
          )}

          {/* Ingestion Persistence Alert */}
          {ingestResult && (
            <div className="p-4 rounded-lg bg-rose-950/20 border border-rose-500/30 space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Real Event Ingested & Persisted to PostgreSQL</span>
                </span>
                <SeverityBadge severity={ingestResult.risk_assessment?.severity} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300 pt-1">
                <div>Event ID: <span className="text-cyan-400">{ingestResult.event_id?.substring(0, 8)}...</span></div>
                <div>Risk Score: <span className="text-rose-400 font-bold">{ingestResult.risk_assessment?.total_score}/100</span></div>
                <div>Violations: {ingestResult.policy_violations_count}</div>
                <div>Incident Created: {ingestResult.incident_created ? 'YES' : 'NO'}</div>
              </div>
              {ingestResult.incident_created && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={onNavigateToIncidents}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
                  >
                    <span>Inspect Created Incident in Command</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
