import { questDifficultyColor, formatQuestDate } from '../quests';

describe('questDifficultyColor', () => {
  it('returns green for easy', () => {
    expect(questDifficultyColor('easy')).toBe('#a5d6a7');
  });
  it('returns yellow for medium', () => {
    expect(questDifficultyColor('medium')).toBe('#ffd54f');
  });
  it('returns red for hard', () => {
    expect(questDifficultyColor('hard')).toBe('#ef9a9a');
  });
});

describe('formatQuestDate', () => {
  it('returns "Today" for the current UTC date', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatQuestDate(today)).toBe('Today');
  });
  it('returns "Yesterday" for yesterday', () => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    expect(formatQuestDate(d.toISOString().split('T')[0])).toBe('Yesterday');
  });
  it('returns the ISO string for older dates', () => {
    expect(formatQuestDate('2020-01-01')).toBe('2020-01-01');
  });
});
