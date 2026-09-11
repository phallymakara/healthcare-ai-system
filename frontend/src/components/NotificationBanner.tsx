import React from 'react';
import { Bell, X } from 'lucide-react';

interface NotificationBannerProps {
  notification: {
    title: string;
    message: string;
    notification_type?: string;
  } | null;
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ notification, onDismiss }) => {
  if (!notification) return null;

  const isUrgent = notification.notification_type === 'PATIENT_CALLED' || notification.notification_type === 'TURN_APPROACHING';

  return (
    <div
      className="notification-banner-animate"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 200,
        maxWidth: '380px',
        width: 'calc(100% - 2rem)',
        background: 'var(--bg-card)',
        border: `1px solid ${isUrgent ? 'var(--accent-primary)' : 'var(--border-highlight)'}`,
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
      }}
    >
      <div style={{ color: isUrgent ? 'var(--accent-primary)' : 'var(--accent-cyan)', marginTop: '2px' }}>
        <Bell size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '2px', color: '#fff' }}>
          {notification.title}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
          {notification.message}
        </div>
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-dim)',
          cursor: 'pointer',
          padding: '2px',
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};
