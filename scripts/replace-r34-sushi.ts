import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const release = { number: 34, name: 'Sushi', icon: '🍣', color_hex: '#dc2626' };

const r34Cards = [
  // --- CREATURES ---
  { name: 'Grand Itamae',       type: 'creature', value: 10, art_emoji: '👨‍🍳', flavor_text: 'Trained for twenty years. Cuts fish in one motion. Says little.' },
  { name: 'Bluefin Tuna',       type: 'creature', value:  9, art_emoji: '🐟', flavor_text: 'The most prized fish in the ocean. The auction prices are real.' },
  { name: 'Sea Urchin (Uni)',   type: 'creature', value:  7, art_emoji: '🌊', flavor_text: 'Briny, rich, irreplaceable. Either your favorite or your enemy.' },
  { name: 'King Salmon',        type: 'creature', value:  6, art_emoji: '🍊', flavor_text: 'The perfect fat-to-flesh ratio. The orange says everything.' },
  { name: 'Yellowtail (Hamachi)', type: 'creature', value: 5, art_emoji: '🟡', flavor_text: 'Buttery. Clean. Never once disappoints.' },
  { name: 'Giant Clam',         type: 'creature', value:  5, art_emoji: '🐚', flavor_text: 'Chewy. Sweet. Slightly intimidating on the plate.' },
  { name: 'Spicy Tuna Roll',    type: 'creature', value:  4, art_emoji: '🌶️', flavor_text: 'The crowd-pleaser. On every menu. Earns its place every time.' },
  { name: 'Dragon Roll',        type: 'creature', value:  3, art_emoji: '🐉', flavor_text: 'Avocado scales. Shrimp beneath. More theatrical than it sounds.' },
  { name: 'Wagyu Beef Nigiri',  type: 'creature', value:  3, art_emoji: '🥩', flavor_text: 'Briefly seared. Briefly on the plate. Gone instantly.' },
  { name: 'California Roll',    type: 'creature', value:  2, art_emoji: '🦀', flavor_text: 'Invented in Los Angeles. Japan forgave us eventually.' },
  { name: 'Tamago (Sweet Egg)', type: 'creature', value:  1, art_emoji: '🥚', flavor_text: 'The simplest nigiri. The one the chef uses to judge your taste.' },
  { name: 'Cucumber Maki',      type: 'creature', value:  0, art_emoji: '🥒', flavor_text: 'Cold. Crisp. Completely inoffensive. Not offensive.' },
  { name: 'Mackerel (Saba)',    type: 'creature', value: -2, art_emoji: '🐡', flavor_text: 'Aggressively fishy. Half the table loves it. The other half does not.' },
  { name: 'Natto Roll',         type: 'creature', value: -4, art_emoji: '🫘', flavor_text: 'Fermented soybeans. Slimy. Stringy. Defended passionately by its fans.' },
  // --- ITEMS ---
  { name: 'Soy Sauce',          type: 'item', operator: '+2', operator_value:  2, art_emoji: '🫙', effect_text: 'Add +2 to one creature.', flavor_text: 'A few drops. Everything improves.' },
  { name: 'Pickled Ginger',     type: 'item', operator: '+3', operator_value:  3, art_emoji: '🌸', effect_text: 'Add +3 to one creature.', flavor_text: 'Resets the palate. Prepares for something better.' },
  { name: 'Chopsticks',         type: 'item', operator: '+1', operator_value:  1, art_emoji: '🥢', effect_text: 'Add +1 to one creature.', flavor_text: 'The correct utensil. Slightly judged if requested otherwise.' },
  { name: 'Bamboo Rolling Mat', type: 'item', operator: '+1', operator_value:  1, art_emoji: '🎋', effect_text: 'Add +1 to one creature.', flavor_text: 'Rolls everything tight. The foundation of all good maki.' },
  { name: 'Too Much Wasabi',    type: 'item', operator: '-2', operator_value: -2, art_emoji: '🟢', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Applied in good faith. Consequences immediate.' },
  { name: 'Stale Rice',         type: 'item', operator: '-3', operator_value: -3, art_emoji: '🍚', effect_text: 'Subtract 3 from one creature.', flavor_text: 'The sushi was left out. The rice hardened. The chef is embarrassed.' },
  { name: 'Omakase Menu',       type: 'item', operator: '+5', operator_value:  5, art_emoji: '📋', effect_text: 'Add +5 to one creature.', flavor_text: 'Trust the chef completely. It always ends well.' },
  { name: 'Freezer Burn',       type: 'item', operator: '-5', operator_value: -5, art_emoji: '🧊', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Improperly stored. Unrecoverable. The chef is mortified.' },
  // --- ACTIONS ---
  { name: 'Double Roll',         type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🔄', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Rolled twice as thick. Twice as satisfying.' },
  { name: 'Sushi Train',         type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🚂', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Five plates pass by. Every one taken. Five times the result.' },
  { name: 'Omakase Masterpiece', type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '✨', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The chef\'s absolute best. Ten times the usual.' },
  { name: 'Losing Freshness',    type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '⏱️', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Left on the counter too long. Half the value remains.' },
  { name: 'Budget Cut Roll',     type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '💸', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Imitation crab. Frozen fish. One fifth the original.' },
  { name: 'Inside-Out Roll',     type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🌀', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Rice on the outside, seaweed within. Everything reversed.' },
  // --- EVENTS ---
  { name: 'Michelin Star',     type: 'event', effect_type: 'x100',   art_emoji: '⭐', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'The inspector dined in silence. One hundred times the recognition followed.' },
  { name: 'Wasabi Overload',   type: 'event', effect_type: 'reverse', art_emoji: '🟢', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'Someone used the whole portion. Every value on one side flips in the shock.' },
];

async function replaceR34() {
  console.log('Fetching release 34...');

  const { data: existing, error: fetchErr } = await supabase
    .from('releases')
    .select('id')
    .eq('number', 34)
    .single();

  if (fetchErr || !existing) {
    console.error('Could not find release 34:', fetchErr);
    process.exit(1);
  }

  console.log(`Found release 34 (id: ${existing.id}). Deleting existing cards...`);

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
    .eq('number', 34);

  if (updateErr) {
    console.error('Error updating release:', updateErr);
    process.exit(1);
  }

  console.log('Release updated. Inserting 30 Sushi cards...');

  const cardRows = r34Cards.map(c => ({ ...c, release_id: existing.id }));

  const { error: insertErr } = await supabase
    .from('cards')
    .insert(cardRows);

  if (insertErr) {
    console.error('Error inserting cards:', insertErr);
    process.exit(1);
  }

  console.log(`Inserted ${cardRows.length} cards for Release 34 (Sushi)`);
  console.log('Done!');
}

replaceR34();
