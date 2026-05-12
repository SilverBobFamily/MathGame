'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchReleases, fetchCardsByReleaseIds, fetchOwnedCardIds } from '@/lib/supabase';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import {
  DECK_SIZE, REQUIRED_EVENTS, MIN_CREATURES, RECOMMENDED,
  validateDeck, type DeckValidationResult,
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

// Defined OUTSIDE DeckBuilder so React sees a stable component type and never remounts it on re-renders.
interface CompositionPanelProps {
  name: string;
  onNameChange: (n: string) => void;
  validation: DeckValidationResult;
  deckTotal: number;
  deckByType: Record<CardType, Card[]>;
  onRemove: (id: number) => void;
  canSave: boolean;
  saving: boolean;
  saveError: string | null;
  onSave: () => void;
  onCancel: () => void;
}

function CompositionPanel({
  name, onNameChange, validation, deckTotal, deckByType,
  onRemove, canSave, saving, saveError, onSave, onCancel,
}: CompositionPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Name */}
      <div style={{ padding: '16px 16px 12px' }}>
        <input
          value={name}
          onChange={e => onNameChange(e.target.value)}
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
              {group.map(card => (
                <div key={card.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3,
                  padding: '3px 6px', borderRadius: 5,
                  background: '#0d0d0d',
                }}>
                  <span style={{ fontSize: '0.9em', lineHeight: 1, flexShrink: 0 }}>{card.art_emoji}</span>
                  <span style={{ flex: 1, color: '#bbb', fontSize: '0.78em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {card.name}
                  </span>
                  <button
                    onClick={() => onRemove(card.id)}
                    style={{
                      background: 'none', border: 'none', color: '#444', cursor: 'pointer',
                      padding: '2px 4px', fontSize: '0.9em', lineHeight: 1, flexShrink: 0,
                      borderRadius: 3,
                    }}
                    title="Remove from deck"
                  >
                    −
                  </button>
                </div>
              ))}
            </div>
          );
        })}
        {deckTotal === 0 && (
          <p style={{ color: '#2a2a2a', fontSize: '0.78em', textAlign: 'center', marginTop: 24 }}>
            Click cards to add them to your deck
          </p>
        )}
      </div>

      {/* Save / Cancel */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1a1a1a' }}>
        {saveError && (
          <p style={{ color: '#ef5350', fontSize: '0.75em', margin: '0 0 8px' }}>{saveError}</p>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
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
            onClick={onSave}
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
    </div>
  );
}

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
  // Set<number> enforces "one card is either IN or OUT" — no duplicates possible.
  const [deckIds, setDeckIds] = useState<Set<number>>(
    () => new Set(initialDeck?.card_ids ?? [])
  );
  const [name, setName] = useState(initialDeck?.name ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deckSheetOpen, setDeckSheetOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [ownedCardIds, setOwnedCardIds] = useState<Set<number> | null>(null);

  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth > 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Load all releases + build cardMap from the full card pool.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    fetchReleases(supabase).then(r => {
      const sorted = [...r].sort((a, b) => a.name.localeCompare(b.name));
      setReleases(sorted);
      fetchCardsByReleaseIds(sorted.map(rel => rel.id), supabase).then(allCards => {
        setCards(allCards);
        setCardMap(new Map(allCards.map(c => [c.id, c])));
        fetchOwnedCardIds(supabase).then(setOwnedCardIds).catch(() => setOwnedCardIds(new Set()));
      });
    });
  }, []);

  // Filter displayed cards when release picker changes.
  useEffect(() => {
    if (releases.length === 0) return;
    const supabase = createSupabaseBrowserClient();
    const ids = selectedRelease === 'all' ? releases.map(r => r.id) : [selectedRelease];
    fetchCardsByReleaseIds(ids, supabase).then(setCards);
  }, [selectedRelease, releases]);

  const validation = useMemo(
    () => validateDeck([...deckIds], cardMap, ownedCardIds ?? undefined),
    [deckIds, cardMap, ownedCardIds],
  );

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter(c => {
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [cards, search, typeFilter]);

  const addCard = useCallback((card: Card) => {
    setDeckIds(prev => {
      if (prev.has(card.id) || prev.size >= DECK_SIZE) return prev;
      return new Set([...prev, card.id]);
    });
  }, []);

  const removeCard = useCallback((cardId: number) => {
    setDeckIds(prev => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!validation.valid || !name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(name.trim(), [...deckIds]);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save deck.');
      setSaving(false);
    }
  }, [validation.valid, name, deckIds, onSave]);

  const deckByType = useMemo(() => {
    const groups: Record<CardType, Card[]> = {
      creature: [], item: [], action: [], event: [],
    };
    for (const id of deckIds) {
      const card = cardMap.get(id);
      if (!card) continue;
      groups[card.type].push(card);
    }
    return groups;
  }, [deckIds, cardMap]);

  const deckTotal = deckIds.size;
  const canSave = validation.valid && name.trim().length > 0;

  const panelProps: CompositionPanelProps = {
    name, onNameChange: setName,
    validation, deckTotal, deckByType,
    onRemove: removeCard,
    canSave, saving, saveError,
    onSave: handleSave, onCancel,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {isDesktop ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 0,
          height: '100%',
          minHeight: 'calc(100vh - 102px)',
        }}>
          <div style={{ overflowY: 'auto', padding: '24px 28px', borderRight: '1px solid #1a1a1a' }}>
            <BrowserPanel
              releases={releases}
              selectedRelease={selectedRelease}
              setSelectedRelease={setSelectedRelease}
              search={search}
              setSearch={setSearch}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              filteredCards={filteredCards}
              totalCardsInPool={cards.length}
              deckSet={deckIds}
              deckTotal={deckTotal}
              onAdd={addCard}
              onRemove={removeCard}
              ownedCardIds={ownedCardIds}
            />
          </div>
          <div style={{
            position: 'sticky', top: 102,
            height: 'calc(100vh - 102px)',
            background: '#0a0a0a',
            borderLeft: '1px solid #1a1a1a',
            display: 'flex', flexDirection: 'column',
          }}>
            <CompositionPanel {...panelProps} />
          </div>
        </div>
      ) : (
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
            setSelectedRelease={setSelectedRelease}
            search={search}
            setSearch={setSearch}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            filteredCards={filteredCards}
            totalCardsInPool={cards.length}
            deckSet={deckIds}
            deckTotal={deckTotal}
            onAdd={addCard}
            onRemove={removeCard}
            ownedCardIds={ownedCardIds}
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
            <div
              style={{
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
                  <CompositionPanel {...panelProps} />
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
  deckSet: Set<number>;
  deckTotal: number;
  onAdd: (card: Card) => void;
  onRemove: (id: number) => void;
  ownedCardIds: Set<number> | null;
}

function BrowserPanel({
  releases, selectedRelease, setSelectedRelease,
  search, setSearch, typeFilter, setTypeFilter,
  filteredCards, totalCardsInPool, deckSet, deckTotal, onAdd, onRemove, ownedCardIds,
}: BrowserPanelProps) {
  return (
    <div>
      <style>{`
        .deck-card-item { position: relative; cursor: pointer; transition: transform 0.12s ease; display: inline-block; }
        .deck-card-item:hover { transform: scale(1.03); }
        .deck-card-item.deck-full { opacity: 0.35; cursor: not-allowed; }
        .deck-in-badge {
          position: absolute; top: 6px; right: 6px; z-index: 2;
          background: rgba(10,10,10,0.9); border-radius: 50%;
          width: 22px; height: 22px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #81c784;
          border: 1px solid #81c784; cursor: pointer;
        }
        .search-input::placeholder { color: #444; }
        .search-input:focus { outline: none; border-color: #333 !important; }
      `}</style>

      {/* Release picker */}
      <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ maxHeight: 168, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, padding: 6 }}>
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
            {filteredCards.length} / {totalCardsInPool}
          </span>
        )}
      </div>

      {/* Card grid */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {filteredCards.map(card => {
          const inDeck = deckSet.has(card.id);
          const isFull = !inDeck && deckTotal >= DECK_SIZE;
          const isOwned = ownedCardIds === null || ownedCardIds.has(card.id);
          return (
            <div
              key={card.id}
              className={`deck-card-item${isFull || !isOwned ? ' deck-full' : ''}`}
              onClick={() => {
                if (!isOwned) return;
                if (inDeck) onRemove(card.id); else if (!isFull) onAdd(card);
              }}
              title={!isOwned ? `${card.name} (not owned)` : inDeck ? `Remove ${card.name}` : isFull ? 'Deck is full (40 cards)' : `Add ${card.name}`}
              style={inDeck ? { outline: '2px solid #81c784', borderRadius: 8 } : undefined}
            >
              {!isOwned && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5em',
                  pointerEvents: 'none',
                }}>
                  🔒
                </div>
              )}
              <CardComponent
                card={{ ...card, release: card.release }}
                releaseNumber={card.release?.number}
                scale={0.72}
              />
              {inDeck && (
                <div
                  className="deck-in-badge"
                  onClick={e => { e.stopPropagation(); onRemove(card.id); }}
                  title="Remove from deck"
                >
                  ✓
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
