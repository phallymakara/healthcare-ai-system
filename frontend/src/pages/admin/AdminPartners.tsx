import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { RealTimeQueueClient } from '../../services/websocket';
import {
  Building2,
  Search,
  X,
} from 'lucide-react';
import { API_BASE } from '../../services/api';

export const AdminPartners: React.FC = () => {
  const { language } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingHospId, setRejectingHospId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadPartners = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    setActionError(null);
    try {
      const headers = AuthService.getAuthHeaders();
      const res = await fetch(`${API_BASE}/admin/partners`, { headers });
      if (res.ok) {
        setPartners(await res.json());
      }
    } catch {
      // Quiet background failure
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners(false);

    const ws = new RealTimeQueueClient('global');
    ws.connect();
    const unsubscribe = ws.subscribe((msg?: any) => {
      if (!msg || msg.event === 'partner_verification_updated') {
        loadPartners(true);
      }
    });

    const interval = setInterval(() => {
      loadPartners(true);
    }, 20000);

    return () => {
      unsubscribe();
      ws.disconnect();
      clearInterval(interval);
    };
  }, []);

  const handleVerifyPartner = async (hospId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionError(null);
    setActionLoading(true);
    try {
      const body: any = { status };
      if (status === 'REJECTED' && rejectionReason.trim()) {
        body.rejection_reason = rejectionReason.trim();
      }

      const res = await fetch(`${API_BASE}/admin/partners/${hospId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setActionError('Failed to update hospital status');
        return;
      }
      setRejectingHospId(null);
      setRejectionReason('');
      await loadPartners(true);
    } catch {
      setActionError('Network error while updating hospital verification');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredPartners = partners.filter((p) => {
    if (filterStatus !== 'ALL' && p.verification_status !== filterStatus) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q)
    );
  });

  const INITIAL_BATCH = 35;
  const BATCH_SIZE = 35;
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [searchQuery, filterStatus, partners.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting && visibleCount < filteredPartners.length) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredPartners.length));
        }
      },
      { root: null, rootMargin: '120px', threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredPartners.length]);

  const visiblePartners = filteredPartners.slice(0, visibleCount);

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
      {/* Control Bar: Filter Pills & Search */}
      <div className="admin-control-bar">
        <div className="admin-pills-track">
          {[
            { id: 'ALL', label: 'All Facilities' },
            { id: 'PENDING', label: 'Pending Approval' },
            { id: 'APPROVED', label: 'Approved & Active' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterStatus(cat.id)}
              className="admin-filter-pill"
              style={{
                fontWeight: filterStatus === cat.id ? 600 : 500,
                background: filterStatus === cat.id ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: filterStatus === cat.id ? '#ffffff' : 'var(--text-main)',
                border: filterStatus === cat.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="admin-search-actions">
          <div className="admin-search-box">
            <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search facility name, contact..."
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
              height: filteredPartners.length === 0 ? '100%' : 'auto',
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
                  Partner Facility
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  Phone Number
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)' }}>
                  Email
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', width: '130px' }}>
                  Departments
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', width: '110px' }}>
                  Doctors
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', width: '110px' }}>
                  Status
                </th>
                <th style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right', width: '160px' }}>
                  Clearance Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && partners.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', height: '100%', verticalAlign: 'middle' }}>
                    Loading partner facilities...
                  </td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', height: '100%', verticalAlign: 'middle' }}>
                    No partner facilities match the criteria.
                  </td>
                </tr>
              ) : (
                visiblePartners.map((hosp) => (
                  <tr
                    key={hosp.id}
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
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={16} color="var(--accent-primary)" />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {hosp.name}
                          </div>
                          {hosp.address && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {hosp.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone Number Column */}
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      {hosp.phone ? (
                        <span style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>
                          {hosp.phone}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    {/* Email Column */}
                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      {hosp.email ? (
                        <span style={{ color: 'var(--text-main)', fontSize: '0.82rem' }}>
                          {hosp.email}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>

                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', color: 'var(--text-main)' }}>
                      <span style={{ fontWeight: 500 }}>{hosp.departments_count}</span> depts
                    </td>

                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', color: 'var(--text-main)' }}>
                      <span style={{ fontWeight: 500 }}>{hosp.doctors_count}</span> doctors
                    </td>

                    <td style={{ padding: '10px 14px', verticalAlign: 'middle' }}>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          color:
                            hosp.verification_status === 'APPROVED'
                              ? '#059669'
                              : hosp.verification_status === 'REJECTED'
                              ? '#dc2626'
                              : '#d97706',
                        }}
                      >
                        {hosp.verification_status === 'APPROVED'
                          ? 'Approved'
                          : hosp.verification_status === 'REJECTED'
                          ? 'Rejected'
                          : 'Pending'}
                      </span>
                    </td>

                    <td style={{ padding: '10px 14px', verticalAlign: 'middle', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {hosp.verification_status !== 'APPROVED' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleVerifyPartner(hosp.id, 'APPROVED')}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid #059669',
                              background: 'transparent',
                              color: '#059669',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                            }}
                          >
                            Approve
                          </button>
                        )}
                        {hosp.verification_status !== 'REJECTED' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => setRejectingHospId(hosp.id)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: '1px solid #dc2626',
                              background: 'transparent',
                              color: '#dc2626',
                              fontWeight: 600,
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                            }}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {visiblePartners.length < filteredPartners.length && (
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
              Showing {visiblePartners.length} of {filteredPartners.length} partner facilities...
            </div>
          )}
        </div>
      </div>

      {/* Rejection Note Modal */}
      {rejectingHospId && (
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
          onClick={() => setRejectingHospId(null)}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              maxWidth: '440px',
              width: '100%',
              padding: '1.25rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Reject Partner Onboarding
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Please specify the compliance or documentation reason for rejecting this clinic.
            </p>
            <textarea
              rows={3}
              placeholder="Reason for rejecting or requesting correction..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-main)',
                fontSize: '0.83rem',
                outline: 'none',
                resize: 'none',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '1rem' }}>
              <button
                onClick={() => setRejectingHospId(null)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleVerifyPartner(rejectingHospId, 'REJECTED')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #dc2626',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
