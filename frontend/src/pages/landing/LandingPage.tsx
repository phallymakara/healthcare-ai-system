import React from 'react';
import { HeroSection } from './HeroSection';
import { PatientFeatures } from './PatientFeatures';
import { HospitalFeatures } from './HospitalFeatures';
import { TestimonialsSection } from './TestimonialsSection';
import { HowItWorks } from './HowItWorks';
import { CtaSection } from './CtaSection';
import { FooterSection } from './FooterSection';
import { UserProfile } from '../../services/auth';
import { NavTab } from '../../components/Sidebar';

interface LandingPageProps {
  onOpenAuth: () => void;
  currentUser?: UserProfile | null;
  onSelectTab?: (tab: NavTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, currentUser, onSelectTab }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', margin: 0, padding: 0 }}>
      {/* Full-width Hero Section */}
      <HeroSection onOpenAuth={onOpenAuth} currentUser={currentUser} onSelectTab={onSelectTab} />

      {/* Full-width Patient Experience Section with Emerald Gradient */}
      <PatientFeatures />

      {/* Structured Content Sections in Responsive Centered Container */}
      <div className="landing-inner-container" style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', marginTop: '1.5rem', paddingBottom: '2.5rem' }}>
        <HospitalFeatures />
        <TestimonialsSection />
        <HowItWorks />
      </div>

      {/* Full-width Call to Action Section spanning entire page width */}
      <CtaSection onOpenAuth={onOpenAuth} currentUser={currentUser} onSelectTab={onSelectTab} />

      {/* Bottom Footer Section */}
      <FooterSection />
    </div>
  );
};

export default LandingPage;
