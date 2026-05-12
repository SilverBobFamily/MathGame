'use client';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: 'transparent',
        border: '1px solid var(--theme-border)',
        borderRadius: 8,
        padding: '8px 16px',
        cursor: 'pointer',
        color: 'var(--theme-text)',
        fontSize: '1.1em',
      }}
    >
      {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
