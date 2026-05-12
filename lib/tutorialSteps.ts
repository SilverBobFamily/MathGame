import type { GameState } from './types';

export function getPlayedCardType(prev: GameState, next: GameState): string | null {
  if (next.player.hand.length >= prev.player.hand.length) return null;
  const removed = prev.player.hand.find(c => !next.player.hand.some(nc => nc.id === c.id));
  return removed?.type ?? null;
}
