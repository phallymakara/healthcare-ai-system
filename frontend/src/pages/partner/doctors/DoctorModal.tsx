import React, { useRef } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { useModalClose } from '../../../hooks/useModalClose';

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingDocId: string | null;
  departments: any[];
  docDeptId: string;
  setDocDeptId: (val: string) => void;
  docFullName: string;
  setDocFullName: (val: string) => void;
  docSpecialty: string;
  setDocSpecialty: (val: string) => void;
  docRoom: string;
  setDocRoom: (val: string) => void;
  docLicense: string;
  setDocLicense: (val: string) => void;
  docMinutes: number;
  setDocMinutes: (val: number) => void;
  docPhotoUrl: string;
  docUploadingPhoto: boolean;
  docPhotoError: string | null;
  docNameError: string | null;
  docSpecialtyError: string | null;
  docDeptError: string | null;
  docSubmitError: string | null;
  docLoading: boolean;
  onPhotoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeletePhoto: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const DoctorModal: React.FC<DoctorModalProps> = ({
  isOpen,
  onClose,
  editingDocId,
  departments,
  docDeptId,
  setDocDeptId,
  docFullName,
  setDocFullName,
  docSpecialty,
  setDocSpecialty,
  docLicense,
  setDocLicense,
  docPhotoUrl,
  docUploadingPhoto,
  docPhotoError,
  docNameError,
  docSpecialtyError,
  docDeptError,
  docSubmitError,
  docLoading,
  onPhotoFileChange,
  onDeletePhoto,
  onSave,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modal = useModalClose(isOpen, (open) => {
    if (!open) onClose();
  });

  if (!modal.shouldRender) return null;

  return (
    <div className={modal.overlayClass} onClick={(e) => { if (e.target === e.currentTarget) modal.close(); }}>
      <div className={modal.cardClass} style={{ maxWidth: '520px', fontFamily: kmFont }}>
        <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 1.35rem 0', color: 'var(--text-main)', fontFamily: kmFont }}>
            {editingDocId ? t('doc_modal_edit_title') : t('doc_modal_add_title')}
          </h3>

          <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Doctor Avatar Picker */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={onPhotoFileChange}
                style={{ display: 'none' }}
              />
              <div
                onClick={() => !docUploadingPhoto && fileInputRef.current?.click()}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  border: '1px dashed var(--border-color)',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: docUploadingPhoto ? 'not-allowed' : 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: 'none',
                  opacity: docUploadingPhoto ? 0.6 : 1,
                }}
                title={isKm ? 'ចុចដើម្បីប្តូររូបថត' : 'Click to change photo'}
              >
                {docUploadingPhoto ? (
                  <RefreshCw size={24} className="spin" color="var(--accent-primary)" />
                ) : docPhotoUrl ? (
                  <img
                    src={docPhotoUrl}
                    alt="Doctor Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
                    <Camera size={26} color="var(--accent-primary)" />
                    <span style={{ fontSize: '0.85rem', fontFamily: kmFont }}>{isKm ? 'រូបថត' : 'Photo'}</span>
                  </div>
                )}
              </div>

              {docPhotoUrl && (
                <button
                  type="button"
                  onClick={onDeletePhoto}
                  disabled={docUploadingPhoto}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: '0.88rem',
                    cursor: docUploadingPhoto ? 'not-allowed' : 'pointer',
                    marginTop: '4px',
                    fontFamily: kmFont,
                    textDecoration: 'underline',
                  }}
                >
                  {isKm ? 'លុបរូបចេញ' : 'Remove Photo'}
                </button>
              )}

              {docPhotoError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '4px', fontFamily: kmFont }}>
                  {docPhotoError}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                {t('doc_dept_label')}
              </label>
              <select
                value={docDeptId}
                onChange={(e) => setDocDeptId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.98rem',
                  borderRadius: 'var(--radius-full)',
                  border: docDeptError ? '1px solid #dc2626' : '1px solid var(--border-color)',
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
              {docDeptError && (
                <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
                  {docDeptError}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                {t('doc_name_label')}
              </label>
              <input
                type="text"
                placeholder={t('doc_name_placeholder')}
                value={docFullName}
                onChange={(e) => setDocFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.98rem',
                  borderRadius: 'var(--radius-full)',
                  border: docNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  boxShadow: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: kmFont,
                }}
              />
              {docNameError && (
                <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
                  {docNameError}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                {t('doc_specialty_label')}
              </label>
              <input
                type="text"
                placeholder={t('doc_specialty_placeholder')}
                value={docSpecialty}
                onChange={(e) => setDocSpecialty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 1.15rem',
                  fontSize: '0.98rem',
                  borderRadius: 'var(--radius-full)',
                  border: docSpecialtyError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                  boxShadow: 'none',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: kmFont,
                }}
              />
              {docSpecialtyError && (
                <div style={{ color: '#dc2626', fontSize: '0.88rem', marginTop: '4px', fontFamily: kmFont }}>
                  {docSpecialtyError}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', fontFamily: kmFont }}>
                {t('doc_license_label')}
              </label>
              <input
                type="text"
                placeholder="e.g. MED-CAM-8890"
                value={docLicense}
                onChange={(e) => setDocLicense(e.target.value)}
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

            {docSubmitError && (
              <div style={{ color: '#dc2626', fontSize: '0.88rem', fontFamily: kmFont }}>
                {docSubmitError}
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
                disabled={docLoading}
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
                {editingDocId ? t('doc_btn_save') : t('doc_btn_create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
