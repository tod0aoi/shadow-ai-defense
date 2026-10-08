import React from 'react';
import { SeverityLevel, IncidentStatus } from '../types';

export const SeverityBadge: React.FC<{ severity?: string | null }> = ({ severity }) => {
  const s = (severity || 'LOW').toUpperCase();
  let colorClass = 'soc-badge-low';
  if (s === 'CRITICAL') colorClass = 'soc-badge-critical';
  else if (s === 'HIGH') colorClass = 'soc-badge-high';
  else if (s === 'MEDIUM') colorClass = 'soc-badge-medium';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${colorClass}`}>
      {s}
    </span>
  );
};

export const StatusBadge: React.FC<{ status?: IncidentStatus | string }> = ({ status }) => {
  const s = (status || 'OPEN').toUpperCase();
  let bg = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  if (s === 'INVESTIGATING') bg = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  if (s === 'RESOLVED') bg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  if (s === 'FALSE_POSITIVE') bg = 'bg-slate-500/10 text-slate-400 border-slate-500/30';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium uppercase tracking-wider ${bg}`}>
      {s.replace('_', ' ')}
    </span>
  );
};

export const ServiceBadge: React.FC<{ name: string; isSanctioned?: boolean | number }> = ({ name, isSanctioned }) => {
  const sanctioned = Boolean(isSanctioned);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e293b] border border-[#334155] text-xs font-medium">
      <span className={`w-2 h-2 rounded-full ${sanctioned ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      <span>{name}</span>
      <span className={`text-[10px] px-1 rounded ${sanctioned ? 'bg-emerald-950/60 text-emerald-400' : 'bg-amber-950/60 text-amber-400'}`}>
        {sanctioned ? 'Sanctioned' : 'Shadow AI'}
      </span>
    </span>
  );
};
