import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const soccerCards = [
  // 14 Creatures — values: 10, 9, 7, 6, 5, 5, 4, 3, 3, 2, 1, 0, -2, -4
  {
    name: 'Pelé',
    type: 'creature',
    value: 10,
    art_emoji: '🌟',
    flavor_text: 'Three World Cups. One name. No argument.'
  },
  {
    name: 'Lionel Messi',
    type: 'creature',
    value: 9,
    art_emoji: '🐐',
    flavor_text: '"He doesn\'t run. He glides." — Zinedine Zidane'
  },
  {
    name: 'Cristiano Ronaldo',
    type: 'creature',
    value: 7,
    art_emoji: '💪',
    flavor_text: 'I work harder than anyone. The results speak for themselves.'
  },
  {
    name: 'Zinedine Zidane',
    type: 'creature',
    value: 6,
    art_emoji: '🎩',
    flavor_text: 'Silent feet, thunder touch — one final, unforgettable night.'
  },
  {
    name: 'Ronaldo Nazário',
    type: 'creature',
    value: 5,
    art_emoji: '⚡',
    flavor_text: '"When he was fit, nobody on earth could stop him." — Pelé'
  },
  {
    name: 'Diego Maradona',
    type: 'creature',
    value: 5,
    art_emoji: '✋',
    flavor_text: 'A little with the head of Maradona, and a little with the hand of God.'
  },
  {
    name: 'Kylian Mbappé',
    type: 'creature',
    value: 4,
    art_emoji: '🚀',
    flavor_text: 'The future arrived early. It runs at 38 km/h.'
  },
  {
    name: 'David Beckham',
    type: 'creature',
    value: 3,
    art_emoji: '🌹',
    flavor_text: 'Dead-ball perfection, bending the impossible into routine.'
  },
  {
    name: 'Neymar Jr.',
    type: 'creature',
    value: 3,
    art_emoji: '🎭',
    flavor_text: '"He could have been the greatest. He chose to be spectacular." — Ronaldo Nazário'
  },
  {
    name: 'Ronaldinho',
    type: 'creature',
    value: 2,
    art_emoji: '😁',
    flavor_text: 'Football is joy. I never played a single minute without smiling.'
  },
  {
    name: 'Gianluigi Buffon',
    type: 'creature',
    value: 1,
    art_emoji: '🧤',
    flavor_text: 'A wall between the posts; only time, not strikers, beat him.'
  },
  {
    name: 'VAR Controversy',
    type: 'creature',
    value: 0,
    art_emoji: '📺',
    flavor_text: 'Goal given. Goal reviewed. Goal cancelled. Silence.'
  },
  {
    name: 'Luis Suárez',
    type: 'creature',
    value: -2,
    art_emoji: '😬',
    flavor_text: 'Three bites. Infinite scandals. Somehow still playing.'
  },
  {
    name: 'Sergio Ramos',
    type: 'creature',
    value: -4,
    art_emoji: '🟥',
    flavor_text: 'Record red cards, legendary fouls — villain and hero in one boot.'
  },

  // 8 Items — 6 at ±1–3, 1 at +5, 1 at -5
  {
    name: 'Corner Kick',
    type: 'item',
    operator: '+1',
    operator_value: 1,
    art_emoji: '🚩',
    effect_text: 'Add +1 to one creature.',
    flavor_text: 'Danger from every angle — one well-placed ball changes everything.'
  },
  {
    name: 'Header',
    type: 'item',
    operator: '+2',
    operator_value: 2,
    art_emoji: '🤕',
    effect_text: 'Add +2 to one creature.',
    flavor_text: 'Eyes shut, neck braced — a moment of courage, perfectly timed.'
  },
  {
    name: 'Free Kick',
    type: 'item',
    operator: '+3',
    operator_value: 3,
    art_emoji: '🎯',
    effect_text: 'Add +3 to one creature.',
    flavor_text: '"The wall means nothing to me." — David Beckham'
  },
  {
    name: 'Yellow Card',
    type: 'item',
    operator: '-1',
    operator_value: -1,
    art_emoji: '🟨',
    effect_text: 'Subtract 1 from one creature.',
    flavor_text: 'A caution in the pocket; one more and you walk.'
  },
  {
    name: 'Injury',
    type: 'item',
    operator: '-2',
    operator_value: -2,
    art_emoji: '🩹',
    effect_text: 'Subtract 2 from one creature.',
    flavor_text: 'The stretcher arrives. The crowd holds its breath.'
  },
  {
    name: 'Offside Trap',
    type: 'item',
    operator: '-3',
    operator_value: -3,
    art_emoji: '🚫',
    effect_text: 'Subtract 3 from one creature.',
    flavor_text: 'A perfectly timed step forward. The flag goes up. Dream denied.'
  },
  {
    name: 'Golden Boot',
    type: 'item',
    operator: '+5',
    operator_value: 5,
    art_emoji: '🥾',
    effect_text: 'Add +5 to one creature.',
    flavor_text: 'Top scorer. The prize that outlasts trophies in the memory.'
  },
  {
    name: 'Relegation',
    type: 'item',
    operator: '-5',
    operator_value: -5,
    art_emoji: '📉',
    effect_text: 'Subtract 5 from one creature.',
    flavor_text: 'The final whistle. The table tells the truth.'
  },

  // 6 Actions — ×2, ×5, ×10, ÷2, ÷5, ×(-1)
  {
    name: 'Goal!',
    type: 'action',
    operator: '×2',
    operator_value: 2,
    art_emoji: '⚽',
    effect_text: "Multiply one creature's value by 2.",
    flavor_text: 'The net ripples. The crowd erupts. Everything doubles.'
  },
  {
    name: 'Hat Trick',
    type: 'action',
    operator: '×5',
    operator_value: 5,
    art_emoji: '🎩',
    effect_text: "Multiply one creature's value by 5.",
    flavor_text: 'One match, three moments of genius. The match ball is yours.'
  },
  {
    name: 'World Cup',
    type: 'action',
    operator: '×10',
    operator_value: 10,
    art_emoji: '🏆',
    effect_text: "Multiply one creature's value by 10.",
    flavor_text: 'Four years of sacrifice. One month of glory. A lifetime of legend.'
  },
  {
    name: 'Offside',
    type: 'action',
    operator: '÷2',
    operator_value: 0.5,
    art_emoji: '🚩',
    effect_text: "Divide one creature's value by 2.",
    flavor_text: 'Half a step too early. Half the threat.'
  },
  {
    name: 'Red Card',
    type: 'action',
    operator: '÷5',
    operator_value: 0.2,
    art_emoji: '🟥',
    effect_text: "Divide one creature's value by 5.",
    flavor_text: 'The referee reaches into his pocket. The player walks in shame.'
  },
  {
    name: 'Own Goal',
    type: 'action',
    operator: '×(-1)',
    operator_value: -1,
    art_emoji: '😱',
    effect_text: "Flip one creature's value to its opposite.",
    flavor_text: 'The wrong net. The wrong moment. The wrong everything.'
  },

  // 2 Events
  {
    name: 'Penalty Shootout',
    type: 'event',
    effect_type: 'x100',
    art_emoji: '😰',
    effect_text: "×100: Multiply any one creature's value by 100.",
    flavor_text: 'One kick. One keeper. One hundred times the pressure.'
  },
  {
    name: 'Injury Time',
    type: 'event',
    effect_type: 'swap',
    art_emoji: '⏱️',
    effect_text: 'Swap: Exchange any two creatures between sides.',
    flavor_text: 'The board goes up: five minutes added. Anything can happen.'
  },
];

