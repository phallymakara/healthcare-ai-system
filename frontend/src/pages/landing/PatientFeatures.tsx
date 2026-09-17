import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

import patientCommuteImg from '../../assets/patient_commute_relax.jpg';
import queueClockImg from '../../assets/queue_clock_flow.jpg';
import communitySupportImg from '../../assets/community_peer_support.jpg';
import aiRobotImg from '../../assets/ai_robot_consult.jpg';

export const PatientFeatures: React.FC = () => {
  const { t, language } = useLanguage();

  return (
    <section
      id="patient-features"
      style={{
        width: '100%',
        position: 'relative',
        background: 'linear-gradient(180deg, #11402e 0%, #154c37 5%, #257053 11%, #55a383 18%, #a0dcbe 26%, #e6f6ee 33%, #ffffff 38%, #ffffff 100%)',
        color: '#ffffff',
        padding: '4.5rem 1.5rem 3rem 1.5rem',
        overflow: 'hidden',
        border: 'none',
        outline: 'none',
        borderTop: 'none',
        marginTop: '-2px',
      }}
    >
      {/* Decorative ambient radial glows concentrated at the upper green area */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '15%',
          width: '480px',
          height: '480px',
          background: 'radial-gradient(circle, rgba(45, 212, 191, 0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 3.5rem auto' }}>
          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.2vw, 2.45rem)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.35,
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            {t('pf_section_title')}
          </h2>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.86)',
              fontSize: 'clamp(0.98rem, 1.5vw, 1.12rem)',
              marginTop: '0.85rem',
              lineHeight: 1.65,
              fontWeight: 400,
            }}
          >
            {t('pf_section_subtitle')}
          </p>
        </div>

        {/* 2x2 Grid of Feature Cards matching reference */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 540px), 1fr))',
            gap: '1.75rem',
          }}
        >
          {/* Card 1: Remote Queue Booking (Woman in Train) — Coming Soon */}
          <div
            className="patient-feature-card"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              minHeight: '255px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 42px rgba(0, 0, 0, 0.28)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
            }}
          >
            {/* Full Illustration as Card Background */}
            <img
              src={patientCommuteImg}
              alt={t('pf_card1_title')}
              className="patient-card-img-layer"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'right center',
                zIndex: 0,
                opacity: 0.72,
              }}
            />

            {/* Gradient Overlay: Deep color over text, slightly stronger to signal unavailable */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #0d382c 0%, #0d382c 20%, rgba(13, 56, 44, 0.88) 38%, rgba(13, 56, 44, 0.35) 52%, rgba(13, 56, 44, 0.12) 62%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            {/* Coming Soon Badge — Top Right */}
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                zIndex: 5,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '100px',
                padding: '0.28rem 0.78rem',
                fontSize: language === 'km' ? '0.82rem' : '0.75rem',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '0.02em',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {t('coming_soon_title')}
            </div>

            {/* Text Content */}
            <div
              className="patient-card-text"
              style={{
                position: 'relative',
                zIndex: 2,
                width: '56%',
                maxWidth: '340px',
                padding: '1.75rem 1.65rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              <h3
                className="text-truncate"
                style={{
                  fontSize: language === 'km' ? '1.32rem' : '1.25rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '0.45rem',
                  lineHeight: 1.35,
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                }}
              >
                {t('pf_card1_title')}
              </h3>
              <p
                className="text-clamp-3"
                style={{
                  fontSize: language === 'km' ? '0.98rem' : '0.92rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: language === 'km' ? 1.65 : 1.55,
                  margin: 0,
                }}
              >
                {t('pf_card1_desc')}
              </p>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.7rem',
                  fontSize: language === 'km' ? '0.84rem' : '0.78rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                  fontStyle: 'italic',
                }}
              >
                {language === 'km' ? 'នឹងមកដល់ក្នុងដំណាក់កាលបន្ទាប់' : 'Available in the next phase'}
              </span>
            </div>
          </div>

          {/* Card 2: Live Queue Tracking (Clinic Clock on Left, Text on Right) — Coming Soon */}
          <div
            className="patient-feature-card"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              minHeight: '255px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 42px rgba(0, 0, 0, 0.28)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
            }}
          >
            {/* Full Illustration as Card Background */}
            <img
              src={queueClockImg}
              alt={t('pf_card2_title')}
              className="patient-card-img-layer"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'left center',
                zIndex: 0,
                opacity: 0.72,
              }}
            />

            {/* Gradient Overlay: Deep color over text on the right, slightly stronger to signal unavailable */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to left, #124e40 0%, #124e40 20%, rgba(18, 78, 64, 0.88) 38%, rgba(18, 78, 64, 0.35) 52%, rgba(18, 78, 64, 0.12) 62%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            {/* Coming Soon Badge — Top Left */}
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                zIndex: 5,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '100px',
                padding: '0.28rem 0.78rem',
                fontSize: language === 'km' ? '0.82rem' : '0.75rem',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '0.02em',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {t('coming_soon_title')}
            </div>

            {/* Text Content on Right */}
            <div
              className="patient-card-text"
              style={{
                position: 'relative',
                zIndex: 2,
                width: '56%',
                maxWidth: '340px',
                marginLeft: 'auto',
                padding: '1.75rem 1.65rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              <h3
                className="text-truncate"
                style={{
                  fontSize: language === 'km' ? '1.32rem' : '1.25rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '0.45rem',
                  lineHeight: 1.35,
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                }}
              >
                {t('pf_card2_title')}
              </h3>
              <p
                className="text-clamp-3"
                style={{
                  fontSize: language === 'km' ? '0.98rem' : '0.92rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: language === 'km' ? 1.65 : 1.55,
                  margin: 0,
                }}
              >
                {t('pf_card2_desc')}
              </p>
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.7rem',
                  fontSize: language === 'km' ? '0.84rem' : '0.78rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                  fontStyle: 'italic',
                }}
              >
                {language === 'km' ? 'នឹងមកដល់ក្នុងដំណាក់កាលបន្ទាប់' : 'Available in the next phase'}
              </span>
            </div>
          </div>

          {/* Card 3: Patient Community (Group with Chat Bubbles on Right) */}
          <div
            className="patient-feature-card"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              minHeight: '255px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 42px rgba(0, 0, 0, 0.28)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
            }}
          >
            {/* Full Illustration as Card Background */}
            <img
              src={communitySupportImg}
              alt={t('pf_card3_title')}
              className="patient-card-img-layer"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'right center',
                zIndex: 0,
                opacity: 0.72,
              }}
            />

            {/* Gradient Overlay: Deep color on left, matching Card 1 & 2 */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #0e4436 0%, #0e4436 20%, rgba(14, 68, 54, 0.88) 38%, rgba(14, 68, 54, 0.35) 52%, rgba(14, 68, 54, 0.12) 62%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            {/* Coming Soon Badge — Top Right */}
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                zIndex: 5,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '100px',
                padding: '0.28rem 0.78rem',
                fontSize: language === 'km' ? '0.82rem' : '0.75rem',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '0.02em',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                whiteSpace: 'nowrap',
              }}
            >
              {t('coming_soon_title')}
            </div>

            {/* Text Content */}
            <div
              className="patient-card-text"
              style={{
                position: 'relative',
                zIndex: 2,
                width: '56%',
                maxWidth: '340px',
                padding: '1.75rem 1.65rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              <h3
                className="text-truncate"
                style={{
                  fontSize: language === 'km' ? '1.32rem' : '1.25rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '0.45rem',
                  lineHeight: 1.35,
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                }}
              >
                {t('pf_card3_title')}
              </h3>
              <p
                className="text-clamp-3"
                style={{
                  fontSize: language === 'km' ? '0.98rem' : '0.92rem',
                  color: 'rgba(255, 255, 255, 0.85)',
                  lineHeight: language === 'km' ? 1.65 : 1.55,
                  margin: 0,
                }}
              >
                {t('pf_card3_desc')}
              </p>
              {language === 'km' && (
                <span
                  style={{
                    fontSize: '0.92rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontWeight: 600,
                    marginTop: '0.45rem',
                    display: 'block',
                  }}
                >
                  Community & peer support
                </span>
              )}
              <span
                style={{
                  display: 'inline-block',
                  marginTop: '0.7rem',
                  fontSize: language === 'km' ? '0.84rem' : '0.78rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                  fontStyle: 'italic',
                }}
              >
                {language === 'km' ? 'នឹងមកដល់ក្នុងដំណាក់កាលបន្ទាប់' : 'Available in the next phase'}
              </span>
            </div>
          </div>

          {/* Card 4: Consult Healthcare AI (Robot on Right) */}
          <div
            className="patient-feature-card"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              minHeight: '255px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 42px rgba(0, 0, 0, 0.28)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
            }}
          >
            {/* Full Illustration as Card Background */}
            <img
              src={aiRobotImg}
              alt={t('pf_card4_title')}
              className="patient-card-img-layer"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'right center',
                zIndex: 0,
              }}
            />

            {/* Gradient Overlay: Deep dark teal on left, reduced length to reveal glowing robot */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #0d2634 0%, #0d2634 16%, rgba(13, 38, 52, 0.82) 32%, rgba(13, 38, 52, 0.2) 46%, rgba(13, 38, 52, 0) 56%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            {/* Text Content */}
            <div
              className="patient-card-text"
              style={{
                position: 'relative',
                zIndex: 2,
                width: '56%',
                maxWidth: '340px',
                padding: '1.75rem 1.65rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              <h3
                className="text-truncate"
                style={{
                  fontSize: language === 'km' ? '1.32rem' : '1.25rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: '0.45rem',
                  lineHeight: 1.35,
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.4)',
                }}
              >
                {t('pf_card4_title')}
              </h3>
              <p
                className="text-clamp-3"
                style={{
                  fontSize: language === 'km' ? '0.98rem' : '0.92rem',
                  color: 'rgba(255, 255, 255, 0.92)',
                  lineHeight: language === 'km' ? 1.65 : 1.55,
                  margin: 0,
                }}
              >
                {t('pf_card4_desc')}
              </p>
              {language === 'km' && (
                <span
                  style={{
                    fontSize: '0.92rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontWeight: 600,
                    marginTop: '0.45rem',
                    display: 'block',
                  }}
                >
                  Direct AI Interaction
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PatientFeatures;
