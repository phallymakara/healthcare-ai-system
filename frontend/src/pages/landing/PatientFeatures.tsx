import React from 'react';
import { Smartphone, Clock, Users, CheckCircle2 } from 'lucide-react';
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
        background: 'linear-gradient(180deg, #11402e 0%, #134734 7%, #1c664b 16%, #358869 26%, #64b290 38%, #a8dec6 50%, #def3e9 62%, #ffffff 72%, #ffffff 100%)',
        color: '#ffffff',
        padding: '4.5rem 1.5rem 7rem 1.5rem',
        overflow: 'hidden',
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
          {/* Card 1: Remote Queue Booking (Woman in Train) */}
          <div
            className="patient-feature-card"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              height: '240px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
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
              }}
            />

            {/* Gradient Overlay: Deep color over text for a bit, then gradients to reveal image appearance */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #0d382c 0%, #0d382c 36%, rgba(13, 56, 44, 0.88) 50%, rgba(13, 56, 44, 0.35) 66%, rgba(13, 56, 44, 0) 84%)',
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
                width: '52%',
                maxWidth: '310px',
                padding: '2rem 1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {/* White rounded badge matching reference */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.85rem',
                }}
              >
                <Smartphone size={20} color="#0c2f27" />
              </div>

              <h3
                style={{
                  fontSize: '1.25rem',
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
                style={{
                  fontSize: '0.86rem',
                  color: 'rgba(255, 255, 255, 0.88)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {t('pf_card1_desc')}
              </p>
            </div>
          </div>

          {/* Card 2: Live Queue Tracking (Clinic Clock on Left, Text on Right) */}
          <div
            className="patient-feature-card"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              height: '240px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
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
              }}
            />

            {/* Gradient Overlay: Deep color over text on the right, fading left to reveal clock */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to left, #124e40 0%, #124e40 38%, rgba(18, 78, 64, 0.9) 52%, rgba(18, 78, 64, 0.35) 68%, rgba(18, 78, 64, 0) 84%)',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            />

            {/* Text Content on Right */}
            <div
              className="patient-card-text"
              style={{
                position: 'relative',
                zIndex: 2,
                width: '52%',
                maxWidth: '310px',
                marginLeft: 'auto',
                padding: '2rem 1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {/* White rounded badge matching reference */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.85rem',
                }}
              >
                <Clock size={20} color="#0c2f27" />
              </div>

              <h3
                style={{
                  fontSize: '1.25rem',
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
                style={{
                  fontSize: '0.86rem',
                  color: 'rgba(255, 255, 255, 0.88)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {t('pf_card2_desc')}
              </p>
            </div>
          </div>

          {/* Card 3: Patient Community (Group with Chat Bubbles on Right) */}
          <div
            className="patient-feature-card"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              height: '240px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
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
              }}
            />

            {/* Gradient Overlay: Deep color on left, fading right to reveal community group */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #0e4436 0%, #0e4436 36%, rgba(14, 68, 54, 0.88) 50%, rgba(14, 68, 54, 0.35) 66%, rgba(14, 68, 54, 0) 84%)',
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
                width: '52%',
                maxWidth: '310px',
                padding: '2rem 1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {/* White rounded badge matching reference */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.85rem',
                }}
              >
                <Users size={20} color="#0c2f27" />
              </div>

              <h3
                style={{
                  fontSize: '1.25rem',
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
                style={{
                  fontSize: '0.86rem',
                  color: 'rgba(255, 255, 255, 0.88)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {t('pf_card3_desc')}
              </p>
              {language === 'km' && (
                <span
                  style={{
                    fontSize: '0.82rem',
                    color: 'rgba(255, 255, 255, 0.78)',
                    fontWeight: 500,
                    marginTop: '0.35rem',
                    display: 'block',
                  }}
                >
                  Community & peer support
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Consult Healthcare AI (Robot on Right) */}
          <div
            className="patient-feature-card"
            style={{
              position: 'relative',
              borderRadius: '20px',
              overflow: 'hidden',
              height: '240px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
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

            {/* Gradient Overlay: Deep dark teal on left, fading right to reveal glowing robot */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to right, #0d2634 0%, #0d2634 38%, rgba(13, 38, 52, 0.9) 52%, rgba(13, 38, 52, 0.35) 68%, rgba(13, 38, 52, 0) 84%)',
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
                width: '52%',
                maxWidth: '310px',
                padding: '2rem 1.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {/* White rounded badge with green checkmark matching reference */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.85rem',
                }}
              >
                <CheckCircle2 size={20} color="#16a34a" />
              </div>

              <h3
                style={{
                  fontSize: '1.25rem',
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
                style={{
                  fontSize: '0.86rem',
                  color: 'rgba(255, 255, 255, 0.88)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {t('pf_card4_desc')}
              </p>
              {language === 'km' && (
                <span
                  style={{
                    fontSize: '0.82rem',
                    color: 'rgba(255, 255, 255, 0.78)',
                    fontWeight: 500,
                    marginTop: '0.35rem',
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
