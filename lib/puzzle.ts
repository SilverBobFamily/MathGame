import { createSupabaseBrowserClient } from './supabase-browser';

export interface PuzzleCard {
  id: number;
  name: string;
  type: 'creature' | 'item' | 'action' | 'event';
  value: number | null;
  operator: string | null;
  operator_value: number | null;
  art_emoji: string;
  release_id: number;
}

export interface DailyPuzzle {
  id: number;
  rotation_index: number;
  title: string;
  description: string;
  opponent_field: PuzzleCard[];
  player_field: PuzzleCard[];
  player_hand: PuzzleCard[];
  solution_card_id: number;
  solution_target_side: 'player' | 'opponent';
  solution_target_creature_id: number | null;
  explanation: string;
  xp_reward: number;
}

export interface PuzzleRawRow {
  id: number;
  rotation_index: number;
  title: string;
  description: string;
  opponent_field_card_ids: number[];
  player_field_card_ids: number[];
  player_hand_card_ids: number[];
  solution_card_id: number;
  solution_target_side: string;
  solution_target_creature_id: number | null;
  explanation: string;
  xp_reward: number;
}

export function scorePlay(
  currentField: PuzzleCard[],
  card: PuzzleCard | null,
  _targetSide: 'player' | 'opponent',
  targetCreatureId: number | null,
): number {
  if (card === null) {
    return currentField.reduce((sum, fc) => sum + (fc.value ?? 0), 0);
  }

  if (card.type === 'creature') {
    return currentField.reduce((sum, fc) => sum + (fc.value ?? 0), 0) + (card.value ?? 0);
  }

  const opVal = card.operator_value ?? 0;
  return currentField.reduce((sum, fc) => {
    const base = fc.value ?? 0;
    if (fc.id === targetCreatureId) {
      if (card.operator?.startsWith('×')) return sum + base * opVal;
      if (card.operator?.startsWith('÷')) return sum + (opVal !== 0 ? base / opVal : base);
      if (card.operator?.startsWith('-')) return sum + base - opVal;
      return sum + base + opVal;
    }
    return sum + base;
  }, 0);
}

async function fetchCardsByIds(ids: number[]): Promise<PuzzleCard[]> {
  if (ids.length === 0) return [];
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('cards')
    .select('id, name, type, value, operator, operator_value, art_emoji, release_id')
    .in('id', ids);
  if (error) throw new Error(error.message);
  const map = new Map((data ?? []).map(c => [c.id, c as PuzzleCard]));
  return ids.map(id => map.get(id)!).filter(Boolean);
}

export async function getTodayPuzzle(): Promise<DailyPuzzle | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.rpc('get_today_puzzle');
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;

  const row = data[0] as PuzzleRawRow;
  const allIds = [
    ...row.opponent_field_card_ids,
    ...row.player_field_card_ids,
    ...row.player_hand_card_ids,
  ];
  const unique = [...new Set(allIds)];
  const cards = await fetchCardsByIds(unique);
  if (cards.length !== unique.length) {
    throw new Error(`Puzzle card fetch incomplete: expected ${unique.length}, got ${cards.length}`);
  }
  const byId = new Map(cards.map(c => [c.id, c]));
  const pick = (ids: number[]) => ids.map(id => byId.get(id)!).filter(Boolean);

  return {
    id: row.id,
    rotation_index: row.rotation_index,
    title: row.title,
    description: row.description,
    opponent_field: pick(row.opponent_field_card_ids),
    player_field: pick(row.player_field_card_ids),
    player_hand: pick(row.player_hand_card_ids),
    solution_card_id: row.solution_card_id,
    solution_target_side: row.solution_target_side as 'player' | 'opponent',
    solution_target_creature_id: row.solution_target_creature_id,
    explanation: row.explanation,
    xp_reward: row.xp_reward,
  };
}
