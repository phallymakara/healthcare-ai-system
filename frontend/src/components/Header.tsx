import React, { useState } from 'react';
import { LogIn, LogOut, User, Shield, Stethoscope, Bell, X } from 'lucide-react';
import { UserProfile } from '../services/auth';
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
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="badge" style={{ border: '1px solid #7c3aed', color: '#7c3aed' }}>
            <Shield size={12} /> Admin
          </span>
        );
      case 'DOCTOR':
      case 'RECEPTIONIST':
      case 'HOSPITAL_ADMIN':
        return (
          <span className="badge" style={{ border: '1px solid #0284c7', color: '#0284c7' }}>
            <Stethoscope size={12} /> Staff
          </span>
        );
      default:
        return (
          <span className="badge" style={{ border: '1px solid #059669', color: '#059669' }}>
            <User size={12} /> Patient
          </span>
        );
    }
  };

  const isPartner = currentUser && ['DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'].includes(currentUser.role);
  const isAdmin = currentUser && currentUser.role === 'SUPER_ADMIN';
  const isPatient = currentUser && currentUser.role === 'PATIENT';

  return (
    <header className="header-wrapper">
      <div className="header-content">
        {/* Brand Logo - Navigates to Landing page */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <button 
            onClick={() => onSelectTab('landing')} 
            className="brand-logo"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <img 
              src={prosethLogo} 
              alt="Proseth Logo" 
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
            />
            <div>
              <span>Health AI</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginLeft: '6px', fontWeight: 700 }}>Assistant</span>
            </div>
          </button>

          {/* Navigation Links ONLY shown when user is logged in for their respective role */}
          {currentUser && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <button
                onClick={() => onSelectTab('landing')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'landing' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: activeTab === 'landing' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  fontWeight: activeTab === 'landing' ? 700 : 500,
                  padding: '0.5rem 0',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                About
              </button>

              {/* Patient Navigation */}
              {isPatient && (
                <>
                  <button
                    onClick={() => onSelectTab('patient_discovery')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'patient_discovery' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      color: activeTab === 'patient_discovery' ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: activeTab === 'patient_discovery' ? 700 : 500,
                      padding: '0.5rem 0',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Find Hospitals
                  </button>

                  <button
                    onClick={() => onSelectTab('patient_triage')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'patient_triage' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      color: activeTab === 'patient_triage' ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: activeTab === 'patient_triage' ? 700 : 500,
                      padding: '0.5rem 0',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Symptom Triage
                  </button>

                  <button
                    onClick={() => onSelectTab('patient_live_ticket')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'patient_live_ticket' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      color: activeTab === 'patient_live_ticket' ? 'var(--accent-primary)' : 'var(--text-muted)',
                      fontWeight: activeTab === 'patient_live_ticket' ? 700 : 500,
                      padding: '0.5rem 0',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Live Ticket
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
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    History
                  </button>
                </>
              )}

              {/* Hospital Partner Navigation */}
              {isPartner && (
                <>
                  <button
                    onClick={() => onSelectTab('partner_dashboard')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'partner_dashboard' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                      color: activeTab === 'partner_dashboard' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      fontWeight: activeTab === 'partner_dashboard' ? 700 : 500,
                      padding: '0.5rem 0',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Overview
                  </button>

                  <button
                    onClick={() => onSelectTab('partner_counter')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      borderBottom: activeTab === 'partner_counter' ? '2px solid var(--accent-emerald)' : '2px solid transparent',
                      color: activeTab === 'partner_counter' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                      fontWeight: activeTab === 'partner_counter' ? 700 : 500,
                      padding: '0.5rem 0',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Counter Console
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
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Doctor Shifts
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
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Departments
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
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Admin Center
                </button>
              )}
            </nav>
          )}
        </div>

        {/* Right Header Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* Notifications Bell (Only when logged in) */}
          {currentUser && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                title="Notifications"
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Bell size={16} />
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

          {/* User Auth Section */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#ffffff', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              {getRoleBadge(currentUser.role)}
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{currentUser.full_name}</span>
              <button
                onClick={onLogout}
                title="Sign Out"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth} className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
              <LogIn size={15} /> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
