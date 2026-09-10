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
  const kmFont = 'var(--font-khmer), sans-serif';

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
          gap: isSidebar ? '8px' : '7px',
          background: 'transparent',
          border: 'none',
          padding: isSidebar ? '0.45rem 0.65rem' : '0.45rem 0.75rem',
          cursor: 'pointer',
          color: 'var(--text-main)',
          fontSize: isSidebar ? '0.95rem' : '1.08rem',
          fontWeight: 700,
          fontFamily: isKm ? kmFont : 'inherit',
          outline: 'none',
          boxShadow: 'none',
          userSelect: 'none',
          width: isSidebar ? '100%' : 'auto',
          textAlign: 'left',
          transition: 'opacity 0.15s ease, transform 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.75';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
        title={isKm ? 'ជ្រើសរើសភាសា (Select Language)' : 'Select Language'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe size={isSidebar ? 18 : 20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
          {isKm ? 'KM' : 'EN'}
        </span>
      </button>

      {/* Language Options List */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            [dropUp ? 'bottom' : 'top']: 'calc(100% + 6px)',
            [isSidebar ? 'left' : 'right']: 0,
            minWidth: isSidebar ? '100%' : '170px',
            backgroundColor: '#ffffff',
            border: '1px solid rgba(24, 83, 57, 0.18)',
            borderRadius: '12px',
            padding: '6px',
            boxShadow: '0 14px 38px rgba(0, 0, 0, 0.18)',
            zIndex: 99999,
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
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(24, 83, 57, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.55rem 0.85rem',
              border: 'none',
              borderRadius: '8px',
              background: 'transparent',
              color: isKm ? 'var(--accent-primary)' : 'var(--text-main)',
              fontSize: '1.02rem',
              fontFamily: kmFont,
              fontWeight: isKm ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: 'none',
              transition: 'background 0.15s ease',
            }}
          >
            <span>ខ្មែរ (Khmer)</span>
            {isKm && <Check size={17} color="var(--accent-primary)" strokeWidth={2.5} />}
          </button>

          {/* English Button */}
          <button
            type="button"
            onClick={() => {
              setLanguage('en');
              setIsOpen(false);
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(24, 83, 57, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0.55rem 0.85rem',
              border: 'none',
              borderRadius: '8px',
              background: 'transparent',
              color: !isKm ? 'var(--accent-primary)' : 'var(--text-main)',
              fontSize: '1.02rem',
              fontFamily: 'inherit',
              fontWeight: !isKm ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              boxShadow: 'none',
              transition: 'background 0.15s ease',
            }}
          >
            <span>English (EN)</span>
            {!isKm && <Check size={17} color="var(--accent-primary)" strokeWidth={2.5} />}
          </button>
        </div>
      )}
    </div>
  );
};
