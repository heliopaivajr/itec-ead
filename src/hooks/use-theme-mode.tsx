import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light' | 'sepia';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('itec-theme') as ThemeMode | null;
    if (saved === 'light' || saved === 'sepia') {
      setThemeState(saved);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'sepia');
    root.classList.add(theme);
    localStorage.setItem('itec-theme', theme);
  }, [theme]);

  const setTheme = (t: ThemeMode) => setThemeState(t);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : prev === 'light' ? 'sepia' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within a ThemeProvider');
  return context;
}
