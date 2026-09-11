import React from 'react';
import { Calendar, Clock, Building2, RefreshCw, Search } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  formatFacilityName,
  formatDepartmentName,
  formatDoctorName,
} from '../../../i18n/formatters';
import { BookedTicket, computeTimingInfo } from './types';

interface TicketListViewProps {
  myTickets: BookedTicket[];
  loading: boolean;
  lookupQuery: string;
  setLookupQuery: (val: string) => void;
  lookupLoading: boolean;
  lookupError: string | null;
  setLookupError: (err: string | null) => void;
  onLookupSubmit: (e: React.FormEvent) => void;
  onSelectTicket: (ticket: BookedTicket) => void;
  onExploreHospitals?: () => void;
  onConsultAi?: () => void;
}

export const TicketListView: React.FC<TicketListViewProps> = ({
  myTickets,
  loading,
  lookupQuery,
  setLookupQuery,
  lookupLoading,
  lookupError,
  setLookupError,
  onLookupSubmit,
  onSelectTicket,
  onExploreHospitals,
  onConsultAi,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer), sans-serif' : 'inherit';

  const formatRoom = (room?: string) => {
    if (!room) return '';
    const cleanNum = room.replace(/^(room|បន្ទប់)\s*/i, '').trim();
    return isKm ? `បន្ទប់ ${cleanNum}` : `Room ${cleanNum}`;
  };

  return (
    <div>
      {/* Top Header & Guest Ticket Lookup Bar */}
      <div style={{ marginBottom: '1.6rem' }}>
        <form
          onSubmit={onLookupSubmit}
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
            const timing = computeTimingInfo(tk, isKm);

            return (
              <div
                key={tk.id}
                className="appointment-ticket-card"
                onClick={() => onSelectTicket(tk)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.15rem 1.45rem',
                  cursor: 'pointer',
                  boxShadow: 'none',
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
                    {/* Hospital Name + Timing */}
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
                          • {timing.countdownLabel}
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
  );
};
