import React from 'react';
import { SlidersHorizontal, CalendarCheck, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const HospitalFeatures: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="hospital-features" style={{ padding: '2.5rem 0' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {t('hf_section_title')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', marginTop: '0.45rem', maxWidth: '680px', lineHeight: 1.6 }}>
          {t('hf_section_subtitle')}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.75rem',
      }}>
        <div style={{
          padding: '1.75rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          background: '#ffffff',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <SlidersHorizontal size={22} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {t('hf_card1_title')}
          </h3>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
            {t('hf_card1_desc')}
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.92rem', color: 'var(--text-muted)', paddingLeft: 0 }}>
            <li>{t('hf_card1_bullet1')}</li>
            <li>{t('hf_card1_bullet2')}</li>
          </ul>
        </div>

        <div style={{
          padding: '1.75rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          background: '#ffffff',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <CalendarCheck size={22} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {t('hf_card2_title')}
          </h3>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
            {t('hf_card2_desc')}
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.92rem', color: 'var(--text-muted)', paddingLeft: 0 }}>
            <li>{t('hf_card2_bullet1')}</li>
            <li>{t('hf_card2_bullet2')}</li>
          </ul>
        </div>

        <div style={{
          padding: '1.75rem',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          background: '#ffffff',
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}>
            <ShieldCheck size={22} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {t('hf_card3_title')}
          </h3>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
            {t('hf_card3_desc')}
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.92rem', color: 'var(--text-muted)', paddingLeft: 0 }}>
            <li>{t('hf_card3_bullet1')}</li>
            <li>{t('hf_card3_bullet2')}</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
