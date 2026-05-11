'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchReleases, fetchCardsByReleaseIds } from '@/lib/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  DECK_SIZE, REQUIRED_EVENTS, MIN_CREATURES, MAX_COPIES, RECOMMENDED,
  validateDeck,
} from '@/lib/decks';
import CardComponent from '@/components/Card';
import type { Card, CardType, DeckWithCards, Release } from '@/lib/types';

const TYPE_COLORS: Record<CardType, string> = {
  creature: '#5c6bc0',
  item:     '#4caf50',
  action:   '#ab47bc',
  event:    '#e53935',
};

const TYPES: (CardType | 'all')[] = ['all', 'creature', 'item', 'action', 'event'];

interface Props {
  initialDeck?: DeckWithCards;
  onSave: (name: string, cardIds: number[]) => Promise<void>;
  onCancel: () => void;
}

export default function DeckBuilder({ initialDeck, onSave, onCancel }: Props) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [cardMap, setCardMap] = useState<Map<number, Card>>(new Map());
  const [selectedRelease, setSelectedRelease] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<CardType | 'all'>('all');
  const [deckIds, setDeckIds] = useState<number[]>(initialDeck?.card_ids ?? []);
  const [name, setName] = useState(initialDeck?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deckSheetOpen, setDeckSheetOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth > 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Load releases
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    fetchReleases(supabase).then(r => {
      const sorted = [...r].sort((a, b) => a.name.localeCompare(b.name));
      setReleases(sorted);
      // Load all cards initially
      fetchCardsByReleaseIds(sorted.map(rel => rel.id), supabase).then(allCards => {
        setCards(allCards);
        setCardMap(new Map(allCards.map(c => [c.id, c])));
      });
    });
  }, []);

  // Load cards for selected release
  useEffect(() => {
    if (releases.length === 0) return;
    const supabase = createSupabaseBrowserClient();
    const ids = selectedRelease === 'all' ? releases.map(r => r.id) : [selectedRelease];
    fetchCardsByReleaseIds(ids, supabase).then(fetched => {
      setCards(fetched);
    });
  }, [selectedRelease, releases]);

  // Counts per card in deck
  const deckCopies = useMemo(() => {
    const map = new Map<number, number>();
    for (const id of deckIds) map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  }, [deckIds]);

  const validation = useMemo(() => validateDeck(deckIds, cardMap), [deckIds, cardMap]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter(c => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cards, search, typeFilter]);

  const addCard = useCallback((card: Card) => {
    if (deckIds.length >= DECK_SIZE) return;
    const copies = deckCopies.get(card.id) ?? 0;
    if (copies >= MAX_COPIES) return;
    setDeckIds(prev => [...prev, card.id]);
  }, [deckIds.length, deckCopies]);

  const removeOneCard = useCallback((cardId: number) => {
    setDeckIds(prev => {
      const idx = prev.lastIndexOf(cardId);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!validation.valid || !name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(name.trim(), deckIds);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save deck.');
      setSaving(false);
    }
  }, [validation.valid, name, deckIds, onSave]);

  // Group deck cards by type for the panel list
  const deckByType = useMemo(() => {
    const groups: Record<CardType, Array<{ card: Card; count: number }>> = {
      creature: [], item: [], action: [], event: [],
    };
    const seen = new Map<number, boolean>();
    for (const id of deckIds) {
      if (seen.get(id)) continue;
      seen.set(id, true);
      const card = cardMap.get(id);
      if (!card) continue;
      const count = deckCopies.get(id) ?? 1;
      groups[card.type].push({ card, count });
    }
    return groups;
  }, [deckIds, cardMap, deckCopies]);

  const deckTotal = deckIds.length;
  const canSave = validation.valid && name.trim().length > 0;

  const CompositionPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Name */}
      <div style={{ padding: '16px 16px 12px' }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Deck name…"
          maxLength={50}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: '#111', color: '#eee',
            border: '1px solid #2a2a2a', borderRadius: 7,
            padding: '8px 12px', fontSize: '0.95em',
            fontFamily: "'Crimson Text', serif",
            outline: 'none',
          }}
        />
      </div>

      {/* Type breakdown */}
      <div style={{ padding: '0 16px 12px', borderBottom: '1px solid #1a1a1a' }}>
        {(['creature', 'item', 'action', 'event'] as CardType[]).map(t => {
          const count = validation.typeCounts[t];
          const rec = RECOMMENDED[t];
          const isMin = t === 'creature' ? count < MIN_CREATURES : t === 'event' ? count !== REQUIRED_EVENTS : false;
          const color = isMin ? '#ef5350' : count >= rec ? '#81c784' : '#c9a84c';
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{
                width: 62, fontSize: '0.72em', color: TYPE_COLORS[t],
                textTransform: 'capitalize', flexShrink: 0,
              }}>{t}s</span>
              <div style={{ flex: 1, height: 4, background: '#1a1a1a', borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  width: `${Math.min(100, (count / rec) * 100)}%`,
                  background: TYPE_COLORS[t],
                  transition: 'width 0.2s',
                }} />
              </div>
              <span style={{ color, fontSize: '0.78em', minWidth: 40, textAlign: 'right', flexShrink: 0 }}>
                {count} / {rec}
              </span>
            </div>
          );
        })}

        {/* Total */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ color: '#555', fontSize: '0.75em' }}>Total</span>
          <span style={{
            fontSize: '1.1em', fontWeight: 700,
            color: deckTotal === DECK_SIZE ? '#c9a84c' : deckTotal > DECK_SIZE ? '#ef5350' : '#aaa',
          }}>
            {deckTotal} / {DECK_SIZE}
          </span>
        </div>
        <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, marginTop: 5 }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${Math.min(100, (deckTotal / DECK_SIZE) * 100)}%`,
            background: deckTotal === DECK_SIZE ? '#c9a84c' : '#5c6bc0',
            transition: 'width 0.2s',
          }} />
        </div>

        {/* Suggested guide */}
        <p style={{ color: '#2a2a2a', fontSize: '0.68em', margin: '8px 0 0', lineHeight: 1.4 }}>
          Suggested: 20 creatures · 10 items · 7 actions · 3 events
        </p>
      </div>

      {/* Validation errors */}
      {validation.errors.length > 0 && (
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #1a1a1a' }}>
          {validation.errors.map((e, i) => (
            <p key={i} style={{ color: '#ef5350', fontSize: '0.75em', margin: '0 0 3px' }}>
              {e}
            </p>
          ))}
        </div>
      )}

      {/* Deck card list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
        {(['creature', 'item', 'action', 'event'] as CardType[]).map(t => {
          const group = deckByType[t];
          if (group.length === 0) return null;
          return (
            <div key={t} style={{ marginBottom: 10 }}>
              <div style={{ color: TYPE_COLORS[t], fontSize: '0.7em', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {t}s ({validation.typeCounts[t]})
              </div>
              {group.map(({ card, count }) => (
                <div key={card.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
                  padding: '3px 6px', borderRadius: 5,
                  background: '#0d0d0d',
                }}>
                  <span style={{ fontSize: '0.9em', lineHeight: 1, flexShrink: 0 }}>{card.art_emoji}</span>
                  <span style={{ flex: 1, color: '#bbb', fontSize: '0.78em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.name}
                  </span>
                  {count > 1 && (
                    <span style={{ color: '#555', fontSize: '0.72em' }}>×{count}</span>
                  )}
                  <button
                    onClick={() => removeOneCard(card.id)}
                    style={{
                      background: 'none', border: 'none', color: '#444', cursor: 'pointer',
                      padding: '2px 4px', fontSize: '0.9em', lineHeight: 1, flexShrink: 0,
                      borderRadius: 3,
                    }}
                    title="Remove one copy"
                  >
                    −
                  </button>
                </div>
              ))}
            </div>
          );
        })}
        {deckIds.length === 0 && (
          <p style={{ color: '#2a2a2a', fontSize: '0.78em', textAlign: 'center', marginTop: 24 }}>
            Click cards to add them to your deck
          </p>
        )}
      </div>

      {/* Save / Cancel */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: 8 }}>
        {saveError && (
          <p style={{ color: '#ef5350', fontSize: '0.75em', margin: '0 0 8px' }}>{saveError}</p>
        )}
        <button
          onClick={onCancel}
          style={{
            flex: 1, background: '#111', color: '#666', border: '1px solid #222',
            borderRadius: 8, padding: '10px', cursor: 'pointer', fontSize: '0.85em',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          style={{
            flex: 2,
            background: canSave && !saving ? '#1a237e' : '#111',
            color: canSave && !saving ? '#fff' : '#444',
            border: `1px solid ${canSave && !saving ? '#5c6bc0' : '#222'}`,
            borderRadius: 8, padding: '10px', cursor: canSave && !saving ? 'pointer' : 'not-allowed',
            fontSize: '0.85em', fontWeight: 600,
          }}
        >
          {saving ? 'Saving…' : 'Save Deck'}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {isDesktop ? (
        // Desktop: two-panel layout
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 0,
          height: '100%',
          minHeight: 'calc(100vh - 102px)',
        }}>
          {/* Left: Card browser */}
          <div style={{ overflowY: 'auto', padding: '24px 28px', borderRight: '1px solid #1a1a1a' }}>
            <BrowserPanel
              releases={releases}
              selectedRelease={selectedRelease}
              setSelectedRelease={r => { setSelectedRelease(r); }}
              search={search}
              setSearch={setSearch}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              filteredCards={filteredCards}
              totalCardsInPool={cards.length}
              deckCopies={deckCopies}
              deckTotal={deckTotal}
              onAdd={addCard}
              onRemove={removeOneCard}
            />
          </div>
          {/* Right: Composition panel */}
          <div style={{
            position: 'sticky', top: 102,
            height: 'calc(100vh - 102px)',
            background: '#0a0a0a',
            borderLeft: '1px solid #1a1a1a',
            display: 'flex', flexDirection: 'column',
          }}>
            <CompositionPanel />
          </div>
        </div>
      ) : (
        // Mobile: stacked with sticky bottom bar
        <div style={{ paddingBottom: 64 }}>
          <div style={{ padding: '16px 16px 8px' }}>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Deck name…"
              maxLength={50}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#111', color: '#eee',
                border: '1px solid #2a2a2a', borderRadius: 7,
                padding: '8px 12px', fontSize: '0.95em',
                fontFamily: "'Crimson Text', serif",
                outline: 'none',
              }}
            />
          </div>
          <BrowserPanel
            releases={releases}
            selectedRelease={selectedRelease}
            setSelectedRelease={r => { setSelectedRelease(r); }}
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            filteredCards={filteredCards}
            totalCardsInPool={cards.length}
            deckCopies={deckCopies}
            deckTotal={deckTotal}
            onAdd={addCard}
            onRemove={removeOneCard}
          />

          {/* Sticky bottom bar */}
          <div style={{
            position: 'fixed', bottom: 60, left: 0, right: 0, zIndex: 40,
            background: '#111', borderTop: '1px solid #1e1e1e',
            padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              fontSize: '0.9em', fontWeight: 700,
              color: deckTotal === DECK_SIZE ? '#c9a84c' : '#aaa',
            }}>
              {deckTotal}/{DECK_SIZE}
            </span>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: validation.valid ? '#81c784' : '#ef5350',
              flexShrink: 0,
            }} />
            <button
              onClick={() => setDeckSheetOpen(true)}
              style={{
                flex: 1, background: '#1a1a1a', color: '#aaa',
                border: '1px solid #2a2a2a', borderRadius: 6,
                padding: '6px', cursor: 'pointer', fontSize: '0.8em',
              }}
            >
              View Deck ▲
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || saving}
              style={{
                background: canSave && !saving ? '#1a237e' : '#111',
                color: canSave && !saving ? '#fff' : '#444',
                border: `1px solid ${canSave && !saving ? '#5c6bc0' : '#333'}`,
                borderRadius: 6, padding: '6px 14px',
                cursor: canSave && !saving ? 'pointer' : 'not-allowed',
                fontSize: '0.8em', fontWeight: 600,
              }}
            >
              {saving ? '…' : 'Save'}
            </button>
          </div>

          {/* Deck sheet overlay */}
          {deckSheetOpen && (
            <div style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
              onClick={() => setDeckSheetOpen(false)}
            >
              <div
                style={{
                  background: '#111', borderRadius: '16px 16px 0 0',
                  maxHeight: '75vh', display: 'flex', flexDirection: 'column',
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#aaa', fontFamily: "'Cinzel', serif", fontSize: '0.85em' }}>My Deck</span>
                  <button
                    onClick={() => setDeckSheetOpen(false)}
                    style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2em' }}
                  >
                    ▼
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <CompositionPanel />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface BrowserPanelProps {
  releases: Release[];
  selectedRelease: number | 'all';
  setSelectedRelease: (r: number | 'all') => void;
  search: string;
  setSearch: (s: string) => void;
  typeFilter: CardType | 'all';
  setTypeFilter: (t: CardType | 'all') => void;
  filteredCards: Card[];
  totalCardsInPool: number;
  deckCopies: Map<number, number>;
  deckTotal: number;
  onAdd: (card: Card) => void;
  onRemove: (id: number) => void;
}

function BrowserPanel({
  releases, selectedRelease, setSelectedRelease,
  search, setSearch, typeFilter, setTypeFilter,
  filteredCards, totalCardsInPool, deckCopies, deckTotal, onAdd, onRemove,
}: BrowserPanelProps) {
  return (
    <div>
      <style>{`
        .deck-card-item { position: relative; cursor: pointer; transition: transform 0.12s ease; display: inline-block; }
        .deck-card-item:hover { transform: scale(1.03); }
        .deck-card-item.maxed { opacity: 0.4; cursor: not-allowed; }
        .deck-qty-badge {
          position: absolute; top: 6px; right: 6px; z-index: 2;
          background: rgba(10,10,10,0.85); border-radius: 50%;
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #c9a84c;
          border: 1px solid #c9a84c; cursor: pointer;
        }
        .search-input::placeholder { color: #444; }
        .search-input:focus { outline: none; border-color: #333 !important; }
      `}</style>

      {/* Release picker */}
      <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ maxHeight: 168, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, padding: 6 }}>
          {/* All Releases */}
          <button
            onClick={() => setSelectedRelease('all')}
            style={{
              gridColumn: '1 / -1',
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '5px 9px',
              background: selectedRelease === 'all' ? 'rgba(201,168,76,0.1)' : 'transparent',
              border: 'none', borderRadius: 5, cursor: 'pointer', textAlign: 'left',
              color: selectedRelease === 'all' ? '#d4ac5a' : '#555',
              fontSize: '0.8em', fontFamily: "'Crimson Text', serif",
              fontWeight: selectedRelease === 'all' ? 600 : 400,
            }}
          >
            <span style={{ fontSize: '1em', lineHeight: 1 }}>✦</span>
            <span style={{ flex: 1 }}>All Releases</span>
            <span style={{ color: selectedRelease === 'all' ? '#c9a84c' : '#282828', fontSize: '0.85em' }}>✓</span>
          </button>
          {releases.map(r => {
            const active = selectedRelease === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRelease(r.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '5px 9px',
                  background: active ? 'rgba(201,168,76,0.1)' : 'transparent',
                  border: 'none', borderRadius: 5, cursor: 'pointer', textAlign: 'left',
                  color: active ? '#d4ac5a' : '#555',
                  fontSize: '0.8em', fontFamily: "'Crimson Text', serif",
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
      </div>

      {/* Search + type filter */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          className="search-input"
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: '1 1 150px', minWidth: 0,
            background: '#0d0d0d', color: '#ddd',
            border: '1px solid #222', borderRadius: 7,
            padding: '6px 10px', fontSize: '0.85em',
            fontFamily: "'Crimson Text', serif",
          }}
        />
        <div style={{ display: 'flex', gap: 3, flexShrink: 0, flexWrap: 'wrap' }}>
          {TYPES.map(t => {
            const active = typeFilter === t;
            const color = t === 'all' ? '#888' : TYPE_COLORS[t];
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  background: active ? color : '#0d0d0d',
                  color: active ? '#fff' : '#555',
                  border: `1px solid ${active ? color : '#222'}`,
                  borderRadius: 6, padding: '4px 9px',
                  fontSize: '0.75em', cursor: 'pointer',
                  fontWeight: active ? 700 : 400,
                  textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
        {(search || typeFilter !== 'all') && (
          <span style={{ color: '#444', fontSize: '0.75em', flexShrink: 0 }}>
            {filteredCards.length} / {filteredCards.length}
          </span>
        )}
      </div>

      {/* Card grid */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {filteredCards.map(card => {
          const qty = deckCopies.get(card.id) ?? 0;
          const maxed = qty >= MAX_COPIES || deckTotal >= DECK_SIZE;
          return (
            <div
              key={card.id}
              className={`deck-card-item${maxed && qty === 0 ? ' maxed' : ''}`}
              onClick={() => !maxed && onAdd(card)}
              title={maxed && deckTotal >= DECK_SIZE ? 'Deck is full (40 cards)' : maxed ? `Max ${MAX_COPIES} copies` : `Add ${card.name}`}
            >
              <CardComponent
                card={{ ...card, release: card.release }}
                releaseNumber={card.release?.number}
                scale={0.72}
              />
              {qty > 0 && (
                <div
                  className="deck-qty-badge"
                  onClick={e => { e.stopPropagation(); onRemove(card.id); }}
                  title="Remove one copy"
                >
                  ×{qty}
                </div>
              )}
            </div>
          );
        })}
        {filteredCards.length === 0 && totalCardsInPool > 0 && (
          <p style={{ color: '#444', fontSize: '0.88em', fontStyle: 'italic' }}>
            No cards match your search.
          </p>
        )}
        {totalCardsInPool === 0 && (
          <p style={{ color: '#444', fontSize: '0.88em' }}>Loading cards…</p>
        )}
      </div>
    </div>
  );
}
