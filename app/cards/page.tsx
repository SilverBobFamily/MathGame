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
      .then(r => { setReleases(r); setSelected(r[0] ?? null); })
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
    <div style={{ padding: '24px 28px' }}>
      <style>{`
        .card-browser-item { cursor: pointer; transition: transform 0.15s ease; }
        .card-browser-item:hover { transform: scale(1.02); }
      `}</style>
      <h1 style={{ color: '#fff', marginTop: 0, marginBottom: 20 }}>Card Browser</h1>
      {error && (
        <div style={{ background: '#2a0a0a', border: '1px solid #7f0000', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef9a9a', fontSize: '0.85em' }}>
          Error: {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
        {releases.map(r => (
          <button
            key={r.id}
            onClick={() => { setSelected(r); setSelectedIndex(null); }}
            style={{
              background: selected?.id === r.id ? r.color_hex : '#111',
              color: '#fff', border: `2px solid ${r.color_hex}`,
              borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
              fontSize: '0.95em', fontWeight: selected?.id === r.id ? 700 : 400,
            }}
          >
            {r.icon} {r.name}
          </button>
        ))}
      </div>
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
