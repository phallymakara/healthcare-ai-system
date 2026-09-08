import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  Layers,
  Globe,
  ArrowUpRight,
} from 'lucide-react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import { RealTimeQueueClient } from '../../services/websocket';

interface PartnerDashboardProps {
  onNavigateToQueue?: (deptId?: string) => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ onNavigateToQueue }) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMetrics = async (showLoadingSpinner: boolean = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const res = await fetch(`${API_BASE}/partners/dashboard`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        setMetrics(await res.json());
        setLoadError(null);
      } else if (showLoadingSpinner) {
        setLoadError(t('pd_err_load'));
      }
    } catch {
      if (showLoadingSpinner) {
        setLoadError(t('pd_err_load'));
      }
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  // Real-time live synchronization (WebSocket + silent heartbeat polling)
  useEffect(() => {
    loadMetrics(true);

    const user = AuthService.getStoredUser();
    const hospitalId = user?.hospital_id;

    const clients: RealTimeQueueClient[] = [];
    const unsubscribers: Array<() => void> = [];

    const handleRealtimeUpdate = () => {
      loadMetrics(false);
    };

    if (hospitalId) {
      const hospWs = new RealTimeQueueClient(`hospital:${hospitalId}`);
      hospWs.connect();
      unsubscribers.push(hospWs.subscribe(handleRealtimeUpdate));
      clients.push(hospWs);
    }

    const globalWs = new RealTimeQueueClient('global');
    globalWs.connect();
    unsubscribers.push(globalWs.subscribe(handleRealtimeUpdate));
    clients.push(globalWs);

    // Silent background poll every 3 seconds for continuous real-time sync without page reloads
    const interval = setInterval(() => {
      loadMetrics(false);
    }, 3000);

    return () => {
      clearInterval(interval);
      unsubscribers.forEach((unsub) => unsub());
      clients.forEach((c) => c.disconnect());
    };
  }, []);

  return (
    <div style={{ width: '100%', fontFamily: kmFont }}>
      {/* Human-Friendly Error Display: Plain text only, no container, no shadow, no background fill */}
      {loadError && (
        <span
          className="error-text"
          style={{
            display: 'block',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            fontFamily: kmFont,
          }}
        >
          {loadError}
        </span>
      )}

      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem',
            color: 'var(--text-muted)',
            fontSize: '1.05rem',
            fontFamily: kmFont,
          }}
        >
          {t('pd_loading')}
        </div>
      ) : (
        <>
          {/* Card Set 1: Hospital Resources & Capacity Overview */}
          <div className="responsive-stat-grid-3">
            {/* Total Departments */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1.25rem 1.4rem',
                boxShadow: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                <Building2 size={18} />
                <span
                  style={{
                    fontSize: '0.88rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    fontFamily: kmFont,
                  }}
                >
                  {t('pd_total_departments')}
                </span>
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
                {metrics?.total_departments ?? metrics?.departments?.length ?? 0}
              </div>
            </div>

            {/* Total Staff & Doctors */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1.25rem 1.4rem',
                boxShadow: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                <Users size={18} />
                <span
                  style={{
                    fontSize: '0.88rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    fontFamily: kmFont,
                  }}
                >
                  {t('pd_total_staff')}
                </span>
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
                {metrics?.total_staff ?? 0}
              </div>
            </div>

            {/* Clinical Services */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1.25rem 1.4rem',
                boxShadow: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                <Layers size={18} />
                <span
                  style={{
                    fontSize: '0.88rem',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    fontFamily: kmFont,
                  }}
                >
                  {t('pd_total_services')}
                </span>
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
                {metrics?.total_services ?? 0}
              </div>
            </div>
          </div>

          {/* Card Set 2: Real-Time Operational Queue Dynamics (5 Focused KPI Cards) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            {/* Currently Waiting */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1.2rem 1.35rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                  letterSpacing: '0.02em',
                  fontFamily: kmFont,
                }}
              >
                {t('pd_currently_waiting')}
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--accent-amber, #d97706)', lineHeight: 1.15 }}>
                {metrics?.currently_waiting || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('pd_in_line')}
              </div>
            </div>

            {/* In Consultation / Serving */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1.2rem 1.35rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                  letterSpacing: '0.02em',
                  fontFamily: kmFont,
                }}
              >
                {t('pd_currently_serving')}
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--accent-primary, #0284c7)', lineHeight: 1.15 }}>
                {metrics?.currently_serving || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('pd_serving_now')}
              </div>
            </div>

            {/* Completed Today */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1.2rem 1.35rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                  letterSpacing: '0.02em',
                  fontFamily: kmFont,
                }}
              >
                {t('pd_completed_today')}
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--accent-emerald, #059669)', lineHeight: 1.15 }}>
                {metrics?.completed_today || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {t('pd_completed_consultations')}
              </div>
            </div>

            {/* Queue Clearance Rate (%) */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1.2rem 1.35rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                  letterSpacing: '0.02em',
                  fontFamily: kmFont,
                }}
              >
                {t('pd_clearance_rate')}
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
                {metrics?.clearance_rate || 0}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {metrics?.completed_today || 0} / {metrics?.total_tickets_today || 0} {t('pd_resolved')}
              </div>
            </div>

            {/* Total Visits Today with Channel Breakdown */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1.2rem 1.35rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '0.4rem',
                  letterSpacing: '0.02em',
                  fontFamily: kmFont,
                }}
              >
                {t('pd_total_visits')}
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
                {metrics?.total_tickets_today || 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {metrics?.online_bookings_today || 0} Online • {metrics?.walkin_tickets_today || 0} Walk-in
              </div>
            </div>
          </div>

          {/* Card Set 3: Intake Channels & Service Resolution Breakdown */}
          <div className="responsive-stat-grid-2">
            {/* Intake Channels & Adoption */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1.35rem 1.5rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  letterSpacing: '0.02em',
                  fontFamily: kmFont,
                }}
              >
                {t('pd_intake_channels')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.1rem' }}>
                {/* Online Channel */}
                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <Globe size={14} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: kmFont }}>{t('pd_online_bookings')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {metrics?.online_bookings_today || 0}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      ({metrics?.total_tickets_today > 0 ? Math.round(((metrics?.online_bookings_today || 0) / metrics?.total_tickets_today) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                {/* Walk-in Channel */}
                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.85rem 1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <Users size={14} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, fontFamily: kmFont }}>{t('pd_walkin_arrivals')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                      {metrics?.walkin_tickets_today || 0}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      ({metrics?.total_tickets_today > 0 ? Math.round(((metrics?.walkin_tickets_today || 0) / metrics?.total_tickets_today) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Proportion Bar */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    height: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {metrics?.total_tickets_today > 0 ? (
                    <>
                      <div
                        style={{
                          width: `${((metrics?.online_bookings_today || 0) / metrics?.total_tickets_today) * 100}%`,
                          background: 'var(--text-main)',
                        }}
                        title={isKm ? 'កក់តាមអ៊ីនធឺណិត' : 'Online'}
                      />
                      <div
                        style={{
                          width: `${((metrics?.walkin_tickets_today || 0) / metrics?.total_tickets_today) * 100}%`,
                          background: 'var(--accent-primary, #0284c7)',
                        }}
                        title={isKm ? 'មកដល់ដោយផ្ទាល់' : 'Walk-in'}
                      />
                    </>
                  ) : (
                    <div style={{ width: '100%', background: '#e2e8f0' }} />
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                  <span>{isKm ? '• អនឡាញ' : '• Online'}</span>
                  <span>{isKm ? '• មកដល់ផ្ទាល់' : '• Walk-in'}</span>
                </div>
              </div>
            </div>

            {/* Consultation Resolution */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '1.35rem 1.5rem',
                boxShadow: 'none',
              }}
            >
              <div
                style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  letterSpacing: '0.02em',
                  fontFamily: kmFont,
                }}
              >
                {t('pd_consultation_resolution')}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1.1rem' }}>
                {/* Completed */}
                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.75rem 0.65rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: kmFont, marginBottom: '2px' }}>
                    {t('pd_completed_consultations')}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-emerald, #059669)', lineHeight: 1.1 }}>
                    {metrics?.completed_today || 0}
                  </div>
                </div>

                {/* Serving */}
                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.75rem 0.65rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: kmFont, marginBottom: '2px' }}>
                    {t('pd_currently_serving')}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-primary, #0284c7)', lineHeight: 1.1 }}>
                    {metrics?.currently_serving || 0}
                  </div>
                </div>

                {/* Skipped */}
                <div
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '0.75rem 0.65rem',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: kmFont, marginBottom: '2px' }}>
                    {t('pd_skipped_no_shows')}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                    {metrics?.skipped_no_show_today || 0}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    height: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {metrics?.total_tickets_today > 0 ? (
                    <>
                      <div
                        style={{
                          width: `${((metrics?.completed_today || 0) / metrics?.total_tickets_today) * 100}%`,
                          background: 'var(--accent-emerald, #059669)',
                        }}
                        title={isKm ? 'ពិគ្រោះបានបញ្ចប់' : 'Completed'}
                      />
                      <div
                        style={{
                          width: `${((metrics?.currently_serving || 0) / metrics?.total_tickets_today) * 100}%`,
                          background: 'var(--accent-primary, #0284c7)',
                        }}
                        title={isKm ? 'កំពុងពិគ្រោះ' : 'Serving'}
                      />
                      <div
                        style={{
                          width: `${((metrics?.skipped_no_show_today || 0) / metrics?.total_tickets_today) * 100}%`,
                          background: '#cbd5e1',
                        }}
                        title={isKm ? 'រំលង / មិនបានមក' : 'Skipped'}
                      />
                    </>
                  ) : (
                    <div style={{ width: '100%', background: '#e2e8f0' }} />
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                  <span>{isKm ? '• បញ្ចប់' : '• Completed'}</span>
                  <span>{isKm ? '• កំពុងពិគ្រោះ' : '• In Progress'}</span>
                  <span>{isKm ? '• រំលង/ខកខាន' : '• Skipped'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Set 4: Department Live Counter Status Grid */}
          <section style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: kmFont }}>
                {t('pd_dept_status')}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                {metrics?.departments?.length || 0} {t('pd_total_departments')}
              </span>
            </div>

            {(!metrics?.departments || metrics.departments.length === 0) ? (
              <span
                style={{
                  display: 'block',
                  color: 'var(--text-muted)',
                  fontSize: '0.925rem',
                  padding: '0.5rem 0',
                  fontFamily: kmFont,
                }}
              >
                {t('pd_no_departments')}
              </span>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1rem',
                }}
              >
                {metrics.departments.map((dept: any) => (
                  <div
                    key={dept.department_id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '1.25rem 1.4rem',
                      boxShadow: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      {/* Department Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
                        <div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont, lineHeight: 1.25 }}>
                            {dept.department_name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                            {t('pd_code')}: {dept.code || 'DEPT'}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            color: dept.waiting_count > 0 || dept.current_serving_number ? 'var(--accent-primary)' : 'var(--text-muted)',
                            background: '#f8fafc',
                          }}
                        >
                          {dept.waiting_count > 0 || dept.current_serving_number ? t('pd_active') : t('pd_idle')}
                        </span>
                      </div>

                      {/* Live Counter Metrics Grid */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.85rem',
                          paddingTop: '0.85rem',
                          borderTop: '1px solid var(--border-color)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '3px', fontFamily: kmFont }}>
                            {t('pd_serving_now')}
                          </div>
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 800,
                              color: dept.current_serving_number ? 'var(--accent-primary, #0284c7)' : 'var(--text-muted)',
                              fontFamily: 'monospace',
                            }}
                          >
                            {dept.current_serving_number || '—'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '3px', fontFamily: kmFont }}>
                            {t('pd_in_line')}
                          </div>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {dept.waiting_count}{' '}
                            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                              {t('pd_patients')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '0.65rem', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                        {t('pd_completed_today')}: <strong style={{ color: 'var(--text-main)' }}>{dept.completed_today || 0}</strong>
                      </div>
                    </div>

                    {/* Direct Manage Counter Action Button */}
                    <button
                      onClick={() => onNavigateToQueue?.(dept.department_id)}
                      className="btn btn-outline"
                      style={{
                        width: '100%',
                        marginTop: '1rem',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        fontFamily: kmFont,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        borderRadius: '4px',
                      }}
                    >
                      {t('pd_manage_counter')}
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
