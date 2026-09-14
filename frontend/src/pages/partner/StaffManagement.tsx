import React, { useState, useEffect } from 'react';
import { AuthService } from '../../services/auth';
import { API_BASE } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import { Eye, EyeOff, User, Camera, RefreshCw } from 'lucide-react';
import { useModalClose } from '../../hooks/useModalClose';

interface StaffMember {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  profile_photo_url?: string | null;
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
  const staffModal = useModalClose(modalOpen, setModalOpen);
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

  // Row Photo Upload State
  const rowPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const activeUploadStaffIdRef = React.useRef<string | null>(null);
  const [rowUploadingStaffId, setRowUploadingStaffId] = useState<string | null>(null);
  const [hoveredAvatarStaffId, setHoveredAvatarStaffId] = useState<string | null>(null);
  const [rowUploadError, setRowUploadError] = useState<{ staffId: string; message: string } | null>(null);

  // Modal Photo Upload State
  const modalPhotoInputRef = React.useRef<HTMLInputElement | null>(null);
  const [modalPhotoUrl, setModalPhotoUrl] = useState<string>('');
  const [modalPhotoFile, setModalPhotoFile] = useState<File | null>(null);
  const [removeModalPhoto, setRemoveModalPhoto] = useState(false);

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
    setModalPhotoUrl('');
    setModalPhotoFile(null);
    setRemoveModalPhoto(false);
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
    setModalPhotoUrl(staff.profile_photo_url || '');
    setModalPhotoFile(null);
    setRemoveModalPhoto(false);
    setNameError(null);
    setContactError(null);
    setPasswordError(null);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleModalPhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError(isKm ? 'ទំហំរូបភាពត្រូវតែតូចជាង 5MB' : 'Image size must be under 5MB');
      return;
    }
    setModalPhotoFile(file);
    setModalPhotoUrl(URL.createObjectURL(file));
    setRemoveModalPhoto(false);
  };

  const handleRemoveModalPhoto = () => {
    setModalPhotoFile(null);
    setModalPhotoUrl('');
    setRemoveModalPhoto(true);
    if (modalPhotoInputRef.current) {
      modalPhotoInputRef.current.value = '';
    }
  };

  const handleTriggerRowPhotoUpload = (staffId: string) => {
    if (rowUploadingStaffId) return;
    setRowUploadError(null);
    activeUploadStaffIdRef.current = staffId;
    if (rowPhotoInputRef.current) {
      rowPhotoInputRef.current.value = '';
      rowPhotoInputRef.current.click();
    }
  };

  const handleRowPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetStaffId = activeUploadStaffIdRef.current;
    if (!file || !targetStaffId) return;

    if (file.size > 5 * 1024 * 1024) {
      setRowUploadError({
        staffId: targetStaffId,
        message: isKm ? 'ទំហំរូបភាពត្រូវតែតូចជាង 5MB' : 'Image size must be under 5MB',
      });
      return;
    }

    setRowUploadError(null);
    setRowUploadingStaffId(targetStaffId);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/partners/staff/${targetStaffId}/photo`, {
        method: 'POST',
        headers: AuthService.getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setStaffList(prev =>
        prev.map(s => s.id === targetStaffId ? { ...s, profile_photo_url: data.url } : s)
      );
    } catch {
      setRowUploadError({
        staffId: targetStaffId,
        message: isKm ? 'មិនអាចផ្ទុករូបភាពឡើងបានទេ។' : 'Failed to upload photo.',
      });
    } finally {
      setRowUploadingStaffId(null);
      activeUploadStaffIdRef.current = null;
    }
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
        const rawDetail = typeof errData.detail === 'string' ? errData.detail : '';
        if (rawDetail.includes('already exists') || rawDetail.includes('already registered') || res.status === 409) {
          setContactError(t('err_partner_exists') || t('staff_err_contact'));
        } else {
          setSubmitError(t('staff_err_save'));
        }
        return;
      }

      const createdStaff = await res.json().catch(() => null);

      const targetId = editingStaffId || createdStaff?.id;
      if (targetId) {
        if (modalPhotoFile) {
          const formData = new FormData();
          formData.append('file', modalPhotoFile);
          await fetch(`${API_BASE}/partners/staff/${targetId}/photo`, {
            method: 'POST',
            headers: AuthService.getAuthHeaders(),
            body: formData,
          }).catch(() => null);
        } else if (removeModalPhoto && editingStaffId) {
          await fetch(`${API_BASE}/partners/staff/${editingStaffId}/photo`, {
            method: 'DELETE',
            headers: AuthService.getAuthHeaders(),
          }).catch(() => null);
        }
      }

      if (!isEdit && createdStaff?.temp_password) {
        setInvitedStaffInfo({
          name: fullName.trim(),
          contact: trimmedContact,
          password: createdStaff.temp_password,
        });
      }

      staffModal.close();
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
          type="button"
          onClick={handleOpenInvite}
          className="hospital-action-btn"
          style={{
            padding: '0.55rem 1.15rem',
            background: 'transparent',
            border: '1px solid var(--text-main)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-main)',
            fontSize: '0.875rem',
            fontWeight: 600,
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
          {/* Hidden File Input for Row Avatar Upload */}
          <input
            type="file"
            ref={rowPhotoInputRef}
            accept="image/*"
            onChange={handleRowPhotoFileChange}
            style={{ display: 'none' }}
          />

          {/* Staff Table */}
          <div
            style={{
              width: '100%',
              overflowX: 'auto',
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              boxShadow: 'none',
              flex: 1,
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
                  overflow: 'visible',
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: 'transparent',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    <th
                      style={{
                        padding: '0.8rem 1.25rem',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        fontFamily: kmFont,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isKm ? 'ឈ្មោះ' : t('staff_col_name')}
                    </th>
                    <th
                      style={{
                        padding: '0.8rem 1.25rem',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        fontFamily: kmFont,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isKm ? 'ទំនាក់ទំនង' : t('staff_col_contact')}
                    </th>
                    <th
                      style={{
                        padding: '0.8rem 1.25rem',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        fontFamily: kmFont,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('staff_col_role')}
                    </th>
                    <th
                      style={{
                        padding: '0.8rem 1.25rem',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        fontFamily: kmFont,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t('staff_col_status')}
                    </th>
                    <th
                      style={{
                        padding: '0.8rem 1.25rem',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        textAlign: 'right',
                        fontFamily: kmFont,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isKm ? 'សកម្ម' : t('staff_col_actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => {
                    const isOpen = activeDropdownId === staff.id;

                    return (
                      <tr
                        key={staff.id}
                        className="staff-table-row"
                        style={{
                          borderBottom: '1px solid var(--border-color)',
                          background: 'transparent',
                          position: 'relative',
                          zIndex: isOpen ? 1000 : 1,
                        }}
                      >
                        {/* Name with User Profile Prefix & Photo Upload */}
                        <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', whiteSpace: 'nowrap' }}>
                            <div
                              onClick={() => handleTriggerRowPhotoUpload(staff.id)}
                              onMouseEnter={() => setHoveredAvatarStaffId(staff.id)}
                              onMouseLeave={() => setHoveredAvatarStaffId(null)}
                              title={isKm ? 'ចុចដើម្បីផ្ទុកឡើងរូបថត' : 'Click to upload photo'}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: '#f1f5f9',
                                border: hoveredAvatarStaffId === staff.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                cursor: rowUploadingStaffId === staff.id ? 'wait' : 'pointer',
                                position: 'relative',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {rowUploadingStaffId === staff.id ? (
                                <RefreshCw size={15} className="spin" color="var(--accent-primary)" />
                              ) : staff.profile_photo_url ? (
                                <>
                                  <img
                                    src={staff.profile_photo_url}
                                    alt={staff.full_name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                                  />
                                  {hoveredAvatarStaffId === staff.id && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0, 0, 0, 0.4)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <Camera size={14} color="#ffffff" />
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  {hoveredAvatarStaffId === staff.id ? (
                                    <Camera size={15} color="var(--accent-primary)" />
                                  ) : (
                                    <User size={18} color="var(--text-muted)" />
                                  )}
                                </>
                              )}
                            </div>
                            <div>
                              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>
                                {staff.full_name}
                              </span>
                              {rowUploadError && rowUploadError.staffId === staff.id && (
                                <span style={{ fontSize: '0.78rem', color: '#dc2626', fontFamily: kmFont, display: 'block', marginTop: '2px' }}>
                                  {rowUploadError.message}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                            {staff.email && staff.phone_number
                              ? `${staff.email} • ${staff.phone_number}`
                              : staff.email || staff.phone_number || t('staff_no_email')}
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 500,
                              color: 'var(--text-main)',
                              fontFamily: kmFont,
                            }}
                          >
                            {getRoleLabel(staff.role)}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              fontSize: '0.86rem',
                              fontWeight: 500,
                              color: staff.is_active ? '#15803d' : '#64748b',
                              fontFamily: kmFont,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span style={{ fontSize: '0.7rem', color: staff.is_active ? '#16a34a' : '#94a3b8', lineHeight: 1, flexShrink: 0 }}>●</span>
                            <span style={{ whiteSpace: 'nowrap' }}>{staff.is_active ? t('doc_active') : t('doc_inactive')}</span>
                          </div>
                        </td>

                        {/* Actions: Three-dot dropdown menu */}
                        <td
                          style={{
                            padding: '0.95rem 1.25rem',
                            verticalAlign: 'middle',
                            textAlign: 'right',
                            position: 'relative',
                            zIndex: isOpen ? 1001 : 1,
                          }}
                        >
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              className="action-dots-btn"
                              onClick={() => setActiveDropdownId(isOpen ? null : staff.id)}
                              aria-label="Actions"
                              style={{ boxShadow: 'none' }}
                            >
                              ···
                            </button>

                            {isOpen && (
                              <>
                                <div
                                  onClick={() => setActiveDropdownId(null)}
                                  style={{
                                    position: 'fixed',
                                    inset: 0,
                                    zIndex: 9998,
                                    background: 'transparent',
                                  }}
                                />
                                <div
                                  className="action-popup-menu"
                                  style={{
                                    zIndex: 9999,
                                    position: 'absolute',
                                    right: 0,
                                    top: 'calc(100% + 6px)',
                                    boxShadow: 'none',
                                    border: '1px solid var(--border-color)',
                                  }}
                                >
                                  <button
                                    className="action-popup-item"
                                    onClick={() => handleToggleActive(staff)}
                                    style={{
                                      color: staff.is_active ? '#059669' : 'var(--text-muted)',
                                      fontFamily: kmFont,
                                    }}
                                  >
                                    {staff.is_active ? t('doc_inactive') : t('doc_active')}
                                  </button>
                                  <button
                                    className="action-popup-item"
                                    onClick={() => {
                                      setActiveDropdownId(null);
                                      handleOpenEdit(staff);
                                    }}
                                    style={{
                                      color: 'var(--text-main)',
                                      fontFamily: kmFont,
                                    }}
                                  >
                                    {t('doc_edit')}
                                  </button>
                                  <button
                                    className="action-popup-item"
                                    onClick={() => handleDeleteStaff(staff.id)}
                                    style={{
                                      color: '#dc2626',
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
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Invite / Edit Staff Modal */}
      {staffModal.shouldRender && (
        <div
          className={staffModal.overlayClass}
          style={{
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
            background: 'transparent',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) staffModal.close();
          }}
        >
          <div
            className={staffModal.cardClass}
            style={{
              width: '94%',
              maxWidth: '460px',
              fontFamily: kmFont,
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              boxShadow: 'none',
              background: '#ffffff',
              overflow: 'hidden',
            }}
          >
            <div className="responsive-modal-body" style={{ padding: '1.45rem 1.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.22rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                  {editingStaffId ? t('staff_modal_edit') : t('staff_modal_invite')}
                </h3>
                <button
                  onClick={staffModal.close}
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

              <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                {/* Profile Photo Upload in Modal (matching Doctor modal design) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', paddingBottom: '0.75rem' }}>
                  <div
                    onClick={() => modalPhotoInputRef.current?.click()}
                    style={{
                      width: '88px',
                      height: '88px',
                      borderRadius: '50%',
                      border: '1px dashed var(--border-color)',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: 'none',
                    }}
                    title={isKm ? 'ចុចដើម្បីប្តូររូបថត' : 'Click to change photo'}
                  >
                    {modalPhotoUrl ? (
                      <img
                        src={modalPhotoUrl}
                        alt="Staff Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: 'var(--text-muted)' }}>
                        <Camera size={24} color="var(--accent-primary)" />
                        <span style={{ fontSize: '0.82rem', fontFamily: kmFont }}>{isKm ? 'រូបថត' : 'Photo'}</span>
                      </div>
                    )}
                  </div>

                  {modalPhotoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveModalPhoto}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                        marginTop: '4px',
                        fontFamily: kmFont,
                        textDecoration: 'underline',
                      }}
                    >
                      {isKm ? 'លុបរូបចេញ' : 'Remove Photo'}
                    </button>
                  )}

                  <input
                    type="file"
                    ref={modalPhotoInputRef}
                    accept="image/*"
                    onChange={handleModalPhotoFileChange}
                    style={{ display: 'none' }}
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-main)', fontFamily: kmFont }}>
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
                      padding: '0.68rem 1.05rem',
                      border: nameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                      borderRadius: '22px',
                      fontSize: '0.94rem',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: kmFont,
                    }}
                  />
                  {nameError && (
                    <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '3px', paddingLeft: '0.5rem', fontFamily: kmFont }}>
                      {nameError}
                    </div>
                  )}
                </div>

                {/* Email or Phone */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-main)', fontFamily: kmFont }}>
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
                      padding: '0.68rem 1.05rem',
                      border: contactError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                      borderRadius: '22px',
                      fontSize: '0.94rem',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: kmFont,
                    }}
                  />
                  {contactError && (
                    <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '3px', paddingLeft: '0.5rem', fontFamily: kmFont }}>
                      {contactError}
                    </div>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-main)', fontFamily: kmFont }}>
                    {t('staff_assigned_role')}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.68rem 1.05rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '22px',
                      fontSize: '0.94rem',
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
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-main)', fontFamily: kmFont }}>
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
                          padding: '0.68rem 2.5rem 0.68rem 1.05rem',
                          border: passwordError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                          borderRadius: '22px',
                          fontSize: '0.94rem',
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
                          right: '12px',
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
                      <div style={{ color: '#dc2626', fontSize: '0.82rem', marginTop: '3px', paddingLeft: '0.5rem', fontFamily: kmFont }}>
                        {passwordError}
                      </div>
                    )}
                  </div>
                )}

                {/* Active Toggle (for edit) */}
                {editingStaffId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                    <input
                      type="checkbox"
                      id="staff-active-check"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="staff-active-check" style={{ fontSize: '0.88rem', color: 'var(--text-main)', cursor: 'pointer', fontFamily: kmFont }}>
                      {t('staff_active_account')}
                    </label>
                  </div>
                )}

                {/* Action Error */}
                {submitError && (
                  <div style={{ color: '#dc2626', fontSize: '0.82rem', paddingLeft: '0.5rem', fontFamily: kmFont }}>
                    {submitError}
                  </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={staffModal.close}
                    style={{
                      flex: 1,
                      padding: '0.68rem 1.15rem',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '22px',
                      color: 'var(--text-muted)',
                      fontSize: '0.94rem',
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
                      flex: 1,
                      padding: '0.68rem 1.15rem',
                      background: 'transparent',
                      border: '1px solid var(--text-main)',
                      borderRadius: '22px',
                      color: 'var(--text-main)',
                      fontSize: '0.94rem',
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
            background: 'transparent',
            backdropFilter: 'none',
            WebkitBackdropFilter: 'none',
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
              borderRadius: '24px',
              border: '1px solid var(--border-color)',
              maxWidth: '460px',
              width: '94%',
              padding: '1.45rem 1.6rem',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          >
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>
              {isKm ? 'បានបង្កើតគណនីបុគ្គលិកដោយជោគជ័យ' : 'Staff Account Created Successfully'}
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0 0 1.15rem 0', lineHeight: 1.5 }}>
              {isKm
                ? `ពាក្យសម្ងាត់បណ្តោះអាសន្នត្រូវបានបង្កើតដោយស្វ័យប្រវត្តិ និងផ្ញើទៅកាន់ ${invitedStaffInfo.contact} រួចហើយ។`
                : `A temporary password has been automatically generated and sent to ${invitedStaffInfo.contact}.`}
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem', marginBottom: '1.15rem' }}>
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
                <code style={{ flex: 1, padding: '0.55rem 0.85rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '22px', fontSize: '1.05rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-main)' }}>
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
                    padding: '0.55rem 1.1rem',
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '22px',
                    fontSize: '0.88rem',
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
                  width: '100%',
                  padding: '0.68rem 1.4rem',
                  background: 'transparent',
                  border: '1px solid var(--text-main)',
                  borderRadius: '22px',
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
