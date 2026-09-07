import React from 'react';
import { Clock, Users, Building2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { UserProfile } from '../../services/auth';

interface HeroSectionProps {
  onOpenAuth: () => void;
  currentUser?: UserProfile | null;
  onSelectTab?: (tab: any) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  const { t } = useLanguage();

  return (
    <section style={{ padding: '3.5rem 0 2rem 0', textAlign: 'center' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: 'clamp(2.15rem, 5vw, 3rem)',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #0c2f27 0%, #185339 50%, #227349 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.25,
          letterSpacing: '-0.025em',
          marginBottom: '1.35rem',
        }}>
          {t('hero_title_1')} <br />
          {t('hero_title_2')}
        </h1>

        <p style={{
          fontSize: 'clamp(1.05rem, 2.5vw, 1.2rem)',
          color: 'var(--text-muted)',
          lineHeight: 1.65,
          marginBottom: '2rem',
          maxWidth: '740px',
          margin: '0 auto 2.5rem auto',
        }}>
          {t('hero_subtitle')}
        </p>

        {/* Quick Highlights Strip (Clean flat indicators centered) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2rem',
          marginTop: '3.75rem',
          paddingTop: '1rem',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <Clock size={26} color="#185339" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: 1.3 }}>{t('hero_live_wait_title')}</div>
              <div style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginTop: '5px', lineHeight: 1.6 }}>{t('hero_live_wait_desc')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <Users size={26} color="#185339" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: 1.3 }}>{t('hero_remote_ticket_title')}</div>
              <div style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginTop: '5px', lineHeight: 1.6 }}>{t('hero_remote_ticket_desc')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <Building2 size={26} color="#185339" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-main)', lineHeight: 1.3 }}>{t('hero_clinic_network_title')}</div>
              <div style={{ fontSize: '1.05rem', color: 'var(--text-muted)', marginTop: '5px', lineHeight: 1.6 }}>{t('hero_clinic_network_desc')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
