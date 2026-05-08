import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// R45: Countries
// 14 creatures: values 10,9,7,6,5,5,4,3,3,2,1,0,-2,-4
// 8 items: 6 small (±1–±3), 1 at +5, 1 at -5
// 6 actions: ×2, ×5, ×10, ÷2, ÷5, ×(-1)
// 2 events: one from {x100, mirror}, one from {swap, reverse, banish, zero_out}
const r45Cards = [
  // Creatures
  { name: 'United States', type: 'creature', value: 10, art_emoji: '🇺🇸',
    flavor_text: 'The land of the free, the home of the brave — and the world\'s largest economy.' },
  { name: 'China', type: 'creature', value: 9, art_emoji: '🇨🇳',
    flavor_text: '"We are not a threat to anyone. We are a civilization." — China' },
  { name: 'France', type: 'creature', value: 7, art_emoji: '🇫🇷',
    flavor_text: 'Liberty, equality, fraternity — and a cuisine that conquered the world.' },
  { name: 'Brazil', type: 'creature', value: 6, art_emoji: '🇧🇷',
    flavor_text: 'A continent of a country: rainforest, samba, and boundless ambition.' },
  { name: 'Japan', type: 'creature', value: 5, art_emoji: '🇯🇵',
    flavor_text: 'Ancient honor, neon future. No contradiction required.' },
  { name: 'United Kingdom', type: 'creature', value: 5, art_emoji: '🇬🇧',
    flavor_text: '"An empire on which the sun never sets." — Old boast, enduring legacy.' },
  { name: 'India', type: 'creature', value: 4, art_emoji: '🇮🇳',
    flavor_text: 'A billion voices, a thousand languages, one indomitable democracy.' },
  { name: 'Germany', type: 'creature', value: 3, art_emoji: '🇩🇪',
    flavor_text: 'Efficiency, precision, and a beer garden at every corner.' },
  { name: 'Mexico', type: 'creature', value: 3, art_emoji: '🇲🇽',
    flavor_text: 'Pyramids before skyscrapers. Salsa before spreadsheets.' },
  { name: 'Canada', type: 'creature', value: 2, art_emoji: '🇨🇦',
    flavor_text: 'Polite by reputation, vast by fact, underestimated by everyone.' },
  { name: 'Nigeria', type: 'creature', value: 1, art_emoji: '🇳🇬',
    flavor_text: 'Africa\'s giant stirs. The world had better pay attention.' },
  { name: 'Switzerland', type: 'creature', value: 0, art_emoji: '🇨🇭',
    flavor_text: 'Neutral in all things. Has opinions about cheese.' },
  { name: 'Venezuela', type: 'creature', value: -2, art_emoji: '🇻🇪',
    flavor_text: 'Oil-rich soil, empty shelves. A cautionary tale in four colors.' },
  { name: 'North Korea', type: 'creature', value: -4, art_emoji: '🇰🇵',
    flavor_text: 'Isolated, armed, and impossible to reason with. A land of zero.\n— Switzerland' },

  // Items
  { name: 'Diplomatic Passport', type: 'item', operator: '+3', operator_value: 3, art_emoji: '📘',
    effect_text: 'Add +3 to one creature.',
    flavor_text: 'Open sesame, in navy blue.' },
  { name: 'Trade Agreement', type: 'item', operator: '+2', operator_value: 2, art_emoji: '🤝',
    effect_text: 'Add +2 to one creature.',
    flavor_text: 'Nations prosper when they share.' },
  { name: 'Cultural Exchange', type: 'item', operator: '+1', operator_value: 1, art_emoji: '🎭',
    effect_text: 'Add +1 to one creature.',
    flavor_text: 'Art crosses borders without a visa.' },
  { name: 'Foreign Aid', type: 'item', operator: '+5', operator_value: 5, art_emoji: '💰',
    effect_text: 'Add +5 to one creature.',
    flavor_text: 'Generosity, or leverage? Often both.' },
  { name: 'Trade Embargo', type: 'item', operator: '-2', operator_value: -2, art_emoji: '🚫',
    effect_text: 'Subtract 2 from one creature.',
    flavor_text: 'Commerce denied is power denied.' },
  { name: 'Sanctions', type: 'item', operator: '-3', operator_value: -3, art_emoji: '⛔',
    effect_text: 'Subtract 3 from one creature.',
    flavor_text: 'The polite alternative to war.' },
  { name: 'Border Tax', type: 'item', operator: '-1', operator_value: -1, art_emoji: '🪙',
    effect_text: 'Subtract 1 from one creature.',
    flavor_text: 'Every crossing has a cost.' },
  { name: 'Debt Crisis', type: 'item', operator: '-5', operator_value: -5, art_emoji: '📉',
    effect_text: 'Subtract 5 from one creature.',
    flavor_text: 'What the IMF calls a "situation."' },

  // Actions
  { name: 'Summit Meeting', type: 'action', operator: '×2', operator_value: 2, art_emoji: '🏛️',
    effect_text: 'Multiply one creature\'s value by 2.',
    flavor_text: 'Two leaders, one table, double the stakes.' },
  { name: 'Nuclear Arsenal', type: 'action', operator: '×5', operator_value: 5, art_emoji: '☢️',
    effect_text: 'Multiply one creature\'s value by 5.',
    flavor_text: 'Deterrence, they call it. Math calls it multiplication.' },
  { name: 'World War', type: 'action', operator: '×10', operator_value: 10, art_emoji: '⚔️',
    effect_text: 'Multiply one creature\'s value by 10.',
    flavor_text: 'A conflict that reshapes the map.' },
  { name: 'Ceasefire', type: 'action', operator: '÷2', operator_value: 0.5, art_emoji: '🕊️',
    effect_text: 'Divide one creature\'s value by 2.',
    flavor_text: 'Half the hostility is still progress.' },
  { name: 'Peacekeeping Force', type: 'action', operator: '÷5', operator_value: 0.2, art_emoji: '🪖',
    effect_text: 'Divide one creature\'s value by 5.',
    flavor_text: 'The UN arrives. Ambitions shrink.' },
  { name: 'Regime Change', type: 'action', operator: '×(-1)', operator_value: -1, art_emoji: '🔄',
    effect_text: 'Multiply one creature\'s value by -1.',
    flavor_text: 'What was powerful becomes a liability overnight.' },

  // Events
  { name: 'Global Superpower', type: 'event', effect_type: 'x100', art_emoji: '🌐',
    effect_text: '×100: Multiply any one creature\'s value by 100.',
    flavor_text: 'Hegemony achieved. The rest of the world adjusts.' },
  { name: 'Border Swap', type: 'event', effect_type: 'swap', art_emoji: '🗺️',
    effect_text: 'Swap: Exchange any two creatures between sides.',
    flavor_text: 'History is full of maps that didn\'t last.' },
];

