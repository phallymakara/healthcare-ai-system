import React, { useEffect, useState } from 'react';
import { AuthService } from '../../services/auth';
import { 
  Search, 
  Building2, 
  Clock, 
  X, 
  Users, 
  MapPin, 
  Phone, 
  Stethoscope, 
  ArrowRight
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

interface HospitalDiscoveryProps {
  onTicketBooked: (ticket: any) => void;
  onNavigateToTriage?: () => void;
  onNavigateToTracker?: () => void;
}

export const HospitalDiscovery: React.FC<HospitalDiscoveryProps> = ({ 
  onTicketBooked,
  onNavigateToTriage,
  onNavigateToTracker
}) => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State & Field Validation
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
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
        setHospitals(await res.json());
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
    setNameError(null);
    setPhoneError(null);
    setFormError(null);
    setBookingModalOpen(true);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setPhoneError(null);
    setFormError(null);

    let hasError = false;
    if (!patientName.trim()) {
      setNameError('Please enter your full name');
      hasError = true;
    }
    if (!patientPhone.trim()) {
      setPhoneError('Please enter your contact phone number');
      hasError = true;
    } else if (patientPhone.trim().length < 6) {
      setPhoneError('Please enter a valid phone number');
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
        }),
      });

      if (!res.ok) {
        setFormError('Unable to reserve a ticket at this moment. Please try again.');
        return;
      }

      const ticket = await res.json();
      setBookingModalOpen(false);
      onTicketBooked(ticket);
    } catch {
      setFormError('Connection issue. Please check your network and try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', paddingBottom: '3rem' }}>
      
      {/* 1. HERO SECTION */}
      <section style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '3rem 2.5rem',
      }}>
        <div style={{ maxWidth: '840px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.5rem' }}>
            Executive Overview • Project Proposal
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Smart Hospital Queue & AI Booking Platform
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            A digital healthcare access system designed to eliminate unpredictable waiting room delays. Patients reserve digital queue tickets remotely, track their live position in real-time, receive dynamic wait-time predictions, and access symptom triage before stepping out of their home.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <a 
              href="#search-hospitals-section" 
              className="btn btn-primary"
            >
              Explore Live Queues
            </a>
            {onNavigateToTriage && (
              <button 
                onClick={onNavigateToTriage}
                className="btn btn-outline"
                style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
              >
                <Stethoscope size={16} /> Symptom Triage <ArrowRight size={14} />
              </button>
            )}
            {onNavigateToTracker && (
              <button 
                onClick={onNavigateToTracker}
                className="btn btn-outline"
              >
                <Clock size={16} /> Track Live Ticket
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM STATEMENT */}
      <section>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Section 2 • Problem Statement
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            Why Traditional Hospital Waiting is Broken
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Healthcare facilities and patients face systematic delays and informational blackouts every day:
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              1. Zero Visibility & Lost Hours
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Patients lose hours sitting in crowded waiting rooms with no clarity on their real queue position or true waiting times.
            </p>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              2. Manual Paper Queues
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Physical paper tickets and static boards are completely disconnected from actual doctor consultation pace and workflow.
            </p>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              3. Digitization Barrier
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Hospitals and clinics lack affordable, simple software to digitize queues, staff schedules, and doctor availability.
            </p>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              4. No Queue Comparison
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Patients have no way to compare live waiting times across healthcare providers before deciding where to go.
            </p>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              5. Bottlenecks & No-Shows
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              No shared system exists to track patient flow, catch bottlenecks, reduce missed appointments, or balance clinic loads.
            </p>
          </div>
        </div>
      </section>

      {/* 3. THE PROPOSED SOLUTION */}
      <section>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Section 3 • Proposed Solution
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            A Three-Sided Real-Time Platform
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Connecting patients, clinic staff, and platform administrators through a single real-time ticketing engine:
          </p>
        </div>

        <div className="grid-3">
          {/* Patient App */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
              1. Patient Access Portal
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Enables patients to discover clinics, take queue tickets remotely, and receive live progress alerts without being physically present.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <li>• Remote digital ticket reservation for departments & doctors</li>
              <li>• Live WebSocket queue position & estimated wait time</li>
              <li>• Automated "Your Turn is Near" arrival notifications</li>
              <li>• Symptom triage assistant to find the least crowded clinic</li>
            </ul>
          </div>

          {/* Partner Console */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
              2. Hospital Staff Console
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              A centralized counter dashboard for doctors and receptionists that instantly syncs all actions with patient devices.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <li>• 1-click counter dispatch: Call Next, Consult, Complete, No-Show</li>
              <li>• Instant screen synchronization via real-time WebSockets</li>
              <li>• Doctor shift management, room assignments & availability</li>
              <li>• Walk-in ticket generation for on-premise arrivals</li>
            </ul>
          </div>

          {/* Super Admin */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed' }}>
              3. Platform Admin Control
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Complete administrative governance and telemetry over all onboarded hospital networks and clinics.
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <li>• Partner verification pipeline (Review, Approve, Reject)</li>
              <li>• System-wide ticket analytics & peak congestion tracking</li>
              <li>• User directory management and role-based access control</li>
              <li>• Comprehensive audit logs and activity tracking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (STEP-BY-STEP FLOW) */}
      <section>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Patient & Clinic Workflow
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            How the System Works in 4 Steps
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div className="glass-card">
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.35rem' }}>01</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>Discover & Compare</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Browse partner hospitals and check live department queues and wait times before leaving home.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.35rem' }}>02</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>Reserve Queue Ticket</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Reserve your digital ticket with your name and phone number with 1 click.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.35rem' }}>03</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>Live Tracking & Alerts</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Watch your number progress in real-time. Receive an alert when your turn is approaching.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '0.35rem' }}>04</div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>Direct Consultation</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Arrive right as your number is called. Walk straight into the doctor room without waiting.
            </p>
          </div>
        </div>
      </section>

      {/* 5. SYSTEM ARCHITECTURE & WAITING-TIME ENGINE */}
      <section>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Section 5 • Technical Highlights
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            Engine Architecture & Wait-Time Calculation
          </h2>
        </div>

        <div className="grid-2">
          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Deterministic Waiting-Time Formula
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Estimation is based on deterministic operational modeling rather than approximate guesses:
            </p>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              Wait = (Patients Ahead × Doctor Avg Time) - Elapsed Serving Time × Peak Multiplier
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Instant WebSocket Event Synchronization
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Staff actions trigger immediate database updates and broadcast queue position changes instantly:
            </p>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              Counter Action → Database & Redis Pub/Sub → WebSocket → Patient Live Tracker
            </div>
          </div>
        </div>
      </section>

      {/* 6. INTERACTIVE HOSPITAL DISCOVERY & QUEUES */}
      <section id="search-hospitals-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            Live Hospital & Clinic Queues
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Search partner facilities, view current wait times, and take a digital queue ticket online:
          </p>

          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '640px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="Search by hospital name, city, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  fontSize: '0.9rem',
                }}
              />
              <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
        </div>

        {/* Hospitals List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            Loading hospital queues...
          </div>
        ) : hospitals.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-dim)' }}>
            <Building2 size={32} color="var(--text-dim)" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              No hospitals found matching your search.
            </h3>
            <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto' }}>
              Try searching with another keyword or explore the partner onboarding portal in the <strong>Admin Center</strong>.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {hospitals.map((hosp) => (
              <div key={hosp.id} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <Building2 size={20} color="var(--accent-primary)" />
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{hosp.name}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      {hosp.address && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} /> {hosp.address}
                        </span>
                      )}
                      {hosp.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={14} /> {hosp.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Department Queues Grid */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.75rem' }}>
                    Available Outpatient Departments & Wait Times
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {hosp.departments?.map((dept: any) => (
                      <div
                        key={dept.id}
                        style={{
                          padding: '1rem',
                          background: '#ffffff',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '0.75rem',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{dept.name}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                              {dept.code}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={14} /> {dept.waiting_count} waiting
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                              <Clock size={14} /> ~{dept.estimated_wait_minutes} mins
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenBooking(hosp, dept)}
                          className="btn btn-outline"
                          style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
                        >
                          Reserve Ticket
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking Confirmation Modal */}
      {bookingModalOpen && selectedHospital && selectedDept && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2rem', position: 'relative' }}>
            <button
              onClick={() => setBookingModalOpen(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              Reserve Queue Ticket
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              {selectedHospital.name} • <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{selectedDept.name}</span>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Patient Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={patientName}
                  onChange={(e) => { setPatientName(e.target.value); setNameError(null); }}
                  className={nameError ? 'input-error' : ''}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                  }}
                />
                {nameError && <span className="error-text">{nameError}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={patientPhone}
                  onChange={(e) => { setPatientPhone(e.target.value); setPhoneError(null); }}
                  className={phoneError ? 'input-error' : ''}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                  }}
                />
                {phoneError && <span className="error-text">{phoneError}</span>}
              </div>

              <div style={{
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
              }}>
                Current estimated wait: <strong style={{ color: 'var(--accent-primary)' }}>~{selectedDept.estimated_wait_minutes} mins</strong> ({selectedDept.waiting_count} waiting).
              </div>

              {formError && <span className="error-text">{formError}</span>}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setBookingModalOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {bookingLoading ? 'Reserving...' : 'Confirm Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
