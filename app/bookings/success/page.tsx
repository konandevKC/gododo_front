'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/common/Header';
import { CheckCircle, Calendar, MapPin, Users, Sparkles, Home, List } from 'lucide-react';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('id');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!bookingId) {
      router.push('/bookings');
      return;
    }

    // Countdown pour redirection automatique
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/bookings');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingId, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center">
          {/* Animation de succès */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-scale-in">
              <CheckCircle className="w-20 h-20 text-green-600 dark:text-green-400" />
            </div>
            <div className="absolute top-0 right-0">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            <div className="absolute bottom-0 left-0">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse delay-300" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-green-600 dark:text-green-400">
            🎉 Réservation confirmée !
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Félicitations ! Votre réservation a été enregistrée avec succès.
          </p>

          {/* Carte de confirmation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border border-green-200 dark:border-green-800">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">Réservation #{bookingId}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Vous recevrez un email de confirmation sous peu avec tous les détails de votre réservation.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/bookings"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <List className="w-5 h-5" />
              Voir mes réservations
            </Link>
            
            <Link
              href="/"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Retour à l'accueil
            </Link>
          </div>

          {/* Message de redirection */}
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Redirection automatique vers vos réservations dans {countdown} seconde{countdown > 1 ? 's' : ''}...
          </p>

          {/* Fun message */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ✨ <em>Bon voyage ! Nous avons hâte de vous accueillir en Côte d'Ivoire.</em>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

