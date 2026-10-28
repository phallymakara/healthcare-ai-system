import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { NotificationBanner } from './components/NotificationBanner';
import { MaintenanceBanner } from './components/MaintenanceBanner';
import { ServerConfigModal } from './components/ServerConfigModal';
import { useLanguage } from './context/LanguageContext';
import { AuthService, UserProfile } from './services/auth';
import { API_BASE } from './services/api';
import { RealTimeQueueClient } from './services/websocket';
import { isPartnerPortal, getPortalSwitchUrl } from './utils/subdomain';
// Lazy-loaded route components for high performance and minimal initial bundle size
const LandingPage = React.lazy(() => import('./pages/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const HospitalDiscovery = React.lazy(() => import('./pages/patient/HospitalDiscovery').then(m => ({ default: m.HospitalDiscovery })));
const HealthcareAssistant = React.lazy(() => import('./pages/patient/HealthcareAssistant').then(m => ({ default: m.HealthcareAssistant })));
const LiveTicketTracker = React.lazy(() => import('./pages/patient/LiveTicketTracker').then(m => ({ default: m.LiveTicketTracker })));
const PatientHistory = React.lazy(() => import('./pages/patient/PatientHistory').then(m => ({ default: m.PatientHistory })));
const PartnerDashboard = React.lazy(() => import('./pages/partner/PartnerDashboard').then(m => ({ default: m.PartnerDashboard })));
const QueueManagement = React.lazy(() => import('./pages/partner/QueueManagement').then(m => ({ default: m.QueueManagement })));
const DoctorManagement = React.lazy(() => import('./pages/partner/DoctorManagement').then(m => ({ default: m.DoctorManagement })));
const DepartmentManagement = React.lazy(() => import('./pages/partner/DepartmentManagement').then(m => ({ default: m.DepartmentManagement })));
const StaffManagement = React.lazy(() => import('./pages/partner/StaffManagement').then(m => ({ default: m.StaffManagement })));
const HospitalProfile = React.lazy(() => import('./pages/partner/HospitalProfile').then(m => ({ default: m.HospitalProfile })));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminAuditLogs = React.lazy(() => import('./pages/admin/AdminAuditLogs').then(m => ({ default: m.AdminAuditLogs })));
const AdminPartners = React.lazy(() => import('./pages/admin/AdminPartners').then(m => ({ default: m.AdminPartners })));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminAIGuardrails = React.lazy(() => import('./pages/admin/AdminAIGuardrails').then(m => ({ default: m.AdminAIGuardrails })));
const HospitalPartnerAuth = React.lazy(() => import('./pages/partner/HospitalPartnerAuth').then(m => ({ default: m.HospitalPartnerAuth })));

const LazyPageFallback: React.FC = () => (
  <div
    style={{
      flex: 1,
      width: '100%',
      minHeight: '300px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: '0.88rem',
    }}
  >
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <span className="streaming-cursor" style={{ width: '3px', height: '1.1em' }} />
      <span>Loading...</span>
    </div>
  </div>
);
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { useVisualViewport } from './hooks/useVisualViewport';
import { useUserLocation } from './hooks/useUserLocation';

const isStandalonePWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('pwa') === '1') return true;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const App: React.FC = () => {
  // Automatically check and detect user location on system visit
  useUserLocation();
  const [isPartner, setIsPartner] = useState<boolean>(() => isPartnerPortal());

  useEffect(() => {
    const handlePopState = () => {
      setIsPartner(isPartnerPortal());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const { language } = useLanguage();
  const isKm = language === 'km';
  const storedUser = AuthService.getStoredUser();
  const { isKeyboardOpen, viewportHeight } = useVisualViewport();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(storedUser);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [serverConfigOpen, setServerConfigOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeBanner, setActiveBanner] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavTab | null;
      if (tabParam && ['landing', 'patient_triage', 'patient_discovery', 'patient_live_ticket'].includes(tabParam)) {
        return tabParam;
      }
    }
    if (storedUser) {
      if (storedUser.role === 'SUPER_ADMIN') return 'admin_center';
      if (storedUser.role === 'DOCTOR' || storedUser.role === 'HOSPITAL_ADMIN' || storedUser.role === 'RECEPTIONIST') {
        return 'partner_counter';
      }
      return 'patient_triage';
    }
    // When opened as an installed PWA on mobile, skip landing page and go directly to AI Chat!
    if (isStandalonePWA()) {
      return 'patient_triage';
    }
    return 'landing';
  });
  const [selectedTicketId, setSelectedTicketId] = useState<string | undefined>();
  const [pendingChatQuery, setPendingChatQuery] = useState<string | undefined>();

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
      // Preserve tab if loaded with URL parameter, or go straight to AI chat in PWA mode
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const tabParam = params?.get('tab') as NavTab | null;
      if (tabParam && ['patient_triage', 'patient_discovery', 'patient_live_ticket'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else if (isStandalonePWA()) {
        setActiveTab('patient_triage');
      }
    }

    // 2. Initialize WebSocket connection for background alerts
    const ws = new RealTimeQueueClient('global');
    ws.connect();
    const unsubscribe = ws.subscribe((data: any) => {
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

  // 3. Native Capacitor Setup: Status Bar, Splash Screen & Android Hardware Back Button
  useEffect(() => {
    // Hide native splash screen once UI is mounted
    SplashScreen.hide().catch(() => {});

    // Style native status bar
    try {
      StatusBar.setBackgroundColor({ color: '#185339' }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    } catch {}

    // Android hardware back button handler
    const backButtonPromise = CapApp.addListener('backButton', () => {
      if (serverConfigOpen) {
        setServerConfigOpen(false);
        return;
      }
      if (authModalOpen) {
        setAuthModalOpen(false);
        return;
      }
      if (selectedTicketId) {
        setSelectedTicketId(undefined);
        return;
      }
      if (activeTab !== 'landing' && activeTab !== 'patient_triage') {
        setActiveTab('patient_triage');
        return;
      }
      if (activeTab === 'patient_triage' && !isStandalonePWA()) {
        setActiveTab('landing');
        return;
      }
      // On root view: minimize app
      CapApp.minimizeApp().catch(() => {});
    });

    return () => {
      backButtonPromise.then((handle) => handle.remove()).catch(() => {});
    };
  }, [serverConfigOpen, authModalOpen, selectedTicketId, activeTab]);

  const handleLogout = () => {
    AuthService.logout().catch(() => {});
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

  const handleStartChatWithQuery = (query: string) => {
    setPendingChatQuery(query);
    setActiveTab('patient_triage');
  };

  const handleSelectTab = (tab: NavTab) => {
    const protectedTabs: NavTab[] = [
      'partner_dashboard',
      'partner_counter',
      'partner_doctors',
      'partner_departments',
      'partner_staff',
      'partner_profile',
      'admin_center',
      'admin_audit_logs',
      'admin_partners',
      'admin_users',
      'admin_ai_guardrails',
    ];

    if (!currentUser && protectedTabs.includes(tab)) {
      setAuthModalOpen(true);
      return;
    }

    // If user is already logged in, do not allow routing to the public landing page
    if (currentUser && tab === 'landing') {
      if (currentUser.role === 'SUPER_ADMIN') {
        setActiveTab('admin_center');
      } else if (['DOCTOR', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'NURSE'].includes(currentUser.role)) {
        setActiveTab('partner_dashboard');
      } else {
        setActiveTab('patient_triage');
      }
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
        <React.Suspense fallback={<LazyPageFallback />}>
          <HospitalPartnerAuth
            onSuccess={handleUserLoginSuccess}
            onSwitchToPatient={() => {
              setIsPartner(false);
              const targetUrl = getPortalSwitchUrl('patient');
              try {
                window.history.pushState({ portal: 'patient' }, '', targetUrl);
              } catch {
                window.location.href = targetUrl;
              }
            }}
          />
        </React.Suspense>
      </div>
    );
  }

  const isLandingView = activeTab === 'landing';

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
            onOpenServerConfig={() => setServerConfigOpen(true)}
          />

          <NotificationBanner
            notification={activeBanner}
            onDismiss={() => setActiveBanner(null)}
          />

          <main className="landing-content-container page-transition-enter">
            <React.Suspense fallback={<LazyPageFallback />}>
              <LandingPage
                onOpenAuth={() => setAuthModalOpen(true)}
                currentUser={currentUser}
                onSelectTab={handleSelectTab}
                onStartChatWithQuery={handleStartChatWithQuery}
              />
            </React.Suspense>
          </main>
        </div>
      ) : (
        <div
          className="app-layout"
          style={{
            height: isKeyboardOpen && viewportHeight > 0 ? `${viewportHeight}px` : undefined,
          }}
        >
          {/* Left Sidebar on Desktop / Drawer on Mobile only at User Portal */}
          <Sidebar
            currentUser={currentUser}
            notifications={notifications}
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            onOpenAuth={() => setAuthModalOpen(true)}
            onLogout={handleLogout}
            onOpenServerConfig={() => setServerConfigOpen(true)}
          />

          {/* Main Content Area */}
          <div className={`app-main-content ${isKeyboardOpen ? 'keyboard-open' : ''}`}>
            <NotificationBanner
              notification={activeBanner}
              onDismiss={() => setActiveBanner(null)}
            />

            <main className="app-content-inner">
              {/* --- PORTAL VIEW ROUTING WITH FLUID PAGE-TRANSITION & LAZY SUSPENSE --- */}
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
                <React.Suspense fallback={<LazyPageFallback />}>
                  {activeTab === 'patient_discovery' && (
                    <HospitalDiscovery
                      onTicketBooked={handleTicketBooked}
                      onNavigateToTriage={() => setActiveTab('patient_triage')}
                      onNavigateToTracker={() => setActiveTab('patient_live_ticket')}
                    />
                  )}

                  {activeTab === 'patient_triage' && (
                    <HealthcareAssistant
                      initialQuery={pendingChatQuery}
                      onClearInitialQuery={() => setPendingChatQuery(undefined)}
                      onTicketBooked={handleTicketBooked}
                      onNavigateToDiscovery={() => setActiveTab('patient_discovery')}
                      onNavigateToTracker={() => setActiveTab('patient_live_ticket')}
                      currentUser={currentUser}
                      onOpenAuth={() => setAuthModalOpen(true)}
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

                  {activeTab === 'admin_audit_logs' && (
                    <AdminAuditLogs />
                  )}

                  {activeTab === 'admin_partners' && (
                    <AdminPartners />
                  )}

                  {activeTab === 'admin_users' && (
                    <AdminUsers />
                  )}

                  {activeTab === 'admin_ai_guardrails' && (
                    <AdminAIGuardrails />
                  )}
                </React.Suspense>
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
          setIsPartner(true);
          const targetUrl = getPortalSwitchUrl('partner');
          try {
            window.history.pushState({ portal: 'partner' }, '', targetUrl);
          } catch {
            window.location.href = targetUrl;
          }
        }}
      />

      <ServerConfigModal
        isOpen={serverConfigOpen}
        onClose={() => setServerConfigOpen(false)}
        isKm={isKm}
      />
    </>
  );
};
