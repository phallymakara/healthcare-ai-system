import React, { useEffect, useState, useRef } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import { Camera, RefreshCw, UserCheck } from 'lucide-react';

const DAY_DEFS = [
  { dayIndex: 0, labelKey: 'day_mon', fullKey: 'day_mon_full' },
  { dayIndex: 1, labelKey: 'day_tue', fullKey: 'day_tue_full' },
  { dayIndex: 2, labelKey: 'day_wed', fullKey: 'day_wed_full' },
  { dayIndex: 3, labelKey: 'day_thu', fullKey: 'day_thu_full' },
  { dayIndex: 4, labelKey: 'day_fri', fullKey: 'day_fri_full' },
  { dayIndex: 5, labelKey: 'day_sat', fullKey: 'day_sat_full' },
  { dayIndex: 6, labelKey: 'day_sun', fullKey: 'day_sun_full' },
];

export const DoctorManagement: React.FC = () => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Doctor Modal State
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docDeptId, setDocDeptId] = useState('');
  const [docFullName, setDocFullName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docRoom, setDocRoom] = useState('');
  const [docLicense, setDocLicense] = useState('');
  const [docMinutes, setDocMinutes] = useState(15);
  const [docIsAvailable, setDocIsAvailable] = useState(true);
  const [docIsActive, setDocIsActive] = useState(true);

  const [docNameError, setDocNameError] = useState<string | null>(null);
  const [docSpecialtyError, setDocSpecialtyError] = useState<string | null>(null);
  const [docDeptError, setDocDeptError] = useState<string | null>(null);
  const [docSubmitError, setDocSubmitError] = useState<string | null>(null);

  // Doctor Photo State (Azure Blob Storage)
  const [docPhotoUrl, setDocPhotoUrl] = useState<string>('');
  const [docPhotoFile, setDocPhotoFile] = useState<File | null>(null);
  const [docUploadingPhoto, setDocUploadingPhoto] = useState(false);
  const [docPhotoError, setDocPhotoError] = useState<string | null>(null);
  const docPhotoInputRef = useRef<HTMLInputElement>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [activeDropdownDocId, setActiveDropdownDocId] = useState<string | null>(null);

  // Manage Shifts Modal State
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [activeShiftDoc, setActiveShiftDoc] = useState<any | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [shiftStartTime, setShiftStartTime] = useState('08:00');
  const [shiftEndTime, setShiftEndTime] = useState('17:00');
  const [shiftMaxPatients, setShiftMaxPatients] = useState(30);
  const [shiftSubmitError, setShiftSubmitError] = useState<string | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docRes, deptRes] = await Promise.all([
        fetch(`${API_BASE}/partners/doctors`, { headers: AuthService.getAuthHeaders() }),
        fetch(`${API_BASE}/partners/departments`, { headers: AuthService.getAuthHeaders() }),
      ]);
      if (docRes.ok) setDoctors(await docRes.json());
      if (deptRes.ok) setDepartments(await deptRes.json());
    } catch {
      // Ignore background fetch error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open New Doctor Modal
  const handleOpenNewDoc = () => {
    setEditingDocId(null);
    setDocDeptId(departments.length > 0 ? departments[0].id : '');
    setDocFullName('');
    setDocSpecialty('');
    setDocRoom('');
    setDocLicense('');
    setDocMinutes(15);
    setDocIsAvailable(true);
    setDocIsActive(true);
    setDocPhotoUrl('');
    setDocPhotoFile(null);
    setDocUploadingPhoto(false);
    setDocPhotoError(null);
    setDocNameError(null);
    setDocSpecialtyError(null);
    setDocDeptError(null);
    setDocSubmitError(null);
    setDocModalOpen(true);
  };

  // Open Edit Doctor Modal
  const handleOpenEditDoc = (doc: any) => {
    setEditingDocId(doc.id);
    setDocDeptId(doc.department_id);
    setDocFullName(doc.full_name);
    setDocSpecialty(doc.specialty);
    setDocRoom(doc.room_number || '');
    setDocLicense(doc.license_number || '');
    setDocMinutes(doc.avg_consultation_minutes || 15);
    setDocIsAvailable(doc.is_available ?? true);
    setDocIsActive(doc.is_active ?? true);
    setDocPhotoUrl(doc.photo_url || '');
    setDocPhotoFile(null);
    setDocUploadingPhoto(false);
    setDocPhotoError(null);
    setDocNameError(null);
    setDocSpecialtyError(null);
    setDocDeptError(null);
    setDocSubmitError(null);
    setDocModalOpen(true);
  };

  // Photo Upload & Deletion Handlers
  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setDocPhotoError(isKm ? 'ទំហំរូបភាពត្រូវតែតូចជាង 5MB' : 'Image size must be under 5MB');
      return;
    }

    setDocPhotoError(null);

    if (editingDocId) {
      setDocUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/partners/doctors/${editingDocId}/photo`, {
          method: 'POST',
          headers: AuthService.getAuthHeaders(),
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.detail || 'Failed to upload photo');
        }
        const data = await res.json();
        setDocPhotoUrl(data.url);
        setDoctors(prev => prev.map(d => d.id === editingDocId ? { ...d, photo_url: data.url } : d));
      } catch (err: any) {
        console.error('Doctor photo upload error:', err);
        setDocPhotoError(isKm ? 'មិនអាចផ្ទុករូបថតបានទេ។' : (err.message || 'Failed to upload photo.'));
      } finally {
        setDocUploadingPhoto(false);
      }
    } else {
      setDocPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteDocPhoto = async () => {
    setDocPhotoError(null);
    if (editingDocId && docPhotoUrl) {
      setDocUploadingPhoto(true);
      try {
        const res = await fetch(`${API_BASE}/partners/doctors/${editingDocId}/photo`, {
          method: 'DELETE',
          headers: AuthService.getAuthHeaders(),
        });
        if (res.ok) {
          setDocPhotoUrl('');
          setDocPhotoFile(null);
          setDoctors(prev => prev.map(d => d.id === editingDocId ? { ...d, photo_url: null } : d));
        } else {
          throw new Error('Failed to delete doctor photo');
        }
      } catch (err: any) {
        console.error('Doctor photo delete error:', err);
        setDocPhotoError(isKm ? 'មិនអាចលុបរូបថតបានទេ។' : 'Failed to delete photo.');
      } finally {
        setDocUploadingPhoto(false);
      }
    } else {
      setDocPhotoUrl('');
      setDocPhotoFile(null);
    }
  };

  // Save Doctor Profile (Create or Update)
  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocNameError(null);
    setDocSpecialtyError(null);
    setDocDeptError(null);
    setDocSubmitError(null);

    let hasError = false;
    const finalDeptId = docDeptId || (departments.length > 0 ? departments[0].id : '');
    if (!finalDeptId) {
      setDocDeptError(t('doc_err_dept'));
      hasError = true;
    }
    if (!docFullName.trim()) {
      setDocNameError(t('doc_err_name'));
      hasError = true;
    }
    if (!docSpecialty.trim()) {
      setDocSpecialtyError(t('doc_err_specialty'));
      hasError = true;
    }
    if (hasError) return;

    setDocLoading(true);
    try {
      const isEdit = !!editingDocId;
      const url = isEdit
        ? `${API_BASE}/partners/doctors/${editingDocId}`
        : `${API_BASE}/partners/doctors`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({
          department_id: finalDeptId,
          full_name: docFullName.trim(),
          specialty: docSpecialty.trim(),
          room_number: docRoom.trim() || undefined,
          license_number: docLicense.trim() || undefined,
          avg_consultation_minutes: Math.max(1, Number(docMinutes) || 15),
          is_available: docIsAvailable,
          is_active: docIsActive,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        console.error('Doctor save error:', res.status, errData);
        let msg = t('doc_err_save');
        if (errData?.detail) {
          if (Array.isArray(errData.detail)) {
            msg = errData.detail.map((d: any) => `${d.loc?.slice(-1)[0] || 'Field'}: ${d.msg}`).join(', ');
          } else if (typeof errData.detail === 'string') {
            msg = errData.detail;
          }
        }
        setDocSubmitError(msg);
        return;
      }

      const savedDoc = await res.json();
      const targetDocId = editingDocId || savedDoc.id;

      // If pending photo was selected for new doctor, upload it now
      if (docPhotoFile && targetDocId) {
        const formData = new FormData();
        formData.append('file', docPhotoFile);
        await fetch(`${API_BASE}/partners/doctors/${targetDocId}/photo`, {
          method: 'POST',
          headers: AuthService.getAuthHeaders(),
          body: formData,
        }).catch((e) => console.error('Failed to upload doctor photo:', e));
      }

      setDocModalOpen(false);
      await loadData();
    } catch {
      setDocSubmitError(t('doc_err_conn'));
    } finally {
      setDocLoading(false);
    }
  };

  // Toggle Doctor Active / Available Status
  const handleToggleAvailable = async (doc: any) => {
    setActiveDropdownDocId(null);
    try {
      await fetch(`${API_BASE}/partners/doctors/${doc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({ is_available: !doc.is_available }),
      });
      await loadData();
    } catch {
      // Ignore background error
    }
  };

  // Delete Doctor
  const handleDeleteDoctor = async (docId: string) => {
    setActiveDropdownDocId(null);
    try {
      await fetch(`${API_BASE}/partners/doctors/${docId}`, {
        method: 'DELETE',
        headers: AuthService.getAuthHeaders(),
      });
      await loadData();
    } catch {
      // Ignore background error
    }
  };

  // Open Manage Shifts Modal
  const handleOpenShifts = (doc: any) => {
    setActiveShiftDoc(doc);
    const existingDays = (doc.schedules || []).map((s: any) => s.day_of_week);
    setSelectedDays(existingDays);

    if (doc.schedules && doc.schedules.length > 0) {
      const first = doc.schedules[0];
      setShiftStartTime(first.start_time ? String(first.start_time).slice(0, 5) : '08:00');
      setShiftEndTime(first.end_time ? String(first.end_time).slice(0, 5) : '17:00');
      setShiftMaxPatients(first.max_patients_per_slot || 30);
    } else {
      setShiftStartTime('08:00');
      setShiftEndTime('17:00');
      setShiftMaxPatients(30);
    }

    setShiftSubmitError(null);
    setShiftModalOpen(true);
  };

  // Toggle Day selection
  const handleToggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  // Save Shifts
  const handleSaveShifts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShiftDoc) return;
    setShiftSubmitError(null);

    setShiftLoading(true);
    try {
      const payload = {
        schedules: selectedDays.map((dayIndex) => ({
          day_of_week: dayIndex,
          start_time: shiftStartTime.length === 5 ? `${shiftStartTime}:00` : shiftStartTime,
          end_time: shiftEndTime.length === 5 ? `${shiftEndTime}:00` : shiftEndTime,
          max_patients_per_slot: Number(shiftMaxPatients) || 30,
          is_active: true,
        })),
      };

      const res = await fetch(`${API_BASE}/partners/doctors/${activeShiftDoc.id}/schedules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setShiftSubmitError(t('doc_shift_err_save'));
        return;
      }

      setShiftModalOpen(false);
      await loadData();
    } catch {
      setShiftSubmitError(t('doc_shift_err_conn'));
    } finally {
      setShiftLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', fontFamily: kmFont }}>
      {/* Top Controls: + Add Doctor aligned to the left */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          onClick={handleOpenNewDoc}
          disabled={departments.length === 0}
          style={{
            padding: '0.65rem 1.25rem',
            background: 'transparent',
            border: '1px solid var(--text-main)',
            borderRadius: '4px',
            color: 'var(--text-main)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: departments.length === 0 ? 'not-allowed' : 'pointer',
            opacity: departments.length === 0 ? 0.5 : 1,
            boxShadow: 'none',
            fontFamily: kmFont,
          }}
        >
          {t('doc_add_btn')}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '1.1rem', fontFamily: kmFont }}>
          {t('doc_loading')}
        </div>
      ) : (
        /* Doctor Rows Layout */
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          overflow: 'visible',
          boxShadow: 'none',
        }}>
          {doctors.length === 0 ? (
            <div style={{
              minHeight: '60vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '3rem 2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              lineHeight: 1.7,
              fontFamily: kmFont,
            }}>
              <div style={{ maxWidth: '520px' }}>
                {t('doc_no_doctors')}
              </div>
            </div>
          ) : (
            doctors.map((doc, idx) => {
              const deptObj = departments.find((d) => d.id === doc.department_id);
              const scheduleDays = (doc.schedules || []).map((s: any) => s.day_of_week);

              return (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    padding: '0.65rem 1.25rem',
                    borderBottom: idx === doctors.length - 1 ? 'none' : '1px solid var(--border-color)',
                    background: '#ffffff',
                    position: 'relative',
                    zIndex: activeDropdownDocId === doc.id ? 50 : 1,
                    borderTopLeftRadius: idx === 0 ? '6px' : 0,
                    borderTopRightRadius: idx === 0 ? '6px' : 0,
                    borderBottomLeftRadius: idx === doctors.length - 1 ? '6px' : 0,
                    borderBottomRightRadius: idx === doctors.length - 1 ? '6px' : 0,
                  }}
                >
                  {/* Doctor Info Column with Avatar */}
                  <div style={{ minWidth: '260px', flex: '1.5', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      background: '#f8fafc',
                    }}>
                      {doc.photo_url ? (
                        <img
                          src={doc.photo_url}
                          alt={doc.full_name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <UserCheck size={20} color="var(--accent-primary)" />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.28rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont, lineHeight: 1.25 }}>
                        {doc.full_name}
                      </div>
                      <div style={{ fontSize: '1.02rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                        {deptObj ? deptObj.name : t('doc_general')} • {doc.specialty}
                      </div>
                    </div>
                  </div>

                  {/* Station Column */}
                  <div style={{ minWidth: '180px', flex: '1' }}>
                    <div style={{ fontSize: '1.12rem', color: 'var(--text-main)', fontWeight: 600, fontFamily: kmFont, lineHeight: 1.25 }}>
                      {doc.room_number || t('doc_general_outpatient')}
                    </div>
                  </div>

                  {/* Weekly Working Days Column */}
                  <div style={{ minWidth: '240px', flex: '1.2' }}>
                    <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px', fontFamily: kmFont }}>
                      {t('doc_weekly_working_days')}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {DAY_DEFS.map((day) => {
                        const isScheduled = scheduleDays.includes(day.dayIndex);
                        return (
                          <span
                            key={day.dayIndex}
                            style={{
                              padding: '0.15rem 0.45rem',
                              border: isScheduled ? '1px solid var(--text-main)' : '1px solid var(--border-color)',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              fontWeight: isScheduled ? 600 : 400,
                              color: isScheduled ? 'var(--text-main)' : 'var(--text-muted)',
                              background: 'transparent',
                              fontFamily: kmFont,
                            }}
                          >
                            {t(day.labelKey)}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Column: Three-dot dropdown menu */}
                  <div style={{ position: 'relative', zIndex: activeDropdownDocId === doc.id ? 60 : 'auto' }}>
                    <button
                      onClick={() => setActiveDropdownDocId(activeDropdownDocId === doc.id ? null : doc.id)}
                      style={{
                        padding: '0.2rem 0.75rem',
                        fontSize: '1.2rem',
                        fontWeight: 700,
                        letterSpacing: '1px',
                        background: 'transparent',
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

                    {activeDropdownDocId === doc.id && (
                      <>
                        <div
                          onClick={() => setActiveDropdownDocId(null)}
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
                          minWidth: '150px',
                          zIndex: 100,
                          boxShadow: 'none',
                          overflow: 'hidden',
                        }}>
                        <button
                          onClick={() => handleToggleAvailable(doc)}
                          style={{
                            padding: '0.65rem 0.95rem',
                            fontSize: '0.95rem',
                            fontWeight: 500,
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--border-color)',
                            color: doc.is_available ? '#059669' : 'var(--text-muted)',
                            cursor: 'pointer',
                            boxShadow: 'none',
                            fontFamily: kmFont,
                          }}
                        >
                          {doc.is_available ? t('doc_active') : t('doc_inactive')}
                        </button>
                        <button
                          onClick={() => {
                            setActiveDropdownDocId(null);
                            handleOpenEditDoc(doc);
                          }}
                          style={{
                            padding: '0.65rem 0.95rem',
                            fontSize: '0.95rem',
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
                          onClick={() => {
                            setActiveDropdownDocId(null);
                            handleOpenShifts(doc);
                          }}
                          style={{
                            padding: '0.65rem 0.95rem',
                            fontSize: '0.95rem',
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
                          {t('doc_manage_shifts')}
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doc.id)}
                          style={{
                            padding: '0.65rem 0.95rem',
                            fontSize: '0.95rem',
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
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {docModalOpen && (
        <div className="responsive-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDocModalOpen(false); }}>
          <div className="responsive-modal-card" style={{ maxWidth: '520px', fontFamily: kmFont }}>
            <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 1.35rem 0', color: 'var(--text-main)', fontFamily: kmFont }}>
                {editingDocId ? t('doc_modal_edit_title') : t('doc_modal_add_title')}
              </h3>

            <form onSubmit={handleSaveDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Doctor Avatar Picker (Azure Blob Storage) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="file"
                  ref={docPhotoInputRef}
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  style={{ display: 'none' }}
                />
                <div
                  onClick={() => !docUploadingPhoto && docPhotoInputRef.current?.click()}
                  style={{
                    width: '74px',
                    height: '74px',
                    borderRadius: '50%',
                    border: '1px dashed var(--border-color)',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: docUploadingPhoto ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: 'none',
                    opacity: docUploadingPhoto ? 0.6 : 1,
                  }}
                  title={isKm ? 'ចុចដើម្បីប្តូររូបថត' : 'Click to change photo'}
                >
                  {docUploadingPhoto ? (
                    <RefreshCw size={20} className="spin" color="var(--accent-primary)" />
                  ) : docPhotoUrl ? (
                    <img
                      src={docPhotoUrl}
                      alt="Doctor Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', color: 'var(--text-muted)' }}>
                      <Camera size={22} color="var(--accent-primary)" />
                      <span style={{ fontSize: '0.75rem', fontFamily: kmFont }}>{isKm ? 'រូបថត' : 'Photo'}</span>
                    </div>
                  )}
                </div>

                {docPhotoUrl && (
                  <button
                    type="button"
                    onClick={handleDeleteDocPhoto}
                    disabled={docUploadingPhoto}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      fontSize: '0.88rem',
                      cursor: docUploadingPhoto ? 'not-allowed' : 'pointer',
                      marginTop: '4px',
                      fontFamily: kmFont,
                      textDecoration: 'underline',
                    }}
                  >
                    {isKm ? 'លុបរូបចេញ' : 'Remove Photo'}
                  </button>
                )}

                {docPhotoError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '4px', fontFamily: kmFont }}>
                    {docPhotoError}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                  {t('doc_dept_label')}
                </label>
                <select
                  value={docDeptId}
                  onChange={(e) => {
                    setDocDeptId(e.target.value);
                    if (docDeptError) setDocDeptError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.98rem',
                    borderRadius: '4px',
                    border: docDeptError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    background: '#ffffff',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code || 'DEPT'})
                    </option>
                  ))}
                </select>
                {docDeptError && (
                  <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
                    {docDeptError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                  {t('doc_name_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('doc_name_placeholder')}
                  value={docFullName}
                  onChange={(e) => {
                    setDocFullName(e.target.value);
                    if (docNameError) setDocNameError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.98rem',
                    borderRadius: '4px',
                    border: docNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
                {docNameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
                    {docNameError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                  {t('doc_specialty_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('doc_specialty_placeholder')}
                  value={docSpecialty}
                  onChange={(e) => {
                    setDocSpecialty(e.target.value);
                    if (docSpecialtyError) setDocSpecialtyError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.98rem',
                    borderRadius: '4px',
                    border: docSpecialtyError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
                {docSpecialtyError && (
                  <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
                    {docSpecialtyError}
                  </div>
                )}
              </div>



              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                  {t('doc_license_label')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. MED-CAM-8890"
                  value={docLicense}
                  onChange={(e) => setDocLicense(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.98rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
              </div>


              {docSubmitError && (
                <div style={{ color: '#dc2626', fontSize: '0.88rem', fontFamily: kmFont }}>
                  {docSubmitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.7rem 1.15rem',
                    fontSize: '1rem',
                    fontWeight: 500,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={docLoading}
                  style={{
                    flex: 1,
                    padding: '0.7rem 1.15rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {editingDocId ? t('doc_btn_save') : t('doc_btn_create')}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Manage Shifts Modal */}
      {shiftModalOpen && activeShiftDoc && (
        <div className="responsive-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShiftModalOpen(false); }}>
          <div className="responsive-modal-card" style={{ maxWidth: '520px', fontFamily: kmFont }}>
            <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)', fontFamily: kmFont }}>
                {t('doc_shifts_modal_title')}
              </h3>
            <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1.35rem', fontFamily: kmFont }}>
              {activeShiftDoc.full_name} ({activeShiftDoc.specialty})
            </div>

            <form onSubmit={handleSaveShifts} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', fontFamily: kmFont }}>
                  {t('doc_shift_days_label')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.55rem' }}>
                  {DAY_DEFS.map((day) => {
                    const checked = selectedDays.includes(day.dayIndex);
                    return (
                      <button
                        type="button"
                        key={day.dayIndex}
                        onClick={() => handleToggleDay(day.dayIndex)}
                        style={{
                          padding: '0.6rem 0.4rem',
                          fontSize: '0.92rem',
                          fontWeight: checked ? 600 : 400,
                          background: 'transparent',
                          border: checked ? '1px solid var(--text-main)' : '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: checked ? 'var(--text-main)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          fontFamily: kmFont,
                        }}
                      >
                        {t(day.fullKey)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                    {t('doc_shift_start')}
                  </label>
                  <input
                    type="time"
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.98rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: kmFont,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                    {t('doc_shift_end')}
                  </label>
                  <input
                    type="time"
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.98rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: kmFont,
                    }}
                  />
                </div>
              </div>


              {shiftSubmitError && (
                <div style={{ color: '#dc2626', fontSize: '0.88rem', fontFamily: kmFont }}>
                  {shiftSubmitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setShiftModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.7rem 1.15rem',
                    fontSize: '1rem',
                    fontWeight: 500,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={shiftLoading}
                  style={{
                    flex: 1,
                    padding: '0.7rem 1.15rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {t('doc_save_shifts')}
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
