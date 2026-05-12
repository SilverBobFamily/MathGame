import { createSupabaseBrowserClient } from './supabase-browser';

export interface PlayerProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  coins: number;
  games_won: number;
  games_played: number;
  xp: number;
  created_at: string;
}

export async function getProfile(userId: string): Promise<PlayerProfile | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('players')
    .select('id, username, avatar_url, coins, games_won, games_played, xp, created_at')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return (data as PlayerProfile) ?? null;
}

export async function getProfileByUsername(username: string): Promise<PlayerProfile | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('players')
    .select('id, username, avatar_url, coins, games_won, games_played, xp, created_at')
    .eq('username', username)
    .single();
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return (data as PlayerProfile) ?? null;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);

  const { error: updateError } = await supabase
    .from('players')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId);
  if (updateError) throw new Error(updateError.message);

  return `${data.publicUrl}?v=${Date.now()}`;
}
