import React from 'react';
import { BookingsSummary } from './types';

export interface QueueStatsCardsProps {
  summary: BookingsSummary;
  kmFont: string;
  t: (key: string) => string;
}

export const QueueStatsCards: React.FC<QueueStatsCardsProps> = ({ summary, kmFont, t }) => {
  return (
    <div className="queue-stats-grid">
      {/* 1. Total Bookings */}
      <div className="queue-stat-kpi-card">
        <div
          className="text-truncate"
          title={t('cbs_stat_total')}
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            fontFamily: kmFont,
            lineHeight: 1.2,
          }}
        >
          {t('cbs_stat_total')}
        </div>
        <div
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginTop: '0.35rem',
            lineHeight: 1.15,
          }}
        >
          {summary.total_bookings}
        </div>
      </div>

      {/* 2. Online Bookings */}
      <div className="queue-stat-kpi-card">
        <div
          className="text-truncate"
          title={t('cbs_stat_online')}
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            fontFamily: kmFont,
            lineHeight: 1.2,
          }}
        >
          {t('cbs_stat_online')}
        </div>
        <div
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginTop: '0.35rem',
            lineHeight: 1.15,
          }}
        >
          {summary.online_bookings}
        </div>
      </div>

      {/* 3. Walk-in */}
      <div className="queue-stat-kpi-card">
        <div
          className="text-truncate"
          title={t('cbs_stat_walkin')}
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            fontFamily: kmFont,
            lineHeight: 1.2,
          }}
        >
          {t('cbs_stat_walkin')}
        </div>
        <div
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginTop: '0.35rem',
            lineHeight: 1.15,
          }}
        >
          {summary.walkin_bookings}
        </div>
      </div>

      {/* 4. Waiting */}
      <div className="queue-stat-kpi-card">
        <div
          className="text-truncate"
          title={t('cbs_stat_waiting')}
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            fontFamily: kmFont,
            lineHeight: 1.2,
          }}
        >
          {t('cbs_stat_waiting')}
        </div>
        <div
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#d97706',
            marginTop: '0.35rem',
            lineHeight: 1.15,
          }}
        >
          {summary.waiting_count}
        </div>
      </div>

      {/* 5. Serving */}
      <div className="queue-stat-kpi-card">
        <div
          className="text-truncate"
          title={t('cbs_stat_serving')}
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            fontFamily: kmFont,
            lineHeight: 1.2,
          }}
        >
          {t('cbs_stat_serving')}
        </div>
        <div
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#059669',
            marginTop: '0.35rem',
            lineHeight: 1.15,
          }}
        >
          {summary.serving_count}
        </div>
      </div>

      {/* 6. Completed */}
      <div className="queue-stat-kpi-card">
        <div
          className="text-truncate"
          title={t('cbs_stat_completed')}
          style={{
            fontSize: '0.86rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
            fontFamily: kmFont,
            lineHeight: 1.2,
          }}
        >
          {t('cbs_stat_completed')}
        </div>
        <div
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            marginTop: '0.35rem',
            lineHeight: 1.15,
          }}
        >
          {summary.completed_count}
        </div>
      </div>
    </div>
  );
};

export default QueueStatsCards;


