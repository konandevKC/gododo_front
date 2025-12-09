import { create } from 'zustand';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  // Initialize theme from localStorage if available
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      return {
        theme: stored,
        toggleTheme: () =>
          set((state) => {
            const newTheme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            return { theme: newTheme };
          }),
        setTheme: (theme) => {
          localStorage.setItem('theme', theme);
          set({ theme });
        },
      };
    }
  }

  return {
    theme: 'light',
    toggleTheme: () =>
      set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        if (typeof window !== 'undefined') {
          localStorage.setItem('theme', newTheme);
        }
        return { theme: newTheme };
      }),
    setTheme: (theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
      }
      set({ theme });
    },
  };
});

