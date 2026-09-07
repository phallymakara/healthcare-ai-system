import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface PatientHistoryProps {
  onSelectTicket?: (ticketId: string) => void;
  onExploreHospitals?: () => void;
}

export const PatientHistory: React.FC<PatientHistoryProps> = () => {
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
          {t('history_tab_title')}
        </div>
        <div
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
          }}
        >
          {t('history_tab_desc')}
        </div>
      </div>
    </div>
  );
};
