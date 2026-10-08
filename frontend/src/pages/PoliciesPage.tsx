import React, { useEffect, useState } from 'react';
import { Settings, Shield, Sliders, CheckCircle2, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Policy, User } from '../types';
import { SeverityBadge } from '../components/Badges';

export const PoliciesPage: React.FC<{ currentUser: User | null }> = ({ currentUser }) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [riskConfig, setRiskConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savingWeights, setSavingWeights] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

  const loadData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.policies.list(),
        api.risk.getWeights(),
      ]);
      setPolicies(pRes.policies);
      setRiskConfig(rRes.config);
    } catch (err) {
      console.error('Failed to load policies or weights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePolicy = async (policy: Policy) => {
    if (!isAdmin) {
      alert('Permission Denied: Only ADMIN users can toggle security policies.');
      return;
    }

    const newActive = !Boolean(policy.is_active);
    try {
      await api.policies.update(policy.id, { is_active: newActive });
      setPolicies((prev) =>
        prev.map((p) => (p.id === policy.id ? { ...p, is_active: newActive } : p))
      );
    } catch (err: any) {
      alert(`Error updating policy: ${err.message}`);
    }
  };

  const handleSaveRiskWeights = async () => {
    if (!isAdmin) {
      alert('Permission Denied: Only ADMIN users can modify risk weights.');
      return;
    }

    setSavingWeights(true);
    try {
      await api.risk.updateWeights(riskConfig);
      alert('Risk scoring configuration updated successfully.');
    } catch (err: any) {
      alert(`Error updating risk weights: ${err.message}`);
    } finally {
      setSavingWeights(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1f293d]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <span>Security Policies & Risk Engine Configuration</span>
          </h1>
          <p className="text-xs text-slate-400">
            Define organizational boundaries for Shadow AI data exfiltration and adjust mathematical risk scoring weights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <span className="text-[11px] text-amber-400 bg-amber-950/30 px-2 py-1 rounded border border-amber-500/30">
              Read-Only (Requires ADMIN role to modify)
            </span>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#1f293d] border border-[#1f293d] text-slate-300 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Policies List */}
      <div className="soc-card p-5 space-y-4">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>Active Organizational Security Policies</span>
        </h2>

        <div className="grid grid-cols-1 gap-3">
          {policies.map((p) => {
            const active = Boolean(p.is_active);
            return (
              <div
                key={p.id}
                className={`p-4 rounded-lg border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  active ? 'bg-[#0b0f19] border-[#1f293d]' : 'bg-[#0b0f19]/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-slate-200 text-xs">{p.name}</span>
                    <SeverityBadge severity={p.severity} />
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      TARGET: {p.target_category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{p.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs">
                    <span className="text-slate-500 block text-[10px]">Action</span>
                    <span className="font-mono text-cyan-400 font-semibold">{p.action}</span>
                  </div>

                  <button
                    onClick={() => handleTogglePolicy(p)}
                    disabled={!isAdmin}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      active
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-emerald-500/20 hover:text-emerald-400'
                    } ${!isAdmin ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {active ? 'Policy Enabled' : 'Policy Disabled'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Scoring Weight Configuration Panel */}
      {riskConfig && (
        <div className="soc-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Deterministic Risk Engine Weights & Multipliers</span>
            </h2>

            {isAdmin && (
              <button
                onClick={handleSaveRiskWeights}
                disabled={savingWeights}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingWeights ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Weights */}
            {Object.entries(riskConfig.weights).map(([cat, weight]) => (
              <div key={cat} className="p-3.5 rounded-lg bg-[#0b0f19] border border-[#1f293d] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-semibold">Weight: {cat}</span>
                  <span className="font-mono text-cyan-400 font-bold">+{String(weight)}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="70"
                  step="5"
                  disabled={!isAdmin}
                  value={Number(weight)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setRiskConfig((prev: any) => ({
                      ...prev,
                      weights: { ...prev.weights, [cat]: val },
                    }));
                  }}
                  className="w-full accent-cyan-400 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            ))}

            {/* Modifiers */}
            {Object.entries(riskConfig.modifiers).map(([mod, val]) => (
              <div key={mod} className="p-3.5 rounded-lg bg-[#0b0f19] border border-[#1f293d] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-semibold">{mod.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className="font-mono text-amber-400 font-bold">+{String(val)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  disabled={!isAdmin}
                  value={Number(val)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setRiskConfig((prev: any) => ({
                      ...prev,
                      modifiers: { ...prev.modifiers, [mod]: v },
                    }));
                  }}
                  className="w-full accent-amber-400 cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
