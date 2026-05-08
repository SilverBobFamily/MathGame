import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function main() {
  // Create a new release row for SilverBobs (number=24, preserving original metadata)
  const { data: release, error: relErr } = await sb
    .from('releases')
    .insert({ number: 41, name: 'SilverBobs', icon: '🩶', color_hex: '#9e9e9e' })
    .select()
    .single();
  if (relErr) { console.error('Release insert error:', relErr); process.exit(1); }
  console.log(`Created SilverBobs release: db id=${release.id}, number=24`);

  // Move the 45 orphaned cards (IDs 241–285) to the new release
  const ids = Array.from({ length: 45 }, (_, i) => i + 241);
  const { error: cardErr, count } = await sb
    .from('cards')
    .update({ release_id: release.id })
    .in('id', ids);
  if (cardErr) { console.error('Cards update error:', cardErr); process.exit(1); }
  console.log(`Reassigned ${ids.length} SilverBobs cards to release id=${release.id}`);

  // Verify
  const { count: remaining } = await sb
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('release_id', 11);
  console.log(`Underwater (release_id=11) now has ${remaining} cards`);

  const { count: moved } = await sb
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('release_id', release.id);
  console.log(`SilverBobs (release_id=${release.id}) now has ${moved} cards`);
}
main();
