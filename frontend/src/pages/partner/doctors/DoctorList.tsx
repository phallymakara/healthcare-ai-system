import React from 'react';
import { Camera, RefreshCw, UserCheck } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { DAY_DEFS } from './types';

interface DoctorListProps {
  doctors: any[];
  departments: any[];
  activeDropdownDocId: string | null;
  setActiveDropdownDocId: (id: string | null) => void;
  hoveredAvatarDocId: string | null;
  setHoveredAvatarDocId: (id: string | null) => void;
  rowUploadingDocId: string | null;
  rowUploadError: { docId: string; message: string } | null;
  onTriggerRowPhotoUpload: (docId: string) => void;
  onRowPhotoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rowPhotoInputRef: React.RefObject<HTMLInputElement>;
  onToggleAvailable: (doc: any) => void;
  onEdit: (doc: any) => void;
  onOpenShifts: (doc: any) => void;
  onDelete: (docId: string) => void;
}

export const DoctorList: React.FC<DoctorListProps> = ({
  doctors,
  departments,
  activeDropdownDocId,
  setActiveDropdownDocId,
  hoveredAvatarDocId,
  setHoveredAvatarDocId,
  rowUploadingDocId,
  rowUploadError,
  onTriggerRowPhotoUpload,
  onRowPhotoFileChange,
  rowPhotoInputRef,
  onToggleAvailable,
  onEdit,
  onOpenShifts,
  onDelete,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  if (doctors.length === 0) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '1.1rem',
          lineHeight: 1.7,
          fontFamily: kmFont,
          background: 'transparent',
          border: 'none',
        }}
      >
        <div style={{ maxWidth: '520px' }}>{t('doc_no_doctors')}</div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden file input for table row avatar clicks */}
      <input
        type="file"
        ref={rowPhotoInputRef}
        accept="image/*"
        onChange={onRowPhotoFileChange}
        style={{ display: 'none' }}
      />
      <div
        style={{
          background: 'transparent',
          border: 'none',
          borderRadius: 0,
          overflow: 'visible',
          boxShadow: 'none',
        }}
      >
        {doctors.map((doc) => {
          const deptObj = departments.find((d) => d.id === doc.department_id);
          const scheduleDays = (doc.schedules || []).map((s: any) => s.day_of_week);

          return (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '0.85rem 0',
                borderBottom: '1px solid var(--border-color)',
                background: 'transparent',
                position: 'relative',
                zIndex: activeDropdownDocId === doc.id ? 50 : 1,
              }}
            >
              {/* Doctor Info Column with Avatar */}
              <div style={{ minWidth: '260px', flex: '1.5', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  onClick={() => onTriggerRowPhotoUpload(doc.id)}
                  onMouseEnter={() => setHoveredAvatarDocId(doc.id)}
                  onMouseLeave={() => setHoveredAvatarDocId(null)}
                  title={isKm ? 'ចុចដើម្បីប្តូររូបថត' : 'Click to change photo'}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: hoveredAvatarDocId === doc.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    background: '#f8fafc',
                    cursor: rowUploadingDocId === doc.id ? 'wait' : 'pointer',
                    position: 'relative',
                    transition: 'border-color 0.15s ease',
                  }}
                >
                  {rowUploadingDocId === doc.id ? (
                    <RefreshCw size={18} className="spin" color="var(--accent-primary)" />
                  ) : doc.photo_url ? (
                    <>
                      <img
                        src={doc.photo_url}
                        alt={doc.full_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                      {hoveredAvatarDocId === doc.id && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Camera size={16} color="#ffffff" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {hoveredAvatarDocId === doc.id ? (
                        <Camera size={18} color="var(--accent-primary)" />
                      ) : (
                        <UserCheck size={20} color="var(--accent-primary)" />
                      )}
                    </>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: '1.28rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont, lineHeight: 1.25 }}>
                    {doc.full_name}
                  </div>
                  <div style={{ fontSize: '1.02rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                    {deptObj ? deptObj.name : t('doc_general')} • {doc.specialty}
                  </div>
                  {rowUploadError && rowUploadError.docId === doc.id && (
                    <span style={{ fontSize: '0.82rem', color: '#dc2626', fontFamily: kmFont, display: 'block', marginTop: '2px' }}>
                      {rowUploadError.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Station Column */}
              <div style={{ minWidth: '180px', flex: '1' }}>
                <div style={{ fontSize: '1.12rem', color: 'var(--text-main)', fontWeight: 600, fontFamily: kmFont, lineHeight: 1.25 }}>
                  {doc.room_number || t('doc_general_outpatient')}
                </div>
              </div>

              {/* Weekly Working Days Column */}
              <div style={{ minWidth: '240px', flex: '1.2' }}>
                <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px', fontFamily: kmFont }}>
                  {t('doc_weekly_working_days')}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {DAY_DEFS.map((day) => {
                    const isScheduled = scheduleDays.includes(day.dayIndex);
                    return (
                      <span
                        key={day.dayIndex}
                        style={{
                          padding: '0.15rem 0.45rem',
                          border: isScheduled ? '1px solid var(--text-main)' : '1px solid var(--border-color)',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: isScheduled ? 600 : 400,
                          color: isScheduled ? 'var(--text-main)' : 'var(--text-muted)',
                          background: 'transparent',
                          fontFamily: kmFont,
                        }}
                      >
                        {t(day.labelKey)}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Actions Column: Three-dot dropdown menu */}
              <div style={{ position: 'relative', zIndex: activeDropdownDocId === doc.id ? 60 : 'auto' }}>
                <button
                  onClick={() => setActiveDropdownDocId(activeDropdownDocId === doc.id ? null : doc.id)}
                  style={{
                    width: '32px',
                    height: '32px',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    letterSpacing: '1px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    lineHeight: 1,
                  }}
                >
                  ···
                </button>

                {activeDropdownDocId === doc.id && (
                  <>
                    <div
                      onClick={() => setActiveDropdownDocId(null)}
                      style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 99,
                        background: 'transparent',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 4px)',
                        background: 'var(--bg-primary, #ffffff)',
                        border: 'none',
                        borderRadius: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: '140px',
                        zIndex: 100,
                        boxShadow: 'none',
                      }}
                    >
                      <button
                        onClick={() => onToggleAvailable(doc)}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        style={{
                          padding: '0.5rem 0.8rem',
                          fontSize: '0.92rem',
                          fontWeight: 500,
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          color: doc.is_available ? '#059669' : 'var(--text-muted)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          fontFamily: kmFont,
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        {doc.is_available ? t('doc_active') : t('doc_inactive')}
                      </button>
                      <button
                        onClick={() => {
                          setActiveDropdownDocId(null);
                          onEdit(doc);
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        style={{
                          padding: '0.5rem 0.8rem',
                          fontSize: '0.92rem',
                          fontWeight: 500,
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          fontFamily: kmFont,
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        {t('doc_edit')}
                      </button>
                      <button
                        onClick={() => {
                          setActiveDropdownDocId(null);
                          onOpenShifts(doc);
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        style={{
                          padding: '0.5rem 0.8rem',
                          fontSize: '0.92rem',
                          fontWeight: 500,
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          fontFamily: kmFont,
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        {t('doc_manage_shifts')}
                      </button>
                      <button
                        onClick={() => onDelete(doc.id)}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                        style={{
                          padding: '0.5rem 0.8rem',
                          fontSize: '0.92rem',
                          fontWeight: 500,
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          fontFamily: kmFont,
                          transition: 'opacity 0.15s ease',
                        }}
                      >
                        {t('doc_delete')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
