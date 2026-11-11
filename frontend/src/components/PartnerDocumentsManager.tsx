import React, { useRef, useState } from 'react';
import { FileText, Upload, Trash2, Eye, RefreshCw } from 'lucide-react';
import { AuthService } from '../services/auth';
import { API_BASE } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export type EnrollmentDocumentType =
  | 'MOH_LICENSE'
  | 'BUSINESS_REGISTRATION'
  | 'REPRESENTATIVE_ID'
  | 'OTHER';

export interface HospitalDocumentItem {
  id: string;
  hospital_id: string;
  document_type: EnrollmentDocumentType;
  original_filename: string;
  content_type: string;
  file_size: number;
  created_at: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MAX_DOC_BYTES = 10 * 1024 * 1024;

export function getDocumentTypeLabel(
  docType: EnrollmentDocumentType | string,
  t: (key: string) => string
): string {
  switch (docType) {
    case 'MOH_LICENSE':
      return t('doc_type_moh_license');
    case 'BUSINESS_REGISTRATION':
      return t('doc_type_business_reg');
    case 'REPRESENTATIVE_ID':
      return t('doc_type_rep_id');
    default:
      return t('doc_type_other');
  }
}

export function formatDocumentSize(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function openAuthenticatedDocument(
  endpointPath: string,
  filename?: string
): Promise<void> {
  const url = endpointPath.startsWith('http') ? endpointPath : `${API_BASE}${endpointPath}`;
  const res = await fetch(url, {
    headers: AuthService.getAuthHeaders(),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || 'Unable to load document');
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');
  if (!win) {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

interface PartnerDocumentsManagerProps {
  documents: HospitalDocumentItem[];
  onDocumentsChange: (docs: HospitalDocumentItem[]) => void;
  error?: string | null;
  onClearError?: () => void;
}

export const PartnerDocumentsManager: React.FC<PartnerDocumentsManagerProps> = ({
  documents,
  onDocumentsChange,
  error = null,
  onClearError,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedType, setSelectedType] = useState<EnrollmentDocumentType>('MOH_LICENSE');
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLocalError(null);
    onClearError?.();

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      setLocalError(t('doc_invalid_type_error'));
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      setLocalError(t('doc_max_size_error'));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', selectedType);

      const res = await fetch(`${API_BASE}/partners/profile/documents`, {
        method: 'POST',
        headers: AuthService.getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || t('doc_invalid_type_error'));
      }

      const uploaded: HospitalDocumentItem = await res.json();
      onDocumentsChange([uploaded, ...documents]);
    } catch (err: any) {
      setLocalError(err?.message || t('doc_invalid_type_error'));
    } finally {
      setUploading(false);
    }
  };

  const handleView = async (doc: HospitalDocumentItem) => {
    setLocalError(null);
    setViewingId(doc.id);
    try {
      await openAuthenticatedDocument(
        `/partners/profile/documents/${doc.id}/download`,
        doc.original_filename
      );
    } catch (err: any) {
      setLocalError(err?.message || 'Unable to open document.');
    } finally {
      setViewingId(null);
    }
  };

  const handleDelete = async (doc: HospitalDocumentItem) => {
    if (documents.length <= 1) {
      setLocalError(t('doc_last_delete_error'));
      return;
    }
    setLocalError(null);
    setDeletingId(doc.id);
    try {
      const res = await fetch(`${API_BASE}/partners/profile/documents/${doc.id}`, {
        method: 'DELETE',
        headers: AuthService.getAuthHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || t('doc_last_delete_error'));
      }
      onDocumentsChange(documents.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      setLocalError(err?.message || t('doc_last_delete_error'));
    } finally {
      setDeletingId(null);
    }
  };

  const displayedError = localError || error;

  return (
    <div style={{ fontFamily: kmFont }}>
      {/* Upload Controls */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.85rem',
          alignItems: 'end',
          marginBottom: '0.65rem',
        }}
      >
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: '0.45rem',
            }}
          >
            {t('doc_type_label')} <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as EnrollmentDocumentType)}
            disabled={uploading}
            style={{
              width: '100%',
              padding: '0.78rem 0.95rem',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              fontSize: '0.94rem',
              color: 'var(--text-main)',
              background: 'var(--bg-primary, #ffffff)',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: kmFont,
            }}
          >
            <option value="MOH_LICENSE">{t('doc_type_moh_license')}</option>
            <option value="BUSINESS_REGISTRATION">{t('doc_type_business_reg')}</option>
            <option value="REPRESENTATIVE_ID">{t('doc_type_rep_id')}</option>
            <option value="OTHER">{t('doc_type_other')}</option>
          </select>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              border: `1.5px dashed ${displayedError ? '#dc2626' : 'var(--accent-primary)'}`,
              background: 'var(--bg-secondary, #f8fafc)',
              color: 'var(--accent-primary)',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontFamily: kmFont,
              boxShadow: 'none',
            }}
          >
            {uploading ? (
              <RefreshCw size={17} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Upload size={17} />
            )}
            <span>{uploading ? t('doc_uploading') : t('doc_upload_btn')}</span>
          </button>
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
        {t('doc_formats_hint')}
      </div>

      {displayedError && (
        <span
          className="error-text"
          style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.85rem', color: '#dc2626' }}
        >
          {displayedError}
        </span>
      )}

      {/* Uploaded Documents List */}
      {documents.length === 0 ? (
        <div
          style={{
            padding: '1rem',
            borderRadius: '12px',
            border: `1px solid ${displayedError ? '#dc2626' : 'var(--border-color)'}`,
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
            textAlign: 'center',
          }}
        >
          {t('doc_empty_state')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.7rem 0.9rem',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                background: 'var(--bg-primary, #ffffff)',
                boxShadow: 'none',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
                <FileText size={18} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {doc.original_filename}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {getDocumentTypeLabel(doc.document_type, t)} · {formatDocumentSize(doc.file_size)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={viewingId === doc.id}
                  onClick={() => handleView(doc)}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: viewingId === doc.id ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontFamily: kmFont,
                  }}
                >
                  <Eye size={14} />
                  <span>{t('doc_view_btn')}</span>
                </button>
                <button
                  type="button"
                  disabled={deletingId === doc.id}
                  onClick={() => handleDelete(doc)}
                  title={documents.length <= 1 ? t('doc_last_delete_error') : t('doc_delete_btn')}
                  style={{
                    padding: '0.35rem 0.7rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'transparent',
                    color: documents.length <= 1 ? 'var(--text-muted)' : '#dc2626',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: deletingId === doc.id ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: documents.length <= 1 ? 0.65 : 1,
                    fontFamily: kmFont,
                  }}
                >
                  <Trash2 size={14} />
                  <span>{t('doc_delete_btn')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PartnerDocumentsManager;

