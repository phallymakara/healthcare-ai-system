import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export interface BookedTicket {
  id: string;
  ticket_number: string;
  queue_session_id?: string;
  hospital_id?: string;
  hospital_name?: string;
  department_id?: string;
  department_name?: string;
  doctor_id?: string;
  doctor_name?: string;
  room_number?: string;
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
}

export const LiveTicketTracker: React.FC<LiveTicketTrackerProps> = () => {
  const { language, t } = useLanguage();

  return (
    <div
      style={{
        width: '100%',
        minHeight: '360px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '540px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginBottom: '0.6rem',
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
          }}
        >
          {t('ticket_tab_title')}
        </div>
        <div
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
          }}
        >
          {t('ticket_tab_desc')}
        </div>
      </div>
    </div>
  );
};
