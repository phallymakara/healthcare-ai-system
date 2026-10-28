import React, { useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { formatFacilityName, formatDepartmentName } from '../../../i18n/formatters';
import { AppointmentSlotPicker } from '../../../components/AppointmentSlotPicker';
import { useModalClose } from '../../../hooks/useModalClose';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHospital: any;
  selectedDept: any;
  setSelectedDept: (dept: any) => void;
  selectedService: any;
  setSelectedService: (service: any) => void;
  deptError?: string | null;
  setDeptError?: (val: string | null) => void;
  patientName: string;
  setPatientName: (val: string) => void;
  nameError: string | null;
  setNameError: (val: string | null) => void;
  patientPhone: string;
  setPatientPhone: (val: string) => void;
  phoneError: string | null;
  setPhoneError: (val: string | null) => void;
  appointmentDate: string;
  setAppointmentDate: (val: string) => void;
  dateError: string | null;
  setDateError: (val: string | null) => void;
  appointmentTime: string;
  setAppointmentTime: (val: string) => void;
  bookingLoading: boolean;
  formError: string | null;
  setFormError: (val: string | null) => void;
  onConfirmBooking: (e: React.FormEvent) => void;
  getTodayDateStr: () => string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  selectedHospital,
  selectedDept,
  setSelectedDept,
  selectedService,
  setSelectedService,
  deptError,
  setDeptError,
  patientName,
  setPatientName,
  nameError,
  setNameError,
  patientPhone,
  setPatientPhone,
  phoneError,
  setPhoneError,
  appointmentDate,
  setAppointmentDate,
  dateError,
  setDateError,
  appointmentTime,
  setAppointmentTime,
  bookingLoading,
  formError,
  setFormError,
  onConfirmBooking,
  getTodayDateStr,
}) => {
  const { language, t } = useLanguage();
  const kmFont = language === 'km' ? 'var(--font-khmer)' : 'inherit';

  const modal = useModalClose(isOpen, (open) => {
    if (!open) onClose();
  });

  const availableServices = useMemo(() => {
    const srvs = selectedHospital?.services || [];
    if (!selectedDept?.id) return srvs;
    return srvs.filter((s: any) => !s.department_id || s.department_id === selectedDept.id);
  }, [selectedHospital?.services, selectedDept?.id]);

  if (!modal.shouldRender || !selectedHospital) return null;

  return (
    <div className={modal.overlayClass} onClick={(e) => { if (e.target === e.currentTarget) modal.close(); }}>
      <div className={modal.cardClass} style={{ maxWidth: '540px', fontFamily: kmFont }}>
        <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
              {t('confirm_booking')}
            </h3>
            <button
              type="button"
              onClick={modal.close}
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

          <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontFamily: kmFont }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {formatFacilityName(selectedHospital.name, language)}
            </span>
            {selectedDept?.name && (
              <span> • {formatDepartmentName(selectedDept.name, language)} {selectedDept.code ? `(${selectedDept.code})` : ''}</span>
            )}
          </div>

          <form onSubmit={onConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Department Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                {language === 'km' ? 'ផ្នែកពិគ្រោះជំងឺ' : 'Clinical Department'} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={selectedDept?.id || ''}
                onChange={(e) => {
                  const dept = (selectedHospital.departments || []).find((d: any) => d.id === e.target.value) || null;
                  setSelectedDept(dept);
                  if (setDeptError) setDeptError(null);
                  if (formError) setFormError(null);
                }}
                style={{
                  width: '100%',
                  padding: '0.72rem 0.85rem',
                  border: deptError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '0.95rem',
                  background: '#ffffff',
                  color: 'var(--text-main)',
                  outline: 'none',
                  boxShadow: 'none',
                  boxSizing: 'border-box',
                  fontFamily: kmFont,
                }}
              >
                <option value="">{language === 'km' ? '-- ជ្រើសរើសផ្នែកពិគ្រោះជំងឺ --' : '-- Select Department --'}</option>
                {(selectedHospital.departments || []).map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {formatDepartmentName(d.name, language)} {d.code ? `(${d.code})` : ''}
                  </option>
                ))}
              </select>
              {deptError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                  {deptError}
                </div>
              )}
            </div>

            {/* Medical Service Selection (Optional) */}
            {(selectedHospital.services && selectedHospital.services.length > 0) && (
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                  {language === 'km' ? 'សេវាកម្មវេជ្ជសាស្ត្រ' : 'Medical Service'}{' '}
                  <span style={{ fontSize: '0.82rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                    ({language === 'km' ? 'ស្រេចចិត្ត' : 'Optional'})
                  </span>
                </label>
                <select
                  value={selectedService?.id || ''}
                  onChange={(e) => {
                    const srv = (selectedHospital.services || []).find((s: any) => s.id === e.target.value) || null;
                    setSelectedService(srv);
                    if (srv?.department_id && (!selectedDept || selectedDept.id !== srv.department_id)) {
                      const d = (selectedHospital.departments || []).find((dept: any) => dept.id === srv.department_id);
                      if (d) {
                        setSelectedDept(d);
                        if (setDeptError) setDeptError(null);
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    background: '#ffffff',
                    color: 'var(--text-main)',
                    outline: 'none',
                    boxShadow: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                >
                  <option value="">{language === 'km' ? '-- ការពិគ្រោះជំងឺទូទៅ / តម្រង់ជួរ --' : '-- General Consultation / Standard Queue --'}</option>
                  {availableServices.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.price > 0 ? `($${Number(s.price).toFixed(2)})` : `(${language === 'km' ? 'ឥតគិតថ្លៃ' : 'Free'})`} - {s.duration_minutes || 20} {language === 'km' ? 'នាទី' : 'mins'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Patient Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                {t('patient_full_name')} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                placeholder={language === 'km' ? 'បញ្ចូលឈ្មោះពេញ' : 'Enter full name'}
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  setNameError(null);
                }}
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

            {/* Phone Number */}
            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                {t('phone_number')} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                placeholder={language === 'km' ? 'បញ្ចូលលេខទូរស័ព្ទ' : 'Enter phone number'}
                value={patientPhone}
                onChange={(e) => {
                  setPatientPhone(e.target.value);
                  setPhoneError(null);
                }}
                style={{
                  width: '100%',
                  padding: '0.72rem 0.85rem',
                  border: phoneError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontSize: '0.95rem',
                  boxShadow: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: kmFont,
                }}
              />
              {phoneError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                  {phoneError}
                </div>
              )}
            </div>

            {/* Appointment Date & Slot Picker */}
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                  {t('appointment_date')} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="date"
                  min={getTodayDateStr()}
                  value={appointmentDate}
                  onChange={(e) => {
                    setAppointmentDate(e.target.value);
                    setDateError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    border: dateError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.95rem',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    color: 'var(--text-main)',
                    fontFamily: kmFont,
                  }}
                />
                {dateError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                    {dateError}
                  </div>
                )}
              </div>

              {/* Real-time Live Appointment Time Slot Grid */}
              {selectedDept?.id ? (
                <AppointmentSlotPicker
                  hospitalId={selectedHospital?.id}
                  departmentId={selectedDept?.id}
                  selectedDate={appointmentDate}
                  selectedSlot={appointmentTime}
                  onSelectSlot={(slot) => {
                    setAppointmentTime(slot);
                    if (formError) setFormError(null);
                  }}
                  onSlotError={(err) => setFormError(err)}
                />
              ) : (
                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontFamily: kmFont, padding: '0.5rem 0' }}>
                  {language === 'km' ? 'សូមជ្រើសរើសផ្នែកពិគ្រោះជំងឺដើម្បីពិនិត្យម៉ោងទំនេរ' : 'Please select a clinical department above to view available time slots.'}
                </div>
              )}
            </div>

            {formError && (
              <div style={{ color: '#dc2626', fontSize: '0.85rem', fontFamily: kmFont }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={modal.close}
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
                disabled={bookingLoading}
                style={{
                  padding: '0.75rem 1.45rem',
                  background: 'transparent',
                  border: '1px solid var(--text-main)',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  fontSize: '0.98rem',
                  fontWeight: 600,
                  cursor: bookingLoading ? 'not-allowed' : 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                {bookingLoading ? t('chat_booking_saving') : t('confirm')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
