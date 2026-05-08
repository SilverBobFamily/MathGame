import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Release 42 — Comic Books ─────────────────────────────────────────────────
const r42Cards = [
  // CREATURES (14) — values: 10, 9, 7, 6, 5, 5, 4, 3, 3, 2, 1, 0, -2, -4
  { name: 'Superman',          type: 'creature', value: 10, art_emoji: '🦸', flavor_text: 'Faster than a speeding bullet. Still takes time to save everyone.' },
  { name: 'Batman',            type: 'creature', value:  9, art_emoji: '🦇', flavor_text: 'No powers. Just preparation — and an unlimited budget.' },
  { name: 'Spider-Man',        type: 'creature', value:  7, art_emoji: '🕷️', flavor_text: 'With great power comes great responsibility. He never forgets.' },
  { name: 'Wonder Woman',      type: 'creature', value:  6, art_emoji: '⚡', flavor_text: 'Ambassador of Themyscira. Her lasso compels only truth.' },
  { name: 'Iron Man',          type: 'creature', value:  5, art_emoji: '🤖', flavor_text: 'Genius, billionaire, playboy, philanthropist. The suit does the heavy lifting.' },
  { name: 'Captain America',   type: 'creature', value:  5, art_emoji: '🛡️', flavor_text: '"I can do this all day." — Steve Rogers' },
  { name: 'Thor',              type: 'creature', value:  4, art_emoji: '⚡', flavor_text: 'God of Thunder. Only the worthy may lift his hammer.' },
  { name: 'Black Panther',     type: 'creature', value:  3, art_emoji: '🐾', flavor_text: 'King of Wakanda. Science and tradition in perfect balance.' },
  { name: 'The Hulk',          type: 'creature', value:  3, art_emoji: '💚', flavor_text: 'The madder he gets, the stronger he gets. Always angry.' },
  { name: 'Doctor Strange',    type: 'creature', value:  2, art_emoji: '🌀', flavor_text: 'Master of the Mystic Arts. He checked all 14 million futures.' },
  { name: 'Aquaman',           type: 'creature', value:  1, art_emoji: '🐟', flavor_text: '"He talks to fish." They never let him live it down.' },
  { name: 'Hawkeye',           type: 'creature', value:  0, art_emoji: '🏹', flavor_text: 'Just a regular guy with a bow. Still shows up to fight gods.' },
  { name: 'Matter-Eater Lad',  type: 'creature', value: -2, art_emoji: '😬', flavor_text: "His superpower is eating matter. Any matter. The Legion was desperate." },
  { name: 'Stilt-Man',         type: 'creature', value: -4, art_emoji: '🦺', flavor_text: 'Daredevil defeats him every single time. He keeps making the stilts taller.' },
  // ITEMS (8) — 6 at ±1–3, 1 at +5, 1 at -5
  { name: 'Utility Belt',      type: 'item', operator: '+3', operator_value:  3, art_emoji: '🎒', effect_text: 'Add +3 to one creature.', flavor_text: 'He has a gadget for everything. Including this.' },
  { name: 'Web Cartridge',     type: 'item', operator: '+2', operator_value:  2, art_emoji: '🕸️', effect_text: 'Add +2 to one creature.', flavor_text: 'Homemade formula. Better than anything on the market.' },
  { name: 'Arc Reactor',       type: 'item', operator: '+5', operator_value:  5, art_emoji: '💡', effect_text: 'Add +5 to one creature.', flavor_text: 'Built in a cave with scraps. Lit up the century.' },
  { name: 'Adamantium Cuffs',  type: 'item', operator: '-5', operator_value: -5, art_emoji: '⛓️', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Even the strongest heroes are helpless in these.' },
  { name: 'Power Ring',        type: 'item', operator: '+1', operator_value:  1, art_emoji: '💍', effect_text: 'Add +1 to one creature.', flavor_text: 'In brightest day. Willpower made manifest.' },
  { name: 'Kryptonite Shard',  type: 'item', operator: '-3', operator_value: -3, art_emoji: '💚', effect_text: 'Subtract 3 from one creature.', flavor_text: 'The only thing Superman fears. Conveniently pocket-sized.' },
  { name: 'Shield',            type: 'item', operator: '+1', operator_value:  1, art_emoji: '🛡️', effect_text: 'Add +1 to one creature.', flavor_text: 'Forged from vibranium. Bounces back harder.' },
  { name: 'Cosmic Cube',       type: 'item', operator: '-2', operator_value: -2, art_emoji: '🟦', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Rewrites reality. Usually for the worse.' },
  // ACTIONS (6) — ×2, ×5, ×10, ÷2, ÷5, ×(-1)
  { name: 'Origin Story',      type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '☢️', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Every hero has one. The bite, the blast, the loss.' },
  { name: 'Power-Up',          type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '⬆️', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'The surge hits all at once. Fivefold the force.' },
  { name: 'Crossover Event',   type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '💥', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Every hero in one issue. Chaos at maximum scale.' },
  { name: 'Depowered',         type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '📉', effect_text: "Divide one creature's value by 2.",    flavor_text: 'The villain found the weakness. Power halved instantly.' },
  { name: 'The Blip',          type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🫧', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Half of everything, gone in an instant. One fifth remains.' },
  { name: 'Evil Clone',        type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🪞', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Same powers. Opposite agenda. The hero becomes the threat.' },
  // EVENTS (2)
  { name: 'Secret Invasion',   type: 'event', effect_type: 'mirror',   art_emoji: '👽', effect_text: 'Mirror: Copy any one creature\'s value onto another.',             flavor_text: 'Anyone could be a Skrull. Nobody trusts their teammates.' },
  { name: 'Infinite Crisis',   type: 'event', effect_type: 'zero_out', art_emoji: '🌌', effect_text: 'Zero Out: Set any one creature\'s value to 0.',                   flavor_text: 'Reality itself reboots. Some heroes just vanish from history.' },
];

// ── Release 43 — Board Games ──────────────────────────────────────────────────
const r43Cards = [
  // CREATURES (14) — values: 10, 9, 7, 6, 5, 5, 4, 3, 3, 2, 1, 0, -2, -4
  { name: 'Chess',               type: 'creature', value: 10, art_emoji: '♟️', flavor_text: 'The oldest strategy game. Every move echoes a thousand years of play.' },
  { name: 'Monopoly',            type: 'creature', value:  9, art_emoji: '🎩', flavor_text: 'Teaches capitalism young. Destroys friendships older.' },
  { name: 'Scrabble',            type: 'creature', value:  7, art_emoji: '🔤', flavor_text: '"QI is a valid word." — Every Scrabble player, desperately' },
  { name: 'Risk',                type: 'creature', value:  6, art_emoji: '🌍', flavor_text: 'World domination in four hours. Betrayal included.' },
  { name: 'Clue',                type: 'creature', value:  5, art_emoji: '🔍', flavor_text: 'Colonel Mustard. Candlestick. Library. Every time.' },
  { name: 'Settlers of Catan',   type: 'creature', value:  5, art_emoji: '🧱', flavor_text: '"I have wood for sheep." Negotiations never change.' },
  { name: 'Pandemic',            type: 'creature', value:  4, art_emoji: '🦠', flavor_text: 'Cooperate or lose. Even then, you probably lose.' },
  { name: 'Ticket to Ride',      type: 'creature', value:  3, art_emoji: '🚂', flavor_text: 'Build train routes. Block your friends. Smile apologetically.' },
  { name: 'Trivial Pursuit',     type: 'creature', value:  3, art_emoji: '🥧', flavor_text: 'The know-it-all at the table suddenly matters. They have waited for this.' },
  { name: 'Battleship',          type: 'creature', value:  2, art_emoji: '🚢', flavor_text: '"B-4." "Miss." Three hours later, still searching.' },
  { name: 'Connect Four',        type: 'creature', value:  1, art_emoji: '🔴', flavor_text: 'Simple. Perfect. Loses its luster after the hundredth game.' },
  { name: 'Candy Land',          type: 'creature', value:  0, art_emoji: '🍬', flavor_text: 'Zero decisions. Pure luck. Beloved by toddlers for exactly that reason.' },
  { name: 'Chutes and Ladders',  type: 'creature', value: -2, art_emoji: '🐍', flavor_text: 'You cannot strategize. You cannot win. You can only accept the chute.' },
  { name: 'Perfection',          type: 'creature', value: -4, art_emoji: '💣', flavor_text: 'The timer pops the tray. Every piece flies. The anxiety was the game.' },
  // ITEMS (8) — 6 at ±1–3, 1 at +5, 1 at -5
  { name: 'Get Out of Jail Free', type: 'item', operator: '+3', operator_value:  3, art_emoji: '🃏', effect_text: 'Add +3 to one creature.', flavor_text: 'The most coveted card in Monopoly. Hoard it until exactly the right moment.' },
  { name: 'Community Chest',      type: 'item', operator: '+2', operator_value:  2, art_emoji: '📦', effect_text: 'Add +2 to one creature.', flavor_text: 'Bank error in your favor. Collect two.' },
  { name: 'Hotel on Boardwalk',   type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏨', effect_text: 'Add +5 to one creature.', flavor_text: 'Land here and the game ends. It always ends.' },
  { name: 'Bankruptcy',           type: 'item', operator: '-5', operator_value: -5, art_emoji: '📉', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Pass Go, do not collect. The board has won.' },
  { name: 'Wild Card',            type: 'item', operator: '+1', operator_value:  1, art_emoji: '🃏', effect_text: 'Add +1 to one creature.', flavor_text: 'Small edge. Useful when everything else is equal.' },
  { name: 'Blockade',             type: 'item', operator: '-3', operator_value: -3, art_emoji: '🚧', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Your route is blocked. Re-route costs everything.' },
  { name: 'Spare Dice',           type: 'item', operator: '+1', operator_value:  1, art_emoji: '🎲', effect_text: 'Add +1 to one creature.', flavor_text: 'One extra roll. Sometimes that is all the luck you need.' },
  { name: 'Chance Card',          type: 'item', operator: '-2', operator_value: -2, art_emoji: '❓', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Advance to Go. Go directly to jail. Pay the piper.' },
  // ACTIONS (6)
  { name: 'Roll Again',           type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🎲', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Doubles rolled. Bonus turn. Value doubles with the momentum.' },
  { name: 'Power Play',           type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '⚡', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'One decisive move. Five times the impact on the board.' },
  { name: 'Grand Slam',           type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🏆', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The game-winning play. Nobody forgets this turn.' },
  { name: 'Skip Turn',            type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '⏭️', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Lose a turn. The penalty splits your power in two.' },
  { name: 'Go Back Five',         type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '⬅️', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Sent backward five spaces. Everything you built, reduced.' },
  { name: 'Reverse',              type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Flip one creature's value to its opposite.", flavor_text: "Uno Reverse. The direction changes. So does the value." },
  // EVENTS (2)
  { name: 'Game Night',           type: 'event', effect_type: 'x100',  art_emoji: '🌙', effect_text: "×100: Multiply any one creature's value by 100.",                   flavor_text: 'One legendary game. The table falls quiet. Someone wins everything.' },
  { name: 'House Rules',          type: 'event', effect_type: 'swap',   art_emoji: '🏠', effect_text: 'Swap: Exchange any two creatures between sides of the field.',      flavor_text: 'Free parking pays out. The rules you always played with take over.' },
];

// ── Release 44 — American Revolution ─────────────────────────────────────────
const r44Cards = [
  // CREATURES (14) — values: 10, 9, 7, 6, 5, 5, 4, 3, 3, 2, 1, 0, -2, -4
  { name: 'George Washington',         type: 'creature', value: 10, art_emoji: '🎖️', flavor_text: 'Crossed the Delaware in a blizzard. Victory was not optional.' },
  { name: 'Benjamin Franklin',         type: 'creature', value:  9, art_emoji: '⚡', flavor_text: 'Invented bifocals and lightning rods. Also charmed all of Paris into an alliance.' },
  { name: 'Thomas Jefferson',          type: 'creature', value:  7, art_emoji: '✍️', flavor_text: '"We hold these truths to be self-evident." He wrote that in one draft.' },
  { name: 'Alexander Hamilton',        type: 'creature', value:  6, art_emoji: '💵', flavor_text: 'Built the Treasury from scratch. Nobody argues with a founding father on the ten.' },
  { name: 'John Adams',                type: 'creature', value:  5, art_emoji: '📜', flavor_text: '"Facts are stubborn things." — John Adams, at every opportunity' },
  { name: 'Marquis de Lafayette',      type: 'creature', value:  5, art_emoji: '🇫🇷', flavor_text: 'Sailed from France to fight for freedom. America owed him everything.' },
  { name: 'Paul Revere',               type: 'creature', value:  4, art_emoji: '🐴', flavor_text: 'Rode through the night to warn the Minutemen. The British were coming.' },
  { name: 'Abigail Adams',             type: 'creature', value:  3, art_emoji: '🕯️', flavor_text: '"Remember the ladies." — Abigail Adams, still waiting for them to listen' },
  { name: 'Ethan Allen',               type: 'creature', value:  3, art_emoji: '🏔️', flavor_text: 'Took Fort Ticonderoga before breakfast. The Green Mountain Boys did not ask twice.' },
  { name: 'John Hancock',              type: 'creature', value:  2, art_emoji: '✒️', flavor_text: 'Signed his name large enough for King George to read without glasses.' },
  { name: 'Thomas Paine',              type: 'creature', value:  1, art_emoji: '📰', flavor_text: '"These are the times that try men\'s souls." Pamphlet sold like wildfire.' },
  { name: 'King George III',           type: 'creature', value:  0, art_emoji: '👑', flavor_text: 'Lost an entire continent and called it a misunderstanding.' },
  { name: 'Lord Cornwallis',           type: 'creature', value: -2, art_emoji: '🏳️', flavor_text: 'Surrendered at Yorktown. His band played "The World Turned Upside Down."' },
  { name: 'Benedict Arnold',           type: 'creature', value: -4, art_emoji: '🗡️', flavor_text: 'America\'s greatest general — then its greatest traitor. History chose one story.' },
  // ITEMS (8) — 6 at ±1–3, 1 at +5, 1 at -5
  { name: 'Musket',                    type: 'item', operator: '+3', operator_value:  3, art_emoji: '🔫', effect_text: 'Add +3 to one creature.', flavor_text: 'One shot. Make it count. Reload takes a minute.' },
  { name: 'Tricorn Hat',               type: 'item', operator: '+2', operator_value:  2, art_emoji: '🎩', effect_text: 'Add +2 to one creature.', flavor_text: 'The hat of the patriot. Instantly commanding.' },
  { name: 'Declaration of Independence', type: 'item', operator: '+5', operator_value:  5, art_emoji: '📜', effect_text: 'Add +5 to one creature.', flavor_text: '1,320 words that changed history. Jefferson wrote it in two weeks.' },
  { name: 'Taxation Without Representation', type: 'item', operator: '-5', operator_value: -5, art_emoji: '💰', effect_text: 'Subtract 5 from one creature.', flavor_text: 'The colonies paid and paid. Then they stopped.' },
  { name: 'Lantern Signal',            type: 'item', operator: '+1', operator_value:  1, art_emoji: '🏮', effect_text: 'Add +1 to one creature.', flavor_text: 'One if by land, two if by sea. The light changed everything.' },
  { name: 'Tory Pamphlet',             type: 'item', operator: '-3', operator_value: -3, art_emoji: '🗞️', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Loyalist propaganda. It found an audience and did its damage.' },
  { name: 'Bayonet',                   type: 'item', operator: '+1', operator_value:  1, art_emoji: '⚔️', effect_text: 'Add +1 to one creature.', flavor_text: 'When the musket runs dry, you still have this.' },
  { name: 'Redcoat Ambush',            type: 'item', operator: '-2', operator_value: -2, art_emoji: '🎯', effect_text: 'Subtract 2 from one creature.', flavor_text: 'They came in formation. The colonists shot from the trees.' },
  // ACTIONS (6)
  { name: 'Midnight Ride',             type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🌙', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'The alarm doubles the force of every fighter who hears it.' },
  { name: 'Sons of Liberty',           type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🗽', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Five patriots act as one. The crown cannot count fast enough.' },
  { name: 'Continental Army',          type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '⚔️', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Washington\'s army multiplied: ragged, freezing, unstoppable.' },
  { name: 'Retreat to Valley Forge',   type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '❄️', effect_text: "Divide one creature's value by 2.",    flavor_text: 'The winter halved their numbers. Those who stayed grew harder.' },
  { name: 'Redcoat Formation',         type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🟥', effect_text: "Divide one creature's value by 5.",    flavor_text: 'March in line. Present easy targets. Lose a fifth of your strength.' },
  { name: 'Defection',                 type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔁', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'The ally becomes the enemy. The patriot turns his coat.' },
  // EVENTS (2)
  { name: 'Boston Tea Party',          type: 'event', effect_type: 'reverse', art_emoji: '🍵', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'They dumped 342 chests into the harbor. Everything turned against the Crown.' },
  { name: 'Battle of Yorktown',        type: 'event', effect_type: 'banish',  art_emoji: '💣', effect_text: 'Banish: Remove any one creature from the game.',                  flavor_text: 'Cornwallis surrendered. The war\'s last battle banished British rule for good.' },
];

async function main() {
  // ─── Upsert releases ────────────────────────────────────────────────────────
  const releaseDefs = [
    { number: 42, name: 'Comic Books',         icon: '💥', color_hex: '#b71c1c' },
    { number: 43, name: 'Board Games',         icon: '🎲', color_hex: '#4a148c' },
    { number: 44, name: 'American Revolution', icon: '🗽', color_hex: '#0d47a1' },
  ];

  const releasesResult: Array<{ id: string; number: number; name: string }> = [];

  for (const rel of releaseDefs) {
    let num = rel.number;
    let inserted = false;
    while (!inserted) {
      const { data, error } = await supabase
        .from('releases')
        .upsert({ number: num, name: rel.name, icon: rel.icon, color_hex: rel.color_hex }, { onConflict: 'number' })
        .select('id, number, name')
        .single();

      if (error) {
        console.error(`Error upserting release ${rel.name} at number ${num}:`, error.message);
        num += 1;
      } else {
        releasesResult.push(data);
        console.log(`✅ Release "${data.name}" → number=${data.number}, id=${data.id}`);
        inserted = true;
      }
    }
  }

  // ─── Insert cards ────────────────────────────────────────────────────────────
  const cardSets = [r42Cards, r43Cards, r44Cards];

  for (let i = 0; i < releasesResult.length; i++) {
    const release = releasesResult[i];
    const cards = cardSets[i].map((c) => ({ ...c, release_id: release.id }));
    const { error } = await supabase.from('cards').insert(cards);
    if (error) {
      console.error(`Error inserting cards for release "${release.name}":`, error.message);
    } else {
      console.log(`✅ Inserted ${cards.length} cards for "${release.name}"`);
    }
  }

  console.log('\n📦 Summary:');
  for (const r of releasesResult) {
    console.log(`  ${r.name}: number=${r.number}, id=${r.id}`);
  }
}

main().catch(console.error);
