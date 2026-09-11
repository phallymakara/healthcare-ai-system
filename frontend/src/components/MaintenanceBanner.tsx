import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { API_BASE } from '../services/api';

interface MaintenanceBannerProps {
  checkIntervalSeconds?: number;
}

export const MaintenanceBanner: React.FC<MaintenanceBannerProps> = ({ checkIntervalSeconds = 30 }) => {
  const [isIssueDetected, setIsIssueDetected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const checkStatus = async () => {
    if (!navigator.onLine) {
      setIsIssueDetected(true);
      return;
    }

    try {
      setIsChecking(true);
      const res = await fetch(`${API_BASE}/health`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (res.status === 502 || res.status === 503 || res.status === 504 || !res.ok) {
        setIsIssueDetected(true);
      } else {
        setIsIssueDetected(false);
        setIsDismissed(false);
      }
    } catch {
      setIsIssueDetected(true);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const handleOffline = () => {
      setIsIssueDetected(true);
      setIsDismissed(false);
    };

    const handleOnline = () => {
      checkStatus();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

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

  return (
    <div
      role="alert"
      style={{
        width: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        fontSize: '0.85rem',
        fontFamily: 'var(--font-main)',
        position: 'sticky',
        top: 0,
        zIndex: 1001,
        color: 'var(--text-main)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
        <AlertTriangle size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ color: 'var(--text-main)', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.3 }}>
            ម៉ាស៊ីនមេកំពុងស្ថិតក្រោមការថែទាំ — យើងនឹងត្រឡប់មកវិញក្នុងពេលឆាប់ៗនេះ
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', lineHeight: 1.3 }}>
            Server Under Maintenance — We will be back soon
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={checkStatus}
          disabled={isChecking}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.2rem 0.5rem',
            fontSize: '0.75rem',
            fontWeight: 500,
            cursor: isChecking ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <RefreshCw
            size={11}
            style={{
              animation: isChecking ? 'spin 1s linear infinite' : 'none',
              transformOrigin: 'center',
            }}
          />
          {isChecking ? 'Checking...' : 'Check Status'}
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          title="Dismiss notice"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
