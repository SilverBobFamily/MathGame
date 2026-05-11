import { redirect, notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { fetchCardsByIds } from '@/lib/supabase';
import EditDeckClient from './EditDeckClient';
import type { DeckWithCards } from '@/lib/types';

export default async function EditDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: deck } = await supabase
    .from('decks')
    .select('*')
    .eq('id', id)
    .single();

  if (!deck || deck.player_id !== user.id) notFound();

  const cards = await fetchCardsByIds(deck.card_ids, supabase);
  const deckWithCards: DeckWithCards = { ...deck, cards };

  return <EditDeckClient deck={deckWithCards} />;
}
