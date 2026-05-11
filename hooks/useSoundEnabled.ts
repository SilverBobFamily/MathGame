'use client';
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'mathemagic-sounds';

function getStoredEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const v = localStorage.getItem(STORAGE_KEY);
  return v !== 'off';
}

export function useSoundEnabled() {
  const [enabled, setEnabled] = useState<boolean>(() => getStoredEnabled());

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
      return next;
    });
  }, []);

  return { enabled, toggle };
}
