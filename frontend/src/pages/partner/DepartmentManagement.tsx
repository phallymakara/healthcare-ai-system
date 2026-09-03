import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const DepartmentManagement: React.FC = () => {
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
      setDeptNameError('Please enter the department name.');
      hasError = true;
    }
    if (!deptCode.trim()) {
      setDeptCodeError('Please enter a department code (e.g. CARD).');
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
        setDeptSubmitError('Unable to save department. Please try again.');
        return;
      }

      setDeptModalOpen(false);
      await loadData();
    } catch {
      setDeptSubmitError('Connection issue saving department. Please try again.');
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
      setSrvDeptError('Please select a department.');
      hasError = true;
    }
    if (!srvName.trim()) {
      setSrvNameError('Please enter the service name.');
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
        setSrvSubmitError('Unable to save service. Please try again.');
        return;
      }

      setSrvModalOpen(false);
      await loadData();
    } catch {
      setSrvSubmitError('Connection issue saving service. Please try again.');
    } finally {
      setSrvLoading(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Top Controls: + Add Department & + Add Service aligned to the left */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
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
          }}
        >
          + Add Department
        </button>
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
          }}
        >
          + Add Service
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Loading departments and services...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {/* Section 1: Clinical Departments Row Layout */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 400, margin: 0, color: 'var(--text-main)' }}>
                Clinical Departments
              </h2>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              overflow: 'hidden',
              boxShadow: 'none',
            }}>
              {departments.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                }}>
                  No departments created yet. Click + Add Department to create one.
                </div>
              ) : (
                departments.map((dept, idx) => (
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
                    }}
                  >
                    {/* Department Name & Code */}
                    <div style={{ minWidth: '220px', flex: '1.5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-main)' }}>
                          {dept.name}
                        </div>
                        <span style={{
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                        }}>
                          {dept.code || 'DEPT'}
                        </span>
                      </div>
                      {dept.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          {dept.description}
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    <div style={{ minWidth: '180px', flex: '1' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Location
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                        {dept.floor_room || 'Main Building'}
                      </div>
                    </div>

                    {/* Consultation Duration */}
                    <div style={{ minWidth: '140px', flex: '0.8' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Avg. Duration
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
                        {dept.avg_consultation_minutes} mins
                      </div>
                    </div>

                    {/* Actions: Three-dot dropdown menu */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setActiveDropdownDeptId(activeDropdownDeptId === dept.id ? null : dept.id)}
                        style={{
                          padding: '0.2rem 0.55rem',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '3px',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                        }}
                      >
                        ···
                      </button>

                      {activeDropdownDeptId === dept.id && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: 'calc(100% + 4px)',
                          background: '#ffffff',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          minWidth: '100px',
                          zIndex: 50,
                          boxShadow: 'none',
                          overflow: 'hidden',
                        }}>
                          <button
                            onClick={() => handleToggleActive(dept)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px solid var(--border-color)',
                              color: dept.is_active ? '#059669' : 'var(--text-muted)',
                              cursor: 'pointer',
                              boxShadow: 'none',
                            }}
                          >
                            Active
                          </button>
                          <button
                            onClick={() => {
                              setActiveDropdownDeptId(null);
                              handleOpenEditDept(dept);
                            }}
                            style={{
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              boxShadow: 'none',
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDept(dept.id)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              fontSize: '0.8rem',
                              fontWeight: 500,
                              textAlign: 'left',
                              background: 'transparent',
                              border: 'none',
                              color: '#dc2626',
                              cursor: 'pointer',
                              boxShadow: 'none',
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Services & Pricing Row Layout */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 400, margin: 0, color: 'var(--text-main)' }}>
                Services & Pricing
              </h2>
            </div>

            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              overflow: 'hidden',
              boxShadow: 'none',
            }}>
              {services.length === 0 ? (
                <div style={{
                  padding: '2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                }}>
                  No clinical services created yet. Click + Add Service to create one.
                </div>
              ) : (
                services.map((srv, idx) => {
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
                        padding: '1rem 1.25rem',
                        borderBottom: idx === services.length - 1 ? 'none' : '1px solid var(--border-color)',
                        background: '#ffffff',
                      }}
                    >
                      {/* Service Name & Description */}
                      <div style={{ minWidth: '220px', flex: '1.5' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {srv.name}
                        </div>
                        {srv.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {srv.description}
                          </div>
                        )}
                      </div>

                      {/* Department */}
                      <div style={{ minWidth: '180px', flex: '1' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Department
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                          {parentDept ? parentDept.name : 'General'}
                        </div>
                      </div>

                      {/* Duration */}
                      <div style={{ minWidth: '120px', flex: '0.7' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Duration
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px' }}>
                          {srv.duration_minutes} mins
                        </div>
                      </div>

                      {/* Price */}
                      <div style={{ minWidth: '100px', flex: '0.6' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Price
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>
                          ${srv.price.toFixed(2)}
                        </div>
                      </div>

                      {/* Edit Button */}
                      <div>
                        <button
                          onClick={() => handleOpenEditService(srv)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            background: 'transparent',
                            border: '1px solid var(--border-color)',
                            borderRadius: '3px',
                            color: 'var(--text-main)',
                            cursor: 'pointer',
                            boxShadow: 'none',
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Department Modal */}
      {deptModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            padding: '1.5rem',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: 'none',
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: 'var(--text-main)' }}>
              {editingDeptId ? 'Edit Clinical Department' : 'Add Clinical Department'}
            </h3>

            <form onSubmit={handleSaveDepartment} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Department Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cardiology, Pediatrics"
                  value={deptName}
                  onChange={(e) => {
                    setDeptName(e.target.value);
                    if (deptNameError) setDeptNameError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: deptNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {deptNameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                    {deptNameError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Department Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. CARD, PED, GEN"
                  value={deptCode}
                  onChange={(e) => {
                    setDeptCode(e.target.value);
                    if (deptCodeError) setDeptCodeError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: deptCodeError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {deptCodeError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                    {deptCodeError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Average Consultation Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={deptMinutes}
                  onChange={(e) => setDeptMinutes(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Used to calculate estimated patient wait times in the queue.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Location (Floor / Room)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Building A, Floor 2, Room 204"
                  value={deptFloorRoom}
                  onChange={(e) => setDeptFloorRoom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Brief clinical description"
                  value={deptDescription}
                  onChange={(e) => setDeptDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <input
                  type="checkbox"
                  id="deptActiveCheck"
                  checked={deptIsActive}
                  onChange={(e) => setDeptIsActive(e.target.checked)}
                />
                <label htmlFor="deptActiveCheck" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Department is active and accepting patients
                </label>
              </div>

              {deptSubmitError && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                  {deptSubmitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setDeptModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deptLoading}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  {editingDeptId ? 'Save Changes' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {srvModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            padding: '1.5rem',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            boxShadow: 'none',
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: 'var(--text-main)' }}>
              {editingSrvId ? 'Edit Clinical Service' : 'Add Clinical Service'}
            </h3>

            <form onSubmit={handleSaveService} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Department
                </label>
                <select
                  value={srvDeptId}
                  onChange={(e) => {
                    setSrvDeptId(e.target.value);
                    if (srvDeptError) setSrvDeptError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: srvDeptError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    background: '#ffffff',
                    color: 'var(--text-main)',
                    boxSizing: 'border-box',
                  }}
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code || 'DEPT'})
                    </option>
                  ))}
                </select>
                {srvDeptError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                    {srvDeptError}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Service Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Routine Consultation, ECG, Ultrasound"
                  value={srvName}
                  onChange={(e) => {
                    setSrvName(e.target.value);
                    if (srvNameError) setSrvNameError(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: srvNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {srvNameError && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                    {srvNameError}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={srvDuration}
                    onChange={(e) => setSrvDuration(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      fontSize: '0.875rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={srvPrice}
                    onChange={(e) => setSrvPrice(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      fontSize: '0.875rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      boxShadow: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Service details or clinical instructions"
                  value={srvDescription}
                  onChange={(e) => setSrvDescription(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
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
                <label htmlFor="srvActiveCheck" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Service is active and available for booking
                </label>
              </div>

              {srvSubmitError && (
                <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                  {srvSubmitError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSrvModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={srvLoading}
                  style={{
                    flex: 1,
                    padding: '0.6rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--text-main)',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    boxShadow: 'none',
                  }}
                >
                  {editingSrvId ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
