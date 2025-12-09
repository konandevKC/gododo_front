'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">
              <span className="text-primary">MonBeauPays</span>
              <span className="text-accent">.com</span>
            </h3>
            <p className="text-sm mb-4">
              Votre plateforme de référence pour trouver et réserver le meilleur hébergement en Côte d'Ivoire.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-white font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/accommodations" className="hover:text-primary transition-colors">
                  Hébergements
                </Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-primary transition-colors">
                  Mes réservations
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-primary transition-colors">
                  Connexion
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-primary transition-colors">
                  Inscription
                </Link>
              </li>
            </ul>
          </div>

          {/* Pour les hôtes */}
          <div>
            <h3 className="text-white font-semibold mb-4">Pour les hôtes</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auth/register?role=host" className="hover:text-primary transition-colors">
                  Devenir hôte
                </Link>
              </li>
              <li>
                <Link href="/dashboard/host" className="hover:text-primary transition-colors">
                  Espace hôte
                </Link>
              </li>
              <li>
                <Link href="/dashboard/host/accommodations/new" className="hover:text-primary transition-colors">
                  Ajouter un hébergement
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                <a href="mailto:contact@monbeaupays.com" className="hover:text-primary transition-colors">
                  contact@monbeaupays.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-1 flex-shrink-0" />
                <a href="tel:+2250000000000" className="hover:text-primary transition-colors">
                  +225 00 00 00 00 00
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>Abidjan, Côte d'Ivoire</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-center md:text-left">
              © {currentYear} MonBeauPays.com. Tous droits réservés.
            </p>
            <div className="flex flex-wrap justify-center md:justify-end gap-6 text-sm">
              <Link href="/terms" className="hover:text-primary transition-colors">
                Conditions d'utilisation
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Politique de confidentialité
              </Link>
              <Link href="/about" className="hover:text-primary transition-colors">
                À propos
              </Link>
            </div>
          </div>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p className="flex items-center justify-center gap-1">
              Fait avec <Heart className="w-3 h-3 text-red-500 fill-red-500" /> en Côte d'Ivoire
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

