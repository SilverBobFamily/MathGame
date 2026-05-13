'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { deleteDeck } from '@/lib/decks';
import type { CardType } from '@/lib/types';

const TYPE_COLORS: Record<CardType, string> = {
  creature: '#5c6bc0',
  item:     '#4caf50',
  action:   '#ab47bc',
  event:    '#e53935',
};

interface DeckRow {
  id: string;
  name: string;
  card_ids: number[];
  created_at: string;
  updated_at: string;
}

interface Props {
  initialDecks: DeckRow[];
  typeMap: Record<number, string>;
}

function typeCounts(cardIds: number[], typeMap: Record<number, string>): Record<CardType, number> {
  const counts: Record<CardType, number> = { creature: 0, item: 0, action: 0, event: 0 };
  for (const id of cardIds) {
    const t = typeMap[id] as CardType | undefined;
    if (t) counts[t]++;
  }
  return counts;
}

export default function DecksClient({ initialDecks, typeMap }: Props) {
  const [decks, setDecks] = useState(initialDecks);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = useCallback(async (id: string) => {
    const supabase = createSupabaseBrowserClient();
    await deleteDeck(id, supabase);
    setDecks(prev => prev.filter(d => d.id !== id));
    setConfirmDelete(null);
  }, []);

  return (
    <div style={{ padding: '32px 28px', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{
          color: '#c9a84c', margin: 0,
          fontFamily: "'Spectral', serif", fontSize: '1.1em',
          letterSpacing: '0.08em', fontWeight: 700,
        }}>
          My Decks
        </h1>
        <a
          href="/decks/new"
          style={{
            background: '#c9a84c', color: '#0d0d1a',
            border: 'none', borderRadius: 8,
            padding: '8px 20px', fontSize: '0.85em',
            textDecoration: 'none', fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700, letterSpacing: '0.03em',
          }}
        >
          + Build a Deck
        </a>
      </div>

      {decks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#444' }}>
          <p style={{ fontSize: '1em', margin: '0 0 16px' }}>No decks yet.</p>
          <a
            href="/decks/new"
            style={{ color: '#c9a84c', fontSize: '0.9em', textDecoration: 'underline' }}
          >
            Build your first deck →
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {decks.map(deck => {
            const counts = typeCounts(deck.card_ids, typeMap);
            const total = deck.card_ids.length;
            const updatedDate = new Date(deck.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const isConfirming = confirmDelete === deck.id;
            return (
              <div
                key={deck.id}
                style={{
                  background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10,
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                {/* Deck info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#ddd', fontFamily: "'Spectral', serif", fontSize: '0.88em', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {deck.name}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {(Object.entries(counts) as [CardType, number][]).map(([t, c]) => (
                      <span
                        key={t}
                        style={{
                          background: `${TYPE_COLORS[t]}22`,
                          color: TYPE_COLORS[t],
                          border: `1px solid ${TYPE_COLORS[t]}55`,
                          borderRadius: 4, padding: '1px 7px',
                          fontSize: '0.68em', lineHeight: 1.6,
                          textTransform: 'capitalize',
                        }}
                      >
                        {c} {t}
                      </span>
                    ))}
                    <span style={{ color: '#333', fontSize: '0.68em' }}>{total} cards</span>
                    <span style={{ color: '#2a2a2a', fontSize: '0.65em', marginLeft: 'auto' }}>{updatedDate}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <a
                    href={`/decks/${deck.id}`}
                    style={{
                      background: '#111', color: '#888', border: '1px solid #222',
                      borderRadius: 6, padding: '5px 12px', fontSize: '0.75em',
                      textDecoration: 'none', cursor: 'pointer',
                    }}
                  >
                    Edit
                  </a>
                  {isConfirming ? (
                    <>
                      <button
                        onClick={() => handleDelete(deck.id)}
                        style={{
                          background: '#7f0000', color: '#fff', border: '1px solid #ef5350',
                          borderRadius: 6, padding: '5px 10px', fontSize: '0.75em', cursor: 'pointer',
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{
                          background: '#111', color: '#555', border: '1px solid #222',
                          borderRadius: 6, padding: '5px 8px', fontSize: '0.75em', cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(deck.id)}
                      style={{
                        background: 'none', color: '#3a3a3a', border: '1px solid #1e1e1e',
                        borderRadius: 6, padding: '5px 8px', fontSize: '0.75em', cursor: 'pointer',
                      }}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
