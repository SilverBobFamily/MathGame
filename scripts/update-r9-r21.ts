// scripts/update-r9-r21.ts
// One-time script: update R9 (Superheroes) and R21 (Baseball) cards.
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  // ── Get release IDs ──────────────────────────────────────────────────────
  const { data: releases, error: relErr } = await supabase
    .from('releases')
    .select('id, number')
    .in('number', [9, 21]);
  if (relErr) throw relErr;

  const r9id  = releases!.find(r => r.number === 9)!.id;
  const r21id = releases!.find(r => r.number === 21)!.id;
  console.log(`R9 id=${r9id}  R21 id=${r21id}`);

  // ════════════════════════════════════════════════════════════════════════
  // RELEASE 9 — SUPERHEROES
  // ════════════════════════════════════════════════════════════════════════

  // 1. Captain America → Green Lantern
  const { error: e1 } = await supabase.from('cards')
    .update({
      name: 'Green Lantern',
      art_emoji: '💚',
      flavor_text: 'His ring can create anything willpower can imagine. He has excellent willpower.',
    })
    .eq('release_id', r9id).eq('name', 'Captain America');
  if (e1) throw e1;
  console.log('✓ Captain America → Green Lantern');

  // 2. Nuclear Threat → Team-Up!
  const { error: e2 } = await supabase.from('cards')
    .update({
      name: 'Team-Up!',
      art_emoji: '🤝',
      effect_text: "×100: Multiply any one creature's value by 100.",
      flavor_text: 'Two heroes. One moment. The math gets out of hand fast.',
    })
    .eq('release_id', r9id).eq('name', 'Nuclear Threat');
  if (e2) throw e2;
  console.log('✓ Nuclear Threat → Team-Up!');

  // 3. Universe-Shattering Punch → No Capes!  ×(−10)
  const { error: e3 } = await supabase.from('cards')
    .update({
      name: 'No Capes!',
      operator: '×(-10)',
      operator_value: -10,
      art_emoji: '🧣',
      effect_text: "Multiply one creature's value by -10.",
      flavor_text: 'Edna Mode was right. The cape is a liability. Specifically, a negative-ten-times liability.',
    })
    .eq('release_id', r9id).eq('name', 'Universe-Shattering Punch');
  if (e3) throw e3;
  console.log('✓ Universe-Shattering Punch → No Capes! ×(−10)');

  // 4. Infinity Boost → Mutant Gene
  const { error: e4 } = await supabase.from('cards')
    .update({
      name: 'Mutant Gene',
      art_emoji: '🧬',
      effect_text: 'Add +5 to one creature.',
      flavor_text: 'The X-gene activates. Something extraordinary happens next.',
    })
    .eq('release_id', r9id).eq('name', 'Infinity Boost');
  if (e4) throw e4;
  console.log('✓ Infinity Boost → Mutant Gene');

  // ════════════════════════════════════════════════════════════════════════
  // RELEASE 21 — BASEBALL  (creatures)
  // ════════════════════════════════════════════════════════════════════════

  // Delete all existing creatures for R21
  const { error: delErr } = await supabase.from('cards')
    .delete()
    .eq('release_id', r21id).eq('type', 'creature');
  if (delErr) throw delErr;
  console.log('✓ Deleted old R21 creatures');

  // Insert the 14 real players
  const newCreatures = [
    { name: 'Babe Ruth',          value: 10, art_emoji: '🏟️', flavor_text: 'Called his shot. Hit it. Said nothing more.' },
    { name: 'Mickey Mantle',      value:  9, art_emoji: '⚡',  flavor_text: 'Switch hitter. Tape-covered knees. Played through everything.' },
    { name: 'Ted Williams',       value:  7, art_emoji: '🎯',  flavor_text: 'Last man to hit .400. Served in two wars. Still found time to be the greatest hitter alive.' },
    { name: 'Ken Griffey Jr.',    value:  6, art_emoji: '😊',  flavor_text: 'The most natural swing in history. Also the hat.' },
    { name: 'Shohei Ohtani',      value:  6, art_emoji: '🌟',  flavor_text: 'Pitches on Monday. Bats cleanup on Tuesday. Does not understand why others cannot.' },
    { name: 'Sandy Koufax',       value:  5, art_emoji: '🔥',  flavor_text: 'Four Cy Young Awards in five years. Then he retired at thirty. Nobody argued.' },
    { name: 'Mariano Rivera',     value:  5, art_emoji: '✂️',  flavor_text: 'One pitch. Nobody could hit it. The only unanimous Hall of Famer.' },
    { name: 'Satchel Paige',      value:  4, art_emoji: '🌙',  flavor_text: 'Kept from the majors for decades. Arrived anyway. Dominated anyway.' },
    { name: 'Hank Greenberg',     value:  4, art_emoji: '✡️',  flavor_text: 'Took two years off to fight in World War II. Still finished with 331 home runs.' },
    { name: 'Aaron Judge',        value:  3, art_emoji: '👑',  flavor_text: 'Broke the American League home run record. All rise.' },
    { name: 'Ricky Henderson',    value:  2, art_emoji: '💨',  flavor_text: 'Stole 1,406 bases. Would like you to know that.' },
    { name: 'Casey Stengel',      value:  1, art_emoji: '📋',  flavor_text: 'Won seven World Series as manager. Had opinions about everyone. Shared all of them.' },
    { name: 'Nomar Garciaparra',  value: -2, art_emoji: '💔',  flavor_text: 'Best shortstop of his era for three brilliant years. Then injuries. Then the trade.' },
    { name: 'Mark McGwire',       value: -4, art_emoji: '💊',  flavor_text: 'Hit 70 home runs. Congress had questions.' },
  ].map(c => ({ ...c, type: 'creature', release_id: r21id }));

  const { error: insErr } = await supabase.from('cards').insert(newCreatures);
  if (insErr) throw insErr;
  console.log('✓ Inserted 14 new R21 creatures');

  // ════════════════════════════════════════════════════════════════════════
  // RELEASE 21 — BASEBALL  (items)
  // ════════════════════════════════════════════════════════════════════════

  // Pine Tar → MVP Award (+3)
  const { error: e5 } = await supabase.from('cards')
    .update({
      name: 'MVP Award',
      operator: '+3',
      operator_value: 3,
      art_emoji: '🏅',
      effect_text: 'Add +3 to one creature.',
      flavor_text: 'Most Valuable Player. The committee actually agreed.',
    })
    .eq('release_id', r21id).eq('name', 'Pine Tar');
  if (e5) throw e5;
  console.log('✓ Pine Tar → MVP Award (+3)');

  // Signed Baseball → Rookie of the Year
  const { error: e6 } = await supabase.from('cards')
    .update({
      name: 'Rookie of the Year',
      art_emoji: '⭐',
      effect_text: 'Add +5 to one creature.',
      flavor_text: 'Best first-year player in the league. The plaque looks great.',
    })
    .eq('release_id', r21id).eq('name', 'Signed Baseball');
  if (e6) throw e6;
  console.log('✓ Signed Baseball → Rookie of the Year (+5)');

  // Pennant Win → Cy Young Award
  const { error: e7 } = await supabase.from('cards')
    .update({
      name: 'Cy Young Award',
      art_emoji: '🏆',
      effect_text: 'Add +5 to one creature.',
      flavor_text: 'Best pitcher in the league. Named for the man who won 511 games.',
    })
    .eq('release_id', r21id).eq('name', 'Pennant Win');
  if (e7) throw e7;
  console.log('✓ Pennant Win → Cy Young Award (+5)');

  console.log('\nAll done!');
}

main().catch(err => { console.error(err); process.exit(1); });
