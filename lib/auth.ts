import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'host' | 'admin';
  phone?: string;
  avatar?: string;
  roles?: Array<{ id: number; name: string; display_name: string }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  role?: 'user' | 'host';
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/login', credentials);
    const { user, token } = response.data;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return { user, token };
  },

  async register(data: RegisterData) {
    const response = await api.post('/register', data);
    const { user, token } = response.data;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return { user, token };
  },

  async logout() {
    await api.post('/logout');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get('/me');
      return response.data;
    } catch {
      return null;
    }
  },

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
};

