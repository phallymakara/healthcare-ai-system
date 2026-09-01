import React from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
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
            Executive Summary • Project Proposal
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2, marginBottom: '1rem', letterSpacing: '-0.02em' }}>
            Smart Hospital Queue & AI Booking Platform
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            A digital healthcare access system designed to eliminate unpredictable waiting room delays. Patients remotely reserve queue tickets, track their live position in real-time, view dynamic wait-time estimations, and access symptom triage before stepping out of their home.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button 
              onClick={onOpenAuth}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.4rem' }}
            >
              Access System <ArrowRight size={16} />
            </button>
            <a 
              href="#problem-section" 
              className="btn btn-outline"
              style={{ padding: '0.65rem 1.4rem' }}
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM STATEMENT (Section 2 from Proposal) */}
      <section id="problem-section">
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Section 2 • Problem Statement
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            Why Traditional Hospital Waiting is Broken
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Every day, patients and healthcare providers struggle with disjointed outpatient flow:
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
              Patients have no way to compare live waiting times across healthcare providers before deciding where to travel.
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

      {/* 3. THE PROPOSED SOLUTION (Section 3 from Proposal) */}
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
          {/* Patient Portal */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
              1. Patient Access Portal
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Enables patients to discover clinics, take queue tickets remotely, and receive live progress alerts without sitting in waiting rooms.
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

          {/* Admin Center */}
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

      {/* 4. HOW IT WORKS (4-STEP PATIENT FLOW) */}
      <section>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Workflow Breakdown
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
              Reserve your digital ticket with your name and phone number in 1 click.
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
              Arrive right as your number is called. Walk straight into the consultation room without waiting.
            </p>
          </div>
        </div>
      </section>

      {/* 5. SYSTEM ARCHITECTURE HIGHLIGHTS */}
      <section>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Section 5 • Technical Architecture
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

      {/* 6. CALL TO ACTION */}
      <section style={{
        background: '#ffffff',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '2.5rem',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Ready to experience frictionless healthcare access?
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto 1.5rem auto' }}>
          Sign in as a patient to reserve queue tickets or login as hospital staff to operate your live counter desk.
        </p>
        <button 
          onClick={onOpenAuth}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.75rem', fontSize: '0.95rem' }}
        >
          Sign In / Register
        </button>
      </section>

    </div>
  );
};
