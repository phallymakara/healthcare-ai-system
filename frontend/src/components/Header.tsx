import React, { useState } from 'react';
import { Activity, LogIn, LogOut, User, Shield, Stethoscope, Bell, X } from 'lucide-react';
import { UserProfile } from '../services/auth';

interface HeaderProps {
  systemStatus: 'ok' | 'degraded' | 'checking';
  currentUser: UserProfile | null;
  notifications: any[];
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  currentUser,
  notifications,
  onOpenAuth,
  onLogout,
}) => {
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="badge" style={{ border: '1px solid #f43f5e', color: '#fb7185' }}>
            <Shield size={12} /> Admin
          </span>
        );
      case 'DOCTOR':
        return (
          <span className="badge" style={{ border: '1px solid #06b6d4', color: '#38bdf8' }}>
            <Stethoscope size={12} /> Doctor
          </span>
        );
      default:
        return (
          <span className="badge" style={{ border: '1px solid #10b981', color: '#34d399' }}>
            <User size={12} /> Patient
          </span>
        );
    }
  };

  return (
    <header className="header-wrapper">
      <div className="header-content">
        <a href="/" className="brand-logo">
          <div className="logo-icon">
            <Activity size={22} />
          </div>
          <div>
            <span>CareQueue</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', marginLeft: '6px', fontWeight: 600 }}>AI</span>
          </div>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          {/* System Status */}
          <div className="badge badge-healthy" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" style={{
              background: systemStatus === 'ok' ? '#10b981' : systemStatus === 'checking' ? '#3b82f6' : '#f59e0b'
            }}></span>
            <span style={{ fontSize: '0.75rem' }}>
              {systemStatus === 'ok' ? 'System Online' : systemStatus === 'checking' ? 'Connecting...' : 'API Standby'}
            </span>
          </div>

          {/* Notifications Bell */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              title="Notifications"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
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
                  background: 'var(--bg-card)',
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

          {/* User Auth Section */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
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
