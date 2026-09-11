import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useModalClose } from '../../../hooks/useModalClose';

interface CancelTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export const CancelTicketModal: React.FC<CancelTicketModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer), sans-serif' : 'inherit';

  const modal = useModalClose(isOpen, (open) => {
    if (!open) onClose();
  });

  if (!modal.shouldRender) return null;

  return (
    <div
      className={modal.overlayClass}
      onClick={(e) => {
        if (e.target === e.currentTarget) modal.close();
      }}
    >
      <div
        className={modal.cardClass}
        style={{
          maxWidth: '440px',
          fontFamily: kmFont,
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          boxShadow: 'none',
          padding: '1.75rem',
        }}
      >
        <h4
          style={{
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--text-main)',
            margin: '0 0 0.65rem 0',
            fontFamily: kmFont,
          }}
        >
          {t('appt_cancel_btn')}
        </h4>
        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            margin: '0 0 1.5rem 0',
            fontFamily: kmFont,
          }}
        >
          {t('appt_cancel_confirm')}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            type="button"
            onClick={modal.close}
            disabled={loading}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: 'var(--text-main)',
              cursor: 'pointer',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          >
            {isKm ? 'ថយក្រោយ' : 'Keep Booking'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              background: 'transparent',
              border: '1px solid #dc2626',
              borderRadius: '4px',
              color: '#dc2626',
              cursor: 'pointer',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          >
            {loading ? (
              <RefreshCw size={14} className="spin" />
            ) : isKm ? (
              'បញ្ជាក់ការលុបចោល'
            ) : (
              'Confirm Cancel'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
