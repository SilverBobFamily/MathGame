import {
  XP_WIN, XP_LOSS, XP_TIE,
  LEVELS,
  xpToLevel,
  levelToTitle,
  xpProgress,
} from '../xp';

describe('XP constants', () => {
  it('XP_WIN > XP_TIE > XP_LOSS', () => {
    expect(XP_WIN).toBeGreaterThan(XP_TIE);
    expect(XP_TIE).toBeGreaterThan(XP_LOSS);
  });
});

describe('xpToLevel', () => {
  it('returns 1 for 0 XP', () => {
    expect(xpToLevel(0)).toBe(1);
  });

  it('returns 1 for negative XP (guard)', () => {
    expect(xpToLevel(-100)).toBe(1);
  });

  it('advances at the threshold boundary', () => {
    const lvl2xp = LEVELS[1].minXp;
    expect(xpToLevel(lvl2xp - 1)).toBe(1);
    expect(xpToLevel(lvl2xp)).toBe(2);
  });

  it('returns level 10 at the level-10 threshold', () => {
    expect(xpToLevel(LEVELS[9].minXp)).toBe(10);
  });

  it('returns max table level for XP above the highest entry', () => {
    expect(xpToLevel(999_999)).toBe(LEVELS.length);
  });
});

describe('levelToTitle', () => {
  it('returns Apprentice for level 1', () => {
    expect(levelToTitle(1)).toBe('Apprentice');
  });

  it('returns Arithmancer for level 10', () => {
    expect(levelToTitle(10)).toBe('Arithmancer');
  });

  it('returns Grand Multiplier for level 25', () => {
    expect(levelToTitle(25)).toBe('Grand Multiplier');
  });

  it('returns last title for levels beyond the table', () => {
    expect(levelToTitle(9999)).toBe(LEVELS[LEVELS.length - 1].title);
  });
});

describe('xpProgress', () => {
  it('returns current and needed for a mid-level player', () => {
    const midpoint = LEVELS[1].minXp + 10;
    const p = xpProgress(midpoint);
    expect(p.current).toBe(10);
    expect(p.needed).toBe(LEVELS[2].minXp - LEVELS[1].minXp);
  });

  it('at level 1 with 0 XP, needed = gap to level 2', () => {
    const p = xpProgress(0);
    expect(p.current).toBe(0);
    expect(p.needed).toBe(LEVELS[1].minXp);
  });

  it('at max-table level, needed=0 (no next level)', () => {
    const p = xpProgress(999_999);
    expect(p.needed).toBe(0);
  });
});
