import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth';

interface StaffMember {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  HOSPITAL_ADMIN: 'Hospital Administrator',
  DOCTOR: 'Doctor / Physician',
  RECEPTIONIST: 'Front-Desk Receptionist',
  NURSE: 'Triage Nurse',
};

export const StaffManagement: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('RECEPTIONIST');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Inline Field Errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Three-Dot Action Dropdown
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const API_BASE = '/api/v1';

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/partners/staff`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch {
      // Background reload issue
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleOpenInvite = () => {
    setEditingStaffId(null);
    setFullName('');
    setEmail('');
    setPhoneNumber('');
    setRole('RECEPTIONIST');
    setPassword('');
    setIsActive(true);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setFullName(staff.full_name);
    setEmail(staff.email || '');
    setPhoneNumber(staff.phone_number || '');
    setRole(staff.role);
    setPassword('');
    setIsActive(staff.is_active);
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setSubmitError(null);

    let hasError = false;

    if (!fullName.trim()) {
      setNameError('Please enter the full name.');
      hasError = true;
    }

    if (!email.trim() || !email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      hasError = true;
    }

    if (!editingStaffId && (!password || password.length < 6)) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }

    if (editingStaffId && password && password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }

    if (hasError) return;

    setActionLoading(true);

    try {
      const isEdit = Boolean(editingStaffId);
      const url = isEdit
        ? `${API_BASE}/partners/staff/${editingStaffId}`
        : `${API_BASE}/partners/staff`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload: any = {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phoneNumber.trim() || null,
        role,
        is_active: isActive,
      };

      if (password) {
        payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setSubmitError(errData.detail || 'Unable to save staff account. Please try again.');
        return;
      }

      setModalOpen(false);
      await loadStaff();
    } catch {
      setSubmitError('Connection issue saving staff account. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (staff: StaffMember) => {
    setActiveDropdownId(null);
    try {
      await fetch(`${API_BASE}/partners/staff/${staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({ is_active: !staff.is_active }),
      });
      await loadStaff();
    } catch {
      // Ignore background error
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    setActiveDropdownId(null);
    try {
      const res = await fetch(`${API_BASE}/partners/staff/${staffId}`, {
        method: 'DELETE',
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        await loadStaff();
      }
    } catch {
      // Ignore background error
    }
  };

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top Controls: + Invite Staff aligned to the left */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          onClick={handleOpenInvite}
          style={{
            padding: '0.55rem 1rem',
            background: 'transparent',
            border: '1px solid var(--text-main)',
            borderRadius: '4px',
            color: 'var(--text-main)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'none',
          }}
        >
          + Invite Staff
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Loading staff accounts...
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Section Heading */}
          <div style={{ marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 400, margin: 0, color: 'var(--text-main)' }}>
              Hospital Staff Roster
            </h2>
          </div>

          {/* Staff Rows Container */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: 'none',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: '380px',
          }}>
            {staffList.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}>
                No staff members registered yet. Click + Invite Staff to add one.
              </div>
            ) : (
              staffList.map((staff, idx) => (
                <div
                  key={staff.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '1rem 1.25rem',
                    borderBottom: idx === staffList.length - 1 ? 'none' : '1px solid var(--border-color)',
                    background: '#ffffff',
                  }}
                >
                  {/* Name & Contact */}
                  <div style={{ minWidth: '240px', flex: '1.5' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {staff.full_name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {staff.email || 'No email'} {staff.phone_number ? `• ${staff.phone_number}` : ''}
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{ minWidth: '180px', flex: '1' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Assigned Role
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                      {ROLE_LABELS[staff.role] || staff.role}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={{ minWidth: '100px', flex: '0.7' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Status
                    </div>
                    <div style={{ marginTop: '2px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.15rem 0.45rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '3px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: staff.is_active ? '#059669' : 'var(--text-muted)',
                        background: 'transparent',
                      }}>
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Three-dot dropdown menu */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setActiveDropdownId(activeDropdownId === staff.id ? null : staff.id)}
                      style={{
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '3px',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        boxShadow: 'none',
                      }}
                    >
                      ···
                    </button>

                    {activeDropdownId === staff.id && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 4px)',
                        background: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: '110px',
                        zIndex: 50,
                        boxShadow: 'none',
                        overflow: 'hidden',
                      }}>
                        <button
                          onClick={() => handleToggleActive(staff)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--border-color)',
                            color: staff.is_active ? '#059669' : 'var(--text-muted)',
                            cursor: 'pointer',
                            boxShadow: 'none',
                          }}
                        >
                          {staff.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => {
                            setActiveDropdownId(null);
                            handleOpenEdit(staff);
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            boxShadow: 'none',
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(staff.id)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            boxShadow: 'none',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Invite / Edit Staff Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            width: '100%',
            maxWidth: '480px',
            padding: '1.5rem',
            boxShadow: 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {editingStaffId ? 'Edit Staff Account' : 'Invite Staff Member'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff}>
              {/* Full Name */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setNameError(null);
                  }}
                  placeholder="e.g. Sokha Meas"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: nameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {nameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                    {nameError}
                  </div>
                )}
              </div>

              {/* Email */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder="sokha.meas@hospital.kh"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: emailError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {emailError && (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                    {emailError}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="012 345 678"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Role Selection */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  Assigned Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                  }}
                >
                  <option value="RECEPTIONIST">Front-Desk Receptionist</option>
                  <option value="DOCTOR">Doctor / Physician</option>
                  <option value="NURSE">Triage Nurse</option>
                  <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
                </select>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  {editingStaffId ? 'New Password (leave blank to keep current)' : 'Initial Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    border: passwordError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {passwordError && (
                  <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                    {passwordError}
                  </div>
                )}
              </div>

              {/* Active Toggle (for edit) */}
              {editingStaffId && (
                <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="staff-active-check"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="staff-active-check" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                    Active Account
                  </label>
                </div>
              )}

              {/* Action Error */}
              {submitError && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  {submitError}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '0.5rem 1.1rem',
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    opacity: actionLoading ? 0.6 : 1,
                    boxShadow: 'none',
                  }}
                >
                  {actionLoading ? 'Saving...' : editingStaffId ? 'Save Changes' : 'Invite Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
