import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const updates = [
  { id: 990, name: 'The Phantom of the Opera', art_emoji: '🕯️', flavor_text: 'Haunts the Paris Opéra from beneath it. The chandelier crash was not an accident.' },
  { id: 992, name: 'Meryl Streep',             art_emoji: '⭐',  flavor_text: 'Three Oscars. Infinite accents. Forty years of making it look completely effortless.' },
  { id: 993, name: 'Hamlet',                   art_emoji: '💀',  flavor_text: 'To be or not to be. He chose the dramatic option every time.' },
  { id: 994, name: 'Cyrano de Bergerac',        art_emoji: '👃',  flavor_text: 'The nose was never the point. The words were always what mattered.' },
  { id: 995, name: 'Elphaba',                   art_emoji: '🌿',  flavor_text: 'Defied gravity. Gravity was only the beginning of what she defied.' },
  { id: 996, name: 'Romeo',                     art_emoji: '🌹',  flavor_text: 'Met someone at a party. Made it everyone\'s problem.' },
  { id: 997, name: 'Laurence Olivier',          art_emoji: '🎬',  flavor_text: 'Could play anything. Did play everything. Defined what the stage looked like for a generation.' },
  { id: 998, name: 'Sweeney Todd',              art_emoji: '✂️',  flavor_text: 'The demon barber of Fleet Street. The worst haircut you will ever receive.' },
  { id: 1001, name: 'The Method Actor',         art_emoji: '🎪',  flavor_text: 'Has lived the role for six months. Nobody remembers what they were like before.' },
];

async function main() {
  for (const u of updates) {
    const { error } = await sb.from('cards').update({ name: u.name, art_emoji: u.art_emoji, flavor_text: u.flavor_text }).eq('id', u.id);
    if (error) { console.error(`Error updating ${u.id}:`, error); process.exit(1); }
    console.log(`✓ ${u.id} → ${u.name}`);
  }
  console.log('Done.');
}
main();
