import { getPlayedCardType } from '../tutorialSteps';
import type { GameState } from '../types';

function makeState(hand: Array<{ id: number; type: string }>): GameState {
  return {
    phase: 'playing', turn: 'player', firstTurn: 'player', round: 1,
    winner: null, pendingCard: null, learningMode: false,
    options: { handSize: 4, guaranteedEvent: false, maxPlays: 4, eventCount: 0, firstPlayer: 'player', setAsideCount: 0, aiDifficulty: 'easy', customDeckId: null },
    player: { deck: [], hand: hand as never[], field: [], aside: [], playedCount: 0 },
    opponent: { deck: [], hand: [], field: [], aside: [], playedCount: 0 },
  };
}

describe('getPlayedCardType', () => {
  const fullHand = [
    { id: 1, type: 'creature' },
    { id: 2, type: 'item' },
    { id: 3, type: 'action' },
    { id: 4, type: 'event' },
  ];

  it('returns null when hand is unchanged', () => {
    const s = makeState(fullHand);
    expect(getPlayedCardType(s, s)).toBeNull();
  });

  it('detects creature played', () => {
    expect(getPlayedCardType(makeState(fullHand), makeState(fullHand.filter(c => c.id !== 1)))).toBe('creature');
  });

  it('detects item played', () => {
    expect(getPlayedCardType(makeState(fullHand), makeState(fullHand.filter(c => c.id !== 2)))).toBe('item');
  });

  it('detects action played', () => {
    expect(getPlayedCardType(makeState(fullHand), makeState(fullHand.filter(c => c.id !== 3)))).toBe('action');
  });

  it('detects event played', () => {
    expect(getPlayedCardType(makeState(fullHand), makeState(fullHand.filter(c => c.id !== 4)))).toBe('event');
  });

  it('returns null when hand grows (draw)', () => {
    const small = makeState(fullHand.slice(0, 2));
    const large = makeState(fullHand.slice(0, 3));
    expect(getPlayedCardType(small, large)).toBeNull();
  });
});
