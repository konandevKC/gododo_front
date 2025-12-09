'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import AccommodationCard from '@/components/accommodation/AccommodationCard';
import SearchBar from '@/components/common/SearchBar';
import Pagination from '@/components/common/Pagination';

interface Accommodation {
  id: number;
  name: string;
  slug: string;
  type: string;
  description: string;
  city: string;
  price_per_night: number;
  rating: number;
  total_reviews: number;
  images: Array<{ url: string; is_primary: boolean }>;
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 10,
    current_page: 1,
    last_page: 1,
  });

  useEffect(() => {
    // Attendre que le chargement initial soit terminé
    if (isLoading) {
      return;
    }

    // Rediriger les hôtes vers leur dashboard
    if (isAuthenticated && user?.role === 'host') {
      router.push('/dashboard/host');
      return;
    }
    
    // Charger les hébergements pour les utilisateurs non-hôtes
    if (user?.role !== 'host') {
      fetchAccommodations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, currentPage, isAuthenticated, isLoading, user?.role]);

  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      const params: any = { per_page: 10, page: currentPage };
      if (search) params.search = search;
      
      const response = await api.get('/accommodations', { params });
      
      // Gérer la réponse paginée Laravel
      if (response.data.data && Array.isArray(response.data.data)) {
        setAccommodations(response.data.data);
        setPagination({
          total: response.data.total || 0,
          per_page: response.data.per_page || 10,
          current_page: response.data.current_page || 1,
          last_page: response.data.last_page || 1,
        });
      } else if (Array.isArray(response.data)) {
        setAccommodations(response.data);
        setPagination({
          total: response.data.length,
          per_page: 10,
          current_page: 1,
          last_page: 1,
        });
      }
    } catch (error) {
      console.error('Error fetching accommodations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Afficher un chargement pendant l'initialisation de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Trouvez votre hébergement idéal en Côte d'Ivoire
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Découvrez les meilleurs hôtels, lodges, maisons d'hôtes et appartements
          </p>
          
          <SearchBar 
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un hébergement, une ville..."
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        ) : accommodations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Aucun hébergement trouvé
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {accommodations.map((acc) => (
                <AccommodationCard key={acc.id} accommodation={acc} />
              ))}
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

