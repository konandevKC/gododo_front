'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';

export function Providers({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading } = useAuthStore();
  const { theme: currentTheme } = useThemeStore();

  useEffect(() => {
    // Appeler checkAuth une seule fois au montage
    checkAuth().catch(() => {
      // En cas d'erreur, on continue quand même pour ne pas bloquer l'app
      console.error('Erreur lors de la vérification de l\'authentification');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [currentTheme]);

  return <>{children}</>;
}

