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
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('RECEPTIONIST');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Inline Field Errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
    setEmail('');
    setPhoneNumber('');
    setRole('RECEPTIONIST');
    setPassword('');
    setShowPassword(false);
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
    setShowPassword(false);
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
      setNameError(t('staff_err_name'));
      hasError = true;
    }

    if (!email.trim() || !email.includes('@')) {
      setEmailError(t('staff_err_email'));
      hasError = true;
    }

    if (!editingStaffId && (!password || password.length < 6)) {
      setPasswordError(t('staff_err_password'));
      hasError = true;
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
        setSubmitError(errData.detail || t('staff_err_save'));
        return;
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

          {/* Staff Rows Container */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            overflow: 'visible',
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
                fontFamily: kmFont,
              }}>
                {t('staff_no_staff')}
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
                    position: 'relative',
                    zIndex: activeDropdownId === staff.id ? 50 : 1,
                    borderTopLeftRadius: idx === 0 ? '6px' : 0,
                    borderTopRightRadius: idx === 0 ? '6px' : 0,
                    borderBottomLeftRadius: idx === staffList.length - 1 ? '6px' : 0,
                    borderBottomRightRadius: idx === staffList.length - 1 ? '6px' : 0,
                  }}
                >
                  {/* Name & Contact */}
                  <div style={{ minWidth: '240px', flex: '1.5' }}>
                    <div style={{ fontSize: '1.28rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                      {staff.full_name}
                    </div>
                    <div style={{ fontSize: '1.02rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                      {staff.email || t('staff_no_email')} {staff.phone_number ? `• ${staff.phone_number}` : ''}
                    </div>
                  </div>

                  {/* Role */}
                  <div style={{ minWidth: '180px', flex: '1' }}>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, fontFamily: kmFont }}>
                      {t('staff_assigned_role')}
                    </div>
                    <div style={{ fontSize: '1.12rem', color: 'var(--text-main)', fontWeight: 600, marginTop: '3px', fontFamily: kmFont }}>
                      {getRoleLabel(staff.role)}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div style={{ minWidth: '100px', flex: '0.7' }}>
                    <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, fontFamily: kmFont }}>
                      {t('staff_status')}
                    </div>
                    <div style={{ marginTop: '3px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.3rem 0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: staff.is_active ? '#059669' : 'var(--text-muted)',
                        background: 'transparent',
                        fontFamily: kmFont,
                      }}>
                        {staff.is_active ? t('doc_active') : t('doc_inactive')}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Three-dot dropdown menu */}
                  <div style={{ position: 'relative', zIndex: activeDropdownId === staff.id ? 60 : 'auto' }}>
                    <button
                      onClick={() => setActiveDropdownId(activeDropdownId === staff.id ? null : staff.id)}
                      style={{
                        padding: '0.35rem 0.85rem',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        boxShadow: 'none',
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
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 4px)',
                          background: '#ffffff',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: '120px',
                          zIndex: 100,
                          boxShadow: 'none',
                          overflow: 'hidden',
                        }}>
                          <button
                            onClick={() => handleToggleActive(staff)}
                            style={{
                              padding: '0.6rem 0.95rem',
                              fontSize: '0.98rem',
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
                            {staff.is_active ? t('doc_active') : t('doc_inactive')}
                          </button>
                          <button
                            onClick={() => {
                              setActiveDropdownId(null);
                              handleOpenEdit(staff);
                            }}
                            style={{
                              padding: '0.6rem 0.95rem',
                              fontSize: '0.98rem',
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
                              fontSize: '0.98rem',
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
                </div>
              ))
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

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                  {t('staff_email_label')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder={t('staff_email_placeholder')}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    border: emailError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
                {emailError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                    {emailError}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                  {t('staff_phone_label')}
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="012 345 678"
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
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

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                  {editingStaffId ? t('staff_password_new') : t('staff_password_init')}
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
    </div>
  );
};
