import React, { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { apiClient } from '../../services/apiClient';
import { AuthService } from '../../services/auth';

import { BookingItem, STANDARD_TIME_SLOTS } from './queue/types';
import { useQueueData } from './queue/useQueueData';
import { QueueStatsCards } from './queue/QueueStatsCards';
import { QueueTicketItem } from './queue/QueueTicketItem';
import { QueueSlotScheduler } from './queue/QueueSlotScheduler';
import { WalkInModal } from './queue/WalkInModal';

export const QueueManagement: React.FC = () => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  // Filters State
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slotAvailabilityFilter, setSlotAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE'>('ALL');

  // Custom Data Hook with WebSockets and API client
  const {
    departments,
    doctors,
    services,
    bookings,
    summary,
    loading,
    actionLoading,
    actionError,
    loadBookings,
    handleCallTicket,
    handleStartServing,
    handleComplete,
    handleSkip,
    handleRecall,
    handleNoShow,
  } = useQueueData({ selectedDeptId, selectedDate, t });

  // Walk-in modal state
  const [walkInModalOpen, setWalkInModalOpen] = useState(false);
  const [walkInSlotTime, setWalkInSlotTime] = useState<string>('');
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInDeptId, setWalkInDeptId] = useState('');
  const [walkInDoctorId, setWalkInDoctorId] = useState('');
  const [walkInServiceId, setWalkInServiceId] = useState('');
  const [walkInNameError, setWalkInNameError] = useState<string | null>(null);
  const [walkInError, setWalkInError] = useState<string | null>(null);
  const [issuedTicketSlip, setIssuedTicketSlip] = useState<any | null>(null);

  // Live Timer
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Time conversion helpers
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

  // Effective bookings filtered by department & date
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

  // Dynamic Summary calculations
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
  const slotGroups = useMemo(() => {
    return STANDARD_TIME_SLOTS.map((slot) => {
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
  }, [effectiveBookings]);

  const generalBookings = useMemo(() => {
    return effectiveBookings.filter((b) => {
      return !slotGroups.some((g) => g.bookings.some((item) => item.id === b.id));
    });
  }, [effectiveBookings, slotGroups]);

  const availableSlotsCount = slotGroups.filter((g) => !g.isBooked).length;
  const bookedSlotsCount = slotGroups.filter((g) => g.isBooked).length;

  const filteredSlotGroups = useMemo(() => {
    return slotGroups.filter((g) => {
      if (slotAvailabilityFilter === 'AVAILABLE') return !g.isBooked;
      if (slotAvailabilityFilter === 'UNAVAILABLE') return g.isBooked;
      return true;
    });
  }, [slotGroups, slotAvailabilityFilter]);

  const availableServices = useMemo(() => {
    return services.filter((s: any) => !walkInDeptId || s.department_id === walkInDeptId);
  }, [services, walkInDeptId]);

  const handleOpenWalkIn = (slotKey = '') => {
    setWalkInName('');
    setWalkInPhone('');
    setWalkInDeptId(selectedDeptId || (departments.length > 0 ? departments[0].id : ''));
    setWalkInDoctorId('');
    setWalkInServiceId('');
    setWalkInSlotTime(slotKey);
    setWalkInNameError(null);
    setWalkInError(null);
    setIssuedTicketSlip(null);
    setWalkInModalOpen(true);
  };

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

    try {
      const targetDeptId = walkInDeptId || (departments.length > 0 ? departments[0].id : '');
      const createdTicket = await apiClient.post<any>('/tickets/walk-in', {
        hospital_id: AuthService.getStoredUser()?.hospital_id || '11c80144-bc31-4ed1-8529-f25db3a203d3',
        department_id: targetDeptId,
        doctor_id: walkInDoctorId || undefined,
        service_id: walkInServiceId || undefined,
        patient_name: walkInName.trim(),
        patient_phone: walkInPhone.trim() || undefined,
        appointment_date: selectedDate || new Date().toISOString().split('T')[0],
        appointment_time: walkInSlotTime || undefined,
      });

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

      setWalkInName('');
      setWalkInPhone('');
      await loadBookings(false);
    } catch {
      setWalkInError(t('qm_err_issue_ticket'));
    }
  };

  return (
    <div
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
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

      {/* Summary KPI Cards */}
      <QueueStatsCards summary={effectiveSummary} kmFont={kmFont} t={t} />

      {/* Filter Bar & Walk-In Button */}
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

        {/* Date Picker, Today Quick-Select & Walk-In Action Button */}
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
              type="button"
              className="hospital-action-btn"
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
                fontFamily: kmFont,
                boxShadow: 'none',
              }}
            >
              {t('cbs_today')}
            </button>
          </div>

          <button
            type="button"
            className="hospital-action-btn"
            onClick={() => handleOpenWalkIn()}
            style={{
              padding: '0.52rem 1.15rem',
              background: 'transparent',
              border: '1px solid var(--text-main)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              fontWeight: 600,
              fontFamily: kmFont,
              boxShadow: 'none',
            }}
          >
            {t('qm_issue_walkin_btn')}
          </button>
        </div>
      </div>

      {/* Action Error Message */}
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
        <LoadingSpinner message={t('qm_loading')} />
      ) : selectedDate && selectedDeptId ? (
        <QueueSlotScheduler
          selectedDate={selectedDate}
          selectedDeptId={selectedDeptId}
          slotGroups={slotGroups}
          filteredSlotGroups={filteredSlotGroups}
          generalBookings={generalBookings}
          availableSlotsCount={availableSlotsCount}
          bookedSlotsCount={bookedSlotsCount}
          slotAvailabilityFilter={slotAvailabilityFilter}
          setSlotAvailabilityFilter={setSlotAvailabilityFilter}
          onSelectSlotForWalkIn={handleOpenWalkIn}
          nowTimestamp={nowTimestamp}
          actionLoading={actionLoading}
          onCall={handleCallTicket}
          onStart={handleStartServing}
          onComplete={handleComplete}
          onSkip={handleSkip}
          onRecall={handleRecall}
          onNoShow={handleNoShow}
          isKm={isKm}
          kmFont={kmFont}
          t={t}
        />
      ) : effectiveBookings.length === 0 ? (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {effectiveBookings.map((item: BookingItem) => (
            <QueueTicketItem
              key={item.id}
              item={item}
              nowTimestamp={nowTimestamp}
              actionLoading={actionLoading}
              onCall={handleCallTicket}
              onStart={handleStartServing}
              onComplete={handleComplete}
              onSkip={handleSkip}
              onRecall={handleRecall}
              onNoShow={handleNoShow}
              kmFont={kmFont}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Walk-in Intake / Thermal Slip Modal */}
      <WalkInModal
        isOpen={walkInModalOpen}
        onClose={() => setWalkInModalOpen(false)}
        issuedTicketSlip={issuedTicketSlip}
        onCloseSlipModal={() => {
          setIssuedTicketSlip(null);
          setWalkInModalOpen(false);
        }}
        onPrintSlip={() => window.print()}
        walkInName={walkInName}
        setWalkInName={setWalkInName}
        walkInPhone={walkInPhone}
        setWalkInPhone={setWalkInPhone}
        walkInSlotTime={walkInSlotTime}
        departments={departments}
        walkInDeptId={walkInDeptId}
        selectedDeptId={selectedDeptId}
        walkInServiceId={walkInServiceId}
        setWalkInServiceId={setWalkInServiceId}
        availableServices={availableServices}
        walkInNameError={walkInNameError}
        setWalkInNameError={setWalkInNameError}
        walkInError={walkInError}
        actionLoading={actionLoading}
        onSubmit={handleIssueWalkIn}
        kmFont={kmFont}
        t={t}
      />
    </div>
  );
};

export default QueueManagement;
