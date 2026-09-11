import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { StandardTimeSlot, BookingItem, STANDARD_TIME_SLOTS } from './types';
import { QueueTicketItem } from './QueueTicketItem';

export interface SlotGroupData {
  slot: StandardTimeSlot;
  isBooked: boolean;
  bookings: BookingItem[];
}

export interface QueueSlotSchedulerProps {
  selectedDate: string;
  selectedDeptId: string;
  slotGroups: SlotGroupData[];
  filteredSlotGroups: SlotGroupData[];
  generalBookings: BookingItem[];
  availableSlotsCount: number;
  bookedSlotsCount: number;
  slotAvailabilityFilter: 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';
  setSlotAvailabilityFilter: (v: 'ALL' | 'AVAILABLE' | 'UNAVAILABLE') => void;
  onSelectSlotForWalkIn: (slotKey: string) => void;
  nowTimestamp: number;
  actionLoading: boolean;
  onCall: (id: string) => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onRecall: (id: string) => void;
  onNoShow: (id: string) => void;
  isKm: boolean;
  kmFont: string;
  t: (key: string) => string;
}

export const QueueSlotScheduler: React.FC<QueueSlotSchedulerProps> = ({
  selectedDate,
  slotGroups,
  filteredSlotGroups,
  generalBookings,
  availableSlotsCount,
  bookedSlotsCount,
  slotAvailabilityFilter,
  setSlotAvailabilityFilter,
  onSelectSlotForWalkIn,
  nowTimestamp,
  actionLoading,
  onCall,
  onStart,
  onComplete,
  onSkip,
  onRecall,
  onNoShow,
  isKm,
  kmFont,
  t,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Live Slots Availability Header Bar */}
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
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#059669',
                  display: 'inline-block',
                }}
              />
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
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: bookedSlotsCount > 0 ? '#dc2626' : '#94a3b8',
                  display: 'inline-block',
                }}
              />
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
                  slotAvailabilityFilter === tab.key ? 'var(--accent-primary)' : 'transparent',
                color: slotAvailabilityFilter === tab.key ? '#ffffff' : 'var(--text-muted)',
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

            return (
              <div
                key={group.slot.key}
                className="slot-card-available"
                onClick={() => onSelectSlotForWalkIn(group.slot.key)}
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
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#059669',
                      display: 'inline-block',
                    }}
                  />
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
                  {group.bookings.map((item) => (
                    <QueueTicketItem
                      key={item.id}
                      item={item}
                      nowTimestamp={nowTimestamp}
                      actionLoading={actionLoading}
                      onCall={onCall}
                      onStart={onStart}
                      onComplete={onComplete}
                      onSkip={onSkip}
                      onRecall={onRecall}
                      onNoShow={onNoShow}
                      kmFont={kmFont}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* General Tickets for Date */}
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
            <span>
              {t('cbs_general_walkins')} ({generalBookings.length})
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {generalBookings.map((item) => (
              <QueueTicketItem
                key={item.id}
                item={item}
                nowTimestamp={nowTimestamp}
                actionLoading={actionLoading}
                onCall={onCall}
                onStart={onStart}
                onComplete={onComplete}
                onSkip={onSkip}
                onRecall={onRecall}
                onNoShow={onNoShow}
                kmFont={kmFont}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueSlotScheduler;
