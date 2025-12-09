'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import Header from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import Pagination from '@/components/common/Pagination';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Home, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Plus,
  BarChart3,
  Users,
  Star,
  AlertCircle
} from 'lucide-react';

interface RoomTypePricing {
  type: string;
  price_per_night: number;
  rooms_available?: number | null;
}

interface Accommodation {
  id: number;
  name: string;
  type: string;
  city: string;
  status: 'pending' | 'published' | 'rejected' | 'unavailable' | 'renovation';
  price_per_night: number;
  room_type_pricing?: RoomTypePricing[];
  images?: Array<{ id: number; url: string; is_primary?: boolean }>;
  bookings_count?: number;
  rating?: number | null;
  total_reviews?: number | null;
  created_at: string;
}

interface AccommodationStats {
  id: number;
  name: string;
  city: string;
  type: string;
  status: string;
  total_bookings: number;
  total_revenue: number;
  daily_bookings: number;
  daily_revenue: number;
  weekly_bookings: number;
  weekly_revenue: number;
  monthly_bookings: number;
  monthly_revenue: number;
}

interface AnalyticsData {
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  upcoming_bookings: number;
  total_revenue: number;
  revenue_this_month: number;
  revenue_last_month: number;
  revenue_growth: number;
  daily_revenue?: number;
  weekly_revenue?: number;
  monthly_revenue_current?: number;
  occupancy_rate: number;
  accommodations: {
    total: number;
    published: number;
    pending: number;
    rejected: number;
  };
  top_accommodations?: Array<{
    id: number;
    name: string;
    bookings_sum_total_price: number;
    bookings_count: number;
  }>;
  accommodations_stats?: AccommodationStats[];
  monthly_revenue?: Array<{
    month: string;
    revenue: number;
  }>;
}

