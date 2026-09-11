import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/apiClient';
import { AuthService } from '../../../services/auth';
import { RealTimeQueueClient } from '../../../services/websocket';
import { BookingItem, BookingsSummary } from './types';
import { playCallingChime } from './callingChime';

export interface UseQueueDataOptions {
  selectedDeptId: string;
  selectedDate: string;
  t: (key: string) => string;
}

export function useQueueData({ selectedDeptId, selectedDate, t }: UseQueueDataOptions) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

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

  const loadClinicalData = useCallback(async () => {
    try {
      const [depts, docs, srvs] = await Promise.all([
        apiClient.get<any[]>('/partners/departments'),
        apiClient.get<any[]>('/partners/doctors'),
        apiClient.get<any[]>('/partners/services'),
      ]);
      setDepartments(depts || []);
      setDoctors(docs || []);
      setServices(srvs || []);
    } catch {
      setActionError(t('qm_err_config'));
    }
  }, [t]);

  const loadBookings = useCallback(
    async (showLoadingSpinner = true) => {
      if (showLoadingSpinner) {
        setLoading(true);
        setActionError(null);
      }
      try {
        const data = await apiClient.get<{
          bookings: BookingItem[];
          summary: BookingsSummary;
        }>('/partners/bookings', {
          params: {
            department_id: selectedDeptId || undefined,
            booking_date: selectedDate || undefined,
          },
        });

        if (data) {
          setBookings(data.bookings || []);
          if (data.summary) {
            setSummary(data.summary);
          }
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
    },
    [selectedDeptId, selectedDate, t]
  );

  useEffect(() => {
    loadClinicalData();
  }, [loadClinicalData]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Real-time WebSocket subscriptions
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

    const interval = setInterval(() => {
      loadBookings(false);
    }, 4000);

    return () => {
      clearInterval(interval);
      unsubscribers.forEach((unsub) => unsub());
      clients.forEach((c) => c.disconnect());
    };
  }, [selectedDeptId, departments, loadBookings]);

  // Actions
  const handleCallTicket = async (ticketId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await apiClient.post(`/tickets/${ticketId}/call`, {
        note: 'Called from Customer Booking Slots view',
      });
      playCallingChime();
      await loadBookings(false);
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
      await apiClient.post(`/tickets/${ticketId}/start`);
      await loadBookings(false);
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
      await apiClient.post(`/tickets/${ticketId}/complete`);
      await loadBookings(false);
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
      await apiClient.post(`/tickets/${ticketId}/skip`);
      await loadBookings(false);
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
      await apiClient.post(`/tickets/${ticketId}/recall`, {
        note: 'Recalled from Customer Booking Slots view',
      });
      playCallingChime();
      await loadBookings(false);
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
      await apiClient.post(`/tickets/${ticketId}/no-show`);
      await loadBookings(false);
    } catch {
      setActionError(t('qm_err_status'));
    } finally {
      setActionLoading(false);
    }
  };

  return {
    departments,
    doctors,
    services,
    bookings,
    summary,
    loading,
    actionLoading,
    actionError,
    setActionError,
    loadBookings,
    handleCallTicket,
    handleStartServing,
    handleComplete,
    handleSkip,
    handleRecall,
    handleNoShow,
  };
}

export default useQueueData;
