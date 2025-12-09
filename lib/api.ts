import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://apimonbeaupays.loyerpay.ci/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // withCredentials removed - using Bearer tokens instead of cookies
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  // Ne pas définir Content-Type pour FormData, le navigateur le fait automatiquement
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      error.message = 'Network Error';
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized
    // Ne rediriger que si l'utilisateur avait un token (session expirée)
    // Ne pas rediriger si l'utilisateur n'était pas connecté (requête publique)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const hadToken = !!localStorage.getItem('token');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Rediriger uniquement si l'utilisateur avait une session (token présent)
        // Cela signifie que sa session a expiré ou qu'il a été déconnecté
        if (hadToken) {
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/auth/')) {
            window.location.href = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
          }
        }
        // Si hadToken est false, l'utilisateur n'était pas connecté,
        // donc on ne redirige pas - c'est une requête publique qui a échoué
      }
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      error.message = 'Ressource non trouvée';
    }

    // Handle 422 Validation errors
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      if (errors) {
        const firstError = Object.values(errors)[0];
        error.message = Array.isArray(firstError) ? firstError[0] : firstError;
      }
    }

    // Handle 500 Server errors
    if (error.response?.status >= 500) {
      error.message = 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    return Promise.reject(error);
  }
);

export default api;

