import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const RELEASE_ID = 79;

const cards = [
  // ── CREATURES ──────────────────────────────────────────────────────────
  { name: 'Gana',                 type: 'creature', value: 10, art_emoji: '👵',  flavor_text: 'Ninety-five years of joy, grace, and knowing smiles. The room reorganizes itself around her.' },
  { name: 'Rachel (Mom)',         type: 'creature', value:  9, art_emoji: '👓',  flavor_text: 'Six things at once. All of them done. You\'re welcome.' },
  { name: 'Josh (Dad)',           type: 'creature', value:  8, art_emoji: '👨‍💻', flavor_text: 'I have a framework for this. Also a follow-up framework. Let me get the whiteboard.' },
  { name: 'Nana & Papa',         type: 'creature', value:  7, art_emoji: '🍪',  flavor_text: 'The table is always set. The cookies are always warm. They always have time.' },
  { name: 'Grandpa & Judy',      type: 'creature', value:  7, art_emoji: '🎣',  flavor_text: 'Relaxed by a lake with fishing poles nearby. They have seen everything. Nothing worries them.' },
  { name: 'Readee McGee',        type: 'creature', value:  6, art_emoji: '📖',  flavor_text: 'Nose practically touching the page. Surrounded by towers of books. Exactly where she wants to be.' },
  { name: 'Blue Lou',            type: 'creature', value:  6, art_emoji: '🩵',  flavor_text: 'Sage-green, floppy-eared, and utterly fabulous. Blue Lou does not explain himself.' },
  { name: 'Anna',                type: 'creature', value:  5, art_emoji: '🌿',  flavor_text: 'Eleven. On a trail. Sunlight through the trees. Steady and exactly where she wants to be.' },
  { name: 'Danny',               type: 'creature', value:  5, art_emoji: '🌊',  flavor_text: 'Easy smile. Ready for anything. Wavy hair catches the breeze. The summer kid.' },
  { name: 'Benny',               type: 'creature', value:  4, art_emoji: '💪',  flavor_text: 'Missing front tooth. Flexing with total conviction. He is absolutely certain of his own power.' },
  { name: 'Abby',                type: 'creature', value:  4, art_emoji: '🐕',  flavor_text: 'The most beloved good dog in any room. Tail mid-wag. Always.' },
  { name: 'Blippy Sue',          type: 'creature', value:  4, art_emoji: '🌸',  flavor_text: 'Perfectly composed. Fanning herself with one ear. Sweet on the outside. Do not test her.' },
  { name: 'Bruno (the Rhinocorn)',type: 'creature', value:  3, art_emoji: '🦏',  flavor_text: 'Half rhinoceros. Half unicorn. Maximum dignity. Benny considers him a personal friend.' },
  { name: 'Dizzy McGee',         type: 'creature', value:  3, art_emoji: '🌀',  flavor_text: 'Flat, floppy, mid-spin, and grinning. Dizzy McGee has never stopped moving in his life.' },
  { name: 'Maple',               type: 'creature', value:  3, art_emoji: '🍁',  flavor_text: 'Sweet. Firm. Canadian. The maple leaf on her ear is not decorative. It is a warning.' },
  { name: 'Squatchy',            type: 'creature', value:  2, art_emoji: '🌲',  flavor_text: 'Large white feet. Ancient knowing eyes. Anna saw something behind that bush. She is correct.' },
  { name: 'CiCi',                type: 'creature', value:  2, art_emoji: '💚',  flavor_text: 'Trots past trailing a small cheerful green cloud. CiCi is delighted. She does not notice your expression.' },
  { name: 'Luna',                type: 'creature', value:  2, art_emoji: '🌙',  flavor_text: 'Dark gray cape. Gold clasp. Tiny crown. Gazes at the full moon with total queenly composure.' },
  { name: 'Watchee McGee',       type: 'creature', value:  1, art_emoji: '📺',  flavor_text: 'Staring at the television with wide captivated eyes. Snacks untouched. He will not be back soon.' },
  { name: 'Melvin',              type: 'creature', value:  0, art_emoji: '🐇',  flavor_text: 'Large tan bunny. Name tag reads "STEVE." He is at perfect peace with this. Are you?' },
  { name: 'Meh McGee',           type: 'creature', value: -2, art_emoji: '😑',  flavor_text: 'Small. Limbless. Potato-shaped. The fireworks are spectacular. He is unmoved.' },
  { name: 'Hearee McGee',        type: 'creature', value: -4, art_emoji: '👂',  flavor_text: 'One ear tilted dramatically toward you. Classic "who, me?" face. Classic eavesdropper.' },
  { name: 'Monkeys!',            type: 'creature', value:  1, art_emoji: '🐒',  flavor_text: 'Three stuffed monkeys. See, hear, speak no evil. They look like they know everything. They do.' },
  // ── ITEMS ─────────────────────────────────────────────────────────────
  { name: 'Shabbat Dinner',   type: 'item', operator: '+5', operator_value:  5, art_emoji: '🕯️', effect_text: 'Add +5 to one creature.', flavor_text: 'Candles lit. Challah braided. The whole family in one place. This is the +5.' },
  { name: 'Lake House',       type: 'item', operator: '+3', operator_value:  3, art_emoji: '🏕️', effect_text: 'Add +3 to one creature.', flavor_text: 'Golden hour on the dock. Everyone scattered across the water doing their own thing. Perfect.' },
  { name: "Angel's Potatoes", type: 'item', operator: '+3', operator_value:  3, art_emoji: '🥔', effect_text: 'Add +3 to one creature.', flavor_text: 'Crispy edges. Glistening. Josh has his hand out before they have cooled. Rachel has her hand up.' },
  { name: 'Library Books',    type: 'item', operator: '+2', operator_value:  2, art_emoji: '📚', effect_text: 'Add +2 to one creature.', flavor_text: 'Due-date slips sticking out at odd angles. The stack cannot get any taller. It gets taller.' },
  { name: '3D Printer',       type: 'item', operator: '+2', operator_value:  2, art_emoji: '🖨️', effect_text: 'Add +2 to one creature.', flavor_text: 'Printing something unidentifiable. Josh watches with genuine uncertainty. This counts as a win.' },
  { name: 'Robo-Sushi',       type: 'item', operator: '+1', operator_value:  1, art_emoji: '🍣', effect_text: 'Add +1 to one creature.', flavor_text: 'Conveyor belt. Wide eyes. Danny and Benny lean forward as the plates glide past. One more round.' },
  { name: 'Pottery Wheel',    type: 'item', operator: '+1', operator_value:  1, art_emoji: '🏺', effect_text: 'Add +1 to one creature.', flavor_text: 'Rachel at the wheel, clay-spattered apron, both hands in wet clay. Benny watching in total fascination.' },
  { name: 'Yogibo',           type: 'item', operator: '-2', operator_value: -2, art_emoji: '🛋️', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Danny has sunk in. Only his head and one arm remain. The Yogibo has won.' },
  { name: 'Legos',            type: 'item', operator: '-3', operator_value: -3, art_emoji: '🧱', effect_text: 'Subtract 3 from one creature.', flavor_text: 'One single brick. On the floor. In the dark. In the path of a bare foot. It waits.' },
  { name: "Dad's Softball Gear", type: 'item', operator: '-5', operator_value: -5, art_emoji: '⚾', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Permanently installed in the trunk. Rachel: arms crossed, one eyebrow raised. Josh: resigned expression.' },
  // ── ACTIONS ───────────────────────────────────────────────────────────
  { name: 'Get Coached',        type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '📋', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Josh is at the whiteboard. There are frameworks. There are follow-ups. Value doubles.' },
  { name: 'Build with Legos',   type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🏗️', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'The structure reaches the ceiling. Josh stands in the doorway in socks. Mid-decision. Five times the value.' },
  { name: 'Dance Party',        type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🕺', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Spontaneous. Living room. Disco ball. Everyone doing their own move. Abby running laps. ×10.' },
  { name: 'Watch Bluey',        type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '📺', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Crammed on the couch. Everyone absorbed. Two hours pass. Nobody noticed. Value halved.' },
  { name: 'Take A Nap',         type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '💤', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Rachel asleep on the couch. Benny zooms past on a scooter. She does not wake up. One fifth remains.' },
  { name: 'Go to Shul',         type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '✡️', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Prayer book open. Stained-glass light. Everyone in their seat. Reflection reverses everything.' },
  { name: 'Screen Time!',       type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '📱', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Benny reaches for the tablet. Josh redirects. Benny: maximum negotiation. Fifth time today. ×2 anyway.' },
  { name: 'Papa Tells A Story', type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '📖', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'One hand gesturing dramatically. Danny completely hooked. Benny\'s fork frozen mid-air. ×5 engaged.' },
  { name: 'Run Out of Gas',     type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '⛽', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Pulled over. Hazard lights on. Fuel gauge at E. Phone to one ear. This has happened before.' },
  { name: 'QFaRT',              type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '📚', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Quality Family Reading Time. Everyone in their corner. Nobody is reading together. It is perfect.' },
  // ── EVENTS ────────────────────────────────────────────────────────────
  { name: 'Family Vacation',    type: 'event', effect_type: 'x100', art_emoji: '🗺️', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'Midnight diner. Hot dogs and fries. Everyone laughing. Through the window: their minivan. This was not the plan. This is better.' },
  { name: 'Sibling Love',       type: 'event', effect_type: 'swap', art_emoji: '🤼', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'Anna points at Danny. Danny points at Benny. Benny points at Anna. Abby watches with a tired expression. They love each other enormously.' },
];

async function main() {
  const cardRows = cards.map(c => ({ ...c, release_id: RELEASE_ID }));
  const { data, error } = await sb.from('cards').insert(cardRows).select('id,name');
  if (error) { console.error(error); process.exit(1); }
  console.log(`Inserted ${data!.length} SilverBobs cards`);
  for (const c of data!) console.log(`  ${c.id}: ${c.name}`);
}
main();
