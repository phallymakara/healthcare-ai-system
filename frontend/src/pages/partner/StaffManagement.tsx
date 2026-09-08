import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth';
import { API_BASE } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';

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

export const StaffManagement: React.FC = () => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState('RECEPTIONIST');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Inline Field Errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Auto-Generated Temporary Password Modal State
  const [invitedStaffInfo, setInvitedStaffInfo] = useState<{
    name: string;
    contact: string;
    password: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // Three-Dot Action Dropdown
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'HOSPITAL_ADMIN': return t('staff_role_admin');
      case 'DOCTOR': return t('staff_role_doctor');
      case 'RECEPTIONIST': return t('staff_role_receptionist');
      case 'NURSE': return t('staff_role_nurse');
      default: return r;
    }
  };

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
    setContact('');
    setRole('RECEPTIONIST');
    setPassword('');
    setShowPassword(false);
    setIsActive(true);
    setNameError(null);
    setContactError(null);
    setPasswordError(null);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (staff: StaffMember) => {
    setEditingStaffId(staff.id);
    setFullName(staff.full_name);
    setContact(staff.email || staff.phone_number || '');
    setRole(staff.role);
    setPassword('');
    setShowPassword(false);
    setIsActive(staff.is_active);
    setNameError(null);
    setContactError(null);
    setPasswordError(null);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setContactError(null);
    setPasswordError(null);
    setSubmitError(null);

    let hasError = false;

    if (!fullName.trim()) {
      setNameError(t('staff_err_name'));
      hasError = true;
    }

    const trimmedContact = contact.trim();
    if (!trimmedContact) {
      setContactError(t('staff_err_contact'));
      hasError = true;
    } else if (trimmedContact.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedContact)) {
        setContactError(t('staff_err_email'));
        hasError = true;
      }
    } else {
      const phoneDigits = trimmedContact.replace(/[\s\-\(\)\+]/g, '');
      if (phoneDigits.length < 6 || !/^[0-9+\s\-()]+$/.test(trimmedContact)) {
        setContactError(t('staff_err_phone'));
        hasError = true;
      }
    }

    if (editingStaffId && password && password.length < 6) {
      setPasswordError(t('staff_err_password'));
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

      const isEmail = trimmedContact.includes('@');
      const payload: any = {
        full_name: fullName.trim(),
        email: isEmail ? trimmedContact.toLowerCase() : null,
        phone_number: isEmail ? null : trimmedContact,
        role,
        is_active: isActive,
      };

      if (editingStaffId && password) {
        payload.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setSubmitError(errData.detail || t('staff_err_save'));
        return;
      }

      const createdStaff = await res.json().catch(() => null);

      if (!isEdit && createdStaff?.temp_password) {
        setInvitedStaffInfo({
          name: fullName.trim(),
          contact: trimmedContact,
          password: createdStaff.temp_password,
        });
      }

      setModalOpen(false);
      await loadStaff();
    } catch {
      setSubmitError(t('staff_err_conn'));
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
    <div style={{ width: '100%', minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column', fontFamily: kmFont }}>
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
            fontFamily: kmFont,
          }}
        >
          {t('staff_invite_btn')}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: kmFont }}>
          {t('staff_loading')}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Section Heading */}
          <div style={{ marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--text-main)', fontFamily: kmFont }}>
              {t('staff_roster_title')}
            </h2>
          </div>

          {/* Staff Table Container */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              overflowX: 'auto',
              boxShadow: 'none',
              flex: 1,
              minHeight: '380px',
            }}
          >
            {staffList.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '4rem 1rem',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontFamily: kmFont,
                }}
              >
                {t('staff_no_staff')}
              </div>
            ) : (
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  textAlign: 'left',
                  fontFamily: kmFont,
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: '#f8fafc',
                    }}
                  >
                    <th
                      style={{
                        padding: '0.85rem 1.25rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {t('staff_col_name')}
                    </th>
                    <th
                      style={{
                        padding: '0.85rem 1.25rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {t('staff_col_role')}
                    </th>
                    <th
                      style={{
                        padding: '0.85rem 1.25rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {t('staff_col_status')}
                    </th>
                    <th
                      style={{
                        padding: '0.85rem 1.25rem',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        textAlign: 'right',
                      }}
                    >
                      {t('staff_col_actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff, idx) => (
                    <tr
                      key={staff.id}
                      style={{
                        borderBottom: idx === staffList.length - 1 ? 'none' : '1px solid var(--border-color)',
                        background: '#ffffff',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {/* Name & Contact */}
                      <td style={{ padding: '0.95rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                          {staff.full_name}
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                          {staff.email && staff.phone_number
                            ? `${staff.email} • ${staff.phone_number}`
                            : staff.email || staff.phone_number || t('staff_no_email')}
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '0.95rem 1.25rem', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            fontFamily: kmFont,
                          }}
                        >
                          {getRoleLabel(staff.role)}
                        </div>
                      </td>

                      {/* Status (No background fill outside of text) */}
                      <td style={{ padding: '0.95rem 1.25rem', verticalAlign: 'middle' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.88rem',
                            fontWeight: 600,
                            color: staff.is_active ? '#15803d' : '#64748b',
                            fontFamily: kmFont,
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', color: staff.is_active ? '#16a34a' : '#94a3b8' }}>●</span>
                          <span>{staff.is_active ? t('doc_active') : t('doc_inactive')}</span>
                        </div>
                      </td>

                      {/* Actions: Three-dot dropdown menu */}
                      <td style={{ padding: '0.95rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ position: 'relative', display: 'inline-block', zIndex: activeDropdownId === staff.id ? 60 : 'auto' }}>
                          <button
                            onClick={() => setActiveDropdownId(activeDropdownId === staff.id ? null : staff.id)}
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              letterSpacing: '1px',
                              background: '#ffffff',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              boxShadow: 'none',
                              lineHeight: 1,
                            }}
                          >
                            ···
                          </button>

                          {activeDropdownId === staff.id && (
                            <>
                              <div
                                onClick={() => setActiveDropdownId(null)}
                                style={{
                                  position: 'fixed',
                                  inset: 0,
                                  zIndex: 99,
                                  background: 'transparent',
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 'calc(100% + 4px)',
                                  background: '#ffffff',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  minWidth: '130px',
                                  zIndex: 100,
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                  overflow: 'hidden',
                                  textAlign: 'left',
                                }}
                              >
                                <button
                                  onClick={() => handleToggleActive(staff)}
                                  style={{
                                    padding: '0.6rem 0.95rem',
                                    fontSize: '0.88rem',
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid var(--border-color)',
                                    color: staff.is_active ? '#059669' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    boxShadow: 'none',
                                    fontFamily: kmFont,
                                  }}
                                >
                                  {staff.is_active ? t('doc_inactive') : t('doc_active')}
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveDropdownId(null);
                                    handleOpenEdit(staff);
                                  }}
                                  style={{
                                    padding: '0.6rem 0.95rem',
                                    fontSize: '0.88rem',
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: '1px solid var(--border-color)',
                                    color: 'var(--text-main)',
                                    cursor: 'pointer',
                                    boxShadow: 'none',
                                    fontFamily: kmFont,
                                  }}
                                >
                                  {t('doc_edit')}
                                </button>
                                <button
                                  onClick={() => handleDeleteStaff(staff.id)}
                                  style={{
                                    padding: '0.6rem 0.95rem',
                                    fontSize: '0.88rem',
                                    fontWeight: 500,
                                    textAlign: 'left',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#dc2626',
                                    cursor: 'pointer',
                                    boxShadow: 'none',
                                    fontFamily: kmFont,
                                  }}
                                >
                                  {t('doc_delete')}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Invite / Edit Staff Modal */}
      {modalOpen && (
        <div className="responsive-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="responsive-modal-card" style={{ maxWidth: '520px', fontFamily: kmFont }}>
            <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                  {editingStaffId ? t('staff_modal_edit') : t('staff_modal_invite')}
                </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                  {t('staff_name_label')}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setNameError(null);
                  }}
                  placeholder={t('staff_name_placeholder')}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    border: nameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
                {nameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                    {nameError}
                  </div>
                )}
              </div>

              {/* Email or Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                  {t('staff_contact_label')}
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    setContactError(null);
                  }}
                  placeholder={t('staff_contact_placeholder')}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    border: contactError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
                {contactError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                    {contactError}
                  </div>
                )}
              </div>

              {/* Role Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                  {t('staff_assigned_role')}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    fontFamily: kmFont,
                  }}
                >
                  <option value="RECEPTIONIST">{t('staff_role_receptionist')}</option>
                  <option value="DOCTOR">{t('staff_role_doctor')}</option>
                  <option value="NURSE">{t('staff_role_nurse')}</option>
                  <option value="HOSPITAL_ADMIN">{t('staff_role_admin')}</option>
                </select>
              </div>

              {/* Password - Only when editing existing staff */}
              {editingStaffId && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                    {t('staff_password_new')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordError(null);
                      }}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.72rem 2.4rem 0.72rem 0.85rem',
                        border: passwordError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '0.95rem',
                        boxShadow: 'none',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: kmFont,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {passwordError && (
                    <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                      {passwordError}
                    </div>
                  )}
                </div>
              )}

              {/* Active Toggle (for edit) */}
              {editingStaffId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="staff-active-check"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="staff-active-check" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer', fontFamily: kmFont }}>
                    {t('staff_active_account')}
                  </label>
                </div>
              )}

              {/* Action Error */}
              {submitError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', fontFamily: kmFont }}>
                  {submitError}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    fontSize: '0.98rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '0.75rem 1.45rem',
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    fontSize: '0.98rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {actionLoading ? t('staff_saving') : editingStaffId ? t('staff_save_btn') : t('staff_invite_btn')}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Showing Generated Temporary Password */}
      {invitedStaffInfo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '1rem',
          }}
          onClick={() => setInvitedStaffInfo(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              fontFamily: kmFont,
            }}
          >
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
              {isKm ? 'បានបង្កើតគណនីបុគ្គលិកដោយជោគជ័យ' : 'Staff Account Created Successfully'}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
              {isKm
                ? `ពាក្យសម្ងាត់បណ្តោះអាសន្នត្រូវបានបង្កើតដោយស្វ័យប្រវត្តិ និងផ្ញើទៅកាន់ ${invitedStaffInfo.contact} រួចហើយ។`
                : `A temporary password has been automatically generated and sent to ${invitedStaffInfo.contact}.`}
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                {isKm ? 'ឈ្មោះបុគ្គលិក' : 'Staff Name'}: <strong style={{ color: 'var(--text-main)' }}>{invitedStaffInfo.name}</strong>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                {isKm ? 'គណនី' : 'Account'}: <strong style={{ color: 'var(--text-main)' }}>{invitedStaffInfo.contact}</strong>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                {isKm ? 'ពាក្យសម្ងាត់បណ្តោះអាសន្ន' : 'Temporary Password'}:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <code style={{ flex: 1, padding: '0.55rem 0.75rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-main)' }}>
                  {invitedStaffInfo.password}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(invitedStaffInfo.password);
                    setCopiedPass(true);
                    setTimeout(() => setCopiedPass(false), 2000);
                  }}
                  style={{
                    padding: '0.55rem 0.95rem',
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: 'var(--text-main)',
                    fontFamily: kmFont,
                  }}
                >
                  {copiedPass ? (isKm ? 'បានចម្លង!' : 'Copied!') : (isKm ? 'ចម្លង' : 'Copy')}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setInvitedStaffInfo(null)}
                style={{
                  padding: '0.65rem 1.4rem',
                  background: 'transparent',
                  border: '1px solid var(--text-main)',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                }}
              >
                {t('close') || (isKm ? 'បិទ' : 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
