import { Suspense } from 'react';
import OnboardingClient from '@/components/onboarding/OnboardingClient';

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingClient />
    </Suspense>
  );
}
