import { createSupabaseBrowserClient } from './supabase-browser';

export interface DailyQuest {
  id: string;
  quest_id: number;
  key: string;
  name: string;
  description: string;
  icon_emoji: string;
  xp_reward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completed: boolean;
  completed_at: string | null;
}

export function questDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  if (difficulty === 'easy')   return '#a5d6a7';
  if (difficulty === 'medium') return '#ffd54f';
  return '#ef9a9a';
}

export function formatQuestDate(isoDate: string): string {
  const todayUtc = new Date().toISOString().split('T')[0];
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  const yestUtc = d.toISOString().split('T')[0];
  if (isoDate === todayUtc) return 'Today';
  if (isoDate === yestUtc)  return 'Yesterday';
  return isoDate;
}

export async function drawDailyQuests(userId: string): Promise<DailyQuest[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc('draw_daily_quests', { p_player_id: userId });
  if (error) throw new Error(error.message);
  return (data ?? []) as DailyQuest[];
}
