'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function AccommodationsPage() {
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
  const [filters, setFilters] = useState({
    city: '',
    type: '',
    min_price: '',
    max_price: '',
  });

  useEffect(() => {
    // Rediriger les hôtes vers leur dashboard
    if (!isLoading && isAuthenticated && user?.role === 'host') {
      router.push('/dashboard/host');
      return;
    }
    
    if (user?.role !== 'host') {
      fetchAccommodations();
    }
  }, [search, filters, currentPage, isAuthenticated, isLoading, user, router]);

  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      const params: any = { per_page: 10, page: currentPage };
      if (search) params.search = search;
      if (filters.city) params.city = filters.city;
      if (filters.type) params.type = filters.type;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;
      
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

  // Réinitialiser à la page 1 quand les filtres changent
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [search, filters.city, filters.type, filters.min_price, filters.max_price]);

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-6">Hébergements</h1>

        <div className="mb-6 max-w-2xl">
          <SearchBar 
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un hébergement, une ville..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Ville</label>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="Abidjan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">Tous</option>
              <option value="hotel">Hôtel</option>
              <option value="lodge">Lodge</option>
              <option value="guesthouse">Maison d'hôtes</option>
              <option value="apartment">Appartement</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Prix min (FCFA)</label>
            <input
              type="number"
              value={filters.min_price}
              onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Prix max (FCFA)</label>
            <input
              type="number"
              value={filters.max_price}
              onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              placeholder="100000"
            />
          </div>
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

