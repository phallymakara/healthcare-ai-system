import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { useLanguage } from '../../context/LanguageContext';
import { API_BASE } from '../../services/api';
import { BookingModal } from './discovery/BookingModal';
import { FacilityDetailView } from './discovery/FacilityDetailView';
import { FacilityCardList } from './discovery/FacilityCardList';

interface HospitalDiscoveryProps {
  onTicketBooked: (ticket: any) => void;
  onNavigateToTriage?: () => void;
  onNavigateToTracker?: () => void;
}

export const HospitalDiscovery: React.FC<HospitalDiscoveryProps> = ({
  onTicketBooked,
}) => {
  const { language } = useLanguage();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Hospital' | 'Medical Clinic' | 'Animal Clinic'>('All');
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);

  const TIME_SLOTS = [
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '01:30 PM - 02:30 PM',
    '02:30 PM - 03:30 PM',
    '03:30 PM - 04:30 PM',
    '04:30 PM - 05:30 PM',
  ];

  const getTodayDateStr = () => new Date().toISOString().split('T')[0];

  // Booking Modal State & Field Validation
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(getTodayDateStr());
  const [appointmentTime, setAppointmentTime] = useState(TIME_SLOTS[1]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadHospitals = async (query = '') => {
    setLoading(true);
    try {
      const url = query
        ? `${API_BASE}/patients/discovery/hospitals?q=${encodeURIComponent(query)}`
        : `${API_BASE}/patients/discovery/hospitals`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHospitals(data);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHospitals(searchQuery);
  };

  const handleOpenBooking = (hosp: any, dept: any) => {
    const user = AuthService.getStoredUser();
    setSelectedHospital(hosp);
    setSelectedDept(dept);
    setPatientName(user?.full_name || '');
    setPatientPhone(user?.phone_number || '');
    setAppointmentDate(getTodayDateStr());
    setAppointmentTime(TIME_SLOTS[1]);
    setNameError(null);
    setPhoneError(null);
    setDateError(null);
    setFormError(null);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setDateError(null);
    setFormError(null);

    let hasError = false;
    if (!patientName.trim()) {
      setNameError(language === 'km' ? 'សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក' : 'Please enter your full name.');
      hasError = true;
    }
    if (!patientPhone.trim()) {
      setPhoneError(language === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នក' : 'Please enter your phone number.');
      hasError = true;
    } else if (patientPhone.trim().length < 6) {
      setPhoneError(language === 'km' ? 'សូមបញ្ចូលលេខទូរស័ព្ទត្រឹមត្រូវ' : 'Please enter a valid phone number.');
      hasError = true;
    }
    if (!appointmentDate) {
      setDateError(language === 'km' ? 'សូមជ្រើសរើសកាលបរិច្ឆេទ' : 'Please select an appointment date.');
      hasError = true;
    }

    if (hasError) return;

    setBookingLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tickets/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeaders(),
        },
        body: JSON.stringify({
          hospital_id: selectedHospital.id,
          department_id: selectedDept.id,
          patient_name: patientName.trim(),
          patient_phone: patientPhone.trim(),
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setFormError(
          errData?.detail ||
          (language === 'km'
            ? 'មិនអាចកក់សំបុត្របានទេនៅពេលនេះ។ សូមព្យាយាមម្តងទៀត។'
            : 'Unable to reserve a ticket at this moment. Please try again.')
        );
        return;
      }

      const ticket = await res.json();
      setBookingModalOpen(false);
      onTicketBooked(ticket);
    } catch {
      setFormError(language === 'km' ? 'បញ្ហាតភ្ជាប់បណ្តាញ។ សូមពិនិត្យមើលបណ្តាញរបស់អ្នកហើយព្យាយាមម្តងទៀត។' : 'Connection issue. Please check your network and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter((hosp) => {
    // 1. Category Filter
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Hospital') {
        if (hosp.category !== 'General Hospital' && hosp.category !== 'Hospital') {
          return false;
        }
      } else if (hosp.category !== selectedCategory) {
        return false;
      }
    }

    // 2. Search Query Filter
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const hospMatch = hosp.name?.toLowerCase().includes(q) || hosp.city?.toLowerCase().includes(q) || hosp.address?.toLowerCase().includes(q);
    const deptMatch = (hosp.departments || []).some(
      (d: any) => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q)
    );
    const serviceMatch = (hosp.services || []).some(
      (s: any) => s.name?.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)
    );
    return hospMatch || deptMatch || serviceMatch;
  });

  return (
    <>
      {selectedFacility ? (
        <FacilityDetailView
          selectedFacility={selectedFacility}
          onBack={() => setSelectedFacility(null)}
          onOpenBooking={handleOpenBooking}
        />
      ) : (
        <FacilityCardList
          hospitals={filteredHospitals}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onSearchSubmit={handleSearchSubmit}
          onClearSearch={() => {
            setSearchQuery('');
            loadHospitals('');
          }}
          onSelectFacility={setSelectedFacility}
        />
      )}

      {/* Booking Confirmation Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedHospital={selectedHospital}
        selectedDept={selectedDept}
        patientName={patientName}
        setPatientName={setPatientName}
        nameError={nameError}
        setNameError={setNameError}
        patientPhone={patientPhone}
        setPatientPhone={setPatientPhone}
        phoneError={phoneError}
        setPhoneError={setPhoneError}
        appointmentDate={appointmentDate}
        setAppointmentDate={setAppointmentDate}
        dateError={dateError}
        setDateError={setDateError}
        appointmentTime={appointmentTime}
        setAppointmentTime={setAppointmentTime}
        bookingLoading={bookingLoading}
        formError={formError}
        setFormError={setFormError}
        onConfirmBooking={handleConfirmBooking}
        getTodayDateStr={getTodayDateStr}
      />
    </>
  );
};
