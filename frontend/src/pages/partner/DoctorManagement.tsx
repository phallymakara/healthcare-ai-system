import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { Stethoscope, Calendar } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partners/doctors`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        setDoctors(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Doctor & Schedule Management</h1>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Consultants directory, weekly shift hours, and room assignments.
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
          Loading doctors directory...
        </div>
      ) : (
        <div className="grid-2">
          {doctors.map((doc) => (
            <div key={doc.id} className="glass-card">
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981',
                }}>
                  <Stethoscope size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{doc.full_name}</h3>
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                    {doc.specialty}
                  </span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Room: {doc.room_number || 'General Outpatient'} • Avg: ~{doc.avg_consultation_minutes} mins/visit
                  </div>
                </div>
              </div>

              {/* Weekly Schedule Badges */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Calendar size={14} /> Weekly Active Days
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {DAYS.map((dayName, idx) => {
                    const hasDay = doc.schedules?.some((s: any) => s.day_of_week === idx);
                    return (
                      <span
                        key={dayName}
                        className="badge"
                        style={{
                          background: hasDay ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: hasDay ? '#34d399' : 'var(--text-dim)',
                          border: hasDay ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                          padding: '0.3rem 0.6rem',
                        }}
                      >
                        {dayName}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