// R46: Modern Broadway
// 14 creatures: values 10,9,7,6,5,5,4,3,3,2,1,0,-2,-4
// 8 items: 6 small (±1–±3), 1 at +5, 1 at -5
// 6 actions: ×2, ×5, ×10, ÷2, ÷5, ×(-1)
// 2 events: one from {x100, mirror}, one from {swap, reverse, banish, zero_out}
const r46Cards = [
  // Creatures
  { name: 'Hamilton', type: 'creature', value: 10, art_emoji: '🎤',
    flavor_text: 'I am not throwing away my shot.' },
  { name: 'Elphaba', type: 'creature', value: 9, art_emoji: '🧙‍♀️',
    flavor_text: 'I\'m through accepting limits, because someone says they\'re so.' },
  { name: 'Jean Valjean', type: 'creature', value: 7, art_emoji: '🕯️',
    flavor_text: '"Who am I?" A man worth ten times his number.' },
  { name: 'Roger Davis', type: 'creature', value: 6, art_emoji: '🎸',
    flavor_text: 'How do you measure a year? In love, in song, in minutes.' },
  { name: 'Simba', type: 'creature', value: 5, art_emoji: '🦁',
    flavor_text: 'The circle of life demands he claim the throne.' },
  { name: 'Persephone', type: 'creature', value: 5, art_emoji: '🌸',
    flavor_text: '"Every song ends. Is that any reason not to sing?" — Persephone' },
  { name: 'Evan Hansen', type: 'creature', value: 4, art_emoji: '🤕',
    flavor_text: 'You will be found. Somehow, you always are.' },
  { name: 'Velma Kelly', type: 'creature', value: 3, art_emoji: '🔫',
    flavor_text: 'She didn\'t get where she is by being subtle.' },
  { name: 'Roxie Hart', type: 'creature', value: 3, art_emoji: '💃',
    flavor_text: 'Fame is a currency, and Roxie spends it wisely.' },
  { name: 'Inspector Javert', type: 'creature', value: 2, art_emoji: '🔍',
    flavor_text: 'The law is the law. He would die before bending it.' },
  { name: 'Orpheus', type: 'creature', value: 1, art_emoji: '🎶',
    flavor_text: 'Love brought him to the underworld. Doubt brought him back alone.' },
  { name: 'Nessarose', type: 'creature', value: 0, art_emoji: '🌹',
    flavor_text: 'Power without compassion. A throne built on a sister\'s shadow.' },
  { name: 'Hadestown Foreman', type: 'creature', value: -2, art_emoji: '⛏️',
    flavor_text: 'In Hadestown, you work until you forget why you started.' },
  { name: 'The Phantom', type: 'creature', value: -4, art_emoji: '🎭',
    flavor_text: '"Beware the Phantom of the Opera." — Chorus, Act I' },

  // Items
  { name: 'Tony Award', type: 'item', operator: '+3', operator_value: 3, art_emoji: '🏆',
    effect_text: 'Add +3 to one creature.',
    flavor_text: 'The highest honor Broadway bestows.' },
  { name: 'Standing Ovation', type: 'item', operator: '+2', operator_value: 2, art_emoji: '👏',
    effect_text: 'Add +2 to one creature.',
    flavor_text: 'The audience rises as one.' },
  { name: 'Backstage Pass', type: 'item', operator: '+1', operator_value: 1, art_emoji: '🎫',
    effect_text: 'Add +1 to one creature.',
    flavor_text: 'The show is better from the wings.' },
  { name: 'Opening Night', type: 'item', operator: '+5', operator_value: 5, art_emoji: '🌟',
    effect_text: 'Add +5 to one creature.',
    flavor_text: 'Nerves, lights, and the whole world watching.' },
  { name: 'Mixed Review', type: 'item', operator: '-1', operator_value: -1, art_emoji: '📰',
    effect_text: 'Subtract 1 from one creature.',
    flavor_text: '"Promising, but uneven." — The Times' },
  { name: 'Panned by Critics', type: 'item', operator: '-2', operator_value: -2, art_emoji: '👎',
    effect_text: 'Subtract 2 from one creature.',
    flavor_text: '"A noble failure." — That\'s still a failure.' },
  { name: 'Understudied', type: 'item', operator: '-3', operator_value: -3, art_emoji: '🎭',
    effect_text: 'Subtract 3 from one creature.',
    flavor_text: 'Someone else knows every word of your role.' },
  { name: 'Closed After Opening Night', type: 'item', operator: '-5', operator_value: -5, art_emoji: '🔒',
    effect_text: 'Subtract 5 from one creature.',
    flavor_text: 'The cruelest two-word phrase in theater: "It\'s closed."' },

  // Actions
  { name: 'Encore!', type: 'action', operator: '×2', operator_value: 2, art_emoji: '🎼',
    effect_text: 'Multiply one creature\'s value by 2.',
    flavor_text: 'They loved it. Do it again, twice as big.' },
  { name: 'Broadway Run', type: 'action', operator: '×5', operator_value: 5, art_emoji: '🗓️',
    effect_text: 'Multiply one creature\'s value by 5.',
    flavor_text: 'Five years. Five thousand performances. Legendary.' },
  { name: 'Cast Recording', type: 'action', operator: '×10', operator_value: 10, art_emoji: '💿',
    effect_text: 'Multiply one creature\'s value by 10.',
    flavor_text: 'Immortalized. Every note, every breath, forever.' },
  { name: 'Act Break', type: 'action', operator: '÷2', operator_value: 0.5, art_emoji: '🔔',
    effect_text: 'Divide one creature\'s value by 2.',
    flavor_text: 'Intermission gives the audience time to reconsider everything.' },
  { name: 'Technical Difficulties', type: 'action', operator: '÷5', operator_value: 0.2, art_emoji: '🔧',
    effect_text: 'Divide one creature\'s value by 5.',
    flavor_text: 'The flying rig snapped. The chandelier stayed up. Barely.' },
  { name: 'Method Acting', type: 'action', operator: '×(-1)', operator_value: -1, art_emoji: '🎭',
    effect_text: 'Multiply one creature\'s value by -1.',
    flavor_text: 'So deep in character, they forgot which side they were on.' },

  // Events
  { name: 'Cultural Phenomenon', type: 'event', effect_type: 'mirror', art_emoji: '🌍',
    effect_text: 'Mirror: Copy any one creature\'s value onto another.',
    flavor_text: 'A show so big, every stage wants a piece of it.' },
  { name: 'Final Curtain', type: 'event', effect_type: 'banish', art_emoji: '🎬',
    effect_text: 'Banish: Remove any one creature from the game.',
    flavor_text: 'The lights go dark. The run is over. The character is gone.' },
];

