import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { API_BASE } from '../../services/api';

const DAYS = [
  { dayIndex: 0, label: 'Mon', full: 'Monday' },
  { dayIndex: 1, label: 'Tue', full: 'Tuesday' },
  { dayIndex: 2, label: 'Wed', full: 'Wednesday' },
  { dayIndex: 3, label: 'Thu', full: 'Thursday' },
  { dayIndex: 4, label: 'Fri', full: 'Friday' },
  { dayIndex: 5, label: 'Sat', full: 'Saturday' },
  { dayIndex: 6, label: 'Sun', full: 'Sunday' },
];

export const DoctorManagement: React.FC = () => {
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
    setDocNameError(null);
    setDocSpecialtyError(null);
    setDocDeptError(null);
    setDocSubmitError(null);
    setDocModalOpen(true);
  };

  // Save Doctor Profile (Create or Update)
  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocNameError(null);
    setDocSpecialtyError(null);
    setDocDeptError(null);
    setDocSubmitError(null);

    let hasError = false;
    if (!docDeptId) {
      setDocDeptError('Please select a department.');
      hasError = true;
    }
    if (!docFullName.trim()) {
      setDocNameError('Please enter the doctor full name.');
      hasError = true;
    }
    if (!docSpecialty.trim()) {
      setDocSpecialtyError('Please enter the medical specialty.');
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
          department_id: docDeptId,
          full_name: docFullName.trim(),
          specialty: docSpecialty.trim(),
          room_number: docRoom.trim() || undefined,
          license_number: docLicense.trim() || undefined,
          avg_consultation_minutes: Number(docMinutes) || 15,
          is_available: docIsAvailable,
          is_active: docIsActive,
        }),
      });

      if (!res.ok) {
        setDocSubmitError('Unable to save doctor profile. Please try again.');
        return;
      }

      setDocModalOpen(false);
      await loadData();
    } catch {
      setDocSubmitError('Connection issue saving doctor profile. Please try again.');
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
        setShiftSubmitError('Unable to save shift schedule. Please try again.');
        return;
      }

      setShiftModalOpen(false);
      await loadData();
    } catch {
      setShiftSubmitError('Connection issue saving shift schedule. Please try again.');
    } finally {
      setShiftLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Top Controls: + Add Doctor aligned to the left */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button
          onClick={handleOpenNewDoc}
          disabled={departments.length === 0}
          style={{
            padding: '0.55rem 1rem',
            background: 'transparent',
            border: '1px solid var(--text-main)',
            borderRadius: '4px',
            color: 'var(--text-main)',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: departments.length === 0 ? 'not-allowed' : 'pointer',
            opacity: departments.length === 0 ? 0.5 : 1,
            boxShadow: 'none',
          }}
        >
          + Add Doctor
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Loading doctors directory...
        </div>
      ) : (
        /* Doctor Rows Layout */
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: 'none',
        }}>
          {doctors.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
            }}>
              No doctors registered yet. Click + Add Doctor to add your first consultant.
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
                    padding: '1rem 1.25rem',
                    borderBottom: idx === doctors.length - 1 ? 'none' : '1px solid var(--border-color)',
                    background: '#ffffff',
                  }}
                >
                  {/* Doctor Info Column */}
                  <div style={{ minWidth: '240px', flex: '1.5' }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {doc.full_name}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {deptObj ? deptObj.name : 'General'}
                    </div>

                    {doc.license_number && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                        {doc.license_number}
                      </div>
                    )}
                  </div>

                  {/* Station & Consultation Pacing Column */}
                  <div style={{ minWidth: '180px', flex: '1' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Station & Pacing
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600, marginTop: '2px' }}>
                      {doc.room_number || 'General Outpatient'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ~{doc.avg_consultation_minutes} mins / visit
                    </div>
                  </div>

                  {/* Weekly Working Days Column */}
                  <div style={{ minWidth: '240px', flex: '1.2' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>
                      Weekly Working Days
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {DAYS.map((day) => {
                        const isScheduled = scheduleDays.includes(day.dayIndex);
                        return (
                          <span
                            key={day.label}
                            style={{
                              padding: '0.1rem 0.35rem',
                              border: isScheduled ? '1px solid var(--text-main)' : '1px solid var(--border-color)',
                              borderRadius: '3px',
                              fontSize: '0.7rem',
                              fontWeight: isScheduled ? 600 : 400,
                              color: isScheduled ? 'var(--text-main)' : 'var(--text-muted)',
                              background: 'transparent',
                            }}
                          >
                            {day.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions Column: Three-dot dropdown menu */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setActiveDropdownDocId(activeDropdownDocId === doc.id ? null : doc.id)}
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

                    {activeDropdownDocId === doc.id && (
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
                        zIndex: 50,
                        boxShadow: 'none',
                        overflow: 'hidden',
                      }}>
                        <button
                          onClick={() => handleToggleAvailable(doc)}
                          style={{
                            padding: '0.5rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            textAlign: 'left',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--border-color)',
                            color: doc.is_available ? '#059669' : 'var(--text-muted)',
                            cursor: 'pointer',
                            boxShadow: 'none',
                          }}
                        >
                          {doc.is_available ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => {
                            setActiveDropdownDocId(null);
                            handleOpenEditDoc(doc);
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
                          onClick={() => {
                            setActiveDropdownDocId(null);
                            handleOpenShifts(doc);
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
                          Manage Shifts
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doc.id)}
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
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Doctor Modal */}
      {docModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            padding: '1.5rem',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: 'none',
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: 'var(--text-main)' }}>
              {editingDocId ? 'Edit Doctor Profile' : 'Add Consultant Doctor'}
            </h3>

            <form onSubmit={handleSaveDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Department
                </label>
                <select
                  value={docDeptId}
                  onChange={(e) => {
                    setDocDeptId(e.target.value);
                    if (docDeptError) setDocDeptError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: docDeptError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    background: '#ffffff',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box',
                  }}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code || 'DEPT'})
                    </option>
                  ))}
                </select>
                {docDeptError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                    {docDeptError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Doctor Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Chea Sokha"
                  value={docFullName}
                  onChange={(e) => {
                    setDocFullName(e.target.value);
                    if (docNameError) setDocNameError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: docNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {docNameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                    {docNameError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Medical Specialty
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cardiologist, Pediatrician"
                  value={docSpecialty}
                  onChange={(e) => {
                    setDocSpecialty(e.target.value);
                    if (docSpecialtyError) setDocSpecialtyError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: docSpecialtyError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {docSpecialtyError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                    {docSpecialtyError}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Room / Counter #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 102"
                    value={docRoom}
                    onChange={(e) => setDocRoom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      fontSize: '0.875rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Avg Visit (Mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={docMinutes}
                    onChange={(e) => setDocMinutes(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      fontSize: '0.875rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Medical License Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. MED-CAM-8890"
                  value={docLicense}
                  onChange={(e) => setDocLicense(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="docAvailableCheck"
                  checked={docIsAvailable}
                  onChange={(e) => setDocIsAvailable(e.target.checked)}
                />
                <label htmlFor="docAvailableCheck" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Doctor is on duty and available for consultations
                </label>
              </div>

              {docSubmitError && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                  {docSubmitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={docLoading}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  {editingDocId ? 'Save Changes' : 'Create Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Shifts Modal */}
      {shiftModalOpen && activeShiftDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            padding: '1.5rem',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: 'none',
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-main)' }}>
              Manage Working Shifts
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              {activeShiftDoc.full_name} ({activeShiftDoc.specialty})
            </div>

            <form onSubmit={handleSaveShifts} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Weekly Shift Days
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {DAYS.map((day) => {
                    const checked = selectedDays.includes(day.dayIndex);
                    return (
                      <button
                        type="button"
                        key={day.dayIndex}
                        onClick={() => handleToggleDay(day.dayIndex)}
                        style={{
                          padding: '0.45rem',
                          fontSize: '0.8rem',
                          fontWeight: checked ? 600 : 400,
                          background: 'transparent',
                          border: checked ? '1px solid var(--text-main)' : '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: checked ? 'var(--text-main)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                        }}
                      >
                        {day.full}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Shift Start Time
                  </label>
                  <input
                    type="time"
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      fontSize: '0.875rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Shift End Time
                  </label>
                  <input
                    type="time"
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      fontSize: '0.875rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Max Patients Capacity Per Shift
                </label>
                <input
                  type="number"
                  min="1"
                  max="150"
                  value={shiftMaxPatients}
                  onChange={(e) => setShiftMaxPatients(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Maximum booking queue capacity for each scheduled working day.
                </div>
              </div>

              {shiftSubmitError && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                  {shiftSubmitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShiftModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shiftLoading}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  Save Shifts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
