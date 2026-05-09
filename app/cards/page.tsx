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
    <div style={{ padding: '32px 28px' }}>
      <style>{`
        .card-browser-item { cursor: pointer; transition: transform 0.15s ease; }
        .card-browser-item:hover { transform: scale(1.02); }
      `}</style>

      <h1 style={{
        color: '#c9a84c', margin: '0 0 24px',
        fontFamily: "'Cinzel', serif", fontSize: '1.1em',
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
      <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderBottom: '1px solid #181818' }}>
          <span style={{ color: '#555', fontSize: '0.78em', fontFamily: 'monospace' }}>
            {selected?.name ?? 'None selected'} · {releases.length} releases
          </span>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{
            maxHeight: 210, overflowY: 'auto',
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1, padding: '6px 6px',
          }}>
            {releases.map(r => {
              const active = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => { setSelected(r); setSelectedIndex(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '5px 9px',
                    background: active ? 'rgba(201, 168, 76, 0.1)' : 'transparent',
                    border: 'none', borderRadius: 5,
                    cursor: 'pointer', textAlign: 'left',
                    color: active ? '#d4ac5a' : '#555',
                    fontSize: '0.8em',
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
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {cards.map((card, index) => (
          <div
            key={card.id}
            className="card-browser-item"
            onClick={() => setSelectedIndex(index)}
          >
            <CardComponent
              card={{ ...card, release: selected ?? undefined }}
              releaseNumber={selected?.number}
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
