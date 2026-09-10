import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

import step1Img from '../../assets/how_step_1.png';
import step2Img from '../../assets/how_step_2.png';
import step3Img from '../../assets/how_step_3.png';
import step4Img from '../../assets/how_step_4.png';

export const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      number: '1',
      badgeNumber: '1',
      image: step1Img,
      title: t('how_step1_title'),
      description: t('how_step1_desc'),
    },
    {
      number: '02',
      badgeNumber: '02',
      image: step2Img,
      title: t('how_step2_title'),
      description: t('how_step2_desc'),
    },
    {
      number: '03',
      badgeNumber: '03',
      image: step3Img,
      title: t('how_step3_title'),
      description: t('how_step3_desc'),
    },
    {
      number: '04',
      badgeNumber: '04',
      image: step4Img,
      title: t('how_step4_title'),
      description: t('how_step4_desc'),
    },
  ];

  return (
    <section id="how-it-works" style={{ width: '100%', padding: '2.5rem 0 3.5rem 0' }}>
      {/* Section Header */}
      <div style={{ maxWidth: '820px', marginBottom: '2.5rem' }}>
        <h2
          style={{
            fontSize: 'clamp(1.85rem, 3.2vw, 2.35rem)',
            fontWeight: 800,
            color: '#0c2f27',
            letterSpacing: '-0.02em',
            lineHeight: 1.3,
          }}
        >
          {t('how_section_title')}
        </h2>
        <p
          style={{
            color: '#64748b',
            fontSize: 'clamp(0.98rem, 1.4vw, 1.12rem)',
            marginTop: '0.65rem',
            lineHeight: 1.6,
            fontWeight: 400,
          }}
        >
          {t('how_section_subtitle')}
        </p>
      </div>

      {/* Timeline Connector Bar (Matching Reference Image) */}
      <div
        style={{
          position: 'relative',
          marginBottom: '2rem',
          padding: '0.5rem 0',
        }}
      >
        {/* Horizontal Connecting Line between center of first circle and center of last circle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: 'calc(12.5% - 2px)',
            right: 'calc(12.5% - 2px)',
            height: '2.5px',
            background: '#185339',
            transform: 'translateY(-50%)',
            zIndex: 1,
          }}
        />

        {/* 4 Step Badges aligned with 4 columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1.75rem',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {steps.map((step) => (
            <div
              key={step.number}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#185339',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(24, 83, 57, 0.3)',
                  border: '3px solid #ffffff',
                  transition: 'transform 0.2s ease, background-color 0.2s ease',
                }}
              >
                {step.badgeNumber}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4 Illustrated Process Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
          gap: '1.75rem',
        }}
      >
        {steps.map((step) => (
          <div
            key={step.number}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.1rem',
            }}
          >
            {/* Illustrated Card with Soft Outer Drop Shadow */}
            <div
              style={{
                width: '100%',
                aspectRatio: '193 / 201',
                borderRadius: '24px',
                overflow: 'hidden',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow:
                  '0 14px 34px -4px rgba(0, 0, 0, 0.12), 0 4px 14px -2px rgba(0, 0, 0, 0.06)',
                transition: 'transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow =
                  '0 24px 48px -6px rgba(12, 47, 39, 0.2), 0 8px 20px -3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#10b981';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow =
                  '0 14px 34px -4px rgba(0, 0, 0, 0.12), 0 4px 14px -2px rgba(0, 0, 0, 0.06)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              <img
                src={step.image}
                alt={step.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.3s ease',
                }}
              />
            </div>

            {/* Step Title and Description */}
            <div style={{ padding: '0 0.25rem' }}>
              <h3
                style={{
                  fontSize: '1.14rem',
                  fontWeight: 700,
                  color: '#0c2f27',
                  marginBottom: '0.4rem',
                  lineHeight: 1.35,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: '0.92rem',
                  color: '#475569',
                  lineHeight: 1.55,
                }}
              >
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
