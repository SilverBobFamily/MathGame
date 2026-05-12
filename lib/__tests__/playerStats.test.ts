import { computeAllStats } from '../playerStats';
import type { GameState, Side } from '../types';

function makeCard(id: number, name: string, releaseId: number, releaseName: string) {
  return {
    id, name, release_id: releaseId,
    release: { id: releaseId, name: releaseName, icon: '🔥', number: releaseId, color_hex: '#000', private: false },
    type: 'creature' as const, value: 5, operator: null, operator_value: null,
    effect_type: null, art_emoji: '🐉', art_url: null, flavor_text: '', effect_text: null,
  };
}

function makePlayerState(cards: Array<{ id: number; name: string; releaseId: number; releaseName: string }>) {
  return {
    deck: [], hand: [], aside: [], playedCount: 0,
    field: cards.map(c => ({
      card: makeCard(c.id, c.name, c.releaseId, c.releaseName),
      modifiers: [], zeroed: false,
    })),
  };
}

function makeGame(
  userId: string,
  isPlayer1: boolean,
  winnerId: string | null,
  playerCards: Array<{ id: number; name: string; releaseId: number; releaseName: string }>,
  customDeckId: string | null = null,
) {
  const myState = makePlayerState(playerCards);
  const theirState = makePlayerState([{ id: 999, name: 'Other', releaseId: 99, releaseName: 'Other' }]);
  return {
    player1_id: isPlayer1 ? userId : 'other-user',
    winner_id: winnerId,
    state_json: {
      phase: 'finished' as const,
      turn: 'player' as Side,
      firstTurn: 'player' as Side,
      round: 4,
      winner: null,
      pendingCard: null,
      learningMode: false,
      player: isPlayer1 ? myState : theirState,
      opponent: isPlayer1 ? theirState : myState,
      options: {
        handSize: 4, guaranteedEvent: false, maxPlays: 4, eventCount: 0,
        firstPlayer: 'player' as const, setAsideCount: 0, aiDifficulty: 'easy' as const,
        customDeckId,
      },
    } as GameState,
  };
}

const USER = 'user-1';

describe('computeAllStats', () => {
  it('returns nulls for no games', () => {
    const s = computeAllStats(USER, [], 0, []);
    expect(s.avgWinningMargin).toBeNull();
    expect(s.avgLosingMargin).toBeNull();
    expect(s.mostPlayedCard).toBeNull();
    expect(s.mostPlayedRelease).toBeNull();
    expect(s.favoriteDeck).toBeNull();
    expect(s.longestWinStreak).toBe(0);
  });

  it('passes through longestWinStreak from param', () => {
    expect(computeAllStats(USER, [], 7, []).longestWinStreak).toBe(7);
  });

  it('computes avgWinningMargin — both player1 and player2 perspective', () => {
    // Each game: my field has one creature value=5, their field has one creature value=5 → margin=0
    const games = [
      makeGame(USER, true, USER, [{ id: 1, name: 'A', releaseId: 1, releaseName: 'R' }]),
      makeGame(USER, false, USER, [{ id: 1, name: 'A', releaseId: 1, releaseName: 'R' }]),
    ];
    expect(computeAllStats(USER, games, 0, []).avgWinningMargin).toBe(0);
  });

  it('computes avgLosingMargin', () => {
    const games = [
      makeGame(USER, true, 'other-user', [{ id: 1, name: 'A', releaseId: 1, releaseName: 'R' }]),
    ];
    expect(computeAllStats(USER, games, 0, []).avgLosingMargin).toBe(0);
  });

  it('returns null avgWinningMargin when no wins', () => {
    const games = [makeGame(USER, true, 'other', [], null)];
    expect(computeAllStats(USER, games, 0, []).avgWinningMargin).toBeNull();
  });

  it('returns null avgLosingMargin when no losses', () => {
    const games = [makeGame(USER, true, USER, [], null)];
    expect(computeAllStats(USER, games, 0, []).avgLosingMargin).toBeNull();
  });

  it('excludes tied games from both margin calculations', () => {
    const games = [makeGame(USER, true, null, [{ id: 1, name: 'A', releaseId: 1, releaseName: 'R' }])];
    const s = computeAllStats(USER, games, 0, []);
    expect(s.avgWinningMargin).toBeNull();
    expect(s.avgLosingMargin).toBeNull();
  });

  it('computes avgLosingMargin from player2 perspective', () => {
    const games = [
      makeGame(USER, false, 'other-user', [{ id: 1, name: 'A', releaseId: 1, releaseName: 'R' }]),
    ];
    expect(computeAllStats(USER, games, 0, []).avgLosingMargin).toBe(0);
  });

  it('identifies most-played card by frequency', () => {
    const dragon = { id: 1, name: 'Dragon', releaseId: 1, releaseName: 'Myth' };
    const hydra = { id: 2, name: 'Hydra', releaseId: 1, releaseName: 'Myth' };
    const games = [
      makeGame(USER, true, USER, [dragon, hydra]),
      makeGame(USER, true, USER, [dragon]),
      makeGame(USER, false, 'other', [dragon]),
    ];
    const s = computeAllStats(USER, games, 0, []);
    expect(s.mostPlayedCard?.name).toBe('Dragon');
    expect(s.mostPlayedCard?.count).toBe(3);
  });

  it('identifies most-played release by total cards', () => {
    const games = [
      makeGame(USER, true, USER, [
        { id: 1, name: 'A', releaseId: 1, releaseName: 'Mythology' },
        { id: 2, name: 'B', releaseId: 1, releaseName: 'Mythology' },
      ]),
      makeGame(USER, true, USER, [{ id: 3, name: 'C', releaseId: 2, releaseName: 'Sports' }]),
    ];
    const s = computeAllStats(USER, games, 0, []);
    expect(s.mostPlayedRelease?.name).toBe('Mythology');
    expect(s.mostPlayedRelease?.count).toBe(2);
  });

  it('identifies favorite deck by customDeckId frequency', () => {
    const deckId = 'deck-abc';
    const games = [
      makeGame(USER, true, USER, [], deckId),
      makeGame(USER, true, USER, [], deckId),
      makeGame(USER, true, USER, [], null),
    ];
    const s = computeAllStats(USER, games, 0, [{ id: deckId, name: 'My Best Deck' }]);
    expect(s.favoriteDeck?.id).toBe(deckId);
    expect(s.favoriteDeck?.name).toBe('My Best Deck');
    expect(s.favoriteDeck?.count).toBe(2);
  });

  it('returns null favoriteDeck when all games used default deck', () => {
    const games = [makeGame(USER, true, USER, [], null)];
    expect(computeAllStats(USER, games, 0, []).favoriteDeck).toBeNull();
  });

  it('uses release name from card.release when available', () => {
    const games = [
      makeGame(USER, true, USER, [{ id: 1, name: 'X', releaseId: 5, releaseName: 'Named Release' }]),
    ];
    expect(computeAllStats(USER, games, 0, []).mostPlayedRelease?.name).toBe('Named Release');
  });

  it('falls back to "Release N" when release object is missing', () => {
    const game = makeGame(USER, true, USER, [{ id: 1, name: 'X', releaseId: 5, releaseName: 'Named Release' }]);
    // Strip the release object
    (game.state_json.player.field[0].card as { release?: unknown }).release = undefined;
    expect(computeAllStats(USER, [game], 0, []).mostPlayedRelease?.name).toBe('Release 5');
  });
});
