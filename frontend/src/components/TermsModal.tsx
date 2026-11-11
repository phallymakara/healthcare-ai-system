import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useModalClose } from '../hooks/useModalClose';

export type TermsAudience = 'patient' | 'partner';

export interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'view' | 'accept';
  audience: TermsAudience;
  allowAudienceSwitch?: boolean;
  onAccept?: () => Promise<void> | void;
  onSignOut?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  mode = 'view',
  audience,
  allowAudienceSwitch = false,
  onAccept,
  onSignOut,
  loading = false,
  error = null,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [activeAudience, setActiveAudience] = useState<TermsAudience>(audience);
  const [checkedInAcceptMode, setCheckedInAcceptMode] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveAudience(audience);
      setCheckedInAcceptMode(false);
      setLocalError(null);
    }
  }, [isOpen, audience]);

  const { isClosing, close } = useModalClose(isOpen, (open) => {
    if (!open && mode === 'view') {
      onClose();
    }
  });

  useEffect(() => {
    if (!isOpen || mode !== 'view') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isClosing) {
        close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, mode, isClosing, close]);

  if (!isOpen && !isClosing) {
    return null;
  }

  const isPatient = activeAudience === 'patient';
  const sections = isPatient
    ? [
        { title: t('terms_patient_s1_title'), body: t('terms_patient_s1_body') },
        { title: t('terms_patient_s2_title'), body: t('terms_patient_s2_body') },
        { title: t('terms_patient_s3_title'), body: t('terms_patient_s3_body') },
        { title: t('terms_patient_s4_title'), body: t('terms_patient_s4_body') },
      ]
    : [
        { title: t('terms_partner_s1_title'), body: t('terms_partner_s1_body') },
        { title: t('terms_partner_s2_title'), body: t('terms_partner_s2_body') },
        { title: t('terms_partner_s3_title'), body: t('terms_partner_s3_body') },
        { title: t('terms_partner_s4_title'), body: t('terms_partner_s4_body') },
      ];

  const handleConfirmAccept = async () => {
    if (!checkedInAcceptMode) {
      setLocalError(t('terms_required_error'));
      return;
    }
    setLocalError(null);
    await onAccept?.();
  };

  const displayError = error || localError;

  return (
    <div
      className={`responsive-modal-overlay modal-backdrop-animate ${isClosing ? 'modal-closing' : ''}`}
      onClick={mode === 'view' ? close : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100005,
        padding: '1rem',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`responsive-modal-content modal-animate ${isClosing ? 'modal-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'none',
          overflow: 'hidden',
          fontFamily: kmFont,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.1rem 1.4rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {isPatient ? t('terms_patient_title') : t('terms_partner_title')}
              </h2>
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.12rem 0.55rem',
                }}
              >
                {t('terms_version_badge')}
              </span>
            </div>
            {mode === 'accept' && (
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {isPatient ? t('terms_blocking_subtitle_patient') : t('terms_blocking_subtitle_partner')}
              </p>
            )}
          </div>

          {mode === 'view' && (
            <button
              type="button"
              onClick={close}
              aria-label={t('terms_close_btn')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Optional Audience Tabs (for public Policy viewer) */}
        {allowAudienceSwitch && (
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              padding: '0.75rem 1.4rem 0 1.4rem',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            {(['patient', 'partner'] as TermsAudience[]).map((tabKey) => {
              const active = activeAudience === tabKey;
              return (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setActiveAudience(tabKey)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    padding: '0.5rem 0.25rem',
                    marginRight: '0.75rem',
                    fontSize: '0.88rem',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontFamily: kmFont,
                  }}
                >
                  {tabKey === 'patient' ? t('terms_tab_patient') : t('terms_tab_partner')}
                </button>
              );
            })}
          </div>
        )}

        {/* Scrollable Clauses */}
        <div
          style={{
            padding: '1.2rem 1.4rem',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.95rem',
            lineHeight: isKm ? 1.75 : 1.58,
          }}
        >
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {isPatient ? t('terms_patient_intro') : t('terms_partner_intro')}
          </p>

          {sections.map((section) => (
            <div
              key={section.title}
              style={{
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {section.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.4rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {mode === 'accept' && (
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.55rem',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                  color: 'var(--text-main)',
                }}
              >
                <input
                  type="checkbox"
                  checked={checkedInAcceptMode}
                  onChange={(e) => {
                    setCheckedInAcceptMode(e.target.checked);
                    if (e.target.checked) setLocalError(null);
                  }}
                  style={{
                    marginTop: '3px',
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--accent-primary)',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                />
                <span>
                  {t('terms_checkbox_prefix')}
                  <strong>{isPatient ? t('terms_patient_link_label') : t('terms_partner_link_label')}</strong>
                </span>
              </label>
              {displayError && (
                <span className="error-text" style={{ display: 'block', fontSize: '0.82rem', marginTop: '0.4rem' }}>
                  {displayError}
                </span>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', flexWrap: 'wrap' }}>
            {mode === 'accept' ? (
              <>
                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    disabled={loading}
                    style={{
                      padding: '0.55rem 1.1rem',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-color)',
                      background: '#ffffff',
                      color: 'var(--text-main)',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontFamily: kmFont,
                    }}
                  >
                    {t('terms_sign_out_btn')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleConfirmAccept}
                  disabled={loading}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.75 : 1,
                    fontFamily: kmFont,
                  }}
                >
                  {loading ? t('terms_accepting_btn') : t('terms_accept_btn')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={close}
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  background: '#ffffff',
                  color: 'var(--text-main)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                }}
              >
                {t('terms_close_btn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;

