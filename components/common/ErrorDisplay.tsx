'use client';

import { useState } from 'react';
import { AlertCircle, X, RefreshCw, Smile } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info';
}

const errorMessages: Record<string, { title: string; emoji: string; message: string }> = {
  'Accommodation not available': {
    title: 'Hébergement indisponible',
    emoji: '🏨',
    message: 'Cet hébergement n\'est malheureusement plus disponible. Explorez d\'autres options !'
  },
  'Room not available for selected dates': {
    title: 'Chambre occupée',
    emoji: '🚫',
    message: 'Cette chambre est déjà réservée pour ces dates. Essayez d\'autres dates ou une autre chambre !'
  },
  'Exceeds room capacity': {
    title: 'Trop de voyageurs',
    emoji: '👥',
    message: 'Le nombre de voyageurs dépasse la capacité de cette chambre. Réduisez le nombre ou choisissez une autre chambre.'
  },
  'Exceeds maximum guests': {
    title: 'Capacité maximale atteinte',
    emoji: '👥',
    message: 'Le nombre de voyageurs dépasse la capacité de l\'hébergement.'
  },
  'Forbidden': {
    title: 'Accès refusé',
    emoji: '🔒',
    message: 'Vous n\'avez pas les permissions nécessaires pour cette action.'
  },
  'Network Error': {
    title: 'Problème de connexion',
    emoji: '📡',
    message: 'Vérifiez votre connexion internet et réessayez.'
  }
};

export default function ErrorDisplay({ error, onDismiss, onRetry, type = 'error' }: ErrorDisplayProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!error || !isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Trouver un message personnalisé ou utiliser le message par défaut
  const customMessage = Object.entries(errorMessages).find(([key]) => 
    error.toLowerCase().includes(key.toLowerCase())
  )?.[1];

  const bgColors = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  const textColors = {
    error: 'text-red-800 dark:text-red-300',
    warning: 'text-yellow-800 dark:text-yellow-300',
    info: 'text-blue-800 dark:text-blue-300',
  };

  return (
    <div className={`${bgColors[type]} ${textColors[type]} border rounded-lg p-4 mb-4 animate-in slide-in-from-top-5 duration-300`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {customMessage ? (
            <span className="text-2xl">{customMessage.emoji}</span>
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5" />
          )}
        </div>
        
        <div className="flex-1">
          {customMessage ? (
            <>
              <h3 className="font-semibold mb-1">{customMessage.title}</h3>
              <p className="text-sm">{customMessage.message}</p>
            </>
          ) : (
            <p className="text-sm">{error}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition"
              title="Réessayer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

