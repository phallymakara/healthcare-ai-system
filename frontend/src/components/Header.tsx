import React, { useState } from 'react';
import { LogIn, LogOut, User, Bell, X, Menu } from 'lucide-react';
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

interface HeaderProps {
  currentUser: UserProfile | null;
  notifications: any[];
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  notifications,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onLogout,
}) => {
  const { t } = useLanguage();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPartner = currentUser && ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'].includes(currentUser.role);
  const isAdmin = currentUser && currentUser.role === 'SUPER_ADMIN';
  const isPatient = currentUser && currentUser.role === 'PATIENT';

  return (
    <header className="header-wrapper">
      <div className="header-content">
        {/* Brand Logo - Navigates to Landing page (Left) */}
        {/* Brand Logo - Navigates to Landing page (Left) */}
        <div className="header-brand">
          <button 
            onClick={() => onSelectTab('patient_triage')} 
            className="brand-logo"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img 
              src={prosethLogo} 
              alt="Proseth Logo" 
              style={{ height: '40px', width: 'auto', objectFit: 'contain' }} 
            />
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.22rem', fontWeight: 800 }}>{t('app_title')}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', marginLeft: '6px', fontWeight: 700 }}>{t('app_subtitle')}</span>
            </div>
          </button>
        </div>

        {/* Navigation Links shown on Desktop (Center) */}
        <nav className="header-nav">
          {/* Patient / Public Navigation */}
          {(!currentUser || isPatient) && (
            <>
              <button
                  onClick={() => {
                    if (activeTab === 'landing' || !currentUser) {
                      document.getElementById('patient-features')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      onSelectTab('patient_triage');
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'patient_triage' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: activeTab === 'patient_triage' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'patient_triage' ? 700 : 500,
                    padding: '0.5rem 0',
                    fontSize: '1.02rem',
                    cursor: 'pointer',
                  }}
                >
                  {t('nav_chat')}
                </button>

                <button
                  onClick={() => {
                    if (activeTab === 'landing' || !currentUser) {
                      document.getElementById('hospital-features')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      onSelectTab('patient_discovery');
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'patient_discovery' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: activeTab === 'patient_discovery' ? 'var(--accent-primary)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'patient_discovery' ? 700 : 500,
                    padding: '0.5rem 0',
                    fontSize: '1.02rem',
                    cursor: 'pointer',
                  }}
                >
                  {t('nav_hospitals')}
                </button>

                {isPatient && (
                  <>
                    <button
                      onClick={() => onSelectTab('patient_live_ticket')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'patient_live_ticket' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        color: activeTab === 'patient_live_ticket' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'patient_live_ticket' ? 700 : 500,
                        padding: '0.5rem 0',
                        fontSize: '1.02rem',
                        cursor: 'pointer',
                      }}
                    >
                      {t('nav_live_queue')}
                    </button>

                    <button
                      onClick={() => onSelectTab('patient_history')}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: activeTab === 'patient_history' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        color: activeTab === 'patient_history' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'patient_history' ? 700 : 500,
                        padding: '0.5rem 0',
                        fontSize: '1.02rem',
                        cursor: 'pointer',
                      }}
                    >
                      {t('nav_history')}
                    </button>
                  </>
                )}
              </>
            )}

            {/* Hospital Partner Navigation */}
            {isPartner && (
              <>
                <button
                  onClick={() => onSelectTab('partner_counter')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'partner_counter' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                    color: activeTab === 'partner_counter' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'partner_counter' ? 700 : 500,
                    padding: '0.5rem 0',
                    fontSize: '1.02rem',
                    cursor: 'pointer',
                  }}
                >
                  {t('nav_counter')}
                </button>

                <button
                  onClick={() => onSelectTab('partner_dashboard')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'partner_dashboard' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                    color: activeTab === 'partner_dashboard' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'partner_dashboard' ? 700 : 500,
                    padding: '0.5rem 0',
                    fontSize: '1.02rem',
                    cursor: 'pointer',
                  }}
                >
                  Overview
                </button>

                <button
                  onClick={() => onSelectTab('partner_doctors')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'partner_doctors' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                    color: activeTab === 'partner_doctors' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'partner_doctors' ? 700 : 500,
                    padding: '0.5rem 0',
                    fontSize: '1.02rem',
                    cursor: 'pointer',
                  }}
                >
                  {t('nav_doctor_shifts')}
                </button>

                <button
                  onClick={() => onSelectTab('partner_departments')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'partner_departments' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                    color: activeTab === 'partner_departments' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    fontWeight: activeTab === 'partner_departments' ? 700 : 500,
                    padding: '0.5rem 0',
                    fontSize: '1.02rem',
                    cursor: 'pointer',
                  }}
                >
                  {t('nav_departments')}
                </button>
              </>
            )}

            {/* Super Admin Navigation */}
            {isAdmin && (
              <button
                onClick={() => onSelectTab('admin_center')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'admin_center' ? '2px solid #7c3aed' : '2px solid transparent',
                  color: activeTab === 'admin_center' ? '#7c3aed' : 'var(--text-muted)',
                  fontWeight: activeTab === 'admin_center' ? 700 : 500,
                  padding: '0.5rem 0',
                  fontSize: '1.02rem',
                  cursor: 'pointer',
                }}
              >
                {t('nav_admin')}
              </button>
            )}
          </nav>

        {/* Right Header Utilities (Right) */}
        <div className="header-actions">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications Bell (Only when logged in) - Container removed */}
          {currentUser && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                title="Notifications"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '6px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: 'none',
                }}
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--accent-primary)',
                  }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '320px',
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    zIndex: 150,
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Notifications</span>
                    <button
                      onClick={() => setShowNotifMenu(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem' }}>
                      No recent notifications
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                      {notifications.map((n, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '0.5rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.75rem',
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

          {/* User Profile Section - Container removed, displays clean user profile */}
          {currentUser ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                title={currentUser.full_name}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  boxShadow: 'none',
                  color: 'var(--text-main)',
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                }}>
                  <User size={16} />
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '200px',
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    zIndex: 150,
                    padding: '0.75rem',
                    boxShadow: 'none',
                  }}
                >
                  <div style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {currentUser.full_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {currentUser.role === 'PATIENT' ? 'Patient' : currentUser.role}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      padding: '0.35rem 0',
                    }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn btn-primary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.98rem' }}>
              <LogIn size={17} /> {t('sign_in')}
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="header-mobile-toggle"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="header-mobile-dropdown">
          {(!currentUser || isPatient) && (
            <>
              <button
                onClick={() => {
                  if (activeTab === 'landing' || !currentUser) {
                    document.getElementById('patient-features')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  } else {
                    onSelectTab('patient_triage');
                    setMobileMenuOpen(false);
                  }
                }}
                className={`header-mobile-link ${activeTab === 'patient_triage' ? 'active' : ''}`}
              >
                Chat
              </button>

              <button
                onClick={() => {
                  if (activeTab === 'landing' || !currentUser) {
                    document.getElementById('hospital-features')?.scrollIntoView({ behavior: 'smooth' });
                    setMobileMenuOpen(false);
                  } else {
                    onSelectTab('patient_discovery');
                    setMobileMenuOpen(false);
                  }
                }}
                className={`header-mobile-link ${activeTab === 'patient_discovery' ? 'active' : ''}`}
              >
                Hospital & Clinic
              </button>

              {isPatient && currentUser && (
                <>
                  <button
                    onClick={() => { onSelectTab('patient_live_ticket'); setMobileMenuOpen(false); }}
                    className={`header-mobile-link ${activeTab === 'patient_live_ticket' ? 'active' : ''}`}
                  >
                    {t('nav_live_queue')}
                  </button>

                  <button
                    onClick={() => { onSelectTab('patient_history'); setMobileMenuOpen(false); }}
                    className={`header-mobile-link ${activeTab === 'patient_history' ? 'active' : ''}`}
                  >
                    History
                  </button>
                </>
              )}
            </>
          )}

          {isPartner && (
            <>
              <button
                onClick={() => { onSelectTab('partner_counter'); setMobileMenuOpen(false); }}
                className={`header-mobile-link ${activeTab === 'partner_counter' ? 'active' : ''}`}
              >
                Counter Console
              </button>

              <button
                onClick={() => { onSelectTab('partner_dashboard'); setMobileMenuOpen(false); }}
                className={`header-mobile-link ${activeTab === 'partner_dashboard' ? 'active' : ''}`}
              >
                Overview
              </button>

              <button
                onClick={() => { onSelectTab('partner_doctors'); setMobileMenuOpen(false); }}
                className={`header-mobile-link ${activeTab === 'partner_doctors' ? 'active' : ''}`}
              >
                Doctor Shifts
              </button>

              <button
                onClick={() => { onSelectTab('partner_departments'); setMobileMenuOpen(false); }}
                className={`header-mobile-link ${activeTab === 'partner_departments' ? 'active' : ''}`}
              >
                Departments
              </button>
            </>
          )}

          {isAdmin && (
            <button
              onClick={() => { onSelectTab('admin_center'); setMobileMenuOpen(false); }}
              className={`header-mobile-link ${activeTab === 'admin_center' ? 'active' : ''}`}
            >
              Admin Center
            </button>
          )}
        </div>
      )}
    </header>
  );
};
