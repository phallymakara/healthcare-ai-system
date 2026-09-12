import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import { RealTimeQueueClient } from '../../services/websocket';

interface PartnerDashboardProps {
  onNavigateToQueue?: (deptId?: string) => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ onNavigateToQueue: _onNavigateToQueue }) => {
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
        if (import.meta.env.DEV) {
          console.warn(`Partner dashboard fetch returned status: ${res.status}`);
        }
        setLoadError(t('pd_err_load'));
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load partner dashboard data:', err);
      }
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
    <div className="partner-dashboard-container" style={{ width: '100%', fontFamily: kmFont }}>
      {/* Human-Friendly Error Display: Plain text only, no container, no shadow, no background fill */}
      {loadError && (
        <span
          className="error-text"
          style={{
            display: 'block',
            marginBottom: '1rem',
            fontSize: '0.92rem',
            color: '#dc2626',
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
          {/* Facility Capacity & Team Overview Bar */}
          {(() => {
            const totalTickets = metrics?.total_tickets_today || 0;
            const onlineTickets = metrics?.online_bookings_today || 0;
            const walkinTickets = metrics?.walkin_tickets_today || 0;

            const completedCount = metrics?.completed_today || 0;
            const servingCount = metrics?.currently_serving || 0;
            const waitingCount = metrics?.currently_waiting || 0;
            const skippedCount = metrics?.skipped_no_show_today || 0;
            const activePatients = servingCount + waitingCount;

            const clearanceRate = metrics?.clearance_rate || 0;
            const totalDepts = metrics?.total_departments ?? metrics?.departments?.length ?? 0;
            const totalStaff = metrics?.total_staff ?? 0;
            const totalServices = metrics?.total_services ?? 0;

            return (
              <>
                {/* 1. Facility Capacity & Resources Overview (3 Separate Rounded Cards) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '0.85rem',
                  }}
                >
                  {/* Container 1: Departments */}
                  <div
                    className="kpi-stat-card"
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.25rem 1.5rem',
                      boxShadow: 'none',
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500, fontFamily: kmFont, marginBottom: '0.35rem' }}>
                      {t('pd_total_departments')}
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }}>
                      {totalDepts}
                    </div>
                  </div>

                  {/* Container 2: Staff & Doctors */}
                  <div
                    className="kpi-stat-card"
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.25rem 1.5rem',
                      boxShadow: 'none',
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500, fontFamily: kmFont, marginBottom: '0.35rem' }}>
                      {t('pd_total_staff')}
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }}>
                      {totalStaff}
                    </div>
                  </div>

                  {/* Container 3: Medical Services */}
                  <div
                    className="kpi-stat-card"
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.25rem 1.5rem',
                      boxShadow: 'none',
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 500, fontFamily: kmFont, marginBottom: '0.35rem' }}>
                      {t('pd_total_services')}
                    </div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.15 }}>
                      {totalServices}
                    </div>
                  </div>
                </div>

                {/* 2. Operational Compound Metric Cards: 3 Columns on Desktop (Queue, Intake, Resolution) */}
                <div className="dashboard-metrics-tri-grid">
                  {/* Column 1: Live Floor Queue Activity (1 Main Card + 2 Stacked Sub Cards) */}
                  <div className="live-floor-compound-container">
                    <div className="live-floor-compound-grid">
                      {/* MAIN CARD (Left): Live Floor Activity Status */}
                      <div className="dashboard-card live-floor-main-card">
                        {/* Ambient background accent */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '240px',
                            height: '240px',
                            background: 'radial-gradient(circle, rgba(24, 83, 57, 0.06) 0%, transparent 70%)',
                            pointerEvents: 'none',
                          }}
                        />

                        {/* Header (No Badge, No Icon) */}
                        <div>
                          <div style={{ marginBottom: '0.45rem' }}>
                            <span
                              className="text-truncate"
                              style={{
                                fontSize: '0.92rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                fontFamily: kmFont,
                                color: 'var(--text-main)',
                                display: 'block',
                              }}
                            >
                              {t('pd_live_floor_activity')}
                            </span>
                          </div>

                          {/* Hero Metric: Active in Clinic */}
                          <div style={{ margin: '0.15rem 0 0 0' }}>
                            <div
                              style={{
                                fontSize: 'clamp(2.1rem, 2.6vw, 2.75rem)',
                                fontWeight: 800,
                                color: '#0c2f27',
                                lineHeight: 1.1,
                                letterSpacing: '-0.03em',
                              }}
                            >
                              {activePatients}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* SUB CARDS COLUMN (Right): Serving & In Line */}
                      <div className="live-floor-sub-column">
                        {/* SUB CARD 1: Serving Now */}
                        <div className="dashboard-card live-floor-sub-card">
                          <div
                            className="text-truncate"
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              fontFamily: kmFont,
                              lineHeight: 1.25,
                              width: '100%',
                            }}
                            title={t('pd_currently_serving')}
                          >
                            {t('pd_currently_serving')}
                          </div>
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 800,
                              color: '#059669',
                              lineHeight: 1,
                              marginTop: '0.3rem',
                            }}
                          >
                            {servingCount}
                          </div>
                        </div>

                        {/* SUB CARD 2: In Queue */}
                        <div className="dashboard-card live-floor-sub-card">
                          <div
                            className="text-truncate"
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              fontFamily: kmFont,
                              lineHeight: 1.25,
                              width: '100%',
                            }}
                            title={t('pd_currently_waiting')}
                          >
                            {t('pd_currently_waiting')}
                          </div>
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 800,
                              color: '#d97706',
                              lineHeight: 1,
                              marginTop: '0.3rem',
                            }}
                          >
                            {waitingCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Today's Patient Intake & Channels (1 Main Card + 2 Stacked Sub Cards) */}
                  <div className="live-floor-compound-container">
                    <div className="live-floor-compound-grid">
                      {/* MAIN CARD (Left): Today's Total Visits */}
                      <div className="dashboard-card live-floor-main-card">
                        {/* Ambient background accent */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '240px',
                            height: '240px',
                            background: 'radial-gradient(circle, rgba(15, 23, 42, 0.04) 0%, transparent 70%)',
                            pointerEvents: 'none',
                          }}
                        />

                        <div>
                          <div style={{ marginBottom: '0.45rem' }}>
                            <span
                              className="text-truncate"
                              style={{
                                fontSize: '0.92rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                fontFamily: kmFont,
                                color: 'var(--text-main)',
                                display: 'block',
                              }}
                            >
                              {t('pd_total_visits')}
                            </span>
                          </div>

                          {/* Hero Metric: Total Visits Today */}
                          <div style={{ margin: '0.15rem 0 0 0' }}>
                            <div
                              style={{
                                fontSize: 'clamp(2.1rem, 2.6vw, 2.75rem)',
                                fontWeight: 800,
                                color: 'var(--text-main)',
                                lineHeight: 1.1,
                                letterSpacing: '-0.03em',
                              }}
                            >
                              {totalTickets}
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* SUB CARDS COLUMN (Right): Online Bookings & Walk-in Arrivals */}
                      <div className="live-floor-sub-column">
                        {/* SUB CARD 1: Online Bookings */}
                        <div className="dashboard-card live-floor-sub-card">
                          <div
                            className="text-truncate"
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              fontFamily: kmFont,
                              lineHeight: 1.25,
                              width: '100%',
                            }}
                            title={t('pd_online_bookings')}
                          >
                            {t('pd_online_bookings')}
                          </div>
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 800,
                              color: 'var(--text-main)',
                              lineHeight: 1,
                              marginTop: '0.3rem',
                            }}
                          >
                            {onlineTickets}
                          </div>
                        </div>

                        {/* SUB CARD 2: Walk-in Arrivals */}
                        <div className="dashboard-card live-floor-sub-card">
                          <div
                            className="text-truncate"
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              fontFamily: kmFont,
                              lineHeight: 1.25,
                              width: '100%',
                            }}
                            title={t('pd_walkin_arrivals')}
                          >
                            {t('pd_walkin_arrivals')}
                          </div>
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 800,
                              color: 'var(--accent-primary, #0284c7)',
                              lineHeight: 1,
                              marginTop: '0.3rem',
                            }}
                          >
                            {walkinTickets}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Resolution & Operational Efficiency (1 Main Card + 2 Stacked Sub Cards) */}
                  <div className="live-floor-compound-container">
                    <div className="live-floor-compound-grid">
                      {/* MAIN CARD (Left): Clearance Rate */}
                      <div className="dashboard-card live-floor-main-card">
                        {/* Ambient background accent */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '240px',
                            height: '240px',
                            background: 'radial-gradient(circle, rgba(5, 150, 105, 0.06) 0%, transparent 70%)',
                            pointerEvents: 'none',
                          }}
                        />

                        <div>
                          <div style={{ marginBottom: '0.45rem' }}>
                            <span
                              className="text-truncate"
                              style={{
                                fontSize: '0.92rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.02em',
                                fontFamily: kmFont,
                                color: 'var(--text-main)',
                                display: 'block',
                              }}
                            >
                              {t('pd_clearance_rate')}
                            </span>
                          </div>

                          {/* Hero Metric: Clearance Rate */}
                          <div style={{ margin: '0.15rem 0 0 0' }}>
                            <div
                              style={{
                                fontSize: 'clamp(2.1rem, 2.6vw, 2.75rem)',
                                fontWeight: 800,
                                color: 'var(--accent-emerald, #059669)',
                                lineHeight: 1.1,
                                letterSpacing: '-0.03em',
                              }}
                            >
                              {clearanceRate}%
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* SUB CARDS COLUMN (Right): Completed Consultations & Skipped / No-Shows */}
                      <div className="live-floor-sub-column">
                        {/* SUB CARD 1: Completed Consultations */}
                        <div className="dashboard-card live-floor-sub-card">
                          <div
                            className="text-truncate"
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              fontFamily: kmFont,
                              lineHeight: 1.25,
                              width: '100%',
                            }}
                            title={t('pd_completed_consultations')}
                          >
                            {t('pd_completed_consultations')}
                          </div>
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 800,
                              color: 'var(--accent-emerald, #059669)',
                              lineHeight: 1,
                              marginTop: '0.3rem',
                            }}
                          >
                            {completedCount}
                          </div>
                        </div>

                        {/* SUB CARD 2: Skipped / No-Shows */}
                        <div className="dashboard-card live-floor-sub-card">
                          <div
                            className="text-truncate"
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              fontFamily: kmFont,
                              lineHeight: 1.25,
                              width: '100%',
                            }}
                            title={t('pd_skipped_no_shows')}
                          >
                            {t('pd_skipped_no_shows')}
                          </div>
                          <div
                            style={{
                              fontSize: '1.5rem',
                              fontWeight: 800,
                              color: 'var(--text-main)',
                              lineHeight: 1,
                              marginTop: '0.3rem',
                            }}
                          >
                            {skippedCount}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Operational Section: Department Live Counter Status Grid */}
          <section style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: kmFont }}>
                {t('pd_dept_status')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                  {metrics?.departments?.length || 0} {t('pd_total_departments')}
                </span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                  {metrics?.total_staff || 0} {t('pd_total_staff')}
                </span>
              </div>
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
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem',
                }}
              >
                {metrics.departments.map((dept: any) => {
                  const totalDeptPatients = dept.total_patients ?? ((dept.waiting_count || 0) + (dept.completed_today || 0) + (dept.current_serving_number ? 1 : 0));

                  return (
                    <div
                      key={dept.department_id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.65rem',
                      }}
                    >
                      {/* Top Card: Department Name at top, Total Number at bottom (aligned start) */}
                      <div
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--border-color)',
                          borderRadius: '16px',
                          padding: '1.35rem 1.45rem',
                          boxShadow: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          minHeight: '130px',
                          boxSizing: 'border-box',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '1.18rem',
                            fontWeight: 700,
                            color: 'var(--text-main)',
                            fontFamily: kmFont,
                            lineHeight: 1.3,
                          }}
                        >
                          {dept.department_name}
                        </div>

                        <div
                          style={{
                            fontSize: '1.85rem',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                            lineHeight: 1,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {totalDeptPatients}
                        </div>
                      </div>

                      {/* Bottom Row: 2 Cards (Serving + Completed) */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.65rem',
                        }}
                      >
                        {/* Bottom Left Card: Serving */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '1.1rem 1.25rem',
                            boxShadow: 'none',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              fontWeight: 600,
                              marginBottom: '6px',
                              fontFamily: kmFont,
                            }}
                          >
                            {t('pd_serving_now')}
                          </div>
                          <div
                            style={{
                              fontSize: '1.45rem',
                              fontWeight: 800,
                              color: dept.current_serving_number ? 'var(--accent-primary, #0284c7)' : 'var(--text-muted)',
                              fontFamily: 'monospace',
                              lineHeight: 1.2,
                            }}
                          >
                            {dept.current_serving_number
                              ? (dept.current_serving_number.includes('-')
                                ? dept.current_serving_number.split('-').pop()
                                : dept.current_serving_number)
                              : '—'}
                          </div>
                        </div>

                        {/* Bottom Right Card: Completed */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '1.1rem 1.25rem',
                            boxShadow: 'none',
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                              marginBottom: '6px',
                              fontFamily: kmFont,
                            }}
                          >
                            {t('pd_completed_today')}
                          </div>
                          <div
                            style={{
                              fontSize: '1.45rem',
                              fontWeight: 800,
                              color: 'var(--text-main)',
                              lineHeight: 1.2,
                            }}
                          >
                            {dept.completed_today || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
