import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { NotificationBanner } from './components/NotificationBanner';
import { MaintenanceBanner } from './components/MaintenanceBanner';
import { AuthService, UserProfile } from './services/auth';
import { API_BASE } from './services/api';
import { RealTimeQueueClient } from './services/websocket';
import { LandingPage } from './pages/landing/LandingPage';
import { HospitalDiscovery } from './pages/patient/HospitalDiscovery';
import { LiveTicketTracker } from './pages/patient/LiveTicketTracker';
import { PatientHistory } from './pages/patient/PatientHistory';
import { HealthcareAssistant } from './pages/patient/HealthcareAssistant';
import { PartnerDashboard } from './pages/partner/PartnerDashboard';
import { QueueManagement } from './pages/partner/QueueManagement';
import { DoctorManagement } from './pages/partner/DoctorManagement';
import { DepartmentManagement } from './pages/partner/DepartmentManagement';
import { StaffManagement } from './pages/partner/StaffManagement';
import { HospitalProfile } from './pages/partner/HospitalProfile';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { HospitalPartnerAuth } from './pages/partner/HospitalPartnerAuth';
import { isPartnerPortal, getPortalSwitchUrl } from './utils/subdomain';

export const App: React.FC = () => {
  const isPartner = isPartnerPortal();
  const storedUser = AuthService.getStoredUser();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(storedUser);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeBanner, setActiveBanner] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (!storedUser) return 'landing';
    if (storedUser.role === 'SUPER_ADMIN') return 'admin_center';
    if (storedUser.role === 'DOCTOR' || storedUser.role === 'HOSPITAL_ADMIN' || storedUser.role === 'RECEPTIONIST') {
      return 'partner_counter';
    }
    return 'patient_triage';
  });
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
        setActiveTab('patient_triage');
      }
      AuthService.fetchMe().then((fresh) => {
        if (fresh) setCurrentUser(fresh);
      });
      loadNotifications();
    } else {
      setCurrentUser(null);
      setActiveTab('landing');
    }

    // 2. Initialize WebSocket connection for background alerts
    const ws = new RealTimeQueueClient('global');
    ws.connect();
    const unsubscribe = ws.subscribe((data) => {
      if (data && typeof data === 'object') {
        if (data.event === 'TICKET_CALLED' || data.event === 'TICKET_SERVING') {
          setActiveBanner({
            title: `Ticket Called: ${data.data?.ticket_number || ''}`,
            message: `Please proceed to counter. Room: ${data.data?.room || 'Main Desk'}`,
            type: 'urgent',
          });
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
    } else if (user.role === 'HOSPITAL_ADMIN') {
      setActiveTab('partner_dashboard');
    } else if (user.role === 'DOCTOR' || user.role === 'RECEPTIONIST') {
      setActiveTab('partner_counter');
    } else {
      setActiveTab('patient_triage');
    }
    loadNotifications();
  };

  const handleTicketBooked = (ticket: any) => {
    setSelectedTicketId(ticket.id);
    setActiveTab('patient_live_ticket');
    loadNotifications();
  };


  const handleSelectTab = (tab: NavTab) => {
    if (!currentUser && tab !== 'landing') {
      setActiveTab('landing');
      return;
    }
    setActiveTab(tab);
  };

  const isPartnerUser =
    currentUser &&
    (currentUser.role === 'HOSPITAL_ADMIN' ||
      currentUser.role === 'DOCTOR' ||
      currentUser.role === 'RECEPTIONIST' ||
      currentUser.role === 'SUPER_ADMIN');

  if (isPartner && !isPartnerUser) {
    return (
      <div className="page-transition-enter" style={{ minHeight: '100vh' }}>
        <MaintenanceBanner />
        <HospitalPartnerAuth
          onSuccess={handleUserLoginSuccess}
          onSwitchToPatient={() => {
            const url = new URL(window.location.href);
            if (url.searchParams.has('portal')) {
              url.searchParams.delete('portal');
              window.location.href = url.pathname + (url.search ? url.search : '') + url.hash;
            } else {
              window.location.href = getPortalSwitchUrl('patient');
            }
          }}
        />
      </div>
    );
  }

  const isLandingView = !currentUser || activeTab === 'landing';

  return (
    <>
      <MaintenanceBanner />
      {isLandingView ? (
        <div className="landing-layout">
          {/* Top Header shown on Landing Page */}
          <Header
            currentUser={currentUser}
            notifications={notifications}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onOpenAuth={() => setAuthModalOpen(true)}
            onLogout={handleLogout}
          />

          <NotificationBanner
            notification={activeBanner}
            onDismiss={() => setActiveBanner(null)}
          />

          <main className="landing-content-container page-transition-enter">
            <LandingPage
              onOpenAuth={() => setAuthModalOpen(true)}
              currentUser={currentUser}
              onSelectTab={handleSelectTab}
            />
          </main>
        </div>
      ) : (
        <div className="app-layout">
          {/* Left Sidebar on Desktop / Drawer on Mobile only at User Portal */}
          <Sidebar
            currentUser={currentUser}
            notifications={notifications}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onOpenAuth={() => setAuthModalOpen(true)}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <div className="app-main-content">
            <NotificationBanner
              notification={activeBanner}
              onDismiss={() => setActiveBanner(null)}
            />

            <main className="app-content-inner">
              {/* --- PORTAL VIEW ROUTING WITH FLUID PAGE-TRANSITION --- */}
              <div
                key={activeTab}
                className="page-transition-enter"
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0,
                }}
              >
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
                    onNavigateToDiscovery={() => setActiveTab('patient_discovery')}
                    onNavigateToTracker={() => setActiveTab('patient_live_ticket')}
                  />
                )}

                {activeTab === 'patient_live_ticket' && (
                  <LiveTicketTracker
                    initialTicketId={selectedTicketId}
                    onExploreHospitals={() => setActiveTab('patient_discovery')}
                    onConsultAi={() => setActiveTab('patient_triage')}
                  />
                )}

                {activeTab === 'patient_history' && (
                  <PatientHistory
                    onExploreHospitals={() => setActiveTab('patient_discovery')}
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

                {activeTab === 'partner_staff' && (
                  <StaffManagement />
                )}

                {activeTab === 'partner_profile' && (
                  <HospitalProfile />
                )}

                {activeTab === 'admin_center' && (
                  <AdminDashboard />
                )}
              </div>
            </main>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleUserLoginSuccess}
        onOpenHospitalPortal={() => {
          setAuthModalOpen(false);
          window.location.href = getPortalSwitchUrl('partner');
        }}
      />
    </>
  );
};
