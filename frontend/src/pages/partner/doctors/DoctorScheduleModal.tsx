import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useModalClose } from '../../../hooks/useModalClose';
import { DAY_DEFS } from './types';

interface DoctorScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShiftDoc: any | null;
  selectedDays: number[];
  onToggleDay: (dayIndex: number) => void;
  shiftStartTime: string;
  setShiftStartTime: (val: string) => void;
  shiftEndTime: string;
  setShiftEndTime: (val: string) => void;
  shiftSubmitError: string | null;
  shiftLoading: boolean;
  onSave: (e: React.FormEvent) => void;
}

export const DoctorScheduleModal: React.FC<DoctorScheduleModalProps> = ({
  isOpen,
  onClose,
  activeShiftDoc,
  selectedDays,
  onToggleDay,
  shiftStartTime,
  setShiftStartTime,
  shiftEndTime,
  setShiftEndTime,
  shiftSubmitError,
  shiftLoading,
  onSave,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const modal = useModalClose(isOpen, (open) => {
    if (!open) onClose();
  });

  if (!modal.shouldRender || !activeShiftDoc) return null;

  return (
    <div
      className={modal.overlayClass}
      style={{
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none',
        background: 'transparent',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) modal.close();
      }}
    >
      <div
        className={modal.cardClass}
        style={{
          width: '94%',
          maxWidth: '460px',
          fontFamily: kmFont,
          borderRadius: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          background: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <div className="responsive-modal-body" style={{ padding: '1.45rem 1.6rem' }}>
          <h3 style={{ fontSize: '1.22rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--text-main)', fontFamily: kmFont }}>
            {t('doc_shifts_modal_title')}
          </h3>
          <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '1.15rem', fontFamily: kmFont }}>
            {activeShiftDoc.full_name} ({activeShiftDoc.specialty})
          </div>

          <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                {t('doc_shift_days_label')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {DAY_DEFS.map((day) => {
                  const checked = selectedDays.includes(day.dayIndex);
                  return (
                    <button
                      type="button"
                      key={day.dayIndex}
                      onClick={() => onToggleDay(day.dayIndex)}
                      style={{
                        padding: '0.55rem 0.35rem',
                        fontSize: '0.86rem',
                        fontWeight: checked ? 700 : 500,
                        background: checked ? 'var(--accent-primary)' : 'transparent',
                        border: checked ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: '22px',
                        color: checked ? '#ffffff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        fontFamily: kmFont,
                      }}
                    >
                      {t(day.fullKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                  {t('doc_shift_start')}
                </label>
                <input
                  type="time"
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    fontSize: '0.92rem',
                    borderRadius: '22px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                  {t('doc_shift_end')}
                </label>
                <input
                  type="time"
                  value={shiftEndTime}
                  onChange={(e) => setShiftEndTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    fontSize: '0.92rem',
                    borderRadius: '22px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
              </div>
            </div>

            {shiftSubmitError && (
              <div style={{ color: '#dc2626', fontSize: '0.82rem', paddingLeft: '0.5rem', fontFamily: kmFont }}>
                {shiftSubmitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={modal.close}
                style={{
                  flex: 1,
                  padding: '0.68rem 1.15rem',
                  fontSize: '0.94rem',
                  fontWeight: 500,
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '22px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={shiftLoading}
                style={{
                  flex: 1,
                  padding: '0.68rem 1.15rem',
                  fontSize: '0.94rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--text-main)',
                  borderRadius: '22px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                {t('doc_save_shifts')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
