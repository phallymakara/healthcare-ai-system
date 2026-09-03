import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { formatFacilityName, formatDepartmentName } from '../../i18n/formatters';
import { API_BASE } from '../../services/api';

interface PatientHistoryProps {
  onSelectTicket?: (ticketId: string) => void;
  onExploreHospitals?: () => void;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({ onExploreHospitals }) => {
  const { language, t } = useLanguage();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlipTicket, setSelectedSlipTicket] = useState<any | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/patients/my-tickets`, {
        headers: AuthService.getAuthHeaders(),
      });
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'CALLED':
      case 'SERVING':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.65rem',
            borderRadius: '16px',
            border: '1px solid #059669',
            color: '#059669',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            {status === 'CALLED' ? t('status_called') : t('status_serving')}
          </span>
        );
      case 'WAITING':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.65rem',
            borderRadius: '16px',
            border: '1px solid #d97706',
            color: '#d97706',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            {t('status_waiting')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.65rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            {t('status_completed')}
          </span>
        );
      case 'CANCELLED':
      case 'NO_SHOW':
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.65rem',
            borderRadius: '16px',
            border: '1px solid #dc2626',
            color: '#dc2626',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            {status === 'NO_SHOW' ? t('status_no_show') : t('status_cancelled')}
          </span>
        );
      default:
        return (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.65rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            textTransform: 'uppercase',
            fontWeight: 500,
          }}>
            {status}
          </span>
        );
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit' }}>
        {t('history_loading')}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '3.5rem 1.5rem',
          textAlign: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'none',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            {t('history_no_consultations')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            {t('history_empty_desc')}
          </p>
          {onExploreHospitals && (
            <button
              onClick={onExploreHospitals}
              style={{
                padding: '0.55rem 1.25rem',
                background: 'transparent',
                border: '1px solid var(--text-main)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'none',
                fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
              }}
            >
              {t('history_explore_btn')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Single Main Container extending to the bottom */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '1.5rem',
        boxShadow: 'none',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
      }}>

        {/* Flat Roster Table */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('history_th_datetime')}</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('history_th_ticket')}</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('history_th_hospital')}</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('history_th_source')}</th>
                <th style={{ padding: '0.75rem 0.5rem 0.75rem 6rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('history_th_status')}</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>{t('history_th_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((tkt) => (
                <tr key={tkt.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(tkt.created_at).toLocaleDateString()} • {new Date(tkt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', fontFamily: 'monospace', fontWeight: 400, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                      {tkt.ticket_number}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <div style={{ color: 'var(--text-main)', fontWeight: 500, fontSize: '0.85rem' }}>
                        {formatFacilityName(tkt.hospital_name || 'Partner Clinic', language)}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1px' }}>
                        {formatDepartmentName(tkt.department_name || 'General OPD', language)} {tkt.room_number ? `• ${tkt.room_number}` : ''}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '16px',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        fontWeight: 500,
                      }}>
                        {tkt.ticket_source || 'ONLINE'}
                      </span>
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem 0.85rem 6rem' }}>
                      {renderStatusBadge(tkt.status)}
                    </td>

                    <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedSlipTicket(tkt)}
                        style={{
                          padding: '0.35rem 0.85rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '16px',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                          whiteSpace: 'nowrap',
                          fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                        }}
                      >
                        {t('digital_slip')}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Digital Ticket Slip Modal */}
      {selectedSlipTicket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            width: '100%',
            maxWidth: '440px',
            padding: '1.75rem',
            boxShadow: 'none',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {t('digital_consultation_slip')}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatFacilityName(selectedSlipTicket.hospital_name || 'Hospital Partner', language)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {formatDepartmentName(selectedSlipTicket.department_name, language)} ({selectedSlipTicket.department_code || 'OPD'})
                </div>
              </div>
              <button
                onClick={() => setSelectedSlipTicket(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            {/* Ticket Number Highlight */}
            <div style={{ textAlign: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                {t('queue_number')}
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 400, fontFamily: 'monospace', color: 'var(--text-main)', margin: '0.25rem 0' }}>
                {selectedSlipTicket.ticket_number}
              </div>
              <div>
                {renderStatusBadge(selectedSlipTicket.status)}
              </div>
            </div>

            {/* Details Table */}
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('patient_name_label')}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{selectedSlipTicket.patient_name || 'Patient'}</span>
              </div>
              {selectedSlipTicket.patient_phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('contact_label')}</span>
                  <span style={{ color: 'var(--text-main)' }}>{selectedSlipTicket.patient_phone}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('station_label')}</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedSlipTicket.room_number || 'Room 201'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('intake_label')}</span>
                <span style={{ color: 'var(--text-main)' }}>{selectedSlipTicket.ticket_source || 'ONLINE'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('issued_at_label')}</span>
                <span style={{ color: 'var(--text-main)' }}>
                  {new Date(selectedSlipTicket.created_at).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('verification_code_label')}</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {(selectedSlipTicket.id || '').substring(0, 13).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedSlipTicket(null)}
                style={{
                  padding: '0.5rem 0.9rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
              >
                {t('close')}
              </button>
              <button
                type="button"
                onClick={handlePrintSlip}
                style={{
                  padding: '0.5rem 1.1rem',
                  background: 'transparent',
                  border: '1px solid var(--text-main)',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: 'none',
                  fontFamily: language === 'km' ? 'var(--font-khmer)' : 'inherit',
                }}
              >
                {t('print_slip')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
