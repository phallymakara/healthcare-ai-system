import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import {
  Building2,
  Users,
  Ticket,
  Check,
  X,
  Activity,
  RefreshCw,
  Search,
  LayoutDashboard,
  Network,
  UserCog,
  ClipboardList,
  Stethoscope,
} from 'lucide-react';
import { API_BASE } from '../../services/api';

type AdminTab = 'overview' | 'partners' | 'users' | 'audit';

export const AdminDashboard: React.FC = () => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
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
        setActionError(t('admin_err_partner'));
        return;
      }
      await loadAllAdminData();
    } catch (e) {
      setActionError(t('admin_err_partner_conn'));
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
        setActionError(t('admin_err_user'));
        return;
      }
      await loadAllAdminData();
    } catch (e) {
      setActionError(t('admin_err_user_conn'));
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

  const pendingCount = partners.filter((p) => p.verification_status === 'PENDING').length;

  const tabs: { key: AdminTab; label: string; labelKm: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview',  label: 'Overview',        labelKm: 'ទិដ្ឋភាពទូទៅ',       icon: <LayoutDashboard size={16} /> },
    { key: 'partners',  label: 'Partner Network', labelKm: 'បណ្តាញដៃគូ',         icon: <Network size={16} />, badge: pendingCount > 0 ? pendingCount : undefined },
    { key: 'users',     label: 'User Governance', labelKm: 'គ្រប់គ្រងអ្នកប្រើ',   icon: <UserCog size={16} /> },
    { key: 'audit',     label: 'Audit Trail',     labelKm: 'កំណត់ហេតុ',          icon: <ClipboardList size={16} /> },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)', fontFamily: kmFont }}>
        {t('admin_loading')}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', flex: 1, fontFamily: kmFont }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: kmFont, marginBottom: '0.2rem' }}>{t('admin_title')}</h1>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: kmFont }}>{t('admin_subtitle')}</span>
        </div>
        <button
          onClick={loadAllAdminData}
          className="btn btn-outline"
          style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', fontFamily: kmFont, display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={15} /> {t('admin_refresh')}
        </button>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.65rem', marginBottom: '2rem', overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setActionError(null); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                padding: '0.5rem 1.15rem',
                fontSize: '0.925rem',
                fontWeight: isActive ? 700 : 500,
                fontFamily: kmFont,
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive ? 'var(--accent-primary)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              {isKm ? tab.labelKm : tab.label}
              {tab.badge !== undefined && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: '18px', height: '18px', borderRadius: '9px',
                  background: isActive ? '#ffffff' : 'var(--accent-rose)',
                  color: isActive ? 'var(--accent-primary)' : '#ffffff',
                  fontSize: '0.7rem', fontWeight: 700, padding: '0 4px',
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Error display — plain text, no container */}
      {actionError && (
        <span className="error-text" style={{ display: 'block', marginBottom: '1.25rem', fontSize: '0.925rem', fontFamily: kmFont }}>
          {actionError}
        </span>
      )}

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div>
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Building2 size={26} color="var(--accent-primary)" />
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, fontFamily: kmFont, letterSpacing: '0.04em' }}>{t('admin_kpi_hospitals')}</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginTop: '3px' }}>{summary?.total_hospitals || 0}</div>
                  {(summary?.pending_hospital_approvals ?? 0) > 0 && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)', fontFamily: kmFont }}>
                      {summary.pending_hospital_approvals} {isKm ? 'កំពុងរង់ចាំ' : 'pending'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Users size={26} color="var(--accent-cyan)" />
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, fontFamily: kmFont, letterSpacing: '0.04em' }}>{t('admin_kpi_patients')}</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginTop: '3px' }}>{summary?.total_patients || 0}</div>
                </div>
              </div>
            </div>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Ticket size={26} color="var(--accent-blue)" />
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, fontFamily: kmFont, letterSpacing: '0.04em' }}>{t('admin_kpi_tickets')}</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.1, marginTop: '3px' }}>{summary?.total_tickets_issued_today || 0}</div>
                  {(summary?.total_completed_today ?? 0) > 0 && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--accent-emerald)', fontFamily: kmFont }}>
                      {summary.total_completed_today} {isKm ? 'បានបញ្ចប់' : 'completed'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Stethoscope size={22} color="var(--accent-emerald)" />
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, fontFamily: kmFont, letterSpacing: '0.04em' }}>
                    {isKm ? 'វេជ្ជបណ្ឌិតសរុប' : 'Total Doctors'}
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.1, marginTop: '3px' }}>{summary?.total_doctors || 0}</div>
                </div>
              </div>
            </div>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <Activity size={22} color="var(--accent-primary)" />
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, fontFamily: kmFont, letterSpacing: '0.04em' }}>
                    {isKm ? 'វេនសកម្មថ្ងៃនេះ' : 'Active Sessions Today'}
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.1, marginTop: '3px' }}>{summary?.active_queue_sessions_today || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {(summary?.recent_hospitals?.length ?? 0) > 0 && (
            <section>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.875rem', fontFamily: kmFont }}>
                {isKm ? 'មន្ទីរពេទ្យចុះឈ្មោះថ្មីៗ' : 'Recently Registered Hospitals'}
              </h2>
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="responsive-table-wrapper">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_hospital')}</th>
                        <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_location')}</th>
                        <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recent_hospitals.map((h: any) => (
                        <tr key={h.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.9rem 1rem', fontWeight: 600, fontFamily: kmFont }}>
                            {h.name}
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 400 }}>{h.phone || h.email || t('admin_no_contact')}</div>
                          </td>
                          <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontFamily: kmFont }}>{h.address || (isKm ? 'កម្ពុជា' : 'Cambodia')}</td>
                          <td style={{ padding: '0.9rem 1rem' }}>
                            <span className={`badge ${h.verification_status === 'APPROVED' ? 'badge-healthy' : h.verification_status === 'REJECTED' ? '' : 'badge-degraded'}`} style={{ fontFamily: kmFont, ...(h.verification_status === 'REJECTED' ? { border: '1px solid #ef4444', color: '#ef4444' } : {}) }}>
                              {h.verification_status === 'APPROVED' ? t('admin_status_approved') : h.verification_status === 'REJECTED' ? t('admin_status_rejected') : t('admin_status_pending')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Partner Network Tab ── */}
      {activeTab === 'partners' && (
        <section>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', fontFamily: kmFont }}>{t('admin_partner_section')}</h2>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {partners.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-dim)', fontFamily: kmFont, fontSize: '0.95rem' }}>{t('admin_no_partners')}</div>
            ) : (
              <div className="responsive-table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_hospital')}</th>
                      <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_location')}</th>
                      <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_departments')}</th>
                      <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_status')}</th>
                      <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.9rem 1rem', fontWeight: 700, fontFamily: kmFont }}>
                          {p.name}
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 400 }}>{p.phone || p.email || t('admin_no_contact')}</div>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontFamily: kmFont }}>{p.address || (isKm ? 'កម្ពុជា' : 'Cambodia')}</td>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                          {p.departments_count} {t('admin_departments_doctors').replace('{count}', p.doctors_count)}
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <span className={`badge ${p.verification_status === 'APPROVED' ? 'badge-healthy' : p.verification_status === 'REJECTED' ? '' : 'badge-degraded'}`} style={{ fontFamily: kmFont, ...(p.verification_status === 'REJECTED' ? { border: '1px solid #ef4444', color: '#ef4444' } : {}) }}>
                            {p.verification_status === 'APPROVED' ? t('admin_status_approved') : p.verification_status === 'REJECTED' ? t('admin_status_rejected') : t('admin_status_pending')}
                          </span>
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {p.verification_status !== 'APPROVED' && (
                              <button onClick={() => handleVerifyPartner(p.id, 'APPROVED')} disabled={actionLoading} className="btn btn-outline"
                                style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', color: '#059669', borderColor: '#059669', fontFamily: kmFont, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Check size={13} /> {t('admin_approve')}
                              </button>
                            )}
                            {p.verification_status !== 'REJECTED' && (
                              <button onClick={() => handleVerifyPartner(p.id, 'REJECTED')} disabled={actionLoading} className="btn btn-outline"
                                style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444', fontFamily: kmFont, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <X size={13} /> {t('admin_reject')}
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
      )}

      {/* ── User Governance Tab ── */}
      {activeTab === 'users' && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: kmFont }}>{t('admin_user_section')}</h2>
            <div style={{ position: 'relative', width: '280px' }}>
              <input
                type="text"
                className="input-search-rounded"
                placeholder={t('admin_search_placeholder')}
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: '100%', padding: '0.5rem 1rem 0.5rem 2.25rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', color: 'var(--text-main)', fontSize: '0.875rem', fontFamily: kmFont }}
              />
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="responsive-table-wrapper">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_name')}</th>
                    <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_role')}</th>
                    <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_email_phone')}</th>
                    <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_status')}</th>
                    <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontFamily: kmFont }}>
                      {isKm ? 'មិនមានអ្នកប្រើផ្គូផ្គងនឹងការស្វែងរករបស់អ្នក។' : 'No users match your search.'}
                    </td></tr>
                  ) : filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.9rem 1rem', fontWeight: 600, fontFamily: kmFont }}>{u.full_name}</td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span className="badge" style={{ border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontFamily: kmFont }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email || u.phone_number || 'N/A'}</td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span className={`badge ${u.is_active ? 'badge-healthy' : ''}`} style={!u.is_active ? { border: '1px solid #ef4444', color: '#ef4444' } : {}}>
                          {u.is_active ? t('admin_status_active') : t('admin_status_deactivated')}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {u.role !== 'SUPER_ADMIN' && (
                          <button onClick={() => handleToggleUserStatus(u.id, u.is_active)} disabled={actionLoading} className="btn btn-outline"
                            style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem', fontFamily: kmFont }}>
                            {u.is_active ? t('admin_deactivate') : t('admin_activate')}
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
      )}

      {/* ── Audit Trail Tab ── */}
      {activeTab === 'audit' && (
        <section>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', fontFamily: kmFont }}>{t('admin_audit_section')}</h2>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {auditLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-dim)', fontFamily: kmFont, fontSize: '0.95rem' }}>
                {isKm ? 'មិនទាន់មានកំណត់ហេតុសកម្មភាពនៅឡើយទេ។' : 'No audit log entries yet.'}
              </div>
            ) : (
              <div className="responsive-table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_timestamp')}</th>
                      <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_ticket')}</th>
                      <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_hospital_audit')}</th>
                      <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_state_shift')}</th>
                      <th style={{ padding: '0.9rem 1rem', fontFamily: kmFont, fontWeight: 600 }}>{t('admin_th_operator')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.83rem' }}>{new Date(log.timestamp).toLocaleString()}</td>
                        <td style={{ padding: '0.9rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-primary)' }}>{log.ticket_number}</td>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                          {log.hospital_name}
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{log.department_name}</div>
                        </td>
                        <td style={{ padding: '0.9rem 1rem' }}>
                          <span style={{ fontSize: '0.83rem', color: 'var(--text-dim)' }}>{log.from_status || 'NEW'}</span>
                          {' → '}
                          <strong style={{ color: 'var(--accent-primary)', fontSize: '0.875rem' }}>{log.to_status}</strong>
                        </td>
                        <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: kmFont }}>{log.actor_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
