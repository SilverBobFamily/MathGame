import { scorePlay, type PuzzleCard } from '../puzzle';

const creature = (value: number): PuzzleCard => ({
  id: value * 100, name: `C${value}`, type: 'creature',
  value, operator: null, operator_value: null, art_emoji: '🐉', release_id: 1,
});

const item = (opVal: number): PuzzleCard => ({
  id: opVal * 1000, name: `Item+${opVal}`, type: 'item',
  value: null, operator: `+${opVal}`, operator_value: opVal, art_emoji: '⚔️', release_id: 1,
});

describe('scorePlay', () => {
  it('scores deploying a creature', () => {
    const field: PuzzleCard[] = [creature(5)];
    const result = scorePlay(field, creature(8), 'player', null);
    expect(result).toBe(13); // 5 + 8
  });

  it('scores applying an item to a creature already on field', () => {
    const field: PuzzleCard[] = [creature(5)];
    const result = scorePlay(field, item(3), 'player', field[0].id);
    expect(result).toBe(8); // 5 + 3
  });

  it('returns base field score when card is null', () => {
    const field: PuzzleCard[] = [creature(5), creature(3)];
    expect(scorePlay(field, null, 'player', null)).toBe(8);
  });
});
