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
              background: 'transparent',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <th
              style={{
                padding: '0.8rem 1.25rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                fontFamily: kmFont,
                whiteSpace: 'nowrap',
              }}
            >
              {t('dept_name_label') || t('dept_title_depts')}
            </th>
            <th
              style={{
                padding: '0.8rem 1.25rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                fontFamily: kmFont,
                whiteSpace: 'nowrap',
              }}
            >
              {t('dept_th_id')}
            </th>
            <th
              style={{
                padding: '0.8rem 1.25rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                fontFamily: kmFont,
                whiteSpace: 'nowrap',
              }}
            >
              {t('dept_th_location')}
            </th>
            <th
              style={{
                padding: '0.8rem 1.25rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                fontFamily: kmFont,
                whiteSpace: 'nowrap',
              }}
            >
              {t('staff_col_status')}
            </th>
            <th
              style={{
                padding: '0.8rem 1.25rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textAlign: 'right',
                fontFamily: kmFont,
                whiteSpace: 'nowrap',
              }}
            >
              {isKm ? 'សកម្ម' : t('staff_col_actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept) => {
            const isOpen = activeDropdownDeptId === dept.id;

            return (
              <tr
                key={dept.id}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  background: 'transparent',
                  transition: 'background 0.15s ease',
                  position: 'relative',
                  zIndex: isOpen ? 1000 : 1,
                }}
              >
                {/* Department Name */}
                <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>
                    {dept.name}
                  </div>
                  {dept.description && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: kmFont }}>
                      {dept.description}
                    </div>
                  )}
                </td>

                {/* Department ID */}
                <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <span
                    style={{
                      fontSize: '0.84rem',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: 'var(--text-main)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {dept.code || dept.id.slice(0, 8)}
                  </span>
                </td>

                {/* Location */}
                <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontFamily: kmFont }}>
                    {dept.floor_room || t('dept_main_building')}
                  </div>
                </td>

                {/* Status */}
                <td style={{ padding: '0.85rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.86rem',
                      fontWeight: 500,
                      color: dept.is_active ? '#15803d' : '#64748b',
                      fontFamily: kmFont,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: dept.is_active ? '#16a34a' : '#94a3b8', flexShrink: 0, lineHeight: 1 }}>●</span>
                    <span style={{ whiteSpace: 'nowrap' }}>{dept.is_active ? t('doc_active') : t('doc_inactive')}</span>
                  </div>
                </td>

                {/* Actions Dropdown */}
                <td
                  style={{
                    padding: '0.85rem 1.25rem',
                    verticalAlign: 'middle',
                    textAlign: 'right',
                    position: 'relative',
                    zIndex: isOpen ? 1001 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      className="action-dots-btn"
                      onClick={() => setActiveDropdownDeptId(isOpen ? null : dept.id)}
                      aria-label="Actions"
                    >
                      ···
                    </button>

                    {isOpen && (
                      <>
                        <div
                          onClick={() => setActiveDropdownDeptId(null)}
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
                            onClick={() => onToggleActive(dept)}
                            style={{
                              color: dept.is_active ? '#059669' : 'var(--text-muted)',
                              fontFamily: kmFont,
                            }}
                          >
                            {dept.is_active ? t('doc_active') : t('doc_inactive')}
                          </button>
                          <button
                            className="action-popup-item"
                            onClick={() => {
                              setActiveDropdownDeptId(null);
                              onEdit(dept);
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
                            onClick={() => onDelete(dept.id)}
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
