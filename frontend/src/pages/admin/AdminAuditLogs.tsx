import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { RealTimeQueueClient } from '../../services/websocket';
import {
  FileText,
  Search,
  Shield,
  LogIn,
  LogOut,
  Building2,
  UserCheck,
  X,
} from 'lucide-react';
import { API_BASE } from '../../services/api';

export interface AuditLogItem {
  id: string;
  event_type: string;
  action: string;
  actor_name: string;
  actor_role: string;
  actor_email?: string;
  target_entity?: string;
  details?: string;
  ip_address?: string;
  status: 'SUCCESS' | 'WARNING' | 'INFO' | 'CRITICAL' | string;
  timestamp: string;
}

type EventCategory = 'ALL' | 'AUTH' | 'HOSPITAL_VERIFICATION' | 'USER_PERMISSION' | 'SECURITY_ALERT';

export const AdminAuditLogs: React.FC = () => {
  const { language } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<EventCategory>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    try {
      const headers = AuthService.getAuthHeaders();
      const params = new URLSearchParams();
      if (category !== 'ALL') params.set('event_type', category);
      if (roleFilter !== 'ALL') params.set('actor_role', roleFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`${API_BASE}/admin/activity-logs?${params.toString()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
      // Quiet background failure
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [category, roleFilter]);

  // Handle Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(true);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Real-time synchronization
  useEffect(() => {
    const ws = new RealTimeQueueClient('global');
    ws.connect();
    const unsubscribe = ws.subscribe((msg?: any) => {
      if (
        !msg ||
        msg.event === 'audit_log_created' ||
        msg.event === 'partner_verification_updated' ||
        msg.event === 'user_status_updated'
      ) {
        fetchLogs(true);
      }
    });

    const pollInterval = setInterval(() => {
      fetchLogs(true);
    }, 4000);

    return () => {
      unsubscribe();
      ws.disconnect();
      clearInterval(pollInterval);
    };
  }, [category, roleFilter, searchQuery]);

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        date: d.toLocaleDateString(isKm ? 'km-KH' : 'en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: iso, time: '' };
    }
  };

  const getEventBadge = (type: string, action: string) => {
    let shortAction = action;
    const aLower = action.toLowerCase();

    if (type === 'LOGIN' || aLower.includes('login') || aLower.includes('auth')) {
      shortAction = 'Login';
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--text-main)',
          }}
        >
          <LogIn size={13} color="var(--accent-primary)" />
          <span>{shortAction}</span>
        </span>
      );
    }

    if (type === 'LOGOUT' || aLower.includes('logout') || aLower.includes('signed out')) {
      shortAction = 'Logout';
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--text-muted)',
          }}
        >
          <LogOut size={13} />
          <span>{shortAction}</span>
        </span>
      );
    }

    if (type === 'HOSPITAL_VERIFICATION' || aLower.includes('verif')) {
      shortAction = 'Verified';
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--text-main)',
          }}
        >
          <Building2 size={13} color="var(--accent-primary)" />
          <span>{shortAction}</span>
        </span>
      );
    }

    if (type === 'USER_PERMISSION' || aLower.includes('permission')) {
      shortAction = aLower.includes('disabled') ? 'Disabled' : aLower.includes('enabled') ? 'Enabled' : 'Permission';
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.82rem',
            fontWeight: 600,
            background: 'transparent',
            color: 'var(--text-main)',
          }}
        >
          <UserCheck size={13} />
          <span>{shortAction}</span>
        </span>
      );
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.82rem',
          fontWeight: 600,
          background: 'transparent',
          color: 'var(--text-main)',
        }}
      >
        <Shield size={13} />
        <span>Security</span>
      </span>
    );
  };

  const getRoleLabel = (role: string) => {
    const r = (role || '').toUpperCase();
    if (r.includes('SUPER') || r === 'SUPER_ADMIN') return 'Admin';
    if (r.includes('HOSPITAL') || r.includes('PARTNER')) return 'Partner';
    if (r.includes('DOCTOR')) return 'Doctor';
    if (r.includes('RECEPTION') || r.includes('STAFF')) return 'Staff';
    if (r.includes('NURSE')) return 'Nurse';
    return role;
  };

  return (
    <div
      style={{
        padding: '1.25rem 1.5rem',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: kmFont,
      }}
    >
      {/* Control Bar: Filters & Search */}
      <div className="admin-control-bar">
        {/* Category Filter Pills */}
        <div className="admin-pills-track">
          {[
            { id: 'ALL', label: 'All Activities' },
            { id: 'AUTH', label: 'Logins & Logouts' },
            { id: 'HOSPITAL_VERIFICATION', label: 'Partner Verification' },
            { id: 'USER_PERMISSION', label: 'Permissions & Status' },
            { id: 'SECURITY_ALERT', label: 'Security Checkpoints' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as EventCategory)}
              className="admin-filter-pill"
              style={{
                fontWeight: category === cat.id ? 600 : 500,
                background: category === cat.id ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: category === cat.id ? '#ffffff' : 'var(--text-main)',
                border: category === cat.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Role Select */}
        <div className="admin-search-actions">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="admin-select-input"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="HOSPITAL_ADMIN">Clinic Admin</option>
            <option value="DOCTOR">Doctor</option>
            <option value="RECEPTIONIST">Receptionist</option>
          </select>

          <div className="admin-search-box">
            <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search actor, facility, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                color: 'var(--text-main)',
                width: '100%',
                height: '100%',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          background: 'var(--bg-card)',
          overflow: 'hidden',
          width: '100%',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ overflowX: 'auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.85rem',
              height: logs.length === 0 ? '100%' : 'auto',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'rgba(0, 0, 0, 0.02)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', width: '150px' }}>
                  Timestamp
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Action / Event
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Actor
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Target / Facility
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Details
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', width: '120px' }}>
                  IP Address
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right', width: '80px' }}>
                  Inspect
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', height: '100%', verticalAlign: 'middle' }}>
                    Loading audit trail telemetry...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', height: '100%', verticalAlign: 'middle' }}>
                    No activity logs match the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const ts = formatTimestamp(log.timestamp);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.015)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Timestamp */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.82rem' }}>
                          {ts.time}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {ts.date}
                        </div>
                      </td>

                      {/* Action / Event */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        {getEventBadge(log.event_type, log.action)}
                      </td>

                      {/* Actor */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {log.actor_name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 500,
                              color: 'var(--text-muted)',
                            }}
                          >
                            ({getRoleLabel(log.actor_role)})
                          </span>
                        </div>
                        {log.actor_email && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {log.actor_email}
                          </div>
                        )}
                      </td>

                      {/* Target / Facility */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', color: 'var(--text-main)', fontWeight: 500 }}>
                        {log.target_entity || '—'}
                      </td>

                      {/* Details */}
                      <td
                        style={{
                          padding: '10px 14px',
                          verticalAlign: 'middle',
                          color: 'var(--text-muted)',
                          fontSize: '0.82rem',
                          maxWidth: '300px',
                        }}
                      >
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.details || '—'}
                        </div>
                      </td>

                      {/* IP Address */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.78rem',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {log.ip_address || '127.0.0.1'}
                        </span>
                      </td>

                      {/* Inspect Button */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            background: 'transparent',
                            color: 'var(--text-main)',
                            fontSize: '0.76rem',
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              maxWidth: '560px',
              width: '100%',
              padding: '1.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.75rem',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Audit Event Payload
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Action: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedLog.action}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Event Category: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedLog.event_type}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Actor: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {selectedLog.actor_name} ({selectedLog.actor_role})
                </span>
                {selectedLog.actor_email && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>&lt;{selectedLog.actor_email}&gt;</span>
                )}
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Target Entity: </span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{selectedLog.target_entity || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>IP Address: </span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.ip_address || '127.0.0.1'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Timestamp: </span>
                <span>{selectedLog.timestamp}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Details: </span>
                <p
                  style={{
                    margin: '6px 0 0 0',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '0.82rem',
                    lineHeight: '1.4',
                  }}
                >
                  {selectedLog.details || 'No additional notes recorded.'}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
