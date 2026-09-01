import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { NotificationBanner } from './components/NotificationBanner';
import { checkBackendHealth } from './services/api';
import { AuthService, UserProfile } from './services/auth';
import { RealTimeQueueClient } from './services/websocket';
import { HospitalDiscovery } from './pages/patient/HospitalDiscovery';
import { LiveTicketTracker } from './pages/patient/LiveTicketTracker';
import { PatientHistory } from './pages/patient/PatientHistory';
import { HealthcareAssistant } from './pages/patient/HealthcareAssistant';
import { PartnerDashboard } from './pages/partner/PartnerDashboard';
import { QueueManagement } from './pages/partner/QueueManagement';
import { DoctorManagement } from './pages/partner/DoctorManagement';
import { DepartmentManagement } from './pages/partner/DepartmentManagement';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { 
  Building2, 
  Radio, 
  Layers,
  Database,
  Cpu,
  Stethoscope,
  Ticket,
  History,
  Compass,
  ShieldCheck,
  Activity
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const App: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wsMessages, setWsMessages] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeBanner, setActiveBanner] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<
    'patient_discovery' | 'patient_triage' | 'patient_live_ticket' | 'patient_history' | 
    'partner_dashboard' | 'partner_counter' | 'partner_doctors' | 'partner_departments' |
    'admin_center'
  >('patient_discovery');
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>();

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/my-notifications`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // 1. Check API health
    const verifyHealth = async () => {
      setLoading(true);
      const res = await checkBackendHealth();
      setHealth(res);
      setLoading(false);
    };
    verifyHealth();

    // 2. Load stored auth user
    const user = AuthService.getStoredUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'SUPER_ADMIN') {
        setActiveTab('admin_center');
      } else if (user.role === 'DOCTOR' || user.role === 'HOSPITAL_ADMIN' || user.role === 'RECEPTIONIST') {
        setActiveTab('partner_counter');
      } else {
        setActiveTab('patient_discovery');
      }
      AuthService.fetchMe().then((fresh) => {
        if (fresh) setCurrentUser(fresh);
      });
      loadNotifications();
    }

    // 3. Initialize WebSocket connection
    const ws = new RealTimeQueueClient('global');
    ws.connect();
    const unsubscribe = ws.subscribe((data) => {
      if (data && typeof data === 'object') {
        if (data.type === 'NOTIFICATION') {
          setActiveBanner(data.data);
          setNotifications((prev) => [data.data, ...prev]);
        }
      }
      setWsMessages((prev) => [
        `[${new Date().toLocaleTimeString()}] ${typeof data === 'object' ? JSON.stringify(data) : data}`,
        ...prev.slice(0, 4)
      ]);
    });

    return () => {
      unsubscribe();
      ws.disconnect();
    };
  }, []);

  const handleLogout = () => {
    AuthService.clearSession();
    setCurrentUser(null);
    setNotifications([]);
    setActiveTab('patient_discovery');
  };

  const handleUserLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    if (user.role === 'SUPER_ADMIN') {
      setActiveTab('admin_center');
    } else if (user.role === 'DOCTOR' || user.role === 'HOSPITAL_ADMIN' || user.role === 'RECEPTIONIST') {
      setActiveTab('partner_counter');
    } else {
      setActiveTab('patient_discovery');
    }
    loadNotifications();
  };

  const handleTicketBooked = (ticket: any) => {
    setSelectedTicketId(ticket.id);
    setActiveTab('patient_live_ticket');
    loadNotifications();
  };

  const handleSelectHistoryTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setActiveTab('patient_live_ticket');
  };

  return (
    <div>
      <Header
        systemStatus={loading ? 'checking' : health?.status === 'ok' ? 'ok' : 'degraded'}
        currentUser={currentUser}
        notifications={notifications}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <NotificationBanner
        notification={activeBanner}
        onDismiss={() => setActiveBanner(null)}
      />

      <main className="app-container">
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.75rem',
          marginBottom: '2rem',
          overflowX: 'auto',
        }}>
          {/* Patient Tabs */}
          <button
            onClick={() => setActiveTab('patient_discovery')}
            className="btn"
            style={{
              background: activeTab === 'patient_discovery' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'patient_discovery' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderColor: activeTab === 'patient_discovery' ? 'var(--accent-primary)' : 'transparent',
            }}
          >
            <Compass size={16} /> Discover Hospitals
          </button>

          <button
            onClick={() => setActiveTab('patient_triage')}
            className="btn"
            style={{
              background: activeTab === 'patient_triage' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'patient_triage' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderColor: activeTab === 'patient_triage' ? 'var(--accent-cyan)' : 'transparent',
            }}
          >
            <Activity size={16} /> Symptom Triage
          </button>

          <button
            onClick={() => setActiveTab('patient_live_ticket')}
            className="btn"
            style={{
              background: activeTab === 'patient_live_ticket' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'patient_live_ticket' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderColor: activeTab === 'patient_live_ticket' ? 'var(--accent-primary)' : 'transparent',
            }}
          >
            <Ticket size={16} /> Live Ticket Tracker
          </button>

          <button
            onClick={() => setActiveTab('patient_history')}
            className="btn"
            style={{
              background: activeTab === 'patient_history' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'patient_history' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderColor: activeTab === 'patient_history' ? 'var(--accent-primary)' : 'transparent',
            }}
          >
            <History size={16} /> Visit History
          </button>

          {/* Partner Console Tabs */}
          <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.5rem' }} />

          <button
            onClick={() => setActiveTab('partner_dashboard')}
            className="btn"
            style={{
              background: activeTab === 'partner_dashboard' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'partner_dashboard' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderColor: activeTab === 'partner_dashboard' ? 'var(--accent-cyan)' : 'transparent',
            }}
          >
            <Building2 size={16} /> Partner Dashboard
          </button>

          <button
            onClick={() => setActiveTab('partner_counter')}
            className="btn"
            style={{
              background: activeTab === 'partner_counter' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'partner_counter' ? 'var(--accent-primary)' : 'var(--text-muted)',
              borderColor: activeTab === 'partner_counter' ? 'var(--accent-primary)' : 'transparent',
            }}
          >
            <Radio size={16} /> Counter Console
          </button>

          <button
            onClick={() => setActiveTab('partner_doctors')}
            className="btn"
            style={{
              background: activeTab === 'partner_doctors' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'partner_doctors' ? 'var(--accent-blue)' : 'var(--text-muted)',
              borderColor: activeTab === 'partner_doctors' ? 'var(--accent-blue)' : 'transparent',
            }}
          >
            <Stethoscope size={16} /> Doctors
          </button>

          <button
            onClick={() => setActiveTab('partner_departments')}
            className="btn"
            style={{
              background: activeTab === 'partner_departments' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'partner_departments' ? 'var(--accent-amber)' : 'var(--text-muted)',
              borderColor: activeTab === 'partner_departments' ? 'var(--accent-amber)' : 'transparent',
            }}
          >
            <Layers size={16} /> Departments
          </button>

          {/* Super Admin Center Tab */}
          <div style={{ width: '1px', background: 'var(--border-color)', margin: '0 0.5rem' }} />

          <button
            onClick={() => setActiveTab('admin_center')}
            className="btn"
            style={{
              background: activeTab === 'admin_center' ? 'var(--bg-secondary)' : 'transparent',
              color: activeTab === 'admin_center' ? '#a78bfa' : 'var(--text-muted)',
              borderColor: activeTab === 'admin_center' ? '#a78bfa' : 'transparent',
            }}
          >
            <ShieldCheck size={16} /> Admin Center
          </button>
        </div>

        {/* --- VIEW ROUTING --- */}
        {activeTab === 'patient_discovery' && (
          <HospitalDiscovery
            onTicketBooked={handleTicketBooked}
          />
        )}

        {activeTab === 'patient_triage' && (
          <HealthcareAssistant
            onTicketBooked={handleTicketBooked}
          />
        )}

        {activeTab === 'patient_live_ticket' && (
          <LiveTicketTracker
            initialTicketId={selectedTicketId}
            onExploreHospitals={() => setActiveTab('patient_discovery')}
          />
        )}

        {activeTab === 'patient_history' && (
          <PatientHistory
            onSelectTicket={handleSelectHistoryTicket}
          />
        )}

        {activeTab === 'partner_dashboard' && (
          <PartnerDashboard onNavigateToQueue={() => setActiveTab('partner_counter')} />
        )}

        {activeTab === 'partner_counter' && (
          <QueueManagement />
        )}

        {activeTab === 'partner_doctors' && (
          <DoctorManagement />
        )}

        {activeTab === 'partner_departments' && (
          <DepartmentManagement />
        )}

        {activeTab === 'admin_center' && (
          <AdminDashboard />
        )}

        {/* Infrastructure & Realtime Status Footer */}
        <section className="grid-2" style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} color="var(--accent-primary)" /> Backend Services Telemetry
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={14} /> PostgreSQL Relational DB
                </span>
                <span className="badge badge-healthy">
                  {health?.services?.database || 'healthy'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '6px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Radio size={14} /> Redis Live Queue & Cache
                </span>
                <span className="badge badge-healthy">
                  {health?.services?.redis || 'healthy'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={18} color="var(--accent-cyan)" /> Real-Time WebSocket Hub
            </h3>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '6px',
              padding: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              minHeight: '85px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              {wsMessages.length === 0 ? (
                <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  Awaiting real-time stream events...
                </div>
              ) : (
                wsMessages.map((msg, i) => (
                  <div key={i} style={{ color: '#34d399' }}>{msg}</div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleUserLoginSuccess}
      />
    </div>
  );
};
