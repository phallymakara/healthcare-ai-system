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
    <div className={modal.overlayClass} onClick={(e) => { if (e.target === e.currentTarget) modal.close(); }}>
      <div className={modal.cardClass} style={{ maxWidth: '520px', fontFamily: kmFont }}>
        <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)', fontFamily: kmFont }}>
            {t('doc_shifts_modal_title')}
          </h3>
          <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1.35rem', fontFamily: kmFont }}>
            {activeShiftDoc.full_name} ({activeShiftDoc.specialty})
          </div>

          <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', fontFamily: kmFont }}>
                {t('doc_shift_days_label')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.55rem' }}>
                {DAY_DEFS.map((day) => {
                  const checked = selectedDays.includes(day.dayIndex);
                  return (
                    <button
                      type="button"
                      key={day.dayIndex}
                      onClick={() => onToggleDay(day.dayIndex)}
                      style={{
                        padding: '0.6rem 0.4rem',
                        fontSize: '0.92rem',
                        fontWeight: checked ? 700 : 500,
                        background: checked ? 'var(--accent-primary)' : 'transparent',
                        border: checked ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-full)',
                        color: checked ? '#ffffff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        fontFamily: kmFont,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {t(day.fullKey)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                  {t('doc_shift_start')}
                </label>
                <input
                  type="time"
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1.15rem',
                    fontSize: '0.98rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                  {t('doc_shift_end')}
                </label>
                <input
                  type="time"
                  value={shiftEndTime}
                  onChange={(e) => setShiftEndTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1.15rem',
                    fontSize: '0.98rem',
                    borderRadius: 'var(--radius-full)',
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
              <div style={{ color: '#dc2626', fontSize: '0.88rem', fontFamily: kmFont }}>
                {shiftSubmitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.65rem' }}>
              <button
                type="button"
                onClick={modal.close}
                style={{
                  flex: 1,
                  padding: '0.7rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 500,
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                  transition: 'all 0.15s ease',
                }}
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={shiftLoading}
                style={{
                  flex: 1,
                  padding: '0.7rem 1.25rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--text-main)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                  transition: 'all 0.15s ease',
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
