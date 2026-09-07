import React, { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE } from '../services/api';
import { AuthService } from '../services/auth';
import { RealTimeQueueClient } from '../services/websocket';

export interface SlotAvailability {
  slot: string;
  is_booked: boolean;
  booked_count: number;
  max_capacity: number;
  available_spots: number;
}

interface AppointmentSlotPickerProps {
  hospitalId: string;
  departmentId?: string;
  doctorId?: string;
  selectedDate: string;
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  onSlotError?: (error: string | null) => void;
}

const DEFAULT_SLOTS: SlotAvailability[] = [
  { slot: '08:00 AM - 09:00 AM', is_booked: false, booked_count: 0, max_capacity: 1, available_spots: 1 },
  { slot: '09:00 AM - 10:00 AM', is_booked: false, booked_count: 0, max_capacity: 1, available_spots: 1 },
  { slot: '10:00 AM - 11:00 AM', is_booked: false, booked_count: 0, max_capacity: 1, available_spots: 1 },
  { slot: '11:00 AM - 12:00 PM', is_booked: false, booked_count: 0, max_capacity: 1, available_spots: 1 },
  { slot: '01:30 PM - 02:30 PM', is_booked: false, booked_count: 0, max_capacity: 1, available_spots: 1 },
  { slot: '02:30 PM - 03:30 PM', is_booked: false, booked_count: 0, max_capacity: 1, available_spots: 1 },
  { slot: '03:30 PM - 04:30 PM', is_booked: false, booked_count: 0, max_capacity: 1, available_spots: 1 },
  { slot: '04:30 PM - 05:30 PM', is_booked: false, booked_count: 0, max_capacity: 1, available_spots: 1 },
];

export const AppointmentSlotPicker: React.FC<AppointmentSlotPickerProps> = ({
  hospitalId,
  departmentId,
  doctorId,
  selectedDate,
  selectedSlot,
  onSelectSlot,
  onSlotError,
}) => {
  const { language, t } = useLanguage();
  const isKm = language === 'km';
  const kmFont = isKm ? 'var(--font-khmer)' : 'inherit';

  const [slots, setSlots] = useState<SlotAvailability[]>(DEFAULT_SLOTS);
  const [loading, setLoading] = useState(false);
  const [localSlotError, setLocalSlotError] = useState<string | null>(null);

  const fetchSlotAvailability = useCallback(async () => {
    if (!hospitalId || !selectedDate) return;
    setLoading(true);
    setLocalSlotError(null);
    try {
      const params = new URLSearchParams({
        hospital_id: hospitalId,
        date: selectedDate,
      });
      if (departmentId) params.append('department_id', departmentId);
      if (doctorId) params.append('doctor_id', doctorId);

      const res = await fetch(`${API_BASE}/tickets/slots/availability?${params.toString()}`, {
        headers: AuthService.getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.slots && data.slots.length > 0) {
          setSlots(data.slots);

          // If current selected slot is booked, notify with plain error text
          const currentSlotData = data.slots.find((s: SlotAvailability) => s.slot === selectedSlot);
          if (currentSlotData && currentSlotData.is_booked) {
            const errorMsg = t('slot_already_booked_err');
            setLocalSlotError(errorMsg);
            if (onSlotError) onSlotError(errorMsg);

            // Auto-select first available slot
            const firstAvailable = data.slots.find((s: SlotAvailability) => !s.is_booked);
            if (firstAvailable) {
              onSelectSlot(firstAvailable.slot);
            }
          } else {
            setLocalSlotError(null);
            if (onSlotError) onSlotError(null);
          }
        }
      } else {
        setSlots(DEFAULT_SLOTS);
      }
    } catch {
      setSlots(DEFAULT_SLOTS);
    } finally {
      setLoading(false);
    }
  }, [hospitalId, selectedDate, departmentId, doctorId, selectedSlot, onSelectSlot, onSlotError, t]);

  useEffect(() => {
    fetchSlotAvailability();
  }, [hospitalId, selectedDate, departmentId, doctorId]);

  // Live WebSocket auto-refresh for real-time queue synchronization
  useEffect(() => {
    if (departmentId) {
      const ws = new RealTimeQueueClient(`queue:${departmentId}`);
      ws.connect();
      const unsub = ws.subscribe(() => {
        fetchSlotAvailability();
      });
      return () => {
        unsub();
        ws.disconnect();
      };
    }
  }, [departmentId, fetchSlotAvailability]);

  const availableCount = slots.filter((s) => !s.is_booked).length;
  const totalCount = slots.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {/* Label and Plain Text Counter (No container, no shadow, no background fill) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <label
          style={{
            fontSize: '0.92rem',
            fontWeight: 600,
            color: 'var(--text-main)',
            fontFamily: kmFont,
          }}
        >
          {t('appointment_time')}
        </label>

        <div>
          {loading ? (
            <span
              style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                fontFamily: kmFont,
              }}
            >
              {t('slot_checking')}
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.82rem',
                color: availableCount > 0 ? '#059669' : '#dc2626',
                fontWeight: 500,
                fontFamily: kmFont,
              }}
            >
              {t('slot_summary')
                .replace('{available}', String(availableCount))
                .replace('{total}', String(totalCount))}
            </span>
          )}
        </div>
      </div>

      {/* Slots Grid: Clean buttons, no shadow, no colored background outside text */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '0.6rem',
        }}
      >
        {slots.map((s) => {
          const isSelected = selectedSlot === s.slot;
          const isBooked = s.is_booked;

          return (
            <button
              key={s.slot}
              type="button"
              disabled={isBooked}
              onClick={() => {
                if (!isBooked) {
                  onSelectSlot(s.slot);
                  setLocalSlotError(null);
                  if (onSlotError) onSlotError(null);
                }
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '0.55rem 0.75rem',
                borderRadius: '4px',
                background: '#ffffff',
                border: isSelected
                  ? '1.5px solid var(--text-main)'
                  : '1px solid var(--border-color)',
                cursor: isBooked ? 'not-allowed' : 'pointer',
                opacity: isBooked ? 0.5 : 1,
                boxShadow: 'none',
                textAlign: 'left',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isBooked ? 'var(--text-muted)' : 'var(--text-main)',
                  fontFamily: kmFont,
                  letterSpacing: '-0.01em',
                }}
              >
                {s.slot}
              </div>

              <div
                style={{
                  marginTop: '0.25rem',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  fontFamily: kmFont,
                  color: isSelected
                    ? 'var(--text-main)'
                    : isBooked
                    ? '#dc2626'
                    : '#059669',
                }}
              >
                {isSelected
                  ? t('slot_selected')
                  : isBooked
                  ? t('slot_booked')
                  : t('slot_available')}
              </div>
            </button>
          );
        })}
      </div>

      {/* Error directly under the slot picker: plain error text only, no container, no shadow, no background */}
      {localSlotError && (
        <div
          style={{
            color: '#dc2626',
            fontSize: '0.85rem',
            marginTop: '4px',
            fontFamily: kmFont,
          }}
        >
          {localSlotError}
        </div>
      )}
    </div>
  );
};
