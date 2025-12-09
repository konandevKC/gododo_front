'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import Header from '@/components/common/Header';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorDisplay from '@/components/common/ErrorDisplay';
import Link from 'next/link';
import { Calendar, MapPin, Users, ChevronLeft, ChevronRight, List, FileText, CheckCircle } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, isSameMonth, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatPrice } from '@/lib/utils';

interface BookingItem {
  id: number;
  check_in: string;
  check_out: string;
  guests: number;
  status: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  total_price: number;
  accommodation: {
    id: number;
    name: string;
    city: string;
    images?: Array<{ url: string }>;
  };
  room?: { id: number; name: string | null };
  user: { id: number; name: string; email: string };
}

export default function HostBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [data, setData] = useState<{ week: BookingItem[]; month: BookingItem[]; two_months: BookingItem[]; history: BookingItem[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [showList, setShowList] = useState(false);
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
      const res = await api.get('/bookings/host/overview');
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const getMonthDaysGrid = () => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
    const days: Date[] = [];
    let current = start;
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    return days;
  };

  const getBookingsForDay = (day: Date) => {
    if (!data) return [];
    const allBookings = [...data.week, ...data.month, ...data.two_months, ...data.history];
    // Filtrer les réservations qui chevauchent ce jour (pas seulement celles qui commencent ce jour)
    return allBookings.filter(b => {
      const checkIn = new Date(b.check_in);
      const checkOut = new Date(b.check_out);
      // Une réservation chevauche un jour si le jour est entre check_in (inclus) et check_out (exclus)
      return day >= checkIn && day < checkOut;
    });
  };

  const nextMonth = () => setViewDate(addMonths(viewDate, 1));
  const prevMonth = () => setViewDate(addMonths(viewDate, -1));

  const Section = ({ title, items }: { title: string; items: BookingItem[] }) => (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">{items.length} réservation{items.length > 1 ? 's' : ''}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">Aucune réservation</p>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div key={b.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
              <Link href={`/dashboard/host/bookings/${b.id}`} className="block">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{b.accommodation.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(b.check_in), 'dd MMM yyyy', { locale: fr })} → {format(new Date(b.check_out), 'dd MMM yyyy', { locale: fr })}
                      <span className="ml-2 flex items-center"><Users className="w-4 h-4 mr-1" />{b.guests}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {b.accommodation.city}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className="text-primary font-bold">{formatPrice(b.total_price)} FCFA</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">{b.status}</p>
                        {b.payment_status && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                            b.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : b.payment_status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {b.payment_status === 'paid' && <CheckCircle className="w-3 h-3" />}
                            {b.payment_status === 'paid' ? 'Payé' :
                             b.payment_status === 'failed' ? 'Échec' :
                             'En attente'}
                          </span>
                        )}
                      </div>
                    </div>
                    {b.payment_status === 'paid' && (
                      <Link
                        href={`/dashboard/host/bookings/${b.id}#receipt`}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Voir le reçu de paiement"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FileText className="w-5 h-5" />
                      </Link>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
          <h1 className="text-3xl font-bold">Mes réservations (hôte)</h1>
          <p className="text-gray-600 dark:text-gray-400">Vue calendrier et liste par période</p>
        </div>

        {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}

        {data && (
          <>
            {/* Header calendrier */}
            <div className="card mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={prevMonth} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Mois précédent">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-semibold">
                    {format(viewDate, 'MMMM yyyy', { locale: fr })}
                  </h2>
                  <button onClick={nextMonth} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Mois suivant">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <button onClick={() => setShowList(!showList)} className="btn-secondary text-sm inline-flex items-center gap-2">
                  <List className="w-4 h-4" />
                  {showList ? 'Voir calendrier' : 'Voir liste'}
                </button>
              </div>
            </div>

            {!showList ? (
              <div className="card">
                {/* En-têtes jours */}
                <div className="grid grid-cols-7 gap-2 text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => <div key={d}>{d}</div>)}
                </div>
                {/* Grille jours */}
                <div className="grid grid-cols-7 gap-2">
                  {getMonthDaysGrid().map((day, idx) => {
                    const dayBookings = getBookingsForDay(day);
                    const isCurrentMonth = isSameMonth(day, viewDate);
                    return (
                      <div key={idx} className={`p-2 rounded border border-gray-200 dark:border-gray-700 min-h-[90px] ${isCurrentMonth ? '' : 'opacity-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{format(day, 'd', { locale: fr })}</span>
                          {dayBookings.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {dayBookings.length}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {dayBookings.slice(0, 3).map(b => (
                            <Link key={b.id} href={`/dashboard/host/bookings/${b.id}`} className="block text-[11px] truncate px-2 py-1 rounded bg-gray-100 dark:bg-gray-900">
                              {b.accommodation.name}
                            </Link>
                          ))}
                          {dayBookings.length > 3 && (
                            <span className="text-[10px] text-gray-500">+{dayBookings.length - 3} autres…</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6 mt-6">
                <Section title="Cette semaine" items={data.week} />
                <Section title="Ce mois-ci" items={data.month} />
                <Section title="Deux prochains mois" items={data.two_months} />
                <Section title="Historique" items={data.history} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}


