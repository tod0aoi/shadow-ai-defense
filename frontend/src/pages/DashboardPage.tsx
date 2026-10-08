import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Activity, Database, ArrowUpRight, RefreshCw, Eye } from 'lucide-react';
import { api } from '../api/client';
import { AnalyticsOverview, AnalyticsTrends, SecurityEvent } from '../types';
import { SeverityBadge, ServiceBadge, StatusBadge } from '../components/Badges';

interface DashboardPageProps {
  onSelectEvent: (eventId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectEvent, onNavigateToTab }) => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, trRes, evRes] = await Promise.all([
        api.analytics.getOverview(),
        api.analytics.getTrends(),
        api.events.list(1, 8),
      ]);
      setOverview(ovRes.overview);
      setTrends(trRes.trends);
      setRecentEvents(evRes.events);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1f293d]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Security Operations Center</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry and threat intelligence on external Generative AI service consumption.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToTab('sandbox')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition"
          >
            <span>Launch Sandbox Scanner</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#1f293d] border border-[#1f293d] text-slate-300 transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Core Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total AI Usage Events */}
        <div className="soc-card p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total AI Events</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white font-mono">{overview?.total_events ?? '--'}</span>
            <span className="text-[10px] text-slate-400">Logged Prompts</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">100% Monitored</span>
            <span>via Endpoint Agent</span>
          </div>
        </div>

        {/* Metric 2: Policy Violations */}
        <div className="soc-card p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Policy Violations</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-400 font-mono">{overview?.total_violations ?? '--'}</span>
            <span className="text-[10px] text-slate-400">Violations</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Across active DLP & compliance rules
          </div>
        </div>

        {/* Metric 3: Critical Incidents */}
        <div className="soc-card p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Incidents</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-rose-400 font-mono">{overview?.critical_incidents ?? '--'}</span>
            <span className="text-[10px] text-slate-400">Score &ge; 80</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-400/90 font-medium">
            {overview?.open_incidents ?? 0} active unresolved tickets
          </div>
        </div>

        {/* Metric 4: AI Services Active */}
        <div className="soc-card p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Services Used</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-teal-400 font-mono">{overview?.active_ai_services ?? '--'}</span>
            <span className="text-[10px] text-slate-400">Active Destinations</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            ChatGPT, Claude, Gemini, Copilot
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid (CSS Charts & Categorical Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: AI Service Distribution */}
        <div className="soc-card p-5">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>AI Service Target Distribution</span>
            <span className="text-[10px] text-slate-500 font-normal">Events / Target</span>
          </h2>
          <div className="space-y-3">
            {trends?.by_service && trends.by_service.length > 0 ? (
              trends.by_service.map((s) => {
                const total = trends.by_service.reduce((acc, curr) => acc + curr.count, 0) || 1;
                const pct = Math.round((s.count / total) * 100);
                return (
                  <div key={s.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.is_sanctioned ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {s.name}
                      </span>
                      <span className="font-mono text-slate-400">{s.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${s.is_sanctioned ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500 italic py-6 text-center">No service telemetry recorded yet.</div>
            )}
          </div>
        </div>

        {/* Chart 2: Detections by Category */}
        <div className="soc-card p-5">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Data Leakage by Category</span>
            <span className="text-[10px] text-slate-500 font-normal">Findings</span>
          </h2>
          <div className="space-y-3">
            {trends?.by_category && trends.by_category.length > 0 ? (
              trends.by_category.map((c) => {
                const total = trends.by_category.reduce((acc, curr) => acc + curr.count, 0) || 1;
                const pct = Math.round((c.count / total) * 100);
                let barColor = 'bg-cyan-500';
                if (c.category === 'SECRET') barColor = 'bg-rose-500';
                else if (c.category === 'INFRASTRUCTURE') barColor = 'bg-amber-500';
                else if (c.category === 'PII') barColor = 'bg-blue-500';

                return (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300 font-mono">{c.category}</span>
                      <span className="font-mono text-slate-400">{c.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500 italic py-6 text-center">No sensitive detections yet.</div>
            )}
          </div>
        </div>

        {/* Chart 3: Incident Severity Breakdown */}
        <div className="soc-card p-5">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>Incident Threat Distribution</span>
            <span className="text-[10px] text-slate-500 font-normal">Active & Closed</span>
          </h2>
          <div className="space-y-3">
            {trends?.by_severity && trends.by_severity.length > 0 ? (
              trends.by_severity.map((s) => {
                let badgeClass = 'text-slate-400';
                if (s.severity === 'CRITICAL') badgeClass = 'text-rose-400 font-bold';
                else if (s.severity === 'HIGH') badgeClass = 'text-amber-400 font-bold';
                else if (s.severity === 'MEDIUM') badgeClass = 'text-blue-400';

                return (
                  <div key={s.severity} className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0f19] border border-[#1f293d]">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={s.severity} />
                    </div>
                    <span className={`text-sm font-mono ${badgeClass}`}>{s.count} incident(s)</span>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-500 italic py-6 text-center">No incident tickets logged.</div>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Security Event Stream Table */}
      <div className="soc-card overflow-hidden">
        <div className="p-4 border-b border-[#1f293d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Real-Time AI Usage Security Event Stream
            </h2>
          </div>
          <button
            onClick={() => onNavigateToTab('events')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <span>View All Stream Telemetry</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0b0f19] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#1f293d]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User / Device</th>
                <th className="py-3 px-4">Target AI Service</th>
                <th className="py-3 px-4">Redacted Preview</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {recentEvents.length > 0 ? (
                recentEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#1e293b]/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{ev.username || 'monitored_user'}</div>
                      <div className="text-[10px] font-mono text-slate-500">{ev.device_hostname || 'ENDPOINT'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <ServiceBadge name={ev.service_name || 'ChatGPT'} isSanctioned={ev.service_sanctioned} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 max-w-xs truncate" title={ev.redacted_payload}>
                      {ev.redacted_payload}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={ev.risk_score && ev.risk_score >= 60 ? 'text-rose-400' : 'text-slate-300'}>
                        {ev.risk_score ?? 0}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={ev.severity} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectEvent(ev.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1f293d] hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-300 transition text-[11px]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No security events captured yet. Ingest an event from the Sandbox Scanner to test!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
