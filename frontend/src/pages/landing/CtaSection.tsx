import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { UserProfile } from '../../services/auth';

interface CtaSectionProps {
  onOpenAuth: () => void;
  currentUser?: UserProfile | null;
  onSelectTab?: (tab: any) => void;
}

export const CtaSection: React.FC<CtaSectionProps> = ({ onOpenAuth, currentUser, onSelectTab }) => {
  const { t } = useLanguage();

  const handleClick = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentUser) {
      if (currentUser.role === 'SUPER_ADMIN') {
        onSelectTab?.('admin_center');
      } else if (['DOCTOR', 'RECEPTIONIST', 'HOSPITAL_ADMIN'].includes(currentUser.role)) {
        onSelectTab?.('partner_counter');
      } else {
        onSelectTab?.('patient_discovery');
      }
    } else {
      onOpenAuth();
    }
  };

  return (
    <section
      id="cta-section"
      style={{
        width: '100%',
        margin: '1rem 0 0 0',
        padding: 0,
      }}
    >
      {/* Curved Full-Width Gradient Banner (Matching Reference Image) */}
      <div
        className="cta-banner-wrapper"
        style={{
          width: '100%',
          borderTopLeftRadius: '36px',
          borderTopRightRadius: '36px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
          background: 'linear-gradient(90deg, #2a8150 0%, #1e6d4c 45%, #155557 100%)',
          padding: '2.5rem 1.5rem 2.75rem 1.5rem',
          textAlign: 'center',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle Background Glow Spheres */}
        <div
          style={{
            position: 'absolute',
            top: '-30%',
            left: '10%',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-25%',
            right: '12%',
            width: '320px',
            height: '320px',
            background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Centered White Two-Line Heading */}
        <div style={{ maxWidth: '780px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h2
            style={{
              fontSize: 'clamp(1.65rem, 3vw, 2.2rem)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.35,
              margin: '0 auto',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.18)',
            }}
          >
            {t('cta_title')}
          </h2>

          {/* Action Button directing to Login / Auth Page */}
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleClick}
              style={{
                background: '#ffffff',
                color: '#0c2f27',
                borderRadius: '9999px',
                padding: '0.8rem 2.4rem',
                fontSize: '1.02rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 28px rgba(0, 0, 0, 0.24)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                transition: 'transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 16px 36px rgba(0, 0, 0, 0.32)';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 28px rgba(0, 0, 0, 0.24)';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
            >
              <span>{currentUser ? t('cta_btn_portal') : 'Get Started'}</span>
              <ArrowRight size={18} strokeWidth={2.5} color="#0c2f27" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
