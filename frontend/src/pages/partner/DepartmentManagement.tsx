import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';

export const DepartmentManagement: React.FC = () => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [departments, setDepartments] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Department Modal State
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptMinutes, setDeptMinutes] = useState(15);
  const [deptFloorRoom, setDeptFloorRoom] = useState('');
  const [deptDescription, setDeptDescription] = useState('');
  const [deptIsActive, setDeptIsActive] = useState(true);
  const [deptNameError, setDeptNameError] = useState<string | null>(null);
  const [deptCodeError, setDeptCodeError] = useState<string | null>(null);
  const [deptSubmitError, setDeptSubmitError] = useState<string | null>(null);
  const [deptLoading, setDeptLoading] = useState(false);
  const [activeDropdownDeptId, setActiveDropdownDeptId] = useState<string | null>(null);

  // Service Modal State
  const [srvModalOpen, setSrvModalOpen] = useState(false);
  const [editingSrvId, setEditingSrvId] = useState<string | null>(null);
  const [srvDeptId, setSrvDeptId] = useState('');
  const [srvName, setSrvName] = useState('');
  const [srvDuration, setSrvDuration] = useState(20);
  const [srvPrice, setSrvPrice] = useState(0.0);
  const [srvDescription, setSrvDescription] = useState('');
  const [srvIsActive, setSrvIsActive] = useState(true);
  const [srvNameError, setSrvNameError] = useState<string | null>(null);
  const [srvDeptError, setSrvDeptError] = useState<string | null>(null);
  const [srvSubmitError, setSrvSubmitError] = useState<string | null>(null);
  const [srvLoading, setSrvLoading] = useState(false);
  const [activeDropdownSrvId, setActiveDropdownSrvId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'departments' | 'services'>('departments');

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, srvRes] = await Promise.all([
        fetch(`${API_BASE}/partners/departments`, { headers: AuthService.getAuthHeaders() }),
        fetch(`${API_BASE}/partners/services`, { headers: AuthService.getAuthHeaders() }),
      ]);
      if (deptRes.ok) setDepartments(await deptRes.json());
      if (srvRes.ok) setServices(await srvRes.json());
    } catch {
      // Ignore background error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Department Modal for New
  const handleOpenNewDept = () => {
    setEditingDeptId(null);
    setDeptName('');
    setDeptCode('');
    setDeptMinutes(15);
    setDeptFloorRoom('');
    setDeptDescription('');
    setDeptIsActive(true);
    setDeptNameError(null);
    setDeptCodeError(null);
    setDeptSubmitError(null);
    setDeptModalOpen(true);
  };

  // Open Department Modal for Edit
  const handleOpenEditDept = (dept: any) => {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setDeptCode(dept.code || '');
    setDeptMinutes(dept.avg_consultation_minutes || 15);
    setDeptFloorRoom(dept.floor_room || '');
    setDeptDescription(dept.description || '');
    setDeptIsActive(dept.is_active ?? true);
    setDeptNameError(null);
    setDeptCodeError(null);
    setDeptSubmitError(null);
    setDeptModalOpen(true);
  };

  // Save Department (Create or Update)
  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptNameError(null);
    setDeptCodeError(null);
    setDeptSubmitError(null);

    let hasError = false;
    if (!deptName.trim()) {
      setDeptNameError(t('dept_err_name'));
      hasError = true;
    }
    if (!deptCode.trim()) {
      setDeptCodeError(t('dept_err_code'));
      hasError = true;
    }
    if (hasError) return;

    setDeptLoading(true);
    try {
      const isEdit = !!editingDeptId;
      const url = isEdit
        ? `${API_BASE}/partners/departments/${editingDeptId}`
        : `${API_BASE}/partners/departments`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({
          name: deptName.trim(),
          code: deptCode.trim().toUpperCase(),
          avg_consultation_minutes: Number(deptMinutes) || 15,
          floor_room: deptFloorRoom.trim() || undefined,
          description: deptDescription.trim() || undefined,
          is_active: deptIsActive,
        }),
      });

      if (!res.ok) {
        setDeptSubmitError(t('dept_err_save'));
        return;
      }

      setDeptModalOpen(false);
      await loadData();
    } catch {
      setDeptSubmitError(t('dept_err_conn'));
    } finally {
      setDeptLoading(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (dept: any) => {
    setActiveDropdownDeptId(null);
    try {
      await fetch(`${API_BASE}/partners/departments/${dept.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({ is_active: !dept.is_active }),
      });
      await loadData();
    } catch {
      // Ignore background error
    }
  };

  // Delete Department
  const handleDeleteDept = async (deptId: string) => {
    setActiveDropdownDeptId(null);
    try {
      await fetch(`${API_BASE}/partners/departments/${deptId}`, {
        method: 'DELETE',
        headers: AuthService.getAuthHeaders(),
      });
      await loadData();
    } catch {
      // Ignore background error
    }
  };

  // Open Service Modal for New
  const handleOpenNewService = () => {
    setEditingSrvId(null);
    setSrvDeptId(departments.length > 0 ? departments[0].id : '');
    setSrvName('');
    setSrvDuration(20);
    setSrvPrice(0.0);
    setSrvDescription('');
    setSrvIsActive(true);
    setSrvNameError(null);
    setSrvDeptError(null);
    setSrvSubmitError(null);
    setSrvModalOpen(true);
  };

  // Open Service Modal for Edit
  const handleOpenEditService = (srv: any) => {
    setEditingSrvId(srv.id);
    setSrvDeptId(srv.department_id);
    setSrvName(srv.name);
    setSrvDuration(srv.duration_minutes || 20);
    setSrvPrice(srv.price || 0.0);
    setSrvDescription(srv.description || '');
    setSrvIsActive(srv.is_active ?? true);
    setSrvNameError(null);
    setSrvDeptError(null);
    setSrvSubmitError(null);
    setSrvModalOpen(true);
  };

  // Save Service (Create or Update)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSrvNameError(null);
    setSrvDeptError(null);
    setSrvSubmitError(null);

    let hasError = false;
    if (!srvDeptId) {
      setSrvDeptError(t('dept_srv_err_dept'));
      hasError = true;
    }
    if (!srvName.trim()) {
      setSrvNameError(t('dept_srv_err_name'));
      hasError = true;
    }
    if (hasError) return;

    setSrvLoading(true);
    try {
      const isEdit = !!editingSrvId;
      const url = isEdit
        ? `${API_BASE}/partners/services/${editingSrvId}`
        : `${API_BASE}/partners/services`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({
          department_id: srvDeptId,
          name: srvName.trim(),
          duration_minutes: Number(srvDuration) || 20,
          price: Number(srvPrice) || 0.0,
          description: srvDescription.trim() || undefined,
          is_active: srvIsActive,
        }),
      });

      if (!res.ok) {
        setSrvSubmitError(t('dept_srv_err_save'));
        return;
      }

      setSrvModalOpen(false);
      await loadData();
    } catch {
      setSrvSubmitError(t('dept_srv_err_conn'));
    } finally {
      setSrvLoading(false);
    }
  };

  // Toggle Service Active Status
  const handleToggleActiveService = async (srv: any) => {
    setActiveDropdownSrvId(null);
    try {
      await fetch(`${API_BASE}/partners/services/${srv.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({ is_active: !srv.is_active }),
      });
      await loadData();
    } catch {
      // Ignore background error
    }
  };

  // Delete Service
  const handleDeleteService = async (srvId: string) => {
    setActiveDropdownSrvId(null);
    try {
      await fetch(`${API_BASE}/partners/services/${srvId}`, {
        method: 'DELETE',
        headers: AuthService.getAuthHeaders(),
      });
      await loadData();
    } catch {
      // Ignore background error
    }
  };

  return (
    <div style={{ width: '100%', fontFamily: kmFont }}>
      {/* Top Header: Tabs on Left, Context Action on Right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('departments')}
            style={{
              padding: '0.65rem 1.15rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'departments' ? 700 : 500,
              fontFamily: kmFont,
              color: activeTab === 'departments' ? 'var(--text-main)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'departments' ? '2px solid var(--text-main)' : '2px solid transparent',
              marginBottom: '-1px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {t('dept_title_depts')}
          </button>
          <button
            onClick={() => setActiveTab('services')}
            style={{
              padding: '0.65rem 1.15rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'services' ? 700 : 500,
              fontFamily: kmFont,
              color: activeTab === 'services' ? 'var(--text-main)' : 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'services' ? '2px solid var(--text-main)' : '2px solid transparent',
              marginBottom: '-1px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
            }}
          >
            {t('dept_title_services')}
          </button>
        </div>

        <div>
          {activeTab === 'departments' ? (
            <button
              onClick={handleOpenNewDept}
              style={{
                padding: '0.55rem 1rem',
                background: 'transparent',
                border: '1px solid var(--text-main)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: 'none',
                fontFamily: kmFont,
                marginBottom: '6px',
              }}
            >
              {t('dept_add_btn')}
            </button>
          ) : (
            <button
              onClick={handleOpenNewService}
              disabled={departments.length === 0}
              style={{
                padding: '0.55rem 1rem',
                background: 'transparent',
                border: '1px solid var(--text-main)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: departments.length === 0 ? 'not-allowed' : 'pointer',
                opacity: departments.length === 0 ? 0.5 : 1,
                boxShadow: 'none',
                fontFamily: kmFont,
                marginBottom: '6px',
              }}
            >
              {t('dept_add_service_btn')}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: kmFont }}>
          {t('dept_loading')}
        </div>
      ) : activeTab === 'departments' ? (
        /* Tab 1: Clinical Departments */
        departments.length === 0 ? (
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
        ) : (
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: 'none',
            overflow: 'visible',
          }}>
                {departments.map((dept, idx) => (
                  <div
                    key={dept.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderBottom: idx === departments.length - 1 ? 'none' : '1px solid var(--border-color)',
                      background: '#ffffff',
                      position: 'relative',
                      zIndex: activeDropdownDeptId === dept.id ? 50 : 1,
                      borderTopLeftRadius: idx === 0 ? '6px' : 0,
                      borderTopRightRadius: idx === 0 ? '6px' : 0,
                      borderBottomLeftRadius: idx === departments.length - 1 ? '6px' : 0,
                      borderBottomRightRadius: idx === departments.length - 1 ? '6px' : 0,
                    }}
                  >
                    {/* Department Name & Code */}
                    <div style={{ minWidth: '220px', flex: '1.5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                          {dept.name}
                        </div>
                        <span style={{
                          fontSize: '0.9rem',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                        }}>
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

                    {/* Actions: Three-dot dropdown menu */}
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
                          <div style={{
                            position: 'absolute',
                            right: 0,
                            top: 'calc(100% + 4px)',
                            background: '#ffffff',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: '110px',
                            zIndex: 100,
                            boxShadow: 'none',
                            overflow: 'hidden',
                          }}>
                            <button
                              onClick={() => handleToggleActive(dept)}
                              style={{
                                padding: '0.55rem 0.85rem',
                                fontSize: '0.92rem',
                                fontWeight: 500,
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid var(--border-color)',
                                color: dept.is_active ? '#059669' : 'var(--text-muted)',
                                cursor: 'pointer',
                                boxShadow: 'none',
                                fontFamily: kmFont,
                              }}
                            >
                              {dept.is_active ? t('doc_active') : t('doc_inactive')}
                            </button>
                            <button
                              onClick={() => {
                                setActiveDropdownDeptId(null);
                                handleOpenEditDept(dept);
                              }}
                              style={{
                                padding: '0.55rem 0.85rem',
                                fontSize: '0.92rem',
                                fontWeight: 500,
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid var(--border-color)',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                boxShadow: 'none',
                                fontFamily: kmFont,
                              }}
                            >
                              {t('doc_edit')}
                            </button>
                            <button
                              onClick={() => handleDeleteDept(dept.id)}
                              style={{
                                padding: '0.55rem 0.85rem',
                                fontSize: '0.92rem',
                                fontWeight: 500,
                                textAlign: 'left',
                                background: 'transparent',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                boxShadow: 'none',
                                fontFamily: kmFont,
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
            )
      ) : (
        /* Tab 2: Services & Pricing */
        services.length === 0 ? (
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
        ) : (
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: 'none',
            overflow: 'visible',
          }}>
                {services.map((srv, idx) => {
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
                        padding: '1.1rem 1.35rem',
                        borderBottom: idx === services.length - 1 ? 'none' : '1px solid var(--border-color)',
                        background: '#ffffff',
                        position: 'relative',
                        zIndex: activeDropdownSrvId === srv.id ? 50 : 1,
                        borderTopLeftRadius: idx === 0 ? '6px' : 0,
                        borderTopRightRadius: idx === 0 ? '6px' : 0,
                        borderBottomLeftRadius: idx === services.length - 1 ? '6px' : 0,
                        borderBottomRightRadius: idx === services.length - 1 ? '6px' : 0,
                      }}
                    >
                      {/* Service Name & Description */}
                      <div style={{ minWidth: '220px', flex: '1.5' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                            {srv.name}
                          </div>
                          {!srv.is_active && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', border: '1px solid var(--border-color)', borderRadius: '3px', padding: '1px 5px', fontWeight: 500 }}>
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
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: 'calc(100% + 4px)',
                              background: '#ffffff',
                              border: '1px solid var(--border-color)',
                              borderRadius: '4px',
                              display: 'flex',
                              flexDirection: 'column',
                              minWidth: '110px',
                              zIndex: 100,
                              boxShadow: 'none',
                              overflow: 'hidden',
                            }}>
                              <button
                                onClick={() => handleToggleActiveService(srv)}
                                style={{
                                  padding: '0.55rem 0.85rem',
                                  fontSize: '0.92rem',
                                  fontWeight: 500,
                                  textAlign: 'left',
                                  background: 'transparent',
                                  border: 'none',
                                  borderBottom: '1px solid var(--border-color)',
                                  color: srv.is_active ? '#059669' : 'var(--text-muted)',
                                  cursor: 'pointer',
                                  boxShadow: 'none',
                                  fontFamily: kmFont,
                                }}
                              >
                                {srv.is_active ? t('doc_active') : t('doc_inactive')}
                              </button>
                              <button
                                onClick={() => {
                                  setActiveDropdownSrvId(null);
                                  handleOpenEditService(srv);
                                }}
                                style={{
                                  padding: '0.55rem 0.85rem',
                                  fontSize: '0.92rem',
                                  fontWeight: 500,
                                  textAlign: 'left',
                                  background: 'transparent',
                                  border: 'none',
                                  borderBottom: '1px solid var(--border-color)',
                                  color: 'var(--text-main)',
                                  cursor: 'pointer',
                                  boxShadow: 'none',
                                  fontFamily: kmFont,
                                }}
                              >
                                {t('doc_edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteService(srv.id)}
                                style={{
                                  padding: '0.55rem 0.85rem',
                                  fontSize: '0.92rem',
                                  fontWeight: 500,
                                  textAlign: 'left',
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                  boxShadow: 'none',
                                  fontFamily: kmFont,
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
            )
      )}

      {/* Add / Edit Department Modal */}
      {deptModalOpen && (
        <div className="responsive-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeptModalOpen(false); }}>
          <div className="responsive-modal-card" style={{ maxWidth: '520px', fontFamily: kmFont }}>
            <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 1.4rem 0', color: 'var(--text-main)', fontFamily: kmFont }}>
                {editingDeptId ? t('dept_modal_edit_dept') : t('dept_modal_add_dept')}
              </h3>

            <form onSubmit={handleSaveDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                  {t('dept_name_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('dept_name_placeholder')}
                  value={deptName}
                  onChange={(e) => {
                    setDeptName(e.target.value);
                    if (deptNameError) setDeptNameError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    fontSize: '0.95rem',
                    borderRadius: '4px',
                    border: deptNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
                {deptNameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                    {deptNameError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                  {t('dept_code_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('dept_code_placeholder')}
                  value={deptCode}
                  onChange={(e) => {
                    setDeptCode(e.target.value);
                    if (deptCodeError) setDeptCodeError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    fontSize: '0.95rem',
                    borderRadius: '4px',
                    border: deptCodeError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
                {deptCodeError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                    {deptCodeError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                  {t('dept_duration_label')}
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={deptMinutes}
                  onChange={(e) => setDeptMinutes(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    fontSize: '0.95rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: kmFont }}>
                  {t('dept_duration_hint')}
                </div>
              </div>


              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="deptActiveCheck"
                  checked={deptIsActive}
                  onChange={(e) => setDeptIsActive(e.target.checked)}
                />
                <label htmlFor="deptActiveCheck" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer', fontFamily: kmFont }}>
                  {t('dept_active_check')}
                </label>
              </div>

              {deptSubmitError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', fontFamily: kmFont }}>
                  {deptSubmitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    fontSize: '0.98rem',
                    fontWeight: 500,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={deptLoading}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    fontSize: '0.98rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {editingDeptId ? t('dept_save_btn') : t('dept_create_btn')}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {srvModalOpen && (
        <div className="responsive-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setSrvModalOpen(false); }}>
          <div className="responsive-modal-card" style={{ maxWidth: '520px', fontFamily: kmFont }}>
            <div className="responsive-modal-body" style={{ padding: '1.6rem 1.75rem' }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 1.4rem 0', color: 'var(--text-main)', fontFamily: kmFont }}>
                {editingSrvId ? t('dept_modal_edit_srv') : t('dept_modal_add_srv')}
              </h3>

            <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                  {t('dept_srv_th_dept')}
                </label>
                <select
                  value={srvDeptId}
                  onChange={(e) => {
                    setSrvDeptId(e.target.value);
                    if (srvDeptError) setSrvDeptError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    fontSize: '0.95rem',
                    borderRadius: '4px',
                    border: srvDeptError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    background: '#ffffff',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code || 'DEPT'})
                    </option>
                  ))}
                </select>
                {srvDeptError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                    {srvDeptError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                  {t('dept_srv_name_label')}
                </label>
                <input
                  type="text"
                  placeholder={t('dept_srv_name_placeholder')}
                  value={srvName}
                  onChange={(e) => {
                    setSrvName(e.target.value);
                    if (srvNameError) setSrvNameError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    fontSize: '0.95rem',
                    borderRadius: '4px',
                    border: srvNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: kmFont,
                  }}
                />
                {srvNameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '5px', fontFamily: kmFont }}>
                    {srvNameError}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                    {t('dept_srv_duration_label')}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={srvDuration}
                    onChange={(e) => setSrvDuration(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.72rem 0.85rem',
                      fontSize: '0.95rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: kmFont,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                    {t('dept_srv_price_label')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.72rem 0.85rem',
                      fontSize: '0.95rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: kmFont,
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                  {t('dept_srv_desc_label')}
                </label>
                <textarea
                  placeholder={t('dept_srv_desc_placeholder')}
                  value={srvDescription}
                  onChange={(e) => setSrvDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.72rem 0.85rem',
                    fontSize: '0.95rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
                    fontFamily: kmFont,
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="srvActiveCheck"
                  checked={srvIsActive}
                  onChange={(e) => setSrvIsActive(e.target.checked)}
                />
                <label htmlFor="srvActiveCheck" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer', fontFamily: kmFont }}>
                  {t('dept_srv_active_check')}
                </label>
              </div>

              {srvSubmitError && (
                <div style={{ color: '#dc2626', fontSize: '0.85rem', fontFamily: kmFont }}>
                  {srvSubmitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSrvModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    fontSize: '0.98rem',
                    fontWeight: 500,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={srvLoading}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    fontSize: '0.98rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                    fontFamily: kmFont,
                  }}
                >
                  {editingSrvId ? t('dept_save_btn') : t('dept_create_btn')}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
