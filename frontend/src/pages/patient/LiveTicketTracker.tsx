import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { AuthService } from '../../services/auth';
import { API_BASE } from '../../services/api';
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  CalendarPlus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
} from 'lucide-react';
import {
  formatFacilityName,
  formatDepartmentName,
  formatDoctorName,
  formatSpecialty,
} from '../../i18n/formatters';

export interface BookedTicket {
  id: string;
  ticket_number: string;
  queue_session_id?: string;
  hospital_id: string;
  hospital_name?: string;
  hospital_logo_url?: string;
  hospital_address?: string;
  hospital_phone?: string;
  hospital_latitude?: number;
  hospital_longitude?: number;
  department_id: string;
  department_name?: string;
  department_floor_room?: string;
  doctor_id?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  doctor_photo_url?: string;
  room_number?: string;
  service_id?: string;
  service_name?: string;
  patient_id?: string;
  patient_name: string;
  patient_phone?: string;
  ticket_source: string;
  status: 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | string;
  position?: number;
  estimated_wait_minutes?: number;
  appointment_date?: string;
  appointment_time?: string;
  called_at?: string;
  serving_started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

interface LiveTicketTrackerProps {
  initialTicketId?: string;
  onExploreHospitals?: () => void;
  onConsultAi?: () => void;
}

export const LiveTicketTracker: React.FC<LiveTicketTrackerProps> = ({
  initialTicketId,
  onExploreHospitals,
  onConsultAi,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer), sans-serif' : 'inherit';

  const [activeTicket, setActiveTicket] = useState<BookedTicket | null>(null);
  const [myTickets, setMyTickets] = useState<BookedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Load patient tickets or initial ticket
  const loadData = async (preferredTicketId?: string) => {
    setLoading(true);
    setActionError(null);
    try {
      const targetId = preferredTicketId || initialTicketId;
      let directTicket: BookedTicket | null = null;

      if (targetId) {
        try {
          const res = await fetch(`${API_BASE}/tickets/${targetId}`);
          if (res.ok) {
            directTicket = await res.json();
          }
        } catch {
          // Fallback to user tickets
        }
      }

      const currentUser = AuthService.getStoredUser();
      let userTickets: BookedTicket[] = [];
      if (currentUser) {
        try {
          const res = await fetch(`${API_BASE}/patients/my-tickets`, {
            headers: AuthService.getAuthHeaders(),
          });
          if (res.ok) {
            userTickets = await res.json();
            setMyTickets(userTickets);
          }
        } catch {
          // Graceful fallback
        }
      }

      if (directTicket) {
        setActiveTicket(directTicket);
      } else {
        setActiveTicket(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(initialTicketId);
  }, [initialTicketId]);

  // Guest / Walk-In Ticket Lookup by Code or Phone
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets/lookup/${encodeURIComponent(lookupQuery.trim())}`);
      if (!res.ok) {
        throw new Error('NotFound');
      }
      const ticket: BookedTicket = await res.json();
      setActiveTicket(ticket);
      setLookupQuery('');
    } catch {
      setLookupError(
        isKm
          ? 'រកមិនឃើញសំបុត្រណាត់ជួបដែលមានលេខកូដនេះទេ។ សូមពិនិត្យលេខកូដម្តងទៀត។'
          : 'Appointment ticket not found. Please double-check your ticket code or phone number.'
      );
    } finally {
      setLookupLoading(false);
    }
  };



  // Cancel Scheduled Booking Action
  const handleCancelBooking = async () => {
    if (!activeTicket || actionLoading) return;
    setActionLoading(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/${activeTicket.id}/cancel-booking`, {
        method: 'POST',
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveTicket(updated);
        setMyTickets((prev) => prev.map((tk) => (tk.id === updated.id ? updated : tk)));
        setShowCancelModal(false);
        setActionNotice(t('appt_cancel_success'));
      } else {
        throw new Error();
      }
    } catch {
      setActionError(
        isKm
          ? 'មិនអាចលុបចោលការណាត់បានទេ។ សូមព្យាយាមម្តងទៀត។'
          : 'Failed to cancel appointment. Please try again.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Clean Room Number Formatter for consistent display across languages
  const formatRoom = (room?: string) => {
    if (!room) return '';
    const cleanNum = room.replace(/^(room|បន្ទប់)\s*/i, '').trim();
    return isKm ? `បន្ទប់ ${cleanNum}` : `Room ${cleanNum}`;
  };

  // Compute Countdown & Arrival Window Advice
  const timingInfo = useMemo(() => {
    if (!activeTicket || !activeTicket.appointment_date) {
      return {
        countdownLabel: isKm ? 'មិនមានកាលបរិច្ឆេទ' : 'No Date',
        recommendedArrival: isKm ? 'មុន ១៥ នាទី' : '15 mins early',
        isToday: false,
        isPast: false,
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const apptDateStr = activeTicket.appointment_date;
    const isToday = apptDateStr === todayStr;

    const todayDate = new Date(todayStr + 'T00:00:00');
    const targetDate = new Date(apptDateStr + 'T00:00:00');
    const diffMs = targetDate.getTime() - todayDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let countdownLabel = '';
    let isPast = false;

    if (diffDays === 0) {
      countdownLabel = isKm ? 'ថ្ងៃនេះ' : 'Today';
    } else if (diffDays === 1) {
      countdownLabel = isKm ? 'ថ្ងៃស្អែក' : 'Tomorrow';
    } else if (diffDays > 1) {
      countdownLabel = isKm ? `នៅសល់ ${diffDays} ថ្ងៃទៀត` : `In ${diffDays} days`;
    } else {
      isPast = true;
      countdownLabel = isKm ? 'កាលបរិច្ឆេទបានកន្លងផុត' : 'Past Date';
    }

    let arrivalStr = '15 mins before slot';
    if (activeTicket.appointment_time) {
      const startTime = activeTicket.appointment_time.split('-')[0]?.trim();
      if (startTime) {
        arrivalStr = isKm ? `មុនម៉ោង ${startTime}` : `Before ${startTime}`;
      }
    }

    return { countdownLabel, recommendedArrival: arrivalStr, isToday, isPast };
  }, [activeTicket, isKm]);

  // "Add to Calendar" (.ics download & Google Calendar link)
  const handleAddToCalendar = () => {
    if (!activeTicket) return;

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

  // Google Maps Directions link computed from hospital location input
  const getTicketMapUrl = (ticket: BookedTicket) => {
    if (ticket.hospital_latitude && ticket.hospital_longitude) {
      return `https://maps.google.com/?q=${ticket.hospital_latitude},${ticket.hospital_longitude}`;
    }
    const query = ticket.hospital_address || ticket.hospital_name || 'Hospital';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  const handleOpenDirections = () => {
    if (!activeTicket) return;
    window.open(getTicketMapUrl(activeTicket), '_blank', 'noopener,noreferrer');
  };



  const getTicketTiming = (ticket: BookedTicket) => {
    if (!ticket.appointment_date) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const apptDateStr = ticket.appointment_date;
    const isToday = apptDateStr === todayStr;

    const todayDate = new Date(todayStr + 'T00:00:00');
    const targetDate = new Date(apptDateStr + 'T00:00:00');
    const diffMs = targetDate.getTime() - todayDate.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    let label = '';
    let isPast = false;

    if (diffDays === 0) {
      label = isKm ? 'ថ្ងៃនេះ' : 'Today';
    } else if (diffDays === 1) {
      label = isKm ? 'ថ្ងៃស្អែក' : 'Tomorrow';
    } else if (diffDays > 1) {
      label = isKm ? `នៅសល់ ${diffDays} ថ្ងៃទៀត` : `In ${diffDays} days`;
    } else {
      isPast = true;
      label = isKm ? 'កាលបរិច្ឆេទបានកន្លងផុត' : 'Past Date';
    }

    return { label, isToday, isPast };
  };



  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto', width: '100%', fontFamily: kmFont }}>
      {!activeTicket ? (
        /* ================= LIST VIEW: ALL APPOINTMENT ROWS ================= */
        <div>
          {/* Top Header & Guest Ticket Lookup Bar */}
          <div style={{ marginBottom: '1.6rem' }}>
            {/* Guest Ticket Lookup Form under header text with balanced width */}
            <form
              onSubmit={handleLookupSubmit}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: '620px',
              }}
            >
              <input
                type="text"
                className="input-search-rounded"
                placeholder={t('appt_lookup_placeholder')}
                value={lookupQuery}
                onChange={(e) => {
                  setLookupQuery(e.target.value);
                  setLookupError(null);
                }}
                style={{
                  width: '100%',
                  padding: '0.74rem 7.5rem 0.74rem 1.35rem',
                  fontSize: '0.94rem',
                  border: lookupError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  outline: 'none',
                  fontFamily: kmFont,
                  background: '#ffffff',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="btn btn-primary"
                style={{
                  position: 'absolute',
                  right: '5px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '0.52rem 1.15rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: lookupLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                {lookupLoading ? <RefreshCw size={15} className="spin" /> : <Search size={15} />}
                <span>{isKm ? 'ស្វែងរក' : 'Search'}</span>
              </button>
            </form>
          </div>

          {lookupError && (
            <span
              style={{
                display: 'block',
                fontSize: '0.9rem',
                color: '#dc2626',
                marginBottom: '1rem',
                fontFamily: kmFont,
              }}
            >
              {lookupError}
            </span>
          )}

          {/* Loading State */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4.5rem 1rem', color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              <RefreshCw size={26} className="spin" color="var(--accent-primary)" style={{ margin: '0 auto 0.85rem auto' }} />
              <div>{isKm ? 'កំពុងទាញយកព័ត៌មានការណាត់ជួប...' : 'Loading appointment details...'}</div>
            </div>
          ) : myTickets.length === 0 ? (
            /* Empty State: No active appointment scheduled */
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '3.5rem 2rem',
                textAlign: 'center',
                boxShadow: 'none',
              }}
            >
              <Calendar size={48} color="var(--text-muted)" style={{ margin: '0 auto 1.25rem auto' }} />
              <h3
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  margin: '0 0 0.6rem 0',
                  fontFamily: kmFont,
                }}
              >
                {t('appt_no_active_title')}
              </h3>
              <p
                style={{
                  fontSize: '1.02rem',
                  color: 'var(--text-muted)',
                  maxWidth: '560px',
                  margin: '0 auto 2rem auto',
                  lineHeight: 1.65,
                  fontFamily: kmFont,
                }}
              >
                {t('appt_no_active_desc')}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {onExploreHospitals && (
                  <button
                    onClick={onExploreHospitals}
                    style={{
                      padding: '0.65rem 1.45rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-full)',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      boxShadow: 'none',
                      fontFamily: kmFont,
                    }}
                  >
                    {t('appt_book_now')}
                  </button>
                )}
                {onConsultAi && (
                  <button
                    onClick={onConsultAi}
                    style={{
                      padding: '0.65rem 1.45rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-full)',
                      background: 'transparent',
                      color: 'var(--text-main)',
                      cursor: 'pointer',
                      boxShadow: 'none',
                      fontFamily: kmFont,
                    }}
                  >
                    {t('appt_consult_ai')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Ticket Rows List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.94rem',
                  color: 'var(--text-main)',
                  marginBottom: '0.35rem',
                  fontWeight: 600,
                  fontFamily: kmFont,
                }}
              >
                <span>
                  {myTickets.length} {isKm ? 'ការណាត់ជួប' : 'Appointments scheduled'}
                </span>
              </div>

              {myTickets.map((tk) => {
                const timing = getTicketTiming(tk);

                return (
                  <div
                    key={tk.id}
                    onClick={() => {
                      setActiveTicket(tk);
                      setActionNotice(null);
                      setActionError(null);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--text-main)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.15rem 1.45rem',
                      cursor: 'pointer',
                      boxShadow: 'none',
                      transition: 'border-color 0.15s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    {/* Left: Hospital Logo + Appointment Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', flex: 1, minWidth: '280px' }}>
                      {tk.hospital_logo_url ? (
                        <img
                          src={tk.hospital_logo_url}
                          alt={tk.hospital_name || 'Hospital'}
                          style={{
                            width: '54px',
                            height: '54px',
                            minWidth: '54px',
                            borderRadius: '50%',
                            border: '1px solid var(--border-color)',
                            objectFit: 'cover',
                            backgroundColor: '#ffffff',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '54px',
                            height: '54px',
                            minWidth: '54px',
                            borderRadius: '50%',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#ffffff',
                            fontWeight: 700,
                            fontSize: '1.05rem',
                            color: 'var(--text-main)',
                            flexShrink: 0,
                          }}
                        >
                          {tk.hospital_name
                            ? tk.hospital_name
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()
                            : <Building2 size={24} color="var(--text-muted)" />}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        {/* Hospital Name + Ticket Number + Timing */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '1.06rem', color: 'var(--text-main)', fontFamily: kmFont }}>
                            {formatFacilityName(tk.hospital_name || (isKm ? 'មន្ទីរពេទ្យ' : 'Hospital'), language)}
                          </span>
                          {timing && (
                            <span
                              style={{
                                fontSize: '0.84rem',
                                fontWeight: 600,
                                color: timing.isToday ? '#16a34a' : 'var(--text-muted)',
                                fontFamily: kmFont,
                              }}
                            >
                              • {timing.label}
                            </span>
                          )}
                        </div>

                        {/* Department • Doctor • Room */}
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: kmFont, lineHeight: 1.5 }}>
                          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                            {formatDepartmentName(tk.department_name || '', language) || (isKm ? 'ផ្នែកពិគ្រោះទូទៅ' : 'General Department')}
                          </span>
                          {tk.doctor_name && (
                            <>
                              {' • '}
                              <span>{formatDoctorName(tk.doctor_name, language)}</span>
                            </>
                          )}
                          {tk.room_number && (
                            <>
                              {' • '}
                              <span>{formatRoom(tk.room_number)}</span>
                            </>
                          )}
                        </div>

                        {/* Date & Time Slot */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            fontSize: '0.86rem',
                            color: 'var(--text-muted)',
                            marginTop: '0.15rem',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={14} color="var(--text-muted)" />
                            <span>{tk.appointment_date || '-'}</span>
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <Clock size={14} color="var(--text-muted)" />
                            <span>{tk.appointment_time || '09:00 AM - 10:00 AM'}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ================= DETAIL VIEW: SELECTED APPOINTMENT PASS ================= */
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
              onClick={() => {
                setActiveTicket(null);
                setActionNotice(null);
                setActionError(null);
              }}
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
            {/* Left Actions: Calendar Sync & Maps Directions */}
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

            {/* Right Actions: Cancel Booking */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {activeTicket.status !== 'CANCELLED' && activeTicket.status !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
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
      )}

      {/* Cancellation Confirmation Dialog */}
      {showCancelModal && (
        <div
          className="responsive-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCancelModal(false);
          }}
        >
          <div
            className="responsive-modal-card"
            style={{
              maxWidth: '440px',
              fontFamily: kmFont,
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              boxShadow: 'none',
              padding: '1.75rem',
            }}
          >
            <h4
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 0.65rem 0',
                fontFamily: kmFont,
              }}
            >
              {t('appt_cancel_btn')}
            </h4>
            <p
              style={{
                fontSize: '0.92rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                margin: '0 0 1.5rem 0',
                fontFamily: kmFont,
              }}
            >
              {t('appt_cancel_confirm')}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={actionLoading}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                {isKm ? 'ថយក្រោយ' : 'Keep Booking'}
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={actionLoading}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid #dc2626',
                  borderRadius: '4px',
                  color: '#dc2626',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                {actionLoading ? (
                  <RefreshCw size={14} className="spin" />
                ) : isKm ? (
                  'បញ្ជាក់ការលុបចោល'
                ) : (
                  'Confirm Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
