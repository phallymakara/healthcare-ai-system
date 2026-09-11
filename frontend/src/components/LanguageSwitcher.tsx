import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);

  const closeDropdown = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, 180);
  }, [isClosing]);

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsClosing(false);
      setIsOpen(true);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeDropdown]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

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
        onClick={toggleDropdown}
        className={`lang-switcher-btn ${isOpen && !isClosing ? 'is-open' : ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebar ? 'flex-start' : 'center',
          gap: isSidebar ? '8px' : '7px',
          padding: isSidebar ? '0.45rem 0.65rem' : '0.45rem 0.75rem',
          fontSize: isSidebar ? '0.95rem' : '1.08rem',
          fontWeight: 700,
          fontFamily: isKm ? kmFont : 'inherit',
          width: isSidebar ? '100%' : 'auto',
          textAlign: 'left',
          backgroundColor: isOpen && !isClosing ? 'rgba(24, 83, 57, 0.08)' : 'transparent',
        }}
        title={isKm ? 'ជ្រើសរើសភាសា (Select Language)' : 'Select Language'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe
          size={isSidebar ? 18 : 20}
          color="var(--accent-primary)"
          className="globe-icon"
          style={{ flexShrink: 0 }}
        />
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
          {isKm ? 'KM' : 'EN'}
        </span>
      </button>

      {/* Language Options List */}
      {(isOpen || isClosing) && (
        <div
          className={isClosing ? 'lang-dropdown-exit' : 'lang-dropdown-animate'}
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
            className="lang-dropdown-item"
            onClick={() => {
              setLanguage('km');
              closeDropdown();
            }}
            style={{
              color: isKm ? 'var(--accent-primary)' : 'var(--text-main)',
              fontSize: '1.02rem',
              fontFamily: kmFont,
              fontWeight: isKm ? 700 : 500,
            }}
          >
            <span>ខ្មែរ (Khmer)</span>
            {isKm && <Check size={17} color="var(--accent-primary)" strokeWidth={2.5} />}
          </button>

          {/* English Button */}
          <button
            type="button"
            className="lang-dropdown-item"
            onClick={() => {
              setLanguage('en');
              closeDropdown();
            }}
            style={{
              color: !isKm ? 'var(--accent-primary)' : 'var(--text-main)',
              fontSize: '1.02rem',
              fontFamily: 'inherit',
              fontWeight: !isKm ? 700 : 500,
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
