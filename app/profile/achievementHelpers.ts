export function isUnlocked(achievement: { unlocked_at: string | null }): boolean {
  return achievement.unlocked_at !== null;
}
