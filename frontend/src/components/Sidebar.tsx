import React, { useState } from 'react';
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
import { UserProfile } from '../services/auth';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
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

  const isPartner = currentUser && ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'].includes(currentUser.role);
  const isAdmin = currentUser && currentUser.role === 'SUPER_ADMIN';

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="mobile-header">
        <button
          onClick={() => handleNavClick('patient_triage')}
          className="brand-logo"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <img
            src={prosethLogo}
            alt="Proseth Logo"
            style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <span style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              fontFamily: 'var(--font-khmer), sans-serif',
            }}>
              ជំនួយការសុខភាព
            </span>
          </div>
        </button>

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
        {/* Top Brand Logo */}
        <div className="sidebar-header">
          <button
            onClick={() => handleNavClick('patient_triage')}
            className="brand-logo"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
          >
            <img
              src={prosethLogo}
              alt="Proseth Logo"
              style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <div style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                lineHeight: 1.25,
                fontFamily: 'var(--font-khmer), sans-serif',
              }}>
                ជំនួយការសុខភាព
              </div>
            </div>
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

        {/* Bottom Section (Language Switcher + Notifications + User info / Sign in) */}
        <div className="sidebar-footer">
          {/* Language Switcher in Sidebar Footer */}
          <div style={{ width: '100%', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <LanguageSwitcher style={{ width: '100%', justifyContent: 'center' }} />
          </div>

          {/* Notifications Trigger */}
          {currentUser && (
            <div style={{ position: 'relative', width: '100%', marginBottom: '0.6rem' }}>
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

              {/* Notifications Popup */}
              {showNotifMenu && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 6px)',
                    left: 0,
                    width: '280px',
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    zIndex: 200,
                    padding: '0.95rem',
                    boxShadow: 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>{t('notifications')}</span>
                    <button
                      onClick={() => setShowNotifMenu(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.85rem 0' }}>
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
                          <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '2px', fontSize: '0.88rem' }}>
                            {n.title}
                          </div>
                          <div style={{ color: 'var(--text-muted)' }}>{n.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

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
                }}>
                  <User size={17} />
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
