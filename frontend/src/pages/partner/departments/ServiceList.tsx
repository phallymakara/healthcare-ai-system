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
    <div style={{ background: 'transparent', border: 'none', borderRadius: 0, boxShadow: 'none', overflow: 'visible' }}>
      {services.map((srv) => {
        const parentDept = departments.find((d) => d.id === srv.department_id);
        return (
          <div
            key={srv.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              padding: '1.1rem 0',
              borderBottom: '1px solid var(--border-color)',
              background: 'transparent',
              position: 'relative',
              zIndex: activeDropdownSrvId === srv.id ? 50 : 1,
            }}
          >
            {/* Service Name & Description */}
            <div style={{ minWidth: '220px', flex: '1.5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                  {srv.name}
                </div>
                {!srv.is_active && (
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '3px',
                      padding: '1px 5px',
                      fontWeight: 500,
                    }}
                  >
                    {t('doc_inactive')}
                  </span>
                )}
              </div>
              {srv.description && (
                <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '3px', fontFamily: kmFont }}>
                  {srv.description}
                </div>
              )}
            </div>

            {/* Department */}
            <div style={{ minWidth: '180px', flex: '1' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, fontFamily: kmFont }}>
                {t('dept_srv_th_dept')}
              </div>
              <div style={{ fontSize: '1.02rem', color: 'var(--text-main)', marginTop: '2px', fontFamily: kmFont }}>
                {parentDept ? parentDept.name : t('doc_general')}
              </div>
            </div>

            {/* Duration */}
            <div style={{ minWidth: '120px', flex: '0.7' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, fontFamily: kmFont }}>
                {t('dept_srv_th_duration')}
              </div>
              <div style={{ fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '2px', fontFamily: kmFont }}>
                {t('dept_mins').replace('{mins}', String(srv.duration_minutes || 20))}
              </div>
            </div>

            {/* Price */}
            <div style={{ minWidth: '100px', flex: '0.6' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, fontFamily: kmFont }}>
                {t('dept_srv_th_price')}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                ${srv.price.toFixed(2)}
              </div>
            </div>

            {/* Actions: Three-dot dropdown menu */}
            <div style={{ position: 'relative', zIndex: activeDropdownSrvId === srv.id ? 60 : 'auto' }}>
              <button
                onClick={() => setActiveDropdownSrvId(activeDropdownSrvId === srv.id ? null : srv.id)}
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

              {activeDropdownSrvId === srv.id && (
                <>
                  <div
                    onClick={() => setActiveDropdownSrvId(null)}
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
                      minWidth: '110px',
                      zIndex: 100,
                      boxShadow: 'none',
                    }}
                  >
                    <button
                      onClick={() => onToggleActive(srv)}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.92rem',
                        fontWeight: 500,
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        color: srv.is_active ? '#059669' : 'var(--text-muted)',
                        cursor: 'pointer',
                        boxShadow: 'none',
                        fontFamily: kmFont,
                        transition: 'opacity 0.15s ease',
                      }}
                    >
                      {srv.is_active ? t('doc_active') : t('doc_inactive')}
                    </button>
                    <button
                      onClick={() => {
                        setActiveDropdownSrvId(null);
                        onEdit(srv);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      style={{
                        padding: '0.45rem 0.75rem',
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
                      onClick={() => onDelete(srv.id)}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                      style={{
                        padding: '0.45rem 0.75rem',
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
  );
};
