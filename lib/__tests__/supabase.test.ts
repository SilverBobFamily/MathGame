// lib/__tests__/supabase.test.ts
// Prevent module-level createClient() from throwing in environments without env vars.
jest.mock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));

import { fetchOwnedCardIds } from '../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

function makeClient(rows: { card_id: number }[]): SupabaseClient {
  return {
    from: () => ({
      select: () => Promise.resolve({
        data: rows,
        error: null,
      }),
    }),
  } as unknown as SupabaseClient;
}

describe('fetchOwnedCardIds', () => {
  it('returns a Set of owned card IDs', async () => {
    const client = makeClient([{ card_id: 1 }, { card_id: 42 }]);
    const result = await fetchOwnedCardIds(client);
    expect(result).toBeInstanceOf(Set);
    expect(result.has(1)).toBe(true);
    expect(result.has(42)).toBe(true);
    expect(result.size).toBe(2);
  });

  it('returns an empty Set when player owns no cards', async () => {
    const client = makeClient([]);
    const result = await fetchOwnedCardIds(client);
    expect(result.size).toBe(0);
  });
});
