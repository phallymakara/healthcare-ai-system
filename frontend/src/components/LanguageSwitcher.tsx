import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LanguageSwitcherProps {
  style?: React.CSSProperties;
  dropUp?: boolean;
  variant?: 'default' | 'sidebar';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  style,
  dropUp = false,
  variant = 'default',
}) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isKm = language === 'km';
  const isSidebar = variant === 'sidebar';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: isSidebar ? 'flex' : 'inline-flex',
        width: isSidebar ? '100%' : 'auto',
        ...style,
      }}
    >
      {/* Trigger: Globe Icon + Language Suffix (EN or KM) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebar ? 'flex-start' : 'center',
          gap: isSidebar ? '8px' : '6px',
          background: 'transparent',
          border: 'none',
          borderRadius: '6px',
          padding: isSidebar ? '0.55rem 0.4rem' : '5px 8px',
          cursor: 'pointer',
          color: 'var(--text-main)',
          fontSize: isSidebar ? '0.95rem' : '0.88rem',
          fontWeight: isSidebar ? 500 : 700,
          fontFamily: 'inherit',
          transition: 'background 0.15s ease',
          outline: 'none',
          boxShadow: 'none',
          userSelect: 'none',
          width: isSidebar ? '100%' : 'auto',
          textAlign: 'left',
        }}
        title={isKm ? 'ជ្រើសរើសភាសា (Select Language)' : 'Select Language'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={isSidebar ? 18 : 16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: isSidebar ? 500 : 700 }}>
          {isKm ? 'KM' : 'EN'}
        </span>
      </button>

      {/* Floating Dropdown: Both Khmer and English Options */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            [dropUp ? 'bottom' : 'top']: 'calc(100% + 6px)',
            [isSidebar ? 'left' : 'right']: 0,
            minWidth: '160px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '5px',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.08)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          {/* Khmer Button */}
          <button
            type="button"
            onClick={() => {
              setLanguage('km');
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              background: isKm ? '#f0fdf4' : 'transparent',
              color: isKm ? 'var(--accent-primary)' : 'var(--text-main)',
              fontSize: '0.94rem',
              fontFamily: 'var(--font-khmer), sans-serif',
              fontWeight: isKm ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.12s ease',
            }}
          >
            <span>ខ្មែរ (Khmer)</span>
            {isKm && <Check size={16} color="var(--accent-primary)" strokeWidth={2.5} />}
          </button>

          {/* English Button */}
          <button
            type="button"
            onClick={() => {
              setLanguage('en');
              setIsOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '8px 12px',
              border: 'none',
              borderRadius: '6px',
              background: !isKm ? '#f0fdf4' : 'transparent',
              color: !isKm ? 'var(--accent-primary)' : 'var(--text-main)',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              fontWeight: !isKm ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.12s ease',
            }}
          >
            <span>English (EN)</span>
            {!isKm && <Check size={16} color="var(--accent-primary)" strokeWidth={2.5} />}
          </button>
        </div>
      )}
    </div>
  );
};
