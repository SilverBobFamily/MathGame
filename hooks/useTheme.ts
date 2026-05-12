'use client';
import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'mathemagic-theme';
export type Theme = 'dark' | 'light';

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === 'dark' || v === 'light' ? v : null;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() =>
    getStoredTheme() ?? getSystemTheme()
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!getStoredTheme()) {
        const next: Theme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        setThemeState(next);
      }
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const toggle = useCallback(() => {
    setThemeState(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  return { theme, toggle };
}
