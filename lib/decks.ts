import type { SupabaseClient } from '@supabase/supabase-js';
import type { Card, CardType, Deck, DeckWithCards } from './types';
import { fetchCardsByIds } from './supabase';

export const DECK_SIZE = 40;
export const REQUIRED_EVENTS = 3;
export const MIN_CREATURES = 10;
export const MAX_COPIES = 1;
export const RECOMMENDED: Record<CardType, number> = {
  creature: 20,
  item: 10,
  action: 7,
  event: 3,
};

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
  typeCounts: Record<CardType, number>;
}

export function validateDeck(
  cardIds: number[],
  cardMap: Map<number, Card>,
  ownedCardIds?: Set<number>,
): DeckValidationResult {
  const typeCounts: Record<CardType, number> = { creature: 0, item: 0, action: 0, event: 0 };
  const copyCounts = new Map<number, number>();
  const errors: string[] = [];

  for (const id of cardIds) {
    const card = cardMap.get(id);
    if (!card) continue;
    typeCounts[card.type]++;
    copyCounts.set(id, (copyCounts.get(id) ?? 0) + 1);

    if (ownedCardIds && !ownedCardIds.has(id)) {
      errors.push(`Card "${card.name}" is not owned`);
    }
  }

  if (cardIds.length !== DECK_SIZE) {
    errors.push(`Deck must have exactly ${DECK_SIZE} cards (currently ${cardIds.length})`);
  }
  if (typeCounts.event !== REQUIRED_EVENTS) {
    errors.push(`Deck must have exactly ${REQUIRED_EVENTS} event cards (currently ${typeCounts.event})`);
  }
  if (typeCounts.creature < MIN_CREATURES) {
    errors.push(`Deck must have at least ${MIN_CREATURES} creatures (currently ${typeCounts.creature})`);
  }
  for (const [id, count] of copyCounts) {
    if (count > MAX_COPIES) {
      const card = cardMap.get(id);
      errors.push(`Max ${MAX_COPIES} copies of any card (${card?.name ?? id} has ${count})`);
    }
  }

  return { valid: errors.length === 0, errors, typeCounts };
}

export async function fetchDecks(client: SupabaseClient): Promise<Deck[]> {
  const { data, error } = await client
    .from('decks')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchDeckWithCards(id: string, client: SupabaseClient): Promise<DeckWithCards> {
  const { data, error } = await client
    .from('decks')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  const deck = data as Deck;
  const cards = await fetchCardsByIds(deck.card_ids, client);
  return { ...deck, cards };
}

export async function createDeck(
  name: string,
  cardIds: number[],
  cardMap: Map<number, Card>,
  client: SupabaseClient,
): Promise<Deck> {
  const { valid, errors } = validateDeck(cardIds, cardMap);
  if (!valid) throw new Error(errors[0]);
  const { data, error } = await client
    .from('decks')
    .insert({ name, card_ids: cardIds })
    .select()
    .single();
  if (error) throw error;
  return data as Deck;
}

export async function updateDeck(
  id: string,
  name: string,
  cardIds: number[],
  cardMap: Map<number, Card>,
  client: SupabaseClient,
): Promise<Deck> {
  const { valid, errors } = validateDeck(cardIds, cardMap);
  if (!valid) throw new Error(errors[0]);
  const { data, error } = await client
    .from('decks')
    .update({ name, card_ids: cardIds })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Deck;
}

export async function deleteDeck(id: string, client: SupabaseClient): Promise<void> {
  const { error } = await client.from('decks').delete().eq('id', id);
  if (error) throw error;
}
