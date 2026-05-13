import { isChapterUnlocked, type CampaignChapter } from '../campaign';

const ch = (id: number, sortOrder: number, arcId: number): CampaignChapter => ({
  id, arc_id: arcId, sort_order: sortOrder,
  title: `Ch${id}`, ai_opponent_name: 'Test', ai_difficulty: 'easy',
  narrative_intro: '', narrative_outro_win: '', narrative_outro_loss: '',
  xp_reward: 50, win_condition: 'win', win_param: null,
});

describe('isChapterUnlocked', () => {
  const chapters = [ch(1, 1, 1), ch(2, 2, 1), ch(3, 3, 1)];

  it('first chapter of any arc is always unlocked', () => {
    expect(isChapterUnlocked(chapters[0], new Set(), chapters)).toBe(true);
  });

  it('subsequent chapter requires previous to be completed', () => {
    expect(isChapterUnlocked(chapters[1], new Set(), chapters)).toBe(false);
    expect(isChapterUnlocked(chapters[1], new Set([1]), chapters)).toBe(true);
  });

  it('chapter 3 requires chapter 2 to be completed (not 1)', () => {
    expect(isChapterUnlocked(chapters[2], new Set([1]), chapters)).toBe(false);
    expect(isChapterUnlocked(chapters[2], new Set([2]), chapters)).toBe(true);
  });
});
