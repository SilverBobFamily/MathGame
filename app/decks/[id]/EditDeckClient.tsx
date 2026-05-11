'use client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { updateDeck } from '@/lib/decks';
import { fetchCardsByIds } from '@/lib/supabase';
import DeckBuilder from '@/components/DeckBuilder';
import type { Card, DeckWithCards } from '@/lib/types';

interface Props {
  deck: DeckWithCards;
}

export default function EditDeckClient({ deck }: Props) {
  const router = useRouter();

  const handleSave = useCallback(async (name: string, cardIds: number[]) => {
    const supabase = createSupabaseBrowserClient();
    const cards = await fetchCardsByIds(cardIds, supabase);
    const cardMap = new Map<number, Card>(cards.map(c => [c.id, c]));
    await updateDeck(deck.id, name, cardIds, cardMap, supabase);
    router.push('/decks');
  }, [deck.id, router]);

  const handleCancel = useCallback(() => {
    router.push('/decks');
  }, [router]);

  return (
    <div>
      <div style={{ padding: '16px 28px 8px', borderBottom: '1px solid #1a1a1a' }}>
        <h1 style={{
          color: '#c9a84c', margin: 0,
          fontFamily: "'Cinzel', serif", fontSize: '1em',
          letterSpacing: '0.08em', fontWeight: 700,
        }}>
          Edit Deck
        </h1>
      </div>
      <DeckBuilder initialDeck={deck} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
}
