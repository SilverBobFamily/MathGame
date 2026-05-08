import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─────────────────────────────────────────────────────────────────────────────
// R42: ANIME  🌸  #e91e63
// ─────────────────────────────────────────────────────────────────────────────
const r42Cards = [
  // CREATURES (14) — values: 10,9,7,6,5,5,4,3,3,2,1,0,-2,-4
  { name: 'Goku',          type: 'creature', value: 10, art_emoji: '💥', flavor_text: "I am the hope of the universe. I am the answer to all living things." },
  { name: 'Saitama',       type: 'creature', value:  9, art_emoji: '👊', flavor_text: 'One punch. Every time. It stopped being fun.' },
  { name: 'Naruto Uzumaki',type: 'creature', value:  7, art_emoji: '🍥', flavor_text: "Believe it! The future Hokage doesn't give up." },
  { name: 'Levi Ackerman', type: 'creature', value:  6, art_emoji: '⚔️', flavor_text: "'Strength alone cannot protect people.' — Erwin Smith" },
  { name: 'Sailor Moon',   type: 'creature', value:  5, art_emoji: '🌙', flavor_text: 'I am Sailor Moon, champion of justice! In the name of the moon, I will punish you.' },
  { name: 'Luffy',         type: 'creature', value:  5, art_emoji: '⚓', flavor_text: 'I want to be King of the Pirates. It sounded simpler before the Grand Line.' },
  { name: 'Edward Elric',  type: 'creature', value:  4, art_emoji: '⚗️', flavor_text: "Equivalent exchange: you give up everything to gain everything. He gave an arm." },
  { name: 'Totoro',        type: 'creature', value:  3, art_emoji: '🌳', flavor_text: 'Guardian of the forest. Mostly naps. Still dependable.' },
  { name: 'Howl',          type: 'creature', value:  3, art_emoji: '🌹', flavor_text: "'A heart is a heavy burden.' — Sophie Hatter" },
  { name: 'Nausicaä',      type: 'creature', value:  2, art_emoji: '🌿', flavor_text: 'She tamed giant insects. She also tamed a god warrior. She was twelve.' },
  { name: 'Kiki',          type: 'creature', value:  1, art_emoji: '🧹', flavor_text: 'Witch-for-hire, age thirteen. Lost her powers briefly. Delivered the pie anyway.' },
  { name: 'Shinji Ikari',  type: 'creature', value:  0, art_emoji: '🤖', flavor_text: "Get in the robot. He doesn't want to." },
  { name: 'Yamcha',        type: 'creature', value: -2, art_emoji: '💀', flavor_text: "'At least he tried.' — Everyone at his funeral" },
  { name: 'Ash Ketchum',   type: 'creature', value: -4, art_emoji: '⚡', flavor_text: 'Ten years old, traveled the world, lost every major tournament. Dreams remain.' },

  // ITEMS (8) — 6 small (+/-1..3), 1 at +5, 1 at -5
  { name: 'Senzu Bean',       type: 'item', operator: '+3', operator_value: 3,  art_emoji: '🫘', effect_text: 'Add +3 to one creature.', flavor_text: 'Full recovery in one bite. Carry exactly three at all times.' },
  { name: 'Power Scroll',     type: 'item', operator: '+2', operator_value: 2,  art_emoji: '📜', effect_text: 'Add +2 to one creature.', flavor_text: 'Ancient training secrets. Mostly homework.' },
  { name: 'Chakra Boost',     type: 'item', operator: '+1', operator_value: 1,  art_emoji: '✨', effect_text: 'Add +1 to one creature.', flavor_text: 'A small surge. Better than nothing, Naruto.' },
  { name: 'Training Weights', type: 'item', operator: '-1', operator_value: -1, art_emoji: '🏋️', effect_text: 'Subtract 1 from one creature.', flavor_text: 'Worn during fights to build character. Slows everything down.' },
  { name: 'Cursed Seal',      type: 'item', operator: '-2', operator_value: -2, art_emoji: '🔱', effect_text: 'Subtract 2 from one creature.', flavor_text: "'Power has a price.' — Orochimaru, smiling" },
  { name: 'Minus Energy',     type: 'item', operator: '-3', operator_value: -3, art_emoji: '🌀', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Saps the will. Shinji felt this before anyone gave it a name.' },
  { name: 'Dragon Ball',      type: 'item', operator: '+5', operator_value: 5,  art_emoji: '⭐', effect_text: 'Add +5 to one creature.', flavor_text: 'Collect all seven and your wish is granted. Finding them is the hard part.' },
  { name: 'Hollow Mask',      type: 'item', operator: '-5', operator_value: -5, art_emoji: '💀', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Immense power at immense cost. The mask always takes more than it gives.' },

  // ACTIONS (6) — ×2, ×5, ×10, ÷2, ÷5, ×(-1)
  { name: 'Kaioken',         type: 'action', operator: '×2',    operator_value: 2,    art_emoji: '🔴', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Double the power, double the risk. Goku uses it anyway.' },
  { name: 'Kamehameha ×5',   type: 'action', operator: '×5',    operator_value: 5,    art_emoji: '💫', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Twenty years of training, charged in two seconds.' },
  { name: 'Super Saiyan 3',  type: 'action', operator: '×10',   operator_value: 10,   art_emoji: '⚡', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The hair alone adds ten levels. The eyebrows disappear entirely.' },
  { name: 'Sealing Jutsu',   type: 'action', operator: '÷2',    operator_value: 0.5,  art_emoji: '🔒', effect_text: "Divide one creature's value by 2.",    flavor_text: "Half their power, sealed away. Naruto's entire origin story." },
  { name: 'Limiter Seal',    type: 'action', operator: '÷5',    operator_value: 0.2,  art_emoji: '⛓️', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Saitama hit his limiter at 20%. Sealed himself back down to human.' },
  { name: 'Reverse Alchemy', type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Multiply one creature's value by -1.", flavor_text: 'Equivalent exchange inverted. Edward did the math twice to be sure.' },

  // EVENTS (2) — one from {x100, mirror}, one from {swap, reverse, banish, zero_out}
  { name: 'Ultra Instinct',  type: 'event', effect_type: 'x100',    art_emoji: '🌟', effect_text: "×100: Multiply any one creature's value by 100.",       flavor_text: 'Beyond power. Beyond thought. Even Beerus looked worried.' },
  { name: 'Fusion Dance',    type: 'event', effect_type: 'swap',    art_emoji: '🕺', effect_text: "Swap: Exchange any two creatures between sides.",          flavor_text: 'Perfect sync required. One wrong step and you get Veku.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// R43: VIDEO GAMES  🎮  #1565c0
// ─────────────────────────────────────────────────────────────────────────────
const r43Cards = [
  // CREATURES (14) — values: 10,9,7,6,5,5,4,3,3,2,1,0,-2,-4
  { name: 'Master Chief',  type: 'creature', value: 10, art_emoji: '🎖️', flavor_text: 'Spartan-117. Finished the fight. Then had to keep finishing it.' },
  { name: 'Link',          type: 'creature', value:  9, art_emoji: '🗡️', flavor_text: 'Hero of Time, seven times over. Never complained once.' },
  { name: 'Lara Croft',    type: 'creature', value:  7, art_emoji: '🏹', flavor_text: "'Anything worth doing is worth overdoing.' — Lara Croft" },
  { name: 'Mario',         type: 'creature', value:  6, art_emoji: '🍄', flavor_text: 'Plumber. Racer. Doctor. Champion. Still gets his princess stolen.' },
  { name: 'Pac-Man',       type: 'creature', value:  5, art_emoji: '🟡', flavor_text: 'Eats everything in his path. Terrified of ghosts. Same.' },
  { name: 'Sonic',         type: 'creature', value:  5, art_emoji: '💨', flavor_text: "Faster than sound. Can't swim. Life is a tradeoff." },
  { name: 'Kirby',         type: 'creature', value:  4, art_emoji: '🌸', flavor_text: "Inhales enemies and becomes them. Cutest threat in the universe." },
  { name: 'Donkey Kong',   type: 'creature', value:  3, art_emoji: '🍌', flavor_text: 'He is the Kong. Donkey Kong. That tie is load-bearing.' },
  { name: 'Samus Aran',    type: 'creature', value:  3, art_emoji: '🚀', flavor_text: "'Chozo-trained, bounty hunter by trade.' — Admiral Dane" },
  { name: 'Pikachu',       type: 'creature', value:  2, art_emoji: '⚡', flavor_text: 'Pocket-sized. 50,000 volts. Still rides in a ball voluntarily.' },
  { name: 'Toad',          type: 'creature', value:  1, art_emoji: '🍄', flavor_text: 'The princess is in another castle. He delivers the message. Every time.' },
  { name: 'Slime',         type: 'creature', value:  0, art_emoji: '💚', flavor_text: 'First enemy you meet in every RPG. Blue, bouncy, forgettable.' },
  { name: 'Bowser Jr.',    type: 'creature', value: -2, art_emoji: '🐢', flavor_text: "Daddy's plan never works. Junior helps anyway." },
  { name: 'Waluigi',       type: 'creature', value: -4, art_emoji: '🟣', flavor_text: 'WAH. Excluded from Smash. Excluded from love. The universe is imbalanced.' },

  // ITEMS (8)
  { name: 'Power-Up Mushroom', type: 'item', operator: '+3', operator_value: 3,  art_emoji: '🍄', effect_text: 'Add +3 to one creature.', flavor_text: 'Doubles your size. Works on everything but your problems.' },
  { name: 'Fire Flower',       type: 'item', operator: '+2', operator_value: 2,  art_emoji: '🌸', effect_text: 'Add +2 to one creature.', flavor_text: 'Throw fireballs. Run faster. Still fall into the pit.' },
  { name: 'Star Power',        type: 'item', operator: '+1', operator_value: 1,  art_emoji: '⭐', effect_text: 'Add +1 to one creature.', flavor_text: 'Invincibility, briefly. The music is great.' },
  { name: 'Blue Shell',        type: 'item', operator: '-1', operator_value: -1, art_emoji: '🐢', effect_text: 'Subtract 1 from one creature.', flavor_text: 'Seeks the leader. Friendships rarely survive it.' },
  { name: 'Poison Mushroom',   type: 'item', operator: '-2', operator_value: -2, art_emoji: '💜', effect_text: 'Subtract 2 from one creature.', flavor_text: "'Never eat the purple one.' — Everyone" },
  { name: 'Game Over',         type: 'item', operator: '-3', operator_value: -3, art_emoji: '💀', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Insert coin to continue. Or don\'t. The screen blinks regardless.' },
  { name: 'Extra Life',        type: 'item', operator: '+5', operator_value: 5,  art_emoji: '❤️', effect_text: 'Add +5 to one creature.', flavor_text: 'Found 100 coins. Earned one more chance. Use it wisely.' },
  { name: 'Cursed RNG',        type: 'item', operator: '-5', operator_value: -5, art_emoji: '🎲', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Probability went wrong. It always goes wrong at the boss.' },

  // ACTIONS (6)
  { name: 'Level Up',      type: 'action', operator: '×2',    operator_value: 2,    art_emoji: '📈', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Ding! New stat allocation pending. Feel the power surge.' },
  { name: 'Haste Mode',    type: 'action', operator: '×5',    operator_value: 5,    art_emoji: '⚡', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Cheat code unlocked. Movement speed: unreasonable.' },
  { name: 'God Mode',      type: 'action', operator: '×10',   operator_value: 10,   art_emoji: '🏆', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Invincibility code: IDDQD. The developers left the door open.' },
  { name: 'Nerf Patch',    type: 'action', operator: '÷2',    operator_value: 0.5,  art_emoji: '🔧', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Community complained. Developer apologized. Balance restored (at half).' },
  { name: 'Lag Spike',     type: 'action', operator: '÷5',    operator_value: 0.2,  art_emoji: '📶', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Connection: 1 bar. Reaction time: geological. GG.' },
  { name: 'Mirror Match',  type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🪞', effect_text: "Multiply one creature's value by -1.", flavor_text: 'Your worst opponent is yourself. This makes it literal.' },

  // EVENTS (2)
  { name: 'Speed Run',   type: 'event', effect_type: 'x100',    art_emoji: '🏃', effect_text: "×100: Multiply any one creature's value by 100.",        flavor_text: 'World record attempt. Timer running. Every frame counts.' },
  { name: 'Respawn',     type: 'event', effect_type: 'reverse', art_emoji: '🔁', effect_text: "Reverse: Flip the sign of every creature on one side.",   flavor_text: 'You died. You came back wrong. Enemies found this very interesting.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// R44: US PRESIDENTS  🎩  #1a237e
// ─────────────────────────────────────────────────────────────────────────────
const r44Cards = [
  // CREATURES (14) — values: 10,9,7,6,5,5,4,3,3,2,1,0,-2,-4
  { name: 'Abraham Lincoln',    type: 'creature', value: 10, art_emoji: '🎩', flavor_text: 'Preserved the Union. Ended slavery. Tall hat. Every list starts here.' },
  { name: 'George Washington',  type: 'creature', value:  9, art_emoji: '🦅', flavor_text: 'Could have been king. Resigned instead. The standard everything else is measured against.' },
  { name: 'FDR',                type: 'creature', value:  7, art_emoji: '♿', flavor_text: 'Four terms, a depression, a world war. He just kept going.' },
  { name: 'Thomas Jefferson',   type: 'creature', value:  6, art_emoji: '📜', flavor_text: "'We hold these truths to be self-evident.' He wrote that on a deadline." },
  { name: 'Theodore Roosevelt', type: 'creature', value:  5, art_emoji: '🐻', flavor_text: 'Charged San Juan Hill. Founded national parks. Survived being shot mid-speech.' },
  { name: 'Barack Obama',       type: 'creature', value:  5, art_emoji: '🌐', flavor_text: "'Change will not come if we wait for some other person.' — Barack Obama" },
  { name: 'Dwight Eisenhower',  type: 'creature', value:  4, art_emoji: '⭐', flavor_text: 'Built the interstate highway system. Won the war first. Low-key legend.' },
  { name: 'James Madison',      type: 'creature', value:  3, art_emoji: '📋', flavor_text: 'Father of the Constitution. Five foot four. The document stands taller.' },
  { name: 'JFK',                type: 'creature', value:  3, art_emoji: '🚀', flavor_text: 'We chose to go to the moon. Not because it was easy.' },
  { name: 'Harry Truman',       type: 'creature', value:  2, art_emoji: '🪧', flavor_text: "'The buck stops here.' Sign on his desk. He meant it." },
  { name: 'Gerald Ford',        type: 'creature', value:  1, art_emoji: '🩹', flavor_text: 'Our long national nightmare is over. He did the steady, unglamorous work.' },
  { name: 'Millard Fillmore',   type: 'creature', value:  0, art_emoji: '😐', flavor_text: "Consensus pick for forgettable. Historians keep checking to make sure he existed." },
  { name: 'James Buchanan',     type: 'creature', value: -2, art_emoji: '🕳️', flavor_text: 'The Civil War was approaching. He did nothing. Historians agree on little else.' },
  { name: 'Andrew Johnson',     type: 'creature', value: -4, art_emoji: '⚖️', flavor_text: 'First president impeached. Actively undermined Reconstruction. History was not kind.' },

  // ITEMS (8)
  { name: 'Executive Order',   type: 'item', operator: '+3', operator_value: 3,  art_emoji: '✍️', effect_text: 'Add +3 to one creature.', flavor_text: 'Signed with a flourish. Takes effect immediately. Congress annoyed.' },
  { name: 'Veto Pen',          type: 'item', operator: '+2', operator_value: 2,  art_emoji: '🖊️', effect_text: 'Add +2 to one creature.', flavor_text: 'Two words: Not signed. Enormous power in a small gesture.' },
  { name: 'Press Conference',  type: 'item', operator: '+1', operator_value: 1,  art_emoji: '🎤', effect_text: 'Add +1 to one creature.', flavor_text: 'Talking helps. Mostly.' },
  { name: 'Scandal',           type: 'item', operator: '-1', operator_value: -1, art_emoji: '📰', effect_text: 'Subtract 1 from one creature.', flavor_text: 'Front page. Bad week. Legacy dented.' },
  { name: 'Filibuster',        type: 'item', operator: '-2', operator_value: -2, art_emoji: '📣', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Strom Thurmond spoke for 24 hours to stop a civil rights bill. It passed.' },
  { name: 'Impeachment',       type: 'item', operator: '-3', operator_value: -3, art_emoji: '⚖️', effect_text: 'Subtract 3 from one creature.', flavor_text: 'A political earthquake. The Senate still has to convict.' },
  { name: 'New Deal',          type: 'item', operator: '+5', operator_value: 5,  art_emoji: '🏗️', effect_text: 'Add +5 to one creature.', flavor_text: 'Banks, jobs, infrastructure. FDR rebuilt an entire nation on one handshake.' },
  { name: 'Constitutional Crisis', type: 'item', operator: '-5', operator_value: -5, art_emoji: '🔥', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Everything is on fire. Institutionally speaking.' },

  // ACTIONS (6)
  { name: 'State of the Union',   type: 'action', operator: '×2',    operator_value: 2,    art_emoji: '📺', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Nationally televised. Standing ovations mandatory. Power doubled.' },
  { name: 'Bully Pulpit',         type: 'action', operator: '×5',    operator_value: 5,    art_emoji: '📢', effect_text: "Multiply one creature's value by 5.",   flavor_text: "TR coined it. The presidency as megaphone. Use it wisely." },
  { name: 'Nuclear Option',       type: 'action', operator: '×10',   operator_value: 10,   art_emoji: '☢️', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Named for the ultimate lever. In Senate procedure, also very destructive.' },
  { name: 'Lame Duck Session',    type: 'action', operator: '÷2',    operator_value: 0.5,  art_emoji: '🦆', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Lost the election, still in office. Power drains by the day.' },
  { name: 'Term Limits',          type: 'action', operator: '÷5',    operator_value: 0.2,  art_emoji: '📅', effect_text: "Divide one creature's value by 5.",    flavor_text: 'The 22nd Amendment said no to a third term. Democracy at one-fifth speed.' },
  { name: 'Partisan Reversal',    type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Multiply one creature's value by -1.", flavor_text: "The South flipped. The parties flipped. The map turned inside out." },

  // EVENTS (2)
  { name: 'Electoral Landslide', type: 'event', effect_type: 'mirror',    art_emoji: '🗺️', effect_text: "Mirror: Copy any one creature's value onto another.", flavor_text: 'FDR won 523 electoral votes. The map echoed itself coast to coast.' },
  { name: 'Cabinet Reshuffle',   type: 'event', effect_type: 'banish',    art_emoji: '🚪', effect_text: "Banish: Remove any one creature from the game.",         flavor_text: "You're fired. Diplomatically worded. Effective immediately." },
];

const newReleases = [
  { number: 42, name: 'Anime',        icon: '🌸', color_hex: '#e91e63' },
  { number: 43, name: 'Video Games',  icon: '🎮', color_hex: '#1565c0' },
  { number: 44, name: 'US Presidents', icon: '🎩', color_hex: '#1a237e' },
];

const newReleaseCardPairs = [
  { number: 42, cards: r42Cards },
  { number: 43, cards: r43Cards },
  { number: 44, cards: r44Cards },
];

async function addReleases() {
  const { data: releaseRows, error: relErr } = await supabase
    .from('releases')
    .upsert(newReleases, { onConflict: 'number' })
    .select();
  if (relErr) { console.error('Release error:', relErr); process.exit(1); }
  console.log(`Upserted ${releaseRows!.length} releases`);

  for (const { number, cards } of newReleaseCardPairs) {
    const release = releaseRows!.find(r => r.number === number)!;
    const cardRows = cards.map(c => ({ ...c, release_id: release.id }));
    const { error } = await supabase.from('cards').insert(cardRows);
    if (error) { console.error(`Error inserting R${number}:`, error); process.exit(1); }
    console.log(`Inserted ${cardRows.length} cards for R${number} (DB id: ${release.id})`);
  }
  console.log('Done!');
}

addReleases();
