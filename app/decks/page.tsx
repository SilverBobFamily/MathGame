import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import DecksClient from './DecksClient';

export default async function DecksPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: decks } = await supabase
    .from('decks')
    .select('id, name, card_ids, created_at, updated_at')
    .order('updated_at', { ascending: false });

  // Lightweight card-type index for computing type counts
  const { data: cardTypes } = await supabase
    .from('cards')
    .select('id, type');

  const typeMap = new Map<number, string>(
    (cardTypes ?? []).map((c: { id: number; type: string }) => [c.id, c.type])
  );

  return <DecksClient initialDecks={decks ?? []} typeMap={Object.fromEntries(typeMap)} />;
}
