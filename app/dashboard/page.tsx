'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/common/Header';
import Link from 'next/link';
import { isController, isAdmin } from '@/lib/userUtils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Auto-redirect based on role
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Les contrôleurs (via RBAC) sont toujours redirigés vers la page des inspections
      if (isController(user)) {
        router.push('/dashboard/admin/inspections');
      } else if (user.role === 'host') {
        router.push('/dashboard/host');
      } else if (user.role === 'user') {
        router.push('/dashboard/user');
      } else if (isAdmin(user)) {
        router.push('/dashboard/admin');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {user.role === 'user' && (
            <Link href="/dashboard/user" className="card hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Mes réservations</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Consultez et gérez vos réservations
              </p>
            </Link>
          )}

          {user.role === 'host' && (
            <>
              <Link href="/dashboard/host" className="card hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-2">Mes hébergements</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Gérez vos hébergements et réservations
                </p>
              </Link>
              <Link href="/dashboard/host/accommodations/new" className="card hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-2">Ajouter un hébergement</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Créez un nouveau hébergement
                </p>
              </Link>
            </>
          )}

          {isAdmin(user) && (
            <Link href="/dashboard/admin" className="card hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold mb-2">Administration</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Gérez la plateforme
              </p>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

