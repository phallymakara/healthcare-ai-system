export interface BookedTicket {
  id: string;
  ticket_number: string;
  queue_session_id?: string;
  hospital_id: string;
  hospital_name?: string;
  hospital_logo_url?: string;
  hospital_address?: string;
  hospital_phone?: string;
  hospital_latitude?: number;
  hospital_longitude?: number;
  department_id: string;
  department_name?: string;
  department_floor_room?: string;
  doctor_id?: string;
  doctor_name?: string;
  doctor_specialty?: string;
  doctor_photo_url?: string;
  room_number?: string;
  service_id?: string;
  service_name?: string;
  patient_id?: string;
  patient_name: string;
  patient_phone?: string;
  ticket_source: string;
  status: 'WAITING' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | string;
  position?: number;
  estimated_wait_minutes?: number;
  appointment_date?: string;
  appointment_time?: string;
  called_at?: string;
  serving_started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

export const getTicketMapUrl = (ticket: BookedTicket) => {
  if (ticket.hospital_latitude && ticket.hospital_longitude) {
    return `https://maps.google.com/?q=${ticket.hospital_latitude},${ticket.hospital_longitude}`;
  }
  const query = ticket.hospital_address || ticket.hospital_name || 'Hospital';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

export const computeTimingInfo = (activeTicket: BookedTicket | null, isKm: boolean) => {
  if (!activeTicket || !activeTicket.appointment_date) {
    return {
      countdownLabel: isKm ? 'មិនមានកាលបរិច្ឆេទ' : 'No Date',
      recommendedArrival: isKm ? 'មុន ១៥ នាទី' : '15 mins early',
      isToday: false,
      isPast: false,
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const apptDateStr = activeTicket.appointment_date;
  const isToday = apptDateStr === todayStr;

  const todayDate = new Date(todayStr + 'T00:00:00');
  const targetDate = new Date(apptDateStr + 'T00:00:00');
  const diffMs = targetDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let countdownLabel = '';
  let isPast = false;

  if (diffDays === 0) {
    countdownLabel = isKm ? 'ថ្ងៃនេះ' : 'Today';
  } else if (diffDays === 1) {
    countdownLabel = isKm ? 'ថ្ងៃស្អែក' : 'Tomorrow';
  } else if (diffDays > 1) {
    countdownLabel = isKm ? `នៅសល់ ${diffDays} ថ្ងៃទៀត` : `In ${diffDays} days`;
  } else {
    isPast = true;
    countdownLabel = isKm ? 'កាលបរិច្ឆេទបានកន្លងផុត' : 'Past Date';
  }

  let arrivalStr = '15 mins before slot';
  if (activeTicket.appointment_time) {
    const startTime = activeTicket.appointment_time.split('-')[0]?.trim();
    if (startTime) {
      arrivalStr = isKm ? `មុនម៉ោង ${startTime}` : `Before ${startTime}`;
    }
  }

  return { countdownLabel, recommendedArrival: arrivalStr, isToday, isPast };
};
