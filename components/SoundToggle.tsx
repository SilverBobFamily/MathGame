'use client';
import { useSoundEnabled } from '@/hooks/useSoundEnabled';

export default function SoundToggle() {
  const { enabled, toggle } = useSoundEnabled();
  return (
    <button
      onClick={toggle}
      aria-label={enabled ? 'Disable sound effects' : 'Enable sound effects'}
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
      {enabled ? '🔊 Sound On' : '🔇 Sound Off'}
    </button>
  );
}
