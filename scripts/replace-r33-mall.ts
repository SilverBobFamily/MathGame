import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const release = { number: 33, name: 'The Mall', icon: '🛍️', color_hex: '#0891b2' };

const r33Cards = [
  // --- CREATURES ---
  { name: 'The Food Court',              type: 'creature', value: 10, art_emoji: '🍔', flavor_text: 'Eight cuisines. One communal destiny. The true heart of the mall.' },
  { name: 'The Anchor Store',            type: 'creature', value:  9, art_emoji: '🏬', flavor_text: 'Macy\'s. Nordstrom. One of those. Without it, the entire wing loses meaning.' },
  { name: 'The Bookstore',               type: 'creature', value:  7, art_emoji: '📚', flavor_text: 'The last one standing. Still here. Still good. Refuses to go quietly.' },
  { name: 'The Apple Store',             type: 'creature', value:  6, art_emoji: '🍎', flavor_text: 'Costs too much. Always crowded. Nobody leaves without something.' },
  { name: "Auntie Anne's",               type: 'creature', value:  5, art_emoji: '🥨', flavor_text: 'The smell reaches you from 200 feet away. Resistance is pointless.' },
  { name: 'The Movie Theater',           type: 'creature', value:  5, art_emoji: '🎬', flavor_text: 'Technically in the mall. Emotionally its own planet.' },
  { name: 'Hot Topic',                   type: 'creature', value:  4, art_emoji: '🖤', flavor_text: 'Has not changed since 2003. This is, somehow, a comfort.' },
  { name: 'The Kiosk Vendor',            type: 'creature', value:  3, art_emoji: '📱', flavor_text: 'Steps directly into your path. Has a question about your phone case.' },
  { name: "Spencer's Gifts",             type: 'creature', value:  3, art_emoji: '🎁', flavor_text: 'Nobody knows why it exists. Nobody can explain why it\'s still here.' },
  { name: 'The Mall Security Guard',     type: 'creature', value:  2, art_emoji: '🚗', flavor_text: 'Drives the little cart. Has seen everything. Intervenes in nothing.' },
  { name: 'The Lost Child',              type: 'creature', value:  1, art_emoji: '📢', flavor_text: 'Currently being paged over the PA. Located but not ready to be found.' },
  { name: 'The Empty Storefront',        type: 'creature', value:  0, art_emoji: '🪟', flavor_text: '"Coming Soon." Has been coming soon for fourteen months.' },
  { name: 'The Perpetual Closing Sale',  type: 'creature', value: -2, art_emoji: '🏷️', flavor_text: '"Everything Must Go." Has been going since 2021. Nothing has gone.' },
  { name: 'The Dead Anchor',             type: 'creature', value: -4, art_emoji: '💀', flavor_text: 'The Sears that closed. The wing it occupied has never recovered.' },
  // --- ITEMS ---
  { name: 'Mall Map',            type: 'item', operator: '+2', operator_value:  2, art_emoji: '🗺️', effect_text: 'Add +2 to one creature.', flavor_text: 'You are here. Everything else is negotiable.' },
  { name: 'Gift Card',           type: 'item', operator: '+3', operator_value:  3, art_emoji: '💳', effect_text: 'Add +3 to one creature.', flavor_text: 'Universal mall currency. Loses value if you wait too long to use it.' },
  { name: 'Free Sample',         type: 'item', operator: '+1', operator_value:  1, art_emoji: '🥢', effect_text: 'Add +1 to one creature.', flavor_text: 'Offered on a toothpick. Delicious. You will buy nothing.' },
  { name: 'Loyalty Punch Card',  type: 'item', operator: '+1', operator_value:  1, art_emoji: '👊', effect_text: 'Add +1 to one creature.', flavor_text: 'Seven of ten punches complete. The card is somewhere in that drawer.' },
  { name: 'Dropped Tray',        type: 'item', operator: '-2', operator_value: -2, art_emoji: '😬', effect_text: 'Subtract 2 from one creature.', flavor_text: 'The food court went silent. Everyone looked. The moment lasted forever.' },
  { name: 'Wrong-Level Parking', type: 'item', operator: '-3', operator_value: -3, art_emoji: '🅿️', effect_text: 'Subtract 3 from one creature.', flavor_text: 'You parked on 2B. You came out on 3A. The car is simply gone.' },
  { name: 'Mall Santa',          type: 'item', operator: '+5', operator_value:  5, art_emoji: '🎅', effect_text: 'Add +5 to one creature.', flavor_text: 'Seasonal. Powerful. The line starts forming in October.' },
  { name: 'Store Credit',        type: 'item', operator: '-5', operator_value: -5, art_emoji: '📄', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Can only be spent at this store. The store is closing.' },
  // --- ACTIONS ---
  { name: 'Buy One Get One',              type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '2️⃣',  effect_text: "Multiply one creature's value by 2.",   flavor_text: 'The fundamental mall math. Value doubles immediately.' },
  { name: 'Going-Out-of-Business Sale',   type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🚨', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Prices slashed. Everything five times as urgent.' },
  { name: 'Black Friday',                 type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🏃', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The mall at maximum capacity. Ten times the chaos.' },
  { name: 'Early Closing',                type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🔒', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Gates down at 6. You were in line at 5:58. Half value survives.' },
  { name: 'Out of Stock',                 type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🚫', effect_text: "Divide one creature's value by 5.",    flavor_text: 'In your size, in this color: no. One fifth of the value remains.' },
  { name: 'Return Without Receipt',       type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Store credit only. The value reverses entirely.' },
  // --- EVENTS ---
  { name: 'Grand Opening',  type: 'event', effect_type: 'x100',  art_emoji: '🎊', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'The new anchor store opens. One hundred times the foot traffic, energy, and value.' },
  { name: 'Fire Drill',     type: 'event', effect_type: 'swap',  art_emoji: '🚒', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'The alarm went off. Everyone shuffled outside. Two creatures ended up on completely the wrong side.' },
];

async function replaceR33() {
  console.log('Fetching release 33...');

  const { data: existing, error: fetchErr } = await supabase
    .from('releases')
    .select('id')
    .eq('number', 33)
    .single();

  if (fetchErr || !existing) {
    console.error('Could not find release 33:', fetchErr);
    process.exit(1);
  }

  console.log(`Found release 33 (id: ${existing.id}). Deleting existing cards...`);

  const { error: deleteErr } = await supabase
    .from('cards')
    .delete()
    .eq('release_id', existing.id);

  if (deleteErr) {
    console.error('Error deleting cards:', deleteErr);
    process.exit(1);
  }

  console.log('Cards deleted. Updating release record...');

  const { error: updateErr } = await supabase
    .from('releases')
    .update({ name: release.name, icon: release.icon, color_hex: release.color_hex })
    .eq('number', 33);

  if (updateErr) {
    console.error('Error updating release:', updateErr);
    process.exit(1);
  }

  console.log('Release updated. Inserting 30 Mall cards...');

  const cardRows = r33Cards.map(c => ({ ...c, release_id: existing.id }));

  const { error: insertErr } = await supabase
    .from('cards')
    .insert(cardRows);

  if (insertErr) {
    console.error('Error inserting cards:', insertErr);
    process.exit(1);
  }

  console.log(`Inserted ${cardRows.length} cards for Release 33 (The Mall)`);
  console.log('Done!');
}

replaceR33();
