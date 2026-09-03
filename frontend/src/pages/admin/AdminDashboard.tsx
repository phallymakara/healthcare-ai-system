import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { 
  Building2, 
  Users, 
  Ticket, 
  Check, 
  X, 
  Activity, 
  RefreshCw,
  Search
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [partners, setPartners] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  const loadAllAdminData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const headers = AuthService.getAuthHeaders();
      const [sumRes, partRes, userRes, logRes] = await Promise.all([
        fetch(`${API_BASE}/admin/dashboard`, { headers }),
        fetch(`${API_BASE}/admin/partners`, { headers }),
        fetch(`${API_BASE}/admin/users`, { headers }),
        fetch(`${API_BASE}/admin/audit-logs`, { headers }),
      ]);

      if (sumRes.ok) setSummary(await sumRes.json());
      if (partRes.ok) setPartners(await partRes.json());
      if (userRes.ok) setUsers(await userRes.json());
      if (logRes.ok) setAuditLogs(await logRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleVerifyPartner = async (hospId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/partners/${hospId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setActionError('Unable to update partner status. Please try again.');
        return;
      }
      await loadAllAdminData();
    } catch (e) {
      setActionError('Connection issue updating partner status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    setActionError(null);
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!res.ok) {
        setActionError('Unable to update user status.');
        return;
      }
      await loadAllAdminData();
    } catch (e) {
      setActionError('Connection issue updating user status.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const s = userSearch.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.phone_number?.includes(s) ||
      u.role?.toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
        Loading platform administration telemetry...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Platform Governance Center</h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Super Admin system control, partner verification pipeline, and platform audits.
          </span>
        </div>
        <button onClick={loadAllAdminData} className="btn btn-outline" style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}>
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {actionError && (
        <span className="error-text" style={{ marginBottom: '1rem' }}>{actionError}</span>
      )}

      {/* Platform KPIs */}
      <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building2 size={24} color="var(--accent-primary)" />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Partner Hospitals
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{summary?.total_hospitals || 0}</h2>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={24} color="var(--accent-cyan)" />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Registered Patients
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{summary?.total_patients || 0}</h2>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Ticket size={24} color="var(--accent-blue)" />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Total Tickets Today
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{summary?.total_tickets_issued_today || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Partner Hospitals Onboarding Queue */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={18} color="var(--accent-primary)" /> Partner Verification & Onboarding
        </h2>

        <div className="glass-card">
          {partners.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
              No partner hospitals registered yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem' }}>Hospital Name</th>
                    <th style={{ padding: '0.75rem' }}>Location</th>
                    <th style={{ padding: '0.75rem' }}>Departments</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                        {p.name}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>{p.phone || p.email || 'No contact'}</div>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{p.address || 'Cambodia'}</td>
                      <td style={{ padding: '0.75rem' }}>{p.departments_count} departments ({p.doctors_count} doctors)</td>
                      <td style={{ padding: '0.75rem' }}>
                        <span className={`badge ${p.verification_status === 'APPROVED' ? 'badge-healthy' : p.verification_status === 'REJECTED' ? '' : 'badge-degraded'}`} style={p.verification_status === 'REJECTED' ? { border: '1px solid #ef4444', color: '#ef4444' } : {}}>
                          {p.verification_status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {p.verification_status !== 'APPROVED' && (
                            <button
                              onClick={() => handleVerifyPartner(p.id, 'APPROVED')}
                              disabled={actionLoading}
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#34d399', borderColor: '#10b981' }}
                            >
                              <Check size={12} /> Approve
                            </button>
                          )}
                          {p.verification_status !== 'REJECTED' && (
                            <button
                              onClick={() => handleVerifyPartner(p.id, 'REJECTED')}
                              disabled={actionLoading}
                              className="btn btn-outline"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#ef4444' }}
                            >
                              <X size={12} /> Reject
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
      </section>

      {/* Platform Users Directory */}
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} color="var(--accent-cyan)" /> User Directory & Account Governance
          </h2>

          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Search user or role..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem 0.45rem 2rem',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.8rem',
              }}
            />
            <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <div className="glass-card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Role</th>
                  <th style={{ padding: '0.75rem' }}>Email / Phone</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.full_name}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {u.email || u.phone_number || 'N/A'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${u.is_active ? 'badge-healthy' : ''}`} style={!u.is_active ? { border: '1px solid #ef4444', color: '#ef4444' } : {}}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                          disabled={actionLoading}
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* System Audit Logs */}
      <section>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--accent-blue)" /> System Operations & Audit Trail
        </h2>

        <div className="glass-card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem' }}>Timestamp</th>
                  <th style={{ padding: '0.75rem' }}>Ticket</th>
                  <th style={{ padding: '0.75rem' }}>Hospital</th>
                  <th style={{ padding: '0.75rem' }}>State Shift</th>
                  <th style={{ padding: '0.75rem' }}>Operator</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {log.ticket_number}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                      {log.hospital_name} ({log.department_name})
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{log.from_status || 'NEW'}</span>
                      {' → '}
                      <strong style={{ color: 'var(--accent-primary)' }}>{log.to_status}</strong>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {log.actor_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
