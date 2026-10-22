import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import { RealTimeQueueClient } from '../../services/websocket';

interface PartnerDashboardProps {
  onNavigateToQueue?: (deptId?: string) => void;
}

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

const DonutChart: React.FC<{
  size?: number;
  strokeWidth?: number;
  segments: DonutSegment[];
  centerValue: string | number;
  centerLabel: string;
  kmFont?: string;
}> = ({ size = 112, strokeWidth = 11, segments, centerValue, centerLabel, kmFont }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);

  let accumulatedPercent = 0;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {total > 0 &&
          segments.map((seg, idx) => {
            if (seg.value <= 0) return null;
            const percent = seg.value / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += percent;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 0.35s ease, stroke-dashoffset 0.35s ease' }}
              />
            );
          })}
      </svg>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          fontFamily: kmFont,
        }}
      >
        <span style={{ fontSize: '1.28rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
          {centerValue}
        </span>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>
          {centerLabel}
        </span>
      </div>
    </div>
  );
};

const HourlyFlowBarGraph: React.FC<{
  data?: Array<{ hour: string; count: number }>;
  kmFont?: string;
}> = ({ data, kmFont }) => {
  const points = data && data.length > 0 ? data : [
    { hour: '08:00', count: 0 },
    { hour: '10:00', count: 0 },
    { hour: '12:00', count: 0 },
    { hour: '14:00', count: 0 },
    { hour: '16:00', count: 0 },
    { hour: '18:00', count: 0 },
  ];

  const maxVal = Math.max(...points.map((p) => p.count), 4);
  const width = 340;
  const height = 100;
  const padLeft = 14;
  const padRight = 14;
  const padTop = 18;
  const padBottom = 22;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  const slotWidth = chartWidth / points.length;
  const barWidth = Math.min(16, Math.max(9, slotWidth - 6));

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', maxHeight: '100px', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="hourlyBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="var(--accent-primary, #185339)" />
          </linearGradient>
        </defs>

        {/* Subtle horizontal grid lines */}
        <line
          x1={padLeft}
          y1={padTop}
          x2={width - padRight}
          y2={padTop}
          stroke="#f1f5f9"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <line
          x1={padLeft}
          y1={padTop + chartHeight / 2}
          x2={width - padRight}
          y2={padTop + chartHeight / 2}
          stroke="#f1f5f9"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        {/* Baseline */}
        <line
          x1={padLeft}
          y1={padTop + chartHeight}
          x2={width - padRight}
          y2={padTop + chartHeight}
          stroke="#e2e8f0"
          strokeWidth="1"
        />

        {points.map((p, i) => {
          const slotX = padLeft + i * slotWidth;
          const barX = slotX + (slotWidth - barWidth) / 2;
          const barH = p.count > 0 ? Math.max(6, (p.count / maxVal) * chartHeight) : 3;
          const barY = padTop + chartHeight - barH;
          const isNonZero = p.count > 0;
          const showLabel = points.length <= 7 || i % 2 === 0 || i === points.length - 1;

          return (
            <g key={i}>
              {/* Bar */}
              <rect
                x={barX}
                y={barY}
                width={barWidth}
                height={barH}
                rx={isNonZero ? 4 : 1.5}
                ry={isNonZero ? 4 : 1.5}
                fill={isNonZero ? 'url(#hourlyBarGrad)' : '#e2e8f0'}
                style={{
                  transition: 'height 0.3s ease, y 0.3s ease',
                  cursor: isNonZero ? 'pointer' : 'default',
                }}
              >
                <title>{`${p.hour}: ${p.count} ${p.count === 1 ? 'patient' : 'patients'}`}</title>
              </rect>

              {/* Number tag above bar if count > 0 */}
              {isNonZero && (
                <text
                  x={barX + barWidth / 2}
                  y={barY - 4}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="var(--accent-primary, #185339)"
                  fontFamily={kmFont}
                >
                  {p.count}
                </text>
              )}

              {/* X-axis Hour Label */}
              {showLabel && (
                <text
                  x={slotX + slotWidth / 2}
                  y={height - 5}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="500"
                  fill="var(--text-muted)"
                  fontFamily={kmFont}
                >
                  {p.hour}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

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
              <div
                className="partner-analytics-panel"
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.35rem 1.5rem',
                  marginBottom: '1.5rem',
                  boxShadow: 'none',
                }}
              >
                {/* Top: Header & Resources Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingBottom: '1.15rem',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  {/* Title */}
                  <div>
                    <h2
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        margin: 0,
                        lineHeight: 1.25,
                        fontFamily: kmFont,
                      }}
                    >
                      {isKm ? 'ការវិភាគប្រតិបត្តិការ' : 'Operations Analytics'}
                    </h2>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                      {isKm ? 'ទិន្នន័យជាក់ស្តែងពេលនេះ' : 'Live Real-time Operations'}
                    </span>
                  </div>

                  {/* Capacity & Resources Badges */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.3rem 0.75rem',
                        background: 'var(--bg-secondary, #f8fafc)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                        {t('pd_total_departments')}:
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {totalDepts}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.3rem 0.75rem',
                        background: 'var(--bg-secondary, #f8fafc)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                        {t('pd_total_staff')}:
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {totalStaff}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.3rem 0.75rem',
                        background: 'var(--bg-secondary, #f8fafc)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                        {t('pd_total_services')}:
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {totalServices}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Analytics Grid: 3 Modern Segmented Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1rem',
                    paddingTop: '1.25rem',
                  }}
                >
                  {/* Module 1: Donut Chart - ស្ថានភាពជួរផ្ទាល់ (Live Floor Activity) */}
                  <div
                    style={{
                      background: 'var(--bg-secondary, #f8fafc)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1.15rem 1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ marginBottom: '0.85rem' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont, display: 'block' }}>
                        {t('pd_live_floor_activity')}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                        {isKm ? 'អ្នកជំងឺកំពុងស្ថិតក្នុងគ្លីនិកជាក់ស្តែង' : 'Active patients on clinic floor'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flex: 1 }}>
                      <DonutChart
                        size={100}
                        strokeWidth={11}
                        segments={[
                          { value: servingCount, color: '#059669', label: t('pd_currently_serving') },
                          { value: waitingCount, color: '#d97706', label: t('pd_currently_waiting') },
                        ]}
                        centerValue={activePatients}
                        centerLabel={isKm ? 'សកម្ម' : 'Active'}
                        kmFont={kmFont}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontFamily: kmFont, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t('pd_currently_serving')}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', marginLeft: '0.5rem' }}>
                            {servingCount}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontFamily: kmFont, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t('pd_currently_waiting')}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#d97706', marginLeft: '0.5rem' }}>
                            {waitingCount}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: kmFont, borderTop: '1px solid var(--border-color)', paddingTop: '0.45rem', marginTop: '0.15rem' }}>
                          {activePatients > 0
                            ? `${Math.round((servingCount / activePatients) * 100)}% ${isKm ? 'កំពុងទទួលការពិគ្រោះ' : 'in consultation'}`
                            : (isKm ? 'គ្មានអ្នករង់ចាំ' : 'No active queue')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Module 2: Donut Chart - ប្រសិទ្ធភាព និងអត្រាបញ្ចប់ (Resolution & Clearance) */}
                  <div
                    style={{
                      background: 'var(--bg-secondary, #f8fafc)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1.15rem 1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ marginBottom: '0.85rem' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont, display: 'block' }}>
                        {t('pd_clearance_rate')}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                        {isKm ? 'អត្រាសម្រេចការពិគ្រោះថ្ងៃនេះ' : 'Daily consultation resolution efficiency'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.15rem', flex: 1 }}>
                      <DonutChart
                        size={100}
                        strokeWidth={11}
                        segments={[
                          { value: completedCount, color: '#059669', label: t('pd_completed_consultations') },
                          { value: skippedCount, color: '#94a3b8', label: t('pd_skipped_no_shows') },
                        ]}
                        centerValue={`${clearanceRate}%`}
                        centerLabel={isKm ? 'អត្រាសម្រេច' : 'Resolved'}
                        kmFont={kmFont}
                      />

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontFamily: kmFont, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t('pd_completed_consultations')}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#059669', marginLeft: '0.5rem' }}>
                            {completedCount}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.84rem', color: 'var(--text-main)', fontFamily: kmFont, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {t('pd_skipped_no_shows')}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#94a3b8', marginLeft: '0.5rem' }}>
                            {skippedCount}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontFamily: kmFont, borderTop: '1px solid var(--border-color)', paddingTop: '0.45rem', marginTop: '0.15rem' }}>
                          {totalTickets > 0
                            ? `${completedCount} ${isKm ? 'នាក់បានបញ្ចប់' : 'completed'} / ${totalTickets} ${isKm ? 'សរុប' : 'total'}`
                            : (isKm ? 'រង់ចាំការចាប់ផ្តើម' : 'Awaiting start')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Module 3: Graph Chart - លំហូរអ្នកជំងឺតាមម៉ោង និងបណ្តាញមកដល់ (Hourly Inflow & Channels) */}
                  <div
                    style={{
                      background: 'var(--bg-secondary, #f8fafc)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '1.15rem 1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.65rem' }}>
                      <div>
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont, display: 'block' }}>
                          {t('pd_hourly_flow')}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                          {t('pd_total_visits')}: <strong style={{ color: 'var(--text-main)' }}>{totalTickets}</strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem' }}>
                        <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: '12px', background: '#ffffff', border: '1px solid var(--border-color)', color: 'var(--accent-primary)', fontWeight: 600, fontFamily: kmFont }}>
                          {t('pd_online_bookings')}: {onlineTickets}
                        </span>
                        <span style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: '12px', background: '#ffffff', border: '1px solid var(--border-color)', color: '#0284c7', fontWeight: 600, fontFamily: kmFont }}>
                          {t('pd_walkin_arrivals')}: {walkinTickets}
                        </span>
                      </div>
                    </div>

                    {/* SVG Flow Bar Graph */}
                    <HourlyFlowBarGraph data={metrics?.hourly_flow} kmFont={kmFont} />
                  </div>
                </div>
              </div>
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
