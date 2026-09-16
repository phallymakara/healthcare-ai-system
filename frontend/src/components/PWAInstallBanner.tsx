import React, { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PWAInstallBanner: React.FC = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already running in installed / standalone mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (standaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Check dismissal timestamp (don't re-prompt within 5 days if user dismissed)
    const dismissedAt = localStorage.getItem('health_pwa_install_dismissed');
    if (dismissedAt) {
      const daysPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysPassed < 5) {
        return;
      }
    }

    // Check if running on iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = ua.includes('safari') && !ua.includes('crios') && !ua.includes('fxios');

    if (isIosDevice && isSafari) {
      setIsIOS(true);
      setShowBanner(true);
    }

    // Capture Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('health_pwa_install_dismissed', Date.now().toString());
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      <div
        className="notification-banner-animate"
        style={{
          position: 'fixed',
          bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          width: 'calc(100% - 2rem)',
          maxWidth: '480px',
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(24, 83, 57, 0.4)',
          borderRadius: '16px',
          padding: '0.85rem 1rem',
          boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.6), 0 0 20px rgba(24, 83, 57, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
        }}
      >
        <img
          src="/pwa-192x192.png"
          alt="Health AI"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            objectFit: 'cover',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.92rem',
              color: '#f8fafc',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {t('pwa_install_title')}
          </div>
          <div
            style={{
              fontSize: '0.76rem',
              color: '#94a3b8',
              lineHeight: 1.35,
            }}
          >
            {t('pwa_install_desc')}
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          style={{
            background: 'linear-gradient(135deg, #185339, #059669)',
            border: 'none',
            borderRadius: '9px',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.82rem',
            padding: '0.5rem 0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(24, 83, 57, 0.4)',
            transition: 'opacity 0.2s',
          }}
        >
          {isIOS ? <Share size={14} /> : <Download size={14} />}
          <span>{isIOS ? t('pwa_ios_guide_btn') : t('pwa_install_btn')}</span>
        </button>

        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#0f172a',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.5rem',
              color: '#f8fafc',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              marginBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <img src="/pwa-192x192.png" alt="" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                  {t('pwa_ios_guide_title')}
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <ol style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', lineHeight: '1.7', color: '#cbd5e1', margin: '0 0 1.25rem 0' }}>
              <li>
                {t('pwa_ios_step1')}{' '}
                <Share size={15} style={{ display: 'inline', verticalAlign: 'middle', color: '#38bdf8' }} />
              </li>
              <li>{t('pwa_ios_step2')}</li>
              <li>{t('pwa_ios_step3')}</li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                width: '100%',
                padding: '0.7rem',
                background: 'linear-gradient(135deg, #185339, #059669)',
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              {t('pwa_ios_got_it')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
