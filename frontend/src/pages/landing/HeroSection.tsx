import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { UserProfile } from '../../services/auth';

import heroLandscapeBg from '../../assets/hero_landscape_bg.jpg';

interface HeroSectionProps {
  onOpenAuth: () => void;
  currentUser?: UserProfile | null;
  onSelectTab?: (tab: any) => void;
  onStartChatWithQuery?: (query: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const { t, language } = useLanguage();

  return (
    <section
      className="hero-wrapper"
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        border: 'none',
        outline: 'none',
        borderBottom: 'none',
        marginBottom: 0,
      }}
    >
      {/* Background Hero Picture with ~8% Blur */}
      <div
        style={{
          position: 'absolute',
          inset: '-8px',
          backgroundImage: `url(${heroLandscapeBg})`,
          backgroundPosition: 'center bottom',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(3px)',
          transform: 'scale(1.03)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Seamless Continuous Transition Gradient (Hides the break section between Hero and Patient Features) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '115px',
          background: 'linear-gradient(180deg, rgba(17, 64, 46, 0) 0%, rgba(17, 64, 46, 0.22) 25%, rgba(17, 64, 46, 0.65) 55%, #11402e 84%, #11402e 100%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Center Layer: Content & Floating Glassmorphism Cards */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '960px',
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


        {/* 3 Floating White Feature Highlight Cards */}
        <div className="hero-highlight-cards">
          {/* Card 1: AI & Clinic Integration (Moved to Beginning) */}
          <div
            className="hero-glass-card"
            style={{ textAlign: 'left', cursor: 'default', justifyContent: 'flex-start' }}
          >
            <div
              className="hero-card-title text-truncate"
              style={{
                fontWeight: 700,
                fontSize: language === 'km' ? '1.24rem' : '1.16rem',
                color: '#0c2f27',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                marginBottom: '0.45rem',
              }}
            >
              {t('hero_card_ai_clinic_title')}
            </div>
            <div
              className="hero-card-desc text-clamp-2"
              style={{
                fontSize: language === 'km' ? '1.02rem' : '0.96rem',
                color: '#2d4a3e',
                lineHeight: language === 'km' ? 1.6 : 1.5,
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {t('hero_card_ai_clinic_desc')}
            </div>
          </div>

          {/* Card 2: Live Wait Times (Coming Soon) */}
          <div
            className="hero-glass-card"
            style={{ textAlign: 'left', cursor: 'default', justifyContent: 'flex-start' }}
          >
            <div
              className="hero-card-title text-truncate"
              style={{
                fontWeight: 700,
                fontSize: language === 'km' ? '1.24rem' : '1.16rem',
                color: '#0c2f27',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                marginBottom: '0.45rem',
              }}
            >
              {t('hero_live_wait_title')}
            </div>
            <div
              className="hero-card-desc text-clamp-2"
              style={{
                fontSize: language === 'km' ? '0.92rem' : '0.88rem',
                color: '#2d4a3e',
                lineHeight: language === 'km' ? 1.6 : 1.5,
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {t('hero_live_wait_desc')}
            </div>
          </div>

          {/* Card 3: Remote Tickets (Coming Soon) */}
          <div
            className="hero-glass-card"
            style={{ textAlign: 'left', cursor: 'default', justifyContent: 'flex-start' }}
          >
            <div
              className="hero-card-title text-truncate"
              style={{
                fontWeight: 700,
                fontSize: language === 'km' ? '1.24rem' : '1.16rem',
                color: '#0c2f27',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                marginBottom: '0.45rem',
              }}
            >
              {t('hero_remote_ticket_title')}
            </div>
            <div
              className="hero-card-desc text-clamp-2"
              style={{
                fontSize: language === 'km' ? '0.92rem' : '0.88rem',
                color: '#2d4a3e',
                lineHeight: language === 'km' ? 1.6 : 1.5,
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {t('hero_remote_ticket_desc')}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
