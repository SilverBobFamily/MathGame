import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // Step 1: Create the 6 missing release rows
  const newReleases = [
    { number: 49, name: 'Anime',             icon: '🌸', color_hex: '#e91e63' },
    { number: 50, name: 'Video Games',       icon: '🎮', color_hex: '#1565c0' },
    { number: 51, name: 'US Presidents',     icon: '🎩', color_hex: '#1a237e' },
    { number: 52, name: 'World History',     icon: '📜', color_hex: '#3e2723' },
    { number: 53, name: 'Famous Landmarks',  icon: '🗼', color_hex: '#00695c' },
    { number: 54, name: 'Soccer',            icon: '⚽', color_hex: '#1b5e20' },
  ];
  const { data: newRows, error: e1 } = await sb.from('releases')
    .upsert(newReleases, { onConflict: 'number' }).select('id,number,name');
  if (e1) { console.error('Create releases error:', e1); process.exit(1); }
  console.log('Created releases:', newRows!.map(r => `R${r.number}=${r.name}(id=${r.id})`).join(', '));

  const getRelId = (num: number) => newRows!.find(r => r.number === num)!.id;

  // Step 2: Restore SilverBobs (release id=79, number=41)
  const { error: e2 } = await sb.from('releases').update({
    name: 'SilverBobs', icon: '🩶', color_hex: '#9e9e9e'
  }).eq('id', 79);
  if (e2) { console.error('SilverBobs restore error:', e2); process.exit(1); }
  console.log('Restored SilverBobs (id=79)');

  // Step 3: Move Video Games cards (1381-1410) from release_id=83 → R50
  const { error: e3 } = await sb.from('cards').update({ release_id: getRelId(50) })
    .gte('id', 1381).lte('id', 1410);
  if (e3) { console.error('Video Games move error:', e3); process.exit(1); }
  console.log('Moved Video Games cards → R50');

  // Step 4: Move US Presidents cards (1411-1440) from release_id=84 → R51
  const { error: e4 } = await sb.from('cards').update({ release_id: getRelId(51) })
    .gte('id', 1411).lte('id', 1440);
  if (e4) { console.error('US Presidents move error:', e4); process.exit(1); }
  console.log('Moved US Presidents cards → R51');

  // Step 5: Move Famous Landmarks cards (1561-1590) from release_id=83 → R53
  const { error: e5 } = await sb.from('cards').update({ release_id: getRelId(53) })
    .gte('id', 1561).lte('id', 1590);
  if (e5) { console.error('Famous Landmarks move error:', e5); process.exit(1); }
  console.log('Moved Famous Landmarks cards → R53');

  // Step 6: Move Soccer cards (1591-1620) from release_id=79 → R54
  const { error: e6 } = await sb.from('cards').update({ release_id: getRelId(54) })
    .gte('id', 1591).lte('id', 1620);
  if (e6) { console.error('Soccer move error:', e6); process.exit(1); }
  console.log('Moved Soccer cards → R54');

  // Step 7: Verify final state
  const { data: releases } = await sb.from('releases').select('id,number,name').gte('number', 41).order('number');
  for (const r of releases!) {
    const { count } = await sb.from('cards').select('*', { count: 'exact', head: true }).eq('release_id', r.id);
    console.log(`  R${r.number} "${r.name}" (id=${r.id}): ${count} cards`);
  }
}
main();
