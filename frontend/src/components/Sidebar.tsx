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
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
          />
          <div>
            <span>Health AI</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginLeft: '4px', fontWeight: 700 }}>
              Assistant
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
              style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
            />
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                Health AI
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                Assistant
              </div>
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {/* Patient / Public Items */}
          {(!currentUser || (!isPartner && !isAdmin)) && (
            <>
              <div className="sidebar-section-label">Navigation</div>
              <button
                onClick={() => handleNavClick('patient_triage')}
                className={`sidebar-nav-item ${activeTab === 'patient_triage' ? 'active' : ''}`}
              >
                <Activity size={18} />
                <span>{t('nav_chat')}</span>
              </button>

              <button
                onClick={() => handleNavClick('patient_discovery')}
                className={`sidebar-nav-item ${activeTab === 'patient_discovery' ? 'active' : ''}`}
              >
                <Search size={18} />
                <span>{t('nav_hospitals')}</span>
              </button>

              <button
                onClick={() => handleNavClick('patient_live_ticket')}
                className={`sidebar-nav-item ${activeTab === 'patient_live_ticket' ? 'active' : ''}`}
              >
                <Ticket size={18} />
                <span>{t('nav_live_queue')}</span>
              </button>

              <button
                onClick={() => handleNavClick('patient_history')}
                className={`sidebar-nav-item ${activeTab === 'patient_history' ? 'active' : ''}`}
              >
                <Clock size={18} />
                <span>{t('nav_history')}</span>
              </button>
            </>
          )}

          {/* Hospital Partner Items */}
          {isPartner && (
            <>
              <div className="sidebar-section-label">Partner Console</div>
              <button
                onClick={() => handleNavClick('partner_dashboard')}
                className={`sidebar-nav-item ${activeTab === 'partner_dashboard' ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                <span>Overview</span>
              </button>

              <button
                onClick={() => handleNavClick('partner_counter')}
                className={`sidebar-nav-item ${activeTab === 'partner_counter' ? 'active' : ''}`}
              >
                <Users size={18} />
                <span>{t('nav_counter')}</span>
              </button>

              <button
                onClick={() => handleNavClick('partner_doctors')}
                className={`sidebar-nav-item ${activeTab === 'partner_doctors' ? 'active' : ''}`}
              >
                <UserCheck size={18} />
                <span>{t('nav_doctor_shifts')}</span>
              </button>

              <button
                onClick={() => handleNavClick('partner_departments')}
                className={`sidebar-nav-item ${activeTab === 'partner_departments' ? 'active' : ''}`}
              >
                <Building2 size={18} />
                <span>{t('nav_departments')}</span>
              </button>

              <button
                onClick={() => handleNavClick('partner_staff')}
                className={`sidebar-nav-item ${activeTab === 'partner_staff' ? 'active' : ''}`}
              >
                <Shield size={18} />
                <span>{t('nav_staff')}</span>
              </button>

              <button
                onClick={() => handleNavClick('partner_profile')}
                className={`sidebar-nav-item ${activeTab === 'partner_profile' ? 'active' : ''}`}
              >
                <Building2 size={18} />
                <span>{t('nav_profile')}</span>
              </button>
            </>
          )}

          {/* Super Admin Items */}
          {isAdmin && (
            <>
              <div className="sidebar-section-label">Admin Management</div>
              <button
                onClick={() => handleNavClick('admin_center')}
                className={`sidebar-nav-item ${activeTab === 'admin_center' ? 'active' : ''}`}
              >
                <Shield size={18} />
                <span>{t('nav_admin')}</span>
              </button>
            </>
          )}
        </nav>

        {/* Bottom Section (Language Switcher + Notifications + User info / Sign in) */}
        <div className="sidebar-footer">
          {/* Language Switcher in Sidebar Footer */}
          <div style={{ width: '100%', marginBottom: '0.6rem', display: 'flex', justifyContent: 'center' }}>
            <LanguageSwitcher style={{ width: '100%', justifyContent: 'center' }} />
          </div>

          {/* Notifications Trigger */}
          {currentUser && (
            <div style={{ position: 'relative', width: '100%', marginBottom: '0.5rem' }}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.25rem',
                  fontSize: '0.8rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  color: 'var(--text-main)',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bell size={16} color="var(--accent-primary)" />
                  <span>{t('notifications')}</span>
                </span>
                {notifications.length > 0 && (
                  <span style={{
                    background: 'var(--accent-primary)',
                    color: '#fff',
                    borderRadius: '9999px',
                    padding: '1px 6px',
                    fontSize: '0.7rem',
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
                    width: '260px',
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    zIndex: 200,
                    padding: '0.85rem',
                    boxShadow: 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{t('notifications')}</span>
                    <button
                      onClick={() => setShowNotifMenu(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.75rem 0' }}>
                      {t('no_notifications')}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                      {notifications.map((n, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.45rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '5px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.72rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '2px' }}>
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
            <div className="sidebar-user-card" style={{ background: 'transparent', border: 'none', padding: '0.4rem 0', boxShadow: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-main)',
                  flexShrink: 0,
                }}>
                  <User size={15} />
                </div>
                <div style={{
                  fontSize: '0.85rem',
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
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.6rem 1rem',
                fontSize: '0.875rem',
              }}
            >
              <LogIn size={16} /> {t('sign_in')}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
