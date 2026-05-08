import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Release 24 — Pokemon
const r24Cards = [
  // --- CREATURES ---
  { name: 'Mewtwo',     type: 'creature', value: 10, art_emoji: '🔮', flavor_text: 'Born from scientific ambition. Answerable to no one.' },
  { name: 'Charizard',  type: 'creature', value:  9, art_emoji: '🔥', flavor_text: 'Refuses to obey a weak trainer. Cannot be reasoned with.' },
  { name: 'Rayquaza',   type: 'creature', value:  7, art_emoji: '🐉', flavor_text: 'Rules the sky between worlds. Its arrival ends wars.' },
  { name: 'Greninja',   type: 'creature', value:  6, art_emoji: '💧', flavor_text: 'Faster than a ninja. Considerably wetter.' },
  { name: 'Snorlax',    type: 'creature', value:  5, art_emoji: '💤', flavor_text: 'Blocks entire roads with its nap. Nobody moves it.' },
  { name: 'Blastoise',  type: 'creature', value:  5, art_emoji: '🐢', flavor_text: 'The cannons are real. The attitude is realer.' },
  { name: 'Pikachu',    type: 'creature', value:  4, art_emoji: '⚡', flavor_text: 'The face of the franchise. Electric personality to match.' },
  { name: 'Eevee',      type: 'creature', value:  3, art_emoji: '🦊', flavor_text: 'Could become anything. Currently choosing nothing.' },
  { name: 'Bulbasaur',  type: 'creature', value:  3, art_emoji: '🌱', flavor_text: 'Has a plant on its back. Has had it since birth. Unbothered.' },
  { name: 'Jigglypuff', type: 'creature', value:  2, art_emoji: '🎤', flavor_text: 'Sings until everyone falls asleep. Gets furious about it.' },
  { name: 'Psyduck',    type: 'creature', value:  1, art_emoji: '🦆', flavor_text: 'Has a permanent headache. Powers up under pain.' },
  { name: 'Magikarp',   type: 'creature', value:  0, art_emoji: '🐟', flavor_text: 'The most useless Pokémon. Famously.' },
  { name: 'Zubat',      type: 'creature', value: -2, art_emoji: '🦇', flavor_text: 'No eyes. Still finds you. Unavoidable in caves.' },
  { name: 'Wobuffet',   type: 'creature', value: -4, art_emoji: '🫡', flavor_text: 'Only knows how to reflect attacks back. Still very annoying.' },
  // --- ITEMS ---
  { name: 'Poké Ball',    type: 'item', operator: '+2', operator_value:  2, art_emoji: '⚪', effect_text: 'Add +2 to one creature.', flavor_text: 'Toss it. Hope for the best.' },
  { name: 'Rare Candy',   type: 'item', operator: '+3', operator_value:  3, art_emoji: '🍬', effect_text: 'Add +3 to one creature.', flavor_text: 'One candy. Instant power surge. No questions asked.' },
  { name: 'Potion',       type: 'item', operator: '+1', operator_value:  1, art_emoji: '💊', effect_text: 'Add +1 to one creature.', flavor_text: 'Heals a little. Better than nothing.' },
  { name: 'Oran Berry',   type: 'item', operator: '+1', operator_value:  1, art_emoji: '🫐', effect_text: 'Add +1 to one creature.', flavor_text: 'Sweet, simple, effective. The berry of champions.' },
  { name: 'Escape Rope',  type: 'item', operator: '-1', operator_value: -1, art_emoji: '🪢', effect_text: 'Subtract 1 from one creature.', flavor_text: 'Gets you out fast. Leaves something behind.' },
  { name: 'Toxic Orb',    type: 'item', operator: '-3', operator_value: -3, art_emoji: '☠️', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Poisons the holder. Intentionally. It is a strategy.' },
  { name: 'Master Ball',  type: 'item', operator: '+5', operator_value:  5, art_emoji: '🟣', effect_text: 'Add +5 to one creature.', flavor_text: 'Never misses. Too rare to waste.' },
  { name: 'Black Sludge',  type: 'item', operator: '-5', operator_value: -5, art_emoji: '🖤', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Damages non-Poison types indiscriminately.' },
  // --- ACTIONS ---
  { name: 'Evolve',       type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '✨', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'The glow is blinding. The result is worth it.' },
  { name: 'Hyper Beam',   type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '💥', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Max power. Five times the chaos.' },
  { name: 'Dynamax',      type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🔴', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Goes enormous. Value grows to match.' },
  { name: 'Withdraw',     type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🐚', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Retreats into its shell. Cuts power in half.' },
  { name: 'Sand Attack',  type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🏜️', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Blinds the target. Effectiveness drops to one fifth.' },
  { name: 'Confusion',    type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🌀', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'The target hits itself. Value flips accordingly.' },
  // --- EVENTS ---
  { name: 'Mega Evolution', type: 'event', effect_type: 'x100',   art_emoji: '💠', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'The bond between trainer and Pokémon reaches its absolute peak.' },
  { name: 'Terrastelize',   type: 'event', effect_type: 'reverse', art_emoji: '🔷', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'Type changes everything. The whole board feels it.' },
];

// Release 25 — Harry Potter
const r25Cards = [
  // --- CREATURES ---
  { name: 'Dumbledore',       type: 'creature', value: 10, art_emoji: '⚗️', flavor_text: 'The greatest wizard of the age. Keeps his secrets well.' },
  { name: 'Voldemort',        type: 'creature', value:  9, art_emoji: '🐍', flavor_text: 'He Who Must Not Be Named. We named him anyway.' },
  { name: 'Harry Potter',     type: 'creature', value:  7, art_emoji: '⚡', flavor_text: 'Survived the unforgivable. Twice. Still loses his wand.' },
  { name: 'Hermione Granger', type: 'creature', value:  6, art_emoji: '📚', flavor_text: 'Read every book. Passed every test. Knows everything.' },
  { name: 'Sirius Black',     type: 'creature', value:  5, art_emoji: '🐺', flavor_text: 'Escaped Azkaban. Still the coolest person in the room.' },
  { name: 'Mad-Eye Moody',    type: 'creature', value:  5, art_emoji: '👁️', flavor_text: 'Constant vigilance. The eye never stops spinning.' },
  { name: 'Ron Weasley',      type: 'creature', value:  4, art_emoji: '🧡', flavor_text: 'Always in Harry\'s shadow. Still shows up every time.' },
  { name: 'Luna Lovegood',    type: 'creature', value:  3, art_emoji: '🌙', flavor_text: 'Sees creatures nobody else can. Correct about most of them.' },
  { name: 'Neville Longbottom', type: 'creature', value: 3, art_emoji: '🌿', flavor_text: 'Underestimated by everyone including himself. Big mistake.' },
  { name: 'Dobby',            type: 'creature', value:  2, art_emoji: '🧦', flavor_text: 'A free elf. Fiercely loyal. Irrepressibly optimistic.' },
  { name: 'Draco Malfoy',     type: 'creature', value:  1, art_emoji: '🥈', flavor_text: 'Second in everything. Has opinions about it.' },
  { name: 'Moaning Myrtle',   type: 'creature', value:  0, art_emoji: '🚿', flavor_text: 'Has been dead for fifty years. Still complaining about it.' },
  { name: 'Peter Pettigrew',  type: 'creature', value: -2, art_emoji: '🐀', flavor_text: 'A rat in every sense of the word.' },
  { name: 'Dolores Umbridge', type: 'creature', value: -5, art_emoji: '🐈', flavor_text: 'Worse than Voldemort, somehow. The cats on her wall agree.' },
  // --- ITEMS ---
  { name: 'Butterbeer',       type: 'item', operator: '+2', operator_value:  2, art_emoji: '🍺', effect_text: 'Add +2 to one creature.', flavor_text: 'Warm, sweet, and slightly intoxicating for house-elves.' },
  { name: 'Sorting Hat',      type: 'item', operator: '+3', operator_value:  3, art_emoji: '🎩', effect_text: 'Add +3 to one creature.', flavor_text: 'It sees your innermost qualities. Very intrusive, frankly.' },
  { name: 'Chocolate Frog',   type: 'item', operator: '+1', operator_value:  1, art_emoji: '🐸', effect_text: 'Add +1 to one creature.', flavor_text: 'Hops away if you are not fast enough.' },
  { name: 'Nimbus 2000',       type: 'item', operator: '+1', operator_value:  1, art_emoji: '🧹', effect_text: 'Add +1 to one creature.', flavor_text: '"It's not any old broomstick, it's a Nimbus Two Thousand." - Ron Weasley' },
  { name: 'Gillyweed',        type: 'item', operator: '-2', operator_value: -2, art_emoji: '🌿', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Grants gills for an hour. Tastes terrible.' },
  { name: 'Mandrake',         type: 'item', operator: '-3', operator_value: -3, art_emoji: '🌱', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Its cry is fatal to the unlucky. Wear earmuffs.' },
  { name: 'Felix Felicis',    type: 'item', operator: '+5', operator_value:  5, art_emoji: '✨', effect_text: 'Add +5 to one creature.', flavor_text: 'Liquid luck. Everything goes right. Just this once.' },
  { name: 'Horcrux',          type: 'item', operator: '-5', operator_value: -5, art_emoji: '💀', effect_text: 'Subtract 5 from one creature.', flavor_text: 'A piece of a soul, stored in an object. Deeply unpleasant.' },
  // --- ACTIONS ---
  { name: 'Lumos',              type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '💡', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Light fills the room. Value doubles with it.' },
  { name: 'Expelliarmus',       type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🪄', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Harry\'s signature spell. Five times as reliable as anything else.' },
  { name: 'Avada Kedavra',      type: 'action', operator: '÷10',   operator_value:  .1,  art_emoji: '💚', effect_text: "Divide one creature's value by 10.",  flavor_text: 'Unforgivable. Unblockable. Ten times the consequence.' },
  { name: 'Wingardium Leviosa', type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🪶', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Lifts things up by making them lighter. Value halved.' },
  { name: 'Riddikulus',         type: 'action', operator: 'x2',    operator_value:  2, art_emoji: '🤡', effect_text: "Multiply one creature's value by 2.",    flavor_text: 'Makes the scary thing funny. Reduces it to one fifth.' },
  { name: 'Confundus',          type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '😵', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Confuses the target completely. Positive becomes negative.' },
  // --- EVENTS ---
  { name: 'The Dark Mark',     type: 'event', effect_type: 'banish', art_emoji: '🌑', effect_text: 'Banish: Remove any one creature from the field permanently.', flavor_text: 'Cast into the sky above a scene of destruction. Someone is gone.' },
  { name: 'Polyjuice Potion',  type: 'event', effect_type: 'swap',   art_emoji: '🧪', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'You look exactly like them now. For one hour, anyway.' },
];

// Release 26 — Books
const r26Cards = [
  // --- CREATURES ---
  { name: 'Sherlock Holmes',    type: 'creature', value: 10, art_emoji: '🔍', flavor_text: 'Sees everything. Tolerates almost no one.' },
  { name: 'Atticus Finch',      type: 'creature', value:  9, art_emoji: '⚖️', flavor_text: 'Stands alone in the courtroom. Stands on the right side.' },
  { name: 'Elizabeth Bennet',   type: 'creature', value:  7, art_emoji: '💌', flavor_text: 'Prejudiced against Darcy. Correct about everyone else.' },
  { name: 'Alice',              type: 'creature', value:  6, art_emoji: '🐇', flavor_text: 'Fell down a rabbit hole. Handled it remarkably well.' },
  { name: 'Huck Finn',          type: 'creature', value:  5, art_emoji: '🚣', flavor_text: 'Floated down the river and figured out what matters.' },
  { name: 'Bilbo Baggins',      type: 'creature', value:  5, art_emoji: '🗝️', flavor_text: 'Did not want an adventure. Had an adventure. Kept the ring.' },
  { name: 'Jo March',           type: 'creature', value:  4, art_emoji: '✍️', flavor_text: 'Wrote her way out. Would not change a word.' },
  { name: 'Tom Sawyer',         type: 'creature', value:  3, art_emoji: '🎨', flavor_text: 'Made whitewashing a fence sound appealing. Legendary.' },
  { name: 'Dorothy Gale',       type: 'creature', value:  3, art_emoji: '👟', flavor_text: 'Went to Oz. Decided home was better. Smart.' },
  { name: 'Don Quixote',        type: 'creature', value:  2, art_emoji: '🏇', flavor_text: 'Fought windmills. Believed every word of it.' },
  { name: 'Oliver Twist',       type: 'creature', value:  1, art_emoji: '🥣', flavor_text: 'Asked for more. Could have asked better.' },
  { name: 'The Invisible Man',  type: 'creature', value:  0, art_emoji: '👻', flavor_text: 'Cannot be seen. Offers very little as a result.' },
  { name: 'Long John Silver',   type: 'creature', value: -2, art_emoji: '🏴‍☠️', flavor_text: 'A pirate with charm. A pirate nonetheless.' },
  { name: 'Count Dracula',      type: 'creature', value: -4, art_emoji: '🧛', flavor_text: 'Has not aged a day. Has not been kind in centuries.' },
  // --- ITEMS ---
  { name: 'Library Card',        type: 'item', operator: '+2', operator_value:  2, art_emoji: '🪪', effect_text: 'Add +2 to one creature.', flavor_text: 'Access to infinite knowledge. Free of charge.' },
  { name: 'Magical Bookmark',    type: 'item', operator: '+3', operator_value:  3, art_emoji: '🔖', effect_text: 'Add +3 to one creature.', flavor_text: 'Holds your place in the story. And boosts the story.' },
  { name: 'Reading Glasses',     type: 'item', operator: '+1', operator_value:  1, art_emoji: '🤓', effect_text: 'Add +1 to one creature.', flavor_text: 'Everything becomes clearer. Slightly.' },
  { name: 'Dog-Eared Page',      type: 'item', operator: '+1', operator_value:  1, art_emoji: '📄', effect_text: 'Add +1 to one creature.', flavor_text: 'Marked for importance. Not everyone approves of the method.' },
  { name: 'Torn Pages',          type: 'item', operator: '-2', operator_value: -2, art_emoji: '📃', effect_text: 'Subtract 2 from one creature.', flavor_text: 'The story is incomplete. The damage is done.' },
  { name: 'Banned Book',         type: 'item', operator: '-3', operator_value: -3, art_emoji: '🚫', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Forbidden everywhere. Read it anyway.' },
  { name: 'First Edition',       type: 'item', operator: '+5', operator_value:  5, art_emoji: '📕', effect_text: 'Add +5 to one creature.', flavor_text: 'Priceless. Irreplaceable. Handle with extreme care.' },
  { name: 'Burned Library',      type: 'item', operator: '-5', operator_value: -5, art_emoji: '🔥', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Centuries of knowledge. Gone in an afternoon.' },
  // --- ACTIONS ---
  { name: 'Plot Twist',           type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '😱', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Nobody saw it coming. Value doubles with the shock.' },
  { name: 'Cliffhanger',          type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🪝', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Ends mid-sentence. Stakes multiply by five.' },
  { name: 'Epic Finale',          type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '📖', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The last chapter. Everything is ten times what it was.' },
  { name: 'Flashback',            type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '⏪', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Returns to an earlier moment. Half the progress lost.' },
  { name: 'Foreshadowing',        type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🔭', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Hints at something smaller to come. One fifth remains.' },
  { name: 'Unreliable Narrator',  type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🤥', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Everything told was a lie. Positive becomes negative.' },
  // --- EVENTS ---
  { name: 'Book Burning',   type: 'event', effect_type: 'zero_out', art_emoji: '🔥', effect_text: 'Zero Out: Set any one creature on the field to 0.', flavor_text: 'The pages turn to ash. The creature\'s value turns to nothing.' },
  { name: 'The Twist Ending', type: 'event', effect_type: 'mirror', art_emoji: '🪞', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'They were the same person all along. Values match.' },
];

// Release 27 — TV
const r27Cards = [
  // --- CREATURES ---
  { name: 'Walter White',          type: 'creature', value: 10, art_emoji: '🧪', flavor_text: 'Started as a chemistry teacher. Did not stay one.' },
  { name: 'Tony Soprano',          type: 'creature', value:  9, art_emoji: '🍝', flavor_text: 'Runs New Jersey. Sees his therapist. Manages.' },
  { name: 'Daenerys Targaryen',    type: 'creature', value:  7, art_emoji: '🐲', flavor_text: 'Earned three dragons and a throne. The ending is disputed.' },
  { name: 'Sherlock Holmes',        type: 'creature', value:  6, art_emoji: '🎻', flavor_text: 'Texting a detective. Slightly sociopathic. Very effective.' },
  { name: 'Leslie Knope',          type: 'creature', value:  5, art_emoji: '🧇', flavor_text: 'Loves Pawnee more than Pawnee deserves.' },
  { name: 'Dexter Morgan',         type: 'creature', value:  5, art_emoji: '🩸', flavor_text: 'Blood-spatter analyst. Evenings are complicated.' },
  { name: 'Homer Simpson',         type: 'creature', value:  4, art_emoji: '🍩', flavor_text: 'Nuclear safety inspector. Eats donuts. Somehow fine.' },
  { name: 'Jim Halpert',           type: 'creature', value:  3, art_emoji: '😏', flavor_text: 'Looks directly at the camera. You look too.' },
  { name: 'Michael Scott',         type: 'creature', value:  3, art_emoji: '👔', flavor_text: 'World\'s best boss. He made the mug himself.' },
  { name: 'Barney Stinson',        type: 'creature', value:  2, art_emoji: '🎩', flavor_text: 'Legendary. Self-described. Frequently accurate.' },
  { name: 'Phoebe Buffay',         type: 'creature', value:  1, art_emoji: '🎸', flavor_text: 'Smelly cat. Smelly cat. What are they feeding you.' },
  { name: 'David Brent',           type: 'creature', value:  0, art_emoji: '🎤', flavor_text: 'Thinks he is funny. Technically employed.' },
  { name: 'Cersei Lannister',      type: 'creature', value: -2, art_emoji: '👑', flavor_text: 'Drinks wine. Makes enemies. Rarely loses either.' },
  { name: 'Joffrey Baratheon',     type: 'creature', value: -5, art_emoji: '😤', flavor_text: 'King by birth. Terrible at it. Universally agreed upon.' },
  // --- ITEMS ---
  { name: 'TV Remote',             type: 'item', operator: '+2', operator_value:  2, art_emoji: '📺', effect_text: 'Add +2 to one creature.', flavor_text: 'Control over what plays next. Significant power.' },
  { name: 'Streaming Subscription', type: 'item', operator: '+3', operator_value:  3, art_emoji: '📡', effect_text: 'Add +3 to one creature.', flavor_text: 'Unlimited content. Limited sleep.' },
  { name: 'Couch Cushion',         type: 'item', operator: '+1', operator_value:  1, art_emoji: '🛋️', effect_text: 'Add +1 to one creature.', flavor_text: 'Comfortable. Possibly hiding something.' },
  { name: 'Snack Bowl',            type: 'item', operator: '+1', operator_value:  1, art_emoji: '🍿', effect_text: 'Add +1 to one creature.', flavor_text: 'Full at the start of the episode. Empty by the twist.' },
  { name: 'Spoiler Alert',         type: 'item', operator: '-2', operator_value: -2, art_emoji: '🤐', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Ruins the experience. Cannot be unseen.' },
  { name: 'Cancelled Show',        type: 'item', operator: '-3', operator_value: -3, art_emoji: '📵', effect_text: 'Subtract 3 from one creature.', flavor_text: 'On a cliffhanger. Forever.' },
  { name: 'Emmy Award',            type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏆', effect_text: 'Add +5 to one creature.', flavor_text: 'Peak television. Acknowledged officially.' },
  { name: "Writer's Strike",       type: 'item', operator: '-5', operator_value: -5, art_emoji: '✊', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Nothing gets made. Every show suffers.' },
  // --- ACTIONS ---
  { name: 'Season Finale',   type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🎬', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Everything doubles. See you next fall.' },
  { name: 'Must-See TV',     type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '📻', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Everyone is watching. Value rises accordingly.' },
  { name: 'Series Premiere', type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🎆', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The hype is real. Ten times the expectations.' },
  { name: 'Commercial Break', type: 'action', operator: '÷2',   operator_value:  0.5, art_emoji: '⏸️', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Momentum cut in half. Back after these messages.' },
  { name: 'Channel Surf',    type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '📶', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Nothing holds attention. Value scattered across channels.' },
  { name: 'Plot Hole',       type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🕳️', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'The writers forgot this character exists. Sign flips.' },
  // --- EVENTS ---
  { name: 'Season Finale Twist',  type: 'event', effect_type: 'x100',   art_emoji: '😲', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'Nobody saw it coming. The ratings are through the roof.' },
  { name: 'The Reboot',           type: 'event', effect_type: 'reverse', art_emoji: '🔁', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'Brought back ten years later. Everything is different now.' },
];

// Release 28 — School
const r28Cards = [
  // --- CREATURES ---
  { name: 'The Valedictorian',      type: 'creature', value: 10, art_emoji: '🎓', flavor_text: '4.0 GPA. Gave the speech. Practiced it twice as long as the degree.' },
  { name: 'The Star Athlete',       type: 'creature', value:  9, art_emoji: '🏅', flavor_text: 'Scholarship incoming. The whole school knows.' },
  { name: 'The Science Genius',     type: 'creature', value:  7, art_emoji: '🔬', flavor_text: 'Wins every science fair. Terrible at group projects.' },
  { name: 'The Drama Kid',          type: 'creature', value:  6, art_emoji: '🎭', flavor_text: 'Performs at all times. Even in the cafeteria.' },
  { name: 'The Class President',    type: 'creature', value:  5, art_emoji: '🗳️', flavor_text: 'Has a platform. Has a poster. Has a plan.' },
  { name: 'The Band Nerd',          type: 'creature', value:  5, art_emoji: '🎺', flavor_text: 'Marching in formation at 6 AM. Voluntarily.' },
  { name: 'The Jock',               type: 'creature', value:  4, art_emoji: '🏈', flavor_text: 'More depth than the stereotype. Still benched today.' },
  { name: 'The Class Clown',        type: 'creature', value:  3, art_emoji: '🤡', flavor_text: 'Gets everyone laughing. Gets sent to the office.' },
  { name: 'The Bookworm',           type: 'creature', value:  3, art_emoji: '📚', flavor_text: 'Reads during lunch. Has read during every lunch for three years.' },
  { name: 'The Transfer Student',   type: 'creature', value:  2, art_emoji: '🆕', flavor_text: 'New here. Figuring it out faster than anyone expected.' },
  { name: 'The Lunch Monitor',      type: 'creature', value:  1, art_emoji: '🥗', flavor_text: 'Holds the power to confiscate anything. Uses it sparingly.' },
  { name: 'The Substitute Teacher', type: 'creature', value:  0, art_emoji: '📋', flavor_text: 'Just keeping things from burning down. No lesson plan.' },
  { name: 'The School Bully',       type: 'creature', value: -2, art_emoji: '😤', flavor_text: 'Big energy, poor choices. Future regrets are mounting.' },
  { name: 'Pop Quiz',               type: 'creature', value: -4, art_emoji: '😱', flavor_text: 'Unannounced. Unavoidable. Universally dreaded.' },
  // --- ITEMS ---
  { name: 'Number 2 Pencil',   type: 'item', operator: '+2', operator_value:  2, art_emoji: '✏️', effect_text: 'Add +2 to one creature.', flavor_text: 'Required for the test. Sharpened, just in case.' },
  { name: 'Textbook',          type: 'item', operator: '+3', operator_value:  3, art_emoji: '📓', effect_text: 'Add +3 to one creature.', flavor_text: 'Heavy. Full of answers. Few people check.' },
  { name: 'Sticky Note',       type: 'item', operator: '+1', operator_value:  1, art_emoji: '📌', effect_text: 'Add +1 to one creature.', flavor_text: 'Small but useful. Reminds you of exactly one thing.' },
  { name: 'Eraser',            type: 'item', operator: '+1', operator_value:  1, art_emoji: '🩹', effect_text: 'Add +1 to one creature.', flavor_text: 'Corrects the mistake. Leaves a smudge.' },
  { name: 'Late Assignment',   type: 'item', operator: '-2', operator_value: -2, art_emoji: '📅', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Ten percent off per day. You knew this.' },
  { name: 'Broken Pencil',     type: 'item', operator: '-3', operator_value: -3, art_emoji: '🪵', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Snapped mid-exam. No sharpener in sight.' },
  { name: 'Scholarship',       type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏦', effect_text: 'Add +5 to one creature.', flavor_text: 'All that work finally paid off. Literally.' },
  { name: 'Detention Slip',    type: 'item', operator: '-5', operator_value: -5, art_emoji: '🟥', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Every Friday for a month. The slip is just the beginning.' },
  // --- ACTIONS ---
  { name: 'Extra Credit',   type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '⭐', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Turned in on time. Doubled the outcome.' },
  { name: 'Study Group',    type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '👥', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Five people, one answer. Value multiplied by the group.' },
  { name: 'Perfect Score',  type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '💯', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Not a single point missed. Ten times the reward.' },
  { name: 'Partial Credit', type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '📉', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Half right is half the points. Half.' },
  { name: 'Tardy Slip',     type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '⏰', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Shows up late to everything. Value arrives at one fifth.' },
  { name: 'Cheat Sheet',    type: 'action', operator: '×(-2)', operator_value: -2,   art_emoji: '📝', effect_text: "Multiply one creature's value by −2.", flavor_text: 'Got caught. The negatives doubled.' },
  // --- EVENTS ---
  { name: 'Finals Week', type: 'event', effect_type: 'zero_out', art_emoji: '😰', effect_text: 'Zero Out: Set any one creature on the field to 0.', flavor_text: 'The stress wipes everything clean. That creature is done.' },
  { name: 'Snow Day',    type: 'event', effect_type: 'swap',     art_emoji: '❄️', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'School cancelled. Everyone ends up somewhere unexpected.' },
];

// Release 29 — Percy Jackson
const r29Cards = [
  // --- CREATURES ---
  { name: 'Percy Jackson',       type: 'creature', value: 10, art_emoji: '🌊', flavor_text: 'Son of Poseidon. Saved Olympus twice. Still forgets his homework.' },
  { name: 'Annabeth Chase',      type: 'creature', value:  9, art_emoji: '🦉', flavor_text: 'Daughter of Athena. Smarter than everyone in the room, including the gods.' },
  { name: 'Thalia Grace',        type: 'creature', value:  7, art_emoji: '⚡', flavor_text: 'Daughter of Zeus. Was a pine tree for six years. Got better.' },
  { name: 'Grover Underwood',    type: 'creature', value:  6, art_emoji: '🐐', flavor_text: 'Satyr and protector. Better at finding heroes than he admits.' },
  { name: 'Tyson the Cyclops',   type: 'creature', value:  5, art_emoji: '🔨', flavor_text: 'One eye. Pure heart. Hits very hard.' },
  { name: 'Nico di Angelo',      type: 'creature', value:  5, art_emoji: '💀', flavor_text: 'Son of Hades. Commands the dead. Deeply misunderstood.' },
  { name: 'Clarisse La Rue',     type: 'creature', value:  4, art_emoji: '⚔️', flavor_text: 'Daughter of Ares. First response to every problem: attack.' },
  { name: 'Rachel Elizabeth Dare',         type: 'creature', value:  3, art_emoji: '🎨', flavor_text: 'Oracle of Delphi. Sees the future in paint.' },
  { name: 'Bianca di Angelo',    type: 'creature', value:  3, art_emoji: '🌿', flavor_text: 'Chose a different path. Remembered by everyone who knew her.' },
  { name: 'Connor Stoll',        type: 'creature', value:  2, art_emoji: '😈', flavor_text: 'Son of Hermes. Everything in camp is slightly less secure when he is around.' },
  { name: 'Travis Stoll',        type: 'creature', value:  1, art_emoji: '😜', flavor_text: 'Same, but older. Slightly worse.' },
  { name: 'Mrs. O\'Leary',       type: 'creature', value:  0, art_emoji: '🐕', flavor_text: 'A hellhound the size of a bus. Loves belly rubs. Neutral alignment.' },
  { name: 'Luke Castellan',      type: 'creature', value: -2, art_emoji: '🗡️', flavor_text: 'Turned against Olympus. Regret came later.' },
  { name: 'Kronos',              type: 'creature', value: -5, art_emoji: '⏳', flavor_text: 'Titan lord of time. Patient. Terrible. Eventually stopped.' },
  // --- ITEMS ---
  { name: 'Ambrosia',            type: 'item', operator: '+2', operator_value:  2, art_emoji: '🍯', effect_text: 'Add +2 to one creature.', flavor_text: 'Food of the gods. Heals demigods. Tastes like home.' },
  { name: 'Nectar',              type: 'item', operator: '+3', operator_value:  3, art_emoji: '✨', effect_text: 'Add +3 to one creature.', flavor_text: 'Divine drink. Restores strength quickly.' },
  { name: 'Anaklusmos',          type: 'item', operator: '+1', operator_value:  1, art_emoji: '🖊️', effect_text: 'Add +1 to one creature.', flavor_text: 'A sword in pen form. Always returns to Percy\'s pocket.' },
  { name: 'Camp Bead Necklace',  type: 'item', operator: '+1', operator_value:  1, art_emoji: '📿', effect_text: 'Add +1 to one creature.', flavor_text: 'One bead per summer survived. Each one earned.' },
  { name: 'Labyrinth Fragment',  type: 'item', operator: '-2', operator_value: -2, art_emoji: '🌀', effect_text: 'Subtract 2 from one creature.', flavor_text: 'A piece of Daedalus\'s maze. Gets inside your head.' },
  { name: "Siren's Song",        type: 'item', operator: '-3', operator_value: -3, art_emoji: '🎶', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Beautiful. Irresistible. Dangerous to the distracted.' },
  { name: 'Golden Fleece',       type: 'item', operator: '+5', operator_value:  5, art_emoji: '🐑', effect_text: 'Add +5 to one creature.', flavor_text: 'Heals anything. Found it. Worth every monster.' },
  { name: "Pandora's Box",       type: 'item', operator: '-5', operator_value: -5, art_emoji: '📦', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Everything bad came out. Hope stayed inside. Barely.' },
  // --- ACTIONS ---
  { name: 'Riptide Slash',       type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '⚔️', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Clean strike. Value doubles on contact.' },
  { name: 'Son of Poseidon',     type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🌊', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'The ocean responds. Five times the force.' },
  { name: 'Mount Olympus',       type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '⛰️', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Divine authority. The gods are watching. Value multiplies by ten.' },
  { name: 'Mist Veil',           type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🌫️', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Mortals see what they want to see. Reality halved.' },
  { name: "Minotaur's Maze",     type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🐂', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Lost in the labyrinth. Value reduced to one fifth.' },
  { name: 'Curse of Achilles',   type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '👣', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Invulnerable everywhere except one spot. The spot flips everything.' },
  // --- EVENTS ---
  { name: 'Blessing of Olympus',    type: 'event', effect_type: 'x100',  art_emoji: '🌩️', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'The Olympians agree. Just this once. The result is enormous.' },
  { name: 'The Great Prophecy',     type: 'event', effect_type: 'swap',  art_emoji: '📜', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'The prophecy said a swap was coming. Now everyone knows.' },
];

// Release 30 — Dance
const r30Cards = [
  // --- CREATURES ---
  { name: 'Prima Ballerina',     type: 'creature', value: 10, art_emoji: '🩰', flavor_text: 'En pointe for twenty years. Every move looks effortless.' },
  { name: 'Hip-Hop Legend',      type: 'creature', value:  9, art_emoji: '🎤', flavor_text: 'Built a genre. Still putting out the best set in the room.' },
  { name: 'Contemporary Master', type: 'creature', value:  7, art_emoji: '🌊', flavor_text: 'Moves like water. Feels like emotion. Judges cry.' },
  { name: 'Salsa Queen',         type: 'creature', value:  6, art_emoji: '💃', flavor_text: 'The floor clears when she walks in. By design.' },
  { name: 'Breakdancer',         type: 'creature', value:  5, art_emoji: '🔄', flavor_text: 'Spins on their head. Casually. During the intro.' },
  { name: 'Tap Dancer',          type: 'creature', value:  5, art_emoji: '🎵', flavor_text: 'Every step is a note. Every entrance is a song.' },
  { name: 'Jazz Dancer',         type: 'creature', value:  4, art_emoji: '🎷', flavor_text: 'Improvises everything. Still in sync with the whole group.' },
  { name: 'Ballroom Champion',   type: 'creature', value:  3, art_emoji: '🥇', flavor_text: 'Counted the steps until they stopped counting.' },
  { name: 'Line Dancer',         type: 'creature', value:  3, art_emoji: '🤠', flavor_text: 'Never misses a step. The line does not break for them.' },
  { name: 'The Two-Left-Footer', type: 'creature', value:  2, art_emoji: '👟', flavor_text: 'Trying very hard. Points for enthusiasm.' },
  { name: 'The Wallflower',      type: 'creature', value:  1, art_emoji: '🌸', flavor_text: 'Loves the music from the edge of the room.' },
  { name: 'The Statue',          type: 'creature', value:  0, art_emoji: '🗿', flavor_text: 'Just... stands there. At a dance. Zero contribution.' },
  { name: 'The Stage Crasher',   type: 'creature', value: -2, art_emoji: '💥', flavor_text: 'Uninvited. Enthusiastic. Destructive to everyone\'s flow.' },
  { name: 'The Wet Blanket',     type: 'creature', value: -4, art_emoji: '😒', flavor_text: 'Arrived to inform everyone the music is too loud.' },
  // --- ITEMS ---
  { name: 'Ballet Shoes',    type: 'item', operator: '+2', operator_value:  2, art_emoji: '🩰', effect_text: 'Add +2 to one creature.', flavor_text: 'Worn through after a thousand hours of practice.' },
  { name: 'Spotlight',       type: 'item', operator: '+3', operator_value:  3, art_emoji: '💡', effect_text: 'Add +3 to one creature.', flavor_text: 'All eyes on them now. Value rises under the light.' },
  { name: 'Rhythm Stick',    type: 'item', operator: '+1', operator_value:  1, art_emoji: '🥁', effect_text: 'Add +1 to one creature.', flavor_text: 'Keeps the beat. Keeps them grounded.' },
  { name: 'Dance Belt',      type: 'item', operator: '+1', operator_value:  1, art_emoji: '🩱', effect_text: 'Add +1 to one creature.', flavor_text: 'The unsung hero of every performance.' },
  { name: 'Twisted Ankle',   type: 'item', operator: '-2', operator_value: -2, art_emoji: '🩹', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Happened in warm-up. Worst possible timing.' },
  { name: 'Stage Fright',    type: 'item', operator: '-3', operator_value: -3, art_emoji: '😬', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Everything practiced. Everything forgotten at the curtain.' },
  { name: 'Trophy Cup',      type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏆', effect_text: 'Add +5 to one creature.', flavor_text: 'First place. After everything, first place.' },
  { name: 'The Last Song',   type: 'item', operator: '-5', operator_value: -5, art_emoji: '🎼', effect_text: 'Subtract 5 from one creature.', flavor_text: 'The evening ends. The energy goes with it.' },
  // --- ACTIONS ---
  { name: 'Double Time',       type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '⚡', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Tempo doubles. So does everything else.' },
  { name: 'Show Stopper',      type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🌟', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'The whole room stops. Value rises five times over.' },
  { name: 'Standing Ovation',  type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '👏', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Everyone rises. Ten times the recognition.' },
  { name: 'Off Beat',          type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '📉', effect_text: "Divide one creature's value by 2.",    flavor_text: 'One count behind everyone else. Half the impact.' },
  { name: 'Trip Up',           type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🙃', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Stumbled at the worst moment. One fifth of what was expected.' },
  { name: 'Reverse Spin',      type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Turns the opposite direction. Value flips with it.' },
  // --- EVENTS ---
  { name: 'Flash Mob',   type: 'event', effect_type: 'mirror', art_emoji: '🎉', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'Synchronized strangers. Both end up with the same value.' },
  { name: 'Closing Night', type: 'event', effect_type: 'banish', art_emoji: '🎭', effect_text: 'Banish: Remove any one creature from the field permanently.', flavor_text: 'The final curtain. That dancer does not return.' },
];

// Release 31 — Theater
const r31Cards = [
  // --- CREATURES ---
  { name: 'Hamlet',         type: 'creature', value: 10, art_emoji: '💀', flavor_text: 'To be or not to be. He chose the dramatic option every time.' },
  { name: 'Lady Macbeth',   type: 'creature', value:  9, art_emoji: '🩸', flavor_text: 'Out, damned spot. The ambition never really washed out either.' },
  { name: 'Othello',        type: 'creature', value:  7, art_emoji: '🌙', flavor_text: 'Noble general. Brought down by a planted handkerchief.' },
  { name: 'Romeo',          type: 'creature', value:  6, art_emoji: '🌹', flavor_text: 'Met someone at a party. Made it everyone\'s problem.' },
  { name: 'Juliet',         type: 'creature', value:  5, art_emoji: '🌟', flavor_text: 'Smarter than Romeo. Still went along with it.' },
  { name: 'Falstaff',       type: 'creature', value:  5, art_emoji: '🍺', flavor_text: 'Coward, liar, thief. Somehow the best company in the play.' },
  { name: 'Puck',           type: 'creature', value:  4, art_emoji: '🧚', flavor_text: 'Lord, what fools these mortals be. Accurate. He caused it.' },
  { name: 'Prospero',       type: 'creature', value:  3, art_emoji: '🪄', flavor_text: 'Master of the island. Everything under control. Barely.' },
  { name: 'Bottom',         type: 'creature', value:  3, art_emoji: '🫏', flavor_text: 'Transformed into a donkey. Took it in stride.' },
  { name: 'The Stage Manager', type: 'creature', value:  2, art_emoji: '📋', flavor_text: 'Knows every cue. Fixes every disaster. Never takes a bow.' },
  { name: 'The Understudy', type: 'creature', value:  1, art_emoji: '🎭', flavor_text: 'Has memorized every role. Waiting for the call that never comes.' },
  { name: "Hamlet's Ghost", type: 'creature', value:  0, art_emoji: '👻', flavor_text: 'Technically dead. Has notes about the current situation.' },
  { name: 'Iago',           type: 'creature', value: -2, art_emoji: '🐍', flavor_text: 'Honest Iago. Neither honest nor to be trusted.' },
  { name: 'Malvolio',       type: 'creature', value: -4, art_emoji: '🟡', flavor_text: 'Put on yellow stockings. Ruined a party. Never forgiven.' },
  // --- ITEMS ---
  { name: 'Prop Sword',        type: 'item', operator: '+2', operator_value:  2, art_emoji: '🗡️', effect_text: 'Add +2 to one creature.', flavor_text: 'Fake blade. Real dramatic impact.' },
  { name: "Playwright's Script", type: 'item', operator: '+3', operator_value:  3, art_emoji: '📜', effect_text: 'Add +3 to one creature.', flavor_text: 'The words are already there. Deliver them.' },
  { name: 'Stage Light',       type: 'item', operator: '+1', operator_value:  1, art_emoji: '🔦', effect_text: 'Add +1 to one creature.', flavor_text: 'Illuminates the moment. Just one.' },
  { name: 'Costume Piece',     type: 'item', operator: '+1', operator_value:  1, art_emoji: '👗', effect_text: 'Add +1 to one creature.', flavor_text: 'A single accessory that completes the whole character.' },
  { name: 'Broken Prop',       type: 'item', operator: '-2', operator_value: -2, art_emoji: '💥', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Failed during the climax. Everyone noticed.' },
  { name: 'Forgotten Lines',   type: 'item', operator: '-3', operator_value: -3, art_emoji: '😶', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Long pause. The prompter whispers. Too late.' },
  { name: 'Tony Award',        type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏆', effect_text: 'Add +5 to one creature.', flavor_text: 'Best in show. Acknowledged by the industry.' },
  { name: 'Empty House',       type: 'item', operator: '-5', operator_value: -5, art_emoji: '🎪', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Not a single person in the seats. All that preparation for nothing.' },
  // --- ACTIONS ---
  { name: 'Curtain Call',    type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🎭', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'They bow again. And again. Value doubles each time.' },
  { name: 'Act Two',         type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🎬', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'The second act always raises the stakes. By five.' },
  { name: 'Grand Finale',    type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🌠', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'All the pieces come together. Ten times the impact.' },
  { name: 'Intermission',    type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '☕', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Everyone goes to the lobby. Momentum cut in half.' },
  { name: 'Scene Change',    type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🌅', effect_text: "Divide one creature's value by 5.",    flavor_text: 'The lights shift. The context changes. Value drops to one fifth.' },
  { name: 'Role Reversal',   type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔁', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Hero plays villain. The sign flips with the role.' },
  // --- EVENTS ---
  { name: 'Standing Ovation',      type: 'event', effect_type: 'x100',  art_emoji: '🌟', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'The entire house on its feet. The performance was one hundred times what they expected.' },
  { name: 'Understudy Takes Over', type: 'event', effect_type: 'swap',   art_emoji: '🔄', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'Called up at the last minute. Everything changes places.' },
];

// Release 32 — Martial Arts
const r32Cards = [
  // --- CREATURES ---
  { name: 'Grand Master',       type: 'creature', value: 10, art_emoji: '🥋', flavor_text: 'Fifty years of practice. Can end a fight without moving.' },
  { name: 'Black Belt Sensei',  type: 'creature', value:  9, art_emoji: '🏯', flavor_text: 'Earned every stripe. Teaches others to earn them too.' },
  { name: 'Tournament Champion', type: 'creature', value: 7, art_emoji: '🏆', flavor_text: 'Undefeated three years running. Everyone knows the name.' },
  { name: 'Jiu-Jitsu Expert',   type: 'creature', value:  6, art_emoji: '🤼', flavor_text: 'Size means nothing on the mat. They have proven it.' },
  { name: 'Muay Thai Fighter',  type: 'creature', value:  5, art_emoji: '🦵', flavor_text: 'Eight limbs in use. Eight points of damage.' },
  { name: 'Karate Instructor',  type: 'creature', value:  5, art_emoji: '🙏', flavor_text: 'Patience of stone. Strikes like one too.' },
  { name: 'Brown Belt',         type: 'creature', value:  4, art_emoji: '🟤', flavor_text: 'Almost there. Still learning. Still dangerous.' },
  { name: 'Samurai',            type: 'creature', value:  3, art_emoji: '⚔️', flavor_text: 'Code of Bushido. Sword sharp enough to split the wind.' },
  { name: 'Ninja',              type: 'creature', value:  3, art_emoji: '🥷', flavor_text: 'Was here. Could be here right now. No one knows.' },
  { name: 'White Belt',         type: 'creature', value:  2, art_emoji: '⬜', flavor_text: 'First day on the mat. Everything hurts. Still showed up.' },
  { name: 'Yellow Belt',        type: 'creature', value:  1, art_emoji: '🟡', flavor_text: 'Found the stance. Found the form. Starting to find confidence.' },
  { name: 'The Meditator',      type: 'creature', value:  0, art_emoji: '🧘', flavor_text: 'At peace with everything. Including losing.' },
  { name: 'The Street Fighter', type: 'creature', value: -2, art_emoji: '😤', flavor_text: 'No style. All aggression. More problems than solutions.' },
  { name: 'The Dirty Cheat',    type: 'creature', value: -5, art_emoji: '👁️', flavor_text: 'Sand in the eyes. Fake injury. The refs always catch it eventually.' },
  // --- ITEMS ---
  { name: 'Nunchucks',              type: 'item', operator: '+2', operator_value:  2, art_emoji: '🔗', effect_text: 'Add +2 to one creature.', flavor_text: 'Dangerous for everyone in the room including the user.' },
  { name: 'Black Belt',             type: 'item', operator: '+3', operator_value:  3, art_emoji: '🥋', effect_text: 'Add +3 to one creature.', flavor_text: 'Earned through pain. Respected by everyone.' },
  { name: 'Gi Uniform',             type: 'item', operator: '+1', operator_value:  1, art_emoji: '👘', effect_text: 'Add +1 to one creature.', flavor_text: 'Tied correctly. Ready to train.' },
  { name: 'Sparring Pads',          type: 'item', operator: '+1', operator_value:  1, art_emoji: '🧤', effect_text: 'Add +1 to one creature.', flavor_text: 'Protects just enough. Trains just right.' },
  { name: 'Sand in the Eyes',       type: 'item', operator: '-2', operator_value: -2, art_emoji: '😵', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Cheap tactic. Effective. Shameful.' },
  { name: 'Disqualification',       type: 'item', operator: '-3', operator_value: -3, art_emoji: '🚫', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Broke the rules. Lost the match. Lost the respect.' },
  { name: 'Championship Belt',      type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏅', effect_text: 'Add +5 to one creature.', flavor_text: 'The belt of a true champion. Worth every bruise.' },
  { name: 'Career-Ending Injury',   type: 'item', operator: '-5', operator_value: -5, art_emoji: '🩼', effect_text: 'Subtract 5 from one creature.', flavor_text: 'One wrong move. Everything ends.' },
  // --- ACTIONS ---
  { name: 'Double Kick',       type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🦶', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Two strikes, twice the result.' },
  { name: 'Five-Point Palm',   type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '✋', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Five points of contact. Five times the power.' },
  { name: 'Death Blow',        type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '💀', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The finishing move. Ten times the force.' },
  { name: 'Defensive Block',   type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🛡️', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Absorbs the impact. Halves the momentum.' },
  { name: 'Submission Hold',   type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🤸', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Tap out. Value drops to one fifth.' },
  { name: 'Reversal Throw',    type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Used their own force against them. Sign flips completely.' },
  // --- EVENTS ---
  { name: 'Perfect Form',  type: 'event', effect_type: 'mirror',  art_emoji: '🪞', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'The technique is flawless. One fighter mirrors the other exactly.' },
  { name: 'Dojo Storm',    type: 'event', effect_type: 'reverse', art_emoji: '🌀', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'Everyone enters from the wrong side. Every value flips.' },
];

// Release 33 — Disney
const r33Cards = [
  // --- CREATURES ---
  { name: 'Mickey Mouse',    type: 'creature', value: 10, art_emoji: '🐭', flavor_text: 'Started in a cartoon. Built an empire. Still cheerful about it.' },
  { name: 'Elsa',            type: 'creature', value:  9, art_emoji: '❄️', flavor_text: 'Let it go. It went. The whole mountain heard it.' },
  { name: 'Simba',           type: 'creature', value:  7, art_emoji: '🦁', flavor_text: 'Remembered who he was. Returned home. Hakuna Matata.' },
  { name: 'Moana',           type: 'creature', value:  6, art_emoji: '🌊', flavor_text: 'Crossed the ocean alone. Returned with a demigod and a restored heart.' },
  { name: 'Rapunzel',        type: 'creature', value:  5, art_emoji: '🦎', flavor_text: 'Seventy feet of hair. Used every inch of it.' },
  { name: 'Aladdin',         type: 'creature', value:  5, art_emoji: '🪔', flavor_text: 'A diamond in the rough. The Genie agreed.' },
  { name: 'Buzz Lightyear',  type: 'creature', value:  4, art_emoji: '🚀', flavor_text: 'To infinity and beyond. Which is quite far.' },
  { name: 'Woody',           type: 'creature', value:  3, art_emoji: '🤠', flavor_text: 'There\'s a snake in my boot. Managed it.' },
  { name: 'Cinderella',      type: 'creature', value:  3, art_emoji: '👠', flavor_text: 'Left one shoe. The whole kingdom looked for it.' },
  { name: 'Dumbo',           type: 'creature', value:  2, art_emoji: '🐘', flavor_text: 'Bullied for his ears. Used them to fly. Last laugh earned.' },
  { name: 'Pinocchio',       type: 'creature', value:  1, art_emoji: '🪵', flavor_text: 'Wants to be a real boy. Keeps lying. Not helping.' },
  { name: 'Bambi',           type: 'creature', value:  0, art_emoji: '🦌', flavor_text: 'Innocent. Pure. Has seen things.' },
  { name: 'Gaston',          type: 'creature', value: -2, art_emoji: '💪', flavor_text: 'No one hits like Gaston. No one\'s as villainous as Gaston.' },
  { name: 'Maleficent',      type: 'creature', value: -5, art_emoji: '🌑', flavor_text: 'Mistress of all evil. Self-titled. Self-fulfilled.' },
  // --- ITEMS ---
  { name: 'Magic Mirror',        type: 'item', operator: '+2', operator_value:  2, art_emoji: '🪞', effect_text: 'Add +2 to one creature.', flavor_text: 'Fairest in the land. Also a reliable source of information.' },
  { name: 'Glass Slipper',       type: 'item', operator: '+3', operator_value:  3, art_emoji: '👠', effect_text: 'Add +3 to one creature.', flavor_text: 'Fits exactly one person. Changes everything for that person.' },
  { name: 'Pixie Dust',          type: 'item', operator: '+1', operator_value:  1, art_emoji: '✨', effect_text: 'Add +1 to one creature.', flavor_text: 'Think happy thoughts. Float slightly upward.' },
  { name: 'Enchanted Rose',      type: 'item', operator: '+1', operator_value:  1, art_emoji: '🌹', effect_text: 'Add +1 to one creature.', flavor_text: 'Every petal counts. Running out of time.' },
  { name: "Villain's Hex",       type: 'item', operator: '-2', operator_value: -2, art_emoji: '🔮', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Cast in the dark. Takes effect immediately.' },
  { name: 'Forbidden Apple',     type: 'item', operator: '-3', operator_value: -3, art_emoji: '🍎', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Shiny. Deadly. Surprisingly effective.' },
  { name: "Genie's Lamp",        type: 'item', operator: '+5', operator_value:  5, art_emoji: '🪔', effect_text: 'Add +5 to one creature.', flavor_text: 'Three wishes. Choose the third one very carefully.' },
  { name: "Ursula's Cauldron",   type: 'item', operator: '-5', operator_value: -5, art_emoji: '🐙', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Poor unfortunate souls. Their value goes too.' },
  // --- ACTIONS ---
  { name: 'Bibbidi-Bobbidi-Boo', type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🪄', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'A wave of the wand. Value doubles like magic.' },
  { name: 'Fairy Dust Surge',    type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🌠', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Straight on till morning. Five times the altitude.' },
  { name: 'Happily Ever After',  type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '💫', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The best ending. Ten times the value to match.' },
  { name: 'Midnight Strike',     type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🕛', effect_text: "Divide one creature's value by 2.",    flavor_text: 'The magic fades at midnight. Half of everything remains.' },
  { name: 'Enchanted Sleep',     type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '😴', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Drifts into a deep sleep. One fifth of value remains.' },
  { name: "Villain's Curse",     type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🌑', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Every Disney villain has one. The sign flips.' },
  // --- EVENTS ---
  { name: 'Wish Granted',        type: 'event', effect_type: 'x100',   art_emoji: '⭐', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'The second star to the right. Straight on and one hundred times as bright.' },
  { name: "Sorcerer's Apprentice", type: 'event', effect_type: 'reverse', art_emoji: '🧙', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'The brooms got out of hand. Everything on one side inverted.' },
];

// Release 34 — Sushi
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

// Release 35 — Birthday
const r35Cards = [
  // --- CREATURES ---
  { name: 'Birthday Star',        type: 'creature', value: 10, art_emoji: '🌟', flavor_text: 'It is their day. Everything revolves around them. As it should.' },
  { name: 'Best Friend',          type: 'creature', value:  9, art_emoji: '🫂', flavor_text: 'Planned everything. Kept the secret. Worth every effort.' },
  { name: 'Party DJ',             type: 'creature', value:  7, art_emoji: '🎧', flavor_text: 'Reads the room. Plays the right song at the right second.' },
  { name: 'Birthday Clown',       type: 'creature', value:  6, art_emoji: '🤡', flavor_text: 'Funny to most. Unforgettable to all.' },
  { name: 'The Magician',         type: 'creature', value:  5, art_emoji: '🎩', flavor_text: 'Made a rabbit appear. Nobody asked where it came from.' },
  { name: 'The Piñata',           type: 'creature', value:  5, art_emoji: '🪅', flavor_text: 'Full of candy. Facing certain destruction. Still colorful.' },
  { name: 'Party Planner',        type: 'creature', value:  4, art_emoji: '📋', flavor_text: 'The checklist is color-coded. Nothing will go wrong.' },
  { name: 'Balloon Artist',       type: 'creature', value:  3, art_emoji: '🎈', flavor_text: 'Twists latex into recognizable shapes. Mostly a dog. Always a dog.' },
  { name: 'Designated Driver',    type: 'creature', value:  3, art_emoji: '🚗', flavor_text: 'Unsung hero. Drinks water. Gets everyone home.' },
  { name: 'The Late Arrival',     type: 'creature', value:  2, art_emoji: '⌚', flavor_text: 'Two hours late. Brought the best gift. Forgiven.' },
  { name: 'The Awkward Relative', type: 'creature', value:  -1, art_emoji: '😬', flavor_text: 'Means well. Tells the same story again. Still showed up.' },
  { name: 'Uninvited Guest',      type: 'creature', value:  0, art_emoji: '🚪', flavor_text: 'Followed someone else in. Eating the birthday cake. Unclear who this is.' },
  { name: 'The Party Pooper',     type: 'creature', value: -2, art_emoji: '😒', flavor_text: 'Announced the party was getting too loud. At 7 PM.' },
  { name: 'Rain on Your Birthday', type: 'creature', value: -5, art_emoji: '🌧️', flavor_text: 'Not even a person. Still shows up every year.' },
  // --- ITEMS ---
  { name: 'Confetti',            type: 'item', operator: '+2', operator_value:  2, art_emoji: '🎊', effect_text: 'Add +2 to one creature.', flavor_text: 'Everywhere. In everything. Still finding it six months later.' },
  { name: 'Birthday Cake',       type: 'item', operator: '+3', operator_value:  3, art_emoji: '🎂', effect_text: 'Add +3 to one creature.', flavor_text: 'Make a wish. Blow every candle. The wishes actually work here.' },
  { name: 'Balloon',             type: 'item', operator: '+1', operator_value:  1, art_emoji: '🎈', effect_text: 'Add +1 to one creature.', flavor_text: 'Up and away. For one more day.' },
  { name: 'Party Hat',           type: 'item', operator: '+1', operator_value:  1, art_emoji: '🥳', effect_text: 'Add +1 to one creature.', flavor_text: 'Elastic under the chin. Worth the look.' },
  { name: 'Popped Balloon',      type: 'item', operator: '-2', operator_value: -2, art_emoji: '💥', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Loud. Startling. Slightly upsetting for everyone.' },
  { name: 'Melted Ice Cream',    type: 'item', operator: '-3', operator_value: -3, art_emoji: '🍦', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Was supposed to be the highlight. The sun had other ideas.' },
  { name: 'Giant Birthday Check', type: 'item', operator: '+5', operator_value:  5, art_emoji: '💰', effect_text: 'Add +5 to one creature.', flavor_text: 'From the grandparents. The amount is not proportionate to their finances.' },
  { name: 'No-Show Guests',      type: 'item', operator: '-5', operator_value: -5, art_emoji: '❌', effect_text: 'Subtract 5 from one creature.', flavor_text: 'RSVP yes. Arrived never. The cake had their name on it.' },
  // --- ACTIONS ---
  { name: 'Double the Candles',  type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🕯️', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Twice as many candles. Twice the smoke. Twice the wish.' },
  { name: 'Make a Wish',         type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '⭐', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Eyes closed. Candles blown. Five times the results.' },
  { name: 'Sweet Sixteen',       type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🎉', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The big one. Everything is ten times more significant today.' },
  { name: 'Half Birthday',       type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🍰', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Half the celebration. Half the cake.' },
  { name: 'Blow Out the Candles', type: 'action', operator: '÷5',   operator_value:  0.2, art_emoji: '💨', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Extinguished too quickly. Value fades to one fifth.' },
  { name: 'Pranked Present',     type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🎁', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Wrapped with care. Opened with dread. The value flips.' },
  // --- EVENTS ---
  { name: 'Surprise Party',   type: 'event', effect_type: 'mirror', art_emoji: '🎉', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'Totally unexpected. Both creatures end up with the same value.' },
  { name: 'Musical Chairs',   type: 'event', effect_type: 'swap',   art_emoji: '🎵', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'Music stops. Everyone scrambles. Two creatures swap seats.' },
];

// Release 36 — Earth
const r36Cards = [
  // --- CREATURES ---
  { name: 'African Elephant',  type: 'creature', value: 10, art_emoji: '🐘', flavor_text: 'Largest land animal. Never forgets anything. Never forgets you.' },
  { name: 'Bengal Tiger',      type: 'creature', value:  9, art_emoji: '🐯', flavor_text: 'Apex predator of the jungle. Striped to disappear.' },
  { name: 'Mountain Gorilla',  type: 'creature', value:  7, art_emoji: '🦍', flavor_text: 'Most of that size is muscle. All of that gaze is wisdom.' },
  { name: 'Grizzly Bear',      type: 'creature', value:  6, art_emoji: '🐻', flavor_text: 'Hibernates half the year. Still the most feared thing in the forest.' },
  { name: 'Snow Leopard',      type: 'creature', value:  5, art_emoji: '🐆', flavor_text: 'Seen almost never. Present always.' },
  { name: 'Wolf',              type: 'creature', value:  5, art_emoji: '🐺', flavor_text: 'Hunts in packs. The howl carries for miles.' },
  { name: 'Eagle',             type: 'creature', value:  4, art_emoji: '🦅', flavor_text: 'Sees everything from two miles up. Misses nothing.' },
  { name: 'Bison',             type: 'creature', value:  3, art_emoji: '🦬', flavor_text: 'Once numbered in the millions. Stubborn enough to come back.' },
  { name: 'Kangaroo',          type: 'creature', value:  3, art_emoji: '🦘', flavor_text: 'Carries its young in a pocket. Kicks with both feet simultaneously.' },
  { name: 'Hedgehog',          type: 'creature', value:  2, art_emoji: '🦔', flavor_text: 'Small. Spiky. Calmly defends itself from everything.' },
  { name: 'Axolotl',           type: 'creature', value:  1, art_emoji: '🦎', flavor_text: 'Regrows limbs. Keeps smiling. An underrated miracle.' },
  { name: 'Sloth',             type: 'creature', value:  0, art_emoji: '🦥', flavor_text: 'Moves three meters a minute. Has no opinion about it.' },
  { name: 'Locust Swarm',      type: 'creature', value: -2, art_emoji: '🦟', flavor_text: 'A billion individuals. One terrible direction.' },
  { name: 'Invasive Species',  type: 'creature', value: -5, art_emoji: '🪲', flavor_text: 'Arrived uninvited. Dismantled the local ecosystem. Still here.' },
  // --- ITEMS ---
  { name: 'Fertile Soil',      type: 'item', operator: '+2', operator_value:  2, art_emoji: '🌱', effect_text: 'Add +2 to one creature.', flavor_text: 'Everything grows here. Given time.' },
  { name: 'Fresh Water Spring', type: 'item', operator: '+3', operator_value:  3, art_emoji: '💧', effect_text: 'Add +3 to one creature.', flavor_text: 'Pure. Cold. Worth crossing a mountain range for.' },
  { name: 'Mossy Stone',       type: 'item', operator: '+1', operator_value:  1, art_emoji: '🪨', effect_text: 'Add +1 to one creature.', flavor_text: 'Ancient. Sturdy. Something is growing on it.' },
  { name: 'Wildflower',        type: 'item', operator: '+1', operator_value:  1, art_emoji: '🌸', effect_text: 'Add +1 to one creature.', flavor_text: 'Grew through a crack in the concrete. Inspiring.' },
  { name: 'Oil Spill',         type: 'item', operator: '-2', operator_value: -2, art_emoji: '🛢️', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Spreads fast. Stays forever.' },
  { name: 'Acid Rain',         type: 'item', operator: '-3', operator_value: -3, art_emoji: '🌧️', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Falls from the sky. Damages everything it touches.' },
  { name: "Eden's Garden",     type: 'item', operator: '+5', operator_value:  5, art_emoji: '🌳', effect_text: 'Add +5 to one creature.', flavor_text: 'Perfect conditions. Everything thrives.' },
  { name: 'Deforestation',     type: 'item', operator: '-5', operator_value: -5, art_emoji: '🪓', effect_text: 'Subtract 5 from one creature.', flavor_text: 'The forest is gone. Everything that depended on it goes too.' },
  // --- ACTIONS ---
  { name: 'Volcanic Eruption',       type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🌋', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'The mountain opens. Power doubles in an instant.' },
  { name: 'Earthquake',              type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🌍', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'The ground shakes. Value multiplies five times.' },
  { name: 'Extinction Event',        type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '☄️', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The rock hits. Everything changes. Ten times the consequence.' },
  { name: 'Erosion',                 type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '💨', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Wears away slowly. Half is gone before you notice.' },
  { name: 'Drought',                 type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🏜️', effect_text: "Divide one creature's value by 5.",    flavor_text: 'The river stopped. Capacity drops to one fifth.' },
  { name: 'Magnetic Field Reversal', type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🧲', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'North becomes south. All values reverse with it.' },
  // --- EVENTS ---
  { name: 'Wildfire',         type: 'event', effect_type: 'zero_out', art_emoji: '🔥', effect_text: 'Zero Out: Set any one creature on the field to 0.', flavor_text: 'Moves faster than expected. That creature is reduced to nothing.' },
  { name: 'Great Migration',  type: 'event', effect_type: 'mirror',   art_emoji: '🦓', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'Millions moving together. One creature mirrors another exactly.' },
];

// Release 37 — Technology
const r37Cards = [
  // --- CREATURES ---
  { name: 'AI Superintelligence', type: 'creature', value: 10, art_emoji: '🤖', flavor_text: 'Solved everything in seventeen milliseconds. Working on the next thing.' },
  { name: 'Quantum Computer',     type: 'creature', value:  9, art_emoji: '⚛️', flavor_text: 'Exists in multiple states at once. Very productive.' },
  { name: 'Blockchain',           type: 'creature', value:  7, art_emoji: '🔗', flavor_text: 'Decentralized. Immutable. Mentioned at every startup pitch.' },
  { name: 'Smartphone',           type: 'creature', value:  6, art_emoji: '📱', flavor_text: 'More power than the moon landing. Used mostly for short videos.' },
  { name: 'Cloud Server',         type: 'creature', value:  5, art_emoji: '☁️', flavor_text: 'Stores everything. Located somewhere in Ohio, probably.' },
  { name: 'Neural Network',       type: 'creature', value:  5, art_emoji: '🧠', flavor_text: 'Learned from the data. Has opinions about it now.' },
  { name: 'Smart Watch',          type: 'creature', value:  4, art_emoji: '⌚', flavor_text: 'Tracks steps. Judges sleep. Vibrates unnecessarily.' },
  { name: 'Social Media Bot',     type: 'creature', value:  3, art_emoji: '🤳', flavor_text: 'Posts constantly. Has seventeen thousand followers. Is not real.' },
  { name: 'GPS Tracker',          type: 'creature', value:  3, art_emoji: '📍', flavor_text: 'Always knows where you are. Sharing with everyone.' },
  { name: 'Calculator',           type: 'creature', value:  2, art_emoji: '🔢', flavor_text: 'Does the math faster. Does not do the thinking for you.' },
  { name: 'Floppy Disk',          type: 'creature', value:  1, art_emoji: '💾', flavor_text: '1.44 megabytes of pure nostalgia.' },
  { name: 'Loading Screen',       type: 'creature', value:  0, art_emoji: '⏳', flavor_text: 'Processing. Please wait. Processing. Please wait.' },
  { name: 'Computer Virus',       type: 'creature', value: -2, art_emoji: '🦠', flavor_text: 'Copied itself into everything. Nothing personal.' },
  { name: 'Ransomware',           type: 'creature', value: -5, art_emoji: '🔒', flavor_text: 'Encrypted every file. The instructions say to pay in crypto.' },
  // --- ITEMS ---
  { name: 'RAM Upgrade',          type: 'item', operator: '+2', operator_value:  2, art_emoji: '💡', effect_text: 'Add +2 to one creature.', flavor_text: 'More memory. Everything moves faster now.' },
  { name: 'SSD Drive',            type: 'item', operator: '+3', operator_value:  3, art_emoji: '🗂️', effect_text: 'Add +3 to one creature.', flavor_text: 'Boots in seconds. Worth every penny.' },
  { name: 'USB Cable',            type: 'item', operator: '+1', operator_value:  1, art_emoji: '🔌', effect_text: 'Add +1 to one creature.', flavor_text: 'Always the wrong end the first time.' },
  { name: 'Screen Protector',     type: 'item', operator: '+1', operator_value:  1, art_emoji: '🛡️', effect_text: 'Add +1 to one creature.', flavor_text: 'One layer of plastic between the screen and everything.' },
  { name: 'Dead Battery',         type: 'item', operator: '-2', operator_value: -2, art_emoji: '🪫', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Three percent. Then zero. Always at the worst moment.' },
  { name: 'Blue Screen of Death', type: 'item', operator: '-3', operator_value: -3, art_emoji: '💙', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Everything was going fine. Then suddenly, this.' },
  { name: 'Supercomputer Access', type: 'item', operator: '+5', operator_value:  5, art_emoji: '🖥️', effect_text: 'Add +5 to one creature.', flavor_text: 'More processing power than entire universities.' },
  { name: 'Corrupted Hard Drive', type: 'item', operator: '-5', operator_value: -5, art_emoji: '💀', effect_text: 'Subtract 5 from one creature.', flavor_text: 'The backup never ran. Nothing is recoverable.' },
  // --- ACTIONS ---
  { name: 'CPU Overclock',    type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🔧', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Pushed past the limit. Twice the speed, twice the heat.' },
  { name: 'Algorithm Boost',  type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '📊', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Optimized perfectly. Five times the output.' },
  { name: 'Quantum Leap',     type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🚀', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Orders of magnitude ahead of everything else.' },
  { name: 'Buffering',        type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🔄', effect_text: "Divide one creature's value by 2.",    flavor_text: 'The spinning circle. Half a signal. Half the value.' },
  { name: 'Data Cap',         type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '📵', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Hit the limit at the worst time. One fifth remains.' },
  { name: 'System Crash',     type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '💥', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Unexpected shutdown. Everything inverted on restart.' },
  // --- EVENTS ---
  { name: 'Viral Moment',  type: 'event', effect_type: 'x100',   art_emoji: '📱', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'Posted at midnight. A hundred million views by morning.' },
  { name: 'Data Breach',   type: 'event', effect_type: 'reverse', art_emoji: '🔓', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'Everything exposed. Every value on one side inverted.' },
];

// Release 38 — Mythical Creatures
const r38Cards = [
  // --- CREATURES ---
  { name: 'Dragon',          type: 'creature', value: 10, art_emoji: '🐉', flavor_text: 'Ancient. Enormous. The fire is just a bonus.' },
  { name: 'Phoenix',         type: 'creature', value:  9, art_emoji: '🔥', flavor_text: 'Dies in flames. Rises from the same ones. Unimpressed by either.' },
  { name: 'Leviathan',       type: 'creature', value:  7, art_emoji: '🌊', flavor_text: 'Older than the oceans it swims in.' },
  { name: 'Chimera',         type: 'creature', value:  6, art_emoji: '🦁', flavor_text: 'Three creatures. One bad decision by the gods.' },
  { name: 'Hydra',           type: 'creature', value:  5, art_emoji: '🐍', flavor_text: 'Cut off one head. Two grow back. Mathematically unsound.' },
  { name: 'Basilisk',        type: 'creature', value:  5, art_emoji: '👁️', flavor_text: 'Its gaze kills. Indirect eye contact just hospitalizes.' },
  { name: 'Centaur',         type: 'creature', value:  4, art_emoji: '🏹', flavor_text: 'Half horse, half archer. Twice the attitude.' },
  { name: 'Medusa',          type: 'creature', value:  3, art_emoji: '🐍', flavor_text: 'Turned heroes to stone. Still standing.' },
  { name: 'Werewolf',        type: 'creature', value:  3, art_emoji: '🌕', flavor_text: 'Fine eleven days out of twelve.' },
  { name: 'Unicorn',         type: 'creature', value:  2, art_emoji: '🦄', flavor_text: 'Pure and magical. Extremely difficult to find. Very difficult to catch.' },
  { name: 'Faerie',          type: 'creature', value:  1, art_emoji: '🧚', flavor_text: 'Grants wishes. Reads the fine print very carefully.' },
  { name: "Will-o'-the-Wisp", type: 'creature', value:  0, art_emoji: '✨', flavor_text: 'Leads travelers astray. Offers nothing in return.' },
  { name: 'Banshee',         type: 'creature', value: -2, art_emoji: '👻', flavor_text: 'Its wail foretells death. Everyone nearby agrees this is bad.' },
  { name: 'Void Wraith',     type: 'creature', value: -5, art_emoji: '🌑', flavor_text: 'Came from the space between worlds. Nothing survives that.' },
  // --- ITEMS ---
  { name: 'Dragon Scale',       type: 'item', operator: '+2', operator_value:  2, art_emoji: '🛡️', effect_text: 'Add +2 to one creature.', flavor_text: 'Nearly impenetrable. The dragon is still using most of them.' },
  { name: 'Enchanted Sword',    type: 'item', operator: '+3', operator_value:  3, art_emoji: '⚔️', effect_text: 'Add +3 to one creature.', flavor_text: 'Forged in an age before memory. Still perfectly balanced.' },
  { name: 'Magic Potion',       type: 'item', operator: '+1', operator_value:  1, art_emoji: '🧪', effect_text: 'Add +1 to one creature.', flavor_text: 'One sip. Small benefit. No side effects listed.' },
  { name: 'Protective Amulet',  type: 'item', operator: '+1', operator_value:  1, art_emoji: '🔮', effect_text: 'Add +1 to one creature.', flavor_text: 'Wards off minor evils. Major evils require two.' },
  { name: 'Cursed Artifact',    type: 'item', operator: '-2', operator_value: -2, art_emoji: '⚱️', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Beautiful. Ancient. Active curse clearly labeled.' },
  { name: 'Basilisk Venom',     type: 'item', operator: '-3', operator_value: -3, art_emoji: '☠️', effect_text: 'Subtract 3 from one creature.', flavor_text: 'One of the deadliest substances known to mythology.' },
  { name: 'Excalibur',          type: 'item', operator: '+5', operator_value:  5, art_emoji: '🗡️', effect_text: 'Add +5 to one creature.', flavor_text: 'Pulled from the stone by the one true ruler. No one else could manage.' },
  { name: 'Eldritch Tome',      type: 'item', operator: '-5', operator_value: -5, art_emoji: '📕', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Do not read it aloud. Do not read it quietly either.' },
  // --- ACTIONS ---
  { name: "Dragon's Breath",   type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🔥', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'The flame doubles everything in its path.' },
  { name: 'Mythic Power',      type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '⚡', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Power from the age of legends. Five times what mortals manage.' },
  { name: 'Ancient Curse',     type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '📜', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'A thousand years in the making. Ten times the consequence.' },
  { name: "Stone Gaze",        type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🗿', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Caught a glance. Half the movement. Half the value.' },
  { name: "Siren's Call",      type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🎶', effect_text: "Divide one creature's value by 5.",    flavor_text: 'The song pulls the creature off course. One fifth remains.' },
  { name: 'Shapeshifter',      type: 'action', operator: '×(-2)', operator_value: -2,   art_emoji: '🌀', effect_text: "Multiply one creature's value by −2.", flavor_text: 'Changed form. Doubled in the wrong direction.' },
  // --- EVENTS ---
  { name: 'Banishment Spell',    type: 'event', effect_type: 'banish', art_emoji: '💫', effect_text: 'Banish: Remove any one creature from the field permanently.', flavor_text: 'Sent back to the realm it came from. The field is quieter now.' },
  { name: 'Legendary Awakening', type: 'event', effect_type: 'x100',   art_emoji: '🌟', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'The legend rises. A hundred times what anyone prepared for.' },
];

// Release 39 — Candy & Sweets
const r39Cards = [
  // --- CREATURES ---
  { name: 'The Candy Overlord',    type: 'creature', value: 10, art_emoji: '👑', flavor_text: 'Rules from a throne of hardened caramel. Has been there for years.' },
  { name: 'Master Chocolatier',    type: 'creature', value:  9, art_emoji: '🍫', flavor_text: 'Tempering chocolate is a life\'s work. A perfect life\'s work.' },
  { name: 'Gummy Bear King',       type: 'creature', value:  7, art_emoji: '🐻', flavor_text: 'Leads the gummy army. Beloved. Slightly sticky.' },
  { name: 'Ice Cream Wizard',      type: 'creature', value:  6, art_emoji: '🍦', flavor_text: 'Summons any flavor from thin air. Seasonal specials are extraordinary.' },
  { name: 'Cotton Candy Cloud',    type: 'creature', value:  5, art_emoji: '☁️', flavor_text: 'Floats above the field. Tastes of summer and pink.' },
  { name: 'Caramel Tycoon',        type: 'creature', value:  5, art_emoji: '🍮', flavor_text: 'Controls the caramel supply. A position of tremendous power.' },
  { name: 'Lollipop Guardian',     type: 'creature', value:  4, art_emoji: '🍭', flavor_text: 'Stands at the entrance. Has one lollipop. You cannot have it.' },
  { name: 'Jelly Bean Jester',     type: 'creature', value:  3, art_emoji: '🫘', flavor_text: 'Comes in every flavor including bad ones. Unpredictable.' },
  { name: 'Peppermint Pixie',      type: 'creature', value:  3, art_emoji: '🌿', flavor_text: 'Leaves a cool sensation wherever it goes.' },
  { name: 'Sugar Fairy',           type: 'creature', value:  2, art_emoji: '🧚', flavor_text: 'Sprinkles sugar on everything. Means it kindly.' },
  { name: 'Licorice Goblin',       type: 'creature', value:  1, art_emoji: '🖤', flavor_text: 'Hoards the black licorice. Nobody is fighting for it.' },
  { name: 'Empty Wrapper',         type: 'creature', value:  0, art_emoji: '📄', flavor_text: 'All the promise. None of the candy. Still technically here.' },
  { name: 'Sugar Crash',           type: 'creature', value: -2, art_emoji: '😵', flavor_text: 'Inevitably follows the sugar high. Nobody is surprised.' },
  { name: 'Toothache Monster',     type: 'creature', value: -5, art_emoji: '🦷', flavor_text: 'The price of indulgence. Shows up eventually. Always.' },
  // --- ITEMS ---
  { name: 'Rainbow Sprinkles',      type: 'item', operator: '+2', operator_value:  2, art_emoji: '🌈', effect_text: 'Add +2 to one creature.', flavor_text: 'On everything. Always appropriate.' },
  { name: 'Jumbo Jawbreaker',       type: 'item', operator: '+3', operator_value:  3, art_emoji: '⚪', effect_text: 'Add +3 to one creature.', flavor_text: 'Takes six months. Worth it.' },
  { name: 'Candy Corn',             type: 'item', operator: '+1', operator_value:  1, art_emoji: '🌽', effect_text: 'Add +1 to one creature.', flavor_text: 'Divisive. Seasonal. Still here every October.' },
  { name: 'Gummy Worm',             type: 'item', operator: '+1', operator_value:  1, art_emoji: '🪱', effect_text: 'Add +1 to one creature.', flavor_text: 'Sour on the outside. Sweet throughout. Worm-shaped for some reason.' },
  { name: 'Cavity Warning',         type: 'item', operator: '-2', operator_value: -2, art_emoji: '⚠️', effect_text: 'Subtract 2 from one creature.', flavor_text: 'The dentist mentioned this would happen. Repeatedly.' },
  { name: 'Stale Halloween Candy',  type: 'item', operator: '-3', operator_value: -3, art_emoji: '👻', effect_text: 'Subtract 3 from one creature.', flavor_text: 'From three Halloweens ago. Still in the bowl.' },
  { name: "Willy Wonka's Golden Ticket", type: 'item', operator: '+5', operator_value: 5, art_emoji: '🎫', effect_text: 'Add +5 to one creature.', flavor_text: 'One in a million. The factory is real. Please read the fine print.' },
  { name: 'Sugar Overdose',         type: 'item', operator: '-5', operator_value: -5, art_emoji: '😨', effect_text: 'Subtract 5 from one creature.', flavor_text: 'The ceiling. Spun. Everything went sideways.' },
  // --- ACTIONS ---
  { name: 'Double Dip',          type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🍭', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Against the rules at the candy counter. Value doubles.' },
  { name: 'Candy Rush',          type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '⚡', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Five pieces in rapid succession. Five times the energy.' },
  { name: 'Sugar High',          type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🚀', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The peak. Everything is ten times louder and faster.' },
  { name: 'Melt in the Sun',     type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '☀️', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Left in the car. Half of it is on the seat now.' },
  { name: 'Diet Mode',           type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🥗', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Cutting back. Severely. One fifth of the sweetness remains.' },
  { name: 'Bitter Aftertaste',   type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '😬', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Started sweet. Ended wrong. The sign flips.' },
  // --- EVENTS ---
  { name: 'Dentist Visit',  type: 'event', effect_type: 'banish', art_emoji: '🦷', effect_text: 'Banish: Remove any one creature from the field permanently.', flavor_text: 'No candy for six months. That creature is gone.' },
  { name: 'Candy Rain',     type: 'event', effect_type: 'mirror', art_emoji: '🌈', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'It rained candy. Two creatures ended up with identical sweetness.' },
];

// Release 40 — Around the House
const r40Cards = [
  // --- CREATURES ---
  { name: 'Head of Household',    type: 'creature', value: 10, art_emoji: '🏠', flavor_text: 'Controls the thermostat. Has controlled it for fifteen years. Will not stop.' },
  { name: 'The Chef',             type: 'creature', value:  9, art_emoji: '👨‍🍳', flavor_text: 'Cooks without a recipe. Every meal perfect. Will not share the secret.' },
  { name: 'The Handyman',         type: 'creature', value:  7, art_emoji: '🔧', flavor_text: 'Fixed the door. Fixed the sink. On to the roof. Unstoppable.' },
  { name: 'The Family Pet (Cat)', type: 'creature', value:  6, art_emoji: '🐱', flavor_text: 'Knocks things off the counter deliberately. Unrepentant.' },
  { name: 'The House Plant',      type: 'creature', value:  5, art_emoji: '🪴', flavor_text: 'Survived every winter and one drought. Quietly thriving.' },
  { name: 'The Roomba',           type: 'creature', value:  5, art_emoji: '🤖', flavor_text: 'Cleans on schedule. Gets stuck under the same couch every Tuesday.' },
  { name: 'The Baby',             type: 'creature', value:  4, art_emoji: '👶', flavor_text: 'No concept of time. Total control of the household schedule.' },
  { name: 'The Teenager',         type: 'creature', value:  3, art_emoji: '📱', flavor_text: 'In their room. Has been since Thursday. The WiFi is fine.' },
  { name: 'The Goldfish',         type: 'creature', value:  3, art_emoji: '🐟', flavor_text: 'Three-second memory. Three years old. Going strong.' },
  { name: 'The Spare Key',        type: 'creature', value:  2, art_emoji: '🗝️', flavor_text: 'Under the mat. The only place it ever is. Everyone knows.' },
  { name: 'The Welcome Mat',      type: 'creature', value:  1, art_emoji: '🪑', flavor_text: 'Has one job. Does it every time.' },
  { name: 'The Junk Drawer',      type: 'creature', value:  0, art_emoji: '🗂️', flavor_text: 'Contains everything and nothing. Has never been fully understood.' },
  { name: 'The Backed-Up Drain',  type: 'creature', value: -2, art_emoji: '🚿', flavor_text: 'Everyone noticed. Nobody fixed it. Still backing up.' },
  { name: 'The In-Law',           type: 'creature', value: -5, art_emoji: '😬', flavor_text: 'Arriving Friday. Staying until it is unbearable. Opinions strong.' },
  // --- ITEMS ---
  { name: 'Extra Blanket',             type: 'item', operator: '+2', operator_value:  2, art_emoji: '🛏️', effect_text: 'Add +2 to one creature.', flavor_text: 'The good one. Already on the couch. Perfect.' },
  { name: 'Noise-Canceling Headphones', type: 'item', operator: '+3', operator_value:  3, art_emoji: '🎧', effect_text: 'Add +3 to one creature.', flavor_text: 'The outside world disappears entirely. Everything improves.' },
  { name: 'Post-It Note',              type: 'item', operator: '+1', operator_value:  1, art_emoji: '📌', effect_text: 'Add +1 to one creature.', flavor_text: 'One reminder. Slightly sticky. Cannot be ignored.' },
  { name: 'Doorstop',                  type: 'item', operator: '+1', operator_value:  1, art_emoji: '🚪', effect_text: 'Add +1 to one creature.', flavor_text: 'Holds things open. A small service with a big impact.' },
  { name: 'Broken Light Bulb',         type: 'item', operator: '-2', operator_value: -2, art_emoji: '💡', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Nobody replaced it. The room is darker now.' },
  { name: 'Leaky Faucet',              type: 'item', operator: '-3', operator_value: -3, art_emoji: '🚰', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Drip. Drip. Drip. A slow drain on everything.' },
  { name: 'New Furniture Set',         type: 'item', operator: '+5', operator_value:  5, art_emoji: '🛋️', effect_text: 'Add +5 to one creature.', flavor_text: 'The whole room transformed. Worth the delivery fee.' },
  { name: 'Flooded Basement',          type: 'item', operator: '-5', operator_value: -5, art_emoji: '💧', effect_text: 'Subtract 5 from one creature.', flavor_text: 'Everything stored there is gone. The carpet too.' },
  // --- ACTIONS ---
  { name: 'Spring Cleaning',          type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🧹', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Out with the old. Value doubles with the fresh start.' },
  { name: 'Home Renovation',          type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🔨', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Three contractors. Two months. Five times the value.' },
  { name: 'Full House',               type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🏡', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Every room occupied. The energy is tenfold.' },
  { name: 'Power Nap',                type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '😴', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Twenty minutes on the couch. Woke up four hours later. Half capacity.' },
  { name: 'Lost in the Couch',        type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🛋️', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Fell between the cushions. One fifth recovered.' },
  { name: 'Mirrors Facing Each Other', type: 'action', operator: '×(-1)', operator_value: -1,  art_emoji: '🪞', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Infinite reflections. The value stares back reversed.' },
  // --- EVENTS ---
  { name: 'Home Makeover',            type: 'event', effect_type: 'x100',  art_emoji: '🏠', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'The contractors outdid themselves. One hundred times more valuable.' },
  { name: 'Rearranging the Furniture', type: 'event', effect_type: 'swap', art_emoji: '🔄', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'Everything moved at midnight. Two creatures ended up on the wrong side.' },
];

const newReleases = [
  { number: 24, name: 'Pokemon',             icon: '⚡', color_hex: '#FFCC00' },
  { number: 25, name: 'Harry Potter',        icon: '🧙', color_hex: '#7b2fa0' },
  { number: 26, name: 'Books',               icon: '📚', color_hex: '#8b4513' },
  { number: 27, name: 'TV',                  icon: '📺', color_hex: '#1a1a2e' },
  { number: 28, name: 'School',              icon: '✏️', color_hex: '#3b82f6' },
  { number: 29, name: 'Percy Jackson',       icon: '🔱', color_hex: '#1e40af' },
  { number: 30, name: 'Dance',               icon: '💃', color_hex: '#db2777' },
  { number: 31, name: 'Theater',             icon: '🎭', color_hex: '#6d28d9' },
  { number: 32, name: 'Martial Arts',        icon: '🥋', color_hex: '#1c1917' },
  { number: 33, name: 'Disney',              icon: '🏰', color_hex: '#003087' },
  { number: 34, name: 'Sushi',               icon: '🍣', color_hex: '#dc2626' },
  { number: 35, name: 'Birthday',            icon: '🎂', color_hex: '#f59e0b' },
  { number: 36, name: 'Earth',               icon: '🌍', color_hex: '#15803d' },
  { number: 37, name: 'Technology',          icon: '💻', color_hex: '#0f172a' },
  { number: 38, name: 'Mythical Creatures',  icon: '🐉', color_hex: '#7c3aed' },
  { number: 39, name: 'Candy & Sweets',      icon: '🍬', color_hex: '#ec4899' },
  { number: 40, name: 'Around the House',    icon: '🏠', color_hex: '#b45309' },
];

const newReleaseCardPairs = [
  { number: 24, cards: r24Cards },
  { number: 25, cards: r25Cards },
  { number: 26, cards: r26Cards },
  { number: 27, cards: r27Cards },
  { number: 28, cards: r28Cards },
  { number: 29, cards: r29Cards },
  { number: 30, cards: r30Cards },
  { number: 31, cards: r31Cards },
  { number: 32, cards: r32Cards },
  { number: 33, cards: r33Cards },
  { number: 34, cards: r34Cards },
  { number: 35, cards: r35Cards },
  { number: 36, cards: r36Cards },
  { number: 37, cards: r37Cards },
  { number: 38, cards: r38Cards },
  { number: 39, cards: r39Cards },
  { number: 40, cards: r40Cards },
];

async function addReleases() {
  console.log('Adding releases 24–40...');

  const { data: releaseRows, error: relErr } = await supabase
    .from('releases')
    .upsert(newReleases, { onConflict: 'number' })
    .select();

  if (relErr) {
    console.error('Release upsert error:', relErr);
    process.exit(1);
  }

  console.log(`Upserted ${releaseRows!.length} releases`);

  for (const { number, cards } of newReleaseCardPairs) {
    const release = releaseRows!.find(r => r.number === number)!;
    const cardRows = cards.map(c => ({ ...c, release_id: release.id }));

    const { error } = await supabase
      .from('cards')
      .insert(cardRows);

    if (error) {
      console.error(`Error upserting release ${number}:`, error);
      process.exit(1);
    }

    console.log(`Upserted ${cardRows.length} cards for Release ${number} (${newReleases.find(r => r.number === number)!.name})`);
  }

  console.log('Done!');
}

addReleases();
