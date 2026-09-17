import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface ComingSoonViewProps {
  type?: 'ticket' | 'history';
}

export const ComingSoonView: React.FC<ComingSoonViewProps> = () => {
  const { t, language } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer), sans-serif' : 'inherit';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 200px)',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        maxWidth: '640px',
        margin: '0 auto',
      }}
    >
      {/* Main Title */}
      <div
        style={{
          fontSize: isKm ? 'clamp(1.25rem, 2.4vw, 1.5rem)' : 'clamp(1.15rem, 2.2vw, 1.4rem)',
          fontWeight: 400,
          color: 'var(--text-main)',
          lineHeight: 1.4,
          marginBottom: '0.75rem',
          fontFamily: kmFont,
          letterSpacing: '-0.01em',
        }}
      >
        {t('coming_soon_title')}
      </div>

      {/* Description Text */}
      <p
        style={{
          fontSize: isKm ? '0.98rem' : '0.94rem',
          color: '#475569',
          lineHeight: isKm ? 1.75 : 1.65,
          maxWidth: '520px',
          margin: '0 auto',
          fontFamily: kmFont,
        }}
      >
        {t('coming_soon_desc')}
      </p>
    </div>
  );
};

