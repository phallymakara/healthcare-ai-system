import React, { useEffect, useState } from 'react';
import { Globe, Users } from 'lucide-react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';

interface PartnerDashboardProps {
  onNavigateToQueue?: (deptId?: string) => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = () => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partners/dashboard`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        setMetrics(await res.json());
      }
    } catch {
      // Ignore background error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div style={{ width: '100%', fontFamily: kmFont }}>
      {/* Summary Stat Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '1.1rem', fontFamily: kmFont }}>
          {t('pd_loading')}
        </div>
      ) : (
        <>
          <div className="responsive-stat-grid-3">
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.4rem 1.5rem',
              boxShadow: 'none',
            }}>
              <div style={{ fontSize: '0.98rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.45rem', letterSpacing: '0.02em', fontFamily: kmFont }}>
                {t('pd_currently_waiting')}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
                {metrics?.currently_waiting || 0}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.4rem 1.5rem',
              boxShadow: 'none',
            }}>
              <div style={{ fontSize: '0.98rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.45rem', letterSpacing: '0.02em', fontFamily: kmFont }}>
                {t('pd_currently_serving')}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
                {metrics?.currently_serving || 0}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.4rem 1.5rem',
              boxShadow: 'none',
            }}>
              <div style={{ fontSize: '0.98rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.45rem', letterSpacing: '0.02em', fontFamily: kmFont }}>
                {t('pd_total_visits')}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.15 }}>
                {metrics?.total_tickets_today || 0}
              </div>
            </div>
          </div>

          {/* Booking Channel Distribution & Operations Resolution */}
          <div className="responsive-stat-grid-2">
            {/* Card 1: Intake Channels & Adoption */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.4rem 1.5rem',
              boxShadow: 'none',
            }}>
              <div style={{ fontSize: '0.98rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.02em', fontFamily: kmFont }}>
                {t('pd_intake_channels')}
              </div>

              {/* Intake channels breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.1rem' }}>
                {/* Online Channel */}
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.85rem 1rem',
                }}>
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
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.85rem 1rem',
                }}>
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

              {/* Proportional visual bar */}
              <div>
                <div style={{
                  display: 'flex',
                  height: '8px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: '#f1f5f9',
                  border: '1px solid var(--border-color)',
                }}>
                  {metrics?.total_tickets_today > 0 ? (
                    <>
                      <div style={{
                        width: `${((metrics?.online_bookings_today || 0) / metrics?.total_tickets_today) * 100}%`,
                        background: 'var(--text-main)',
                      }} title={isKm ? 'កក់តាមអ៊ីនធឺណិត' : 'Online'} />
                      <div style={{
                        width: `${((metrics?.walkin_tickets_today || 0) / metrics?.total_tickets_today) * 100}%`,
                        background: 'var(--accent-primary, #0284c7)',
                      }} title={isKm ? 'មកដល់ដោយផ្ទាល់' : 'Walk-in'} />
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

            {/* Card 2: Consultation Resolution */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.4rem 1.5rem',
              boxShadow: 'none',
            }}>
              <div style={{ fontSize: '0.98rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.02em', fontFamily: kmFont }}>
                {t('pd_consultation_resolution')}
              </div>

              {/* 3 Metrics: Completed, Serving, Skipped */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginBottom: '1.1rem' }}>
                {/* Completed */}
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.75rem 0.65rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: kmFont, marginBottom: '2px' }}>
                    {t('pd_completed_consultations')}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                    {metrics?.completed_today || 0}
                  </div>
                </div>

                {/* Currently Serving */}
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.75rem 0.65rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: kmFont, marginBottom: '2px' }}>
                    {t('pd_currently_serving')}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent-primary, #0284c7)', lineHeight: 1.1 }}>
                    {metrics?.currently_serving || 0}
                  </div>
                </div>

                {/* Skipped / No show */}
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.75rem 0.65rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: kmFont, marginBottom: '2px' }}>
                    {t('pd_skipped_no_shows')}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                    {metrics?.skipped_no_show_today || 0}
                  </div>
                </div>
              </div>

              {/* Multi-segment resolution progress */}
              <div>
                <div style={{
                  display: 'flex',
                  height: '8px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  background: '#f1f5f9',
                  border: '1px solid var(--border-color)',
                }}>
                  {metrics?.total_tickets_today > 0 ? (
                    <>
                      <div style={{
                        width: `${((metrics?.completed_today || 0) / metrics?.total_tickets_today) * 100}%`,
                        background: 'var(--text-main)',
                      }} title={isKm ? 'ពិគ្រោះបានបញ្ចប់' : 'Completed'} />
                      <div style={{
                        width: `${((metrics?.currently_serving || 0) / metrics?.total_tickets_today) * 100}%`,
                        background: 'var(--accent-primary, #0284c7)',
                      }} title={isKm ? 'កំពុងពិគ្រោះ' : 'Serving'} />
                      <div style={{
                        width: `${((metrics?.skipped_no_show_today || 0) / metrics?.total_tickets_today) * 100}%`,
                        background: '#cbd5e1',
                      }} title={isKm ? 'រំលង / មិនបានមក' : 'Skipped'} />
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

          {/* Hourly Patient Flow Breakdown */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1.4rem 1.5rem',
            marginBottom: '2.5rem',
            boxShadow: 'none',
          }}>
            <div style={{ fontSize: '0.98rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1.35rem', letterSpacing: '0.02em', fontFamily: kmFont }}>
              {t('pd_hourly_flow')}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '130px',
              gap: '0.5rem',
              paddingTop: '1rem',
              borderBottom: '1px solid var(--border-color)',
            }}>
              {(metrics?.hourly_flow || []).map((item: any) => {
                const maxCount = Math.max(1, ...(metrics?.hourly_flow || []).map((f: any) => f.count));
                const heightPercent = Math.max(8, Math.round((item.count / maxCount) * 100));

                return (
                  <div
                    key={item.hour}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {item.count}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '28px',
                        height: `${heightPercent}%`,
                        background: item.count > 0 ? 'var(--text-main)' : 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '2px 2px 0 0',
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.5rem',
              marginTop: '0.65rem',
            }}>
              {(metrics?.hourly_flow || []).map((item: any) => (
                <div
                  key={item.hour}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                  }}
                >
                  {item.hour.slice(0, 2)}
                </div>
              ))}
            </div>
          </div>

          {/* Department Queues Status Grid without icons */}
          <section>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '1.15rem', color: 'var(--text-main)', fontFamily: kmFont }}>
              {t('pd_dept_status')}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {(metrics?.departments || []).map((dept: any) => (
                <div
                  key={dept.department_id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '1.4rem 1.5rem',
                    boxShadow: 'none',
                  }}
                >
                  <div style={{ marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '1.22rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                      {dept.department_name}
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '3px' }}>
                      {t('pd_code')}: {dept.code || 'DEPT'}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-color)',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px', fontFamily: kmFont }}>
                        {t('pd_serving_now')}
                      </div>
                      <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                        {dept.current_serving_number || '—'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px', fontFamily: kmFont }}>
                        {t('pd_in_line')}
                      </div>
                      <div style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {dept.waiting_count} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>{t('pd_patients')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
