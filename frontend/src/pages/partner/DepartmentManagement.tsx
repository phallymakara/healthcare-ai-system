import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import { DepartmentModal } from './departments/DepartmentModal';
import { ServiceModal } from './departments/ServiceModal';
import { DepartmentList } from './departments/DepartmentList';
import { ServiceList } from './departments/ServiceList';

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

  // Department Handlers
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

  // Service Handlers
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
          borderBottom: 'none',
          paddingBottom: '0.25rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`category-filter-pill ${activeTab === 'departments' ? 'active' : ''}`}
            style={{
              padding: '0.5rem 1.15rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'departments' ? 700 : 500,
              fontFamily: kmFont,
              color: activeTab === 'departments' ? '#ffffff' : 'var(--text-muted)',
              background: activeTab === 'departments' ? 'var(--accent-primary)' : 'transparent',
              border: activeTab === 'departments' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t('dept_title_depts')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={`category-filter-pill ${activeTab === 'services' ? 'active' : ''}`}
            style={{
              padding: '0.5rem 1.15rem',
              fontSize: '0.95rem',
              fontWeight: activeTab === 'services' ? 700 : 500,
              fontFamily: kmFont,
              color: activeTab === 'services' ? '#ffffff' : 'var(--text-muted)',
              background: activeTab === 'services' ? 'var(--accent-primary)' : 'transparent',
              border: activeTab === 'services' ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t('dept_title_services')}
          </button>
        </div>

        <div>
          {activeTab === 'departments' ? (
            <button
              type="button"
              onClick={handleOpenNewDept}
              className="hospital-action-btn"
              style={{
                padding: '0.55rem 1.15rem',
                background: 'transparent',
                border: '1px solid var(--text-main)',
                borderRadius: 'var(--radius-full)',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: 600,
                boxShadow: 'none',
                fontFamily: kmFont,
                marginBottom: '6px',
              }}
            >
              {t('dept_add_btn')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenNewService}
              disabled={departments.length === 0}
              className="hospital-action-btn"
              style={{
                padding: '0.55rem 1.15rem',
                background: 'transparent',
                border: '1px solid var(--text-main)',
                borderRadius: 'var(--radius-full)',
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
        <DepartmentList
          departments={departments}
          activeDropdownDeptId={activeDropdownDeptId}
          setActiveDropdownDeptId={setActiveDropdownDeptId}
          onToggleActive={handleToggleActive}
          onEdit={handleOpenEditDept}
          onDelete={handleDeleteDept}
        />
      ) : (
        <ServiceList
          services={services}
          departments={departments}
          activeDropdownSrvId={activeDropdownSrvId}
          setActiveDropdownSrvId={setActiveDropdownSrvId}
          onToggleActive={handleToggleActiveService}
          onEdit={handleOpenEditService}
          onDelete={handleDeleteService}
        />
      )}

      {/* Add / Edit Department Modal */}
      <DepartmentModal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        editingDeptId={editingDeptId}
        deptName={deptName}
        setDeptName={setDeptName}
        deptCode={deptCode}
        setDeptCode={setDeptCode}
        deptMinutes={deptMinutes}
        setDeptMinutes={setDeptMinutes}
        deptFloorRoom={deptFloorRoom}
        setDeptFloorRoom={setDeptFloorRoom}
        deptDescription={deptDescription}
        setDeptDescription={setDeptDescription}
        deptIsActive={deptIsActive}
        setDeptIsActive={setDeptIsActive}
        deptNameError={deptNameError}
        deptCodeError={deptCodeError}
        deptSubmitError={deptSubmitError}
        deptLoading={deptLoading}
        onSave={handleSaveDepartment}
      />

      {/* Add / Edit Service Modal */}
      <ServiceModal
        isOpen={srvModalOpen}
        onClose={() => setSrvModalOpen(false)}
        editingSrvId={editingSrvId}
        departments={departments}
        srvDeptId={srvDeptId}
        setSrvDeptId={setSrvDeptId}
        srvName={srvName}
        setSrvName={setSrvName}
        srvDuration={srvDuration}
        setSrvDuration={setSrvDuration}
        srvPrice={srvPrice}
        setSrvPrice={setSrvPrice}
        srvDescription={srvDescription}
        setSrvDescription={setSrvDescription}
        srvIsActive={srvIsActive}
        setSrvIsActive={setSrvIsActive}
        srvNameError={srvNameError}
        srvDeptError={srvDeptError}
        srvSubmitError={srvSubmitError}
        srvLoading={srvLoading}
        onSave={handleSaveService}
      />
    </div>
  );
};