const villainsCards = [
  // 14 Creatures — values: 10, 9, 7, 6, 5, 5, 4, 3, 3, 2, 1, 0, -2, -4
  {
    name: 'Darth Vader',
    type: 'creature',
    value: 10,
    art_emoji: '🖤',
    flavor_text: 'Galaxy-spanning terror, forged in loss and armored in darkness.'
  },
  {
    name: 'The Joker',
    type: 'creature',
    value: 9,
    art_emoji: '🃏',
    flavor_text: 'Why so serious? Some men just want to watch the world burn — laughing.'
  },
  {
    name: 'Hannibal Lecter',
    type: 'creature',
    value: 7,
    art_emoji: '🍷',
    flavor_text: '"Rudeness is an epidemic. I consider it my duty to correct it." — Hannibal Lecter'
  },
  {
    name: 'Thanos',
    type: 'creature',
    value: 6,
    art_emoji: '💜',
    flavor_text: 'Perfectly balanced, as all things should be.'
  },
  {
    name: 'Sauron',
    type: 'creature',
    value: 5,
    art_emoji: '👁️',
    flavor_text: 'One Ring to rule them all; one Eye that never rests.'
  },
  {
    name: 'Nurse Ratched',
    type: 'creature',
    value: 5,
    art_emoji: '💉',
    flavor_text: '"She is the institutional voice of control — and she never raises it." — Ken Kesey'
  },
  {
    name: 'Ursula',
    type: 'creature',
    value: 4,
    art_emoji: '🐙',
    flavor_text: 'I am a woman of my word — the fine print is where the magic is.'
  },
  {
    name: 'Norman Bates',
    type: 'creature',
    value: 3,
    art_emoji: '🔪',
    flavor_text: 'A boy\'s best friend is his mother. Always.'
  },
  {
    name: 'Iago',
    type: 'creature',
    value: 3,
    art_emoji: '🎭',
    flavor_text: 'I am not what I am. Honesty is a fool that loses what it works for.'
  },
  {
    name: 'Patrick Bateman',
    type: 'creature',
    value: 2,
    art_emoji: '💼',
    flavor_text: 'Business card. Haircut. Axe. In that order.'
  },
  {
    name: 'The Wicked Witch',
    type: 'creature',
    value: 1,
    art_emoji: '🧙',
    flavor_text: 'Flying monkeys, crystal ball, green skin — and still undone by a bucket of water.'
  },
  {
    name: 'Dr. Evil',
    type: 'creature',
    value: 0,
    art_emoji: '🦹',
    flavor_text: 'One million dollars! ... Why is everyone laughing?'
  },
  {
    name: 'Wile E. Coyote',
    type: 'creature',
    value: -2,
    art_emoji: '💣',
    flavor_text: 'ACME guaranteed delivery. Zero successful detonations. Every. Single. Time.'
  },
  {
    name: 'Dolores Umbridge',
    type: 'creature',
    value: -4,
    art_emoji: '🩷',
    flavor_text: '"She smiles pleasantly. That is the most terrifying thing about her." — Harry Potter'
  },

  // 8 Items — 6 at ±1–3, 1 at +5, 1 at -5
  {
    name: 'Henchman',
    type: 'item',
    operator: '+1',
    operator_value: 1,
    art_emoji: '🕴️',
    effect_text: 'Add +1 to one creature.',
    flavor_text: 'Loyal, expendable, and wearing the same uniform as forty others.'
  },
  {
    name: 'Secret Lair',
    type: 'item',
    operator: '+2',
    operator_value: 2,
    art_emoji: '🏰',
    effect_text: 'Add +2 to one creature.',
    flavor_text: 'Volcano optional. Shark tank mandatory.'
  },
  {
    name: 'Sinister Monologue',
    type: 'item',
    operator: '+3',
    operator_value: 3,
    art_emoji: '🎤',
    effect_text: 'Add +3 to one creature.',
    flavor_text: 'The hero is tied up. Now the villain can finally explain everything.'
  },
  {
    name: 'Hero Intervenes',
    type: 'item',
    operator: '-1',
    operator_value: -1,
    art_emoji: '🦸',
    effect_text: 'Subtract 1 from one creature.',
    flavor_text: 'Just as the plan was working perfectly, a cape appeared.'
  },
  {
    name: 'Foiled Again',
    type: 'item',
    operator: '-2',
    operator_value: -2,
    art_emoji: '😤',
    effect_text: 'Subtract 2 from one creature.',
    flavor_text: 'The gadget misfired. The henchman tripped. Another Tuesday.'
  },
  {
    name: 'Redemption Arc',
    type: 'item',
    operator: '-3',
    operator_value: -3,
    art_emoji: '🕊️',
    effect_text: 'Subtract 3 from one creature.',
    flavor_text: 'A single act of mercy. The villain blinks. Everything changes.'
  },
  {
    name: 'World Domination Plan',
    type: 'item',
    operator: '+5',
    operator_value: 5,
    art_emoji: '🌍',
    effect_text: 'Add +5 to one creature.',
    flavor_text: 'Step one: acquire power. Step two: there is no step two.'
  },
  {
    name: 'Achilles Heel',
    type: 'item',
    operator: '-5',
    operator_value: -5,
    art_emoji: '⚠️',
    effect_text: 'Subtract 5 from one creature.',
    flavor_text: 'Every great villain has one weakness. The hero always finds it.'
  },

  // 6 Actions — ×2, ×5, ×10, ÷2, ÷5, ×(-1)
  {
    name: 'Evil Monologue',
    type: 'action',
    operator: '×2',
    operator_value: 2,
    art_emoji: '😈',
    effect_text: "Multiply one creature's value by 2.",
    flavor_text: 'The villain explains everything. The threat doubles with every word.'
  },
  {
    name: 'Dark Side',
    type: 'action',
    operator: '×5',
    operator_value: 5,
    art_emoji: '⚫',
    effect_text: "Multiply one creature's value by 5.",
    flavor_text: 'Once you step into the darkness, the power is intoxicating.'
  },
  {
    name: 'Global Domination',
    type: 'action',
    operator: '×10',
    operator_value: 10,
    art_emoji: '🌐',
    effect_text: "Multiply one creature's value by 10.",
    flavor_text: 'Not a country. Not a continent. Everything.'
  },
  {
    name: 'Incompetent Minions',
    type: 'action',
    operator: '÷2',
    operator_value: 0.5,
    art_emoji: '🤦',
    effect_text: "Divide one creature's value by 2.",
    flavor_text: 'They had one job. Exactly one job. Half of it got done.'
  },
  {
    name: 'Villain\'s Hubris',
    type: 'action',
    operator: '÷5',
    operator_value: 0.2,
    art_emoji: '🎭',
    effect_text: "Divide one creature's value by 5.",
    flavor_text: 'Confidence became arrogance. Arrogance became downfall.'
  },
  {
    name: 'Heel Turn',
    type: 'action',
    operator: '×(-1)',
    operator_value: -1,
    art_emoji: '🔄',
    effect_text: "Flip one creature's value to its opposite.",
    flavor_text: 'The hero goes rogue. The villain goes soft. Nobody saw it coming.'
  },

  // 2 Events
  {
    name: 'The Final Confrontation',
    type: 'event',
    effect_type: 'x100',
    art_emoji: '⚔️',
    effect_text: "×100: Multiply any one creature's value by 100.",
    flavor_text: 'The music swells. The stakes go cosmic. Someone is not walking away.'
  },
  {
    name: 'Betrayal',
    type: 'event',
    effect_type: 'banish',
    art_emoji: '🗡️',
    effect_text: 'Banish: Remove any one creature from the game.',
    flavor_text: 'The trusted ally. The hidden knife. The oldest story in the world.'
  },
];

const newReleases = [
  { number: 41, name: 'Soccer',   icon: '⚽', color_hex: '#1b5e20' },
  { number: 42, name: 'Villains', icon: '😈', color_hex: '#37474f' },
];
const newReleaseCardPairs = [
  { number: 41, cards: soccerCards },
  { number: 42, cards: villainsCards },
];

async function addReleases() {
  const { data: releaseRows, error: relErr } = await supabase
    .from('releases').upsert(newReleases, { onConflict: 'number' }).select();
  if (relErr) { console.error(relErr); process.exit(1); }
  console.log('Releases upserted:', JSON.stringify(releaseRows));
  for (const { number, cards } of newReleaseCardPairs) {
    const release = releaseRows!.find(r => r.number === number)!;
    const cardRows = cards.map(c => ({ ...c, release_id: release.id }));
    const { error } = await supabase.from('cards').insert(cardRows);
    if (error) { console.error(`R${number}:`, error); process.exit(1); }
    console.log(`Inserted ${cardRows.length} cards for R${number} (id: ${release.id})`);
  }
  console.log('Done!');
}
addReleases();