export default function HostDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'published' | 'rejected' | 'unavailable' | 'renovation'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  });
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [appointmentAccId, setAppointmentAccId] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [appointmentNotes, setAppointmentNotes] = useState<string>('');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'host')) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'host') {
      fetchData();
    }
  }, [isAuthenticated, user, statusFilter, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('per_page', '10');
      params.append('page', currentPage.toString());
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const [analyticsRes, accommodationsRes] = await Promise.all([
        api.get('/analytics/host'),
        api.get(`/accommodations/my?${params.toString()}`)
      ]);

      setAnalytics(analyticsRes.data);
      
      // Gérer la réponse paginée
      if (accommodationsRes.data.data && Array.isArray(accommodationsRes.data.data)) {
        setAccommodations(accommodationsRes.data.data);
        setPagination({
          total: accommodationsRes.data.total || 0,
          per_page: accommodationsRes.data.per_page || 10,
          current_page: accommodationsRes.data.current_page || 1,
          last_page: accommodationsRes.data.last_page || 1,
        });
      } else if (Array.isArray(accommodationsRes.data)) {
        setAccommodations(accommodationsRes.data);
        setPagination({
          total: accommodationsRes.data.length,
          per_page: 10,
          current_page: 1,
          last_page: 1,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Réinitialiser à la page 1 quand le filtre change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const changeStatus = async (id: number, status: Accommodation['status']) => {
    try {
      setUpdatingId(id);
      await api.put(`/accommodations/${id}`, { status });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteAccommodation = async (id: number) => {
    if (!confirm('Supprimer définitivement cet hébergement ?')) return;
    try {
      setUpdatingId(id);
      await api.delete(`/accommodations/${id}`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setUpdatingId(null);
    }
  };

  const submitAppointment = async () => {
    if (!appointmentAccId || !appointmentDate) return;
    try {
      setUpdatingId(appointmentAccId);
      await api.post(`/accommodations/${appointmentAccId}/appointments`, {
        requested_at: appointmentDate,
        notes: appointmentNotes,
      });
      setAppointmentAccId(null);
      setAppointmentDate('');
      setAppointmentNotes('');
      alert('Demande de visite envoyée.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la demande de visite');
    } finally {
      setUpdatingId(null);
    }
  };

  const statusLabels = {
    pending: { label: 'En attente', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400', icon: Clock },
    published: { label: 'Publié', color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400', icon: CheckCircle },
    rejected: { label: 'Rejeté', color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400', icon: XCircle },
    unavailable: { label: 'Indisponible', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: Clock },
    renovation: { label: 'Rénovation', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400', icon: Clock },
    disabled: { label: 'Désactivé', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: Clock },
    removed: { label: 'Retiré', color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400', icon: XCircle },
  };

  const typeLabels: Record<string, string> = {
    hotel: 'Hôtel',
    lodge: 'Lodge',
    guesthouse: 'Maison d\'hôtes',
    apartment: 'Appartement',
  };

  const filteredAccommodations = statusFilter === 'all' 
    ? accommodations 
    : accommodations.filter(acc => acc.status === statusFilter);

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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-primary">Tableau de bord Hôte</h1>
            <Link 
              href="/dashboard/host/accommodations/new"
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Ajouter un hébergement
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez vos hébergements et suivez vos performances
          </p>
        </div>

        {error && (
          <ErrorDisplay error={error} onDismiss={() => setError(null)} />
        )}

        {analytics && (
          <>
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenus totaux</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(analytics.total_revenue)} FCFA
                    </p>
                    {analytics.revenue_growth !== 0 && (
                      <p className={`text-sm mt-1 flex items-center gap-1 ${
                        analytics.revenue_growth > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className={`w-4 h-4 ${analytics.revenue_growth < 0 ? 'rotate-180' : ''}`} />
                        {Math.abs(analytics.revenue_growth).toFixed(1)}% vs mois dernier
                      </p>
                    )}
                  </div>
                  <DollarSign className="w-10 h-10 text-primary opacity-50" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Réservations</p>
                    <p className="text-3xl font-bold">{analytics.total_bookings}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {analytics.confirmed_bookings} confirmées
                    </p>
                  </div>
                  <Calendar className="w-10 h-10 text-primary opacity-50" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Hébergements</p>
                    <p className="text-3xl font-bold">{analytics.accommodations.total}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {analytics.accommodations.published} publiés
                    </p>
                  </div>
                  <Home className="w-10 h-10 text-primary opacity-50" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Taux d'occupation</p>
                    <p className="text-3xl font-bold">{analytics.occupancy_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {analytics.upcoming_bookings} à venir
                    </p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-primary opacity-50" />
                </div>
              </div>
            </div>

            {/* Revenus par période */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenus journaliers</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatPrice(analytics.daily_revenue || 0)} FCFA
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Aujourd'hui</p>
                  </div>
                  <Calendar className="w-10 h-10 text-blue-500 opacity-50" />
                </div>
              </div>

              <div className="card border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenus hebdomadaires</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {formatPrice(analytics.weekly_revenue || 0)} FCFA
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">7 derniers jours</p>
                  </div>
                  <BarChart3 className="w-10 h-10 text-purple-500 opacity-50" />
                </div>
              </div>

              <div className="card border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenus mensuels</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatPrice(analytics.monthly_revenue_current || analytics.revenue_this_month || 0)} FCFA
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Ce mois</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
                </div>
              </div>
            </div>

            {/* Statistiques des statuts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Hébergements publiés</p>
                    <p className="text-3xl font-bold text-green-600">
                      {analytics.accommodations.published}
                    </p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-500 opacity-50" />
                </div>
              </div>

              <div className="card border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">En attente de validation</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {analytics.accommodations.pending}
                    </p>
                  </div>
                  <Clock className="w-10 h-10 text-yellow-500 opacity-50" />
                </div>
              </div>

              <div className="card border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rejetés</p>
                    <p className="text-3xl font-bold text-red-600">
                      {analytics.accommodations.rejected}
                    </p>
                  </div>
                  <XCircle className="w-10 h-10 text-red-500 opacity-50" />
                </div>
              </div>
            </div>

            {/* Alertes */}
            {analytics.pending_bookings > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <p className="text-yellow-800 dark:text-yellow-400">
                    Vous avez <strong>{analytics.pending_bookings}</strong> réservation(s) en attente de confirmation
                  </p>
                </div>
                <Link
                  href="/dashboard/host/bookings/requests"
                  className="btn-primary text-sm"
                >
                  Voir les demandes
                </Link>
              </div>
            )}

            {analytics.accommodations.pending > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-blue-800 dark:text-blue-400">
                  Vous avez <strong>{analytics.accommodations.pending}</strong> hébergement(s) en attente de validation par l'administrateur
                </p>
              </div>
            )}
          </>
        )}

        {/* Liste des hébergements */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Mes hébergements</h2>
            <div className="flex gap-2">
              {(['all', 'published', 'pending', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {status === 'all' ? 'Tous' : statusLabels[status].label}
                </button>
              ))}
            </div>
          </div>

          {filteredAccommodations.length === 0 ? (
            <div className="card text-center py-12">
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {statusFilter === 'all' 
                  ? 'Vous n\'avez pas encore d\'hébergement'
                  : `Aucun hébergement ${statusLabels[statusFilter as keyof typeof statusLabels].label.toLowerCase()}`
                }
              </p>
              {statusFilter === 'all' && (
                <Link href="/dashboard/host/accommodations/new" className="btn-primary inline-flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Ajouter votre premier hébergement
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAccommodations.map((acc) => {
                  const StatusIcon = statusLabels[acc.status as keyof typeof statusLabels]?.icon || Clock;
                  const primaryImage = acc.images?.find(img => img.is_primary)?.url || 
                                     acc.images?.[0]?.url || 
                                     'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

                  return (
                    <div key={acc.id} className="card hover:shadow-lg transition-shadow">
                      <Link href={`/accommodations/${acc.id}`}>
                        <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
                          <Image
                            src={primaryImage}
                            alt={acc.name}
                            fill
                            className="object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusLabels[acc.status as keyof typeof statusLabels]?.color || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusLabels[acc.status as keyof typeof statusLabels]?.label || acc.status}
                            </span>
                          </div>
                        </div>
                      </Link>

                      <div className="space-y-3">
                        <div>
                          <Link href={`/accommodations/${acc.id}`}>
                            <h3 className="font-semibold text-lg mb-1 hover:text-primary transition-colors">
                              {acc.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {typeLabels[acc.type] || acc.type} • {acc.city}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            <p className="text-2xl font-bold text-primary">
                              {formatPrice(acc.price_per_night)} FCFA
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">par nuit</p>
                            {acc.room_type_pricing && acc.room_type_pricing.length > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {acc.room_type_pricing.length} type{acc.room_type_pricing.length > 1 ? 's' : ''} de chambre{acc.room_type_pricing.length > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {acc.bookings_count !== undefined && (
                              <p className="text-sm font-medium flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {acc.bookings_count} réservation{acc.bookings_count > 1 ? 's' : ''}
                              </p>
                            )}
                            {acc.rating && typeof acc.rating === 'number' && acc.rating > 0 && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <Star className="w-4 h-4 fill-accent text-accent" />
                                {Number(acc.rating).toFixed(1)} ({acc.total_reviews || 0})
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <Link
                            href={`/accommodations/${acc.id}`}
                            className="flex-1 btn-secondary text-center text-sm"
                          >
                            <Eye className="w-4 h-4 inline mr-1" />
                            Voir
                          </Link>
                          <Link
                            href={`/dashboard/host/accommodations/${acc.id}/edit`}
                            className="flex-1 btn-primary text-center text-sm"
                          >
                            Modifier
                          </Link>
                        </div>

                        {/* Actions déplacées vers la page détail du bien */}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination
                currentPage={pagination.current_page}
                totalPages={pagination.last_page}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
                itemsPerPage={pagination.per_page}
              />
            </>
          )}
        </div>

        {/* Revenus par établissement */}
        {analytics?.accommodations_stats && analytics.accommodations_stats.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Revenus par établissement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {analytics.accommodations_stats
                .sort((a, b) => b.total_revenue - a.total_revenue)
                .map((acc) => (
                  <Link
                    key={acc.id}
                    href={`/dashboard/host/accommodations/${acc.id}/stats`}
                    className="card hover:shadow-lg transition-all border-l-4 border-primary cursor-pointer hover:border-primary-dark hover:scale-[1.02] group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">{acc.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {typeLabels[acc.type] || acc.type} • {acc.city}
                          </p>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                      
                      <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenus totaux</p>
                          <p className="text-2xl font-bold text-primary">
                            {formatPrice(acc.total_revenue)} FCFA
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {acc.total_bookings} réservation{acc.total_bookings > 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Aujourd'hui</p>
                            <p className="text-sm font-semibold text-blue-600">
                              {formatPrice(acc.daily_revenue)} FCFA
                            </p>
                            <p className="text-[10px] text-gray-500">{acc.daily_bookings} réserv.</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">7 jours</p>
                            <p className="text-sm font-semibold text-purple-600">
                              {formatPrice(acc.weekly_revenue)} FCFA
                            </p>
                            <p className="text-[10px] text-gray-500">{acc.weekly_bookings} réserv.</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Ce mois</p>
                            <p className="text-sm font-semibold text-green-600">
                              {formatPrice(acc.monthly_revenue)} FCFA
                            </p>
                            <p className="text-[10px] text-gray-500">{acc.monthly_bookings} réserv.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Statistiques détaillées par établissement */}
        {analytics?.accommodations_stats && analytics.accommodations_stats.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Statistiques détaillées par établissement</h2>
            <div className="card overflow-x-auto">
              <div className="min-w-full">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Établissement</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Réservations totales</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Revenus totaux</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Journalier</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Hebdomadaire</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Mensuel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.accommodations_stats.map((acc) => (
                      <tr 
                        key={acc.id} 
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                        onClick={() => router.push(`/dashboard/host/accommodations/${acc.id}/stats`)}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold">{acc.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {typeLabels[acc.type] || acc.type} • {acc.city}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="font-medium">{acc.total_bookings}</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <p className="font-bold text-primary">{formatPrice(acc.total_revenue)} FCFA</p>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <p className="font-medium text-blue-600">{formatPrice(acc.daily_revenue)} FCFA</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{acc.daily_bookings} réserv.</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <p className="font-medium text-purple-600">{formatPrice(acc.weekly_revenue)} FCFA</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{acc.weekly_bookings} réserv.</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div>
                            <p className="font-medium text-green-600">{formatPrice(acc.monthly_revenue)} FCFA</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{acc.monthly_bookings} réserv.</p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Top hébergements */}
        {analytics?.top_accommodations && analytics.top_accommodations.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Top hébergements</h2>
            <div className="card">
              <div className="space-y-4">
                {analytics.top_accommodations.map((acc, index) => (
                  <Link
                    key={acc.id}
                    href={`/dashboard/host/accommodations/${acc.id}/stats`}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold group-hover:text-primary transition-colors">{acc.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {acc.bookings_count} réservation{acc.bookings_count > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-lg font-bold text-primary">
                          {formatPrice(acc.bookings_sum_total_price || 0)} FCFA
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Revenus totaux</p>
                      </div>
                      <Eye className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

