import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';

interface DepartmentListProps {
  departments: any[];
  activeDropdownDeptId: string | null;
  setActiveDropdownDeptId: (id: string | null) => void;
  onToggleActive: (dept: any) => void;
  onEdit: (dept: any) => void;
  onDelete: (deptId: string) => void;
}

export const DepartmentList: React.FC<DepartmentListProps> = ({
  departments,
  activeDropdownDeptId,
  setActiveDropdownDeptId,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  if (departments.length === 0) {
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
        {t('dept_no_depts')}
      </div>
    );
  }

  return (
    <div style={{ background: 'transparent', border: 'none', borderRadius: 0, boxShadow: 'none', overflow: 'visible' }}>
      {departments.map((dept) => (
        <div
          key={dept.id}
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
            zIndex: activeDropdownDeptId === dept.id ? 50 : 1,
          }}
        >
          {/* Department Name & Code */}
          <div style={{ minWidth: '220px', flex: '1.5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                {dept.name}
              </div>
              <span
                style={{
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                {dept.code || 'DEPT'}
              </span>
            </div>
            {dept.description && (
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '3px', fontFamily: kmFont }}>
                {dept.description}
              </div>
            )}
          </div>

          {/* Location */}
          <div style={{ minWidth: '180px', flex: '1' }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, fontFamily: kmFont }}>
              {t('dept_th_location')}
            </div>
            <div style={{ fontSize: '1.02rem', color: 'var(--text-main)', marginTop: '2px', fontFamily: kmFont }}>
              {dept.floor_room || t('dept_main_building')}
            </div>
          </div>

          {/* Consultation Duration */}
          <div style={{ minWidth: '140px', flex: '0.8' }}>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, fontFamily: kmFont }}>
              {t('dept_th_duration')}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px', fontFamily: kmFont }}>
              {t('dept_mins').replace('{mins}', String(dept.avg_consultation_minutes || 15))}
            </div>
          </div>

          {/* Actions Dropdown */}
          <div style={{ position: 'relative', zIndex: activeDropdownDeptId === dept.id ? 60 : 'auto' }}>
            <button
              onClick={() => setActiveDropdownDeptId(activeDropdownDeptId === dept.id ? null : dept.id)}
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

            {activeDropdownDeptId === dept.id && (
              <>
                <div
                  onClick={() => setActiveDropdownDeptId(null)}
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
                    onClick={() => onToggleActive(dept)}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    style={{
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.92rem',
                      fontWeight: 500,
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: dept.is_active ? '#059669' : 'var(--text-muted)',
                      cursor: 'pointer',
                      boxShadow: 'none',
                      fontFamily: kmFont,
                      transition: 'opacity 0.15s ease',
                    }}
                  >
                    {dept.is_active ? t('doc_active') : t('doc_inactive')}
                  </button>
                  <button
                    onClick={() => {
                      setActiveDropdownDeptId(null);
                      onEdit(dept);
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
                    onClick={() => onDelete(dept.id)}
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
      ))}
    </div>
  );
};
