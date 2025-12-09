'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { isController, isAdmin } from '@/lib/userUtils';
import api from '@/lib/api';
import Header from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Pagination from '@/components/common/Pagination';
import { formatPrice } from '@/lib/utils';
import {
  Building2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  Ban,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Accommodation {
  id: number;
  name: string;
  type: string;
  city: string;
  address: string;
  status: 'pending' | 'published' | 'rejected' | 'unavailable' | 'renovation' | 'removed' | 'disabled';
  price_per_night: number;
  images?: Array<{ id: number; url: string; is_primary?: boolean }>;
  host?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
}

export default function AdminAccommodationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1,
  });
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showActionModal, setShowActionModal] = useState<{
    type: 'approve' | 'reject' | 'remove' | 'disable' | 'enable' | null;
    accommodationId: number | null;
  }>({ type: null, accommodationId: null });
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Rediriger les contrôleurs vers leur page d'inspections
      if (isController(user)) {
        router.push('/dashboard/admin/inspections');
        return;
      }
      // Rediriger les non-admins vers la page de login
      if (!isAdmin(user)) {
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user && isAdmin(user)) {
      fetchAccommodations();
    }
  }, [isAuthenticated, user, currentPage, statusFilter, typeFilter, search]);

  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {
        page: currentPage,
        per_page: 15,
      };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const response = await api.get('/admin/accommodations', { params });
      setAccommodations(response.data.data || []);
      setPagination(response.data.pagination || {
        total: 0,
        per_page: 15,
        current_page: 1,
        last_page: 1,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des établissements');
      console.error('Error fetching accommodations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type: 'approve' | 'reject' | 'remove' | 'disable' | 'enable', accommodationId: number) => {
    if ((type === 'reject' || type === 'remove') && !actionReason.trim()) {
      alert('Veuillez indiquer un motif');
      return;
    }

    try {
      setActionLoading(accommodationId);
      const endpoint = type;
      await api.post(`/admin/accommodations/${accommodationId}/${endpoint}`, {
        reason: actionReason || undefined,
        notes: actionNotes || undefined,
      });
      setShowActionModal({ type: null, accommodationId: null });
      setActionReason('');
      setActionNotes('');
      fetchAccommodations();
    } catch (err: any) {
      alert(err.response?.data?.message || `Erreur lors de l'action ${type}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          En attente
        </span>
      ),
      published: (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Publié
        </span>
      ),
      rejected: (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Rejeté
        </span>
      ),
      unavailable: (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          Indisponible
        </span>
      ),
      renovation: (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          En rénovation
        </span>
      ),
      removed: (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          Retiré
        </span>
      ),
      disabled: (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          Désactivé
        </span>
      ),
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      hotel: 'Hôtel',
      lodge: 'Lodge',
      guesthouse: 'Maison d\'hôtes',
      apartment: 'Appartement',
    };
    return types[type] || type;
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

  if (!isAuthenticated || !user || !isAdmin(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Gestion des Établissements
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Approuvez, rejetez ou retirez les établissements
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/admin/accommodations/new"
              className="btn-primary"
            >
              Créer un établissement
            </Link>
            <Link href="/dashboard/admin" className="btn-secondary">
              Retour au dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Filtres et recherche */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, adresse, ville..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="published">Publiés</option>
                <option value="rejected">Rejetés</option>
                <option value="removed">Retirés</option>
                <option value="disabled">Désactivés</option>
              </select>
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Tous les types</option>
                <option value="hotel">Hôtel</option>
                <option value="lodge">Lodge</option>
                <option value="guesthouse">Maison d'hôtes</option>
                <option value="apartment">Appartement</option>
              </select>
            </div>
          </div>
        </div>

        {/* Liste des établissements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accommodations.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              Aucun établissement trouvé
            </div>
          ) : (
            accommodations.map((acc) => {
              const primaryImage = acc.images?.find(img => img.is_primary) || acc.images?.[0];
              return (
                <div key={acc.id} className="card">
                  {primaryImage && (
                    <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={primaryImage.url}
                        alt={acc.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {acc.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getTypeLabel(acc.type)} • {acc.city}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {acc.address}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(acc.price_per_night)} FCFA
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">par nuit</p>
                    </div>
                    {getStatusBadge(acc.status)}
                  </div>
                  {acc.host && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      Hôte: {acc.host.name}
                    </p>
                  )}
                  <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href={`/accommodations/${acc.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 btn-secondary text-center text-sm"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      Voir
                    </Link>
                    {acc.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setShowActionModal({ type: 'approve', accommodationId: acc.id })}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Approuver
                        </button>
                        <button
                          onClick={() => setShowActionModal({ type: 'reject', accommodationId: acc.id })}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          <XCircle className="w-4 h-4 inline mr-1" />
                          Rejeter
                        </button>
                      </>
                    )}
                    {acc.status === 'published' && (
                      <>
                        <button
                          onClick={() => setShowActionModal({ type: 'remove', accommodationId: acc.id })}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4 inline mr-1" />
                          Retirer
                        </button>
                        <button
                          onClick={() => setShowActionModal({ type: 'disable', accommodationId: acc.id })}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                        >
                          <Ban className="w-4 h-4 inline mr-1" />
                          Désactiver
                        </button>
                      </>
                    )}
                    {acc.status === 'disabled' && (
                      <button
                        onClick={() => setShowActionModal({ type: 'enable', accommodationId: acc.id })}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Réactiver
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {pagination && pagination.last_page > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.current_page}
              totalPages={pagination.last_page}
              onPageChange={setCurrentPage}
              totalItems={pagination.total}
              itemsPerPage={pagination.per_page}
            />
          </div>
        )}

        {/* Modal d'action */}
        {showActionModal.type && showActionModal.accommodationId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                {showActionModal.type === 'approve' && 'Approuver l\'établissement'}
                {showActionModal.type === 'reject' && 'Rejeter l\'établissement'}
                {showActionModal.type === 'remove' && 'Retirer l\'établissement'}
                {showActionModal.type === 'disable' && 'Désactiver l\'établissement'}
                {showActionModal.type === 'enable' && 'Réactiver l\'établissement'}
              </h3>
              
              <div className="space-y-4">
                {(showActionModal.type === 'reject' || showActionModal.type === 'remove') && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Motif <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Indiquez le motif..."
                      required
                    />
                  </div>
                )}
                
                {(showActionModal.type === 'approve' || showActionModal.type === 'disable' || showActionModal.type === 'enable') && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                      Motif (optionnel)
                    </label>
                    <textarea
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Motif..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Notes internes (optionnel)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Notes visibles uniquement par les admins..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowActionModal({ type: null, accommodationId: null });
                    setActionReason('');
                    setActionNotes('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleAction(showActionModal.type!, showActionModal.accommodationId!)}
                  disabled={actionLoading === showActionModal.accommodationId || ((showActionModal.type === 'reject' || showActionModal.type === 'remove') && !actionReason.trim())}
                  className={`flex-1 ${
                    showActionModal.type === 'approve' || showActionModal.type === 'enable' ? 'btn-primary' :
                    showActionModal.type === 'reject' || showActionModal.type === 'remove' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-yellow-600 hover:bg-yellow-700'
                  } text-white disabled:opacity-50`}
                >
                  {actionLoading === showActionModal.accommodationId ? 'Traitement...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

