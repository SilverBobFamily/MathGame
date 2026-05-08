import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── World History — R42 ────────────────────────────────────────────────────
const worldHistoryCards = [
  // CREATURES (14) — ranked by historical impact/power
  { name: 'Genghis Khan',        type: 'creature', value: 10, art_emoji: '🏹', flavor_text: '"I am the punishment of God. If you had not committed great sins, God would not have sent a punishment like me." — Genghis Khan' },
  { name: 'Julius Caesar',       type: 'creature', value:  9, art_emoji: '🦅', flavor_text: 'Crossed the Rubicon in 49 BC. There was no going back.' },
  { name: 'Alexander the Great', type: 'creature', value:  7, art_emoji: '⚔️', flavor_text: 'Wept because there were no more worlds to conquer. He was twenty-five.' },
  { name: 'Napoleon Bonaparte',  type: 'creature', value:  6, art_emoji: '🎖️', flavor_text: '"An army travels on its stomach." — Napoleon Bonaparte' },
  { name: 'Cleopatra',           type: 'creature', value:  5, art_emoji: '🐍', flavor_text: 'She spoke nine languages. The asp was just the final one.' },
  { name: 'Charlemagne',         type: 'creature', value:  5, art_emoji: '👑', flavor_text: 'United a fractured continent. Europe still bears his shape.' },
  { name: 'Joan of Arc',         type: 'creature', value:  4, art_emoji: '🔥', flavor_text: '"I am not afraid. I was born to do this." — Joan of Arc' },
  { name: 'Marco Polo',          type: 'creature', value:  3, art_emoji: '🧭', flavor_text: 'Traveled 15,000 miles. Returned with stories no one believed.' },
  { name: 'Attila the Hun',      type: 'creature', value:  3, art_emoji: '🐎', flavor_text: '"He is a man born into the world to shake the nations." — Priscus of Panium' },
  { name: 'Spartacus',           type: 'creature', value:  2, art_emoji: '⛓️', flavor_text: 'Led 70,000 escaped slaves against Rome. Almost won.' },
  { name: 'Hannibal Barca',      type: 'creature', value:  1, art_emoji: '🐘', flavor_text: 'Crossed the Alps with elephants. Rome never forgot it.' },
  { name: 'The Fall of Rome',    type: 'creature', value:  0, art_emoji: '🏛️', flavor_text: 'Fell in 410 AD. Historians still argue about why.' },
  { name: 'Stalin',              type: 'creature', value: -2, art_emoji: '🔴', flavor_text: 'Industrialized a nation. Killed millions to do it.' },
  { name: 'Hitler',              type: 'creature', value: -4, art_emoji: '💀', flavor_text: 'Plunged the world into war. Seventy million died.' },

  // ITEMS (8) — historical concepts
  { name: 'Printing Press',      type: 'item', operator: '+3', operator_value:  3, art_emoji: '📖', effect_text: 'Add +3 to one creature.', flavor_text: 'Gutenberg\'s invention spread ideas faster than any army.' },
  { name: 'Magna Carta',         type: 'item', operator: '+2', operator_value:  2, art_emoji: '📜', effect_text: 'Add +2 to one creature.', flavor_text: 'Signed in 1215. Still limiting tyrants today.' },
  { name: 'The Silk Road',       type: 'item', operator: '+2', operator_value:  2, art_emoji: '🧵', effect_text: 'Add +2 to one creature.', flavor_text: 'More than silk traveled its length.' },
  { name: 'Black Plague',        type: 'item', operator: '-3', operator_value: -3, art_emoji: '🐀', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Killed a third of Europe. Ended feudalism by accident.' },
  { name: 'The Crusades',        type: 'item', operator: '-2', operator_value: -2, art_emoji: '✝️', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Holy war that left neither side holier.' },
  { name: 'Gunpowder',           type: 'item', operator: '+1', operator_value:  1, art_emoji: '💥', effect_text: 'Add +1 to one creature.', flavor_text: 'Invented in China. Changed everything everywhere.' },
  { name: 'Age of Exploration',  type: 'item', operator: '+5', operator_value:  5, art_emoji: '⛵', effect_text: 'Add +5 to one creature.', flavor_text: 'New worlds found. Old ones forever changed.' },
  { name: 'The Inquisition',     type: 'item', operator: '-5', operator_value: -5, art_emoji: '⚖️', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Nobody expected it. Least of all its victims.' },

  // ACTIONS (6) — historical forces
  { name: 'Industrial Revolution', type: 'action', operator: '×10', operator_value: 10,  art_emoji: '🏭', effect_text: "Multiply one creature's value by 10.", flavor_text: 'Transformed the world in a single century.' },
  { name: 'Renaissance',           type: 'action', operator: '×5',  operator_value:  5,  art_emoji: '🎨', effect_text: "Multiply one creature's value by 5.",  flavor_text: 'Rebirth of learning. Art and science flourished together.' },
  { name: 'French Revolution',     type: 'action', operator: '×2',  operator_value:  2,  art_emoji: '🗽', effect_text: "Multiply one creature's value by 2.",  flavor_text: 'Liberté, Égalité — and then the guillotine.' },
  { name: 'Dark Ages',             type: 'action', operator: '÷5',  operator_value:  0.2, art_emoji: '🌑', effect_text: "Divide one creature's value by 5.",   flavor_text: 'Five centuries of Europe forgetting what it knew.' },
  { name: 'The Great Famine',      type: 'action', operator: '÷2',  operator_value:  0.5, art_emoji: '🌾', effect_text: "Divide one creature's value by 2.",   flavor_text: 'Ireland, 1845. A million dead. Another million gone.' },
  { name: 'Reign of Terror',       type: 'action', operator: '×(-1)', operator_value: -1, art_emoji: '🔪', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'The revolution devoured its own children.' },

  // EVENTS (2)
  { name: 'World War II',          type: 'event', effect_type: 'reverse', art_emoji: '🌍', effect_text: 'Reverse: Flip the sign of every creature on one side.', flavor_text: 'The deadliest conflict in human history. Everything reversed.' },
  { name: 'The Black Death',       type: 'event', effect_type: 'zero_out', art_emoji: '☠️', effect_text: 'Zero Out: Set any one creature\'s value to 0.', flavor_text: 'One plague. One third of Europe. Gone.' },
];

// ─── Famous Landmarks — R43 ─────────────────────────────────────────────────
const landmarksCards = [
  // CREATURES (14) — ranked by cultural/historical significance
  { name: 'Great Wall of China',     type: 'creature', value: 10, art_emoji: '🧱', flavor_text: 'Thirteen thousand miles. Two thousand years. Still standing.' },
  { name: 'Pyramids of Giza',        type: 'creature', value:  9, art_emoji: '🔺', flavor_text: '"Man fears time, but time fears the Pyramids." — Arab proverb' },
  { name: 'Colosseum',               type: 'creature', value:  7, art_emoji: '🏟️', flavor_text: 'Held 80,000 spectators. Still the world\'s most imitated stadium.' },
  { name: 'Taj Mahal',               type: 'creature', value:  6, art_emoji: '🕌', flavor_text: 'Built for love. Twenty thousand laborers. Twenty-two years.' },
  { name: 'Eiffel Tower',            type: 'creature', value:  5, art_emoji: '🗼', flavor_text: '"It was hideous," they said in 1889. Now it\'s on every postcard.' },
  { name: 'Machu Picchu',            type: 'creature', value:  5, art_emoji: '🏔️', flavor_text: 'The Incas built a city in the clouds. Then vanished.' },
  { name: 'Statue of Liberty',       type: 'creature', value:  4, art_emoji: '🗽', flavor_text: '"Give me your tired, your poor, your huddled masses." — Emma Lazarus' },
  { name: 'Stonehenge',              type: 'creature', value:  3, art_emoji: '🪨', flavor_text: 'Five thousand years old. We still don\'t know why.' },
  { name: 'Acropolis of Athens',     type: 'creature', value:  3, art_emoji: '🏛️', flavor_text: 'Built 2,500 years ago. The blueprint for Western architecture.' },
  { name: 'Angkor Wat',              type: 'creature', value:  2, art_emoji: '🌅', flavor_text: 'Largest religious complex ever built. Swallowed by the jungle for centuries.' },
  { name: 'Leaning Tower of Pisa',   type: 'creature', value:  1, art_emoji: '📐', flavor_text: 'Famous for failing. Beloved because of it.' },
  { name: 'Sagrada Família',         type: 'creature', value:  0, art_emoji: '⛪', flavor_text: 'Gaudí started it in 1882. Still under construction today.' },
  { name: 'Trump Tower',             type: 'creature', value: -2, art_emoji: '🏙️', flavor_text: 'Gold-plated everything. Invited both admirers and lawsuits.' },
  { name: 'Chernobyl Reactor 4',     type: 'creature', value: -4, art_emoji: '☢️', flavor_text: 'Engineers said it was impossible. April 26, 1986 disagreed.' },

  // ITEMS (8) — travel/architectural concepts
  { name: 'Architect\'s Blueprint',  type: 'item', operator: '+3', operator_value:  3, art_emoji: '📐', effect_text: 'Add +3 to one creature.', flavor_text: 'Every great structure starts as a dream on paper.' },
  { name: 'UNESCO Heritage Status',  type: 'item', operator: '+2', operator_value:  2, art_emoji: '🏅', effect_text: 'Add +2 to one creature.', flavor_text: 'Protected by international law. Priceless by definition.' },
  { name: 'Tourist Season',          type: 'item', operator: '+2', operator_value:  2, art_emoji: '📸', effect_text: 'Add +2 to one creature.', flavor_text: 'Millions of visitors. Billions in revenue. Wear earplugs.' },
  { name: 'Earthquake Damage',       type: 'item', operator: '-3', operator_value: -3, art_emoji: '🌋', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Centuries of craftsmanship, humbled in seconds.' },
  { name: 'Urban Development',       type: 'item', operator: '-2', operator_value: -2, art_emoji: '🏗️', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Progress, they called it. The neighborhood disagreed.' },
  { name: 'Restoration Project',     type: 'item', operator: '+1', operator_value:  1, art_emoji: '🔧', effect_text: 'Add +1 to one creature.', flavor_text: 'Bringing history back, one stone at a time.' },
  { name: 'Grand Opening',           type: 'item', operator: '+5', operator_value:  5, art_emoji: '🎊', effect_text: 'Add +5 to one creature.', flavor_text: 'The ribbon cuts. The crowds gasp. The legend begins.' },
  { name: 'Demolition Order',        type: 'item', operator: '-5', operator_value: -5, art_emoji: '🪓', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Condemned: too old, too dangerous, too inconvenient.' },

  // ACTIONS (6) — travel/architectural forces
  { name: 'Wonders of the World',    type: 'action', operator: '×10', operator_value: 10,  art_emoji: '🌐', effect_text: "Multiply one creature's value by 10.", flavor_text: 'Seven wonders. Hundreds of nominees. One honor.' },
  { name: 'Grand Tour',              type: 'action', operator: '×5',  operator_value:  5,  art_emoji: '✈️', effect_text: "Multiply one creature's value by 5.",  flavor_text: 'The 18th-century finishing school: visit everywhere, return educated.' },
  { name: 'Cultural Renaissance',    type: 'action', operator: '×2',  operator_value:  2,  art_emoji: '🎭', effect_text: "Multiply one creature's value by 2.",  flavor_text: 'Cities reimagined. Landmarks reborn. Tourists incoming.' },
  { name: 'Heritage Neglect',        type: 'action', operator: '÷5',  operator_value:  0.2, art_emoji: '🕸️', effect_text: "Divide one creature's value by 5.",   flavor_text: 'Left to decay. Forgotten by everyone except the ivy.' },
  { name: 'Sinking Foundation',      type: 'action', operator: '÷2',  operator_value:  0.5, art_emoji: '⬇️', effect_text: "Divide one creature's value by 2.",   flavor_text: 'Venice is going down. Very slowly. Very certainly.' },
  { name: 'Landmark Repurposed',     type: 'action', operator: '×(-1)', operator_value: -1, art_emoji: '🔄', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'A prison became a museum. A church became a mosque.' },

  // EVENTS (2)
  { name: 'The Grand Tour Opens',    type: 'event', effect_type: 'x100', art_emoji: '🗺️', effect_text: '×100: Multiply any one creature\'s value by 100.', flavor_text: 'Some landmarks define their age. This is that moment.' },
  { name: 'Landmark Swap',           type: 'event', effect_type: 'swap', art_emoji: '🔀', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'Paris traded its tower. Rome took the deal. Nobody is sure why.' },
];

const newReleases = [
  { number: 42, name: 'World History',    icon: '📜', color_hex: '#3e2723' },
  { number: 43, name: 'Famous Landmarks', icon: '🗼', color_hex: '#00695c' },
];

const newReleaseCardPairs = [
  { number: 42, cards: worldHistoryCards },
  { number: 43, cards: landmarksCards },
];

async function addReleases() {
  const { data: releaseRows, error: relErr } = await supabase
    .from('releases').upsert(newReleases, { onConflict: 'number' }).select();
  if (relErr) { console.error(relErr); process.exit(1); }
  console.log('Releases upserted:', releaseRows!.map(r => `R${r.number} id=${r.id}`).join(', '));
  for (const { number, cards } of newReleaseCardPairs) {
    const release = releaseRows!.find(r => r.number === number)!;
    const cardRows = cards.map(c => ({ ...c, release_id: release.id }));
    const { error } = await supabase.from('cards').insert(cardRows);
    if (error) { console.error(`R${number}:`, error); process.exit(1); }
    console.log(`Inserted ${cardRows.length} cards for R${number} (${release.name}, id=${release.id})`);
  }
  console.log('Done!');
}
addReleases();
