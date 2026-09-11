import React from 'react';
import { ArrowLeft, Check, Printer, Calendar } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import {
  formatFacilityName,
  formatDepartmentName,
  formatDoctorName,
} from '../../../i18n/formatters';
import { MedicalRecord } from './types';

interface MedicalRecordDetailViewProps {
  record: MedicalRecord;
  onBack: () => void;
  onExploreHospitals?: () => void;
}

export const MedicalRecordDetailView: React.FC<MedicalRecordDetailViewProps> = ({
  record,
  onBack,
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

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div>
      {/* Back Navigation Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={onBack}
          className="btn-back-nav"
          style={{
            padding: '0.2rem 0',
            fontSize: '0.925rem',
            fontWeight: 600,
            background: 'none',
            border: 'none',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: 'none',
            fontFamily: kmFont,
          }}
        >
          <ArrowLeft size={16} />
          <span>{t('history_back_to_list')}</span>
        </button>
      </div>

      {/* Medical Summary Pass Card */}
      <div
        className="record-detail-animate"
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.75rem',
          boxShadow: 'none',
          fontFamily: kmFont,
        }}
      >
        {/* Header: Facility & Identification */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h3
              style={{
                margin: '0 0 0.35rem 0',
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                fontFamily: kmFont,
              }}
            >
              {formatFacilityName(record.hospital_name, language)}
            </h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
              <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                {formatDepartmentName(record.department_name, language)}
              </span>
              {' • '}
              <span>{formatDoctorName(record.doctor_name, language)}</span>
              {record.room_number && (
                <>
                  {' • '}
                  <span>{formatRoom(record.room_number)}</span>
                </>
              )}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
              {t('history_visited_on')}: {record.visited_date}
              {record.consultation_start && ` • ${record.consultation_start} - ${record.consultation_end}`}
              {record.duration_minutes > 0 && ` (${record.duration_minutes} ${t('history_mins')})`}
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '0.04em',
              }}
            >
              #{record.ticket_number}
            </div>
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                color: record.status === 'COMPLETED' ? '#16a34a' : '#dc2626',
                fontFamily: kmFont,
                marginTop: '2px',
              }}
            >
              {record.status === 'COMPLETED' ? (isKm ? 'បានបញ្ចប់' : 'Completed') : (isKm ? 'បានលុបចោល' : 'Cancelled')}
            </span>
          </div>
        </div>

        {/* Module 1: Clinical Diagnosis & Doctor's Notes */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
              fontFamily: kmFont,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>•</span>
            <span>{t('history_clinical_notes')}</span>
          </div>
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '0.4rem',
              fontFamily: kmFont,
            }}
          >
            {isKm ? record.diagnosis.condition_km : record.diagnosis.condition_en}
            {record.diagnosis.code && (
              <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '8px' }}>
                ({record.diagnosis.code})
              </span>
            )}
          </div>
          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              margin: 0,
              fontFamily: kmFont,
            }}
          >
            {isKm ? record.clinical_notes.notes_km : record.clinical_notes.notes_en}
          </p>
        </div>

        {/* Module 2: Digital Prescriptions */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '0.4rem',
              fontFamily: kmFont,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>•</span>
            <span>{t('history_prescriptions')}</span>
          </div>

          {record.prescriptions.length === 0 ? (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
              {t('history_no_prescriptions')}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {record.prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  style={{
                    padding: 0,
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)', fontFamily: kmFont }}>
                        {rx.medication_name}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                        {rx.dosage} • {rx.frequency}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                        {t('history_rx_duration')}: {rx.duration}
                      </div>
                    </div>
                    {rx.dispensed && (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#16a34a',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontFamily: kmFont,
                        }}
                      >
                        <Check size={14} />
                        <span>{t('history_rx_dispensed')}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Module 3: Diagnostics & Tests */}
        {record.diagnostics.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
                fontFamily: kmFont,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>•</span>
              <span>{t('history_tests_diagnostics')}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {record.diagnostics.map((diag) => (
                <div
                  key={diag.id}
                  style={{
                    padding: 0,
                    background: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)', fontFamily: kmFont }}>
                      {diag.test_name}
                    </div>
                    {diag.notes && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                        {diag.notes}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#16a34a',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: kmFont,
                    }}
                  >
                    <Check size={14} />
                    <span>{diag.status}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module 4: Itemized Billing Receipt */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: '0.6rem',
              fontFamily: kmFont,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>•</span>
            <span>{t('history_billing_receipt')}</span>
          </div>

          <div
            style={{
              padding: 0,
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              fontFamily: kmFont,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>{t('history_fee_consultation')}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${record.billing.consultation_fee.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>{t('history_fee_pharmacy')}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${record.billing.pharmacy_fee.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              <span>{t('history_fee_diagnostics')}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>${record.billing.diagnostics_fee.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <span>{t('history_fee_total_paid')}</span>
              <span>${record.billing.total_paid.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem', flexWrap: 'wrap', gap: '8px' }}>
              <span>{t('history_payment_method')}: {record.billing.payment_method}</span>
              <span>{record.billing.invoice_number}</span>
            </div>
          </div>
        </div>

        {/* Module 5: Follow-up Care Plan */}
        {record.follow_up && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                marginBottom: '0.4rem',
                fontFamily: kmFont,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>•</span>
              <span>{t('history_follow_up_title')}</span>
            </div>
            <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem', fontFamily: kmFont }}>
              {t('history_follow_up_recommended_date')}: {record.follow_up.recommended_date}
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
              {record.follow_up.advice}
            </div>
          </div>
        )}

        {/* Bottom Actions: Print Receipt & Book Follow-up */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handlePrintReceipt}
            style={{
              padding: '0.45rem 1.15rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-main)',
              cursor: 'pointer',
              boxShadow: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: kmFont,
            }}
          >
            <Printer size={15} color="var(--accent-primary)" />
            <span>{t('history_print_receipt')}</span>
          </button>

          {onExploreHospitals && (
            <button
              type="button"
              onClick={onExploreHospitals}
              style={{
                padding: '0.45rem 1.15rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                boxShadow: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: kmFont,
              }}
            >
              <Calendar size={15} color="var(--accent-primary)" />
              <span>{t('history_book_follow_up')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
