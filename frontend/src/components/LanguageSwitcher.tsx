import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSwitcher: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'transparent',
        border: 'none',
        padding: '2px 4px',
        boxShadow: 'none',
        ...style,
      }}
      title={language === 'en' ? 'Switch to Khmer (ប្តូរទៅភាសាខ្មែរ)' : 'Switch to English'}
    >
      <Globe size={15} style={{ color: 'var(--text-dim)', marginRight: '2px', flexShrink: 0 }} />

      <button
        type="button"
        onClick={() => setLanguage('en')}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: '0.82rem',
          fontWeight: language === 'en' ? 700 : 400,
          color: language === 'en' ? 'var(--text-main)' : 'var(--text-dim)',
          textDecoration: language === 'en' ? 'underline' : 'none',
          textUnderlineOffset: '3px',
          textDecorationColor: 'var(--accent-primary)',
          boxShadow: 'none',
          outline: 'none',
          transition: 'color 0.15s ease',
        }}
        aria-pressed={language === 'en'}
      >
        EN
      </button>

      <span style={{ color: 'var(--border-color)', fontSize: '0.75rem', userSelect: 'none' }}>|</span>

      <button
        type="button"
        onClick={() => setLanguage('km')}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: '0.85rem',
          fontFamily: 'var(--font-khmer)',
          fontWeight: language === 'km' ? 700 : 400,
          color: language === 'km' ? 'var(--text-main)' : 'var(--text-dim)',
          textDecoration: language === 'km' ? 'underline' : 'none',
          textUnderlineOffset: '3px',
          textDecorationColor: 'var(--accent-primary)',
          boxShadow: 'none',
          outline: 'none',
          transition: 'color 0.15s ease',
        }}
        aria-pressed={language === 'km'}
      >
        ខ្មែរ
      </button>
    </div>
  );
};
