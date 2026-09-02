import React from 'react';
import { HeroSection } from './HeroSection';
import { PatientFeatures } from './PatientFeatures';
import { HospitalFeatures } from './HospitalFeatures';
import { HowItWorks } from './HowItWorks';
import { CtaSection } from './CtaSection';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      <HeroSection onOpenAuth={onOpenAuth} />
      <PatientFeatures />
      <HospitalFeatures />
      <HowItWorks />
      <CtaSection onOpenAuth={onOpenAuth} />
    </div>
  );
};

export default LandingPage;
