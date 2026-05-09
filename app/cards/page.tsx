'use client';
import { useEffect, useState } from 'react';
import { fetchReleases, fetchCardsByRelease } from '@/lib/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import type { Release, Card } from '@/lib/types';
import CardComponent from '@/components/Card';
import CardBrowserModal from '@/components/CardBrowserModal';

export default function CardsPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [selected, setSelected] = useState<Release | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth > 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const S = isDesktop ? 1.33 : 1;

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    fetchReleases(supabase)
      .then(r => {
        setReleases([...r].sort((a, b) => a.name.localeCompare(b.name)));
        setSelected(r[0] ?? null);
      })
      .catch(e => setError(String(e?.message ?? e)));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const supabase = createSupabaseBrowserClient();
    setError(null);
    fetchCardsByRelease(selected.id, supabase)
      .then(setCards)
      .catch(e => setError(String(e?.message ?? e)));
  }, [selected]);

  return (
    <div style={{ padding: `${Math.round(32 * S)}px ${Math.round(28 * S)}px` }}>
      <style>{`
        .card-browser-item { cursor: pointer; transition: transform 0.15s ease; }
        .card-browser-item:hover { transform: scale(1.02); }
      `}</style>

      <h1 style={{
        color: '#c9a84c', margin: `0 0 ${Math.round(24 * S)}px`,
        fontFamily: "'Cinzel', serif", fontSize: `${(1.1 * S).toFixed(2)}em`,
        letterSpacing: '0.08em', fontWeight: 700,
      }}>
        Card Browser
      </h1>

      {error && (
        <div style={{
          background: '#2a0a0a', border: '1px solid #7f0000', borderRadius: 8,
          padding: '10px 14px', marginBottom: 16, color: '#ef9a9a', fontSize: '0.85em',
        }}>
          Error: {error}
        </div>
      )}

      {/* Release picker */}
      <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden', marginBottom: Math.round(28 * S) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `${Math.round(8 * S)}px ${Math.round(12 * S)}px`, borderBottom: '1px solid #181818' }}>
          <span style={{ color: '#555', fontSize: `${(0.78 * S).toFixed(2)}em`, fontFamily: 'monospace' }}>
            {selected?.name ?? 'None selected'} · {releases.length} releases
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{
            maxHeight: Math.round(210 * S), overflowY: 'auto',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1, padding: `${Math.round(6 * S)}px`,
          }}>
            {releases.map(r => {
              const active = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => { setSelected(r); setSelectedIndex(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: Math.round(7 * S),
                    padding: `${Math.round(5 * S)}px ${Math.round(9 * S)}px`,
                    background: active ? 'rgba(201, 168, 76, 0.1)' : 'transparent',
                    border: 'none', borderRadius: 5,
                    cursor: 'pointer', textAlign: 'left',
                    color: active ? '#d4ac5a' : '#555',
                    fontSize: `${(0.8 * S).toFixed(2)}em`,
                    fontFamily: "'Crimson Text', serif",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <span style={{ fontSize: '1em', lineHeight: 1, flexShrink: 0 }}>{r.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                  <span style={{ color: active ? '#c9a84c' : '#282828', fontSize: '0.85em', flexShrink: 0 }}>✓</span>
                </button>
              );
            })}
          </div>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 36,
            background: 'linear-gradient(transparent, #0d0d0d)',
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* Card grid */}
      <div style={{ display: 'flex', gap: Math.round(20 * S), flexWrap: 'wrap' }}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="card-browser-item"
            onClick={() => setSelectedIndex(index)}
          >
            <CardComponent
              card={{ ...card, release: selected ?? undefined }}
              releaseNumber={selected?.number}
              scale={S}
            />
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <CardBrowserModal
          cards={cards}
          initialIndex={selectedIndex}
          release={selected}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </div>
  );
}
