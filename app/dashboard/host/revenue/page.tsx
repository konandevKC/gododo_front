'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import Header from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { formatPrice } from '@/lib/utils';
import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Revenue {
  id: number;
  booking_amount: number;
  commission_rate: number;
  commission_amount: number;
  host_amount: number;
  status: string;
  created_at: string;
  booking: {
    id: number;
    accommodation: {
      name: string;
    };
  };
}

interface RevenueData {
  statistics: {
    total_revenue: number;
    paid_revenue: number;
    pending_revenue: number;
    total_bookings: number;
  };
  monthly_revenue: Array<{
    year: number;
    month: number;
    total: number;
  }>;
  revenues: {
    data: Revenue[];
    current_page: number;
    total: number;
    per_page: number;
  };
}

export default function HostRevenuePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'host')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'host') {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/revenue/host');
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des revenus');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'host') {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Mes revenus</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Consultez vos revenus après déduction des commissions
          </p>
        </div>

        {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}

        {data && (
          <>
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenus totaux</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(data.statistics.total_revenue)} FCFA
                    </p>
                  </div>
                  <DollarSign className="w-10 h-10 text-primary opacity-50" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenus payés</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {formatPrice(data.statistics.paid_revenue)} FCFA
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-600 dark:text-green-400 opacity-50" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">En attente</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {formatPrice(data.statistics.pending_revenue)} FCFA
                    </p>
                  </div>
                  <Calendar className="w-10 h-10 text-yellow-600 dark:text-yellow-400 opacity-50" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total réservations</p>
                    <p className="text-3xl font-bold">{data.statistics.total_bookings}</p>
                  </div>
                  <Calendar className="w-10 h-10 text-primary opacity-50" />
                </div>
              </div>
            </div>

            {/* Liste des revenus */}
            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Historique des revenus</h2>
              {data.revenues.data.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">Aucun revenu</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-left py-3 px-4">Hébergement</th>
                        <th className="text-right py-3 px-4">Montant réservation</th>
                        <th className="text-right py-3 px-4">Commission</th>
                        <th className="text-right py-3 px-4">Votre revenu</th>
                        <th className="text-center py-3 px-4">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.revenues.data.map((revenue) => (
                        <tr key={revenue.id} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-3 px-4">
                            {format(new Date(revenue.created_at), 'dd MMM yyyy', { locale: fr })}
                          </td>
                          <td className="py-3 px-4">{revenue.booking.accommodation.name}</td>
                          <td className="py-3 px-4 text-right">
                            {formatPrice(revenue.booking_amount)} FCFA
                          </td>
                          <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                            -{formatPrice(revenue.commission_amount)} FCFA ({revenue.commission_rate}%)
                          </td>
                          <td className="py-3 px-4 text-right text-primary font-semibold">
                            {formatPrice(revenue.host_amount)} FCFA
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              revenue.status === 'paid'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : revenue.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {revenue.status === 'paid' ? 'Payé' :
                               revenue.status === 'pending' ? 'En attente' : 'Annulé'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

