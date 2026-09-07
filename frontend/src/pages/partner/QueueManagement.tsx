import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Play,
  Volume2,
  RotateCcw,
  Smartphone,
  Check,
  UserX,
} from 'lucide-react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { RealTimeQueueClient } from '../../services/websocket';
import { API_BASE } from '../../services/api';

interface BookingItem {
  id: string;
  ticket_number: string;
  patient_name: string;
  patient_phone?: string;
  patient_id?: string;
  ticket_source: string;
  status: string;
  appointment_date?: string;
  appointment_time?: string;
  department_id: string;
  department_name?: string;
  department_code?: string;
  doctor_id?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  service_id?: string;
  service_name?: string;
  position: number;
  estimated_wait_minutes: number;
  created_at: string;
  serving_started_at?: string;
  completed_at?: string;
}

interface BookingsSummary {
  total_bookings: number;
  online_bookings: number;
  walkin_bookings: number;
  waiting_count: number;
  serving_count: number;
  completed_count: number;
}

export const QueueManagement: React.FC = () => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  // Master Data
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  // Bookings Data & Summary
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [summary, setSummary] = useState<BookingsSummary>({
    total_bookings: 0,
    online_bookings: 0,
    walkin_bookings: 0,
    waiting_count: 0,
    serving_count: 0,
    completed_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters State
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSource, setSelectedSource] = useState<string>('ALL'); // 'ALL' | 'ONLINE' | 'WALK_IN'
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL'); // 'ALL' | 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'SKIPPED'
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Live Timer for serving items
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio chime for patient calls
  const playCallingChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.18); // E5
      gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.18);
      osc2.stop(ctx.currentTime + 0.6);
    } catch {
      // AudioContext unavailable or restricted by browser policy
    }
  };

  // Load clinical metadata: departments, doctors, services
  const loadClinicalData = async () => {
    try {
      const [deptRes, docRes, srvRes] = await Promise.all([
        fetch(`${API_BASE}/partners/departments`, { headers: AuthService.getAuthHeaders() }),
        fetch(`${API_BASE}/partners/doctors`, { headers: AuthService.getAuthHeaders() }),
        fetch(`${API_BASE}/partners/services`, { headers: AuthService.getAuthHeaders() }),
      ]);

      if (deptRes.ok) {
        const depts = await deptRes.json();
        setDepartments(depts);
        if (depts.length > 0 && !walkInDeptId) {
          setWalkInDeptId(depts[0].id);
        }
      }
      if (docRes.ok) {
        const docs = await docRes.json();
        setDoctors(docs);
      }
      if (srvRes.ok) {
        const srvs = await srvRes.json();
        setServices(srvs);
      }
    } catch {
      setActionError('Error loading hospital configuration.');
    }
  };

  // Fetch customer booking slots from backend
  const loadBookings = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const params = new URLSearchParams();
      if (selectedDeptId) params.append('department_id', selectedDeptId);
      if (selectedDoctorId) params.append('doctor_id', selectedDoctorId);
      if (selectedDate) params.append('booking_date', selectedDate);
      if (selectedSource && selectedSource !== 'ALL') params.append('source', selectedSource);
      if (selectedStatus && selectedStatus !== 'ALL') params.append('status_filter', selectedStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`${API_BASE}/partners/bookings?${params.toString()}`, {
        headers: AuthService.getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        setActionError('Failed to fetch booking slots.');
      }
    } catch {
      setActionError('Connection error loading booking slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClinicalData();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [selectedDeptId, selectedDoctorId, selectedDate, selectedSource, selectedStatus]);

  // WebSocket Live Subscription
  useEffect(() => {
    const targetDept = selectedDeptId || (departments.length > 0 ? departments[0].id : null);
    if (targetDept) {
      const ws = new RealTimeQueueClient(`queue:${targetDept}`);
      ws.connect();
      const unsub = ws.subscribe(() => {
        loadBookings();
      });
      return () => {
        unsub();
        ws.disconnect();
      };
    }
  }, [selectedDeptId, departments]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBookings();
  };

  // Actions on individual booking slots
  const handleCallTicket = async (ticketId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`${API_BASE}/tickets/${ticketId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AuthService.getAuthHeaders() },
        body: JSON.stringify({ note: 'Called from Customer Booking Slots view' }),
      });
      if (!res.ok) {
        setActionError('Unable to call patient ticket.');
        return;
      }
      playCallingChime();
      await loadBookings();
    } catch {
      setActionError('Network error calling patient.');
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
        setActionError('Unable to start consultation.');
        return;
      }
      await loadBookings();
    } catch {
      setActionError('Network error starting consultation.');
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
        setActionError('Unable to complete consultation.');
        return;
      }
      await loadBookings();
    } catch {
      setActionError('Network error completing consultation.');
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
        setActionError('Unable to skip patient.');
        return;
      }
      await loadBookings();
    } catch {
      setActionError('Network error skipping patient.');
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
        body: JSON.stringify({ note: 'Recalled from Customer Booking Slots view' }),
      });
      if (!res.ok) {
        setActionError('Unable to recall patient.');
        return;
      }
      playCallingChime();
      await loadBookings();
    } catch {
      setActionError('Network error recalling patient.');
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
        setActionError('Unable to mark as no-show.');
        return;
      }
      await loadBookings();
    } catch {
      setActionError('Network error marking no-show.');
    } finally {
      setActionLoading(false);
    }
  };

  // Walk-In ticket submission
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
      const targetDeptId = walkInDeptId || (departments.length > 0 ? departments[0].id : '');
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
      const selectedDeptObj = departments.find((d: any) => d.id === targetDeptId);
      const selectedDocObj = doctors.find((d: any) => d.id === walkInDoctorId);
      const selectedSrvObj = services.find((s: any) => s.id === walkInServiceId);

      setIssuedTicketSlip({
        ...createdTicket,
        department_name: selectedDeptObj ? selectedDeptObj.name : 'General',
        doctor_name: selectedDocObj ? selectedDocObj.full_name : null,
        service_name: selectedSrvObj ? selectedSrvObj.name : null,
        issued_at: new Date(),
      });

      // Clear form inputs
      setWalkInName('');
      setWalkInPhone('');
      setWalkInDoctorId('');
      setWalkInServiceId('');
      await loadBookings();
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

  // Doctors & Services filtered by walkInDeptId
  const availableDoctors = doctors.filter(
    (d: any) => !walkInDeptId || d.department_id === walkInDeptId
  );
  const availableServices = services.filter(
    (s: any) => !walkInDeptId || s.department_id === walkInDeptId
  );

  // Status Badge Rendering Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
            }}
          >
            {t('cbs_status_waiting')}
          </span>
        );
      case 'CALLED':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd',
            }}
          >
            {t('cbs_status_called')}
          </span>
        );
      case 'SERVING':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0',
            }}
          >
            {t('cbs_status_serving')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #e2e8f0',
            }}
          >
            {t('cbs_status_completed')}
          </span>
        );
      case 'SKIPPED':
      case 'NO_SHOW':
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#ffe4e6',
              color: '#be123c',
              border: '1px solid #fecdd3',
            }}
          >
            {t('cbs_status_skipped')}
          </span>
        );
      default:
        return (
          <span
            style={{
              padding: '0.25rem 0.65rem',
              borderRadius: '4px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #e5e7eb',
            }}
          >
            {status}
          </span>
        );
    }
  };

  // Format Elapsed consultation time helper
  const formatElapsedTimer = (startedAt?: string) => {
    if (!startedAt) return '00:00';
    const startMs = new Date(startedAt).getTime();
    const diffSec = Math.max(0, Math.floor((nowTimestamp - startMs) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: kmFont,
        gap: '1.25rem',
      }}
    >
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

      {/* Top Header & Walk-In Button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: '#ffffff',
          padding: '1.25rem 1.5rem',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          boxShadow: 'none',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Calendar size={22} style={{ color: 'var(--text-main)' }} />
            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: 0,
                fontFamily: kmFont,
              }}
            >
              {t('cbs_title')}
            </h1>
          </div>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
              margin: '0.35rem 0 0 0',
              fontFamily: kmFont,
            }}
          >
            {t('cbs_subtitle')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => loadBookings()}
            title={t('cbs_refresh')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: 'var(--text-main)',
              cursor: 'pointer',
              boxShadow: 'none',
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>

          <button
            onClick={() => {
              setWalkInName('');
              setWalkInPhone('');
              setWalkInDeptId(selectedDeptId || (departments.length > 0 ? departments[0].id : ''));
              setWalkInDoctorId('');
              setWalkInServiceId('');
              setWalkInNameError(null);
              setWalkInError(null);
              setIssuedTicketSlip(null);
              setWalkInModalOpen(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.6rem 1.1rem',
              background: 'var(--text-main)',
              border: '1px solid var(--text-main)',
              borderRadius: '4px',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              fontFamily: kmFont,
              cursor: 'pointer',
              boxShadow: 'none',
            }}
          >
            <Plus size={16} />
            {t('qm_issue_walkin')}
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
            {t('cbs_stat_total')}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginTop: '0.25rem',
            }}
          >
            {summary.total_bookings}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1rem',
            boxShadow: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              color: '#059669',
              fontFamily: kmFont,
            }}
          >
            <Smartphone size={14} />
            {t('cbs_stat_online')}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#059669',
              marginTop: '0.25rem',
            }}
          >
            {summary.online_bookings}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1rem',
            boxShadow: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              color: '#4b5563',
              fontFamily: kmFont,
            }}
          >
            <User size={14} />
            {t('cbs_stat_walkin')}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#4b5563',
              marginTop: '0.25rem',
            }}
          >
            {summary.walkin_bookings}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#d97706', fontFamily: kmFont }}>
            {t('cbs_stat_waiting')}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#d97706',
              marginTop: '0.25rem',
            }}
          >
            {summary.waiting_count}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#16a34a', fontFamily: kmFont }}>
            {t('cbs_stat_serving')}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#16a34a',
              marginTop: '0.25rem',
            }}
          >
            {summary.serving_count}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: kmFont }}>
            {t('cbs_stat_completed')}
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#64748b',
              marginTop: '0.25rem',
            }}
          >
            {summary.completed_count}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '1.1rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          boxShadow: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          {/* Department Filter */}
          <div style={{ flex: '1 1 200px' }}>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                fontSize: '0.88rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-main)',
                fontFamily: kmFont,
                boxShadow: 'none',
                outline: 'none',
              }}
            >
              <option value="">{t('cbs_all_departments')}</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} {dept.code ? `(${dept.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Filter */}
          <div style={{ flex: '1 1 200px' }}>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                fontSize: '0.88rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-main)',
                fontFamily: kmFont,
                boxShadow: 'none',
                outline: 'none',
              }}
            >
              <option value="">{t('cbs_all_doctors')}</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.full_name} ({doc.specialty})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker & Quick Date Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.88rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-main)',
                fontFamily: kmFont,
                boxShadow: 'none',
                outline: 'none',
              }}
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background:
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'var(--text-main)'
                    : '#ffffff',
                color:
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? '#ffffff'
                    : 'var(--text-main)',
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              {t('cbs_today')}
            </button>
            <button
              onClick={() => setSelectedDate('')}
              style={{
                padding: '0.5rem 0.75rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: selectedDate === '' ? 'var(--text-main)' : '#ffffff',
                color: selectedDate === '' ? '#ffffff' : 'var(--text-main)',
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              {t('cbs_all_dates')}
            </button>
          </div>
        </div>

        {/* Second Filter Row: Source tabs, Status tabs, Search bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'space-between',
          }}
        >
          {/* Source Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: t('cbs_source_all') },
              { key: 'ONLINE', label: t('cbs_source_online') },
              { key: 'WALK_IN', label: t('cbs_source_walkin') },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSelectedSource(s.key)}
                style={{
                  padding: '0.42rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: selectedSource === s.key ? 700 : 500,
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  background: selectedSource === s.key ? 'var(--text-main)' : '#ffffff',
                  color: selectedSource === s.key ? '#ffffff' : 'var(--text-main)',
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  boxShadow: 'none',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Status Select */}
          <div style={{ minWidth: '160px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.75rem',
                fontSize: '0.85rem',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: '#ffffff',
                color: 'var(--text-main)',
                fontFamily: kmFont,
                boxShadow: 'none',
                outline: 'none',
              }}
            >
              <option value="ALL">{t('cbs_status_all')}</option>
              <option value="WAITING">{t('cbs_status_waiting')}</option>
              <option value="CALLED">{t('cbs_status_called')}</option>
              <option value="SERVING">{t('cbs_status_serving')}</option>
              <option value="COMPLETED">{t('cbs_status_completed')}</option>
              <option value="SKIPPED">{t('cbs_status_skipped')}</option>
            </select>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              flex: '1 1 240px',
              maxWidth: '380px',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '10px',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder={t('cbs_search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.48rem 0.75rem 0.48rem 32px',
                  fontSize: '0.85rem',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'none',
                  outline: 'none',
                  fontFamily: kmFont,
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.48rem 0.85rem',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: 600,
                fontFamily: kmFont,
                cursor: 'pointer',
                boxShadow: 'none',
              }}
            >
              <Search size={14} />
            </button>
          </form>
        </div>
      </div>

      {/* Action Notification or Error Banner */}
      {actionError && (
        <div
          style={{
            padding: '0.75rem 1rem',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: '4px',
            color: '#dc2626',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontFamily: kmFont,
          }}
        >
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Booking Slots Grid / Cards */}
      {loading ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            color: 'var(--text-muted)',
            fontSize: '0.95rem',
            background: '#ffffff',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            fontFamily: kmFont,
          }}
        >
          {t('qm_loading')}
        </div>
      ) : bookings.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: '#ffffff',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <Calendar size={44} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          <div
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--text-main)',
              fontFamily: kmFont,
            }}
          >
            {t('cbs_no_bookings')}
          </div>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
              maxWidth: '450px',
              margin: 0,
              fontFamily: kmFont,
            }}
          >
            {t('cbs_subtitle')}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          {bookings.map((item) => {
            const isOnline = item.ticket_source === 'ONLINE';
            const isServing = item.status === 'SERVING';
            const isCalled = item.status === 'CALLED';
            const isWaiting = item.status === 'WAITING';
            const isSkipped = item.status === 'SKIPPED' || item.status === 'NO_SHOW';
            const isCompleted = item.status === 'COMPLETED';

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  border: isServing
                    ? '1.5px solid #16a34a'
                    : isCalled
                    ? '1.5px solid #0284c7'
                    : '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '1.25rem 1.4rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  boxShadow: 'none',
                }}
              >
                {/* Slot Top Meta Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    {/* Time Slot Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        fontFamily: 'monospace',
                        background: '#f8fafc',
                        border: '1px solid var(--border-color)',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '4px',
                      }}
                    >
                      <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{item.appointment_time || new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Date Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <Calendar size={14} />
                      <span>
                        {item.appointment_date || new Date(item.created_at).toISOString().split('T')[0]}
                      </span>
                    </div>

                    {/* Ticket Monospace Number */}
                    <div
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        fontFamily: 'monospace',
                        color: 'var(--text-main)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      #{item.ticket_number}
                    </div>

                    {/* Ticket Source Pill */}
                    {isOnline ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        <Smartphone size={12} />
                        {t('cbs_source_online')}
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: '#f3f4f6',
                          color: '#4b5563',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <User size={12} />
                        {t('cbs_source_walkin')}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>{renderStatusBadge(item.status)}</div>
                </div>

                {/* Slot Details Body Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {/* Patient Info */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      {t('cbs_slot_patient')}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {item.patient_name}
                    </div>
                    {item.patient_phone && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.85rem',
                          color: 'var(--text-muted)',
                          marginTop: '0.2rem',
                        }}
                      >
                        <Phone size={13} />
                        <span>{item.patient_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Doctor & Department */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      {t('cbs_slot_doctor')}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {item.doctor_name ? (
                        <>
                          {item.doctor_name}{' '}
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            ({item.doctor_specialty || 'Specialist'})
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{t('qm_any_specialist')}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {item.department_name} {item.department_code ? `(${item.department_code})` : ''}
                    </div>
                  </div>

                  {/* Service */}
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      {t('cbs_slot_service')}
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                      {item.service_name || t('qm_standard_consultation')}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {t('cbs_queue_pos')}: #{item.position || 1} • {t('cbs_est_wait')}: ~{item.estimated_wait_minutes || 0} {t('pd_mins')}
                    </div>
                  </div>

                  {/* Live Consultation Timer if Serving */}
                  {isServing && (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '4px',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#15803d' }}>
                        {t('qm_consultation_time')}
                      </div>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          fontFamily: 'monospace',
                          color: '#15803d',
                          marginTop: '0.15rem',
                        }}
                      >
                        {formatElapsedTimer(item.serving_started_at)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Slot Action Controls Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                    gap: '0.65rem',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.85rem',
                  }}
                >
                  {/* Actions for WAITING */}
                  {isWaiting && (
                    <>
                      <button
                        onClick={() => handleCallTicket(item.id)}
                        disabled={actionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem 0.95rem',
                          background: 'var(--text-main)',
                          border: '1px solid var(--text-main)',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: kmFont,
                          boxShadow: 'none',
                        }}
                      >
                        <Volume2 size={15} />
                        {t('cbs_call_patient')}
                      </button>

                      <button
                        onClick={() => handleStartServing(item.id)}
                        disabled={actionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem 0.95rem',
                          background: 'transparent',
                          border: '1px solid var(--text-main)',
                          borderRadius: '4px',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: kmFont,
                          boxShadow: 'none',
                        }}
                      >
                        <Play size={14} />
                        {t('cbs_start_consult')}
                      </button>

                      <button
                        onClick={() => handleSkip(item.id)}
                        disabled={actionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0.85rem',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          fontFamily: kmFont,
                          boxShadow: 'none',
                        }}
                      >
                        {t('cbs_skip_patient')}
                      </button>
                    </>
                  )}

                  {/* Actions for CALLED */}
                  {isCalled && (
                    <>
                      <button
                        onClick={() => handleStartServing(item.id)}
                        disabled={actionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.5rem 0.95rem',
                          background: 'var(--text-main)',
                          border: '1px solid var(--text-main)',
                          borderRadius: '4px',
                          color: '#ffffff',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: kmFont,
                          boxShadow: 'none',
                        }}
                      >
                        <Play size={14} />
                        {t('cbs_start_consult')}
                      </button>

                      <button
                        onClick={() => handleCallTicket(item.id)}
                        disabled={actionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0.85rem',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          fontFamily: kmFont,
                          boxShadow: 'none',
                        }}
                      >
                        <Volume2 size={14} />
                        {t('cbs_recall_patient')}
                      </button>

                      <button
                        onClick={() => handleSkip(item.id)}
                        disabled={actionLoading}
                        style={{
                          padding: '0.5rem 0.85rem',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          fontFamily: kmFont,
                          boxShadow: 'none',
                        }}
                      >
                        {t('cbs_skip_patient')}
                      </button>
                    </>
                  )}

                  {/* Actions for SERVING */}
                  {isServing && (
                    <button
                      onClick={() => handleComplete(item.id)}
                      disabled={actionLoading}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.55rem 1.15rem',
                        background: '#16a34a',
                        border: '1px solid #16a34a',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: kmFont,
                        boxShadow: 'none',
                      }}
                    >
                      <CheckCircle2 size={16} />
                      {t('cbs_finish_consult')}
                    </button>
                  )}

                  {/* Actions for SKIPPED */}
                  {isSkipped && (
                    <>
                      <button
                        onClick={() => handleRecall(item.id)}
                        disabled={actionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0.85rem',
                          background: 'transparent',
                          border: '1px solid var(--text-main)',
                          borderRadius: '4px',
                          color: 'var(--text-main)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: kmFont,
                          boxShadow: 'none',
                        }}
                      >
                        <RotateCcw size={14} />
                        {t('cbs_recall_patient')}
                      </button>

                      <button
                        onClick={() => handleNoShow(item.id)}
                        disabled={actionLoading}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0.85rem',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: '#dc2626',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          fontFamily: kmFont,
                          boxShadow: 'none',
                        }}
                      >
                        <UserX size={14} />
                        {t('cbs_noshow_patient')}
                      </button>
                    </>
                  )}

                  {/* State for COMPLETED */}
                  {isCompleted && (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontFamily: kmFont,
                      }}
                    >
                      <Check size={14} style={{ color: '#16a34a' }} />
                      <span>{t('cbs_status_completed')}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Walk-in Intake / Thermal Slip Modal */}
      {walkInModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '6px',
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
                  <div style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-main)', fontFamily: kmFont }}>
                    {t('qm_walkin_receipt')}
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'monospace', color: 'var(--text-main)', margin: '0.75rem 0' }}>
                    {issuedTicketSlip.ticket_number}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem', fontFamily: kmFont }}>
                    {issuedTicketSlip.patient_name}
                  </div>
                  {issuedTicketSlip.patient_phone && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      Tel: {issuedTicketSlip.patient_phone}
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 0', margin: '0.85rem 0', textAlign: 'left', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontFamily: kmFont }}>{t('qm_department_label')}</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>{issuedTicketSlip.department_name}</span>
                    </div>
                    {issuedTicketSlip.doctor_name && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontFamily: kmFont }}>{t('qm_doctor_label')}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>{issuedTicketSlip.doctor_name}</span>
                      </div>
                    )}
                    {issuedTicketSlip.service_name && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontFamily: kmFont }}>{t('qm_service_label')}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: kmFont }}>{issuedTicketSlip.service_name}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontFamily: kmFont }}>{t('qm_queue_position')}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>#{issuedTicketSlip.position} {t('qm_in_line_suffix')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)', fontFamily: kmFont }}>{t('qm_estimated_wait')}</span>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>~{issuedTicketSlip.estimated_wait_minutes} {t('pd_mins')}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont }}>
                    {t('qm_issued')} {new Date(issuedTicketSlip.issued_at).toLocaleDateString()} {new Date(issuedTicketSlip.issued_at).toLocaleTimeString()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontFamily: kmFont }}>
                    {t('qm_wait_lobby')}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={handleCloseSlipModal}
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
                    onClick={handlePrintSlip}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', fontFamily: kmFont }}>
                    {t('qm_issue_title')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setWalkInModalOpen(false)}
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

                <form onSubmit={handleIssueWalkIn} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
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
                    <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
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

                  <div>
                    <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                      {t('qm_department')} *
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
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name} {dept.code ? `(${dept.code})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
                      {t('qm_preferred_doctor')}
                    </label>
                    <select
                      value={walkInDoctorId}
                      onChange={(e) => setWalkInDoctorId(e.target.value)}
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
                      <option value="">{t('qm_any_specialist')}</option>
                      {availableDoctors.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.full_name} ({doc.specialty})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', fontFamily: kmFont }}>
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
                    <div style={{ color: '#dc2626', fontSize: '0.85rem', fontFamily: kmFont }}>
                      {walkInError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setWalkInModalOpen(false)}
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
                        background: 'var(--text-main)',
                        border: '1px solid var(--text-main)',
                        borderRadius: '4px',
                        color: '#ffffff',
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
      )}
    </div>
  );
};
