import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { formatFacilityName, formatDepartmentName } from '../../../i18n/formatters';
import { AppointmentSlotPicker } from '../../../components/AppointmentSlotPicker';
import { useModalClose } from '../../../hooks/useModalClose';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHospital: any;
  selectedDept: any;
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

  if (!modal.shouldRender || !selectedHospital || !selectedDept) return null;

  return (
    <div className={modal.overlayClass} onClick={(e) => { if (e.target === e.currentTarget) modal.close(); }}>
      <div className={modal.cardClass} style={{ maxWidth: '520px', fontFamily: kmFont }}>
        <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
              {t('confirm_booking')}
            </h3>
            <button
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

          <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '1.35rem', fontFamily: kmFont }}>
            {formatFacilityName(selectedHospital.name, language)} • {formatDepartmentName(selectedDept.name, language)} ({selectedDept.code || 'DEPT'})
          </div>

          <form onSubmit={onConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                {t('patient_full_name')}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                {t('phone_number')}
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

            <div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)', fontFamily: kmFont }}>
                  {t('appointment_date')}
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