// R47: Comic Strips
// 14 creatures: values 10,9,7,6,5,5,4,3,3,2,1,0,-2,-4
// 8 items: 6 small (±1–±3), 1 at +5, 1 at -5
// 6 actions: ×2, ×5, ×10, ÷2, ÷5, ×(-1)
// 2 events: one from {x100, mirror}, one from {swap, reverse, banish, zero_out}
const r47Cards = [
  // Creatures
  { name: 'Garfield', type: 'creature', value: 10, art_emoji: '🐱',
    flavor_text: 'I am not lazy. I am in energy-saving mode.' },
  { name: 'Snoopy', type: 'creature', value: 9, art_emoji: '🐶',
    flavor_text: 'It was a dark and stormy night. But first, supper.' },
  { name: 'Calvin', type: 'creature', value: 7, art_emoji: '🧒',
    flavor_text: '"Reality is always controlled by those who have the stupidest agenda." — Calvin' },
  { name: 'Charlie Brown', type: 'creature', value: 6, art_emoji: '⚾',
    flavor_text: 'Good grief. Even losing takes effort when you do it this much.' },
  { name: 'Hobbes', type: 'creature', value: 5, art_emoji: '🐯',
    flavor_text: 'The wisest tiger in a six-year-old\'s bedroom.' },
  { name: 'Lucy Van Pelt', type: 'creature', value: 5, art_emoji: '🏈',
    flavor_text: 'She always pulls the football. You always fall for it.' },
  { name: 'Opus', type: 'creature', value: 4, art_emoji: '🐧',
    flavor_text: 'A penguin with an anxious soul and a surprisingly large nose.' },
  { name: 'Dogbert', type: 'creature', value: 3, art_emoji: '🐕',
    flavor_text: 'World domination is just a well-placed memo away.' },
  { name: 'Dilbert', type: 'creature', value: 3, art_emoji: '👔',
    flavor_text: 'Eight years of engineering school for this cubicle.' },
  { name: 'The Far Side Cow', type: 'creature', value: 2, art_emoji: '🐄',
    flavor_text: 'Humans think cows are simple. The cows prefer it that way.' },
  { name: 'Pig (Pearls Before Swine)', type: 'creature', value: 1, art_emoji: '🐷',
    flavor_text: 'Simple pleasures, simple pig. The world would break his heart if he understood it.' },
  { name: 'Ziggy', type: 'creature', value: 0, art_emoji: '😟',
    flavor_text: 'Perpetually put-upon. Surprisingly still here.' },
  { name: 'The Boss (Dilbert)', type: 'creature', value: -2, art_emoji: '📋',
    flavor_text: '"I have a new process that doubles inefficiency." — The Boss' },
  { name: 'Jon Arbuckle', type: 'creature', value: -4, art_emoji: '😓',
    flavor_text: 'He cooks spaghetti for one. Garfield eats it anyway.\n— Garfield' },

  // Items
  { name: 'Word Bubble', type: 'item', operator: '+3', operator_value: 3, art_emoji: '💬',
    effect_text: 'Add +3 to one creature.',
    flavor_text: 'Three words. Perfectly placed. The punchline lands.' },
  { name: 'Daily Strip', type: 'item', operator: '+2', operator_value: 2, art_emoji: '📰',
    effect_text: 'Add +2 to one creature.',
    flavor_text: 'Four panels a day keeps the existential dread at bay.' },
  { name: 'Comic Timing', type: 'item', operator: '+1', operator_value: 1, art_emoji: '⏱️',
    effect_text: 'Add +1 to one creature.',
    flavor_text: 'The pause before the punchline is where comedy lives.' },
  { name: 'Syndication Deal', type: 'item', operator: '+5', operator_value: 5, art_emoji: '📡',
    effect_text: 'Add +5 to one creature.',
    flavor_text: 'In 500 papers by Monday. National treasure by Friday.' },
  { name: 'Continuity Error', type: 'item', operator: '-1', operator_value: -1, art_emoji: '✏️',
    effect_text: 'Subtract 1 from one creature.',
    flavor_text: 'Why does Monday\'s strip have a different cat?' },
  { name: 'Cancelled Strip', type: 'item', operator: '-2', operator_value: -2, art_emoji: '🗞️',
    effect_text: 'Subtract 2 from one creature.',
    flavor_text: 'Editors wield scissors. Characters disappear.' },
  { name: 'Bad Pun', type: 'item', operator: '-3', operator_value: -3, art_emoji: '😬',
    effect_text: 'Subtract 3 from one creature.',
    flavor_text: 'The groan is the point. Regret is the side effect.' },
  { name: 'The Monday Blues', type: 'item', operator: '-5', operator_value: -5, art_emoji: '😩',
    effect_text: 'Subtract 5 from one creature.',
    flavor_text: 'I hate Mondays.\n— Garfield' },

  // Actions
  { name: 'Punchline', type: 'action', operator: '×2', operator_value: 2, art_emoji: '😂',
    effect_text: 'Multiply one creature\'s value by 2.',
    flavor_text: 'Everything builds to this moment. It doubles everything.' },
  { name: 'Sunday Color Edition', type: 'action', operator: '×5', operator_value: 5, art_emoji: '🌈',
    effect_text: 'Multiply one creature\'s value by 5.',
    flavor_text: 'Bigger. Louder. In full color. Five times the impact.' },
  { name: 'Collected Treasury', type: 'action', operator: '×10', operator_value: 10, art_emoji: '📚',
    effect_text: 'Multiply one creature\'s value by 10.',
    flavor_text: 'Decades of strips bound in one glorious volume.' },
  { name: 'Erased Panel', type: 'action', operator: '÷2', operator_value: 0.5, art_emoji: '🧹',
    effect_text: 'Divide one creature\'s value by 2.',
    flavor_text: 'The editor cut a panel. The joke barely survived.' },
  { name: 'Rerun Week', type: 'action', operator: '÷5', operator_value: 0.2, art_emoji: '🔁',
    effect_text: 'Divide one creature\'s value by 5.',
    flavor_text: 'The cartoonist is on vacation. Everything is reduced.' },
  { name: 'Fourth Wall Break', type: 'action', operator: '×(-1)', operator_value: -1, art_emoji: '🖼️',
    effect_text: 'Multiply one creature\'s value by -1.',
    flavor_text: 'The character looks directly at you. Everything inverts.' },

  // Events
  { name: 'Newspaper Front Page', type: 'event', effect_type: 'x100', art_emoji: '📢',
    effect_text: '×100: Multiply any one creature\'s value by 100.',
    flavor_text: 'One strip goes viral. A hundred million readers see it.' },
  { name: 'Strip Swap', type: 'event', effect_type: 'reverse', art_emoji: '🔃',
    effect_text: 'Reverse: Flip the sign of every creature on one side.',
    flavor_text: 'The whole cast traded panels. Nobody knows whose strip it is anymore.' },
];

