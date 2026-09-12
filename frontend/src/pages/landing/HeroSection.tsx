import React, { useState } from 'react';
import { Clock, Users, Sparkles, Search } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { UserProfile } from '../../services/auth';

import heroLandscapeBg from '../../assets/hero_landscape_bg.jpg';

interface HeroSectionProps {
  onOpenAuth: () => void;
  currentUser?: UserProfile | null;
  onSelectTab?: (tab: any) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenAuth, currentUser, onSelectTab }) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (onSelectTab) {
      onSelectTab('patient_discovery');
    }
  };

  return (
    <section
      className="hero-wrapper"
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        backgroundImage: `linear-gradient(180deg, rgba(8, 28, 20, 0.35) 0%, rgba(8, 28, 20, 0.10) 30%, rgba(17, 64, 46, 0.35) 55%, rgba(17, 64, 46, 0.78) 75%, #11402e 92%, #11402e 100%), url(${heroLandscapeBg})`,
        backgroundPosition: 'center bottom',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        border: 'none',
        outline: 'none',
        borderBottom: 'none',
        marginBottom: 0,
      }}
    >

      {/* Center Layer: Content & Floating Glassmorphism Cards */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '860px',
          width: '100%',
          margin: '0 auto',
          textAlign: 'center',
          padding: '0 1rem',
        }}
      >
        {/* Main Headline */}
        <h1
          style={{
            fontSize: 'clamp(2.1rem, 4.4vw, 3.1rem)',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            marginBottom: '1.25rem',
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
            textShadow: '0 2px 14px rgba(0, 0, 0, 0.55), 0 1px 3px rgba(0, 0, 0, 0.4)',
          }}
        >
          {t('hero_title_1')} <br />
          {t('hero_title_2')}
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: language === 'km' ? 'clamp(1.15rem, 2.3vw, 1.35rem)' : 'clamp(1.08rem, 2.1vw, 1.25rem)',
            color: '#ffffff',
            lineHeight: language === 'km' ? 1.85 : 1.7,
            maxWidth: '820px',
            margin: '0 auto',
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
            fontWeight: 500,
            textShadow: '0 1px 8px rgba(0, 0, 0, 0.5)',
          }}
        >
          {t('hero_subtitle')}
        </p>

        {/* 3 Floating Glassmorphism Feature Highlight Cards */}
        <div className="hero-highlight-cards">
          {/* Card 1: Live wait times */}
          <div className="hero-glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(24, 83, 57, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              >
                <Clock size={18} />
              </div>
              <div
                className="hero-card-title text-truncate"
                style={{
                  fontWeight: 700,
                  fontSize: language === 'km' ? '1.12rem' : '1.05rem',
                  color: '#0c2f27',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
              >
                {t('hero_live_wait_title')}
              </div>
            </div>
            <div
              className="hero-card-desc text-clamp-2"
              style={{
                fontSize: language === 'km' ? '0.98rem' : '0.92rem',
                color: '#2d4a3e',
                lineHeight: language === 'km' ? 1.6 : 1.5,
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {t('hero_live_wait_desc')}
            </div>
          </div>

          {/* Card 2: Remote Tickets */}
          <div className="hero-glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(24, 83, 57, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              >
                <Users size={18} />
              </div>
              <div
                className="hero-card-title text-truncate"
                style={{
                  fontWeight: 700,
                  fontSize: language === 'km' ? '1.12rem' : '1.05rem',
                  color: '#0c2f27',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
              >
                {t('hero_remote_ticket_title')}
              </div>
            </div>
            <div
              className="hero-card-desc text-clamp-2"
              style={{
                fontSize: language === 'km' ? '0.98rem' : '0.92rem',
                color: '#2d4a3e',
                lineHeight: language === 'km' ? 1.6 : 1.5,
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {t('hero_remote_ticket_desc')}
            </div>
          </div>

          {/* Card 3: AI & Clinic Integration */}
          <div className="hero-glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.45rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: 'rgba(24, 83, 57, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-primary)',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={18} />
              </div>
              <div
                className="hero-card-title text-truncate"
                style={{
                  fontWeight: 700,
                  fontSize: language === 'km' ? '1.12rem' : '1.05rem',
                  color: '#0c2f27',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
              >
                {t('hero_card_ai_clinic_title')}
              </div>
            </div>
            <div
              className="hero-card-desc text-clamp-2"
              style={{
                fontSize: language === 'km' ? '0.98rem' : '0.92rem',
                color: '#2d4a3e',
                lineHeight: language === 'km' ? 1.6 : 1.5,
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {t('hero_card_ai_clinic_desc')}
            </div>
          </div>
        </div>

        {/* Quick Search Location Pill Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="hero-search-container"
        >
          <button
            type="button"
            className="text-truncate"
            onClick={() => {
              if (!currentUser) {
                if (onOpenAuth) onOpenAuth();
              } else if (onSelectTab) {
                onSelectTab('patient_discovery');
              }
            }}
            style={{
              background: '#0c2f27',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '0.65rem 1.35rem',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              flexShrink: 0,
              fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              boxShadow: '0 2px 8px rgba(12, 47, 39, 0.2)',
              transition: 'background-color 0.15s ease',
              maxWidth: '140px',
            }}
          >
            {t('hero_get_started')}
          </button>

          <input
            type="text"
            className="text-truncate"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('hero_quick_search_placeholder')}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              padding: '0.65rem 1rem',
              fontSize: '0.96rem',
              color: 'var(--text-main)',
              background: 'transparent',
              fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
            }}
          />

          <button
            type="submit"
            aria-label="Search hospitals"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0c2f27 0%, #185339 100%)',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(12, 47, 39, 0.25)',
              transition: 'transform 0.15s ease',
            }}
          >
            <Search size={18} />
          </button>
        </form>
      </div>
    </section>
  );
};

export default HeroSection;
