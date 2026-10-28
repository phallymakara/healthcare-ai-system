import React from 'react';
import { Ticket, Clock, Users, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

import remoteBookingImg from '../../assets/patient_remote_booking.jpg';
import queueTrackingImg from '../../assets/patient_queue_tracking.jpg';
import communitySupportImg from '../../assets/patient_community_support.jpg';
import aiConsultImg from '../../assets/patient_ai_consultation.jpg';

import { NavTab } from '../../components/Sidebar';

interface PatientFeaturesProps {
  onSelectTab?: (tab: NavTab) => void;
}

export const PatientFeatures: React.FC<PatientFeaturesProps> = ({ onSelectTab }) => {
  const { t, language } = useLanguage();

  const cards = [
    {
      id: 'remote-booking',
      icon: Ticket,
      image: remoteBookingImg,
      title: t('pf_card1_title'),
      desc: t('pf_card1_desc'),
      isComingSoon: false,
      tab: 'patient_discovery' as NavTab,
    },
    {
      id: 'queue-tracking',
      icon: Clock,
      image: queueTrackingImg,
      title: t('pf_card2_title'),
      desc: t('pf_card2_desc'),
      isComingSoon: false,
      tab: 'patient_live_ticket' as NavTab,
    },
    {
      id: 'patient-community',
      icon: Users,
      image: communitySupportImg,
      title: t('pf_card3_title'),
      desc: t('pf_card3_desc'),
      isComingSoon: true,
      tab: undefined,
    },
    {
      id: 'ai-consult',
      icon: Sparkles,
      image: aiConsultImg,
      title: t('pf_card4_title'),
      desc: t('pf_card4_desc'),
      isComingSoon: false,
      tab: 'patient_triage' as NavTab,
    },
  ];

  return (
    <section
      id="patient-features"
      style={{
        width: '100%',
        position: 'relative',
        background: '#ffffff',
        padding: '2.5rem 0 2rem 0',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '0 1.5rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Section Header matching HospitalFeatures clean style */}
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
            {t('pf_section_badge')}
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
            {t('pf_section_subtitle')}
          </p>
        </div>

      {/* 4 Cards Grid (matching Hospital Features layout) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1.85rem',
        }}
      >
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => {
                if (card.tab && onSelectTab) {
                  onSelectTab(card.tab);
                }
              }}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.25s ease, border-color 0.25s ease',
                cursor: card.tab && onSelectTab ? 'pointer' : 'default',
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
              {/* Top Image Preview Frame with Status Badge */}
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
                  src={card.image}
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

                {/* Status Badge (Only for Coming Soon) */}
                {card.isComingSoon && (
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
                      fontWeight: 600,
                      color: '#ffffff',
                      letterSpacing: '0.02em',
                      fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('coming_soon_title')}
                  </div>
                )}
              </div>

              {/* Bottom Content Area */}
              <div
                style={{
                  padding: '0.9rem 1.15rem 1.1rem 1.15rem',
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
                    marginBottom: '0.35rem',
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
                    {card.title}
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
                  {card.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </section>
  );
};

export default PatientFeatures;
