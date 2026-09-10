import React from 'react';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const FooterSection: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer
      id="landing-footer"
      style={{
        width: '100%',
        background: '#ffffff',
        borderTop: '1px solid rgba(16, 185, 129, 0.22)',
        padding: '1.75rem 0',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          width: '100%',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        {/* Navigation Links matching reference (ទំនាក់ទំនង, គោលការណ៍) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2.5rem',
          }}
        >
          <a
            href="#contact"
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#334155',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#334155';
            }}
          >
            {t('footer_contact')}
          </a>

          <a
            href="#policy"
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: '#334155',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#334155';
            }}
          >
            {t('footer_policy')}
          </a>
        </div>

        {/* Social Icons matching reference (Facebook, Instagram, YouTube) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
          }}
        >
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              color: '#334155',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#1877f2';
              e.currentTarget.style.transform = 'scale(1.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#334155';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Facebook size={22} fill="currentColor" strokeWidth={0} />
          </a>

          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              color: '#334155',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#e1306c';
              e.currentTarget.style.transform = 'scale(1.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#334155';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Instagram size={22} strokeWidth={2.2} />
          </a>

          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              color: '#334155',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ff0000';
              e.currentTarget.style.transform = 'scale(1.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#334155';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Youtube size={23} strokeWidth={2.2} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
