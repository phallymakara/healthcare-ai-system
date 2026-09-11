import React from 'react';
import {
  Clock,
  MapPin,
  CalendarPlus,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  formatFacilityName,
  formatDepartmentName,
  formatDoctorName,
  formatSpecialty,
} from '../../../i18n/formatters';
import { BookedTicket, getTicketMapUrl, computeTimingInfo } from './types';

interface TicketDetailPassProps {
  activeTicket: BookedTicket;
  actionNotice: string | null;
  actionError: string | null;
  actionLoading: boolean;
  onBack: () => void;
  onRequestCancel: () => void;
}

export const TicketDetailPass: React.FC<TicketDetailPassProps> = ({
  activeTicket,
  actionNotice,
  actionError,
  actionLoading,
  onBack,
  onRequestCancel,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer), sans-serif' : 'inherit';

  const formatRoom = (room?: string) => {
    if (!room) return '';
    const cleanNum = room.replace(/^(room|បន្ទប់)\s*/i, '').trim();
    return isKm ? `បន្ទប់ ${cleanNum}` : `Room ${cleanNum}`;
  };

  const timingInfo = computeTimingInfo(activeTicket, isKm);

  const handleAddToCalendar = () => {
    const title = `${activeTicket.hospital_name || 'Clinic'} Appointment - ${activeTicket.ticket_number}`;
    const description = `Doctor: ${activeTicket.doctor_name || 'Assigned Doctor'}\nDepartment: ${activeTicket.department_name || 'General'}\nRoom: ${activeTicket.room_number || 'Consultation Desk'}\nTicket: ${activeTicket.ticket_number}`;
    const location = activeTicket.hospital_address || activeTicket.hospital_name || 'Medical Clinic';

    const dateStr = activeTicket.appointment_date || new Date().toISOString().split('T')[0];
    let startIso = `${dateStr.replace(/-/g, '')}T090000Z`;
    let endIso = `${dateStr.replace(/-/g, '')}T100000Z`;

    if (activeTicket.appointment_time) {
      const parts = activeTicket.appointment_time.split('-');
      const startRaw = parts[0]?.trim();
      const endRaw = parts[1]?.trim();
      if (startRaw && startRaw.includes(':')) {
        const [timePart, meridiem] = startRaw.split(' ');
        let [h, m] = timePart.split(':').map(Number);
        if (meridiem?.toUpperCase() === 'PM' && h < 12) h += 12;
        if (meridiem?.toUpperCase() === 'AM' && h === 12) h = 0;
        const hStr = String(h).padStart(2, '0');
        const mStr = String(m || 0).padStart(2, '0');
        startIso = `${dateStr.replace(/-/g, '')}T${hStr}${mStr}00`;
      }
      if (endRaw && endRaw.includes(':')) {
        const [timePart, meridiem] = endRaw.split(' ');
        let [h, m] = timePart.split(':').map(Number);
        if (meridiem?.toUpperCase() === 'PM' && h < 12) h += 12;
        if (meridiem?.toUpperCase() === 'AM' && h === 12) h = 0;
        const hStr = String(h).padStart(2, '0');
        const mStr = String(m || 0).padStart(2, '0');
        endIso = `${dateStr.replace(/-/g, '')}T${hStr}${mStr}00`;
      }
    }

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(
      location
    )}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Healthcare AI//Appointment Pass//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${location}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `appointment-${activeTicket.ticket_number}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenDirections = () => {
    window.open(getTicketMapUrl(activeTicket), '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      {/* Top Back Navigation Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        <button
          onClick={onBack}
          className="btn-back-nav"
          style={{
            padding: '0.2rem 0',
            fontSize: '0.925rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'none',
            fontFamily: kmFont,
          }}
        >
          <span>{t('appt_back_to_list')}</span>
        </button>
      </div>

      {/* Active Scheduled Appointment Pass Card */}
      <div
        className="appointment-detail-animate"
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: 'none',
        }}
      >
        {/* Action Success / Error Notifications */}
        {actionNotice && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              color: '#16a34a',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: kmFont,
            }}
          >
            <CheckCircle2 size={18} />
            <span>{actionNotice}</span>
          </div>
        )}

        {actionError && (
          <div
            style={{
              padding: '0.75rem 1.5rem',
              color: '#dc2626',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: kmFont,
            }}
          >
            <AlertCircle size={18} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Card Top: Facility Identity & Ticket Status Header */}
        <div
          style={{
            padding: '1.5rem 1.75rem 0.85rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '240px' }}>
            <h3
              style={{
                margin: '0 0 0.2rem 0',
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: kmFont,
              }}
            >
              {formatFacilityName(activeTicket.hospital_name || 'Medical Facility', language)}
            </h3>
            <div
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-muted)',
                fontFamily: kmFont,
              }}
            >
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                {formatDepartmentName(activeTicket.department_name || '', language) || t('doc_general')}
              </span>
              {activeTicket.doctor_name && (
                <>
                  {' • '}
                  <span>{formatDoctorName(activeTicket.doctor_name, language)}</span>
                </>
              )}
              {activeTicket.room_number && (
                <>
                  {' • '}
                  <span>{formatRoom(activeTicket.room_number)}</span>
                </>
              )}
            </div>
          </div>

          {/* Ticket Code */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '0.04em',
              }}
            >
              #{activeTicket.ticket_number}
            </div>
          </div>
        </div>

        {/* Card Middle: Time Slot, Recommended Arrival & Countdown */}
        <div
          style={{
            padding: '0.85rem 1.75rem 1rem 1.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {/* Slot & Date */}
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
                fontFamily: kmFont,
              }}
            >
              <span>{t('appt_date_slot')}</span>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
              {activeTicket.appointment_date || '2026-09-15'}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.95rem',
                color: 'var(--text-muted)',
                marginTop: '3px',
                fontFamily: kmFont,
              }}
            >
              <Clock size={14} />
              <span>{activeTicket.appointment_time || '09:00 AM - 10:00 AM'}</span>
            </div>
          </div>

          {/* Recommended Arrival Window */}
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
                fontFamily: kmFont,
              }}
            >
              <span>{t('appt_recommended_arrival')}</span>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
              {timingInfo.recommendedArrival}
            </div>
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginTop: '3px',
                fontFamily: kmFont,
                lineHeight: 1.4,
              }}
            >
              {t('appt_arrival_tip')}
            </div>
          </div>

          {/* Attending Doctor Info */}
          <div>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
                fontFamily: kmFont,
              }}
            >
              <span>{t('appt_assigned_doctor')}</span>
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
              {activeTicket.doctor_name
                ? formatDoctorName(activeTicket.doctor_name, language)
                : (isKm ? 'វេជ្ជបណ្ឌិតជំនាញប្រចាំការ' : 'Assigned Physician')}
            </div>
            <div
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-muted)',
                marginTop: '3px',
                fontFamily: kmFont,
              }}
            >
              {formatSpecialty(activeTicket.doctor_specialty || '', language) ||
                formatDepartmentName(activeTicket.department_name || '', language) ||
                t('doc_general')}
            </div>
          </div>
        </div>

        {/* Pre-Visit Preparation Checklist */}
        <div style={{ padding: '0.85rem 1.75rem 1rem 1.75rem' }}>
          <div
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              marginBottom: '0.75rem',
              fontFamily: kmFont,
            }}
          >
            {t('appt_previsit_checklist')}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: kmFont }}>
              <Check size={16} color="var(--accent-primary)" />
              <span>{t('appt_prep_id_card')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: kmFont }}>
              <Check size={16} color="var(--accent-primary)" />
              <span>{t('appt_prep_records')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: kmFont }}>
              <Check size={16} color="var(--accent-primary)" />
              <span>{t('appt_prep_checkin')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: kmFont }}>
              <Check size={16} color="var(--accent-primary)" />
              <span>{t('appt_prep_symptoms')}</span>
            </div>
          </div>
        </div>

        {/* Patient Details & Clinic Location */}
        <div
          style={{
            padding: '0.85rem 1.75rem 1rem 1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.92rem',
            color: 'var(--text-muted)',
            fontFamily: kmFont,
          }}
        >
          <div>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t('patient')}: </span>
            <span>{activeTicket.patient_name}</span>
            {activeTicket.patient_phone && <span> • {activeTicket.patient_phone}</span>}
          </div>

          {activeTicket.hospital_address && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <MapPin size={15} color="var(--accent-primary)" />
              <span>{activeTicket.hospital_address}</span>
            </div>
          )}
        </div>

        {/* Card Bottom: Practical Patient Action Buttons */}
        <div
          style={{
            padding: '0.85rem 1.75rem 1.75rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleAddToCalendar}
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                cursor: 'pointer',
                boxShadow: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: kmFont,
              }}
            >
              <CalendarPlus size={15} color="var(--accent-primary)" />
              <span>{t('appt_add_to_calendar')}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenDirections}
              style={{
                padding: '0.45rem 0.95rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                cursor: 'pointer',
                boxShadow: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: kmFont,
              }}
            >
              <MapPin size={15} color="var(--accent-primary)" />
              <span>{t('appt_get_directions')}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {activeTicket.status !== 'CANCELLED' && activeTicket.status !== 'COMPLETED' && (
              <button
                type="button"
                onClick={onRequestCancel}
                disabled={actionLoading}
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: '#dc2626',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                {t('appt_cancel_btn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
