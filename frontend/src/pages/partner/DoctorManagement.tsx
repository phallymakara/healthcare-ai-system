import React, { useEffect, useState, useRef } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import { DoctorModal } from './doctors/DoctorModal';
import { DoctorScheduleModal } from './doctors/DoctorScheduleModal';
import { DoctorList } from './doctors/DoctorList';

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

  // Doctor Photo State
  const [docPhotoUrl, setDocPhotoUrl] = useState<string>('');
  const [docPhotoFile, setDocPhotoFile] = useState<File | null>(null);
  const [docUploadingPhoto, setDocUploadingPhoto] = useState(false);
  const [docPhotoError, setDocPhotoError] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);
  const [activeDropdownDocId, setActiveDropdownDocId] = useState<string | null>(null);

  // Inline Row Doctor Photo Upload
  const rowPhotoInputRef = useRef<HTMLInputElement>(null);
  const activeUploadDocIdRef = useRef<string | null>(null);
  const [rowUploadDocId, setRowUploadDocId] = useState<string | null>(null);
  const [rowUploadingDocId, setRowUploadingDocId] = useState<string | null>(null);
  const [rowUploadError, setRowUploadError] = useState<{ docId: string; message: string } | null>(null);
  const [hoveredAvatarDocId, setHoveredAvatarDocId] = useState<string | null>(null);

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

  const handleTriggerRowPhotoUpload = (docId: string) => {
    if (rowUploadingDocId) return;
    setRowUploadError(null);
    activeUploadDocIdRef.current = docId;
    setRowUploadDocId(docId);
    if (rowPhotoInputRef.current) {
      rowPhotoInputRef.current.value = '';
      rowPhotoInputRef.current.click();
    }
  };

  const handleRowPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetDocId = activeUploadDocIdRef.current || rowUploadDocId;
    if (!file || !targetDocId) return;

    if (file.size > 5 * 1024 * 1024) {
      setRowUploadError({
        docId: targetDocId,
        message: isKm ? 'ទំហំរូបភាពត្រូវតែតូចជាង 5MB' : 'Image size must be under 5MB',
      });
      return;
    }

    setRowUploadError(null);
    setRowUploadingDocId(targetDocId);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/partners/doctors/${targetDocId}/photo`, {
        method: 'POST',
        headers: AuthService.getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setDoctors(prev => prev.map(d => d.id === targetDocId ? { ...d, photo_url: data.url } : d));
      if (editingDocId === targetDocId) {
        setDocPhotoUrl(data.url);
      }
    } catch (err: any) {
      console.error('Failed to upload doctor photo from row:', err);
      setRowUploadError({
        docId: targetDocId,
        message: isKm ? 'មិនអាចផ្ទុករូបថតបានទេ។' : 'Failed to upload photo.',
      });
    } finally {
      setRowUploadingDocId(null);
      activeUploadDocIdRef.current = null;
      setRowUploadDocId(null);
    }
  };

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

  const handleToggleDay = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

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
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          type="button"
          onClick={handleOpenNewDoc}
          disabled={departments.length === 0}
          className="hospital-action-btn"
          style={{
            padding: '0.55rem 1.15rem',
            background: 'transparent',
            border: '1px solid var(--text-main)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-main)',
            fontSize: '0.875rem',
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
        <DoctorList
          doctors={doctors}
          departments={departments}
          activeDropdownDocId={activeDropdownDocId}
          setActiveDropdownDocId={setActiveDropdownDocId}
          hoveredAvatarDocId={hoveredAvatarDocId}
          setHoveredAvatarDocId={setHoveredAvatarDocId}
          rowUploadingDocId={rowUploadingDocId}
          rowUploadError={rowUploadError}
          onTriggerRowPhotoUpload={handleTriggerRowPhotoUpload}
          onRowPhotoFileChange={handleRowPhotoFileChange}
          rowPhotoInputRef={rowPhotoInputRef}
          onToggleAvailable={handleToggleAvailable}
          onEdit={handleOpenEditDoc}
          onOpenShifts={handleOpenShifts}
          onDelete={handleDeleteDoctor}
        />
      )}

      <DoctorModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        editingDocId={editingDocId}
        departments={departments}
        docDeptId={docDeptId}
        setDocDeptId={setDocDeptId}
        docFullName={docFullName}
        setDocFullName={setDocFullName}
        docSpecialty={docSpecialty}
        setDocSpecialty={setDocSpecialty}
        docRoom={docRoom}
        setDocRoom={setDocRoom}
        docLicense={docLicense}
        setDocLicense={setDocLicense}
        docMinutes={docMinutes}
        setDocMinutes={setDocMinutes}
        docPhotoUrl={docPhotoUrl}
        docUploadingPhoto={docUploadingPhoto}
        docPhotoError={docPhotoError}
        docNameError={docNameError}
        docSpecialtyError={docSpecialtyError}
        docDeptError={docDeptError}
        docSubmitError={docSubmitError}
        docLoading={docLoading}
        onPhotoFileChange={handlePhotoFileChange}
        onDeletePhoto={handleDeleteDocPhoto}
        onSave={handleSaveDoctor}
      />

      <DoctorScheduleModal
        isOpen={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        activeShiftDoc={activeShiftDoc}
        selectedDays={selectedDays}
        onToggleDay={handleToggleDay}
        shiftStartTime={shiftStartTime}
        setShiftStartTime={setShiftStartTime}
        shiftEndTime={shiftEndTime}
        setShiftEndTime={setShiftEndTime}
        shiftSubmitError={shiftSubmitError}
        shiftLoading={shiftLoading}
        onSave={handleSaveShifts}
      />
    </div>
  );
};
