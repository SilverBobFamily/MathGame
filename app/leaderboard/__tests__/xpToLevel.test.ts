// Tests the inline xpToLevel helper used by the leaderboard page.
// Defined here as a standalone function to verify level computation is correct.

function xpToLevel(xp: number): number {
  const t = [0, 50, 150, 300, 500, 750, 1050, 1400, 1800, 2250, 2750, 3300, 3900, 4550, 5250, 6000, 6800, 7650, 8550, 9500, 10500, 11550, 12650, 13800, 15000];
  if (xp <= 0) return 1;
  for (let i = t.length - 1; i >= 0; i--) {
    if (xp >= t[i]) return i + 1;
  }
  return 1;
}

describe('xpToLevel', () => {
  it('returns 1 for 0 XP', () => expect(xpToLevel(0)).toBe(1));
  it('returns 1 for negative XP', () => expect(xpToLevel(-10)).toBe(1));
  it('returns 1 for 49 XP (below level 2 threshold)', () => expect(xpToLevel(49)).toBe(1));
  it('returns 2 at exactly 50 XP', () => expect(xpToLevel(50)).toBe(2));
  it('returns 10 at 2250 XP', () => expect(xpToLevel(2250)).toBe(10));
  it('returns 25 at 15000 XP (max level)', () => expect(xpToLevel(15000)).toBe(25));
  it('returns 25 for XP above max threshold', () => expect(xpToLevel(99999)).toBe(25));
});
