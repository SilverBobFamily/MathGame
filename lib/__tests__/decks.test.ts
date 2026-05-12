jest.mock('../supabase', () => ({ fetchCardsByIds: jest.fn() }));

import { validateDeck } from '../decks';
import type { Card } from '../types';

function makeCard(id: number, type: Card['type'], value = 5): Card {
  return {
    id, release_id: 1, name: `Card${id}`, type,
    value: type === 'creature' ? value : null,
    operator: type === 'item' ? '+1' : type === 'action' ? '×2' : null,
    operator_value: type === 'item' ? 1 : type === 'action' ? 2 : null,
    effect_type: type === 'event' ? 'zero_out' : null,
    art_emoji: '⭐', art_url: null,
    flavor_text: 'flavor', effect_text: type === 'event' ? 'effect' : null,
  };
}

// Build a minimal valid deck: 20 creatures, 10 items, 7 actions, 3 events = 40 cards
function makeValidDeck(): { cardIds: number[]; cardMap: Map<number, Card> } {
  const cards: Card[] = [
    ...Array.from({ length: 20 }, (_, i) => makeCard(i + 1, 'creature')),
    ...Array.from({ length: 10 }, (_, i) => makeCard(i + 21, 'item')),
    ...Array.from({ length: 7 },  (_, i) => makeCard(i + 31, 'action')),
    ...Array.from({ length: 3 },  (_, i) => makeCard(i + 38, 'event')),
  ];
  const cardMap = new Map(cards.map(c => [c.id, c]));
  return { cardIds: cards.map(c => c.id), cardMap };
}

describe('validateDeck — baseline', () => {
  it('passes a valid deck', () => {
    const { cardIds, cardMap } = makeValidDeck();
    const result = validateDeck(cardIds, cardMap);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('validateDeck — ownership', () => {
  it('passes when all cards are owned', () => {
    const { cardIds, cardMap } = makeValidDeck();
    const ownedCardIds = new Set(cardIds);
    const result = validateDeck(cardIds, cardMap, ownedCardIds);
    expect(result.valid).toBe(true);
  });

  it('fails when a card is not owned', () => {
    const { cardIds, cardMap } = makeValidDeck();
    const ownedCardIds = new Set(cardIds);
    ownedCardIds.delete(cardIds[0]); // remove ownership of first card
    const result = validateDeck(cardIds, cardMap, ownedCardIds);
    expect(result.valid).toBe(false);
    expect(result.errors.filter(e => e.includes('not owned'))).toHaveLength(1);
  });

  it('skips ownership check when ownedCardIds is not provided', () => {
    const { cardIds, cardMap } = makeValidDeck();
    const result = validateDeck(cardIds, cardMap);
    expect(result.valid).toBe(true);
  });
});
