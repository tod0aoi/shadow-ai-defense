import React, { useEffect, useState } from 'react';
import { Terminal, Shield, RefreshCw, Eye, X, Hash, HardDrive, Cpu, AlertTriangle } from 'lucide-react';
import { api } from '../api/client';
import { SecurityEvent } from '../types';
import { SeverityBadge, ServiceBadge, StatusBadge } from '../components/Badges';

export const EventsPage: React.FC<{ selectedEventId?: string | null; onCloseModal?: () => void }> = ({
  selectedEventId: initialSelectedId,
  onCloseModal,
}) => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Inspector modal state
  const [inspectedEventId, setInspectedEventId] = useState<string | null>(initialSelectedId || null);
  const [eventDetail, setEventDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchEvents = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const res = await api.events.list(pageNumber, 20);
      setEvents(res.events);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.pages);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(page);
  }, [page]);

  useEffect(() => {
    if (initialSelectedId) {
      inspectEvent(initialSelectedId);
    }
  }, [initialSelectedId]);

  const inspectEvent = async (id: string) => {
    setInspectedEventId(id);
    setDetailLoading(true);
    try {
      const data = await api.events.getById(id);
      setEventDetail(data);
    } catch (err) {
      console.error('Failed to load event detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeInspector = () => {
    setInspectedEventId(null);
    setEventDetail(null);
    if (onCloseModal) onCloseModal();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1f293d]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <span>AI Usage Event Stream Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400">
            Immutable stream of all normalized prompts submitted across organizational endpoints.
          </p>
        </div>

        <button
          onClick={() => fetchEvents(page)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111827] hover:bg-[#1f293d] border border-[#1f293d] text-slate-300 text-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Events Table */}
      <div className="soc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0b0f19] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#1f293d]">
              <tr>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Redacted Payload Preview</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {events.length > 0 ? (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#1e293b]/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">
                      {ev.id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{ev.username || 'monitored_user'}</div>
                      <div className="text-[10px] font-mono text-slate-500">{ev.device_hostname || 'WS-01'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <ServiceBadge name={ev.service_name || 'ChatGPT'} isSanctioned={ev.service_sanctioned} />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={ev.risk_score && ev.risk_score >= 60 ? 'text-rose-400' : 'text-slate-300'}>
                        {ev.risk_score ?? 0}/100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={ev.severity} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 max-w-xs truncate" title={ev.redacted_payload}>
                      {ev.redacted_payload}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => inspectEvent(ev.id)}
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
                  <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                    No events in telemetry feed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-[#1f293d] flex items-center justify-between text-xs text-slate-400">
            <div>Page {page} of {totalPages}</div>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-[#111827] border border-[#1f293d] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-[#111827] border border-[#1f293d] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Inspector Modal */}
      {inspectedEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="soc-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 relative border-cyan-500/30">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#1f293d] pb-3">
              <div>
                <span className="font-mono text-xs text-cyan-400">EVENT INSPECTOR</span>
                <h2 className="text-sm font-bold text-white font-mono">{inspectedEventId}</h2>
              </div>
              <button
                onClick={closeInspector}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                <span>Loading event detail...</span>
              </div>
            ) : eventDetail ? (
              <div className="space-y-5">
                {/* Cryptographic Hash & Metadata */}
                <div className="p-3.5 rounded-lg bg-[#0b0f19] border border-[#1f293d] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-[11px]">
                    <Hash className="w-3.5 h-3.5" />
                    <span>SHA-256 Prompt Fingerprint:</span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 break-all bg-slate-900/60 p-2 rounded border border-slate-800">
                    {eventDetail.event.prompt_sha256}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-slate-400">
                    <div>Destination: <span className="text-slate-200">{eventDetail.event.service_name}</span></div>
                    <div>Length: <span className="text-slate-200 font-mono">{eventDetail.event.prompt_length} chars</span></div>
                    <div>Recorded: <span className="text-slate-200 font-mono">{new Date(eventDetail.event.timestamp).toLocaleTimeString()}</span></div>
                  </div>
                </div>

                {/* Sanitized Redacted Prompt */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Sanitized Payload (Stored in Database)
                  </h3>
                  <div className="p-3 rounded-lg bg-[#0b0f19] border border-[#1f293d] font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {eventDetail.event.redacted_payload}
                  </div>
                </div>

                {/* Detections */}
                {eventDetail.detections && eventDetail.detections.length > 0 && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Identified Findings ({eventDetail.detections.length})
                    </h3>
                    <div className="space-y-1">
                      {eventDetail.detections.map((d: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-[#0b0f19] border border-[#1f293d] flex items-center justify-between text-xs font-mono">
                          <span className="text-cyan-400">[{d.category}] {d.subcategory}</span>
                          <span className="text-rose-300 bg-rose-950/30 px-1.5 py-0.5 rounded">{d.evidence_masked}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Breakdown */}
                {eventDetail.risk_assessment && (
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Deterministic Risk Calculation Breakdown</span>
                      <span className="font-mono text-rose-400 font-bold">{eventDetail.risk_assessment.total_score}/100</span>
                    </h3>
                    <div className="space-y-1">
                      {eventDetail.risk_assessment.breakdown_factors.map((f: any, idx: number) => (
                        <div key={idx} className="p-2 rounded bg-[#0b0f19] border border-[#1f293d] flex items-center justify-between text-xs">
                          <span className="text-slate-300">{f.reason}</span>
                          <span className="font-mono font-bold text-amber-400">+{f.score_contribution}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
