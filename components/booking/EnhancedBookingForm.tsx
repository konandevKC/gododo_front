'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { differenceInDays } from 'date-fns';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';

interface EnhancedBookingFormProps {
  accommodationId: number;
  pricePerNight: number;
  roomTypePricing?: Array<{
    type: string;
    price_per_night: number;
    rooms_available?: number | null;
  }>;
}

interface Room {
  id: number;
  name: string;
  type: string;
  capacity: number;
  price_per_night: number;
  description?: string;
}

interface BookingFormData {
  room_id?: number;
  selected_room_type?: string;
  check_in: Date;
  check_out: Date;
  guests: number;
  special_requests?: string;
}

export default function EnhancedBookingForm({ accommodationId, pricePerNight, roomTypePricing = [] }: EnhancedBookingFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null); // null = tarif de base
  const [loadingRooms, setLoadingRooms] = useState(true);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: {
      guests: 1,
    },
  });

  const checkIn = watch('check_in');
  const checkOut = watch('check_out');
  const guests = watch('guests') || 1;

  useEffect(() => {
    fetchRooms();
  }, [accommodationId]);

  const fetchRooms = async () => {
    try {
      const response = await api.get(`/accommodations/${accommodationId}/rooms`);
      setRooms(response.data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  
  // Calculer le prix en fonction de la sélection
  let currentPrice = pricePerNight; // Tarif de base par défaut
  if (selectedRoomType && roomTypePricing.length > 0) {
    const selectedPricing = roomTypePricing.find(p => p.type === selectedRoomType);
    if (selectedPricing) {
      currentPrice = selectedPricing.price_per_night;
    }
  } else if (selectedRoom) {
    currentPrice = selectedRoom.price_per_night;
  }
  
  const totalPrice = nights > 0 ? nights * currentPrice : 0;

  const onSubmit = async (data: BookingFormData) => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=' + encodeURIComponent(pathname));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/bookings', {
        accommodation_id: accommodationId,
        room_id: data.room_id || null,
        selected_room_type: selectedRoomType || null,
        check_in: data.check_in.toISOString().split('T')[0],
        check_out: data.check_out.toISOString().split('T')[0],
        guests: data.guests,
        special_requests: data.special_requests,
      });

      // Rediriger vers la page de paiement
      router.push(`/bookings/${response.data.id}/payment`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Erreur lors de la réservation. Veuillez réessayer.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    // Réessayer la dernière soumission si les données sont valides
    if (checkIn && checkOut) {
      handleSubmit(onSubmit)();
    }
  };

  const handleRoomSelect = (room: Room | null) => {
    setSelectedRoom(room);
    setSelectedRoomType(null); // Réinitialiser la sélection de type si on sélectionne une chambre
    setValue('room_id', room?.id);
    setValue('selected_room_type', undefined);
    if (room && guests > room.capacity) {
      setValue('guests', room.capacity);
    }
  };

  const handleRoomTypeSelect = (roomType: string | null) => {
    setSelectedRoomType(roomType);
    setSelectedRoom(null); // Réinitialiser la sélection de chambre si on sélectionne un type
    setValue('room_id', undefined);
    setValue('selected_room_type', roomType || undefined);
  };

  const availableRooms = rooms.filter(room => !selectedRoom || room.id === selectedRoom.id || guests <= room.capacity);

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Connectez-vous pour réserver
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Vous devez avoir un compte pour effectuer une réservation. Créez un compte gratuitement ou connectez-vous si vous en avez déjà un.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Se connecter
              </Link>
              <Link
                href={`/auth/register?redirect=${encodeURIComponent(pathname)}`}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Sélection par type de chambre (si disponible) */}
      {roomTypePricing && roomTypePricing.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Sélectionner un type de chambre <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {/* Option tarif de base (sélectionné par défaut) */}
            <button
              type="button"
              onClick={() => handleRoomTypeSelect(null)}
              className={`w-full text-left p-3 border rounded-lg transition ${
                selectedRoomType === null && !selectedRoom
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Tarif de base</span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Hébergement complet)</span>
                </div>
                <span className="font-semibold">{formatPrice(pricePerNight)} FCFA/nuit</span>
              </div>
            </button>
            
            {/* Options par type de chambre */}
            {roomTypePricing.map((pricing, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleRoomTypeSelect(pricing.type)}
                className={`w-full text-left p-3 border rounded-lg transition ${
                  selectedRoomType === pricing.type
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{pricing.type}</span>
                    {pricing.rooms_available !== null && pricing.rooms_available !== undefined && (
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        ({pricing.rooms_available} chambre{pricing.rooms_available > 1 ? 's' : ''} disponible{pricing.rooms_available > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  <span className="font-semibold">{formatPrice(pricing.price_per_night)} FCFA/nuit</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sélection par chambre individuelle (si disponible et pas de room_type_pricing) */}
      {(!roomTypePricing || roomTypePricing.length === 0) && (
        <>
          {loadingRooms ? (
            <div className="text-center py-4">Chargement des chambres...</div>
          ) : rooms.length > 0 ? (
            <div>
              <label className="block text-sm font-medium mb-2">Sélectionner une chambre (optionnel)</label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleRoomSelect(null)}
                  className={`w-full text-left p-3 border rounded-lg transition ${
                    !selectedRoom
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Hébergement complet</span>
                    <span>{formatPrice(pricePerNight)} FCFA/nuit</span>
                  </div>
                </button>
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleRoomSelect(room)}
                    disabled={guests > room.capacity}
                    className={`w-full text-left p-3 border rounded-lg transition ${
                      selectedRoom?.id === room.id
                        ? 'border-primary bg-primary/10'
                        : guests > room.capacity
                        ? 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{room.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Capacité: {room.capacity} {room.capacity > 1 ? 'personnes' : 'personne'}
                        </div>
                      </div>
                      <span>{formatPrice(room.price_per_night)} FCFA/nuit</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Date d'arrivée</label>
        <DatePicker
          selected={checkIn}
          onChange={(date: Date) => setValue('check_in', date)}
          minDate={new Date()}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          placeholderText="Sélectionner une date"
        />
        {errors.check_in && (
          <p className="text-red-500 text-sm mt-1">Date d'arrivée requise</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Date de départ</label>
        <DatePicker
          selected={checkOut}
          onChange={(date: Date) => setValue('check_out', date)}
          minDate={checkIn || new Date()}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          placeholderText="Sélectionner une date"
        />
        {errors.check_out && (
          <p className="text-red-500 text-sm mt-1">Date de départ requise</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Nombre de voyageurs</label>
        <input
          type="number"
          {...register('guests', { 
            required: true, 
            min: 1,
            max: selectedRoom ? selectedRoom.capacity : undefined
          })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          min="1"
          max={selectedRoom ? selectedRoom.capacity : undefined}
        />
        {errors.guests && (
          <p className="text-red-500 text-sm mt-1">
            {selectedRoom && guests > selectedRoom.capacity
              ? `Maximum ${selectedRoom.capacity} voyageur(s) pour cette chambre`
              : 'Nombre de voyageurs requis'}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Demandes spéciales (optionnel)</label>
        <textarea
          {...register('special_requests')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          placeholder="Avez-vous des demandes particulières ?"
        />
      </div>

      {nights > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <div className="flex justify-between">
            <span>{formatPrice(currentPrice)} FCFA × {nights} nuit{nights > 1 ? 's' : ''}</span>
            <span>{formatPrice(totalPrice)} FCFA</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total</span>
            <span className="text-primary">{formatPrice(totalPrice)} FCFA</span>
          </div>
        </div>
      )}

      <ErrorDisplay 
        error={error} 
        onDismiss={() => setError(null)}
        onRetry={handleRetry}
        type="error"
      />

      <button
        type="submit"
        disabled={loading || !checkIn || !checkOut}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Réservation en cours...' : 'Réserver maintenant'}
      </button>
    </form>
  );
}

