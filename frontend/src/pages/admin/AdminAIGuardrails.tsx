import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { RealTimeQueueClient } from '../../services/websocket';
import {
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Cpu,
  Lock,
} from 'lucide-react';
import { API_BASE } from '../../services/api';

export const AdminAIGuardrails: React.FC = () => {
  const { language } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [telemetry, setTelemetry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadTelemetry = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setActionError(null);
    try {
      const headers = AuthService.getAuthHeaders();
      const res = await fetch(`${API_BASE}/admin/ai-telemetry`, { headers });
      if (res.ok) {
        setTelemetry(await res.json());
      }
    } catch {
      // Quiet background failure
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry(false);

    const ws = new RealTimeQueueClient('global');
    ws.connect();
    const unsubscribe = ws.subscribe((msg?: any) => {
      if (!msg || msg.event === 'audit_log_created') {
        loadTelemetry(true);
      }
    });

    const interval = setInterval(() => {
      loadTelemetry(true);
    }, 5000);

    return () => {
      unsubscribe();
      ws.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleResetLimit = async (limitId: string) => {
    setActionError(null);
    setResettingId(limitId);
    try {
      const res = await fetch(`${API_BASE}/admin/guest-limits/${limitId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
      });

      if (!res.ok) {
        setActionError('Failed to reset guest limit quota.');
        return;
      }
      await loadTelemetry(true);
    } catch {
      setActionError('Network error while resetting guest rate limit.');
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: kmFont,
      }}
    >
      {/* Top Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '6px' }}>
            <Cpu size={16} color="var(--accent-primary)" />
            <span>AI Foundry Model</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {telemetry?.model_name || 'Azure OpenAI (GPT-4o)'}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#059669', marginTop: '4px', fontWeight: 500 }}>
            Operational & High Availability
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '6px' }}>
            <ShieldCheck size={16} color="#059669" />
            <span>Clinical Guardrails</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Active & Enforced
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Domain restriction & Prompt injection filter
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '6px' }}>
            <Lock size={16} color="#d97706" />
            <span>Guest Quota Window</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
            7 Msgs / Hour
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            20 msgs/hour per client IP subnet
          </div>
        </div>

        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            background: 'var(--bg-card)',
            padding: '1rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '6px' }}>
            <AlertTriangle size={16} color={telemetry?.active_rate_limited_guests > 0 ? '#dc2626' : 'var(--text-muted)'} />
            <span>Rate Limited Guests</span>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: telemetry?.active_rate_limited_guests > 0 ? '#dc2626' : 'var(--text-main)' }}>
            {telemetry?.active_rate_limited_guests || 0}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {telemetry?.total_guests_tracked || 0} client fingerprints tracked
          </div>
        </div>
      </div>

      {actionError && (
        <div style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
          {actionError}
        </div>
      )}

      {/* Guest Rate Limits Table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Guest Rate Limit Telemetry
          </div>
          <button
            onClick={() => loadTelemetry(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-main)',
              fontSize: '0.76rem',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={13} /> Refresh
          </button>
        </div>

        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            background: 'var(--bg-card)',
            overflow: 'hidden',
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ overflowX: 'auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.85rem',
                height: (!telemetry?.recent_limits || telemetry.recent_limits.length === 0) ? '100%' : 'auto',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'rgba(0, 0, 0, 0.02)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Client Identifier
                  </th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', width: '120px' }}>
                    Type
                  </th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', width: '120px' }}>
                    Message Count
                  </th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', width: '140px' }}>
                    Status
                  </th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right', width: '120px' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (!telemetry || !telemetry.recent_limits) ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', height: '100%', verticalAlign: 'middle' }}>
                      Loading guest rate limit telemetry...
                    </td>
                  </tr>
                ) : !telemetry?.recent_limits || telemetry.recent_limits.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', height: '100%', verticalAlign: 'middle' }}>
                      Zero guest rate limit entries currently active.
                    </td>
                  </tr>
                ) : (
                  telemetry.recent_limits.map((item: any) => {
                    const isResetting = resettingId === item.id;
                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.015)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            {item.identifier}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px', verticalAlign: 'middle', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {item.identifier_type}
                        </td>

                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {item.message_count}
                          </span>{' '}
                          / {item.max_allowed}
                        </td>

                        <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              color: item.is_rate_limited ? '#dc2626' : '#059669',
                            }}
                          >
                            {item.is_rate_limited ? 'Rate Limited' : 'Within Quota'}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                          <button
                            disabled={isResetting || item.message_count === 0}
                            onClick={() => handleResetLimit(item.id)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              background: 'transparent',
                              color: item.message_count > 0 ? 'var(--text-main)' : 'var(--text-muted)',
                              fontSize: '0.76rem',
                              cursor: item.message_count > 0 ? 'pointer' : 'default',
                              opacity: isResetting ? 0.6 : 1,
                            }}
                          >
                            {isResetting ? 'Resetting...' : 'Reset'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
