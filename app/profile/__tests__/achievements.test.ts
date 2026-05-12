import { isUnlocked } from '../achievementHelpers';

describe('isUnlocked', () => {
  it('returns true when unlocked_at is a date string', () => {
    expect(isUnlocked({ unlocked_at: '2026-05-12T00:00:00Z' })).toBe(true);
  });
  it('returns false when unlocked_at is null', () => {
    expect(isUnlocked({ unlocked_at: null })).toBe(false);
  });
});
