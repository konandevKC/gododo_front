'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { isController, isAdmin } from '@/lib/userUtils';

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Vérifier si on est sur une page admin
  const isAdminPage = pathname?.startsWith('/dashboard/admin');
  // Les contrôleurs ne voient aucun menu (vérification via RBAC)
  const isControllerUser = isAuthenticated && isController(user);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  // Les contrôleurs n'ont AUCUN menu, juste le header minimal
  if (isControllerUser) {
    return (
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/dashboard/admin/inspections"
              className="flex items-center space-x-2"
            >
              <span className="text-2xl font-bold text-primary">MonBeauPays</span>
              <span className="text-accent">.com</span>
            </Link>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {isAuthenticated && (
                <div className="flex items-center space-x-4">
                  <span className="text-sm">{user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-sm"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>
    );
  }

  // Fonction pour obtenir le menu selon le rôle
  const getMenuForRole = () => {
    // Les contrôleurs n'ont pas de menu
    if (isControllerUser) {
      return null;
    }
    
    // Menu Admin/Super Admin
    if (isAdmin(user)) {
      return (
        <>
          <Link 
            href="/dashboard/admin" 
            className={`hover:text-primary transition-colors ${pathname === '/dashboard/admin' ? 'text-primary font-semibold' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            href="/dashboard/admin/users" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/dashboard/admin/users') ? 'text-primary font-semibold' : ''}`}
          >
            Utilisateurs
          </Link>
          <Link 
            href="/dashboard/admin/hosts" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/dashboard/admin/hosts') ? 'text-primary font-semibold' : ''}`}
          >
            Hôtes
          </Link>
          <Link 
            href="/dashboard/admin/accommodations" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/dashboard/admin/accommodations') ? 'text-primary font-semibold' : ''}`}
          >
            Établissements
          </Link>
          <Link 
            href="/dashboard/admin/inspections" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/dashboard/admin/inspections') ? 'text-primary font-semibold' : ''}`}
          >
            Inspections
          </Link>
          <Link 
            href="/dashboard/admin/analytics" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/dashboard/admin/analytics') ? 'text-primary font-semibold' : ''}`}
          >
            Analytics
          </Link>
          <Link 
            href="/dashboard/admin/revenue" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/dashboard/admin/revenue') ? 'text-primary font-semibold' : ''}`}
          >
            Revenus
          </Link>
        </>
      );
    }

    // Menu Host
    if (user?.role === 'host') {
      return (
        <>
          <Link 
            href="/dashboard/host" 
            className={`hover:text-primary transition-colors ${pathname === '/dashboard/host' ? 'text-primary font-semibold' : ''}`}
          >
            Tableau de bord
          </Link>
          <Link 
            href="/dashboard/host/bookings/requests" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/dashboard/host/bookings/requests') ? 'text-primary font-semibold' : ''}`}
          >
            Demandes de réservation
          </Link>
          <Link 
            href="/dashboard/host/bookings" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/dashboard/host/bookings') && !pathname?.startsWith('/dashboard/host/bookings/requests') ? 'text-primary font-semibold' : ''}`}
          >
            Calendrier
          </Link>
          <Link 
            href="/dashboard/host/profile" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/dashboard/host/profile') ? 'text-primary font-semibold' : ''}`}
          >
            Profil
          </Link>
        </>
      );
    }

    // Menu User (utilisateur normal)
    if (isAuthenticated && user && user.role === 'user') {
      return (
        <>
          <Link 
            href="/" 
            className={`hover:text-primary transition-colors ${pathname === '/' ? 'text-primary font-semibold' : ''}`}
          >
            Accueil
          </Link>
          <Link 
            href="/accommodations" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/accommodations') ? 'text-primary font-semibold' : ''}`}
          >
            Hébergements
          </Link>
          <Link 
            href="/bookings" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/bookings') ? 'text-primary font-semibold' : ''}`}
          >
            Réservations
          </Link>
          <Link 
            href="/dashboard" 
            className={`hover:text-primary transition-colors ${pathname?.startsWith('/dashboard') && !pathname?.startsWith('/dashboard/admin') && !pathname?.startsWith('/dashboard/host') ? 'text-primary font-semibold' : ''}`}
          >
            Tableau de bord
          </Link>
        </>
      );
    }

    // Menu public (non connecté)
    return (
      <>
        <Link 
          href="/" 
          className={`hover:text-primary transition-colors ${pathname === '/' ? 'text-primary font-semibold' : ''}`}
        >
          Accueil
        </Link>
        <Link 
          href="/accommodations" 
          className={`hover:text-primary transition-colors ${pathname?.startsWith('/accommodations') ? 'text-primary font-semibold' : ''}`}
        >
          Hébergements
        </Link>
      </>
    );
  };

  // Fonction pour obtenir le menu mobile selon le rôle
  const getMobileMenuForRole = () => {
    // Les contrôleurs n'ont pas de menu
    if (isControllerUser) {
      return null;
    }
    
    // Menu Admin/Super Admin
    if (isAdmin(user)) {
      return (
        <>
          <Link href="/dashboard/admin" className="block py-2">Dashboard</Link>
          <Link href="/dashboard/admin/users" className="block py-2 pl-4 text-sm">Utilisateurs</Link>
          <Link href="/dashboard/admin/hosts" className="block py-2 pl-4 text-sm">Hôtes</Link>
          <Link href="/dashboard/admin/accommodations" className="block py-2 pl-4 text-sm">Établissements</Link>
          <Link href="/dashboard/admin/inspections" className="block py-2 pl-4 text-sm">Inspections</Link>
          <Link href="/dashboard/admin/analytics" className="block py-2 pl-4 text-sm">Analytics</Link>
          <Link href="/dashboard/admin/revenue" className="block py-2 pl-4 text-sm">Revenus</Link>
        </>
      );
    }

    // Menu Host
    if (user?.role === 'host') {
      return (
        <>
          <Link href="/dashboard/host" className="block py-2">Tableau de bord</Link>
          <Link href="/dashboard/host/bookings/requests" className="block py-2">Demandes de réservation</Link>
          <Link href="/dashboard/host/bookings" className="block py-2">Calendrier</Link>
          <Link href="/dashboard/host/profile" className="block py-2">Profil</Link>
        </>
      );
    }

    // Menu User (utilisateur normal)
    if (isAuthenticated && user && user.role === 'user') {
      return (
        <>
          <Link href="/" className="block py-2">Accueil</Link>
          <Link href="/accommodations" className="block py-2">Hébergements</Link>
          <Link href="/bookings" className="block py-2">Réservations</Link>
          <Link href="/dashboard" className="block py-2">Tableau de bord</Link>
        </>
      );
    }

    // Menu public (non connecté)
    return (
      <>
        <Link href="/" className="block py-2">Accueil</Link>
        <Link href="/accommodations" className="block py-2">Hébergements</Link>
      </>
    );
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link 
            href={
              isAdminPage ? '/dashboard/admin' : 
              (user?.role === 'host' ? '/dashboard/host' : '/')
            } 
            className="flex items-center space-x-2"
          >
            <span className="text-2xl font-bold text-primary">MonBeauPays</span>
            <span className="text-accent">.com</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            {/* Menu selon le rôle (sauf pour les contrôleurs) */}
            {!isControllerUser && getMenuForRole()}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" className="btn-secondary text-sm">
                  Connexion
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm">
                  Inscription
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

            {mobileMenuOpen && !isControllerUser && (
          <div className="md:hidden mt-4 space-y-2">
            {/* Menu mobile selon le rôle */}
            {getMobileMenuForRole()}
            <button onClick={toggleTheme} className="block py-2 w-full text-left">
              {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="block py-2 w-full text-left">
                Déconnexion
              </button>
            ) : (
              <>
                <Link href="/auth/login" className="block py-2">Connexion</Link>
                <Link href="/auth/register" className="block py-2">Inscription</Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

