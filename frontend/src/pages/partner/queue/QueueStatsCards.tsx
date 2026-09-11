import React from 'react';
import { Smartphone, User } from 'lucide-react';
import { BookingsSummary } from './types';

export interface QueueStatsCardsProps {
  summary: BookingsSummary;
  kmFont: string;
  t: (key: string) => string;
}

export const QueueStatsCards: React.FC<QueueStatsCardsProps> = ({ summary, kmFont, t }) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.95rem 1.15rem',
          boxShadow: 'none',
        }}
      >
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont, fontWeight: 500 }}>
          {t('cbs_stat_total')}
        </div>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginTop: '0.2rem',
            lineHeight: 1.2,
          }}
        >
          {summary.total_bookings}
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.95rem 1.15rem',
          boxShadow: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            fontFamily: kmFont,
            fontWeight: 500,
          }}
        >
          <Smartphone size={14} />
          {t('cbs_stat_online')}
        </div>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginTop: '0.2rem',
            lineHeight: 1.2,
          }}
        >
          {summary.online_bookings}
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.95rem 1.15rem',
          boxShadow: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            fontFamily: kmFont,
            fontWeight: 500,
          }}
        >
          <User size={14} />
          {t('cbs_stat_walkin')}
        </div>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            marginTop: '0.2rem',
            lineHeight: 1.2,
          }}
        >
          {summary.walkin_bookings}
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.95rem 1.15rem',
          boxShadow: 'none',
        }}
      >
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont, fontWeight: 500 }}>
          {t('cbs_stat_waiting')}
        </div>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#d97706',
            marginTop: '0.2rem',
            lineHeight: 1.2,
          }}
        >
          {summary.waiting_count}
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.95rem 1.15rem',
          boxShadow: 'none',
        }}
      >
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont, fontWeight: 500 }}>
          {t('cbs_stat_serving')}
        </div>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#059669',
            marginTop: '0.2rem',
            lineHeight: 1.2,
          }}
        >
          {summary.serving_count}
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '0.95rem 1.15rem',
          boxShadow: 'none',
        }}
      >
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont, fontWeight: 500 }}>
          {t('cbs_stat_completed')}
        </div>
        <div
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            marginTop: '0.2rem',
            lineHeight: 1.2,
          }}
        >
          {summary.completed_count}
        </div>
      </div>
    </div>
  );
};

export default QueueStatsCards;
