import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Activity, 
  Ticket, 
  Clock, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Building2, 
  Shield, 
  LogIn, 
  LogOut, 
  User, 
  Bell, 
  X, 
  Menu 
} from 'lucide-react';
import { UserProfile, AuthService } from '../services/auth';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { API_BASE } from '../services/api';
import prosethLogo from '../assets/ProsethBot.svg';

export type NavTab = 
  | 'landing'
  | 'patient_discovery' 
  | 'patient_triage' 
  | 'patient_live_ticket' 
  | 'patient_history' 
  | 'partner_dashboard' 
  | 'partner_counter' 
  | 'partner_doctors' 
  | 'partner_departments'
  | 'partner_staff'
  | 'partner_profile'
  | 'admin_center';

interface SidebarProps {
  currentUser: UserProfile | null;
  notifications: any[];
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  notifications,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onLogout,
}) => {
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleNotifClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    if (showNotifMenu) {
      document.addEventListener('mousedown', handleNotifClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleNotifClickOutside);
    };
  }, [showNotifMenu]);

  const isPartner = currentUser && ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN', 'NURSE'].includes(currentUser.role);
  const isAdmin = currentUser && currentUser.role === 'SUPER_ADMIN';

  const [hospitalInfo, setHospitalInfo] = useState<{ name: string; logo_url?: string } | null>(() => {
    try {
      const cached = localStorage.getItem('partner_hospital_profile');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [logoImgError, setLogoImgError] = useState(false);

  useEffect(() => {
    if (isPartner) {
      const fetchHosp = () => {
        fetch(`${API_BASE}/partners/profile`, {
          headers: AuthService.getAuthHeaders(),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.name) {
              const info = { name: data.name, logo_url: data.logo_url || '' };
              setHospitalInfo(info);
              setLogoImgError(false);
              try {
                localStorage.setItem('partner_hospital_profile', JSON.stringify(info));
              } catch {}
            }
          })
          .catch(() => {});
      };

      fetchHosp();

      window.addEventListener('hospital-profile-updated', fetchHosp);
      return () => {
        window.removeEventListener('hospital-profile-updated', fetchHosp);
      };
    }
  }, [isPartner, activeTab]);

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
        {/* Mobile Top Header */}
        <div className="mobile-header">
          {isPartner ? (
            <button
              onClick={() => handleNavClick('partner_dashboard')}
              className="brand-logo"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}
            >
              {hospitalInfo?.logo_url && !logoImgError ? (
                <img
                  src={hospitalInfo.logo_url}
                  alt={hospitalInfo.name || 'Hospital Logo'}
                  onError={() => setLogoImgError(true)}
                  style={{ height: '42px', width: '42px', objectFit: 'cover', borderRadius: '50%', border: '1px solid var(--border-color)', flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    height: '42px',
                    width: '42px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-main)',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={22} />
                </div>
              )}
              <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-khmer), sans-serif',
                    display: 'block',
                    lineHeight: 1.25,
                    wordBreak: 'break-word',
                  }}
                >
                  {hospitalInfo?.name || t('nav_partner_console')}
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('patient_triage')}
              className="brand-logo"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '0.65rem' }}
            >
              <img
                src={prosethLogo}
                alt="Proseth Logo"
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              />
              <div>
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    fontFamily: 'var(--font-khmer), sans-serif',
                  }}
                >
                  {t('app_title')}
                </span>
              </div>
            </button>
          )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LanguageSwitcher />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="btn-outline"
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: '#fff' }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar (Desktop Fixed / Mobile Drawer) */}
      <aside className={`sidebar-container ${mobileOpen ? 'open' : ''}`}>
        {/* Top Brand / Hospital Header */}
        <div
          className="sidebar-header"
          style={{
            padding: '1rem 1.15rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
          {isPartner ? (
            <button
              onClick={() => handleNavClick('partner_dashboard')}
              className="brand-logo"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
              }}
              title={hospitalInfo?.name || t('nav_partner_console')}
            >
              {hospitalInfo?.logo_url && !logoImgError ? (
                <img
                  src={hospitalInfo.logo_url}
                  alt={hospitalInfo.name || 'Hospital Logo'}
                  onError={() => setLogoImgError(true)}
                  style={{
                    height: '48px',
                    width: '48px',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    border: '1px solid var(--border-color)',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    height: '48px',
                    width: '48px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-main)',
                    flexShrink: 0,
                  }}
                >
                  <Building2 size={25} />
                </div>
              )}
              <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    lineHeight: 1.28,
                    fontFamily: 'var(--font-khmer), sans-serif',
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                  title={hospitalInfo?.name || ''}
                >
                  {hospitalInfo?.name || t('nav_partner_console')}
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('patient_triage')}
              className="brand-logo"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
              }}
              title={t('app_title')}
            >
              <img
                src={prosethLogo}
                alt="Proseth Logo"
                style={{ height: '42px', width: 'auto', objectFit: 'contain', flexShrink: 0 }}
              />
              <div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: 'var(--text-main)',
                    lineHeight: 1.25,
                    fontFamily: 'var(--font-khmer), sans-serif',
                  }}
                >
                  {t('app_title')}
                </div>
              </div>
            </button>
          )}
          </div>

          {/* Mobile Close Button (Visible only in mobile drawer) */}
          <button
            onClick={() => setMobileOpen(false)}
            className="mobile-drawer-close"
            style={{
              display: 'none',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '6px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {/* Patient / Public Items */}
          {(!currentUser || (!isPartner && !isAdmin)) && (
            <>
              <div className="sidebar-section-label">{t('nav_navigation')}</div>
              <button
                onClick={() => handleNavClick('patient_triage')}
                className={`sidebar-nav-item ${activeTab === 'patient_triage' ? 'active' : ''}`}
              >
                <Activity size={20} />
                <span>{t('nav_chat')}</span>
              </button>

              <button
                onClick={() => handleNavClick('patient_discovery')}
                className={`sidebar-nav-item ${activeTab === 'patient_discovery' ? 'active' : ''}`}
              >
                <Search size={20} />
                <span>{t('nav_hospitals')}</span>
              </button>

              <button
                onClick={() => handleNavClick('patient_live_ticket')}
                className={`sidebar-nav-item ${activeTab === 'patient_live_ticket' ? 'active' : ''}`}
              >
                <Ticket size={20} />
                <span>{t('nav_live_queue')}</span>
              </button>

              <button
                onClick={() => handleNavClick('patient_history')}
                className={`sidebar-nav-item ${activeTab === 'patient_history' ? 'active' : ''}`}
              >
                <Clock size={20} />
                <span>{t('nav_history')}</span>
              </button>
            </>
          )}

          {/* Hospital Partner Items */}
          {isPartner && (
            <>
              <div className="sidebar-section-label">{t('nav_partner_console')}</div>
              <button
                onClick={() => handleNavClick('partner_dashboard')}
                className={`sidebar-nav-item ${activeTab === 'partner_dashboard' ? 'active' : ''}`}
              >
                <LayoutDashboard size={20} />
                <span>{t('nav_overview')}</span>
              </button>

              <button
                onClick={() => handleNavClick('partner_counter')}
                className={`sidebar-nav-item ${activeTab === 'partner_counter' ? 'active' : ''}`}
              >
                <Users size={20} />
                <span>{t('nav_counter')}</span>
              </button>

              <button
                onClick={() => handleNavClick('partner_doctors')}
                className={`sidebar-nav-item ${activeTab === 'partner_doctors' ? 'active' : ''}`}
              >
                <UserCheck size={20} />
                <span>{t('nav_doctor_shifts')}</span>
              </button>

              <button
                onClick={() => handleNavClick('partner_departments')}
                className={`sidebar-nav-item ${activeTab === 'partner_departments' ? 'active' : ''}`}
              >
                <Building2 size={20} />
                <span>{t('nav_departments')}</span>
              </button>

              <button
                onClick={() => handleNavClick('partner_staff')}
                className={`sidebar-nav-item ${activeTab === 'partner_staff' ? 'active' : ''}`}
              >
                <Shield size={20} />
                <span>{t('nav_staff')}</span>
              </button>

              <button
                onClick={() => handleNavClick('partner_profile')}
                className={`sidebar-nav-item ${activeTab === 'partner_profile' ? 'active' : ''}`}
              >
                <Building2 size={20} />
                <span>{t('nav_profile')}</span>
              </button>
            </>
          )}

          {/* Super Admin Items */}
          {isAdmin && (
            <>
              <div className="sidebar-section-label">{t('nav_admin_management')}</div>
              <button
                onClick={() => handleNavClick('admin_center')}
                className={`sidebar-nav-item ${activeTab === 'admin_center' ? 'active' : ''}`}
              >
                <Shield size={20} />
                <span>{t('nav_admin')}</span>
              </button>
            </>
          )}
        </nav>

        {/* Bottom Section (Notifications + Language Switcher + User info / Sign in) */}
        <div className="sidebar-footer">
          {/* Notifications Trigger */}
          {currentUser && (
            <div ref={notifRef} style={{ position: 'relative', width: '100%', marginBottom: '0.4rem' }}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.4rem',
                  fontSize: '0.95rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  color: 'var(--text-main)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={18} color="var(--accent-primary)" />
                  <span style={{ fontWeight: 500 }}>{t('notifications')}</span>
                </span>
                {notifications.length > 0 && (
                  <span style={{
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    borderRadius: '9999px',
                    padding: '2px 7px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                  }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Popup - Aligns flush with sidebar footer */}
              {showNotifMenu && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: isMobile ? 'auto' : 'calc(100% + 8px)',
                    top: isMobile ? 'calc(100% + 8px)' : 'auto',
                    left: 0,
                    right: 0,
                    width: '100%',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    zIndex: 200,
                    padding: '0.85rem',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-khmer), sans-serif' }}>
                      {t('notifications')}
                    </span>
                    <button
                      onClick={() => setShowNotifMenu(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Close notifications"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.25rem 0.5rem', fontFamily: 'var(--font-khmer), sans-serif', lineHeight: 1.4 }}>
                      {t('no_notifications')}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '220px', overflowY: 'auto' }}>
                      {notifications.map((n, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.55rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.82rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '2px', fontSize: '0.88rem', fontFamily: 'var(--font-khmer), sans-serif' }}>
                            {n.title}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-khmer), sans-serif', lineHeight: 1.35 }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Language Switcher in Sidebar Footer - Under Notification button, left aligned, no container fill */}
          <div style={{ width: '100%', marginBottom: '0.65rem' }}>
            <LanguageSwitcher dropUp={!isMobile} variant="sidebar" style={{ width: '100%' }} />
          </div>

          {/* User Profile or Sign In Button - Displays clean user profile without Patient badge */}
          {currentUser ? (
            <div className="sidebar-user-card" style={{ background: 'transparent', border: 'none', padding: '0.5rem 0', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-main)',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}>
                  {currentUser.profile_photo_url ? (
                    <img
                      src={currentUser.profile_photo_url}
                      alt={currentUser.full_name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <User size={17} />
                  )}
                </div>
                <div style={{
                  fontSize: '0.98rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {currentUser.full_name}
                </div>
              </div>
              <button
                onClick={onLogout}
                title={t('sign_out')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '5px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.7rem 1.15rem',
                fontSize: '0.98rem',
              }}
            >
              <LogIn size={18} /> {t('sign_in')}
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Tab Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {(!currentUser || (!isPartner && !isAdmin)) && (
          <>
            <button
              onClick={() => handleNavClick('patient_triage')}
              className={`mobile-tab-btn ${activeTab === 'patient_triage' ? 'active' : ''}`}
              aria-label={t('nav_chat')}
            >
              <Activity size={20} />
              <span className="mobile-tab-label">{t('nav_chat')}</span>
            </button>

            <button
              onClick={() => handleNavClick('patient_discovery')}
              className={`mobile-tab-btn ${activeTab === 'patient_discovery' ? 'active' : ''}`}
              aria-label={t('nav_hospitals')}
            >
              <Search size={20} />
              <span className="mobile-tab-label">{t('nav_hospitals')}</span>
            </button>

            <button
              onClick={() => handleNavClick('patient_live_ticket')}
              className={`mobile-tab-btn ${activeTab === 'patient_live_ticket' ? 'active' : ''}`}
              aria-label={t('nav_live_queue')}
            >
              <Ticket size={20} />
              <span className="mobile-tab-label">{t('nav_live_queue')}</span>
            </button>

            <button
              onClick={() => handleNavClick('patient_history')}
              className={`mobile-tab-btn ${activeTab === 'patient_history' ? 'active' : ''}`}
              aria-label={t('nav_history')}
            >
              <Clock size={20} />
              <span className="mobile-tab-label">{t('nav_history')}</span>
            </button>
          </>
        )}

        {isPartner && (
          <>
            <button
              onClick={() => handleNavClick('partner_counter')}
              className={`mobile-tab-btn ${activeTab === 'partner_counter' ? 'active' : ''}`}
              aria-label={t('nav_counter')}
            >
              <Users size={20} />
              <span className="mobile-tab-label">{t('nav_counter')}</span>
            </button>

            <button
              onClick={() => handleNavClick('partner_dashboard')}
              className={`mobile-tab-btn ${activeTab === 'partner_dashboard' ? 'active' : ''}`}
              aria-label={t('nav_overview')}
            >
              <LayoutDashboard size={20} />
              <span className="mobile-tab-label">{t('nav_overview')}</span>
            </button>

            <button
              onClick={() => handleNavClick('partner_doctors')}
              className={`mobile-tab-btn ${activeTab === 'partner_doctors' ? 'active' : ''}`}
              aria-label={t('nav_doctor_shifts')}
            >
              <UserCheck size={20} />
              <span className="mobile-tab-label">{t('nav_doctor_shifts')}</span>
            </button>

            <button
              onClick={() => handleNavClick('partner_departments')}
              className={`mobile-tab-btn ${activeTab === 'partner_departments' ? 'active' : ''}`}
              aria-label={t('nav_departments')}
            >
              <Building2 size={20} />
              <span className="mobile-tab-label">{t('nav_departments')}</span>
            </button>

            <button
              onClick={() => handleNavClick('partner_staff')}
              className={`mobile-tab-btn ${activeTab === 'partner_staff' ? 'active' : ''}`}
              aria-label={t('nav_staff')}
            >
              <Shield size={20} />
              <span className="mobile-tab-label">{t('nav_staff')}</span>
            </button>
          </>
        )}

        {isAdmin && (
          <>
            <button
              onClick={() => handleNavClick('admin_center')}
              className={`mobile-tab-btn ${activeTab === 'admin_center' ? 'active' : ''}`}
              aria-label={t('nav_admin')}
            >
              <Shield size={20} />
              <span className="mobile-tab-label">{t('nav_admin')}</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
};
