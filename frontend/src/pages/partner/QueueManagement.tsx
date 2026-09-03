import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { RealTimeQueueClient } from '../../services/websocket';
import { API_BASE } from '../../services/api';

export const QueueManagement: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Walk-in modal state & errors
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDeptId, setWalkInDeptId] = useState('');
  const [walkInDoctorId, setWalkInDoctorId] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState('');
  const [walkInNameError, setWalkInNameError] = useState<string | null>(null);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  // Thermal Slip display after issuance
  const [issuedTicketSlip, setIssuedTicketSlip] = useState<any | null>(null);

  // Queue sub-tabs: 'waiting' vs 'skipped'
  const [activeQueueTab, setActiveQueueTab] = useState<'waiting' | 'skipped'>('waiting');

  // Elapsed consultation timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Web Audio chime for patient calls
  const playCallingChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.18);
      gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.65);
    } catch {
      // Audio playback restriction handling
    }
  };

  // 1. Fetch departments, doctors, and services
  const loadClinicalData = async () => {
    try {
      const [deptRes, docRes, srvRes] = await Promise.all([
        fetch(`${API_BASE}/partners/departments`, { headers: AuthService.getAuthHeaders() }),
        fetch(`${API_BASE}/partners/doctors`, { headers: AuthService.getAuthHeaders() }),
        fetch(`${API_BASE}/partners/services`, { headers: AuthService.getAuthHeaders() }),
      ]);

      if (deptRes.ok) {
        const deptData = await deptRes.json();
        setDepartments(deptData);
        if (deptData.length > 0 && !selectedDeptId) {
          setSelectedDeptId(deptData[0].id);
          setWalkInDeptId(deptData[0].id);
        }
      }

      if (docRes.ok) {
        setDoctors(await docRes.json());
      }

      if (srvRes.ok) {
        setServices(await srvRes.json());
      }
    } catch {
      // Ignore background fetch error
    }
  };

  // 2. Fetch live queue snapshot for selected department
  const loadQueueSnapshot = async () => {
    if (!selectedDeptId) return;
    setLoading(true);
    setActionError(null);
    try {
      const sessionRes = await fetch(`${API_BASE}/queues/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({
          hospital_id: AuthService.getStoredUser()?.hospital_id || '11c80144-bc31-4ed1-8529-f25db3a203d3',
          department_id: selectedDeptId,
        }),
      });

      if (sessionRes.ok) {
        const session = await sessionRes.json();
        const liveRes = await fetch(`${API_BASE}/queues/${session.id}`, {
          headers: AuthService.getAuthHeaders(),
        });
        if (liveRes.ok) {
          setQueueData(await liveRes.json());
        }
      }
    } catch {
      setActionError('Unable to load live queue. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClinicalData();
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      loadQueueSnapshot();
      const ws = new RealTimeQueueClient(`queue:${selectedDeptId}`);
      ws.connect();
      const unsub = ws.subscribe(() => {
        loadQueueSnapshot();
      });
      return () => {
        unsub();
        ws.disconnect();
      };
    }
  }, [selectedDeptId]);

  const activeTickets = queueData?.active_tickets || [];
  const skippedTickets = queueData?.skipped_tickets || [];
  const servingTicket = activeTickets.find((t: any) => t.status === 'SERVING' || t.status === 'CALLED');
  const waitingTickets = activeTickets.filter((t: any) => t.status === 'WAITING');

  // Filtered doctors & services based on walkInDeptId
  const availableDoctors = doctors.filter(
    (d: any) => !walkInDeptId || d.department_id === walkInDeptId
  );
  const availableServices = services.filter(
    (s: any) => !walkInDeptId || s.department_id === walkInDeptId
  );

  // Elapsed consultation timer
  useEffect(() => {
    let interval: any = null;
    if (servingTicket && servingTicket.status === 'SERVING') {
      const startTime = servingTicket.serving_started_at 
        ? new Date(servingTicket.serving_started_at).getTime() 
        : Date.now();
      
      const updateElapsed = () => {
        const diff = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setElapsedSeconds(diff);
      };
      
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [servingTicket?.id, servingTicket?.status]);

  const formatElapsed = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Actions
  const handleCallNext = async () => {
    if (!queueData?.session_id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/queues/${queueData.session_id}/call-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({ note: 'Called from Counter Console' }),
      });
      if (!res.ok) {
        setActionError('Unable to call next patient. Please try again.');
        return;
      }
      playCallingChime();
      await loadQueueSnapshot();
    } catch {
      setActionError('Connection issue calling next patient. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartServing = async (ticketId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
      });
      if (!res.ok) {
        setActionError('Unable to start consultation visit. Please try again.');
        return;
      }
      await loadQueueSnapshot();
    } catch {
      setActionError('Connection issue starting visit. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (ticketId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
      });
      if (!res.ok) {
        setActionError('Unable to complete visit. Please try again.');
        return;
      }
      await loadQueueSnapshot();
    } catch {
      setActionError('Connection issue completing visit. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = async (ticketId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/skip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
      });
      if (!res.ok) {
        setActionError('Unable to skip patient. Please try again.');
        return;
      }
      await loadQueueSnapshot();
    } catch {
      setActionError('Connection issue skipping patient. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecall = async (ticketId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/recall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({ note: 'Recalled from Counter Console' }),
      });
      if (!res.ok) {
        setActionError('Unable to recall patient. Please try again.');
        return;
      }
      playCallingChime();
      await loadQueueSnapshot();
    } catch {
      setActionError('Connection issue recalling patient. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async (ticketId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/no-show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
      });
      if (!res.ok) {
        setActionError('Unable to mark patient as no-show. Please try again.');
        return;
      }
      await loadQueueSnapshot();
    } catch {
      setActionError('Connection issue marking no-show. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInNameError(null);
    setWalkInError(null);

    if (!walkInName.trim()) {
      setWalkInNameError('Please enter the patient full name.');
      return;
    }

    setActionLoading(true);
    try {
      const targetDeptId = walkInDeptId || selectedDeptId;
      const res = await fetch(`${API_BASE}/tickets/walk-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({
          hospital_id: AuthService.getStoredUser()?.hospital_id || '11c80144-bc31-4ed1-8529-f25db3a203d3',
          department_id: targetDeptId,
          doctor_id: walkInDoctorId || undefined,
          service_id: walkInServiceId || undefined,
          patient_name: walkInName.trim(),
          patient_phone: walkInPhone.trim() || undefined,
        }),
      });

      if (!res.ok) {
        setWalkInError('Unable to issue walk-in ticket. Please try again.');
        return;
      }

      const createdTicket = await res.json();
      
      // Store ticket to display printable slip
      const selectedDeptObj = departments.find((d: any) => d.id === targetDeptId);
      const selectedDocObj = doctors.find((d: any) => d.id === walkInDoctorId);
      const selectedSrvObj = services.find((s: any) => s.id === walkInServiceId);

      setIssuedTicketSlip({
        ...createdTicket,
        department_name: selectedDeptObj ? selectedDeptObj.name : queueData?.department_name || 'General',
        doctor_name: selectedDocObj ? selectedDocObj.full_name : null,
        service_name: selectedSrvObj ? selectedSrvObj.name : null,
        issued_at: new Date(),
      });

      // Clear form inputs
      setWalkInName('');
      setWalkInPhone('');
      setWalkInDoctorId('');
      setWalkInServiceId('');
      await loadQueueSnapshot();
    } catch {
      setWalkInError('Connection issue issuing walk-in ticket. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  const handleCloseSlipModal = () => {
    setIssuedTicketSlip(null);
    setWalkInModalOpen(false);
  };

  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Print styles for 80mm thermal receipt printer */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-slip-print-area, #thermal-slip-print-area * {
            visibility: visible !important;
          }
          #thermal-slip-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            padding: 4mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: monospace !important;
          }
        }
      `}</style>

      {/* Top Station Header */}
      {/* Top Controls: Department Selector & Issue Walk-In Ticket aligned to the left */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <select
          value={selectedDeptId}
          onChange={(e) => {
            setSelectedDeptId(e.target.value);
            setWalkInDeptId(e.target.value);
          }}
          style={{
            padding: '0.55rem 0.9rem',
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            color: 'var(--text-main)',
            fontSize: '0.875rem',
            fontWeight: 600,
            boxShadow: 'none',
            outline: 'none',
          }}
        >
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name} ({dept.code || 'DEPT'})
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setWalkInName('');
            setWalkInPhone('');
            setWalkInDeptId(selectedDeptId);
            setWalkInDoctorId('');
            setWalkInServiceId('');
            setWalkInNameError(null);
            setWalkInError(null);
            setIssuedTicketSlip(null);
            setWalkInModalOpen(true);
          }}
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
          + Issue Walk-In Ticket
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Connecting to live counter stream...
        </div>
      ) : (
        <>
          {/* Main Counter Panel Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Currently Serving Station Card */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '1.5rem',
              boxShadow: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {queueData?.department_name}
                  </span>
                </div>

                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    Currently Serving
                  </div>
                  <div style={{
                    fontSize: '3.6rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: 'var(--text-main)',
                    letterSpacing: '-0.02em',
                    margin: '0.4rem 0',
                  }}>
                    {servingTicket ? servingTicket.ticket_number : '—'}
                  </div>

                  {servingTicket ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 600 }}>
                        {servingTicket.patient_name}{' '}
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 400 }}>
                          ({servingTicket.ticket_source === 'WALK_IN' ? 'Walk-in' : 'Online'})
                        </span>
                      </div>

                      {/* Live Consultation Timer */}
                      {servingTicket.status === 'SERVING' ? (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 700, marginTop: '4px' }}>
                          Consultation Time: {formatElapsed(elapsedSeconds)}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Patient Called — Waiting to enter room
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      No patient currently called.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons & Contextual Inline Error */}
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <button
                    onClick={handleCallNext}
                    disabled={actionLoading || waitingTickets.length === 0}
                    style={{
                      padding: '0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      gridColumn: 'span 3',
                      background: 'transparent',
                      border: '1px solid var(--text-main)',
                      borderRadius: '4px',
                      color: 'var(--text-main)',
                      cursor: waitingTickets.length === 0 ? 'not-allowed' : 'pointer',
                      opacity: waitingTickets.length === 0 ? 0.4 : 1,
                      boxShadow: 'none',
                    }}
                  >
                    Call Next Patient ({waitingTickets.length} Waiting)
                  </button>

                  {servingTicket && servingTicket.status === 'CALLED' && (
                    <button
                      onClick={() => handleStartServing(servingTicket.id)}
                      disabled={actionLoading}
                      style={{
                        padding: '0.5rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: 'transparent',
                        border: '1px solid var(--text-main)',
                        borderRadius: '4px',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        boxShadow: 'none',
                      }}
                    >
                      Start Visit
                    </button>
                  )}

                  {servingTicket && (
                    <>
                      <button
                        onClick={() => handleComplete(servingTicket.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: 'transparent',
                          border: '1px solid var(--text-main)',
                          borderRadius: '4px',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                        }}
                      >
                        Complete Visit
                      </button>
                      <button
                        onClick={() => handleSkip(servingTicket.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          boxShadow: 'none',
                        }}
                      >
                        Skip
                      </button>
                      <button
                        onClick={() => handleNoShow(servingTicket.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem',
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          background: 'transparent',
                          border: '1px solid #dc2626',
                          borderRadius: '4px',
                          color: '#dc2626',
                          cursor: 'pointer',
                          boxShadow: 'none',
                        }}
                      >
                        Mark No-Show
                      </button>
                    </>
                  )}
                </div>

                {/* Inline Action Error Message (Plain text, no container, no fill) */}
                {actionError && (
                  <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.65rem', textAlign: 'center' }}>
                    {actionError}
                  </div>
                )}
              </div>
            </div>

            {/* Counter Live Telemetry Indicators */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                flex: 1,
                padding: '1.25rem',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                boxShadow: 'none',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Est. Wait for New Arrival
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 400, color: 'var(--text-main)' }}>
                  ~{queueData?.estimated_wait_minutes_for_new || 0} mins
                </div>
              </div>

              <div style={{
                flex: 1,
                padding: '1.25rem',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                boxShadow: 'none',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Waiting in Queue
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 400, color: 'var(--text-main)' }}>
                  {queueData?.total_waiting || 0} patients
                </div>
              </div>

              <div style={{
                flex: 1,
                padding: '1.25rem',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                boxShadow: 'none',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Completed Consultations Today
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 400, color: 'var(--text-main)' }}>
                  {queueData?.total_completed_today || 0} visits
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Queue Tabs and Table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '1.25rem',
        boxShadow: 'none',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '380px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Sub-Tab Switcher */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setActiveQueueTab('waiting')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeQueueTab === 'waiting' ? '2px solid var(--text-main)' : '2px solid transparent',
                color: activeQueueTab === 'waiting' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: activeQueueTab === 'waiting' ? 700 : 500,
                padding: '0.35rem 0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Active Queue ({waitingTickets.length})
            </button>

            <button
              onClick={() => setActiveQueueTab('skipped')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeQueueTab === 'skipped' ? '2px solid var(--text-main)' : '2px solid transparent',
                color: activeQueueTab === 'skipped' ? 'var(--text-main)' : 'var(--text-muted)',
                fontWeight: activeQueueTab === 'skipped' ? 700 : 500,
                padding: '0.35rem 0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Skipped Patients ({skippedTickets.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Active Waiting Queue */}
        {activeQueueTab === 'waiting' && (
          activeTickets.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No patients currently waiting in queue.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Ticket</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Patient Name</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Source</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Est. Wait</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTickets.map((ticket: any) => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-main)' }}>
                        {ticket.ticket_number}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 500, color: 'var(--text-main)' }}>{ticket.patient_name}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          padding: '0.15rem 0.4rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}>
                          {ticket.ticket_source === 'WALK_IN' ? 'Walk-in' : 'Online'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          padding: '0.15rem 0.4rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          color: ticket.status === 'SERVING' ? '#0284c7' : ticket.status === 'CALLED' ? '#059669' : 'var(--text-muted)',
                        }}>
                          {ticket.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>
                        ~{ticket.estimated_wait_minutes} mins
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {ticket.status === 'WAITING' && (
                            <button
                              onClick={() => handleSkip(ticket.id)}
                              disabled={actionLoading}
                              style={{
                                padding: '0.2rem 0.55rem',
                                fontSize: '0.75rem',
                                background: 'transparent',
                                border: '1px solid var(--border-color)',
                                borderRadius: '3px',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                boxShadow: 'none',
                              }}
                            >
                              Skip
                            </button>
                          )}
                          {ticket.status === 'SERVING' && (
                            <button
                              onClick={() => handleComplete(ticket.id)}
                              disabled={actionLoading}
                              style={{
                                padding: '0.2rem 0.55rem',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: 'transparent',
                                border: '1px solid var(--text-main)',
                                borderRadius: '3px',
                                color: 'var(--text-main)',
                                cursor: 'pointer',
                                boxShadow: 'none',
                              }}
                            >
                              Finish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Tab 2: Skipped Patients Queue with Recall Action */}
        {activeQueueTab === 'skipped' && (
          skippedTickets.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No skipped patients.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Ticket</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Patient Name</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Phone</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Source</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.65rem 0.75rem', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {skippedTickets.map((ticket: any) => (
                    <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.65rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>
                        {ticket.ticket_number}
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem', fontWeight: 500, color: 'var(--text-main)' }}>{ticket.patient_name}</td>
                      <td style={{ padding: '0.65rem 0.75rem', color: 'var(--text-muted)' }}>{ticket.patient_phone || '—'}</td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          padding: '0.15rem 0.4rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}>
                          {ticket.ticket_source === 'WALK_IN' ? 'Walk-in' : 'Online'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <span style={{
                          padding: '0.15rem 0.4rem',
                          border: '1px solid var(--border-color)',
                          borderRadius: '3px',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                        }}>
                          SKIPPED
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.75rem' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleRecall(ticket.id)}
                            disabled={actionLoading}
                            style={{
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: 'transparent',
                              border: '1px solid var(--text-main)',
                              borderRadius: '3px',
                              color: 'var(--text-main)',
                              cursor: 'pointer',
                              boxShadow: 'none',
                            }}
                          >
                            Recall Patient
                          </button>
                          <button
                            onClick={() => handleNoShow(ticket.id)}
                            disabled={actionLoading}
                            style={{
                              padding: '0.2rem 0.55rem',
                              fontSize: '0.75rem',
                              background: 'transparent',
                              border: '1px solid #dc2626',
                              borderRadius: '3px',
                              color: '#dc2626',
                              cursor: 'pointer',
                              boxShadow: 'none',
                            }}
                          >
                            Mark No-Show
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Walk-in Ticket Modal (Flat, Zero Shadow, Zero Icons, Inline Text Errors) */}
      {walkInModalOpen && (
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
            {/* View A: Issued Printable Thermal Slip */}
            {issuedTicketSlip ? (
              <div>
                <div id="thermal-slip-print-area" style={{
                  border: '1px dashed var(--border-color)',
                  padding: '1.25rem',
                  borderRadius: '4px',
                  marginBottom: '1.25rem',
                  textAlign: 'center',
                  background: '#ffffff',
                }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    {queueData?.hospital_name || 'Healthcare Partner Center'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Walk-In Patient Queue Receipt
                  </div>

                  <div style={{
                    fontSize: '2.75rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: 'var(--text-main)',
                    letterSpacing: '-0.02em',
                    margin: '0.25rem 0',
                  }}>
                    {issuedTicketSlip.ticket_number}
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {issuedTicketSlip.patient_name}
                  </div>
                  {issuedTicketSlip.patient_phone && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Tel: {issuedTicketSlip.patient_phone}
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.6rem 0', margin: '0.75rem 0', textAlign: 'left', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{issuedTicketSlip.department_name}</span>
                    </div>
                    {issuedTicketSlip.doctor_name && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Doctor:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{issuedTicketSlip.doctor_name}</span>
                      </div>
                    )}
                    {issuedTicketSlip.service_name && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{issuedTicketSlip.service_name}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Queue Position:</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>#{issuedTicketSlip.position} in line</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Estimated Wait:</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>~{issuedTicketSlip.estimated_wait_minutes} mins</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Issued: {new Date(issuedTicketSlip.issued_at).toLocaleDateString()} {new Date(issuedTicketSlip.issued_at).toLocaleTimeString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Please wait in the reception lobby for your number to be called.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleCloseSlipModal}
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
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintSlip}
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
                    Print Ticket Slip
                  </button>
                </div>
              </div>
            ) : (
              /* View B: Intake Form */
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1.25rem 0', color: 'var(--text-main)' }}>
                  Issue Walk-In Ticket
                </h3>
                
                <form onSubmit={handleIssueWalkIn} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Patient Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={walkInName}
                      onChange={(e) => {
                        setWalkInName(e.target.value);
                        if (walkInNameError) setWalkInNameError(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        fontSize: '0.875rem',
                        borderRadius: '4px',
                        border: walkInNameError ? '1px solid #dc2626' : '1px solid var(--border-color)',
                        boxShadow: 'none',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    {/* Contextual Inline Error for Input (No Container, Plain Text) */}
                    {walkInNameError && (
                      <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>
                        {walkInNameError}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Phone Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter phone number"
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
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
                      Department
                    </label>
                    <select
                      value={walkInDeptId}
                      onChange={(e) => {
                        setWalkInDeptId(e.target.value);
                        setWalkInDoctorId('');
                        setWalkInServiceId('');
                      }}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        fontSize: '0.875rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
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
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Preferred Doctor (Optional)
                    </label>
                    <select
                      value={walkInDoctorId}
                      onChange={(e) => setWalkInDoctorId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        fontSize: '0.875rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'none',
                        outline: 'none',
                        background: '#ffffff',
                        color: 'var(--text-main)',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="">Any Available Specialist</option>
                      {availableDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.full_name} ({doc.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Service (Optional)
                    </label>
                    <select
                      value={walkInServiceId}
                      onChange={(e) => setWalkInServiceId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.6rem',
                        fontSize: '0.875rem',
                        borderRadius: '4px',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'none',
                        outline: 'none',
                        background: '#ffffff',
                        color: 'var(--text-main)',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="">Standard Consultation</option>
                      {availableServices.map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name} {srv.price ? `($${srv.price})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* General Form Error (No Container, Plain Text) */}
                  {walkInError && (
                    <div style={{ color: '#dc2626', fontSize: '0.8rem' }}>
                      {walkInError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setWalkInModalOpen(false)}
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
                      disabled={actionLoading}
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
                      Generate Ticket
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
