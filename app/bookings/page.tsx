'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import Pagination from '@/components/common/Pagination';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { Calendar, Users, MapPin, CreditCard, ArrowRight, Filter, Search, X, FileText, CheckCircle } from 'lucide-react';

interface Booking {
  id: number;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  accommodation: {
    id: number;
    name: string;
    city: string;
    images: Array<{ url: string }>;
  };
}

export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  });
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    // Rediriger les hôtes vers leur page de réservations
    if (!isLoading && isAuthenticated && user?.role === 'host') {
      router.push('/dashboard/host/bookings');
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Debounce pour la recherche
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'host') {
      const timer = setTimeout(() => {
        fetchBookings();
      }, searchQuery.trim() ? 500 : 0); // Délai de 500ms pour la recherche

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, currentPage, statusFilter, paymentStatusFilter, periodFilter, searchQuery]);

  const fetchBookings = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const params: any = {
        per_page: 10,
        page: currentPage,
      };

      // Ajouter les filtres
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (paymentStatusFilter !== 'all') {
        params.payment_status = paymentStatusFilter;
      }
      if (periodFilter !== 'all') {
        params.period = periodFilter;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await api.get('/bookings', { params });
      
      // Gérer la pagination Laravel (structure: { data: [...], current_page, total, etc. })
      let bookingsData: Booking[] = [];
      
      if (response && response.data) {
        // Cas 1: Réponse paginée Laravel { data: [...], current_page, ... }
        if (response.data.data && Array.isArray(response.data.data)) {
          bookingsData = response.data.data;
          setPagination({
            total: response.data.total || 0,
            per_page: response.data.per_page || 10,
            current_page: response.data.current_page || 1,
            last_page: response.data.last_page || 1,
          });
        }
        // Cas 2: Tableau direct
        else if (Array.isArray(response.data)) {
          bookingsData = response.data;
          setPagination({
            total: response.data.length,
            per_page: 10,
            current_page: 1,
            last_page: 1,
          });
        }
        // Cas 3: Objet avec propriété data
        else if (response.data && typeof response.data === 'object') {
          // Essayer de trouver un tableau dans l'objet
          for (const key in response.data) {
            if (Array.isArray(response.data[key])) {
              bookingsData = response.data[key];
              setPagination({
                total: bookingsData.length,
                per_page: 10,
                current_page: 1,
                last_page: 1,
              });
              break;
            }
          }
        }
      }
      
      setBookings(bookingsData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Erreur lors du chargement des réservations';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = () => {
    setCurrentPage(1); // Réinitialiser à la première page lors d'un changement de filtre
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setPeriodFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasActiveFilters = statusFilter !== 'all' || paymentStatusFilter !== 'all' || periodFilter !== 'all' || searchQuery.trim() !== '';

  if (isLoading || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner message="Chargement de vos réservations..." size="lg" />
        </div>
      </div>
    );
  }

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
    confirmed: { label: 'Confirmée', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Mes réservations</h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-outline flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filtres
            {hasActiveFilters && (
              <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {[statusFilter, paymentStatusFilter, periodFilter, searchQuery].filter(f => f !== 'all' && f !== '').length}
              </span>
            )}
          </button>
        </div>

        {/* Section des filtres */}
        {showFilters && (
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtres de recherche
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Recherche */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Rechercher
                </label>
                <input
                  type="text"
                  placeholder="Nom ou ville..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800"
                />
              </div>

              {/* Filtre par statut */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Statut de réservation
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>

              {/* Filtre par statut de paiement */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Statut de paiement
                </label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => {
                    setPaymentStatusFilter(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800"
                >
                  <option value="all">Tous les paiements</option>
                  <option value="paid">Payé</option>
                  <option value="pending">En attente</option>
                  <option value="failed">Échec</option>
                </select>
              </div>

              {/* Filtre par période */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Période
                </label>
                <select
                  value={periodFilter}
                  onChange={(e) => {
                    setPeriodFilter(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800"
                >
                  <option value="all">Toutes les périodes</option>
                  <option value="upcoming">À venir</option>
                  <option value="past">Passées</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <ErrorDisplay 
            error={error} 
            onRetry={fetchBookings}
            type="error"
          />
        )}

        {!error && bookings.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vous n'avez aucune réservation pour le moment.
            </p>
            <Link href="/" className="btn-primary inline-block">
              Explorer les hébergements
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {bookings.map((booking) => {
              const isPast = new Date(booking.check_out) < new Date();
              const needsPayment = booking.payment_status === 'pending' && !isPast;
              
              return (
                <div
                  key={booking.id}
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="flex-1"
                    >
                      <h2 className="text-xl font-semibold mb-2">{booking.accommodation.name}</h2>
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{booking.accommodation.city}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(booking.check_in).toLocaleDateString('fr-FR')} -{' '}
                            {new Date(booking.check_out).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{booking.guests} voyageur{booking.guests > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex flex-col items-end justify-between gap-3">
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusLabels[booking.status]?.color || ''}`}>
                          {statusLabels[booking.status]?.label || booking.status}
                        </span>
                        {booking.payment_status && (
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                              booking.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : booking.payment_status === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                              {booking.payment_status === 'paid' && <CheckCircle className="w-3 h-3" />}
                              {booking.payment_status === 'paid' ? 'Payé' :
                               booking.payment_status === 'failed' ? 'Échec paiement' :
                               'Paiement en attente'}
                            </span>
                            {booking.payment_status === 'paid' && (
                              <Link
                                href={`/bookings/${booking.id}#receipt`}
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                title="Voir le reçu de paiement"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileText className="w-5 h-5" />
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(booking.total_price)} FCFA
                        </div>
                        {needsPayment && (
                          <Link
                            href={`/bookings/${booking.id}/payment`}
                            className="mt-3 btn-primary inline-flex items-center gap-2 text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <CreditCard className="w-4 h-4" />
                            Payer maintenant
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
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
      </main>
      <Footer />
    </div>
  );
}

