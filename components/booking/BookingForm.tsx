'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { differenceInDays } from 'date-fns';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';

interface BookingFormProps {
  accommodationId: number;
  pricePerNight: number;
}

interface BookingFormData {
  check_in: Date;
  check_out: Date;
  guests: number;
  special_requests?: string;
}

export default function BookingForm({ accommodationId, pricePerNight }: BookingFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: {
      guests: 1,
    },
  });

  const checkIn = watch('check_in');
  const checkOut = watch('check_out');
  const guests = watch('guests') || 1;

  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = nights > 0 ? nights * pricePerNight : 0;

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
        check_in: data.check_in.toISOString().split('T')[0],
        check_out: data.check_out.toISOString().split('T')[0],
        guests: data.guests,
        special_requests: data.special_requests,
      });

      router.push(`/bookings/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  // Afficher un message si l'utilisateur n'est pas connecté
  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6 text-center">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="w-full px-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 break-words">
                Connectez-vous pour réserver
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 break-words leading-relaxed">
                Vous devez avoir un compte pour effectuer une réservation. Créez un compte gratuitement ou connectez-vous si vous en avez déjà un.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
              >
                <LogIn className="w-4 h-4" />
                <span className="whitespace-nowrap">Se connecter</span>
              </Link>
              <Link
                href={`/auth/register?redirect=${encodeURIComponent(pathname)}`}
                className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-2.5"
              >
                <UserPlus className="w-4 h-4" />
                <span className="whitespace-nowrap">Créer un compte</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Date d'arrivée</label>
        <DatePicker
          selected={checkIn}
          onChange={(date: Date) => setValue('check_in', date)}
          minDate={new Date()}
          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          placeholderText="Sélectionner une date"
        />
        {errors.check_in && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">Date d'arrivée requise</p>
        )}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Date de départ</label>
        <DatePicker
          selected={checkOut}
          onChange={(date: Date) => setValue('check_out', date)}
          minDate={checkIn || new Date()}
          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          placeholderText="Sélectionner une date"
        />
        {errors.check_out && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">Date de départ requise</p>
        )}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Nombre de voyageurs</label>
        <input
          type="number"
          {...register('guests', { required: true, min: 1 })}
          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
          min="1"
        />
        {errors.guests && (
          <p className="text-red-500 text-xs sm:text-sm mt-1">Nombre de voyageurs requis</p>
        )}
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Demandes spéciales (optionnel)</label>
        <textarea
          {...register('special_requests')}
          rows={3}
          className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 resize-none"
          placeholder="Avez-vous des demandes particulières ?"
        />
      </div>

      {nights > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 space-y-1.5 sm:space-y-2">
          <div className="flex justify-between text-xs sm:text-sm break-words">
            <span className="pr-2">{formatPrice(pricePerNight)} FCFA × {nights} nuit{nights > 1 ? 's' : ''}</span>
            <span className="whitespace-nowrap">{formatPrice(totalPrice)} FCFA</span>
          </div>
          <div className="flex justify-between font-bold text-sm sm:text-lg pt-2 border-t border-gray-200 dark:border-gray-700 break-words">
            <span>Total</span>
            <span className="text-primary whitespace-nowrap">{formatPrice(totalPrice)} FCFA</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm break-words">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !checkIn || !checkOut}
        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2 sm:py-2.5"
      >
        {loading ? 'Réservation en cours...' : 'Réserver maintenant'}
      </button>
    </form>
  );
}

