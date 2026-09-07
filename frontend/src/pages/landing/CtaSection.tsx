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

  const handleClick = () => {
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
    <section style={{
      padding: '3.5rem 1rem',
      textAlign: 'center',
      maxWidth: '760px',
      margin: '0 auto',
    }}>
      <h2 style={{
        fontSize: '2.25rem',
        fontWeight: 800,
        color: 'var(--text-main)',
        marginBottom: '0.85rem',
        letterSpacing: '-0.02em',
      }}>
        {t('cta_title')}
      </h2>
      <p style={{
        fontSize: '1.08rem',
        color: 'var(--text-muted)',
        maxWidth: '620px',
        margin: '0 auto 2rem auto',
        lineHeight: 1.6,
      }}>
        {currentUser 
          ? t('cta_desc_user') 
          : t('cta_desc_guest')}
      </p>
      <button
        onClick={handleClick}
        className="btn"
        style={{
          background: 'linear-gradient(135deg, #0c2f27 0%, #185339 50%, #227349 100%)',
          color: '#ffffff',
          padding: '0.85rem 2rem',
          fontSize: '1.05rem',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {currentUser ? t('cta_btn_portal') : t('cta_btn_guest')} <ArrowRight size={18} />
      </button>
    </section>
  );
};
