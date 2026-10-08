import React, { useEffect, useState } from 'react';
import { AlertOctagon, CheckCircle2, Clock, Shield, User, ArrowRight, Eye, RefreshCw, X, FileText } from 'lucide-react';
import { api } from '../api/client';
import { Incident, IncidentDetail, IncidentStatus } from '../types';
import { SeverityBadge, StatusBadge, ServiceBadge } from '../components/Badges';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incidentDetail, setIncidentDetail] = useState<IncidentDetail | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status transition form state
  const [transitionStatus, setTransitionStatus] = useState<IncidentStatus>('INVESTIGATING');
  const [analystNotes, setAnalystNotes] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.incidents.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        severity: severityFilter === 'ALL' ? undefined : severityFilter,
      });
      setIncidents(res.incidents);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter]);

  const openIncident = async (id: string) => {
    setSelectedIncidentId(id);
    setDetailLoading(true);
    try {
      const res = await api.incidents.getById(id);
      setIncidentDetail(res);
      setTransitionStatus(res.incident.status === 'OPEN' ? 'INVESTIGATING' : 'RESOLVED');
      setAnalystNotes('');
    } catch (err) {
      console.error('Failed to load incident detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentId) return;

    setTransitioning(true);
    try {
      await api.incidents.updateStatus(selectedIncidentId, transitionStatus, analystNotes);
      // Refresh detail and list
      await openIncident(selectedIncidentId);
      await fetchIncidents();
      setAnalystNotes('');
    } catch (err: any) {
      alert(`Error updating incident: ${err.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1f293d]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <span>Incident Command & Triage</span>
          </h1>
          <p className="text-xs text-slate-400">
            Formal security tickets generated from high-risk Shadow AI exfiltration telemetry.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111827] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#111827] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
          </select>

          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#1f293d] border border-[#1f293d] text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="soc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0b0f19] text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#1f293d]">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Title & Context</th>
                <th className="py-3 px-4">AI Service</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]">
              {incidents.length > 0 ? (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[#1e293b]/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-cyan-400 font-semibold">
                      {inc.id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      {inc.risk_score}/100
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200 max-w-sm truncate" title={inc.title}>
                      {inc.title}
                    </td>
                    <td className="py-3 px-4">
                      <ServiceBadge name={inc.service_name || 'ChatGPT'} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(inc.created_at).toLocaleDateString()} {new Date(inc.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openIncident(inc.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1f293d] hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-300 transition text-[11px]"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Investigate</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                    No incident tickets found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Modal / Drawer */}
      {selectedIncidentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="soc-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6 relative border-cyan-500/30">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#1f293d] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-400">INCIDENT DOSSIER: {selectedIncidentId}</span>
                  {incidentDetail && <StatusBadge status={incidentDetail.incident.status} />}
                  {incidentDetail && <SeverityBadge severity={incidentDetail.incident.severity} />}
                </div>
                <h2 className="text-base font-bold text-white">{incidentDetail?.incident.title}</h2>
              </div>
              <button
                onClick={() => setSelectedIncidentId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                <span>Loading incident dossier...</span>
              </div>
            ) : incidentDetail ? (
              <div className="space-y-6">
                {/* Meta details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-[#0b0f19] border border-[#1f293d] text-xs">
                  <div>
                    <span className="text-slate-500 block">AI Service</span>
                    <span className="font-medium text-slate-200">{incidentDetail.incident.service_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Monitored Device</span>
                    <span className="font-medium text-slate-200">{incidentDetail.incident.device_hostname || 'CORP-WS'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Endpoint IP</span>
                    <span className="font-mono text-slate-200">{incidentDetail.incident.device_ip || '10.0.1.45'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Calculated Risk Score</span>
                    <span className="font-mono font-bold text-rose-400 text-sm">
                      {incidentDetail.incident.risk_score} / 100
                    </span>
                  </div>
                </div>

                {/* Masked Evidence & Detections Table */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Identified Sensitive Entities (Privacy-by-Design Masked Evidence)</span>
                  </h3>
                  <div className="rounded-lg border border-[#1f293d] overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0b0f19] text-slate-400 text-[11px] font-semibold">
                        <tr>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Subcategory</th>
                          <th className="py-2 px-3">Masked Evidence (Irreversible)</th>
                          <th className="py-2 px-3">Confidence</th>
                          <th className="py-2 px-3">Entropy H(X)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f293d] text-slate-300">
                        {incidentDetail.detections.map((d, idx) => (
                          <tr key={idx} className="bg-[#111827]">
                            <td className="py-2 px-3 font-mono font-bold text-cyan-400">{d.category}</td>
                            <td className="py-2 px-3 font-mono">{d.subcategory}</td>
                            <td className="py-2 px-3 font-mono text-rose-300 bg-rose-950/20">{d.evidence_masked}</td>
                            <td className="py-2 px-3 font-mono">{(d.confidence * 100).toFixed(0)}%</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{d.entropy_score ?? '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sanitized Redacted Prompt Preview */}
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Redacted Payload Transmitted to AI Destination
                  </h3>
                  <div className="p-3 rounded-lg bg-[#0b0f19] border border-[#1f293d] font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {incidentDetail.incident.redacted_payload || '[Payload Redacted]'}
                  </div>
                </div>

                {/* AI Security Analyst Triage Advisory */}
                <div className="p-4 rounded-lg bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                      <FileText className="w-4 h-4" />
                      <span>AI Security Analyst: Impact Summary & Recommended Remediation</span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedIncidentId) return;
                        setDetailLoading(true);
                        try {
                          await api.incidents.triggerAI(selectedIncidentId);
                          await openIncident(selectedIncidentId);
                        } catch (err: any) {
                          alert(`AI Analysis failed: ${err.message}`);
                        } finally {
                          setDetailLoading(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-600/30 hover:bg-cyan-500/40 text-cyan-300 text-[11px] font-semibold transition flex items-center gap-1 border border-cyan-500/30"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate AI Advisory</span>
                    </button>
                  </div>
                  <div className="text-xs text-slate-300 space-y-2">
                    <p className="leading-relaxed">{incidentDetail.incident.ai_summary}</p>
                    <div className="pt-2 border-t border-cyan-500/20">
                      <span className="font-semibold text-cyan-300 block mb-1">Recommended Response Runbook:</span>
                      <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap">
                        {incidentDetail.incident.ai_remediation}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Incident Timeline */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Incident Audit Timeline</span>
                  </h3>
                  <div className="space-y-2 border-l-2 border-[#1f293d] ml-2 pl-4">
                    {incidentDetail.timeline.map((item) => (
                      <div key={item.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200">{item.action.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {item.notes && <p className="text-slate-400 italic text-[11px]">{item.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SOC Analyst Status Transition Action Form */}
                <form onSubmit={handleStatusTransition} className="p-4 rounded-lg bg-[#0b0f19] border border-[#1f293d] space-y-3">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Update Investigation Status (State Machine)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Target Status</label>
                      <select
                        value={transitionStatus}
                        onChange={(e) => setTransitionStatus(e.target.value as IncidentStatus)}
                        className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="INVESTIGATING">INVESTIGATING (Assign & Contain)</option>
                        <option value="RESOLVED">RESOLVED (Secrets Rotated / User Educated)</option>
                        <option value="FALSE_POSITIVE">FALSE POSITIVE (Dismiss Alert)</option>
                        <option value="OPEN">RE-OPEN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Analyst Triage Notes</label>
                      <input
                        type="text"
                        value={analystNotes}
                        onChange={(e) => setAnalystNotes(e.target.value)}
                        placeholder="e.g. Secret rotated in AWS IAM console. Case resolved."
                        required
                        className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={transitioning}
                      className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                    >
                      {transitioning ? 'Updating Incident...' : 'Commit Status Transition'}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
