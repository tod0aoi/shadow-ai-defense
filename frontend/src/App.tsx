import React, { useEffect, useState } from 'react';
import { api, clearToken } from './api/client';
import { User } from './types';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { EventsPage } from './pages/EventsPage';
import { SandboxPage } from './pages/SandboxPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Check existing session on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.auth.me();
        setCurrentUser(res.user);
      } catch {
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    clearToken();
    setCurrentUser(null);
  };

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentTab('events');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-400 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>INITIALIZING SHADOW AI SECURITY CONSOLE...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col text-[#e2e8f0]">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {currentTab === 'overview' && (
          <DashboardPage
            onSelectEvent={handleSelectEvent}
            onNavigateToTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'incidents' && <IncidentsPage />}

        {currentTab === 'events' && (
          <EventsPage
            selectedEventId={selectedEventId}
            onCloseModal={() => setSelectedEventId(null)}
          />
        )}

        {currentTab === 'sandbox' && (
          <SandboxPage onNavigateToIncidents={() => setCurrentTab('incidents')} />
        )}

        {currentTab === 'policies' && <PoliciesPage currentUser={currentUser} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f293d] py-4 text-center text-slate-500 text-[11px] font-mono">
        Shadow AI Data Leakage Detection &amp; Risk Assessment Platform &bull; Final Year Cybersecurity Capstone
      </footer>
    </div>
  );
};

export default App;
