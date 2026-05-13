import { createSupabaseBrowserClient } from './supabase-browser';

export interface CampaignChapter {
  id: number;
  arc_id: number;
  sort_order: number;
  title: string;
  ai_opponent_name: string;
  ai_difficulty: 'easy' | 'normal' | 'hard' | 'expert';
  narrative_intro: string;
  narrative_outro_win: string;
  narrative_outro_loss: string;
  xp_reward: number;
  win_condition: 'win' | 'win_by_margin';
  win_param: number | null;
}

export interface CampaignArc {
  id: number;
  title: string;
  theme_emoji: string;
  sort_order: number;
  badge_emoji: string;
  badge_name: string;
  badge_description: string;
  chapters: CampaignChapter[];
}

export function isChapterUnlocked(
  chapter: CampaignChapter,
  completedIds: Set<number>,
  allChapters: CampaignChapter[],
): boolean {
  const arcChapters = allChapters
    .filter(c => c.arc_id === chapter.arc_id)
    .sort((a, b) => a.sort_order - b.sort_order);
  const idx = arcChapters.findIndex(c => c.id === chapter.id);
  if (idx === 0) return true;
  return completedIds.has(arcChapters[idx - 1].id);
}

export async function getCampaignData(): Promise<CampaignArc[]> {
  const supabase = createSupabaseBrowserClient();
  const { data: arcs, error: arcErr } = await supabase
    .from('campaign_arcs')
    .select('*')
    .order('sort_order');
  if (arcErr) throw new Error(arcErr.message);

  const { data: chapters, error: chErr } = await supabase
    .from('campaign_chapters')
    .select('*')
    .order('sort_order');
  if (chErr) throw new Error(chErr.message);

  return (arcs ?? []).map(arc => ({
    ...arc,
    chapters: (chapters ?? []).filter(c => c.arc_id === arc.id),
  }));
}

export async function getPlayerCampaignProgress(userId: string): Promise<Set<number>> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('player_campaign_progress')
    .select('chapter_id')
    .eq('player_id', userId)
    .eq('passed', true);
  if (error) throw new Error(error.message);
  return new Set((data ?? []).map(r => r.chapter_id));
}

export async function getChapterById(chapterId: number): Promise<CampaignChapter | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('campaign_chapters')
    .select('*')
    .eq('id', chapterId)
    .single();
  if (error) return null;
  return data as CampaignChapter;
}
