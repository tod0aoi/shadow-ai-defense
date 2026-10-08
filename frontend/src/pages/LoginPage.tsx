import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { api, setToken } from '../api/client';
import { User as UserType } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@12345!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(username, password);
      setToken(res.token);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] px-4">
      <div className="soc-card w-full max-w-md p-8 space-y-6 relative border-cyan-500/30">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
            SHADOW AI DEFENSE
          </h1>
          <p className="text-xs text-slate-400">
            Security Operations Center (SOC) Access Control
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#0b0f19] border border-[#1f293d] rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                placeholder="admin or analyst"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#0b0f19] border border-[#1f293d] rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Security Console'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="pt-4 border-t border-[#1f293d] space-y-2">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold text-center">
            Demo Credentials (1-Click Fill):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('admin', 'Admin@12345!')}
              className="p-2 rounded bg-[#0b0f19] hover:bg-[#1e293b] border border-[#1f293d] text-left transition"
            >
              <div className="text-[11px] font-bold text-slate-200">Admin (CISO)</div>
              <div className="text-[10px] text-cyan-400 font-mono">admin</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('analyst', 'Analyst@12345!')}
              className="p-2 rounded bg-[#0b0f19] hover:bg-[#1e293b] border border-[#1f293d] text-left transition"
            >
              <div className="text-[11px] font-bold text-slate-200">SOC Analyst</div>
              <div className="text-[10px] text-cyan-400 font-mono">analyst</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
