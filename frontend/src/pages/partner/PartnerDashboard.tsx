import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface PartnerDashboardProps {
  onNavigateToQueue?: (deptId?: string) => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = () => {
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
    <div style={{ width: '100%' }}>
      {/* Summary Stat Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Loading operational metrics...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.25rem',
              boxShadow: 'none',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                Currently Waiting
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 400, color: 'var(--text-main)' }}>
                {metrics?.currently_waiting || 0}
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.25rem',
              boxShadow: 'none',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                Avg. Waiting Time
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 400, color: 'var(--text-main)' }}>
                ~{metrics?.average_wait_minutes || 0} mins
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.25rem',
              boxShadow: 'none',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.35rem' }}>
                Total Visits Today
              </div>
              <div style={{ fontSize: '1.85rem', fontWeight: 400, color: 'var(--text-main)' }}>
                {metrics?.total_tickets_today || 0}
              </div>
            </div>
          </div>

          {/* Booking Channel Distribution & Operations Resolution */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2.5rem' }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.25rem',
              boxShadow: 'none',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                Intake Channels
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-main)' }}>
                    {metrics?.online_bookings_today || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online Remote Bookings</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-main)' }}>
                    {metrics?.walkin_tickets_today || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Walk-In Physical Arrivals</div>
                </div>
              </div>
              {/* Proportional bar indicator */}
              <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{
                  flex: Math.max(1, metrics?.online_bookings_today || 0),
                  background: 'var(--text-main)',
                }} />
                <div style={{
                  flex: Math.max(1, metrics?.walkin_tickets_today || 0),
                  background: 'var(--border-color)',
                }} />
              </div>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.25rem',
              boxShadow: 'none',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
                Consultation Resolution
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-main)' }}>
                    {metrics?.completed_today || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed Consultations</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-main)' }}>
                    {metrics?.skipped_no_show_today || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Skipped / No Shows</div>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {metrics?.total_tickets_today > 0
                  ? `${Math.round(((metrics?.completed_today || 0) / metrics?.total_tickets_today) * 100)}% daily completion rate`
                  : 'No visits recorded yet today'}
              </div>
            </div>
          </div>

          {/* Hourly Patient Flow Breakdown */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1.25rem',
            marginBottom: '2.5rem',
            boxShadow: 'none',
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1.25rem' }}>
              Hourly Patient Flow
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: '120px',
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
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {item.count}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '24px',
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
              marginTop: '0.5rem',
            }}>
              {(metrics?.hourly_flow || []).map((item: any) => (
                <div
                  key={item.hour}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: '0.7rem',
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
            <h2 style={{ fontSize: '1.15rem', fontWeight: 400, marginBottom: '1rem', color: 'var(--text-main)' }}>
              Department Live Counter Status
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
              {(metrics?.departments || []).map((dept: any) => (
                <div
                  key={dept.department_id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    padding: '1.25rem',
                    boxShadow: 'none',
                  }}
                >
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '1.05rem', fontWeight: 400, color: 'var(--text-main)' }}>
                      {dept.department_name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                      Code: {dept.code || 'DEPT'}
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--border-color)',
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Serving Now
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                        {dept.current_serving_number || '—'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        In Line / Waiting
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 400, color: 'var(--text-main)' }}>
                        {dept.waiting_count} patients
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
