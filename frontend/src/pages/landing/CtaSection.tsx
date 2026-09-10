import React, { useState } from 'react';
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
  const [emailInput, setEmailInput] = useState('');

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
        margin: '2.5rem 0 0 0',
        padding: 0,
      }}
    >
      {/* Curved Full-Width Gradient Banner (Matching Reference Image) */}
      <div
        style={{
          width: '100%',
          borderTopLeftRadius: '36px',
          borderTopRightRadius: '36px',
          borderBottomLeftRadius: '0px',
          borderBottomRightRadius: '0px',
          background: 'linear-gradient(90deg, #2a8150 0%, #1e6d4c 45%, #155557 100%)',
          padding: '5rem 1.5rem 6.5rem 1.5rem',
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
              fontSize: 'clamp(1.75rem, 3.2vw, 2.35rem)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.38,
              margin: '0 auto',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.18)',
            }}
          >
            {t('cta_title')}
          </h2>

          {/* Capsule Pill Input & Action Button Bar */}
          <form
            onSubmit={handleClick}
            style={{
              maxWidth: '560px',
              width: '100%',
              margin: '2.25rem auto 0 auto',
              background: '#ffffff',
              borderRadius: '9999px',
              padding: '6px 7px 6px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 14px 34px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow =
                '0 18px 42px rgba(0, 0, 0, 0.28), 0 0 0 3px rgba(255, 255, 255, 0.4)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow =
                '0 14px 34px rgba(0, 0, 0, 0.22), 0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            {/* Input field */}
            <input
              type="text"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={t('cta_input_placeholder')}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: 'clamp(0.85rem, 1.3vw, 0.94rem)',
                color: '#1f2937',
                flex: 1,
                minWidth: 0,
                padding: '0.45rem 0.6rem 0.45rem 0',
                boxShadow: 'none',
              }}
            />

            {/* Dark Green Pill Submit Button */}
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #113d2a 0%, #0d3121 100%)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                borderRadius: '9999px',
                padding: '0.7rem 1.65rem',
                fontSize: 'clamp(0.88rem, 1.2vw, 0.96rem)',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.35)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
              }}
            >
              {currentUser ? t('cta_btn_portal') : t('cta_btn_start')}
            </button>
          </form>

          {/* Get Started Button directly below directing to Login / Auth Page */}
          <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => onOpenAuth()}
              style={{
                background: '#ffffff',
                color: '#0c2f27',
                borderRadius: '9999px',
                padding: '0.85rem 2.5rem',
                fontSize: '1.05rem',
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
              <span>Get Started</span>
              <ArrowRight size={18} strokeWidth={2.5} color="#0c2f27" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
