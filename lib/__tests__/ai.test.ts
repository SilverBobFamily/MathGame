import { chooseAiMove } from '../ai';
import type { GameState, GameOptions, Side } from '../types';

function makeCard(id: number, type: 'creature' | 'item' | 'action' | 'event', value: number | null, opVal: number | null = null, effect: string | null = null) {
  return {
    id, name: `Card${id}`, release_id: 1, type,
    value, operator: null, operator_value: opVal, effect_type: effect as never,
    art_emoji: '🃏', art_url: null, flavor_text: '', effect_text: null,
  };
}

function makeFieldCard(id: number, value: number) {
  return { card: makeCard(id, 'creature', value), modifiers: [], zeroed: false };
}

function makeState(overrides: {
  hand?: ReturnType<typeof makeCard>[];
  ownField?: ReturnType<typeof makeFieldCard>[];
  oppField?: ReturnType<typeof makeFieldCard>[];
  difficulty?: GameOptions['aiDifficulty'];
}): GameState {
  const opts: GameOptions = {
    handSize: 4, guaranteedEvent: false, maxPlays: 16, eventCount: 0,
    firstPlayer: 'player', setAsideCount: 0,
    aiDifficulty: overrides.difficulty ?? 'normal',
    customDeckId: null,
  };
  return {
    phase: 'playing', turn: 'opponent', firstTurn: 'player', round: 1,
    winner: null, pendingCard: null, learningMode: false,
    options: opts,
    player:   { deck: [], hand: [], field: overrides.oppField ?? [], aside: [], playedCount: 0 },
    opponent: { deck: [], hand: overrides.hand ?? [],   field: overrides.ownField ?? [], aside: [], playedCount: 0 },
  };
}

describe('chooseAiMove', () => {
  it('returns null for empty hand', () => {
    expect(chooseAiMove(makeState({ hand: [] }), 'normal')).toBeNull();
  });

  it('normal: plays highest-abs-value creature to own side (positive)', () => {
    const hand = [makeCard(1, 'creature', 3), makeCard(2, 'creature', 7)];
    const move = chooseAiMove(makeState({ hand }), 'normal');
    expect(move?.cardId).toBe(2);
    expect(move?.targetSide).toBe('opponent');
  });

  it('normal: plays negative creature to opponent side', () => {
    const hand = [makeCard(1, 'creature', -5)];
    const move = chooseAiMove(makeState({ hand }), 'normal');
    expect(move?.cardId).toBe(1);
    expect(move?.targetSide).toBe('player');
  });

  it('hard: picks best move by score delta for an item card', () => {
    const ownField = [makeFieldCard(10, 5)];
    const hand = [makeCard(1, 'item', null, 3)];
    const move = chooseAiMove(makeState({ hand, ownField }), 'hard');
    expect(move?.cardId).toBe(1);
    expect(move?.targetSide).toBe('opponent');
    expect(move?.targetCreatureId).toBe(10);
  });

  it('hard: plays negative creature to opponent side when it maximises delta', () => {
    const hand = [makeCard(1, 'creature', -5)];
    const move = chooseAiMove(makeState({ hand }), 'hard');
    expect(move?.cardId).toBe(1);
    expect(move?.targetSide).toBe('player');
  });

  it('easy: returns a valid move (not null) for non-empty hand', () => {
    const hand = [makeCard(1, 'creature', 5)];
    expect(chooseAiMove(makeState({ hand }), 'easy')).not.toBeNull();
  });

  it('expert: returns a valid move for non-empty hand', () => {
    const hand = [makeCard(1, 'creature', 5)];
    const move = chooseAiMove(makeState({ hand }), 'expert');
    expect(move).not.toBeNull();
    expect(move?.cardId).toBe(1);
  });

  it('does not crash when no legal modifier target exists (empty fields)', () => {
    const hand = [makeCard(1, 'item', null, 3)];
    expect(() => chooseAiMove(makeState({ hand, ownField: [], oppField: [] }), 'hard')).not.toThrow();
  });
});