const newReleases = [
  { number: 45, name: 'Countries',       icon: '🌍', color_hex: '#2e7d32' },
  { number: 46, name: 'Modern Broadway', icon: '🎵', color_hex: '#880e4f' },
  { number: 47, name: 'Comic Strips',    icon: '💬', color_hex: '#f57f17' },
];

const newReleaseCardPairs = [
  { number: 45, cards: r45Cards },
  { number: 46, cards: r46Cards },
  { number: 47, cards: r47Cards },
];

async function addReleases() {
  const { data: releaseRows, error: relErr } = await supabase
    .from('releases').upsert(newReleases, { onConflict: 'number' }).select();
  if (relErr) { console.error(relErr); process.exit(1); }
  console.log('Releases upserted:', releaseRows?.map(r => `R${r.number} id=${r.id}`));
  for (const { number, cards } of newReleaseCardPairs) {
    const release = releaseRows!.find(r => r.number === number)!;
    const cardRows = cards.map(c => ({ ...c, release_id: release.id }));
    const { error } = await supabase.from('cards').insert(cardRows);
    if (error) { console.error(`R${number}:`, error); process.exit(1); }
    console.log(`Inserted ${cardRows.length} cards for R${number} (${release.name})`);
  }
  console.log('Done!');
}
addReleases();
