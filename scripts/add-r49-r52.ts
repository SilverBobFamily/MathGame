import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const R49_ID = 1745; // Anime
const R52_ID = 1748; // World History

const r49Cards = [
  // CREATURES
  { name: 'Goku',                type: 'creature', value: 10, art_emoji: '🐉', flavor_text: 'The fight isn\'t over when I\'m tired. It\'s over when I decide it is.' },
  { name: 'Saitama',             type: 'creature', value:  9, art_emoji: '🥊', flavor_text: 'One punch. Every time. The curse of absolute power is that nothing is ever a challenge anymore.' },
  { name: 'Naruto Uzumaki',      type: 'creature', value:  7, art_emoji: '🦊', flavor_text: 'Believe it. That\'s not a catchphrase. That\'s a philosophy.' },
  { name: 'Levi Ackerman',       type: 'creature', value:  6, art_emoji: '⚔️', flavor_text: '"The only soldier rated as having equal value to an entire brigade." — Survey Corps recruitment file' },
  { name: 'Monkey D. Luffy',     type: 'creature', value:  5, art_emoji: '🌀', flavor_text: 'He doesn\'t want to be the greatest. He wants to be free. The One Piece is almost beside the point.' },
  { name: 'Sailor Moon',         type: 'creature', value:  5, art_emoji: '🌙', flavor_text: 'On behalf of the moon, I will right wrongs and triumph over evil, and that means you.' },
  { name: 'Edward Elric',        type: 'creature', value:  4, art_emoji: '⚙️', flavor_text: '"He achieved alchemy mastery by age fifteen. The cost was significant." — Military records' },
  { name: 'Tanjiro Kamado',      type: 'creature', value:  3, art_emoji: '🌊', flavor_text: 'A demon slayer who still feels compassion for the demons. His greatest weapon may be his kindness.' },
  { name: 'Kakashi Hatake',      type: 'creature', value:  3, art_emoji: '📖', flavor_text: '"He copied over a thousand jutsu. He\'s still late to everything." — Konoha village gossip' },
  { name: 'Mikasa Ackerman',     type: 'creature', value:  2, art_emoji: '🏹', flavor_text: 'She follows Eren. She protects Eren. She is, independently, the most dangerous person in the Survey Corps.' },
  { name: 'L Lawliet',           type: 'creature', value:  1, art_emoji: '🍬', flavor_text: 'I am justice. But I sit like this because it helps me think. Both things are true.' },
  { name: 'Ryuk',                type: 'creature', value:  0, art_emoji: '📓', flavor_text: '"He dropped the Death Note out of boredom. Everything that followed was entertainment." — Observer\'s note' },
  { name: 'Zenitsu Agatsuma',    type: 'creature', value: -2, art_emoji: '⚡', flavor_text: 'He\'s terrified of combat. He cries constantly. He is somehow still a demon slayer. Nobody is more surprised than him.' },
  { name: 'Armin Arlert',        type: 'creature', value: -4, art_emoji: '💡', flavor_text: 'I know I\'m not a fighter. But I understand things. Eventually, that has to count for something.' },
  // ITEMS
  { name: 'Senzu Bean',          type: 'item', operator: '+5', operator_value:  5, art_emoji: '🫘', effect_text: 'Add +5 to one creature.', flavor_text: 'Full recovery, instantly. Growing them takes forever. Worth every second.' },
  { name: 'Power Level Scouter', type: 'item', operator: '+3', operator_value:  3, art_emoji: '🔍', effect_text: 'Add +3 to one creature.', flavor_text: 'It reads the enemy\'s power level. Then it explodes. It always explodes.' },
  { name: 'Training Arc',        type: 'item', operator: '+2', operator_value:  2, art_emoji: '🏋️', effect_text: 'Add +2 to one creature.', flavor_text: 'Three episodes of training. Ten years of power up. The math somehow tracks.' },
  { name: 'Ramen Bowl',          type: 'item', operator: '+1', operator_value:  1, art_emoji: '🍜', effect_text: 'Add +1 to one creature.', flavor_text: 'Ichiraku\'s finest. Naruto has eaten here 847 times. Each bowl contains hope.' },
  { name: 'Friendship Power',    type: 'item', operator: '+1', operator_value:  1, art_emoji: '🤝', effect_text: 'Add +1 to one creature.', flavor_text: 'Technically not a real stat. Somehow always the deciding factor.' },
  { name: 'Beach Episode',       type: 'item', operator: '-1', operator_value: -1, art_emoji: '🏖️', effect_text: 'Subtract 1 from one creature.', flavor_text: 'Nobody grows. Nobody changes. Fan service delivered. Plot: paused indefinitely.' },
  { name: 'Filler Arc',          type: 'item', operator: '-2', operator_value: -2, art_emoji: '📺', effect_text: 'Subtract 2 from one creature.', flavor_text: 'A hundred episodes of nothing. Produced to let the manga catch up. You feel it.' },
  { name: 'Character Death',     type: 'item', operator: '-5', operator_value: -5, art_emoji: '💀', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Beloved. Gone. The writers brought them back in season four. It didn\'t help.' },
  // ACTIONS
  { name: 'Power Level Surge',   type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '📈', effect_text: "Multiply one creature's value by 2.",          flavor_text: 'Not full power. Just... more than before.' },
  { name: 'Super Saiyan',        type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '✨', effect_text: "Multiply one creature's value by 5.",          flavor_text: 'Hair turns gold. Eyes go teal. Physics apologizes.' },
  { name: 'Final Form',          type: 'action', operator: '×10',   operator_value: 10,   art_emoji: '💥', effect_text: "Multiply one creature's value by 10.",         flavor_text: 'Nobody survives the final form announcement. This is known.' },
  { name: 'Energy Drain',        type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🌀', effect_text: "Divide one creature's value by 2.",           flavor_text: 'Half their power, absorbed. The fight turns immediately.' },
  { name: 'Seal Jutsu',          type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🔒', effect_text: "Divide one creature's value by 5.",           flavor_text: 'Ancient symbols. Binding contract. One fifth of what they were.' },
  { name: 'Villain Turn',        type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '😈', effect_text: "Flip one creature's value to its opposite.",  flavor_text: 'The protagonist cracks. The value inverts. The story darkens.' },
  // EVENTS
  { name: 'Tournament Arc',      type: 'event', effect_type: 'x100', art_emoji: '🏆', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'Every anime has one. Every time, the stakes are impossibly higher. One hundred times the tension.' },
  { name: 'Isekai Truck',        type: 'event', effect_type: 'swap', art_emoji: '🚛', effect_text: 'Swap: Exchange any two creatures between sides.',    flavor_text: 'A truck. A new world. Two creatures wake up on completely different sides.' },
];

const r52Cards = [
  // CREATURES
  { name: 'Genghis Khan',         type: 'creature', value: 10, art_emoji: '🐎', flavor_text: '"He united the Mongols and then — somewhat forcibly — everyone else." — 13th century historian' },
  { name: 'Alexander the Great',  type: 'creature', value:  9, art_emoji: '⚔️', flavor_text: 'I have no more worlds to conquer. This is not a complaint. It is a problem.' },
  { name: 'Julius Caesar',        type: 'creature', value:  7, art_emoji: '🏛️', flavor_text: '"He crossed the Rubicon in 49 BC. That phrase still describes every irreversible decision." — historian\'s note' },
  { name: 'Napoleon Bonaparte',   type: 'creature', value:  6, art_emoji: '👑', flavor_text: 'Conquered most of Europe. Exiled twice. The second exile stuck. Height: disputed.' },
  { name: 'Cleopatra',            type: 'creature', value:  5, art_emoji: '🐍', flavor_text: 'I speak nine languages. I am the first Ptolemaic ruler to learn Egyptian. My kingdom listens.' },
  { name: 'Joan of Arc',          type: 'creature', value:  5, art_emoji: '🔥', flavor_text: 'Seventeen years old. Led an army. Turned a war. Burned at the stake. Later made a saint. France.' },
  { name: 'Leonardo da Vinci',    type: 'creature', value:  4, art_emoji: '🎨', flavor_text: '"Centuries ahead of his time in aviation, anatomy, engineering, and painting." — Renaissance catalog' },
  { name: 'Mahatma Gandhi',       type: 'creature', value:  3, art_emoji: '🧵', flavor_text: 'Be the change you wish to see. Also: I walked 240 miles for salt. Results vary.' },
  { name: 'Marie Curie',          type: 'creature', value:  3, art_emoji: '⚗️', flavor_text: 'Two Nobel Prizes. Two different sciences. Zero laboratory safety equipment by modern standards.' },
  { name: 'Winston Churchill',    type: 'creature', value:  2, art_emoji: '🎩', flavor_text: '"He was wrong about many things and right about one thing. Fortunately, the one thing mattered." — postwar assessment' },
  { name: 'Socrates',             type: 'creature', value:  1, art_emoji: '🤔', flavor_text: 'I know that I know nothing. This is considered wisdom. It got me killed.' },
  { name: 'Nero',                 type: 'creature', value:  0, art_emoji: '🎻', flavor_text: 'Fiddled while Rome burned. Blamed the Christians. Built himself a palace. Historian approval rating: poor.' },
  { name: 'Attila the Hun',       type: 'creature', value: -2, art_emoji: '💀', flavor_text: '"He reached the gates of Rome and then left. Nobody is entirely sure why." — chronicler\'s note' },
  { name: 'King John',            type: 'creature', value: -4, art_emoji: '📜', flavor_text: 'Lost Normandy. Lost his treasure in a marsh. Signed the Magna Carta under duress. Lost everything twice.' },
  // ITEMS
  { name: 'The Printing Press',   type: 'item', operator: '+5', operator_value:  5, art_emoji: '📰', effect_text: 'Add +5 to one creature.', flavor_text: 'Gutenberg, 1440. Within fifty years, every idea in Europe spread faster than kings could stop it.' },
  { name: 'Gunpowder',            type: 'item', operator: '+3', operator_value:  3, art_emoji: '💣', effect_text: 'Add +3 to one creature.', flavor_text: 'Invented in China for fireworks. Repurposed by everyone else for conquest. The second use dominated.' },
  { name: 'The Compass',          type: 'item', operator: '+2', operator_value:  2, art_emoji: '🧭', effect_text: 'Add +2 to one creature.', flavor_text: 'Points north. Every age of exploration begins with this small, obstinate needle.' },
  { name: 'Battle Map',           type: 'item', operator: '+1', operator_value:  1, art_emoji: '🗺️', effect_text: 'Add +1 to one creature.', flavor_text: 'Annotated in the field. Folded incorrectly. Decisive advantage to anyone who can read it.' },
  { name: 'Royal Decree',         type: 'item', operator: '+1', operator_value:  1, art_emoji: '📋', effect_text: 'Add +1 to one creature.', flavor_text: 'Signed. Sealed. Delivered. What it contains matters less than the weight of the seal.' },
  { name: 'The Black Death',      type: 'item', operator: '-1', operator_value: -1, art_emoji: '🐀', effect_text: 'Subtract 1 from one creature.', flavor_text: 'The plague of 1347 erased a third of Europe. Also reorganized feudal labor economics. Both things happened.' },
  { name: 'Betrayal',             type: 'item', operator: '-2', operator_value: -2, art_emoji: '🔪', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Agreed to in good faith. Broken in bad faith. The second act was always the plan.' },
  { name: 'The Siege',            type: 'item', operator: '-5', operator_value: -5, art_emoji: '🏰', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Walls up. Supply lines cut. Inside: starvation. Outside: patience. One side runs out first.' },
  // ACTIONS
  { name: 'Industrial Revolution', type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '⚙️', effect_text: "Multiply one creature's value by 2.",         flavor_text: 'Machines double everything. Output. Speed. Inequality. Carbon.' },
  { name: 'Conquest',              type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🚩', effect_text: "Multiply one creature's value by 5.",         flavor_text: 'Five armies, one flag, one overwhelming force of will.' },
  { name: 'Rise of an Empire',     type: 'action', operator: '×10',   operator_value: 10,   art_emoji: '🌍', effect_text: "Multiply one creature's value by 10.",        flavor_text: 'From city-state to empire in one generation. The mapmakers couldn\'t keep up.' },
  { name: 'The Fall of Rome',      type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🏚️', effect_text: "Divide one creature's value by 2.",          flavor_text: '476 AD. Half the civilization survives. All of the nostalgia.' },
  { name: 'The Dark Ages',         type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🕯️', effect_text: "Divide one creature's value by 5.",          flavor_text: 'One fifth remains. Preserved in monasteries. The rest: lost.' },
  { name: 'Revolution',            type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '⚖️', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'The king is on the scaffold. The value inverts. Everything changes sides.' },
  // EVENTS
  { name: 'World War',            type: 'event', effect_type: 'x100', art_emoji: '💣', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: '1914. 1939. The world organized itself around the idea of fighting everyone at once. One hundred times the consequence.' },
  { name: 'The French Revolution', type: 'event', effect_type: 'swap', art_emoji: '🗡️', effect_text: 'Swap: Exchange any two creatures between sides.',   flavor_text: 'Liberty. Equality. Fraternity. And a complete reshuffling of who stands where.' },
];

async function main() {
  console.log('Inserting R49 Anime cards...');
  const { error: e1 } = await supabase.from('cards').insert(
    r49Cards.map(c => ({ ...c, release_id: R49_ID }))
  );
  if (e1) { console.error('R49 insert error:', e1); process.exit(1); }
  console.log(`Inserted ${r49Cards.length} cards for R49 Anime`);

  console.log('Inserting R52 World History cards...');
  const { error: e2 } = await supabase.from('cards').insert(
    r52Cards.map(c => ({ ...c, release_id: R52_ID }))
  );
  if (e2) { console.error('R52 insert error:', e2); process.exit(1); }
  console.log(`Inserted ${r52Cards.length} cards for R52 World History`);

  // Verify
  const { count: c1 } = await supabase.from('cards').select('*', { count: 'exact', head: true }).eq('release_id', R49_ID);
  const { count: c2 } = await supabase.from('cards').select('*', { count: 'exact', head: true }).eq('release_id', R52_ID);
  console.log(`\nFinal counts:`);
  console.log(`  R49 Anime (id=${R49_ID}): ${c1} cards`);
  console.log(`  R52 World History (id=${R52_ID}): ${c2} cards`);
}

main();
