'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { isController, isAdmin } from '@/lib/userUtils';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      await login(data.email, data.password);
      
      // Récupérer l'utilisateur connecté avec les rôles RBAC (déjà chargés par le store)
      const currentUser = useAuthStore.getState().user;
      
      // Les contrôleurs sont toujours redirigés vers la page des inspections (vérification via RBAC)
      if (isController(currentUser)) {
        router.push('/dashboard/admin/inspections');
        return;
      }
      
      // Vérifier s'il y a un paramètre redirect (sauf pour les contrôleurs)
      const redirectPath = searchParams.get('redirect');
      
      if (redirectPath) {
        // Rediriger vers la page demandée
        router.push(decodeURIComponent(redirectPath));
      } else {
        // Rediriger selon le rôle
        if (currentUser?.role === 'host') {
          router.push('/dashboard/host');
        } else if (isAdmin(currentUser)) {
          router.push('/dashboard/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-6 sm:py-12">
        <div className="max-w-md mx-auto card">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center break-words">Connexion</h1>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-2.5 sm:p-3 rounded-lg mb-4 text-xs sm:text-sm break-words">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Email</label>
              <input
                type="email"
                {...register('email', { required: 'Email requis' })}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Mot de passe requis' })}
                  className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 pr-10 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs sm:text-sm mt-1 break-words">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 text-sm sm:text-base py-2 sm:py-2.5"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
              Pas encore de compte ?{' '}
              <Link href="/auth/register" className="text-primary hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

