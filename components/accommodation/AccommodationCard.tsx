'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface AccommodationCardProps {
  accommodation: {
    id: number;
    name: string;
    slug: string;
    type: string;
    city: string;
    price_per_night: number;
    rating?: number | null;
    total_reviews?: number | null;
    images: Array<{ url: string; is_primary: boolean }>;
  };
}

export default function AccommodationCard({ accommodation }: AccommodationCardProps) {
  const primaryImage = accommodation.images?.find(img => img.is_primary)?.url || 
                       accommodation.images?.[0]?.url || 
                       'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

  const typeLabels: Record<string, string> = {
    hotel: 'Hôtel',
    lodge: 'Lodge',
    guesthouse: 'Maison d\'hôtes',
    apartment: 'Appartement',
  };

  return (
    <Link href={`/accommodations/${accommodation.id}`}>
      <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <div className="relative h-48 mb-4 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={primaryImage}
            alt={accommodation.name}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="space-y-2 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg line-clamp-2 flex-1">{accommodation.name}</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex-shrink-0">
              {typeLabels[accommodation.type] || accommodation.type}
            </span>
          </div>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{accommodation.city}</span>
          </div>

          {accommodation.rating && typeof accommodation.rating === 'number' && accommodation.rating > 0 && (
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-accent text-accent flex-shrink-0" />
              <span className="font-semibold">{Number(accommodation.rating).toFixed(1)}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ({accommodation.total_reviews || 0} avis)
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl xl:text-2xl font-bold text-primary truncate">
                {formatPrice(accommodation.price_per_night)} FCFA
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400 flex-shrink-0">/nuit</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

