import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { RealTimeQueueClient } from '../../services/websocket';
import {
  Search,
  X,
  Building2,
} from 'lucide-react';
import { API_BASE } from '../../services/api';

export const AdminUsers: React.FC = () => {
  const { language } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setActionError(null);
    try {
      const headers = AuthService.getAuthHeaders();
      const res = await fetch(`${API_BASE}/admin/users`, { headers });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch {
      // Quiet background failure
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(false);

    const ws = new RealTimeQueueClient('global');
    ws.connect();
    const unsubscribe = ws.subscribe((msg?: any) => {
      if (!msg || msg.event === 'user_status_updated') {
        loadUsers(true);
      }
    });

    const interval = setInterval(() => {
      loadUsers(true);
    }, 20000);

    return () => {
      unsubscribe();
      ws.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleToggleUserStatus = async (userId: string, currentActive: boolean) => {
    setActionError(null);
    setActionLoadingId(userId);

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u))
    );

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
        // Rollback on failure
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, is_active: currentActive } : u))
        );
        setActionError('Failed to update user account active state.');
        return;
      }
    } catch {
      // Rollback on connection error
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: currentActive } : u))
      );
      setActionError('Network error while toggling user account.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRoleLabel = (role: string) => {
    const r = (role || '').toUpperCase();
    if (r.includes('SUPER')) return 'Admin';
    if (r.includes('HOSPITAL') || r.includes('PARTNER')) return 'Partner';
    if (r.includes('DOCTOR')) return 'Doctor';
    if (r.includes('RECEPTION') || r.includes('STAFF')) return 'Staff';
    if (r.includes('PATIENT')) return 'Patient';
    if (r.includes('NURSE')) return 'Nurse';
    return role;
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (statusFilter === 'ACTIVE' && !u.is_active) return false;
    if (statusFilter === 'INACTIVE' && u.is_active) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone_number?.includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.hospital_name?.toLowerCase().includes(q)
    );
  });

  const INITIAL_BATCH = 35;
  const BATCH_SIZE = 35;
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [searchQuery, roleFilter, statusFilter, users.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting && visibleCount < filteredUsers.length) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredUsers.length));
        }
      },
      { root: null, rootMargin: '120px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredUsers.length]);

  const visibleUsers = filteredUsers.slice(0, visibleCount);

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
        {/* Role Filter Pills */}
        <div className="admin-pills-track">
          {[
            { id: 'ALL', label: 'All Accounts' },
            { id: 'PATIENT', label: 'Patients' },
            { id: 'DOCTOR', label: 'Doctors' },
            { id: 'HOSPITAL_ADMIN', label: 'Clinic Admins' },
            { id: 'RECEPTIONIST', label: 'Staff Accounts' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setRoleFilter(cat.id)}
              className="admin-filter-pill"
              style={{
                fontWeight: roleFilter === cat.id ? 600 : 500,
                background: roleFilter === cat.id ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: roleFilter === cat.id ? '#ffffff' : 'var(--text-main)',
                border: roleFilter === cat.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown & Search Input */}
        <div className="admin-search-actions">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="admin-select-input"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Accounts</option>
            <option value="INACTIVE">Deactivated Accounts</option>
          </select>

          <div className="admin-search-box">
            <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search user, phone, facility..."
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

      {actionError && (
        <div style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
          {actionError}
        </div>
      )}

      {/* Main Table */}
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
              height: filteredUsers.length === 0 ? '100%' : 'auto',
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'rgba(0, 0, 0, 0.02)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  User Account
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Email
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Phone Number
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Affiliated Facility
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', width: '120px' }}>
                  Account Status
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right', width: '150px' }}>
                  Access Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', height: '100%', verticalAlign: 'middle' }}>
                    Loading user directory...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', height: '100%', verticalAlign: 'middle' }}>
                    No user accounts match the selected filters.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((u) => {
                  const isLoading = actionLoadingId === u.id;
                  return (
                    <tr
                      key={u.id}
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
                      {/* Name & Role */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {u.full_name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 500,
                              color: 'var(--text-muted)',
                            }}
                          >
                            ({getRoleLabel(u.role)})
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        {u.email ? (
                          <span style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>
                            {u.email}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Phone Number */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        {u.phone_number ? (
                          <span style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>
                            {u.phone_number}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Affiliated Facility */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', color: 'var(--text-main)' }}>
                        {u.hospital_name ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Building2 size={14} color="var(--accent-primary)" />
                            <span>{u.hospital_name}</span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Direct / Public</span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: u.is_active ? '#059669' : '#dc2626',
                          }}
                        >
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      {/* Toggle Action */}
                      <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                        {u.role === 'SUPER_ADMIN' ? (
                          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Protected</span>
                        ) : (
                          <button
                            disabled={isLoading}
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: u.is_active ? '1px solid #dc2626' : '1px solid #059669',
                              background: 'transparent',
                              color: u.is_active ? '#dc2626' : '#059669',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              opacity: isLoading ? 0.6 : 1,
                            }}
                          >
                            {isLoading ? 'Updating...' : u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {visibleUsers.length < filteredUsers.length && (
            <div
              ref={sentinelRef}
              style={{
                padding: '12px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              Showing {visibleUsers.length} of {filteredUsers.length} user accounts...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
