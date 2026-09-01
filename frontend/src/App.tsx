import React, { useEffect, useState } from 'react';
import { Header, NavTab } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { NotificationBanner } from './components/NotificationBanner';
import { AuthService, UserProfile } from './services/auth';
import { RealTimeQueueClient } from './services/websocket';
import { LandingPage } from './pages/LandingPage';
import { HospitalDiscovery } from './pages/patient/HospitalDiscovery';
import { LiveTicketTracker } from './pages/patient/LiveTicketTracker';
import { PatientHistory } from './pages/patient/PatientHistory';
import { HealthcareAssistant } from './pages/patient/HealthcareAssistant';
import { PartnerDashboard } from './pages/partner/PartnerDashboard';
import { QueueManagement } from './pages/partner/QueueManagement';
import { DoctorManagement } from './pages/partner/DoctorManagement';
import { DepartmentManagement } from './pages/partner/DepartmentManagement';
import { AdminDashboard } from './pages/admin/AdminDashboard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeBanner, setActiveBanner] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('landing');
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>();

  const loadNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/my-notifications`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch {
      // Quiet background failure
    }
  };

  useEffect(() => {
    // 1. Load stored auth user
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

    // 2. Initialize WebSocket connection for background alerts
    const ws = new RealTimeQueueClient('global');
    ws.connect();
    const unsubscribe = ws.subscribe((data) => {
      if (data && typeof data === 'object') {
        if (data.type === 'NOTIFICATION') {
          setActiveBanner(data.data);
          setNotifications((prev) => [data.data, ...prev]);
        }
      }
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
    setActiveTab('landing');
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
        currentUser={currentUser}
        notifications={notifications}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <NotificationBanner
        notification={activeBanner}
        onDismiss={() => setActiveBanner(null)}
      />

      <main className="app-container">
        {/* --- VIEW ROUTING --- */}
        {activeTab === 'landing' && (
          <LandingPage
            onOpenAuth={() => setAuthModalOpen(true)}
          />
        )}

        {activeTab === 'patient_discovery' && (
          <HospitalDiscovery
            onTicketBooked={handleTicketBooked}
            onNavigateToTriage={() => setActiveTab('patient_triage')}
            onNavigateToTracker={() => setActiveTab('patient_live_ticket')}
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
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleUserLoginSuccess}
      />
    </div>
  );
};
