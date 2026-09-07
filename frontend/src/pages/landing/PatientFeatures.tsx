import React from 'react';
import { Smartphone, Clock, Compass, Bell } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const PatientFeatures: React.FC = () => {
  const { t } = useLanguage();

  return (
    <section id="patient-features" style={{ padding: '2.5rem 0' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {t('pf_section_title')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', marginTop: '0.45rem', maxWidth: '680px', lineHeight: 1.6 }}>
          {t('pf_section_subtitle')}
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
            <Smartphone size={22} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {t('pf_card1_title')}
          </h3>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {t('pf_card1_desc')}
          </p>
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
            <Clock size={22} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {t('pf_card2_title')}
          </h3>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {t('pf_card2_desc')}
          </p>
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
            <Bell size={22} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {t('pf_card3_title')}
          </h3>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {t('pf_card3_desc')}
          </p>
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
            <Compass size={22} color="#185339" />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            {t('pf_card4_title')}
          </h3>
          <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {t('pf_card4_desc')}
          </p>
        </div>
      </div>
    </section>
  );
};
