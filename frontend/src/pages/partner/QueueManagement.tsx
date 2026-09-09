import React, { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
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

interface StandardTimeSlot {
  key: string;
  labelKm: string;
}

const STANDARD_TIME_SLOTS: StandardTimeSlot[] = [
  { key: '08:00 AM - 09:00 AM', labelKm: '០៨:០០ ព្រឹក - ០៩:០០ ព្រឹក' },
  { key: '09:00 AM - 10:00 AM', labelKm: '០៩:០០ ព្រឹក - ១០:០០ ព្រឹក' },
  { key: '10:00 AM - 11:00 AM', labelKm: '១០:០០ ព្រឹក - ១១:០០ ព្រឹក' },
  { key: '11:00 AM - 12:00 PM', labelKm: '១១:០០ ព្រឹក - ១២:០០ ថ្ងៃត្រង់' },
  { key: '01:30 PM - 02:30 PM', labelKm: '០១:៣០ រសៀល - ០២:៣០ រសៀល' },
  { key: '02:30 PM - 03:30 PM', labelKm: '០២:៣០ រសៀល - ០៣:៣០ រសៀល' },
  { key: '03:30 PM - 04:30 PM', labelKm: '០៣:៣០ រសៀល - ០៤:៣០ រសៀល' },
  { key: '04:30 PM - 05:30 PM', labelKm: '០៤:៣០ រសៀល - ០៥:៣០ រសៀល' },
];

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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Time Slot Availability Filter: 'ALL' | 'AVAILABLE' | 'UNAVAILABLE'
  const [slotAvailabilityFilter, setSlotAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');
  const [walkInSlotTime, setWalkInSlotTime] = useState<string>('');

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
      setActionError(t('qm_err_config'));
    }
  };

  // Fetch customer booking slots from backend
  const loadBookings = async (showLoadingSpinner: boolean = true) => {
    if (showLoadingSpinner) {
      setLoading(true);
      setActionError(null);
    }
    try {
      const params = new URLSearchParams();
      if (selectedDeptId) params.append('department_id', selectedDeptId);
      if (selectedDate) params.append('booking_date', selectedDate);

      const res = await fetch(`${API_BASE}/partners/bookings?${params.toString()}`, {
        headers: AuthService.getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else if (showLoadingSpinner) {
        setActionError(t('qm_err_load_schedule'));
      }
    } catch {
      if (showLoadingSpinner) {
        setActionError(t('qm_err_load_schedule'));
      }
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadClinicalData();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [selectedDeptId, selectedDate]);

  // WebSocket Live Subscription & Real-time Background Sync
  useEffect(() => {
    const user = AuthService.getStoredUser();
    const hospitalId = user?.hospital_id;
    const targetDept = selectedDeptId || (departments.length > 0 ? departments[0].id : null);

    const clients: RealTimeQueueClient[] = [];
    const unsubscribers: Array<() => void> = [];

    const handleRealtimeUpdate = () => {
      loadBookings(false);
    };

    if (hospitalId) {
      const hospWs = new RealTimeQueueClient(`hospital:${hospitalId}`);
      hospWs.connect();
      unsubscribers.push(hospWs.subscribe(handleRealtimeUpdate));
      clients.push(hospWs);
    }

    if (targetDept) {
      const deptWs = new RealTimeQueueClient(`queue:${targetDept}`);
      deptWs.connect();
      unsubscribers.push(deptWs.subscribe(handleRealtimeUpdate));
      clients.push(deptWs);
    }

    const globalWs = new RealTimeQueueClient('global');
    globalWs.connect();
    unsubscribers.push(globalWs.subscribe(handleRealtimeUpdate));
    clients.push(globalWs);

    // Heartbeat silent poll every 4 seconds to guarantee live real-time sync without user manual reload
    const interval = setInterval(() => {
      loadBookings(false);
    }, 4000);

    return () => {
      clearInterval(interval);
      unsubscribers.forEach((unsub) => unsub());
      clients.forEach((c) => c.disconnect());
    };
  }, [selectedDeptId, departments, selectedDate]);

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
        setActionError(t('qm_err_recall'));
        return;
      }
      playCallingChime();
      await loadBookings();
    } catch {
      setActionError(t('qm_err_recall'));
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
        setActionError(t('qm_err_start_consult'));
        return;
      }
      await loadBookings();
    } catch {
      setActionError(t('qm_err_start_consult'));
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
        setActionError(t('qm_err_complete_consult'));
        return;
      }
      await loadBookings();
    } catch {
      setActionError(t('qm_err_complete_consult'));
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
        setActionError(t('qm_err_skip'));
        return;
      }
      await loadBookings();
    } catch {
      setActionError(t('qm_err_skip'));
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
        setActionError(t('qm_err_recall'));
        return;
      }
      playCallingChime();
      await loadBookings();
    } catch {
      setActionError(t('qm_err_recall'));
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
        setActionError(t('qm_err_status'));
        return;
      }
      await loadBookings();
    } catch {
      setActionError(t('qm_err_status'));
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
      setWalkInNameError(t('qm_err_enter_name'));
      return;
    }

    if (walkInSlotTime) {
      const slotData = slotGroups.find((g) => g.slot.key === walkInSlotTime);
      if (slotData && slotData.isBooked) {
        setWalkInError(t('slot_already_booked_err'));
        return;
      }
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
          appointment_date: selectedDate || new Date().toISOString().split('T')[0],
          appointment_time: walkInSlotTime || undefined,
        }),
      });

      if (!res.ok) {
        setWalkInError(t('qm_err_issue_ticket'));
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
        appointment_date: selectedDate || new Date().toISOString().split('T')[0],
        appointment_time: walkInSlotTime || undefined,
        issued_at: new Date(),
      });

      // Clear form inputs
      setWalkInName('');
      setWalkInPhone('');
      setWalkInDoctorId('');
      setWalkInServiceId('');
      await loadBookings(false);
    } catch {
      setWalkInError(t('qm_err_issue_ticket'));
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

  // Services filtered by walkInDeptId
  const availableServices = services.filter(
    (s: any) => !walkInDeptId || s.department_id === walkInDeptId
  );

  // Status Badge Rendering Helper (Clean dot indicator without filled background colors)
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#d97706',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#d97706',
                display: 'inline-block',
              }}
            />
            {t('cbs_status_waiting')}
          </span>
        );
      case 'CALLED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#0284c7',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#0284c7',
                display: 'inline-block',
              }}
            />
            {t('cbs_status_called')}
          </span>
        );
      case 'SERVING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#059669',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#059669',
                display: 'inline-block',
              }}
            />
            {t('cbs_status_serving')}
          </span>
        );
      case 'COMPLETED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#94a3b8',
                display: 'inline-block',
              }}
            />
            {t('cbs_status_completed')}
          </span>
        );
      case 'SKIPPED':
      case 'NO_SHOW':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#dc2626',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                display: 'inline-block',
              }}
            />
            {t('cbs_status_skipped')}
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              fontFamily: kmFont,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#94a3b8',
                display: 'inline-block',
              }}
            />
            {status}
          </span>
        );
    }
  };

  // Format Elapsed consultation time helper
  const formatElapsedTimer = (startedAt?: string) => {
    if (!startedAt) return '00:00';
    const cleanStr = startedAt.endsWith('Z') || startedAt.includes('+') ? startedAt : `${startedAt}Z`;
    const startMs = new Date(cleanStr).getTime();
    const diffSec = Math.max(0, Math.floor((nowTimestamp - startMs) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Format Local Time helper with consistent AM/PM
  const formatLocalTimeAmPm = (iso?: string): string => {
    if (!iso) return '';
    const clean = iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`;
    const d = new Date(clean);
    if (isNaN(d.getTime())) return '';
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Convert time strings like "10:49 AM", "09:30 AM", "14:00" to minutes from midnight
  const parseTimeToMinutes = (tStr?: string): number | null => {
    if (!tStr) return null;
    const cleaned = tStr.replace(/\u202F|\u00A0/g, ' ').trim();
    const match = cleaned.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Effective bookings strictly matching department selection (both client-side and server-side guaranteed)
  const effectiveBookings = useMemo(() => {
    let list = bookings;
    if (selectedDeptId) {
      list = list.filter((b) => b.department_id === selectedDeptId);
    }
    if (selectedDate) {
      list = list.filter((b) => {
        if (b.appointment_date) {
          return b.appointment_date.startsWith(selectedDate);
        }
        if (b.created_at) {
          return b.created_at.startsWith(selectedDate);
        }
        return true;
      });
    }
    return list;
  }, [bookings, selectedDeptId, selectedDate]);

  // Dynamic Summary calculations strictly respecting selected department filter
  const effectiveSummary = useMemo(() => {
    if (!selectedDeptId) return summary;
    const total = effectiveBookings.length;
    const online = effectiveBookings.filter((b) => b.ticket_source === 'ONLINE').length;
    const walkin = effectiveBookings.filter((b) => b.ticket_source === 'WALK_IN').length;
    const waiting = effectiveBookings.filter((b) => b.status === 'WAITING' || b.status === 'CALLED').length;
    const serving = effectiveBookings.filter((b) => b.status === 'SERVING').length;
    const completed = effectiveBookings.filter((b) => b.status === 'COMPLETED').length;
    return {
      total_bookings: total,
      online_bookings: online,
      walkin_bookings: walkin,
      waiting_count: waiting,
      serving_count: serving,
      completed_count: completed,
    };
  }, [summary, effectiveBookings, selectedDeptId]);

  // Live Slot Schedule Calculations for selected date
  const slotGroups = STANDARD_TIME_SLOTS.map((slot) => {
    const sKey = slot.key.trim().toUpperCase();
    const [slotStart, slotEnd] = sKey.split(' - ');
    const slotStartMin = parseTimeToMinutes(slotStart);
    const slotEndMin = parseTimeToMinutes(slotEnd);

    const matched = effectiveBookings.filter((b) => {
      const aptRaw = b.appointment_time || (b.created_at ? formatLocalTimeAmPm(b.created_at) : '');
      if (!aptRaw) return false;
      const apt = aptRaw.replace(/\u202F|\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();

      if (apt === sKey) return true;

      const checkTime = apt.includes(' - ') ? apt.split(' - ')[0].trim() : apt;
      const aptMin = parseTimeToMinutes(checkTime);
      if (aptMin !== null && slotStartMin !== null && slotEndMin !== null) {
        if (aptMin >= slotStartMin && aptMin < slotEndMin) {
          return true;
        }
      }
      return false;
    });

    const activeBookings = matched.filter(
      (b) => b.status !== 'CANCELLED' && b.status !== 'SKIPPED' && b.status !== 'NO_SHOW'
    );

    return {
      slot,
      isBooked: activeBookings.length > 0,
      bookings: matched,
    };
  });

  const generalBookings = effectiveBookings.filter((b) => {
    return !slotGroups.some((g) => g.bookings.some((item) => item.id === b.id));
  });

  const availableSlotsCount = slotGroups.filter((g) => !g.isBooked).length;
  const bookedSlotsCount = slotGroups.filter((g) => g.isBooked).length;

  const filteredSlotGroups = slotGroups.filter((g) => {
    if (slotAvailabilityFilter === 'AVAILABLE') return !g.isBooked;
    if (slotAvailabilityFilter === 'UNAVAILABLE') return g.isBooked;
    return true;
  });

  // Reusable card renderer for booked patient tickets
  const renderBookingCard = (item: any) => {
    const isOnline = item.ticket_source === 'ONLINE';
    const isServing = item.status === 'SERVING';
    const isCalled = item.status === 'CALLED';
    const isWaiting = item.status === 'WAITING';
    const isSkipped = item.status === 'SKIPPED' || item.status === 'NO_SHOW';
    const isCompleted = item.status === 'COMPLETED';

    const parseLocalTime = (iso?: string) => {
      if (!iso) return '';
      const clean = iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`;
      return new Date(clean).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const parseLocalDate = (iso?: string) => {
      if (!iso) return '';
      const clean = iso.endsWith('Z') || iso.includes('+') ? iso : `${iso}Z`;
      const d = new Date(clean);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return (
      <div
        key={item.id}
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '6px',
          padding: '1.15rem 1.3rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.9rem',
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
            paddingBottom: '0.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {/* Time Slot (No container) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                fontFamily: kmFont,
              }}
            >
              <Clock size={14} style={{ color: 'var(--text-muted)' }} />
              <span>{item.appointment_time || parseLocalTime(item.created_at)}</span>
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
              <span>{item.appointment_date || parseLocalDate(item.created_at)}</span>
            </div>

            {/* Ticket Number */}
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 800,
                fontFamily: kmFont,
                color: 'var(--text-main)',
                letterSpacing: '0.04em',
              }}
            >
              #{item.ticket_number}
            </div>

            {/* Ticket Source Indicator (No container) */}
            {isOnline ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  fontFamily: kmFont,
                }}
              >
                <Smartphone size={13} />
                {t('cbs_source_online')}
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  fontFamily: kmFont,
                }}
              >
                <User size={13} />
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.85rem',
          }}
        >
          {/* Patient Info */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}
            >
              {t('cbs_slot_patient')}
            </div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginTop: '0.2rem',
              }}
            >
              {item.patient_name}
            </div>
            {item.patient_phone && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem',
                }}
              >
                <Phone size={12} />
                <span>{item.patient_phone}</span>
              </div>
            )}
          </div>

          {/* Doctor & Department */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}
            >
              {t('cbs_slot_doctor')}
            </div>
            <div
              style={{
                fontSize: '0.92rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginTop: '0.2rem',
              }}
            >
              {item.doctor_name ? (
                <>
                  {item.doctor_name}{' '}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    ({item.doctor_specialty || t('qm_specialist_default')})
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>{t('qm_any_specialist')}</span>
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {item.department_name} {item.department_code ? `(${item.department_code})` : ''}
            </div>
          </div>

          {/* Service */}
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontWeight: 600,
              }}
            >
              {t('cbs_slot_service')}
            </div>
            <div
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginTop: '0.2rem',
              }}
            >
              {item.service_name || t('qm_standard_consultation')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
              {t('cbs_queue_pos')}: #{item.position || 1} • {t('cbs_est_wait')}: ~
              {item.estimated_wait_minutes || 0} {t('pd_mins')}
            </div>
          </div>

          {/* Live Consultation Timer if Serving */}
          {isServing && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '0.55rem 0.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#059669', fontFamily: kmFont }}>
                {t('qm_consultation_time')}
              </div>
              <div
                style={{
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: '#059669',
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
            gap: '0.55rem',
            paddingTop: '0.35rem',
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
                  padding: '0.45rem 0.9rem',
                  background: 'transparent',
                  border: '1px solid var(--text-main)',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  boxShadow: 'none',
                }}
              >
                <Volume2 size={14} />
                {t('cbs_call_patient')}
              </button>

              <button
                onClick={() => handleStartServing(item.id)}
                disabled={actionLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  background: 'transparent',
                  border: '1px solid #059669',
                  borderRadius: '4px',
                  color: '#059669',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  boxShadow: 'none',
                }}
              >
                <Play size={13} />
                {t('cbs_start_consult')}
              </button>

              <button
                onClick={() => handleSkip(item.id)}
                disabled={actionLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
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
                  padding: '0.45rem 0.9rem',
                  background: 'transparent',
                  border: '1px solid #059669',
                  borderRadius: '4px',
                  color: '#059669',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  boxShadow: 'none',
                }}
              >
                <Play size={13} />
                {t('cbs_start_consult')}
              </button>

              <button
                onClick={() => handleCallTicket(item.id)}
                disabled={actionLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  boxShadow: 'none',
                }}
              >
                <Volume2 size={13} />
                {t('cbs_recall_patient')}
              </button>

              <button
                onClick={() => handleSkip(item.id)}
                disabled={actionLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
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
            <>
              <button
                onClick={() => handleComplete(item.id)}
                disabled={actionLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 1rem',
                  background: 'transparent',
                  border: '1px solid #059669',
                  borderRadius: '4px',
                  color: '#059669',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  boxShadow: 'none',
                }}
              >
                <CheckCircle2 size={15} />
                {t('cbs_finish_consult')}
              </button>

              <button
                onClick={() => handleRecall(item.id)}
                disabled={actionLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  boxShadow: 'none',
                }}
              >
                <RotateCcw size={13} />
                {t('cbs_recall_patient')}
              </button>

              <button
                onClick={() => handleNoShow(item.id)}
                disabled={actionLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  boxShadow: 'none',
                }}
              >
                <UserX size={13} />
                {t('cbs_noshow_patient')}
              </button>
            </>
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
                  padding: '0.45rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  boxShadow: 'none',
                }}
              >
                <RotateCcw size={13} />
                {t('cbs_recall_patient')}
              </button>

              <button
                onClick={() => handleNoShow(item.id)}
                disabled={actionLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.45rem 0.75rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: kmFont,
                  boxShadow: 'none',
                }}
              >
                <UserX size={13} />
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
              <Check size={14} style={{ color: '#059669' }} />
              <span>{t('cbs_status_completed')}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        fontFamily: kmFont,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {/* Print styles for 80mm thermal receipt printer */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt-slip, #thermal-receipt-slip * {
            visibility: visible;
          }
          #thermal-receipt-slip {
            position: fixed;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 10px;
            box-shadow: none !important;
            border: none !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>

      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '0.5rem',
          marginBottom: '0.25rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.28rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: 0,
              fontFamily: kmFont,
            }}
          >
            {t('cbs_title')}
          </h1>
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              margin: '0.3rem 0 0 0',
              fontFamily: kmFont,
            }}
          >
            {t('cbs_subtitle')}
          </p>
        </div>
      </div>

      {/* Summary KPI Cards Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.85rem',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.95rem 1.15rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont, fontWeight: 500 }}>
            {t('cbs_stat_total')}
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginTop: '0.2rem',
              lineHeight: 1.2,
            }}
          >
            {effectiveSummary.total_bookings}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.95rem 1.15rem',
            boxShadow: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              fontFamily: kmFont,
              fontWeight: 500,
            }}
          >
            <Smartphone size={14} />
            {t('cbs_stat_online')}
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginTop: '0.2rem',
              lineHeight: 1.2,
            }}
          >
            {effectiveSummary.online_bookings}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.95rem 1.15rem',
            boxShadow: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              fontFamily: kmFont,
              fontWeight: 500,
            }}
          >
            <User size={14} />
            {t('cbs_stat_walkin')}
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginTop: '0.2rem',
              lineHeight: 1.2,
            }}
          >
            {effectiveSummary.walkin_bookings}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.95rem 1.15rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont, fontWeight: 500 }}>
            {t('cbs_stat_waiting')}
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#d97706',
              marginTop: '0.2rem',
              lineHeight: 1.2,
            }}
          >
            {effectiveSummary.waiting_count}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.95rem 1.15rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont, fontWeight: 500 }}>
            {t('cbs_stat_serving')}
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: '#059669',
              marginTop: '0.2rem',
              lineHeight: 1.2,
            }}
          >
            {effectiveSummary.serving_count}
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '0.95rem 1.15rem',
            boxShadow: 'none',
          }}
        >
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: kmFont, fontWeight: 500 }}>
            {t('cbs_stat_completed')}
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              marginTop: '0.2rem',
              lineHeight: 1.2,
            }}
          >
            {effectiveSummary.completed_count}
          </div>
        </div>
      </div>

      {/* Filter Bar & Walk-In Button (Containerless) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          boxShadow: 'none',
        }}
      >
        {/* Department Filter */}
        <div style={{ flex: '1 1 240px', maxWidth: '360px' }}>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 1rem',
              fontSize: '0.88rem',
              borderRadius: 'var(--radius-full)',
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

        {/* Date Picker, Quick Date Button & + Walk-In Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '0.5rem 0.85rem',
                fontSize: '0.88rem',
                borderRadius: 'var(--radius-full)',
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
                padding: '0.52rem 0.95rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-full)',
                border:
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? '1px solid var(--text-main)'
                    : '1px solid var(--border-color)',
                background: 'transparent',
                color:
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'var(--text-main)'
                    : 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              {t('cbs_today')}
            </button>
          </div>

          <button
            onClick={() => {
              setWalkInName('');
              setWalkInPhone('');
              setWalkInDeptId(selectedDeptId || (departments.length > 0 ? departments[0].id : ''));
              setWalkInDoctorId('');
              setWalkInServiceId('');
              setWalkInSlotTime('');
              setWalkInNameError(null);
              setWalkInError(null);
              setIssuedTicketSlip(null);
              setWalkInModalOpen(true);
            }}
            style={{
              padding: '0.52rem 1.15rem',
              background: 'transparent',
              border: '1px solid var(--text-main)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'none',
              fontFamily: kmFont,
              transition: 'all 0.15s ease',
            }}
          >
            {t('qm_issue_walkin_btn')}
          </button>
        </div>
      </div>

      {/* Action Error Message (Plain Minimalist Text without Containers) */}
      {actionError && (
        <div
          style={{
            color: '#dc2626',
            fontSize: '0.92rem',
            fontWeight: 500,
            fontFamily: kmFont,
            margin: '0.2rem 0',
          }}
        >
          {actionError}
        </div>
      )}

      {/* Booking Slots Grid / Live Schedule */}
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
      ) : selectedDate && selectedDeptId ? (
        /* Live Available / Unavailable Slots View for Filtered Department */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Live Slots Availability Header Bar (Containerless) */}
          <div
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: 0,
              padding: '0.65rem 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
              boxShadow: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Calendar size={17} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: kmFont }}>
                  {t('cbs_slots_overview')}: {selectedDate}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: '#059669',
                    fontFamily: kmFont,
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#059669', display: 'inline-block' }} />
                  {t('cbs_available_count')}: {availableSlotsCount}
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    color: bookedSlotsCount > 0 ? '#dc2626' : 'var(--text-muted)',
                    fontFamily: kmFont,
                  }}
                >
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: bookedSlotsCount > 0 ? '#dc2626' : '#94a3b8', display: 'inline-block' }} />
                  {t('cbs_booked_count')}: {bookedSlotsCount}
                </span>
              </div>
            </div>

            {/* Slot Quick Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: `${t('cbs_filter_all_slots')} (${STANDARD_TIME_SLOTS.length})` },
                { key: 'AVAILABLE', label: `${t('cbs_filter_available_only')} (${availableSlotsCount})` },
                { key: 'UNAVAILABLE', label: `${t('cbs_filter_booked_only')} (${bookedSlotsCount})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSlotAvailabilityFilter(tab.key as any)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    fontSize: '0.84rem',
                    fontWeight: slotAvailabilityFilter === tab.key ? 700 : 500,
                    borderRadius: 'var(--radius-full)',
                    border:
                      slotAvailabilityFilter === tab.key
                        ? '1px solid var(--accent-primary)'
                        : '1px solid var(--border-color)',
                    background:
                      slotAvailabilityFilter === tab.key
                        ? 'var(--accent-primary)'
                        : 'transparent',
                    color:
                      slotAvailabilityFilter === tab.key
                        ? '#ffffff'
                        : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontFamily: kmFont,
                    boxShadow: 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots List */}
          {filteredSlotGroups.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                paddingTop: '9.5rem',
                paddingBottom: '6rem',
                fontFamily: kmFont,
                color: 'var(--text-muted)',
                fontSize: '0.98rem',
              }}
            >
              {t('cbs_no_bookings')}
            </div>
          ) : (
            <div className="slots-schedule-grid">
              {filteredSlotGroups.map((group) => {
                const isBooked = group.isBooked;

                if (isBooked) {
                  // Booked Slot Button: Turns into Unavailable in the grid
                  return (
                    <div
                      key={group.slot.key}
                      className="slot-card-unavailable"
                      title={
                        isKm
                          ? `ម៉ោង ${group.slot.labelKm} ត្រូវបានកក់ពេញ (${group.bookings.length} នាក់)`
                          : `${group.slot.key} is fully booked (${group.bookings.length} patients)`
                      }
                      style={{
                        borderRadius: '6px',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.65rem',
                        boxShadow: 'none',
                        fontFamily: kmFont,
                        minHeight: '48px',
                        background: '#ffffff',
                        border: '1px solid var(--border-color)',
                        cursor: 'not-allowed',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          fontFamily: kmFont,
                        }}
                      >
                        <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                        <span>{isKm ? group.slot.labelKm : group.slot.key}</span>
                      </div>

                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: '#dc2626',
                          fontFamily: kmFont,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: '#dc2626',
                            display: 'inline-block',
                          }}
                        />
                        {t('cbs_slot_unavailable')} ({group.bookings.length})
                      </span>
                    </div>
                  );
                }

                // Available Slot Card (Clickable to Issue Walk-In / Book this slot)
                return (
                  <div
                    key={group.slot.key}
                    className="slot-card-available"
                    onClick={() => {
                      setWalkInName('');
                      setWalkInPhone('');
                      setWalkInDeptId(selectedDeptId || (departments.length > 0 ? departments[0].id : ''));
                      setWalkInDoctorId('');
                      setWalkInServiceId('');
                      setWalkInSlotTime(group.slot.key);
                      setWalkInNameError(null);
                      setWalkInError(null);
                      setIssuedTicketSlip(null);
                      setWalkInModalOpen(true);
                    }}
                    title={
                      isKm
                        ? `ចុចដើម្បីកក់ ឬចេញសំបុត្រសម្រាប់ម៉ោង ${group.slot.labelKm}`
                        : `Click to book or issue ticket for ${group.slot.key}`
                    }
                    style={{
                      borderRadius: '6px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.65rem',
                      boxShadow: 'none',
                      fontFamily: kmFont,
                      minHeight: '48px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        fontFamily: kmFont,
                      }}
                    >
                      <Clock size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>{isKm ? group.slot.labelKm : group.slot.key}</span>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#059669',
                        fontFamily: kmFont,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669', display: 'inline-block' }} />
                      {t('cbs_slot_available')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Booked Patient Tickets Grouped by Time Slot */}
          {slotGroups.some((g) => g.isBooked) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.75rem' }}>
              {slotGroups
                .filter((g) => g.isBooked)
                .map((group) => (
                  <div
                    key={group.slot.key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      fontFamily: kmFont,
                    }}
                  >
                    {/* Slot Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.92rem',
                        fontWeight: 700,
                        color: 'var(--text-main)',
                        fontFamily: kmFont,
                      }}
                    >
                      <span>•</span>
                      <span>{isKm ? group.slot.labelKm : group.slot.key}</span>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          color: '#dc2626',
                          marginLeft: '4px',
                        }}
                      >
                        ({t('cbs_slot_unavailable')} • {group.bookings.length})
                      </span>
                    </div>

                    {/* Booked Patient Tickets */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {group.bookings.map((item) => renderBookingCard(item))}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* General Tickets for Date if any didn't match standard slots */}
          {generalBookings.length > 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                marginTop: '0.65rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  fontFamily: kmFont,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>•</span>
                <span>{t('cbs_general_walkins')} ({generalBookings.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {generalBookings.map((item) => renderBookingCard(item))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* View when 'All Departments' or 'All Dates' is chosen: Show all matching bookings */
        effectiveBookings.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 1rem',
              fontFamily: kmFont,
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
              background: '#ffffff',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
            }}
          >
            {t('cbs_no_bookings')}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {effectiveBookings.map((item) => renderBookingCard(item))}
          </div>
        )
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

                  {/* Selected Slot & Department Info Badge */}
                  {walkInSlotTime && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: '#f8fafc',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        fontSize: '0.86rem',
                        fontFamily: kmFont,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontWeight: 700 }}>
                        <Clock size={15} style={{ color: '#16a34a' }} />
                        <span>
                          {STANDARD_TIME_SLOTS.find((s) => s.key === walkInSlotTime)?.labelKm || walkInSlotTime}
                        </span>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {departments.find((d) => d.id === (walkInDeptId || selectedDeptId))?.name}
                      </span>
                    </div>
                  )}

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
                        background: 'transparent',
                        border: '1px solid var(--text-main)',
                        borderRadius: '4px',
                        color: 'var(--text-main)',
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
