import React from 'react';
import { HeroSection } from './HeroSection';
import { PatientFeatures } from './PatientFeatures';
import { HospitalFeatures } from './HospitalFeatures';
import { HowItWorks } from './HowItWorks';
import { CtaSection } from './CtaSection';
import { UserProfile } from '../../services/auth';
import { NavTab } from '../../components/Sidebar';

interface LandingPageProps {
  onOpenAuth: () => void;
  currentUser?: UserProfile | null;
  onSelectTab?: (tab: NavTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth, currentUser, onSelectTab }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      <HeroSection onOpenAuth={onOpenAuth} currentUser={currentUser} onSelectTab={onSelectTab} />
      <PatientFeatures />
      <HospitalFeatures />
      <HowItWorks />
      <CtaSection onOpenAuth={onOpenAuth} currentUser={currentUser} onSelectTab={onSelectTab} />
    </div>
  );
};

export default LandingPage;
