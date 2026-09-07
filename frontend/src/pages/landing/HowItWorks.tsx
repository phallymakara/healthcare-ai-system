import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      number: '01',
      title: t('how_step1_title'),
      description: t('how_step1_desc'),
    },
    {
      number: '02',
      title: t('how_step2_title'),
      description: t('how_step2_desc'),
    },
    {
      number: '03',
      title: t('how_step3_title'),
      description: t('how_step3_desc'),
    },
    {
      number: '04',
      title: t('how_step4_title'),
      description: t('how_step4_desc'),
    },
  ];

  return (
    <section id="how-it-works" style={{ padding: '2.5rem 0' }}>
      <div style={{ marginBottom: '2.25rem' }}>
        <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          {t('how_section_title')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.08rem', marginTop: '0.45rem' }}>
          {t('how_section_subtitle')}
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
      }}>
        {steps.map((step) => (
          <div
            key={step.number}
            style={{
              padding: '1.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              background: '#ffffff',
            }}
          >
            <div style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: 'var(--accent-primary)',
              marginBottom: '0.65rem',
              letterSpacing: '-0.02em',
            }}>
              {step.number}
            </div>
            <h3 style={{ fontSize: '1.18rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              {step.title}
            </h3>
            <p style={{ fontSize: '0.96rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
