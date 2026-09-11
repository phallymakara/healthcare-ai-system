import React from 'react';
import { X, Clock } from 'lucide-react';
import { STANDARD_TIME_SLOTS } from './types';
import { useModalClose } from '../../../hooks/useModalClose';

export interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  issuedTicketSlip: any;
  onCloseSlipModal: () => void;
  onPrintSlip: () => void;
  walkInName: string;
  setWalkInName: (name: string) => void;
  walkInPhone: string;
  setWalkInPhone: (phone: string) => void;
  walkInSlotTime: string;
  departments: any[];
  walkInDeptId: string;
  selectedDeptId: string;
  walkInServiceId: string;
  setWalkInServiceId: (id: string) => void;
  availableServices: any[];
  walkInNameError: string | null;
  setWalkInNameError: (err: string | null) => void;
  walkInError: string | null;
  actionLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  kmFont: string;
  t: (key: string) => string;
}

export const WalkInModal: React.FC<WalkInModalProps> = ({
  isOpen,
  onClose,
  issuedTicketSlip,
  onCloseSlipModal,
  onPrintSlip,
  walkInName,
  setWalkInName,
  walkInPhone,
  setWalkInPhone,
  walkInSlotTime,
  departments,
  walkInDeptId,
  selectedDeptId,
  walkInServiceId,
  setWalkInServiceId,
  availableServices,
  walkInNameError,
  setWalkInNameError,
  walkInError,
  actionLoading,
  onSubmit,
  kmFont,
  t,
}) => {
  const modal = useModalClose(isOpen, (open) => {
    if (!open) onClose();
  });

  if (!modal.shouldRender) return null;

  return (
    <div
      className={modal.overlayClass}
      style={{ zIndex: 1000 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) modal.close();
      }}
    >
      <div
        className={modal.cardClass}
        style={{
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          width: '100%',
          maxWidth: '460px',
          boxShadow: 'none',
          padding: '1.5rem',
        }}
      >
        {issuedTicketSlip ? (
          /* View A: Thermal Receipt Preview */
          <div>
            <div id="thermal-slip-print-area" style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-main)',
                  fontFamily: kmFont,
                }}
              >
                {t('qm_walkin_receipt')}
              </div>
              <div
                style={{
                  fontSize: '2.4rem',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: 'var(--text-main)',
                  margin: '0.75rem 0',
                }}
              >
                {issuedTicketSlip.ticket_number}
              </div>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '0.2rem',
                  fontFamily: kmFont,
                }}
              >
                {issuedTicketSlip.patient_name}
              </div>
              {issuedTicketSlip.patient_phone && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Tel: {issuedTicketSlip.patient_phone}
                </div>
              )}

              <div
                style={{
                  borderTop: '1px solid var(--border-color)',
                  borderBottom: '1px solid var(--border-color)',
                  padding: '0.75rem 0',
                  margin: '0.85rem 0',
                  textAlign: 'left',
                  fontSize: '0.88rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: kmFont }}>{t('qm_department_label')}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>
                    {issuedTicketSlip.department_name}
                  </span>
                </div>
                {issuedTicketSlip.doctor_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: kmFont }}>{t('qm_doctor_label')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>
                      {issuedTicketSlip.doctor_name}
                    </span>
                  </div>
                )}
                {issuedTicketSlip.service_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontFamily: kmFont }}>{t('qm_service_label')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>
                      {issuedTicketSlip.service_name}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: kmFont }}>{t('qm_queue_position')}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    #{issuedTicketSlip.position} {t('qm_in_line_suffix')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontFamily: kmFont }}>{t('qm_estimated_wait')}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    ~{issuedTicketSlip.estimated_wait_minutes} {t('pd_mins')}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                {t('qm_issued')} {new Date(issuedTicketSlip.issued_at).toLocaleDateString()}{' '}
                {new Date(issuedTicketSlip.issued_at).toLocaleTimeString()}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontFamily: kmFont }}>
                {t('qm_wait_lobby')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={onCloseSlipModal}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  fontFamily: kmFont,
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                }}
              >
                {t('qm_done')}
              </button>
              <button
                type="button"
                onClick={onPrintSlip}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  fontFamily: kmFont,
                  background: 'transparent',
                  border: '1px solid var(--text-main)',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  boxShadow: 'none',
                }}
              >
                {t('qm_print_slip')}
              </button>
            </div>
          </div>
        ) : (
          /* View B: Intake Form */
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <h3
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-main)',
                  fontFamily: kmFont,
                }}
              >
                {t('qm_issue_title')}
              </h3>
              <button
                type="button"
                onClick={modal.close}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                    fontFamily: kmFont,
                  }}
                >
                  {t('qm_patient_name_label')} *
                </label>
                <input
                  type="text"
                  placeholder={t('qm_enter_name')}
                  value={walkInName}
                  onChange={(e) => {
                    setWalkInName(e.target.value);
                    if (walkInNameError) setWalkInNameError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    fontSize: '0.95rem',
                    fontFamily: kmFont,
                    borderRadius: '4px',
                    border: walkInNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {walkInNameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                    {walkInNameError}
                  </div>
                )}
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                    fontFamily: kmFont,
                  }}
                >
                  {t('qm_phone_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('qm_enter_phone')}
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    fontSize: '0.95rem',
                    fontFamily: kmFont,
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {walkInSlotTime && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    fontSize: '0.86rem',
                    fontFamily: kmFont,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      color: 'var(--text-main)',
                      fontWeight: 700,
                    }}
                  >
                    <Clock size={15} style={{ color: '#16a34a' }} />
                    <span>
                      {STANDARD_TIME_SLOTS.find((s) => s.key === walkInSlotTime)?.labelKm || walkInSlotTime}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    {departments.find((d) => d.id === (walkInDeptId || selectedDeptId))?.name}
                  </span>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    marginBottom: '6px',
                    fontFamily: kmFont,
                  }}
                >
                  {t('qm_service')}
                </label>
                <select
                  value={walkInServiceId}
                  onChange={(e) => setWalkInServiceId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    fontSize: '0.95rem',
                    fontFamily: kmFont,
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    background: '#ffffff',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="">{t('qm_standard_consultation')}</option>
                  {availableServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.name} {srv.price ? `($${srv.price})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {walkInError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', fontFamily: kmFont }}>{walkInError}</div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={modal.close}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    fontFamily: kmFont,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    fontFamily: kmFont,
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  {t('qm_generate_ticket')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalkInModal;
