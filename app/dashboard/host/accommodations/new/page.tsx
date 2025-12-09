'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import AccommodationCreationWizard from '@/components/accommodations/AccommodationCreationWizard';

export default function HostNewAccommodationPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'host')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || !isAuthenticated || !user || user.role !== 'host') {
    return null;
  }

  return (
    <AccommodationCreationWizard
      mode="host"
      backHref="/dashboard/host"
      cancelHref="/dashboard/host"
      successRedirectHref="/dashboard/host"
    />
  );
}
