import { create } from 'zustand';
import { User, authService } from '@/lib/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { user, token } = await authService.login({ email, password });
    // Recharger l'utilisateur depuis l'API pour avoir les rôles RBAC à jour
    try {
      const freshUser = await authService.getCurrentUser();
      if (freshUser) {
        set({ user: freshUser, token, isAuthenticated: true });
      } else {
        set({ user, token, isAuthenticated: true });
      }
    } catch {
      // En cas d'erreur, utiliser les données de login
      set({ user, token, isAuthenticated: true });
    }
  },

  register: async (data: any) => {
    const { user, token } = await authService.register(data);
    // Recharger l'utilisateur depuis l'API pour avoir les rôles RBAC à jour
    try {
      const freshUser = await authService.getCurrentUser();
      if (freshUser) {
        set({ user: freshUser, token, isAuthenticated: true });
      } else {
        set({ user, token, isAuthenticated: true });
      }
    } catch {
      // En cas d'erreur, utiliser les données d'inscription
      set({ user, token, isAuthenticated: true });
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const storedUser = authService.getStoredUser();
    const token = authService.getToken();

    if (storedUser && token) {
      try {
        // Timeout de sécurité pour éviter que l'app reste bloquée
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        
        const user = await Promise.race([
          authService.getCurrentUser(),
          timeoutPromise
        ]) as User | null;
        
        set({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        // En cas d'erreur, utiliser les données stockées localement
        set({ user: storedUser, token, isAuthenticated: !!storedUser, isLoading: false });
      }
    } else {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

