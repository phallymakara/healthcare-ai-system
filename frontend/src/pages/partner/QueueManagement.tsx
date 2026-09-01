import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { RealTimeQueueClient } from '../../services/websocket';
import { 
  Play, 
  CheckCircle2, 
  SkipForward, 
  UserX, 
  PlusCircle, 
  PhoneCall, 
  RefreshCw,
  Clock,
  Radio,
  User,
  Activity
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const QueueManagement: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');

  // 1. Fetch departments
  const loadDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/partners/departments`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
        if (data.length > 0 && !selectedDeptId) {
          setSelectedDeptId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Fetch live queue snapshot for selected department
  const loadQueueSnapshot = async () => {
    if (!selectedDeptId) return;
    setLoading(true);
    try {
      // First ensure session is open
      const sessionRes = await fetch(`${API_BASE}/queues/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({
          hospital_id: AuthService.getStoredUser()?.hospital_id || '11c80144-bc31-4ed1-8529-f25db3a203d3',
          department_id: selectedDeptId,
        }),
      });

      if (sessionRes.ok) {
        const session = await sessionRes.json();
        const liveRes = await fetch(`${API_BASE}/queues/${session.id}`, {
          headers: AuthService.getAuthHeaders(),
        });
        if (liveRes.ok) {
          setQueueData(await liveRes.json());
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      loadQueueSnapshot();
      // Listen to WebSocket events for this queue session
      const ws = new RealTimeQueueClient(`queue:${selectedDeptId}`);
      ws.connect();
      const unsub = ws.subscribe(() => {
        loadQueueSnapshot();
      });
      return () => {
        unsub();
        ws.disconnect();
      };
    }
  }, [selectedDeptId]);

  // Actions
  const handleCallNext = async () => {
    if (!queueData?.session_id) return;
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/queues/${queueData.session_id}/call-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({ note: 'Called from Counter Console' }),
      });
      await loadQueueSnapshot();
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartServing = async (ticketId: string) => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/tickets/${ticketId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
      });
      await loadQueueSnapshot();
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (ticketId: string) => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/tickets/${ticketId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
      });
      await loadQueueSnapshot();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async (ticketId: string) => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/tickets/${ticketId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
      });
      await loadQueueSnapshot();
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async (ticketId: string) => {
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/tickets/${ticketId}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
      });
      await loadQueueSnapshot();
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await fetch(`${API_BASE}/tickets/walk-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({
          hospital_id: AuthService.getStoredUser()?.hospital_id || '11c80144-bc31-4ed1-8529-f25db3a203d3',
          department_id: selectedDeptId,
          patient_name: walkInName,
          patient_phone: walkInPhone || undefined,
        }),
      });
      setWalkInName('');
      setWalkInPhone('');
      setWalkInModalOpen(false);
      await loadQueueSnapshot();
    } finally {
      setActionLoading(false);
    }
  };

  const activeTickets = queueData?.active_tickets || [];
  const servingTicket = activeTickets.find((t: any) => t.status === 'SERVING' || t.status === 'CALLED');
  const waitingTickets = activeTickets.filter((t: any) => t.status === 'WAITING');

  return (
    <div>
      {/* Department Selector & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Live Counter Console</h1>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time queue operations, walk-in issuance, and patient calls.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            style={{
              padding: '0.65rem 1.25rem',
              background: '#111827',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name} ({dept.code || 'DEPT'})
              </option>
            ))}
          </select>

          <button
            onClick={() => setWalkInModalOpen(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <PlusCircle size={16} /> Issue Walk-In Ticket
          </button>
        </div>
      </div>

      {/* Main Counter Display Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
          Connecting to live counter stream...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Currently Serving Counter Card */}
            <div className="glass-card" style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 182, 212, 0.04))',
              border: '1px solid var(--border-highlight)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="badge badge-healthy">
                    <Radio size={12} /> Counter Active
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {queueData?.department_name}
                  </span>
                </div>

                <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                    Currently Serving
                  </span>
                  <div style={{
                    fontSize: '3.5rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-mono)',
                    color: servingTicket ? 'var(--accent-primary)' : 'var(--text-dim)',
                    letterSpacing: '-0.02em',
                    margin: '0.5rem 0',
                  }}>
                    {servingTicket ? servingTicket.ticket_number : '—'}
                  </div>
                  {servingTicket && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }}>
                      <User size={18} color="#10b981" /> {servingTicket.patient_name}
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>({servingTicket.ticket_source})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  onClick={handleCallNext}
                  disabled={actionLoading || waitingTickets.length === 0}
                  className="btn btn-primary"
                  style={{ padding: '0.85rem', fontSize: '0.9rem', gridColumn: 'span 3' }}
                >
                  <PhoneCall size={18} /> Call Next Patient ({waitingTickets.length} Waiting)
                </button>

                {servingTicket && servingTicket.status === 'CALLED' && (
                  <button
                    onClick={() => handleStartServing(servingTicket.id)}
                    disabled={actionLoading}
                    className="btn btn-outline"
                    style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: '#10b981' }}
                  >
                    <Play size={16} /> Start Visit
                  </button>
                )}

                {servingTicket && (
                  <>
                    <button
                      onClick={() => handleComplete(servingTicket.id)}
                      disabled={actionLoading}
                      className="btn btn-outline"
                      style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', borderColor: '#3b82f6' }}
                    >
                      <CheckCircle2 size={16} /> Complete
                    </button>
                    <button
                      onClick={() => handleSkip(servingTicket.id)}
                      disabled={actionLoading}
                      className="btn btn-outline"
                    >
                      <SkipForward size={16} /> Skip
                    </button>
                    <button
                      onClick={() => handleNoShow(servingTicket.id)}
                      disabled={actionLoading}
                      className="btn btn-outline"
                      style={{ color: '#fb7185' }}
                    >
                      <UserX size={16} /> No-Show
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Counter Summary Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '14px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#10b981' }}>
                  <Clock size={28} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Est. Wait for New Arrival
                  </span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                    ~{queueData?.estimated_wait_minutes_for_new || 0} mins
                  </h3>
                </div>
              </div>

              <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '14px', background: 'rgba(6, 182, 212, 0.15)', borderRadius: '12px', color: '#06b6d4' }}>
                  <User size={28} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Waiting in Queue
                  </span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                    {queueData?.total_waiting || 0} patients
                  </h3>
                </div>
              </div>

              <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ padding: '14px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '12px', color: '#3b82f6' }}>
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Completed Consultations Today
                  </span>
                  <h3 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                    {queueData?.total_completed_today || 0} visits
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Waiting List Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#10b981" /> Active Queue Line
          </h2>
          <button onClick={loadQueueSnapshot} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {activeTickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
            No patients currently in queue.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Ticket</th>
                  <th style={{ padding: '0.75rem' }}>Patient Name</th>
                  <th style={{ padding: '0.75rem' }}>Source</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Est. Wait</th>
                  <th style={{ padding: '0.75rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTickets.map((ticket: any) => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {ticket.ticket_number}
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{ticket.patient_name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                        {ticket.ticket_source}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${ticket.status === 'SERVING' || ticket.status === 'CALLED' ? 'badge-healthy' : 'badge-degraded'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                      ~{ticket.estimated_wait_minutes} mins
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {ticket.status === 'WAITING' && (
                          <button
                            onClick={() => handleSkip(ticket.id)}
                            className="btn btn-outline"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            Skip
                          </button>
                        )}
                        {ticket.status === 'SERVING' && (
                          <button
                            onClick={() => handleComplete(ticket.id)}
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                          >
                            Finish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Walk-in Ticket Modal */}
      {walkInModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Issue Walk-In Ticket</h3>
            <form onSubmit={handleIssueWalkIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Patient Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chan Samnang"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+855..."
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setWalkInModalOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Generate Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
