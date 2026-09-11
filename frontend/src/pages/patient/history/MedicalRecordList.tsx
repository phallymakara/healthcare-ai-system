import React from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Search,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  formatFacilityName,
  formatDepartmentName,
  formatDoctorName,
} from '../../../i18n/formatters';
import { MedicalRecord } from './types';

interface MedicalRecordListProps {
  records: MedicalRecord[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: 'ALL' | 'COMPLETED' | 'CANCELLED';
  setStatusFilter: (status: 'ALL' | 'COMPLETED' | 'CANCELLED') => void;
  searchError: string | null;
  setSearchError: (err: string | null) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onSelectRecord: (record: MedicalRecord) => void;
  onExploreHospitals?: () => void;
}

export const MedicalRecordList: React.FC<MedicalRecordListProps> = ({
  records,
  loading,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  searchError,
  setSearchError,
  onSearchSubmit,
  onSelectRecord,
  onExploreHospitals,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer), sans-serif' : 'inherit';

  const formatRoom = (room?: string) => {
    if (!room) return '';
    const cleanNum = room.replace(/^(room|បន្ទប់)\s*/i, '').trim();
    return isKm ? `បន្ទប់ ${cleanNum}` : `Room ${cleanNum}`;
  };

  return (
    <div>
      {/* Header & Search Bar Placed Directly Underneath */}
      <div style={{ marginBottom: '1.6rem' }}>
        <form
          onSubmit={onSearchSubmit}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: '620px',
            marginBottom: '1rem',
          }}
        >
          <input
            type="text"
            className="input-search-rounded"
            placeholder={t('history_search_placeholder')}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchError(null);
            }}
            style={{
              width: '100%',
              padding: '0.74rem 7.5rem 0.74rem 1.35rem',
              fontSize: '0.94rem',
              border: searchError ? '1px solid #dc2626' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              outline: 'none',
              fontFamily: kmFont,
              background: '#ffffff',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              position: 'absolute',
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              padding: '0.52rem 1.15rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              borderRadius: 'var(--radius-full)',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          >
            <Search size={15} />
            <span>{isKm ? 'ស្វែងរក' : 'Search'}</span>
          </button>
        </form>

        {searchError && (
          <div
            style={{
              fontSize: '0.85rem',
              color: '#dc2626',
              marginBottom: '1rem',
              fontFamily: kmFont,
            }}
          >
            {searchError}
          </div>
        )}

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {(['ALL', 'COMPLETED', 'CANCELLED'] as const).map((filter) => {
            const labelKey =
              filter === 'ALL'
                ? 'history_filter_all'
                : filter === 'COMPLETED'
                ? 'history_filter_completed'
                : 'history_filter_cancelled';

            const active = statusFilter === filter;
            return (
              <button
                type="button"
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`history-filter-pill ${active ? 'active' : ''}`}
                style={{
                  padding: '0.42rem 0.95rem',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 500,
                  border: active ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-full)',
                  background: active ? 'var(--accent-primary)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                {t(labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Records List View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)', fontSize: '1rem' }}>
          <RefreshCw size={24} className="spin" color="var(--accent-primary)" style={{ margin: '0 auto 0.75rem auto' }} />
          <div>{isKm ? 'កំពុងទាញយកប្រវត្តិពិគ្រោះជំងឺ...' : 'Loading medical history records...'}</div>
        </div>
      ) : records.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: 'none',
          }}
        >
          <FileText size={42} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: '0 0 0.5rem 0',
              fontFamily: kmFont,
            }}
          >
            {t('history_no_records_title')}
          </h3>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-muted)',
              maxWidth: '520px',
              margin: '0 auto 1.5rem auto',
              lineHeight: 1.6,
              fontFamily: kmFont,
            }}
          >
            {t('history_no_records_desc')}
          </p>
          {onExploreHospitals && (
            <button
              type="button"
              onClick={onExploreHospitals}
              style={{
                padding: '0.55rem 1.35rem',
                fontSize: '0.94rem',
                fontWeight: 600,
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                background: 'transparent',
                color: 'var(--text-main)',
                cursor: 'pointer',
                boxShadow: 'none',
                fontFamily: kmFont,
              }}
            >
              {t('appt_book_now')}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {records.map((rec) => {
            const isCompleted = rec.status === 'COMPLETED';

            return (
              <div
                key={rec.id}
                className="patient-record-card"
                onClick={() => onSelectRecord(rec)}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.15rem 1.45rem',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: kmFont,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
                  {/* Hospital Circular Logo */}
                  {rec.hospital_logo_url ? (
                    <img
                      src={rec.hospital_logo_url}
                      alt={rec.hospital_name}
                      style={{
                        width: '54px',
                        height: '54px',
                        minWidth: '54px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid var(--border-color)',
                        background: '#ffffff',
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '54px',
                        height: '54px',
                        minWidth: '54px',
                        borderRadius: '50%',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#ffffff',
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: 'var(--text-main)',
                        flexShrink: 0,
                      }}
                    >
                      {rec.hospital_name
                        ? rec.hospital_name
                            .split(' ')
                            .map((w) => w[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()
                        : <Building2 size={24} color="var(--text-muted)" />}
                    </div>
                  )}

                  {/* Content details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flex: 1 }}>
                    {/* Hospital Name + Status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.06rem', color: 'var(--text-main)', fontFamily: kmFont }}>
                        {formatFacilityName(rec.hospital_name, language)}
                      </span>
                      <span
                        style={{
                          fontSize: '0.84rem',
                          fontWeight: 600,
                          color: isCompleted ? '#16a34a' : '#dc2626',
                          fontFamily: kmFont,
                        }}
                      >
                        • {isCompleted ? (isKm ? 'បានបញ្ចប់' : 'Completed') : (isKm ? 'បានលុបចោល' : 'Cancelled')}
                      </span>
                    </div>

                    {/* Department • Doctor • Room */}
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: kmFont, lineHeight: 1.5 }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                        {formatDepartmentName(rec.department_name, language)}
                      </span>
                      {rec.doctor_name && (
                        <>
                          {' • '}
                          <span>{formatDoctorName(rec.doctor_name, language)}</span>
                        </>
                      )}
                      {rec.room_number && (
                        <>
                          {' • '}
                          <span>{formatRoom(rec.room_number)}</span>
                        </>
                      )}
                    </div>

                    {/* Visited Date & Duration */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.86rem',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        <span>{rec.visited_date}</span>
                      </span>
                      {rec.duration_minutes > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} color="var(--text-muted)" />
                          <span>{rec.duration_minutes} {t('history_mins')}</span>
                        </span>
                      )}
                    </div>

                    {/* Primary Diagnosis & Quick Indicators */}
                    {isCompleted && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.84rem',
                            fontWeight: 600,
                            color: 'var(--text-main)',
                            fontFamily: kmFont,
                          }}
                        >
                          {t('history_diagnosis')}: {isKm ? rec.diagnosis.condition_km : rec.diagnosis.condition_en}
                        </span>
                        {rec.prescriptions.length > 0 && (
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                            • {rec.prescriptions.length} {isKm ? 'វេជ្ជបញ្ជា' : 'Prescriptions'}
                          </span>
                        )}
                        {rec.billing.total_paid > 0 && (
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                            • ${rec.billing.total_paid.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
