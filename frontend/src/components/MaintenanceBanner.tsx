import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, WifiOff, X } from 'lucide-react';
import { API_BASE } from '../services/api';

interface MaintenanceBannerProps {
  checkIntervalSeconds?: number;
}

export const MaintenanceBanner: React.FC<MaintenanceBannerProps> = ({ checkIntervalSeconds = 30 }) => {
  const [isIssueDetected, setIsIssueDetected] = useState(false);
  const [issueType, setIssueType] = useState<'maintenance' | 'offline' | 'unreachable'>('maintenance');
  const [isChecking, setIsChecking] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkStatus = async () => {
    if (!navigator.onLine) {
      setIsIssueDetected(true);
      setIssueType('offline');
      return;
    }

    try {
      setIsChecking(true);
      const res = await fetch(`${API_BASE}/health`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (res.status === 502 || res.status === 503 || res.status === 504) {
        setIsIssueDetected(true);
        setIssueType('maintenance');
      } else if (!res.ok) {
        setIsIssueDetected(true);
        setIssueType('unreachable');
      } else {
        // Healthy!
        setIsIssueDetected(false);
        setIsDismissed(false);
      }
    } catch {
      setIsIssueDetected(true);
      setIssueType('maintenance');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOffline = () => {
      setIsIssueDetected(true);
      setIssueType('offline');
      setIsDismissed(false);
    };

    const handleOnline = () => {
      checkStatus();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Periodic background health poll
    const interval = setInterval(checkStatus, checkIntervalSeconds * 1000);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [checkIntervalSeconds]);

  if (!isIssueDetected || isDismissed) {
    return null;
  }

  const getNoticeContent = () => {
    switch (issueType) {
      case 'offline':
        return {
          title: 'You are offline',
          message: 'Please check your internet connection. We will reconnect as soon as network is restored.',
          icon: <WifiOff size={18} />,
        };
      case 'unreachable':
        return {
          title: 'Server Connection Interrupted',
          message: 'Unable to reach healthcare server. Attempting automatic reconnection...',
          icon: <AlertTriangle size={18} />,
        };
      case 'maintenance':
      default:
        return {
          title: 'Server Under Maintenance',
          message: 'Our healthcare server is currently undergoing updates or maintenance. Real-time updates may be briefly delayed.',
          icon: <AlertTriangle size={18} />,
        };
    }
  };

  const notice = getNoticeContent();

  return (
    <div
      role="alert"
      style={{
        width: '100%',
        backgroundColor: '#78350f',
        background: 'linear-gradient(90deg, #78350f 0%, #92400e 50%, #78350f 100%)',
        color: '#fef3c7',
        borderBottom: '1px solid #b45309',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '13.5px',
        fontWeight: 500,
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fde68a', flexShrink: 0 }}>{notice.icon}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px' }}>
          <strong style={{ color: '#ffffff', fontWeight: 700 }}>{notice.title}:</strong>
          <span style={{ color: '#fef3c7', opacity: 0.95 }}>{notice.message}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={checkStatus}
          disabled={isChecking}
          title="Retry server connection"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '12px',
            cursor: isChecking ? 'wait' : 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          <RefreshCw size={12} className={isChecking ? 'animate-spin' : ''} style={{ animation: isChecking ? 'spin 1s linear infinite' : 'none' }} />
          {isChecking ? 'Checking...' : 'Retry'}
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          title="Dismiss notice"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fde68a',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
