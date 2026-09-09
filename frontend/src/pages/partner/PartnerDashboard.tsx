import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  Layers,
  Globe,
  Activity,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
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
          {/* Facility Capacity & Team Overview Bar */}
          {(() => {
            const totalTickets = metrics?.total_tickets_today || 0;
            const onlineTickets = metrics?.online_bookings_today || 0;
            const walkinTickets = metrics?.walkin_tickets_today || 0;
            const onlinePct = totalTickets > 0 ? Math.round((onlineTickets / totalTickets) * 100) : 0;
            const walkinPct = totalTickets > 0 ? Math.round((walkinTickets / totalTickets) * 100) : 0;

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
                {/* 1. Facility Capacity & Resources Overview (Unboxed Row) */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '2.5rem',
                    marginBottom: '1.6rem',
                    padding: '0.35rem 0.1rem',
                  }}
                >
                  {/* Departments */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-muted)' }}>
                    <Building2 size={21} />
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: kmFont }}>{t('pd_total_departments')}:</span>
                    <strong style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{totalDepts}</strong>
                  </div>

                  {/* Staff & Doctors */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-muted)' }}>
                    <Users size={21} />
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: kmFont }}>{t('pd_total_staff')}:</span>
                    <strong style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{totalStaff}</strong>
                  </div>

                  {/* Services */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-muted)' }}>
                    <Layers size={21} />
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, fontFamily: kmFont }}>{t('pd_total_services')}:</span>
                    <strong style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{totalServices}</strong>
                  </div>
                </div>

                {/* 2. The 3 Primary Operational Main Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: '1.25rem',
                    marginBottom: '2rem',
                  }}
                >
                  {/* MAIN CARD 1: Live Floor Activity (Real-Time Queue Pulse) */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '1.35rem 1.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'none',
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: 'var(--accent-primary, #0284c7)' }}>
                        <Activity size={17} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: kmFont }}>
                          {t('pd_live_floor_activity')}
                        </span>
                      </div>

                      {/* Hero Metric: Active in Clinic */}
                      <div style={{ marginBottom: '1.15rem' }}>
                        <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
                          {activePatients}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                          {t('pd_active_on_floor')}
                        </div>
                      </div>

                      {/* Sub-Cards: Serving vs Waiting */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {/* Sub-Card 1A: In Consultation */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '0.75rem 0.85rem',
                            boxShadow: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--accent-primary, #0284c7)', display: 'inline-block' }} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: kmFont }}>
                              {t('pd_currently_serving')}
                            </span>
                          </div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-primary, #0284c7)', lineHeight: 1.1 }}>
                            {servingCount}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                            {t('pd_serving_now')}
                          </div>
                        </div>

                        {/* Sub-Card 1B: Waiting in Queue */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '0.75rem 0.85rem',
                            boxShadow: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--accent-amber, #d97706)', display: 'inline-block' }} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: kmFont }}>
                              {t('pd_currently_waiting')}
                            </span>
                          </div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-amber, #d97706)', lineHeight: 1.1 }}>
                            {waitingCount}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                            {t('pd_in_line')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MAIN CARD 2: Today's Patient Intake & Channels */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '1.35rem 1.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'none',
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: 'var(--text-main)' }}>
                        <TrendingUp size={17} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: kmFont }}>
                          {t('pd_total_visits')}
                        </span>
                      </div>

                      {/* Hero Metric: Total Visits Today */}
                      <div style={{ marginBottom: '1.15rem' }}>
                        <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
                          {totalTickets}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                          {onlineTickets} Online • {walkinTickets} Walk-in
                        </div>
                      </div>

                      {/* Sub-Cards: Online vs Walk-in Channels */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        {/* Sub-Card 2A: Online Bookings */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '0.75rem 0.85rem',
                            boxShadow: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                            <Globe size={13} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, fontFamily: kmFont }}>
                              {t('pd_online_bookings')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                              {onlineTickets}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              ({onlinePct}%)
                            </span>
                          </div>
                        </div>

                        {/* Sub-Card 2B: Walk-In Arrivals */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '0.75rem 0.85rem',
                            boxShadow: 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                            <Users size={13} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, fontFamily: kmFont }}>
                              {t('pd_walkin_arrivals')}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                              {walkinTickets}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                              ({walkinPct}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Proportion Bar */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          height: '6px',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {totalTickets > 0 ? (
                          <>
                            <div
                              style={{ width: `${onlinePct}%`, background: 'var(--text-main)' }}
                              title={`${isKm ? 'កក់តាមអ៊ីនធឺណិត' : 'Online'}: ${onlineTickets} (${onlinePct}%)`}
                            />
                            <div
                              style={{ width: `${walkinPct}%`, background: 'var(--accent-primary, #0284c7)' }}
                              title={`${isKm ? 'មកដល់ដោយផ្ទាល់' : 'Walk-in'}: ${walkinTickets} (${walkinPct}%)`}
                            />
                          </>
                        ) : (
                          <div style={{ width: '100%', background: '#e2e8f0' }} />
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                        <span>• {isKm ? 'អនឡាញ' : 'Online'} ({onlinePct}%)</span>
                        <span>• {isKm ? 'មកដល់ផ្ទាល់' : 'Walk-in'} ({walkinPct}%)</span>
                      </div>
                    </div>
                  </div>

                  {/* MAIN CARD 3: Resolution & Operational Efficiency */}
                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '1.35rem 1.4rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: 'none',
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: 'var(--accent-emerald, #059669)' }}>
                        <CheckCircle2 size={17} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em', fontFamily: kmFont }}>
                          {t('pd_clearance_rate')}
                        </span>
                      </div>

                      {/* Hero Metric: Clearance Rate */}
                      <div style={{ marginBottom: '1.15rem' }}>
                        <div style={{ fontSize: '2.3rem', fontWeight: 700, color: 'var(--accent-emerald, #059669)', lineHeight: 1.15 }}>
                          {clearanceRate}%
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                          {completedCount} / {totalTickets} {t('pd_resolved')}
                        </div>
                      </div>

                      {/* Sub-Cards: Completed vs Skipped */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                        {/* Sub-Card 3A: Completed */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '0.75rem 0.85rem',
                            boxShadow: 'none',
                          }}
                        >
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', fontFamily: kmFont }}>
                            {t('pd_completed_consultations')}
                          </div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-emerald, #059669)', lineHeight: 1.1 }}>
                            {completedCount}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                            {t('pd_resolved')}
                          </div>
                        </div>

                        {/* Sub-Card 3B: Skipped / No-Shows */}
                        <div
                          style={{
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '0.75rem 0.85rem',
                            boxShadow: 'none',
                          }}
                        >
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', fontFamily: kmFont }}>
                            {t('pd_skipped_no_shows')}
                          </div>
                          <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                            {skippedCount}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                            {skippedCount > 0 ? `${Math.round((skippedCount / Math.max(1, totalTickets)) * 100)}%` : '0%'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Resolution Progress Bar */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          height: '6px',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          background: '#f1f5f9',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {totalTickets > 0 ? (
                          <>
                            <div
                              style={{ width: `${(completedCount / totalTickets) * 100}%`, background: 'var(--accent-emerald, #059669)' }}
                              title={`${isKm ? 'ពិគ្រោះបានបញ្ចប់' : 'Completed'}: ${completedCount}`}
                            />
                            <div
                              style={{ width: `${(servingCount / totalTickets) * 100}%`, background: 'var(--accent-primary, #0284c7)' }}
                              title={`${isKm ? 'កំពុងពិគ្រោះ' : 'Serving'}: ${servingCount}`}
                            />
                            <div
                              style={{ width: `${(skippedCount / totalTickets) * 100}%`, background: '#cbd5e1' }}
                              title={`${isKm ? 'រំលង / មិនបានមក' : 'Skipped'}: ${skippedCount}`}
                            />
                          </>
                        ) : (
                          <div style={{ width: '100%', background: '#e2e8f0' }} />
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                        <span>• {isKm ? 'បញ្ចប់' : 'Done'} ({completedCount})</span>
                        <span>• {isKm ? 'កំពុងពិគ្រោះ' : 'Serving'} ({servingCount})</span>
                        <span>• {isKm ? 'រំលង' : 'Skipped'} ({skippedCount})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Operational Section: Department Live Counter Status Grid */}
          <section style={{ marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: kmFont }}>
                {t('pd_dept_status')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                  {metrics?.departments?.length || 0} {t('pd_total_departments')}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>•</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
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
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px', fontFamily: kmFont }}>
                            {t('pd_serving_now')}
                          </div>
                          <div
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 700,
                              color: dept.current_serving_number ? 'var(--accent-primary, #0284c7)' : 'var(--text-muted)',
                              fontFamily: 'monospace',
                            }}
                          >
                            {dept.current_serving_number || '—'}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px', fontFamily: kmFont }}>
                            {t('pd_in_line')}
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {dept.waiting_count}{' '}
                            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                              {t('pd_patients')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '0.55rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                        {t('pd_completed_today')}: <strong style={{ color: 'var(--text-main)' }}>{dept.completed_today || 0}</strong>
                      </div>
                    </div>
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
