import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useModalClose } from '../../../hooks/useModalClose';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDeptId: string | null;
  deptName: string;
  setDeptName: (val: string) => void;
  deptCode: string;
  setDeptCode: (val: string) => void;
  deptMinutes: number;
  setDeptMinutes: (val: number) => void;
  deptFloorRoom: string;
  setDeptFloorRoom: (val: string) => void;
  deptDescription: string;
  setDeptDescription: (val: string) => void;
  deptIsActive: boolean;
  setDeptIsActive: (val: boolean) => void;
  deptNameError: string | null;
  deptCodeError: string | null;
  deptSubmitError: string | null;
  deptLoading: boolean;
  onSave: (e: React.FormEvent) => void;
}

export const DepartmentModal: React.FC<DepartmentModalProps> = ({
  isOpen,
  onClose,
  editingDeptId,
  deptName,
  setDeptName,
  deptCode,
  setDeptCode,
  deptMinutes,
  setDeptMinutes,
  deptIsActive,
  setDeptIsActive,
  deptNameError,
  deptCodeError,
  deptSubmitError,
  deptLoading,
  onSave,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const modal = useModalClose(isOpen, (open) => {
    if (!open) onClose();
  });

  if (!modal.shouldRender) return null;

  return (
    <div className={modal.overlayClass} onClick={(e) => { if (e.target === e.currentTarget) modal.close(); }}>
      <div className={modal.cardClass} style={{ maxWidth: '520px', fontFamily: kmFont }}>
        <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 1.4rem 0', color: 'var(--text-main)', fontFamily: kmFont }}>
            {editingDeptId ? t('dept_modal_edit_dept') : t('dept_modal_add_dept')}
          </h3>

          <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                {t('dept_name_label')}
              </label>
              <input
                type="text"
                placeholder={t('dept_name_placeholder')}
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.98rem',
                  borderRadius: 'var(--radius-full)',
                  border: deptNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  boxShadow: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: kmFont,
                }}
              />
              {deptNameError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                  {deptNameError}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                {t('dept_code_label')}
              </label>
              <input
                type="text"
                placeholder={t('dept_code_placeholder')}
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.98rem',
                  borderRadius: 'var(--radius-full)',
                  border: deptCodeError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  boxShadow: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: kmFont,
                }}
              />
              {deptCodeError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                  {deptCodeError}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                {t('dept_duration_label')}
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={deptMinutes}
                onChange={(e) => setDeptMinutes(Number(e.target.value))}
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
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                {t('dept_duration_hint')}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="deptActiveCheck"
                checked={deptIsActive}
                onChange={(e) => setDeptIsActive(e.target.checked)}
              />
              <label htmlFor="deptActiveCheck" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer', fontFamily: kmFont }}>
                {t('dept_active_check')}
              </label>
            </div>

            {deptSubmitError && (
              <div style={{ color: '#dc2626', fontSize: '0.85rem', fontFamily: kmFont }}>
                {deptSubmitError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={modal.close}
                style={{
                  flex: 1,
                  padding: '0.7rem 1.25rem',
                  fontSize: '0.98rem',
                  fontWeight: 500,
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
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
                disabled={deptLoading}
                style={{
                  flex: 1,
                  padding: '0.7rem 1.25rem',
                  fontSize: '0.98rem',
                  fontWeight: 600,
                  background: 'transparent',
                  border: '1px solid var(--text-main)',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                {editingDeptId ? t('dept_save_btn') : t('dept_create_btn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
