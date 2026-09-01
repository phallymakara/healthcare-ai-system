import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { 
  Building2, 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Radio,
  Layers
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface PartnerDashboardProps {
  onNavigateToQueue: (deptId?: string) => void;
}

export const PartnerDashboard: React.FC<PartnerDashboardProps> = ({ onNavigateToQueue }) => {
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
            <Building2 size={16} /> {metrics?.hospital_name || 'Hospital Partner Platform'}
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Partner Operations Overview</h1>
        </div>

        <button onClick={() => onNavigateToQueue()} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
          Open Live Counter Console <ArrowRight size={16} />
        </button>
      </div>

      {/* Summary Stat Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
          Loading operational metrics...
        </div>
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#10b981' }}>
                <Users size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Currently Waiting
                </span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                  {metrics?.currently_waiting || 0}
                </h2>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '14px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '12px', color: '#06b6d4' }}>
                <Clock size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Avg. Waiting Time
                </span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                  ~{metrics?.average_wait_minutes || 0} mins
                </h2>
              </div>
            </div>

            <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '14px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#3b82f6' }}>
                <CheckCircle2 size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Total Visits Today
                </span>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                  {metrics?.total_tickets_today || 0}
                </h2>
              </div>
            </div>
          </div>

          {/* Department Queues Status Grid */}
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="#10b981" /> Department Live Counter Status
            </h2>

            <div className="grid-2">
              {(metrics?.departments || []).map((dept: any) => (
                <div key={dept.department_id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{dept.department_name}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Code: {dept.code || 'DEPT'}
                      </span>
                    </div>
                    <span className="badge badge-healthy">
                      <Radio size={12} /> {dept.queue_status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', margin: '1rem 0' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        Serving Now
                      </span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                        {dept.current_serving_number || '—'}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                        In Line / Waiting
                      </span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                        {dept.waiting_count} patients
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateToQueue(dept.department_id)}
                    className="btn btn-outline"
                    style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                  >
                    Launch Counter Console <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
