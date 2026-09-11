import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { useModalClose } from '../../../hooks/useModalClose';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingSrvId: string | null;
  departments: any[];
  srvDeptId: string;
  setSrvDeptId: (val: string) => void;
  srvName: string;
  setSrvName: (val: string) => void;
  srvDuration: number;
  setSrvDuration: (val: number) => void;
  srvPrice: number;
  setSrvPrice: (val: number) => void;
  srvDescription: string;
  setSrvDescription: (val: string) => void;
  srvIsActive: boolean;
  setSrvIsActive: (val: boolean) => void;
  srvNameError: string | null;
  srvDeptError: string | null;
  srvSubmitError: string | null;
  srvLoading: boolean;
  onSave: (e: React.FormEvent) => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  editingSrvId,
  departments,
  srvDeptId,
  setSrvDeptId,
  srvName,
  setSrvName,
  srvDuration,
  setSrvDuration,
  srvPrice,
  setSrvPrice,
  srvDescription,
  setSrvDescription,
  srvIsActive,
  setSrvIsActive,
  srvNameError,
  srvDeptError,
  srvSubmitError,
  srvLoading,
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
            {editingSrvId ? t('dept_modal_edit_srv') : t('dept_modal_add_srv')}
          </h3>

          <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                {t('dept_srv_th_dept')}
              </label>
              <select
                value={srvDeptId}
                onChange={(e) => setSrvDeptId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.98rem',
                  borderRadius: 'var(--radius-full)',
                  border: srvDeptError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  boxShadow: 'none',
                  outline: 'none',
                  background: '#ffffff',
                  color: 'var(--text-main)',
                  boxSizing: 'border-box',
                  fontFamily: kmFont,
                }}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code || 'DEPT'})
                  </option>
                ))}
              </select>
              {srvDeptError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                  {srvDeptError}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                {t('dept_srv_name_label')}
              </label>
              <input
                type="text"
                placeholder={t('dept_srv_name_placeholder')}
                value={srvName}
                onChange={(e) => setSrvName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.98rem',
                  borderRadius: 'var(--radius-full)',
                  border: srvNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  boxShadow: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: kmFont,
                }}
              />
              {srvNameError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                  {srvNameError}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                  {t('dept_srv_duration_label')}
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={srvDuration}
                  onChange={(e) => setSrvDuration(Number(e.target.value))}
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
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                  {t('dept_srv_price_label')}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={srvPrice}
                  onChange={(e) => setSrvPrice(Number(e.target.value))}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                {t('dept_srv_desc_label')}
              </label>
              <textarea
                placeholder={t('dept_srv_desc_placeholder')}
                value={srvDescription}
                onChange={(e) => setSrvDescription(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.98rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'none',
                  fontFamily: kmFont,
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <input
                type="checkbox"
                id="srvActiveCheck"
                checked={srvIsActive}
                onChange={(e) => setSrvIsActive(e.target.checked)}
              />
              <label htmlFor="srvActiveCheck" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer', fontFamily: kmFont }}>
                {t('dept_srv_active_check')}
              </label>
            </div>

            {srvSubmitError && (
              <div style={{ color: '#dc2626', fontSize: '0.85rem', fontFamily: kmFont }}>
                {srvSubmitError}
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
                disabled={srvLoading}
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
                {editingSrvId ? t('dept_save_btn') : t('dept_create_btn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
