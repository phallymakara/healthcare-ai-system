import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { NotificationBanner } from './components/NotificationBanner';
import { MaintenanceBanner } from './components/MaintenanceBanner';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ServerConfigModal } from './components/ServerConfigModal';
import { useLanguage } from './context/LanguageContext';
import { AuthService, UserProfile } from './services/auth';
import { API_BASE } from './services/api';
import { RealTimeQueueClient } from './services/websocket';
import { LandingPage } from './pages/landing/LandingPage';
import { HospitalDiscovery } from './pages/patient/HospitalDiscovery';
import { HealthcareAssistant } from './pages/patient/HealthcareAssistant';
import { ComingSoonView } from './components/common/ComingSoonView';
import { PartnerDashboard } from './pages/partner/PartnerDashboard';
import { QueueManagement } from './pages/partner/QueueManagement';
import { DoctorManagement } from './pages/partner/DoctorManagement';
import { DepartmentManagement } from './pages/partner/DepartmentManagement';
import { StaffManagement } from './pages/partner/StaffManagement';
import { HospitalProfile } from './pages/partner/HospitalProfile';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { HospitalPartnerAuth } from './pages/partner/HospitalPartnerAuth';
import { isPartnerPortal, getPortalSwitchUrl } from './utils/subdomain';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { useVisualViewport } from './hooks/useVisualViewport';

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

  // Show Chumnouykar AI Assistant Widget ONLY on Landing Page
  useEffect(() => {
    const isLanding = !isPartner && activeTab === 'landing';
    if (isLanding) {
      document.body.classList.add('is-landing-page');
    } else {
      document.body.classList.remove('is-landing-page');
    }

    const syncWidgetVisibility = () => {
      const widget = document.getElementById('aisale-widget-root');
      if (widget) {
        if (isLanding) {
          widget.style.removeProperty('display');
          widget.style.removeProperty('visibility');
          widget.style.removeProperty('pointer-events');
          widget.style.removeProperty('opacity');
        } else {
          widget.style.setProperty('display', 'none', 'important');
          widget.style.setProperty('visibility', 'hidden', 'important');
          widget.style.setProperty('pointer-events', 'none', 'important');
          widget.style.setProperty('opacity', '0', 'important');
        }
      }
    };

    syncWidgetVisibility();

    const observer = new MutationObserver(() => {
      syncWidgetVisibility();
    });
    observer.observe(document.body, { childList: true });

    return () => {
      observer.disconnect();
    };
  }, [activeTab, isPartner]);

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
    ];

    if (!currentUser && protectedTabs.includes(tab)) {
      setAuthModalOpen(true);
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
            setIsPartner(false);
            const url = new URL(window.location.href);
            if (url.searchParams.has('portal')) {
              url.searchParams.delete('portal');
              const targetUrl = url.pathname + (url.search ? url.search : '') + url.hash;
              try {
                window.history.pushState({ portal: 'patient' }, '', targetUrl);
              } catch {
                window.location.href = targetUrl;
              }
            } else {
              const targetUrl = getPortalSwitchUrl('patient');
              try {
                window.history.pushState({ portal: 'patient' }, '', targetUrl);
              } catch {
                window.location.href = targetUrl;
              }
            }
          }}
        />
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
            <LandingPage
              onOpenAuth={() => setAuthModalOpen(true)}
              currentUser={currentUser}
              onSelectTab={handleSelectTab}
              onStartChatWithQuery={handleStartChatWithQuery}
            />
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
                  <ComingSoonView type="ticket" />
                )}

                {activeTab === 'patient_history' && (
                  <ComingSoonView type="history" />
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
          setIsPartner(true);
          const targetUrl = getPortalSwitchUrl('partner');
          try {
            window.history.pushState({ portal: 'partner' }, '', targetUrl);
          } catch {
            window.location.href = targetUrl;
          }
        }}
      />

      <PWAInstallBanner />

      <ServerConfigModal
        isOpen={serverConfigOpen}
        onClose={() => setServerConfigOpen(false)}
        isKm={isKm}
      />
    </>
  );
};
