'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import EnhancedBookingForm from '@/components/booking/EnhancedBookingForm';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatPrice } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { isAdmin } from '@/lib/userUtils';
import { MapPin, Star, Users, Bed, Bath, Clock, CheckCircle, XCircle, EyeOff, Wrench, Edit, Trash2, Calendar, ExternalLink } from 'lucide-react';
import MediaCarousel from '@/components/media/MediaCarousel';
import Link from 'next/link';

interface RoomTypePricing {
  type: string;
  price_per_night: number;
  rooms_available?: number | null;
}

interface Accommodation {
  id: number;
  name: string;
  host_id: number;
  type: string;
  description: string;
  description_en?: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  price_per_night: number;
  room_type_pricing?: RoomTypePricing[];
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  status?: 'pending' | 'published' | 'rejected' | 'unavailable' | 'renovation';
  rating?: number | null;
  total_reviews?: number | null;
  images: Array<{ url: string; is_primary: boolean }>;
  reviews: Array<{
    id: number;
    rating: number;
    comment: string;
    category_ratings?: {
      cleanliness?: number;
      equipment?: number;
      staff?: number;
      value_for_money?: number;
      location?: number;
      comfort?: number;
      wifi?: number;
      bed?: number;
      breakfast?: number;
    };
    user: { name: string };
    created_at: string;
  }>;
}

