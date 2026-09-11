import React from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  Play,
  Volume2,
  RotateCcw,
  Smartphone,
  Check,
  UserX,
} from 'lucide-react';
import { BookingItem } from './types';

export interface QueueTicketItemProps {
  item: BookingItem;
  nowTimestamp: number;
  actionLoading: boolean;
  onCall: (id: string) => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onRecall: (id: string) => void;
  onNoShow: (id: string) => void;
  kmFont: string;
  t: (key: string) => string;
}

export const QueueTicketItem: React.FC<QueueTicketItemProps> = ({
  item,
  nowTimestamp,
  actionLoading,
  onCall,
  onStart,
  onComplete,
  onSkip,
  onRecall,
  onNoShow,
  kmFont,
  t,
}) => {
  const isOnline = item.ticket_source === 'ONLINE';
  const isServing = item.status === 'SERVING';
  const isCalled = item.status === 'CALLED';
  const isWaiting = item.status === 'WAITING';
  const isSkipped = item.status === 'SKIPPED' || item.status === 'NO_SHOW';
  const isCompleted = item.status === 'COMPLETED';

  const parseLocalTime = (iso?: string) => {
    if (!iso) return '';
    const clean = iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`;
    return new Date(clean).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const parseLocalDate = (iso?: string) => {
    if (!iso) return '';
    const clean = iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`;
    const d = new Date(clean);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatElapsedTimer = (startedAt?: string) => {
    if (!startedAt) return '00:00';
    const cleanStr = startedAt.endsWith('Z') || startedAt.includes('+') ? startedAt : `${startedAt}Z`;
    const startMs = new Date(cleanStr).getTime();
    const diffSec = Math.max(0, Math.floor((nowTimestamp - startMs) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#d97706',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#d97706',
                display: 'inline-block',
              }}
            />
            {t('cbs_status_waiting')}
          </span>
        );
      case 'CALLED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#0284c7',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#0284c7',
                display: 'inline-block',
              }}
            />
            {t('cbs_status_called')}
          </span>
        );
      case 'SERVING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#059669',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#059669',
                display: 'inline-block',
              }}
            />
            {t('cbs_status_serving')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#94a3b8',
                display: 'inline-block',
              }}
            />
            {t('cbs_status_completed')}
          </span>
        );
      case 'SKIPPED':
      case 'NO_SHOW':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#dc2626',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                display: 'inline-block',
              }}
            />
            {t('cbs_status_skipped')}
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#94a3b8',
                display: 'inline-block',
              }}
            />
            {status}
          </span>
        );
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '1.15rem 1.3rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
        boxShadow: 'none',
      }}
    >
      {/* Slot Top Meta Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          paddingBottom: '0.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* Time Slot */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              fontFamily: kmFont,
            }}
          >
            <Clock size={14} style={{ color: 'var(--text-muted)' }} />
            <span>{item.appointment_time || parseLocalTime(item.created_at)}</span>
          </div>

          {/* Date Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
            }}
          >
            <Calendar size={14} />
            <span>{item.appointment_date || parseLocalDate(item.created_at)}</span>
          </div>

          {/* Ticket Number */}
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              fontFamily: kmFont,
              color: 'var(--text-main)',
              letterSpacing: '0.04em',
            }}
          >
            #{item.ticket_number}
          </div>

          {/* Ticket Source Indicator */}
          {isOnline ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                fontFamily: kmFont,
              }}
            >
              <Smartphone size={13} />
              {t('cbs_source_online')}
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                fontFamily: kmFont,
              }}
            >
              <User size={13} />
              {t('cbs_source_walkin')}
            </span>
          )}
        </div>

        {/* Status Badge */}
        <div>{renderStatusBadge(item.status)}</div>
      </div>

      {/* Slot Details Body Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {/* Patient Info */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 600,
            }}
          >
            {t('cbs_slot_patient')}
          </div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginTop: '0.2rem',
            }}
          >
            {item.patient_name}
          </div>
          {item.patient_phone && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                marginTop: '0.2rem',
              }}
            >
              <Phone size={12} />
              <span>{item.patient_phone}</span>
            </div>
          )}
        </div>

        {/* Doctor & Department */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 600,
            }}
          >
            {t('cbs_slot_doctor')}
          </div>
          <div
            style={{
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginTop: '0.2rem',
            }}
          >
            {item.doctor_name ? (
              <>
                {item.doctor_name}{' '}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                  ({item.doctor_specialty || t('qm_specialist_default')})
                </span>
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>{t('qm_any_specialist')}</span>
            )}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {item.department_name} {item.department_code ? `(${item.department_code})` : ''}
          </div>
        </div>

        {/* Service */}
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              fontWeight: 600,
            }}
          >
            {t('cbs_slot_service')}
          </div>
          <div
            style={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginTop: '0.2rem',
            }}
          >
            {item.service_name || t('qm_standard_consultation')}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {t('cbs_queue_pos')}: #{item.position || 1} • {t('cbs_est_wait')}: ~
            {item.estimated_wait_minutes || 0} {t('pd_mins')}
          </div>
        </div>

        {/* Live Consultation Timer if Serving */}
        {isServing && (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              padding: '0.55rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#059669', fontFamily: kmFont }}>
              {t('qm_consultation_time')}
            </div>
            <div
              style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: '#059669',
                marginTop: '0.15rem',
              }}
            >
              {formatElapsedTimer(item.serving_started_at)}
            </div>
          </div>
        )}
      </div>

      {/* Slot Action Controls Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
          gap: '0.55rem',
          paddingTop: '0.35rem',
        }}
      >
        {isWaiting && (
          <>
            <button
              onClick={() => onCall(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                background: 'transparent',
                border: '1px solid var(--text-main)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              <Volume2 size={14} />
              {t('cbs_call_patient')}
            </button>

            <button
              onClick={() => onStart(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                background: 'transparent',
                border: '1px solid #059669',
                borderRadius: '4px',
                color: '#059669',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              <Play size={13} />
              {t('cbs_start_consult')}
            </button>

            <button
              onClick={() => onSkip(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              {t('cbs_skip_patient')}
            </button>
          </>
        )}

        {isCalled && (
          <>
            <button
              onClick={() => onStart(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                background: 'transparent',
                border: '1px solid #059669',
                borderRadius: '4px',
                color: '#059669',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              <Play size={13} />
              {t('cbs_start_consult')}
            </button>

            <button
              onClick={() => onCall(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              <Volume2 size={13} />
              {t('cbs_recall_patient')}
            </button>

            <button
              onClick={() => onSkip(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              {t('cbs_skip_patient')}
            </button>
          </>
        )}

        {isServing && (
          <>
            <button
              onClick={() => onComplete(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 1rem',
                background: 'transparent',
                border: '1px solid #059669',
                borderRadius: '4px',
                color: '#059669',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              <CheckCircle2 size={15} />
              {t('cbs_finish_consult')}
            </button>

            <button
              onClick={() => onRecall(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              <RotateCcw size={13} />
              {t('cbs_recall_patient')}
            </button>

            <button
              onClick={() => onNoShow(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: '#dc2626',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              <UserX size={13} />
              {t('cbs_noshow_patient')}
            </button>
          </>
        )}

        {isSkipped && (
          <>
            <button
              onClick={() => onRecall(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              <RotateCcw size={13} />
              {t('cbs_recall_patient')}
            </button>

            <button
              onClick={() => onNoShow(item.id)}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.75rem',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: '#dc2626',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              <UserX size={13} />
              {t('cbs_noshow_patient')}
            </button>
          </>
        )}

        {isCompleted && (
          <div
            style={{
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontFamily: kmFont,
            }}
          >
            <Check size={14} style={{ color: '#059669' }} />
            <span>{t('cbs_status_completed')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueTicketItem;
