import { computeScore } from './GameEngine';
import type { GameState, Side } from './types';

export interface PlayerStats {
  longestWinStreak: number;
  avgWinningMargin: number | null;
  avgLosingMargin: number | null;
  mostPlayedCard: { name: string; count: number } | null;
  mostPlayedRelease: { name: string; count: number } | null;
  favoriteDeck: { id: string; name: string; count: number } | null;
}

type GameRow = {
  player1_id: string;
  winner_id: string | null;
  state_json: GameState;
};

export function computeAllStats(
  userId: string,
  games: GameRow[],
  longestWinStreak: number,
  decks: Array<{ id: string; name: string }>,
): PlayerStats {
  const winningMargins: number[] = [];
  const losingMargins: number[] = [];
  const cardCounts: Record<string, number> = {};
  const releaseCounts: Record<string, number> = {};
  const deckIdCounts: Record<string, number> = {};

  for (const g of games) {
    const mySide: Side = g.player1_id === userId ? 'player' : 'opponent';
    const theirSide: Side = mySide === 'player' ? 'opponent' : 'player';

    const myScore = computeScore(g.state_json[mySide].field);
    const theirScore = computeScore(g.state_json[theirSide].field);

    if (g.winner_id === userId) {
      winningMargins.push(myScore - theirScore);
    } else if (g.winner_id !== null) {
      losingMargins.push(theirScore - myScore);
    }

    for (const fc of g.state_json[mySide].field) {
      const name = fc.card.name;
      cardCounts[name] = (cardCounts[name] ?? 0) + 1;
      const relName = fc.card.release?.name ?? `Release ${fc.card.release_id}`;
      releaseCounts[relName] = (releaseCounts[relName] ?? 0) + 1;
    }

    const deckId = g.state_json.options?.customDeckId;
    if (deckId) {
      deckIdCounts[deckId] = (deckIdCounts[deckId] ?? 0) + 1;
    }
  }

  const avg = (arr: number[]): number | null =>
    arr.length === 0 ? null : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

  const topEntry = (counts: Record<string, number>): { name: string; count: number } | null => {
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    const [name, count] = entries.reduce((best, cur) => (cur[1] > best[1] ? cur : best));
    return { name, count };
  };

  const topDeckEntry = Object.entries(deckIdCounts).reduce<{ id: string; count: number } | null>(
    (best, [id, count]) => (!best || count > best.count ? { id, count } : best),
    null,
  );

  const deckLookup = new Map(decks.map(d => [d.id, d.name]));

  return {
    longestWinStreak,
    avgWinningMargin: avg(winningMargins),
    avgLosingMargin: avg(losingMargins),
    mostPlayedCard: topEntry(cardCounts),
    mostPlayedRelease: topEntry(releaseCounts),
    favoriteDeck: topDeckEntry
      ? { id: topDeckEntry.id, name: deckLookup.get(topDeckEntry.id) ?? 'Unknown Deck', count: topDeckEntry.count }
      : null,
  };
}