export default function AccommodationDetailPage() {
  const params = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const [accommodation, setAccommodation] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<'pending' | 'published' | 'rejected' | 'unavailable' | 'renovation' | ''>('');
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  useEffect(() => {
    fetchAccommodation();
  }, [params.id]);

  const fetchAccommodation = async () => {
    try {
      setError(null);
      const response = await api.get(`/accommodations/${params.id}`);
      setAccommodation(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          'Erreur lors du chargement de l\'hébergement';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async () => {
    if (!accommodation || !newStatus) return;
    try {
      setUpdating(true);
      await api.put(`/accommodations/${accommodation.id}`, { status: newStatus });
      await fetchAccommodation();
      setNewStatus('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du statut');
    } finally {
      setUpdating(false);
    }
  };

  const deleteAccommodation = async () => {
    if (!accommodation) return;
    if (!confirm('Supprimer définitivement cet hébergement ?')) return;
    try {
      setUpdating(true);
      await api.delete(`/accommodations/${accommodation.id}`);
      window.location.href = '/dashboard/host';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setUpdating(false);
    }
  };

  const submitAppointment = async () => {
    if (!accommodation || !appointmentDate) return;
    try {
      setUpdating(true);
      await api.post(`/accommodations/${accommodation.id}/appointments`, {
        requested_at: appointmentDate,
        notes: appointmentNotes,
      });
      setAppointmentOpen(false);
      setAppointmentDate('');
      setAppointmentNotes('');
      alert('Demande de visite envoyée.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la demande de visite');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner message="Chargement de l'hébergement..." size="lg" />
        </div>
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <ErrorDisplay 
            error={error || 'Hébergement non trouvé'} 
            onRetry={fetchAccommodation}
            type="error"
          />
          <div className="text-center mt-8">
            <a href="/accommodations" className="btn-primary">
              Voir tous les hébergements
            </a>
          </div>
        </div>
      </div>
    );
  }

  const primaryImage = accommodation.images?.find(img => img.is_primary)?.url || 
                     accommodation.images?.[0]?.url || 
                     'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';
  const hasCoordinates =
    typeof accommodation.latitude === 'number' &&
    !Number.isNaN(accommodation.latitude) &&
    typeof accommodation.longitude === 'number' &&
    !Number.isNaN(accommodation.longitude);
  const mapEmbedUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${accommodation.latitude},${accommodation.longitude}&z=15&output=embed`
    : null;
  const mapLink = hasCoordinates
    ? `https://www.google.com/maps?q=${accommodation.latitude},${accommodation.longitude}`
    : '';

  const statusLabels = {
    pending: { label: 'En attente', color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400', icon: Clock },
    published: { label: 'Publié', color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400', icon: CheckCircle },
    rejected: { label: 'Rejeté', color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400', icon: XCircle },
    unavailable: { label: 'Indisponible', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: EyeOff },
    renovation: { label: 'En rénovation', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400', icon: Wrench },
    disabled: { label: 'Désactivé', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300', icon: EyeOff },
    removed: { label: 'Retiré', color: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400', icon: XCircle },
  };

  const isHost = isAuthenticated && user?.role === 'host' && user?.id === accommodation.host_id;
  const userIsAdmin = isAuthenticated && isAdmin(user);
  const currentStatus = accommodation.status || 'pending';
  const StatusIcon = statusLabels[currentStatus]?.icon || Clock;

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">{accommodation.name}</h1>
                {isHost && accommodation.status && (
                  <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 ${statusLabels[currentStatus as keyof typeof statusLabels]?.color || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusLabels[currentStatus as keyof typeof statusLabels]?.label || currentStatus}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {accommodation.city}, {accommodation.address}
                </div>
                {accommodation.rating && typeof accommodation.rating === 'number' && accommodation.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-accent text-accent mr-1" />
                    <span className="font-semibold">{Number(accommodation.rating).toFixed(1)}</span>
                    <span className="ml-1">({accommodation.total_reviews || 0} avis)</span>
                  </div>
                )}
              </div>
            </div>

            <MediaCarousel items={(accommodation.images || []).map(i => ({ url: i.url }))} />

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Description</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {accommodation.description}
              </p>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Équipements</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {accommodation.amenities?.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span className="text-primary">✓</span>
                    <span className="capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h2 className="text-2xl font-bold mb-4">Détails</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span>{accommodation.max_guests} voyageurs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bed className="w-5 h-5 text-primary" />
                  <span>{accommodation.bedrooms} chambres</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bath className="w-5 h-5 text-primary" />
                  <span>{accommodation.bathrooms} salles de bain</span>
                </div>
              </div>
            </div>

            {hasCoordinates && mapEmbedUrl && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Localisation</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Coordonnées approximatives</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                      <MapPin className="w-5 h-5 text-primary mr-2" />
                      <span>{accommodation.address}, {accommodation.city}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Latitude :{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {accommodation.latitude.toFixed(5)}
                      </span>
                      <br />
                      Longitude :{' '}
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {accommodation.longitude.toFixed(5)}
                      </span>
                    </p>
                    <a
                      href={mapLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-primary font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir dans Google Maps
                    </a>
                  </div>
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <iframe
                      title="Carte de localisation"
                      src={mapEmbedUrl}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                  Les coordonnées affichées sont approximatives et servent uniquement à guider les voyageurs.
                </p>
              </div>
            )}

            {accommodation.reviews && accommodation.reviews.length > 0 && (
              <div className="card">
                <h2 className="text-2xl font-bold mb-4">Avis ({accommodation.total_reviews})</h2>
                <div className="space-y-6">
                  {accommodation.reviews.map((review) => {
                    const categoryLabels: { [key: string]: string } = {
                      cleanliness: 'Propreté',
                      equipment: 'Equipements',
                      staff: 'Personnel',
                      value_for_money: 'Rapport qualité/prix',
                      location: 'Situation géographique',
                      comfort: 'Confort',
                      wifi: 'Wi-Fi',
                      bed: 'Evaluation du lit',
                      breakfast: 'Petit déjeuner',
                    };

                    return (
                      <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">{review.user.name}</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              {review.rating}/5
                            </span>
                          </div>
                        </div>

                        {review.category_ratings && Object.keys(review.category_ratings).length > 0 && (
                          <div className="mb-3 space-y-2">
                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              Détails de l'évaluation :
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {Object.entries(review.category_ratings).map(([key, value]) => (
                                <div key={key} className="flex items-center justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {categoryLabels[key] || key}:
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < (value as number)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300 dark:text-gray-600'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-1 text-xs text-gray-500">
                                      {value}/5
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <p className="text-gray-700 dark:text-gray-300 mb-2">{review.comment}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              {isHost ? (
                <div className="space-y-4">
                  {/* Statut actuel */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Statut actuel</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusLabels[currentStatus as keyof typeof statusLabels]?.color || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusLabels[currentStatus as keyof typeof statusLabels]?.label || currentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                      {currentStatus === 'pending' && 'Votre hébergement est en attente de validation par l\'administrateur.'}
                      {currentStatus === 'published' && 'Votre hébergement est publié et visible par tous les utilisateurs.'}
                      {currentStatus === 'rejected' && 'Votre hébergement a été rejeté. Contactez l\'administrateur pour plus d\'informations.'}
                      {currentStatus === 'unavailable' && 'Votre hébergement est marqué comme indisponible.'}
                      {currentStatus === 'renovation' && 'Votre hébergement est en cours de rénovation.'}
                    </p>
                  </div>

                  {/* Actions rapides */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Actions rapides</h3>
                    <Link
                      href={`/dashboard/host/accommodations/${accommodation.id}/edit`}
                      className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Modifier le bien
                    </Link>
                    <button
                      onClick={() => setAppointmentOpen(true)}
                      className="w-full btn-secondary flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Demander une visite de validation
                    </button>
                  </div>

                  {/* Changer le statut */}
                  <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <label className="block text-sm font-medium">Changer le statut</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="">Sélectionner un nouveau statut...</option>
                      <option value="unavailable">Indisponible</option>
                      <option value="renovation">En rénovation</option>
                      <option value="pending">En attente</option>
                    </select>
                    <button
                      onClick={changeStatus}
                      disabled={!newStatus || updating || newStatus === currentStatus}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      {updating ? 'Application...' : 'Appliquer le statut'}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Note: Seuls les administrateurs peuvent publier ou rejeter un hébergement.
                    </p>
                  </div>

                  {/* Action de suppression */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button
                      onClick={deleteAccommodation}
                      disabled={updating}
                      className="w-full btn-outline text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {updating ? 'Suppression...' : 'Supprimer le bien'}
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Cette action est irréversible. Toutes les données associées seront supprimées.
                    </p>
                  </div>
                </div>
              ) : userIsAdmin ? (
                <div className="card">
                  <div className="text-center py-8">
                    <div className="mb-4">
                      <Calendar className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Réservation non disponible
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Les administrateurs ne peuvent pas effectuer de réservations depuis cette interface.
                    </p>
                    <Link
                      href="/dashboard/admin/accommodations"
                      className="btn-secondary inline-block"
                    >
                      Retour à la gestion des établissements
                    </Link>
                  </div>
                </div>
              ) : (
                <EnhancedBookingForm 
                  accommodationId={accommodation.id} 
                  pricePerNight={accommodation.price_per_night}
                  roomTypePricing={accommodation.room_type_pricing}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal RDV */}
      {appointmentOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Demander une visite de validation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Choisissez une date pour la visite physique avec l'équipe d'administration.
            </p>
            <div className="space-y-3">
              <input
                type="datetime-local"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              />
              <textarea
                value={appointmentNotes}
                onChange={(e) => setAppointmentNotes(e.target.value)}
                placeholder="Notes (optionnel)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setAppointmentOpen(false)}
                className="btn-secondary"
              >
                Annuler
              </button>
              <button
                onClick={submitAppointment}
                className="btn-primary"
                disabled={!appointmentDate || updating}
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

