'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MediaItem {
  url: string;
}

interface MediaCarouselProps {
  items: MediaItem[];
}

export default function MediaCarousel({ items }: MediaCarouselProps) {
  const [current, setCurrent] = useState(0);
  const total = items.length;

  const isVideo = (url: string) => /\.(mp4|mov|avi)$/i.test(url);

  const go = (dir: number) => {
    setCurrent((prev) => (prev + dir + total) % total);
  };

  if (total === 0) return null;

  return (
    <div className="relative">
      <div className="relative h-96 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
        {isVideo(items[current].url) ? (
          <video src={items[current].url} className="w-full h-full object-cover" controls />
        ) : (
          <Image src={items[current].url} alt={`media-${current}`} fill className="object-cover" />
        )}
      </div>

      {total > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 rounded-full px-3 py-1 text-sm"
            aria-label="Précédent"
          >
            ‹
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 rounded-full px-3 py-1 text-sm"
            aria-label="Suivant"
          >
            ›
          </button>

          <div className="mt-3 grid grid-cols-6 md:grid-cols-8 gap-2">
            {items.map((m, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`relative h-16 rounded-md overflow-hidden ring-2 ${i === current ? 'ring-primary' : 'ring-transparent'}`}
                aria-label={`Media ${i + 1}`}
              >
                {isVideo(m.url) ? (
                  <div className="w-full h-full bg-black/10 flex items-center justify-center text-xs">Vidéo</div>
                ) : (
                  <Image src={m.url} alt={`thumb-${i}`} fill className="object-cover" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}


