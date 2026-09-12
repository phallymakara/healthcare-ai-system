import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

interface ServiceListProps {
  services: any[];
  departments: any[];
  activeDropdownSrvId: string | null;
  setActiveDropdownSrvId: (id: string | null) => void;
  onToggleActive: (srv: any) => void;
  onEdit: (srv: any) => void;
  onDelete: (srvId: string) => void;
}

export const ServiceList: React.FC<ServiceListProps> = ({
  services,
  departments,
  activeDropdownSrvId,
  setActiveDropdownSrvId,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  if (services.length === 0) {
    return (
      <div
        style={{
          minHeight: '55vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '1rem',
          fontFamily: kmFont,
        }}
      >
        {t('dept_no_services')}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflow: 'visible', background: 'transparent' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontFamily: kmFont,
          overflow: 'visible',
        }}
      >
        <thead>
          <tr
            style={{
              background: '#f8fafc',
              borderTop: '1px solid var(--border-color)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <th
              style={{
                padding: '0.85rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.03em',
                fontFamily: kmFont,
                borderTopLeftRadius: '10px',
                borderBottomLeftRadius: '10px',
              }}
            >
              {t('dept_title_services')}
            </th>
            <th
              style={{
                padding: '0.85rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.03em',
                fontFamily: kmFont,
              }}
            >
              {t('dept_srv_th_dept')}
            </th>
            <th
              style={{
                padding: '0.85rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.03em',
                fontFamily: kmFont,
              }}
            >
              {t('dept_srv_th_duration')}
            </th>
            <th
              style={{
                padding: '0.85rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.03em',
                fontFamily: kmFont,
              }}
            >
              {t('dept_srv_th_price')}
            </th>
            <th
              style={{
                padding: '0.85rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.03em',
                fontFamily: kmFont,
              }}
            >
              {t('staff_col_status')}
            </th>
            <th
              style={{
                padding: '0.85rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.03em',
                textAlign: 'right',
                fontFamily: kmFont,
                borderTopRightRadius: '10px',
                borderBottomRightRadius: '10px',
              }}
            >
              {t('staff_col_actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {services.map((srv) => {
            const parentDept = departments.find((d) => d.id === srv.department_id);
            const isOpen = activeDropdownSrvId === srv.id;

            return (
              <tr
                key={srv.id}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  background: 'transparent',
                  transition: 'background 0.15s ease',
                  position: 'relative',
                  zIndex: isOpen ? 1000 : 1,
                }}
              >
                {/* Service Name & Description */}
                <td style={{ padding: '0.95rem 1.25rem', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                    {srv.name}
                  </div>
                  {srv.description && (
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '3px', fontFamily: kmFont }}>
                      {srv.description}
                    </div>
                  )}
                </td>

                {/* Department */}
                <td style={{ padding: '0.95rem 1.25rem', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: '0.94rem', color: 'var(--text-main)', fontFamily: kmFont }}>
                    {parentDept ? parentDept.name : t('doc_general')}
                  </div>
                </td>

                {/* Duration */}
                <td style={{ padding: '0.95rem 1.25rem', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>
                    {t('dept_mins').replace('{mins}', String(srv.duration_minutes || 20))}
                  </div>
                </td>

                {/* Price */}
                <td style={{ padding: '0.95rem 1.25rem', verticalAlign: 'middle' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    ${srv.price.toFixed(2)}
                  </div>
                </td>

                {/* Status */}
                <td style={{ padding: '0.95rem 1.25rem', verticalAlign: 'middle' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: srv.is_active ? '#15803d' : '#64748b',
                      fontFamily: kmFont,
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: srv.is_active ? '#16a34a' : '#94a3b8' }}>●</span>
                    <span>{srv.is_active ? t('doc_active') : t('doc_inactive')}</span>
                  </div>
                </td>

                {/* Actions: Three-dot dropdown menu */}
                <td
                  style={{
                    padding: '0.95rem 1.25rem',
                    verticalAlign: 'middle',
                    textAlign: 'right',
                    position: 'relative',
                    zIndex: isOpen ? 1001 : 1,
                  }}
                >
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      className="action-dots-btn"
                      onClick={() => setActiveDropdownSrvId(isOpen ? null : srv.id)}
                      aria-label="Actions"
                    >
                      ···
                    </button>

                    {isOpen && (
                      <>
                        <div
                          onClick={() => setActiveDropdownSrvId(null)}
                          style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 9998,
                            background: 'transparent',
                          }}
                        />
                        <div
                          className="action-popup-menu"
                          style={{
                            zIndex: 9999,
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 6px)',
                          }}
                        >
                          <button
                            className="action-popup-item"
                            onClick={() => onToggleActive(srv)}
                            style={{
                              color: srv.is_active ? '#059669' : 'var(--text-muted)',
                              fontFamily: kmFont,
                            }}
                          >
                            {srv.is_active ? t('doc_active') : t('doc_inactive')}
                          </button>
                          <button
                            className="action-popup-item"
                            onClick={() => {
                              setActiveDropdownSrvId(null);
                              onEdit(srv);
                            }}
                            style={{
                              color: 'var(--text-main)',
                              fontFamily: kmFont,
                            }}
                          >
                            {t('doc_edit')}
                          </button>
                          <button
                            className="action-popup-item"
                            onClick={() => onDelete(srv.id)}
                            style={{
                              color: '#dc2626',
                              fontFamily: kmFont,
                            }}
                          >
                            {t('doc_delete')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
