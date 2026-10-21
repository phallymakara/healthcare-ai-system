import React from 'react';
import { MapPin, Ticket, Clock, Stethoscope } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import step1Img from '../../assets/how_step_1_find.jpg';
import step2Img from '../../assets/how_step_2_book.jpg';
import step3Img from '../../assets/how_step_3_track.jpg';
import step4Img from '../../assets/how_step_4_consult.jpg';

export const HowItWorks: React.FC = () => {
  const { t, language } = useLanguage();

  const steps = [
    {
      stepLabel: language === 'km' ? 'ជំហាន ០១' : 'Step 01',
      icon: MapPin,
      image: step1Img,
      title: t('how_step1_title'),
      description: t('how_step1_desc'),
    },
    {
      stepLabel: language === 'km' ? 'ជំហាន ០២' : 'Step 02',
      icon: Ticket,
      image: step2Img,
      title: t('how_step2_title'),
      description: t('how_step2_desc'),
    },
    {
      stepLabel: language === 'km' ? 'ជំហាន ០៣' : 'Step 03',
      icon: Clock,
      image: step3Img,
      title: t('how_step3_title'),
      description: t('how_step3_desc'),
    },
    {
      stepLabel: language === 'km' ? 'ជំហាន ០៤' : 'Step 04',
      icon: Stethoscope,
      image: step4Img,
      title: t('how_step4_title'),
      description: t('how_step4_desc'),
    },
  ];

  return (
    <section id="how-it-works" style={{ width: '100%', padding: '1rem 0 2rem 0' }}>
      {/* Section Header matching PatientFeatures & HospitalFeatures clean style */}
      <div style={{ maxWidth: '860px', marginBottom: '2.25rem' }}>
        <h2
          style={{
            fontSize: 'clamp(1.35rem, 2.4vw, 1.75rem)',
            fontWeight: 700,
            color: '#0c2f27',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
            marginBottom: '0.65rem',
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
          }}
        >
          {t('how_section_badge')}
        </h2>

        <p
          style={{
            color: '#64748b',
            fontSize: 'clamp(0.92rem, 1.3vw, 1rem)',
            lineHeight: 1.6,
            fontWeight: 400,
            margin: 0,
            fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
          }}
        >
          {t('how_section_subtitle')}
        </p>
      </div>

      {/* 4 Process Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: '1.85rem',
        }}
      >
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#10b981';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = '#e2e8f0';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              {/* Top Image Preview Frame with Step Badge */}
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#f8fafc',
                  borderBottom: '1px solid #edf2f7',
                }}
              >
                <img
                  src={step.image}
                  alt=""
                  role="presentation"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                    transition: 'transform 0.35s ease',
                  }}
                />

                {/* Step Pill Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    zIndex: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#0c2f27',
                    border: '1px solid #15803d',
                    borderRadius: '100px',
                    padding: '0.26rem 0.76rem',
                    fontSize: language === 'km' ? '0.78rem' : '0.72rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '0.02em',
                    fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {step.stepLabel}
                </div>
              </div>

              {/* Bottom Content Area */}
              <div
                style={{
                  padding: '1.1rem 1.25rem 1.35rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  justifyContent: 'flex-start',
                }}
              >
                {/* Title with Prefix Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.45rem',
                  }}
                >
                  <Icon size={19} color="#0c2f27" style={{ flexShrink: 0 }} />
                  <h3
                    className="text-truncate"
                    style={{
                      fontSize: language === 'km' ? '1.16rem' : '1.1rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      margin: 0,
                      lineHeight: 1.3,
                      fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                    }}
                  >
                    {step.title}
                  </h3>
                </div>

                <p
                  className="text-clamp-3"
                  style={{
                    fontSize: language === 'km' ? '0.92rem' : '0.88rem',
                    color: '#475569',
                    lineHeight: language === 'km' ? 1.55 : 1.5,
                    margin: 0,
                    fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                  }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HowItWorks;
