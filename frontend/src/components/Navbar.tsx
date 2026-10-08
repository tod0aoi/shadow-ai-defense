import React from 'react';
import { Shield, AlertOctagon, Terminal, FileText, Settings, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, currentUser, onLogout }) => {
  const navItems = [
    { id: 'overview', label: 'SOC Dashboard', icon: Shield },
    { id: 'incidents', label: 'Incident Command', icon: AlertOctagon },
    { id: 'events', label: 'Security Event Stream', icon: Terminal },
    { id: 'sandbox', label: 'Sandbox Scanner & Simulator', icon: FileText },
    { id: 'policies', label: 'Policies & Risk Config', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f19]/90 backdrop-blur border-b border-[#1f293d] px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('overview')}>
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
              SHADOW AI DEFENSE
            </div>
            <div className="text-[10px] text-slate-400 font-mono tracking-tight">
              DATA LEAKAGE DETECTION & RISK ASSESSMENT PLATFORM
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-[#1f293d]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]/50 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Session & Logout */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#1f293d]">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-200">{currentUser.username}</div>
                <div className="text-[10px] font-mono font-medium text-cyan-400 uppercase tracking-wider">
                  {currentUser.role}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
