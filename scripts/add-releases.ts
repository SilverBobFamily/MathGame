import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Release 8 — Underwater
const r8Cards = [
  // --- CREATURES ---
  { name: 'Great White Shark', type: 'creature', value: 10, art_emoji: '🦈', flavor_text: 'King of the ocean. Fear is just its wake.' },
  { name: 'Blue Whale',        type: 'creature', value:  9, art_emoji: '🐋', flavor_text: 'The largest creature to ever live. Still gentle, mostly.' },
  { name: 'Orca',              type: 'creature', value:  7, art_emoji: '🐬', flavor_text: 'Apex predator dressed in tuxedo colors.' },
  { name: 'Giant Squid',       type: 'creature', value:  6, art_emoji: '🦑', flavor_text: 'Haunts the deep. Rarely seen, always feared.' },
  { name: 'Hammerhead Shark',  type: 'creature', value:  5, art_emoji: '🔨', flavor_text: 'Sees in every direction. Eyes on the prize.' },
  { name: 'Manta Ray',         type: 'creature', value:  5, art_emoji: '🌊', flavor_text: 'Glides in silence. Grace and power combined.' },
  { name: 'Dolphin',           type: 'creature', value:  4, art_emoji: '🐬', flavor_text: 'The optimist of the ocean. Always smiling.' },
  { name: 'Sea Turtle',        type: 'creature', value:  3, art_emoji: '🐢', flavor_text: 'Two hundred million years and still going strong.' },
  { name: 'Octopus',           type: 'creature', value:  3, art_emoji: '🐙', flavor_text: 'Eight arms, unlimited tactics.' },
  { name: 'Clownfish',         type: 'creature', value:  2, art_emoji: '🐠', flavor_text: 'Surprisingly brave for something so bright.' },
  { name: 'Seahorse',          type: 'creature', value:  1, art_emoji: '🌿', flavor_text: 'The slowest fish. The most determined.' },
  { name: 'Jellyfish',         type: 'creature', value:  0, art_emoji: '💙', flavor_text: 'Drifts aimlessly. No brain, no regrets.' },
  { name: 'Anglerfish',        type: 'creature', value: -2, art_emoji: '🎣', flavor_text: 'Lures with light, strikes in the dark.' },
  { name: 'Hagfish',           type: 'creature', value: -4, art_emoji: '😬', flavor_text: 'Produces slime when stressed. Extremely stressed.' },
  // --- ITEMS ---
  { name: 'Pearl',        type: 'item', operator: '+3', operator_value:  3, art_emoji: '💎', effect_text: 'Add +3 to one creature.', flavor_text: 'Hidden treasure, formed under pressure.' },
  { name: 'Treasure Chest', type: 'item', operator: '+5', operator_value:  5, art_emoji: '📦', effect_text: 'Add +5 to one creature.', flavor_text: 'Lost for centuries. Found at the right moment.' },
  { name: 'Coral Reef',   type: 'item', operator: '+2', operator_value:  2, art_emoji: '🪸', effect_text: 'Add +2 to one creature.', flavor_text: 'A whole ecosystem. Your creature gets the benefits.' },
  { name: 'Sea Shell',    type: 'item', operator: '+1', operator_value:  1, art_emoji: '🐚', effect_text: 'Add +1 to one creature.', flavor_text: 'Pick it up. Something good inside.' },
  { name: 'Anchor',       type: 'item', operator: '+1', operator_value:  1, art_emoji: '⚓', effect_text: 'Add +1 to one creature.', flavor_text: 'Holds things in place. Keeps things grounded.' },
  { name: 'Whirlpool',    type: 'item', operator: '-2', operator_value: -2, art_emoji: '🌀', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Pulls everything toward the center.' },
  { name: 'Shark Net',    type: 'item', operator: '-3', operator_value: -3, art_emoji: '🕸️', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Traps the unwary. Usually.' },
  { name: 'Sunken Ship',  type: 'item', operator: '+5', operator_value:  5, art_emoji: '🚢', effect_text: 'Add +5 to one creature.', flavor_text: 'More valuable at the bottom than it ever was afloat.' },
  // --- ACTIONS ---
  { name: 'Tidal Wave',        type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🌊', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Double the force. Double the damage.' },
  { name: 'Rip Current',       type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '💨', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Invisible. Irresistible. Five times as strong.' },
  { name: 'Deep Sea Pressure', type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '⬇️', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'At this depth, everything changes.' },
  { name: 'Low Tide',          type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '📉', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Pulls back what was given. The ocean reclaims.' },
  { name: 'Ocean Drift',       type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🌿', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Caught in the current, carried far from where it started.' },
  { name: 'Undertow',          type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '↩️', effect_text: "Flip one creature's value to its opposite.", flavor_text: "What rises must be dragged back down." },
  // --- EVENTS ---
  { name: 'Tsunami',              type: 'event', effect_type: 'zero_out', art_emoji: '🌊', effect_text: 'Zero Out: Set any one creature on the field to 0.', flavor_text: 'It wipes the slate. And the shoreline.' },
  { name: 'Bioluminescent Flash', type: 'event', effect_type: 'reverse',  art_emoji: '✨', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'The deep lights up. Everything inverts.' },
];

// Release 9 — Superheroes
const r9Cards = [
  // --- CREATURES ---
  { name: 'Superman',        type: 'creature', value: 10, art_emoji: '🦸', flavor_text: 'Faster than a speeding bullet. More powerful than a locomotive.' },
  { name: 'Wonder Woman',    type: 'creature', value:  9, art_emoji: '⭐', flavor_text: 'Warrior princess. Diplomat. The most dangerous combination.' },
  { name: 'Batman',          type: 'creature', value:  7, art_emoji: '🦇', flavor_text: 'No powers. No excuses. Just preparation and a very large budget.' },
  { name: 'Spider-Man',      type: 'creature', value:  6, art_emoji: '🕷️', flavor_text: 'With great power comes great responsibility. He has read the memo.' },
  { name: 'Thor',            type: 'creature', value:  5, art_emoji: '⚡', flavor_text: 'God of thunder. Carries a hammer. You do not need more context.' },
  { name: 'Iron Man',        type: 'creature', value:  5, art_emoji: '🤖', flavor_text: 'Genius, billionaire, philanthropist. He will remind you.' },
  { name: 'Green Lantern',   type: 'creature', value:  4, art_emoji: '💚', flavor_text: 'His ring can create anything willpower can imagine. He has excellent willpower.' },
  { name: 'Black Panther',   type: 'creature', value:  4, art_emoji: '🐈‍⬛', flavor_text: 'King of a nation, warrior by training, hero by choice.' },
  { name: 'Hulk',            type: 'creature', value:  3, art_emoji: '💚', flavor_text: 'The angrier he gets, the stronger he gets. This is relevant.' },
  { name: 'Flash',           type: 'creature', value:  2, art_emoji: '💨', flavor_text: 'Fastest person alive. Even his thoughts are running.' },
  { name: 'Aquaman',         type: 'creature', value:  1, art_emoji: '🌊', flavor_text: 'Talks to fish. Surprisingly effective.' },
  { name: 'Sidekick',        type: 'creature', value:  0, art_emoji: '👦', flavor_text: 'Always ready to help. Never quite ready for the main event.' },
  { name: 'Supervillain',    type: 'creature', value: -2, art_emoji: '😈', flavor_text: 'Has a plan. The plan involves everyone else losing.' },
  { name: 'Henchman',        type: 'creature', value: -4, art_emoji: '💀', flavor_text: 'Hired for the uniform. Not for the judgment.' },
  // --- ITEMS ---
  { name: 'Cape',               type: 'item', operator: '+3', operator_value:  3, art_emoji: '🦸‍♂️', effect_text: 'Add +3 to one creature.', flavor_text: 'Flowing symbol of heroism. Also surprisingly practical.' },
  { name: 'Power Stone',        type: 'item', operator: '+5', operator_value:  5, art_emoji: '💎', effect_text: 'Add +5 to one creature.', flavor_text: 'Small rock. Immeasurable consequence.' },
  { name: 'Utility Belt',       type: 'item', operator: '+2', operator_value:  2, art_emoji: '🔧', effect_text: 'Add +2 to one creature.', flavor_text: 'A pocket for every problem.' },
  { name: 'Web Shooter',        type: 'item', operator: '+1', operator_value:  1, art_emoji: '🕷️', effect_text: 'Add +1 to one creature.', flavor_text: 'Thwip. Simple. Effective.' },
  { name: 'Shield',             type: 'item', operator: '+1', operator_value:  1, art_emoji: '🛡️', effect_text: 'Add +1 to one creature.', flavor_text: 'Defense is offense in the right hands.' },
  { name: 'Kryptonite',         type: 'item', operator: '-3', operator_value: -3, art_emoji: '🟢', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Rare mineral. Devastating to exactly one person.' },
  { name: 'Mind Control Serum', type: 'item', operator: '-2', operator_value: -2, art_emoji: '🧪', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Takes control. Causes chaos.' },
  { name: 'Mutant Gene',        type: 'item', operator: '+5', operator_value:  5, art_emoji: '🧬', effect_text: 'Add +5 to one creature.', flavor_text: 'The X-gene activates. Something extraordinary happens next.' },
  // --- ACTIONS ---
  { name: 'Superhero Landing',         type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '💥', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'The dramatic pause. The crater. The boost.' },
  { name: 'Power Surge',               type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '⚡', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Energy beyond measure. For exactly one creature.' },
  { name: 'No Capes!',                 type: 'action', operator: '×(-10)', operator_value: -10,  art_emoji: '🧣', effect_text: "Multiply one creature's value by -10.", flavor_text: 'Edna Mode was right. The cape is a liability. Specifically, a negative-ten-times liability.' },
  { name: 'Civilian Rescue',           type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🏃', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Saving others costs something. Worth it, usually.' },
  { name: 'Villain Monologue',         type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '😈', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Gave the hero time to recover. Not recommended.' },
  { name: "Hero's Sacrifice",          type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '❤️', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Sometimes saving the day means the opposite of what you planned.' },
  // --- EVENTS ---
  { name: 'Villain Takeover', type: 'event', effect_type: 'banish', art_emoji: '🦹', effect_text: 'Banish: Remove any one creature from the field permanently.', flavor_text: 'The villain wins this round. The hero does not return.' },
  { name: 'Team-Up!',         type: 'event', effect_type: 'x100',   art_emoji: '🤝', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'Two heroes. One moment. The math gets out of hand fast.' },
];

// Release 10 — Stuffed Animals
const r10Cards = [
  // --- CREATURES ---
  { name: 'Giant Panda',     type: 'creature', value: 10, art_emoji: '🐼', flavor_text: 'Fluffy beyond measure. Cuddled beyond reason.' },
  { name: 'Panda Queen',     type: 'creature', value:  8, art_emoji: '🎀', flavor_text: 'Wears a bow. Rules the shelf with absolute authority.' },
  { name: 'Snow Bunny',      type: 'creature', value:  7, art_emoji: '🐇', flavor_text: 'White as fresh snow. Judging you from the pillow.' },
  { name: 'Floppy Panda',    type: 'creature', value:  6, art_emoji: '🐼', flavor_text: 'Falls sideways constantly. Still has dignity.' },
  { name: 'Velvet Bunny',    type: 'creature', value:  5, art_emoji: '🐰', flavor_text: 'Silky soft. Has survived seventeen wash cycles.' },
  { name: 'Panda Cub',       type: 'creature', value:  5, art_emoji: '🐾', flavor_text: 'Tiny, round, and inexplicably powerful.' },
  { name: 'Floppy Bunny',    type: 'creature', value:  4, art_emoji: '🐰', flavor_text: 'Ears too long for its body. Tripping hazard. Very loved.' },
  { name: 'Sock Monkey',     type: 'creature', value:  4, art_emoji: '🐒', flavor_text: 'Made from an old sock. Still the most beloved in the room.' },
  { name: 'Chubby Panda',    type: 'creature', value:  3, art_emoji: '🐼', flavor_text: 'Well-stuffed. Well-loved. Slightly asymmetrical.' },
  { name: 'Dreidel Plushie', type: 'creature', value:  2, art_emoji: '🌀', flavor_text: 'A spinning top in stuffed form. Spins occasionally. Mostly just sits there.' },
  { name: 'Green T-Rex',     type: 'creature', value:  1, art_emoji: '🦖', flavor_text: 'Technically a predator. Functionally a pillow.' },
  { name: 'Tiny Bunny',      type: 'creature', value:  0, art_emoji: '🐰', flavor_text: 'So small it is basically decorative.' },
  { name: 'Wonky Monkey',    type: 'creature', value: -2, art_emoji: '🙈', flavor_text: 'One eye slightly off. Unsettling at night.' },
  { name: 'Eyeless Bear',    type: 'creature', value: -4, art_emoji: '😶', flavor_text: 'Lost its eyes years ago. Nobody replaces them. It sees everything.' },
  // --- ITEMS ---
  { name: 'Stuffing Fluff', type: 'item', operator: '+3', operator_value:  3, art_emoji: '🌟', effect_text: 'Add +3 to one creature.', flavor_text: 'Fresh stuffing. Makes any stuffed animal feel new again.' },
  { name: 'Love Patch',     type: 'item', operator: '+5', operator_value:  5, art_emoji: '❤️', effect_text: 'Add +5 to one creature.', flavor_text: 'Sewn with care, given with love. It counts for something.' },
  { name: 'Button Eye',     type: 'item', operator: '+2', operator_value:  2, art_emoji: '🔘', effect_text: 'Add +2 to one creature.', flavor_text: 'A new eye. The staring resumes immediately.' },
  { name: 'Satin Ribbon',   type: 'item', operator: '+1', operator_value:  1, art_emoji: '🎀', effect_text: 'Add +1 to one creature.', flavor_text: 'Tied just right. Looks precious. Is precious.' },
  { name: 'Bow Tie',        type: 'item', operator: '+1', operator_value:  1, art_emoji: '🎗️', effect_text: 'Add +1 to one creature.', flavor_text: 'Instantly adds sophistication. Even to pandas.' },
  { name: 'Lost Stuffing',  type: 'item', operator: '-2', operator_value: -2, art_emoji: '😔', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Somewhere between the couch cushions.' },
  { name: 'Ripped Seam',    type: 'item', operator: '-3', operator_value: -3, art_emoji: '🪡', effect_text: 'Subtract 3 from one creature.', flavor_text: 'One too many hugs.' },
  { name: 'Giant Hug',      type: 'item', operator: '+5', operator_value:  5, art_emoji: '🫂', effect_text: 'Add +5 to one creature.', flavor_text: 'The ultimate stuffed animal power source.' },
  // --- ACTIONS ---
  { name: 'Bear Hug',           type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🫂', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Squeezed twice as tight. Twice as effective.' },
  { name: 'Cuddle Storm',       type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '💕', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'A pile of stuffed animals. Five times the comfort.' },
  { name: 'Plushie Parade',     type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🎉', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Every stuffed animal in the house. All at once.' },
  { name: 'Flat Deflation',     type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '😮‍💨', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Sat on one too many times.' },
  { name: 'Lost in the Toy Box',type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '📦', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Forgotten. Buried. One fifth as relevant.' },
  { name: 'Naughty Dog Attack', type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🐕', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'The dog got to it. Now everything is wrong.' },
  // --- EVENTS ---
  { name: 'Toy Box Mirror', type: 'event', effect_type: 'mirror', art_emoji: '🪞', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'Everything in the toy box starts to look the same.' },
  { name: 'The Great Swap',  type: 'event', effect_type: 'swap',   art_emoji: '🔄', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'Traded across the room. New home, same cuddles.' },
];

// Release 11 — Art
const r11Cards = [
  // --- CREATURES ---
  { name: 'Leonardo da Vinci', type: 'creature', value: 10, art_emoji: '📐', flavor_text: 'Painter, sculptor, architect, scientist. Did it all first.' },
  { name: 'Michelangelo',      type: 'creature', value:  9, art_emoji: '✏️', flavor_text: 'Spent four years looking up. Worth it.' },
  { name: 'Picasso',           type: 'creature', value:  7, art_emoji: '🎨', flavor_text: 'Invented a new way to see. Not everyone understood.' },
  { name: 'Frida Kahlo',       type: 'creature', value:  6, art_emoji: '🌸', flavor_text: 'Painted her pain into power. Unmatched.' },
  { name: 'Rembrandt',         type: 'creature', value:  6, art_emoji: '🕯️', flavor_text: 'Master of light and shadow. Mostly shadow.' },
  { name: 'Vincent van Gogh',  type: 'creature', value:  5, art_emoji: '🌻', flavor_text: 'Felt everything. Painted all of it.' },
  { name: 'Claude Monet',      type: 'creature', value:  4, art_emoji: '🌊', flavor_text: 'Painted water hundreds of times. Never the same twice.' },
  { name: 'Salvador Dalí',     type: 'creature', value:  4, art_emoji: '🕐', flavor_text: 'The clocks are melting. He planned that.' },
  { name: "Georgia O'Keeffe",  type: 'creature', value:  3, art_emoji: '🌺', flavor_text: 'Made the desert bloom on canvas.' },
  { name: 'Andy Warhol',       type: 'creature', value:  3, art_emoji: '🍅', flavor_text: 'Fifteen minutes of fame, infinite reprints.' },
  { name: 'Jackson Pollock',   type: 'creature', value:  2, art_emoji: '💦', flavor_text: 'Threw paint. Called it genius. It was.' },
  { name: 'Bob Ross',          type: 'creature', value:  0, art_emoji: '🌲', flavor_text: 'Happy little trees. Happy little zero.' },
  { name: 'Art Critic',        type: 'creature', value: -2, art_emoji: '📰', flavor_text: 'Has never made anything. Very confident about everything.' },
  { name: 'Forgery Artist',    type: 'creature', value: -4, art_emoji: '🖼️', flavor_text: 'Technically skilled. Morally flexible.' },
  // --- ITEMS ---
  { name: 'Oil Paints',        type: 'item', operator: '+3', operator_value:  3, art_emoji: '🖌️', effect_text: 'Add +3 to one creature.', flavor_text: 'The medium of the masters. Slow to dry, fast to impress.' },
  { name: 'Golden Frame',      type: 'item', operator: '+5', operator_value:  5, art_emoji: '🖼️', effect_text: 'Add +5 to one creature.', flavor_text: 'The frame that turns anything into art.' },
  { name: 'Canvas',            type: 'item', operator: '+2', operator_value:  2, art_emoji: '🟫', effect_text: 'Add +2 to one creature.', flavor_text: 'A blank surface, full of possibility.' },
  { name: 'Fine Brush',        type: 'item', operator: '+1', operator_value:  1, art_emoji: '🖌️', effect_text: 'Add +1 to one creature.', flavor_text: 'A single hair wide. Significant.' },
  { name: 'Sketch Pad',        type: 'item', operator: '+1', operator_value:  1, art_emoji: '📓', effect_text: 'Add +1 to one creature.', flavor_text: 'Where every masterpiece starts.' },
  { name: 'Spilled Paint',     type: 'item', operator: '-2', operator_value: -2, art_emoji: '💧', effect_text: 'Subtract 2 from one creature.', flavor_text: 'An accident with permanent consequences.' },
  { name: 'Forged Signature',  type: 'item', operator: '-3', operator_value: -3, art_emoji: '✒️', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Looks right. Isn\'t.' },
  { name: 'Museum Spotlight',  type: 'item', operator: '+5', operator_value:  5, art_emoji: '💡', effect_text: 'Add +5 to one creature.', flavor_text: 'Center stage in the greatest gallery. Value increases accordingly.' },
  // --- ACTIONS ---
  { name: 'Master Stroke',      type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🖌️', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'One perfect stroke. Everything doubles.' },
  { name: 'Gallery Opening',    type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🏛️', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'The crowd arrives. The value skyrockets.' },
  { name: 'Masterpiece',        type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🌟', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Once in a generation. Ten times anything you\'ve seen.' },
  { name: 'Art Critique',       type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '😐', effect_text: "Divide one creature's value by 2.",    flavor_text: 'The review was... mixed.' },
  { name: 'Restoration',        type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🔍', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Careful work to fix what time has worn down.' },
  { name: 'Artistic Rebellion', type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Breaks every rule. The value flips with them.' },
  // --- EVENTS ---
  { name: 'Forgery Revealed', type: 'event', effect_type: 'square', art_emoji: '🖼️', effect_text: "x²: Square one creature's current value.", flavor_text: 'When the real thing is revealed, the value multiplies exponentially.' },
  { name: 'Art Heist',        type: 'event', effect_type: 'banish', art_emoji: '🦹', effect_text: 'Banish: Remove any one creature from the field permanently.', flavor_text: 'Gone overnight. Never recovered.' },
];

// Release 12 — Pets
const r12Cards = [
  // --- CREATURES ---
  { name: 'Golden Retriever', type: 'creature', value: 10, art_emoji: '🐕',    flavor_text: 'Perfect. Just genuinely perfect.' },
  { name: 'Persian Cat',      type: 'creature', value:  9, art_emoji: '🐈',    flavor_text: 'Elegant. Judgmental. Beautiful.' },
  { name: 'Parrot',           type: 'creature', value:  7, art_emoji: '🦜',    flavor_text: 'Repeats everything. Understands more than you think.' },
  { name: 'Labrador',         type: 'creature', value:  6, art_emoji: '🐕‍🦺', flavor_text: 'Will love you unconditionally. Will also eat your socks.' },
  { name: 'Tabby Cat',        type: 'creature', value:  5, art_emoji: '🐈',    flavor_text: 'Independent. Affectionate when it decides to be.' },
  { name: 'Rabbit',           type: 'creature', value:  5, art_emoji: '🐇',    flavor_text: 'Soft ears, surprising speed, very strong opinions about food.' },
  { name: 'Hamster',          type: 'creature', value:  4, art_emoji: '🐹',    flavor_text: 'Small creature, enormous energy. Runs all night.' },
  { name: 'Guinea Pig',       type: 'creature', value:  4, art_emoji: '🐾',    flavor_text: 'Wheeks and warmth. Always happy to see you.' },
  { name: 'Goldfish',         type: 'creature', value:  3, art_emoji: '🐟',    flavor_text: 'Allegedly three-second memory. Allegedly.' },
  { name: 'Turtle',           type: 'creature', value:  2, art_emoji: '🐢',    flavor_text: 'Thirty years, same tank, same patient expression.' },
  { name: 'Hermit Crab',      type: 'creature', value:  1, art_emoji: '🦀',    flavor_text: 'Found a shell it likes. Is not sharing.' },
  { name: 'Chameleon',        type: 'creature', value:  0, art_emoji: '🦎',    flavor_text: 'Adapts completely. Contributes neutrally.' },
  { name: 'Mean Cat',         type: 'creature', value: -2, art_emoji: '😾',    flavor_text: 'Does not enjoy being pet. Will remain in your home anyway.' },
  { name: 'Biting Parrot',    type: 'creature', value: -4, art_emoji: '🦜',    flavor_text: 'Speaks three languages. All of them angry.' },
  // --- ITEMS ---
  { name: 'Pet Treats',         type: 'item', operator: '+3', operator_value:  3, art_emoji: '🦴', effect_text: 'Add +3 to one creature.', flavor_text: 'Good behavior rewarded. Immediately.' },
  { name: 'Premium Pet Food',   type: 'item', operator: '+5', operator_value:  5, art_emoji: '🥩', effect_text: 'Add +5 to one creature.', flavor_text: 'The expensive kind. Worth every bite.' },
  { name: 'Grooming Kit',       type: 'item', operator: '+2', operator_value:  2, art_emoji: '✂️', effect_text: 'Add +2 to one creature.', flavor_text: 'Brushed to perfection.' },
  { name: 'Toy Ball',           type: 'item', operator: '+1', operator_value:  1, art_emoji: '⚽', effect_text: 'Add +1 to one creature.', flavor_text: 'Endless joy from a rubber sphere.' },
  { name: 'Collar',             type: 'item', operator: '+1', operator_value:  1, art_emoji: '🔔', effect_text: 'Add +1 to one creature.', flavor_text: 'Official. Engraved. Very dignified.' },
  { name: 'Vet Bill',           type: 'item', operator: '-2', operator_value: -2, art_emoji: '💉', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Necessary. Expensive. Both.' },
  { name: 'Flea Infestation',   type: 'item', operator: '-3', operator_value: -3, art_emoji: '🦟', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Guests that nobody invited.' },
  { name: 'Best in Show Trophy',type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏆', effect_text: 'Add +5 to one creature.', flavor_text: 'The ultimate validation. Your pet knows it.' },
  // --- ACTIONS ---
  { name: 'Walkies',           type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🦮', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Out the door and twice as energetic.' },
  { name: 'Dog Show',          type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🏆', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Groomed, trained, and five times as impressive.' },
  { name: 'Best in Show',      type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🌟', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The judges have reached a unanimous decision.' },
  { name: 'Nap Time',          type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '💤', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Asleep on the couch. Half as useful.' },
  { name: 'Timeout',           type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '⏱️', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Sent to the corner. Significantly less effective.' },
  { name: 'Zoomies Gone Wrong',type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '💨', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Ran in the wrong direction. Completely inverted the outcome.' },
  // --- EVENTS ---
  { name: 'Vet Emergency',   type: 'event', effect_type: 'zero_out', art_emoji: '🏥', effect_text: 'Zero Out: Set any one creature on the field to 0.', flavor_text: 'Everything stops until the vet weighs in.' },
  { name: 'Litter Mirroring',type: 'event', effect_type: 'mirror',   art_emoji: '🪞', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'Same breed, same value. The litter has spoken.' },
];

// Release 13 — Judaism
const r13Cards = [
  // --- CREATURES ---
  { name: 'Judah Maccabee',    type: 'creature', value: 10, art_emoji: '⚔️', flavor_text: 'Led the revolt against impossible odds. Won.' },
  { name: 'Queen Esther',      type: 'creature', value:  9, art_emoji: '👑', flavor_text: 'Saved her people with wit and courage. The villain never saw it coming.' },
  { name: 'King Solomon',      type: 'creature', value:  7, art_emoji: '📜', flavor_text: 'Wisest ruler in history. The judgment was real.' },
  { name: 'Elijah the Prophet',type: 'creature', value:  6, art_emoji: '🕊️', flavor_text: 'Appears at every Passover seder. Never RSVPs.' },
  { name: 'Rabbi',             type: 'creature', value:  6, art_emoji: '📖', flavor_text: 'Asks ten questions to answer one. Still faster than most.' },
  { name: 'Golem',             type: 'creature', value:  5, art_emoji: '🗿', flavor_text: 'Clay given life to protect the community. Takes orders literally.' },
  { name: 'Maccabee Warrior',  type: 'creature', value:  4, art_emoji: '🔥', flavor_text: 'Fought with no reinforcements. Won with a miracle.' },
  { name: 'Cantor',            type: 'creature', value:  4, art_emoji: '🎶', flavor_text: 'Sings the ancient words. The congregation follows every note.' },
  { name: 'Bubbe',             type: 'creature', value:  3, art_emoji: '👵', flavor_text: 'Feeds everyone, fixes everything, forgets nothing you have done.' },
  { name: 'Yeshiva Student',   type: 'creature', value:  2, art_emoji: '📚', flavor_text: 'Has opinions on everything. All of them footnoted.' },
  { name: 'Dreidel Player',    type: 'creature', value:  1, art_emoji: '🌀', flavor_text: 'Spins the top. Hopes for gimel.' },
  { name: 'Wandering Scholar', type: 'creature', value:  0, art_emoji: '🏜️', flavor_text: 'Forty years in the desert. Found nothing. Lost nothing.' },
  { name: 'Pharaoh',           type: 'creature', value: -2, art_emoji: '👑', flavor_text: 'Refused ten times. Regretted it immediately.' },
  { name: 'Haman',             type: 'creature', value: -4, art_emoji: '🪢', flavor_text: 'The villain of Purim. Things did not end well for him.' },
  // --- ITEMS ---
  { name: 'Menorah',              type: 'item', operator: '+3', operator_value:  3, art_emoji: '🕎', effect_text: 'Add +3 to one creature.', flavor_text: 'Eight nights of increasing light.' },
  { name: 'Torah Scroll',         type: 'item', operator: '+5', operator_value:  5, art_emoji: '📜', effect_text: 'Add +5 to one creature.', flavor_text: 'Thousands of years of wisdom. Still relevant.' },
  { name: 'Matzah',               type: 'item', operator: '+2', operator_value:  2, art_emoji: '🫓', effect_text: 'Add +2 to one creature.', flavor_text: 'Unleavened and surprisingly satisfying.' },
  { name: 'Kiddush Cup',          type: 'item', operator: '+1', operator_value:  1, art_emoji: '🍷', effect_text: 'Add +1 to one creature.', flavor_text: 'Blessed and filled. The Shabbat begins.' },
  { name: 'Dreidel',              type: 'item', operator: '+1', operator_value:  1, art_emoji: '🌀', effect_text: 'Add +1 to one creature.', flavor_text: 'Gimel takes all. This is gimel.' },
  { name: 'Bitter Herbs',         type: 'item', operator: '-2', operator_value: -2, art_emoji: '🌿', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Tastes like history. Specifically the bad parts.' },
  { name: "Haman's Decree",       type: 'item', operator: '-3', operator_value: -3, art_emoji: '📜', effect_text: 'Subtract 3 from one creature.', flavor_text: 'An official order to make things worse.' },
  { name: 'Star of David Amulet', type: 'item', operator: '+5', operator_value:  5, art_emoji: '✡️', effect_text: 'Add +5 to one creature.', flavor_text: 'Ancient symbol, powerful protection.' },
  // --- ACTIONS ---
  { name: 'Miracle of Hanukkah',   type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🕎', effect_text: "Multiply one creature's value by 2.",   flavor_text: "One day's oil. Eight days of light." },
  { name: 'Parting of the Sea',    type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🌊', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Impossible made possible. On schedule.' },
  { name: 'Ten Plagues',           type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🦟', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The tenth was the worst. This is the tenth.' },
  { name: 'Forty Years in the Desert', type: 'action', operator: '÷2', operator_value: 0.5, art_emoji: '🏜️', effect_text: "Divide one creature's value by 2.", flavor_text: 'A long journey that accomplished exactly half as much.' },
  { name: 'Diaspora',              type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🗺️', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Scattered across the world. Still five times smaller.' },
  { name: 'An Eye for an Eye',     type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '⚖️', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'The ancient law inverts what was given.' },
  // --- EVENTS ---
  { name: 'Exodus',        type: 'event', effect_type: 'reverse', art_emoji: '🌊', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'Liberation reverses everything the oppressors built.' },
  { name: 'Burning Bush',  type: 'event', effect_type: 'x100',   art_emoji: '🔥', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'The divine message was unmistakable. So is this.' },
];

// Release 14 — Pottery
const r14Cards = [
  // --- CREATURES ---
  { name: 'Master Potter',      type: 'creature', value: 10, art_emoji: '🏺', flavor_text: 'Sixty years at the wheel. Every piece is alive.' },
  { name: 'Clay Sculptor',      type: 'creature', value:  9, art_emoji: '🧱', flavor_text: 'Turns raw earth into something that outlasts everything.' },
  { name: 'Kiln Master',        type: 'creature', value:  7, art_emoji: '🔥', flavor_text: 'Controls the fire. Knows what comes out the other side.' },
  { name: 'Glaze Artist',       type: 'creature', value:  6, art_emoji: '🎨', flavor_text: 'Color and chemistry. Nobody else sees what they see.' },
  { name: 'Wheel Spinner',      type: 'creature', value:  5, art_emoji: '🌀', flavor_text: 'Centered. Focused. Never stops moving.' },
  { name: 'Apprentice',         type: 'creature', value:  5, art_emoji: '👷', flavor_text: 'Two years in and already making things worth keeping.' },
  { name: 'Ceramics Teacher',   type: 'creature', value:  4, art_emoji: '📚', flavor_text: 'Made ten thousand bowls. Taught a thousand students.' },
  { name: 'Tile Maker',         type: 'creature', value:  4, art_emoji: '🔲', flavor_text: 'Precision, pattern, permanence. Every tile fits.' },
  { name: 'Bowl Crafter',       type: 'creature', value:  3, art_emoji: '🥣', flavor_text: 'Functional art. Used daily. Loved more.' },
  { name: 'Beginner Student',   type: 'creature', value:  2, art_emoji: '😅', flavor_text: 'First day at the wheel. It is lopsided. They are proud.' },
  { name: 'Art Class Tourist',  type: 'creature', value:  1, art_emoji: '📸', flavor_text: 'There for the experience. Took many photos.' },
  { name: 'Overfired Vase',     type: 'creature', value:  0, art_emoji: '😬', flavor_text: 'Technically survived the kiln. Technically.' },
  { name: 'Cracked Mug',        type: 'creature', value: -2, art_emoji: '☕', flavor_text: 'Structurally compromised. Still used every morning.' },
  { name: 'Collapsed Pot',      type: 'creature', value: -4, art_emoji: '💔', flavor_text: 'It was going so well. Then the center gave.' },
  // --- ITEMS ---
  { name: 'Special Clay',      type: 'item', operator: '+3', operator_value:  3, art_emoji: '🟫', effect_text: 'Add +3 to one creature.', flavor_text: 'Found near a river with unique mineral properties.' },
  { name: 'High-Temp Kiln',    type: 'item', operator: '+5', operator_value:  5, art_emoji: '🔥', effect_text: 'Add +5 to one creature.', flavor_text: 'Reaches temperatures that transform everything.' },
  { name: 'Glaze Set',         type: 'item', operator: '+2', operator_value:  2, art_emoji: '🎨', effect_text: 'Add +2 to one creature.', flavor_text: 'Colors that do not exist until the firing.' },
  { name: 'Loop Tool',         type: 'item', operator: '+1', operator_value:  1, art_emoji: '🔧', effect_text: 'Add +1 to one creature.', flavor_text: 'Small instrument. Precise results.' },
  { name: 'Water Bowl',        type: 'item', operator: '+1', operator_value:  1, art_emoji: '💧', effect_text: 'Add +1 to one creature.', flavor_text: "The potter's constant companion. Keeps everything workable." },
  { name: 'Air Bubble',        type: 'item', operator: '-2', operator_value: -2, art_emoji: '😮‍💨', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Hidden inside. Explodes in the kiln.' },
  { name: 'Rough Grit',        type: 'item', operator: '-3', operator_value: -3, art_emoji: '💥', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Wrong clay for the wheel. Nothing holds.' },
  { name: 'Perfect Porcelain', type: 'item', operator: '+5', operator_value:  5, art_emoji: '⚪', effect_text: 'Add +5 to one creature.', flavor_text: 'The finest material. Cool, white, commanding a premium.' },
  // --- ACTIONS ---
  { name: 'Double Throw',   type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🌀', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Back to the wheel. Twice as good this time.' },
  { name: 'Glaze and Fire', type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🔥', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Into the kiln. Out transformed.' },
  { name: 'Masterwork',     type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '✨', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Once in a career. Perfect in every way.' },
  { name: 'Centering Fail', type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '😬', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Uncentered from the start. Recovers at half value.' },
  { name: 'Kiln Collapse',  type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '💔', effect_text: "Divide one creature's value by 5.",    flavor_text: 'The shelves buckled. Most things did not survive.' },
  { name: 'Return to Clay', type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Back to the beginning. Everything inverted.' },
  // --- EVENTS ---
  { name: 'Kiln Explosion',      type: 'event', effect_type: 'banish', art_emoji: '💥', effect_text: 'Banish: Remove any one creature from the field permanently.', flavor_text: 'The kiln door opened too soon. One piece did not survive.' },
  { name: "Potter's Wheel Swap", type: 'event', effect_type: 'swap',   art_emoji: '🌀', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'The wheel turned. Everything ended up somewhere unexpected.' },
];

// Release 15 — Summer Camp
const r15Cards = [
  // --- CREATURES ---
  { name: 'Head Counselor',        type: 'creature', value: 10, art_emoji: '⛺', flavor_text: 'Knows every camper by name. Has a solution for every crisis.' },
  { name: 'Star Camper',           type: 'creature', value:  9, art_emoji: '⭐', flavor_text: 'Won every award, made every friend, still writes letters.' },
  { name: 'Arts and Crafts Leader',type: 'creature', value:  7, art_emoji: '🎨', flavor_text: 'Knows seventeen uses for a pipe cleaner. Uses sixteen of them daily.' },
  { name: 'Swimming Champ',        type: 'creature', value:  6, art_emoji: '🏊', flavor_text: 'First in the water. Last out. Always smiling.' },
  { name: 'Archery Expert',        type: 'creature', value:  5, art_emoji: '🏹', flavor_text: 'Bullseye twelve times in a row. Loses count after that.' },
  { name: 'Nature Guide',          type: 'creature', value:  5, art_emoji: '🌿', flavor_text: 'Knows every bird, every track, every cloud.' },
  { name: 'Camp Chef',             type: 'creature', value:  4, art_emoji: '🍳', flavor_text: 'Feeds two hundred kids three times a day. Deserves more credit.' },
  { name: 'Ropes Course Champion', type: 'creature', value:  4, art_emoji: '🧗', flavor_text: 'Forty feet up, calm as anything.' },
  { name: 'Campfire Singer',       type: 'creature', value:  3, art_emoji: '🎵', flavor_text: 'Knows every verse of every camp song. Including the ones everyone forgot.' },
  { name: 'First-Timer Camper',    type: 'creature', value:  2, art_emoji: '😊', flavor_text: 'Nervous on day one. Best summer of their life by day three.' },
  { name: 'Shy New Kid',           type: 'creature', value:  1, art_emoji: '😳', flavor_text: 'Quiet at first. Secretly the most interesting person at camp.' },
  { name: 'Homesick Camper',       type: 'creature', value:  0, art_emoji: '😢', flavor_text: 'Misses home. Stays anyway. That counts for something.' },
  { name: 'Bunkmate Who Snores',   type: 'creature', value: -2, art_emoji: '😴', flavor_text: 'Audible from three cabins away. Completely unaware.' },
  { name: 'Camp Bully',            type: 'creature', value: -4, art_emoji: '😡', flavor_text: 'Takes more than their fair share of everything, including the fun.' },
  // --- ITEMS ---
  { name: 'Bug Spray',          type: 'item', operator: '+3', operator_value:  3, art_emoji: '🦟', effect_text: 'Add +3 to one creature.', flavor_text: 'Keeps the worst of camp at bay.' },
  { name: 'Canteen',            type: 'item', operator: '+5', operator_value:  5, art_emoji: '🧃', effect_text: 'Add +5 to one creature.', flavor_text: 'Full and cold. The most valuable object at camp.' },
  { name: 'Friendship Bracelet',type: 'item', operator: '+2', operator_value:  2, art_emoji: '🫂', effect_text: 'Add +2 to one creature.', flavor_text: 'Made at arts and crafts. Given with sincerity. Worn forever.' },
  { name: 'Sunscreen',          type: 'item', operator: '+1', operator_value:  1, art_emoji: '☀️', effect_text: 'Add +1 to one creature.', flavor_text: 'Applied reluctantly. Valued retroactively.' },
  { name: 'Flashlight',         type: 'item', operator: '+1', operator_value:  1, art_emoji: '🔦', effect_text: 'Add +1 to one creature.', flavor_text: 'Essential for cabin raids. Essential for ghost stories.' },
  { name: 'Poison Ivy',         type: 'item', operator: '-2', operator_value: -2, art_emoji: '🌿', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Learned about after the fact, unfortunately.' },
  { name: 'Broken Canoe',       type: 'item', operator: '-3', operator_value: -3, art_emoji: '🛶', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Found this out in the middle of the lake.' },
  { name: 'Color War Trophy',   type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏆', effect_text: 'Add +5 to one creature.', flavor_text: 'Every point of every color war, concentrated.' },
  // --- ACTIONS ---
  { name: 'Capture the Flag', type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🚩', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Flag secured. Points doubled. Victory imminent.' },
  { name: 'Color War',        type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🎨', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Two sides. One winner. Five times the stakes.' },
  { name: 'Camp Olympics',    type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🏅', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Every event. Every camper. Legendary.' },
  { name: 'Rest Hour',        type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '💤', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Mandatory quiet time. Everything slows.' },
  { name: 'Rainy Day',        type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🌧️', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Indoor activities only. Energy dispersed to one fifth.' },
  { name: 'Prank War',        type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '😈', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'The prankee becomes the prankster. Everything inverts.' },
  // --- EVENTS ---
  { name: 'Late Night Cabin Visit', type: 'event', effect_type: 'mirror',   art_emoji: '🌙', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'Secrets shared after lights-out spread everywhere.' },
  { name: 'Zero Tolerance Policy', type: 'event', effect_type: 'zero_out', art_emoji: '📢', effect_text: 'Zero Out: Set any one creature on the field to 0.', flavor_text: 'The director has spoken. That creature is done for the day.' },
];

// Release 16 — Family Vacations
const r16Cards = [
  // --- CREATURES ---
  { name: 'Dad with GPS',        type: 'creature', value: 10, art_emoji: '🗺️', flavor_text: 'Has the route memorized. Will not admit he took a wrong turn.' },
  { name: 'Frequent Flyer Mom',  type: 'creature', value:  9, art_emoji: '✈️', flavor_text: 'TSA PreCheck. Platinum status. Born to travel.' },
  { name: 'Adventurous Teen',    type: 'creature', value:  7, art_emoji: '🧗', flavor_text: 'Found a cliff to jump off within twenty minutes. No regrets.' },
  { name: 'Local Guide',         type: 'creature', value:  6, art_emoji: '🗣️', flavor_text: 'Actually from here. Knows the real restaurants. Trust them.' },
  { name: 'Hotel Concierge',     type: 'creature', value:  5, art_emoji: '🏨', flavor_text: 'Has seen everything. Can solve anything. For a tip.' },
  { name: 'Patient Grandma',     type: 'creature', value:  5, art_emoji: '👵', flavor_text: 'Been on every family trip. Remembers every detail.' },
  { name: 'Travel Photographer', type: 'creature', value:  4, art_emoji: '📸', flavor_text: 'Still photographing the meal. Everyone else is eating.' },
  { name: 'Overpacking Uncle',   type: 'creature', value:  4, art_emoji: '🧳', flavor_text: 'Brought five suitcases for three days. Has everything you forgot.' },
  { name: 'Car Sick Kid',        type: 'creature', value:  3, art_emoji: '🤢', flavor_text: 'Valiantly trying. Not succeeding.' },
  { name: 'Bored Little Sibling',type: 'creature', value:  2, art_emoji: '😐', flavor_text: "Staring out the window. Has asked 'are we there yet' eleven times." },
  { name: 'New Driver',          type: 'creature', value:  1, art_emoji: '😬', flavor_text: 'First road trip. Second thoughts.' },
  { name: 'Lost Luggage',        type: 'creature', value:  0, art_emoji: '😱', flavor_text: 'Somewhere between here and there. Likely there.' },
  { name: 'Crying Baby',         type: 'creature', value: -2, art_emoji: '👶', flavor_text: 'First international flight. Not impressed.' },
  { name: 'Security Delay',      type: 'creature', value: -4, art_emoji: '🛂', flavor_text: 'Flagged for a random check. Third time this trip.' },
  // --- ITEMS ---
  { name: 'Travel Pillow',           type: 'item', operator: '+3', operator_value:  3, art_emoji: '💤', effect_text: 'Add +3 to one creature.', flavor_text: 'The difference between arriving rested and arriving broken.' },
  { name: 'First Class Upgrade',     type: 'item', operator: '+5', operator_value:  5, art_emoji: '🛫', effect_text: 'Add +5 to one creature.', flavor_text: 'Champagne before takeoff. Everything is better up front.' },
  { name: 'Snack Pack',              type: 'item', operator: '+2', operator_value:  2, art_emoji: '🍫', effect_text: 'Add +2 to one creature.', flavor_text: 'Packed with love. Consumed in ten minutes.' },
  { name: 'Sunglasses',              type: 'item', operator: '+1', operator_value:  1, art_emoji: '😎', effect_text: 'Add +1 to one creature.', flavor_text: 'Vacation begins the moment these go on.' },
  { name: 'Good Book',               type: 'item', operator: '+1', operator_value:  1, art_emoji: '📖', effect_text: 'Add +1 to one creature.', flavor_text: 'Three hours until landing. Zero boredom.' },
  { name: 'Missed Connection',       type: 'item', operator: '-2', operator_value: -2, art_emoji: '⏰', effect_text: 'Subtract 2 from one creature.', flavor_text: 'So close. Now five hours in the terminal.' },
  { name: 'Rain on Beach Day',       type: 'item', operator: '-3', operator_value: -3, art_emoji: '🌧️', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Checked the forecast. Trusted it. Made an error.' },
  { name: 'All-Inclusive Wristband', type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏨', effect_text: 'Add +5 to one creature.', flavor_text: 'Everything included. Unlimited everything.' },
  // --- ACTIONS ---
  { name: 'Road Trip Playlist', type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🎵', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'The right song at the right mile. Everything doubles.' },
  { name: 'Theme Park Day',     type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🎢', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Every ride, every snack, every photo. Five times the joy.' },
  { name: 'Dream Vacation',     type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🌴', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The trip you planned for years. Everything exceeded.' },
  { name: 'Jet Lag',            type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '😵', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Three time zones off. Functioning at half capacity.' },
  { name: 'Lost Passport',      type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '😰', effect_text: "Divide one creature's value by 5.",    flavor_text: 'The vacation now costs one fifth as much as the replacement.' },
  { name: 'Wrong Hotel Room',   type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🏨', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Room 403, not 304. Nothing is where it should be.' },
  // --- EVENTS ---
  { name: 'Perfect Vacation Day',type: 'event', effect_type: 'x100',   art_emoji: '🌅', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'When everything goes right, the memories last a hundred times longer.' },
  { name: 'Vacation Disaster',   type: 'event', effect_type: 'reverse', art_emoji: '🌋', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'Volcanic eruption at the resort. Positive and negative completely reversed.' },
];

// Release 17 — Dogs
const r17Cards = [
  // --- CREATURES ---
  { name: 'Border Collie',          type: 'creature', value: 10, art_emoji: '🐕‍🦺', flavor_text: 'The Einstein of dogs. Herds sheep, solves problems, judges you.' },
  { name: 'German Shepherd',        type: 'creature', value:  9, art_emoji: '🦮',    flavor_text: 'Police dog, guide dog, best dog. Professionals, all of them.' },
  { name: 'Malinois',               type: 'creature', value:  7, art_emoji: '🐕',    flavor_text: 'Military working dog. More trained than most people.' },
  { name: 'Husky',                  type: 'creature', value:  6, art_emoji: '🐺',    flavor_text: 'Built for the Arctic. Vocal about all opinions.' },
  { name: 'Great Dane',             type: 'creature', value:  5, art_emoji: '🦴',    flavor_text: 'Largest lap dog in existence. Does not know this.' },
  { name: 'Poodle',                 type: 'creature', value:  5, art_emoji: '🐩',    flavor_text: 'Smartest breed. Classiest. The haircut was practical once.' },
  { name: 'Beagle',                 type: 'creature', value:  4, art_emoji: '🐶',    flavor_text: 'Follows its nose everywhere. Has gotten lost twice this week.' },
  { name: 'Labrador',               type: 'creature', value:  4, art_emoji: '🦮',    flavor_text: 'Eats everything. Forgives everyone. Beloved.' },
  { name: 'Corgi',                  type: 'creature', value:  3, art_emoji: '👑',    flavor_text: 'Royal dog. Low to the ground, high in confidence.' },
  { name: 'Dachshund',              type: 'creature', value:  2, art_emoji: '🌭',    flavor_text: 'Long body, short legs, enormous attitude.' },
  { name: 'Chihuahua',              type: 'creature', value:  1, art_emoji: '😤',    flavor_text: 'Five pounds. Thinks it is fifty. Correct in spirit.' },
  { name: 'Bad Puppy',              type: 'creature', value:  0, art_emoji: '🐾',    flavor_text: 'Chewed the remote. Staring at you. Waiting for a reaction.' },
  { name: 'Aggressive Pomeranian',  type: 'creature', value: -2, art_emoji: '😠',    flavor_text: 'Fluffy on the outside. Not on the inside.' },
  { name: 'Shoe Chewer',            type: 'creature', value: -4, art_emoji: '👟',    flavor_text: 'Found your favorite shoes. Left evidence. Left the scene.' },
  // --- ITEMS ---
  { name: 'Squeaky Toy',      type: 'item', operator: '+3', operator_value:  3, art_emoji: '🎾', effect_text: 'Add +3 to one creature.', flavor_text: 'The squeak activates something ancient.' },
  { name: 'Premium Dog Food', type: 'item', operator: '+5', operator_value:  5, art_emoji: '🥩', effect_text: 'Add +5 to one creature.', flavor_text: 'The good stuff. They can tell.' },
  { name: 'Tennis Ball',      type: 'item', operator: '+2', operator_value:  2, art_emoji: '🎾', effect_text: 'Add +2 to one creature.', flavor_text: 'Favorite object. Has survived three years.' },
  { name: 'Leash',            type: 'item', operator: '+1', operator_value:  1, art_emoji: '🔗', effect_text: 'Add +1 to one creature.', flavor_text: 'Walk time. Best time.' },
  { name: 'Dog Biscuit',      type: 'item', operator: '+1', operator_value:  1, art_emoji: '🦴', effect_text: 'Add +1 to one creature.', flavor_text: 'Small reward. Immediate loyalty.' },
  { name: 'Muddy Paws',       type: 'item', operator: '-2', operator_value: -2, art_emoji: '🐾', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Just cleaned the floors. Timed perfectly.' },
  { name: 'Chewed Furniture', type: 'item', operator: '-3', operator_value: -3, art_emoji: '🪑', effect_text: 'Subtract 3 from one creature.', flavor_text: 'The couch leg. Specifically the couch leg.' },
  { name: 'Champion Ribbon',  type: 'item', operator: '+5', operator_value:  5, art_emoji: '🎀', effect_text: 'Add +5 to one creature.', flavor_text: "Judge's highest score. Every year without fail." },
  // --- ACTIONS ---
  { name: 'Fetch',       type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🎾', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Thrown twice as far. Retrieved twice as enthusiastically.' },
  { name: 'Dog Pack',    type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🐕', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Five dogs working together. Unstoppable.' },
  { name: 'Alpha Wolf',  type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🐺', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The pack follows. The value multiplies.' },
  { name: 'Sit and Stay',type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🐾', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Commanded to hold. Effectiveness reduced.' },
  { name: 'Lost Scent',  type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '👃', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Lost the trail. Five times less effective.' },
  { name: 'Roll Over',   type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Completely submissive. All strengths become weaknesses.' },
  // --- EVENTS ---
  { name: 'Dog Show Swap',       type: 'event', effect_type: 'swap',   art_emoji: '🏅', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'The judge moved the ribbons. Ownership changed.' },
  { name: 'Off-Leash Incident',  type: 'event', effect_type: 'banish', art_emoji: '🏃', effect_text: 'Banish: Remove any one creature from the field permanently.', flavor_text: 'Gone. Into the distance. Not coming back.' },
];

// Release 18 — Food
const r18Cards = [
  // --- CREATURES ---
  { name: 'Wagyu Steak',      type: 'creature', value: 10, art_emoji: '🥩', flavor_text: 'The finest beef on earth. Marbled perfection.' },
  { name: 'Fresh Truffle',    type: 'creature', value:  9, art_emoji: '🍄', flavor_text: 'Worth more than gold by the gram. Pigs find it. Chefs treasure it.' },
  { name: 'Gourmet Pizza',    type: 'creature', value:  7, art_emoji: '🍕', flavor_text: 'Neapolitan crust, San Marzano tomatoes, fresh mozzarella. Some arguments ended.' },
  { name: 'Lobster',          type: 'creature', value:  6, art_emoji: '🦞', flavor_text: 'Red, buttery, and commanding a premium in any situation.' },
  { name: 'Sushi Platter',    type: 'creature', value:  6, art_emoji: '🍣', flavor_text: 'Fresh, precise, and requiring years of training to prepare properly.' },
  { name: 'Chocolate Cake',   type: 'creature', value:  5, art_emoji: '🍰', flavor_text: 'Three layers, rich frosting. The occasion does not matter.' },
  { name: 'Pasta Carbonara',  type: 'creature', value:  4, art_emoji: '🍝', flavor_text: 'The Romans invented this. The rest of the world is grateful.' },
  { name: 'Tacos',            type: 'creature', value:  4, art_emoji: '🌮', flavor_text: 'Three is not enough. Neither is four.' },
  { name: 'Ramen',            type: 'creature', value:  3, art_emoji: '🍜', flavor_text: 'Forty-eight hour broth. Eaten in four minutes.' },
  { name: 'Burger',           type: 'creature', value:  2, art_emoji: '🍔', flavor_text: 'The classic. No improvements needed.' },
  { name: 'Plain Salad',      type: 'creature', value:  1, art_emoji: '🥗', flavor_text: 'Just leaves, really. Technically nutritious.' },
  { name: 'Brussels Sprout',  type: 'creature', value:  0, art_emoji: '😬', flavor_text: 'Has fans. Confused by how few.' },
  { name: 'Cold Soup',        type: 'creature', value: -2, art_emoji: '🥣', flavor_text: 'Intended to be hot. This is not a cold soup situation.' },
  { name: 'Expired Milk',     type: 'creature', value: -4, art_emoji: '🥛', flavor_text: 'Trusted the date. Should not have.' },
  // --- ITEMS ---
  { name: 'Secret Sauce',  type: 'item', operator: '+3', operator_value:  3, art_emoji: '🫙', effect_text: 'Add +3 to one creature.', flavor_text: 'The recipe is protected. The flavor is undeniable.' },
  { name: 'Michelin Star', type: 'item', operator: '+5', operator_value:  5, art_emoji: '⭐', effect_text: 'Add +5 to one creature.', flavor_text: 'The highest honor in cooking. Conferred with enormous consequence.' },
  { name: 'Fresh Herbs',   type: 'item', operator: '+2', operator_value:  2, art_emoji: '🌿', effect_text: 'Add +2 to one creature.', flavor_text: 'Cut from the garden. Added at the last moment.' },
  { name: 'Extra Cheese',  type: 'item', operator: '+1', operator_value:  1, art_emoji: '🧀', effect_text: 'Add +1 to one creature.', flavor_text: 'More of the best thing. Always the right call.' },
  { name: 'Side of Fries', type: 'item', operator: '+1', operator_value:  1, art_emoji: '🍟', effect_text: 'Add +1 to one creature.', flavor_text: 'Arrives hot. Departs quickly.' },
  { name: 'Too Much Salt', type: 'item', operator: '-2', operator_value: -2, art_emoji: '🧂', effect_text: 'Subtract 2 from one creature.', flavor_text: 'The shaker slipped. Everyone notices.' },
  { name: 'Rotten Egg',   type: 'item', operator: '-3', operator_value: -3, art_emoji: '🥚', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Discovered at the worst possible moment.' },
  { name: "Chef's Kiss",   type: 'item', operator: '+5', operator_value:  5, art_emoji: '😘', effect_text: 'Add +5 to one creature.', flavor_text: 'Perfect. Simply perfect. No other word.' },
  // --- ACTIONS ---
  { name: 'Double Portion',        type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🍽️', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Twice the serving. Twice the satisfaction.' },
  { name: 'Five-Star Feast',       type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🌟', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Course after course. Each one better.' },
  { name: 'All-You-Can-Eat',       type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🍴', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Unlimited. Unregulated. Unprecedented.' },
  { name: 'Diet',                  type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🥗', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Portions halved. Enthusiasm correspondingly reduced.' },
  { name: 'Fasting',               type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '😤', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Nothing all day. One fifth the usual results.' },
  { name: 'Food Fight',            type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🍅', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Launched across the cafeteria. Everything reverses.' },
  // --- EVENTS ---
  { name: 'Health Inspector',type: 'event', effect_type: 'zero_out', art_emoji: '🚫', effect_text: 'Zero Out: Set any one creature on the field to 0.', flavor_text: 'Shut it down. Everything stops.' },
  { name: 'Soufflé Rise',    type: 'event', effect_type: 'square',   art_emoji: '🎂', effect_text: "x²: Square one creature's current value.", flavor_text: 'Rises perfectly. The value does too.' },
];

// Release 19 — Jungle Animals
const r19Cards = [
  // --- CREATURES ---
  { name: 'Tiger',               type: 'creature', value: 10, art_emoji: '🐅', flavor_text: 'Orange and black, silent and absolute.' },
  { name: 'Jaguar',              type: 'creature', value:  9, art_emoji: '🐆', flavor_text: 'Swims, climbs, runs. Nothing in the jungle outperforms a jaguar.' },
  { name: 'Silverback Gorilla',  type: 'creature', value:  7, art_emoji: '🦍', flavor_text: '400 pounds of calm. Until it is not.' },
  { name: 'King Cobra',          type: 'creature', value:  6, art_emoji: '🐍', flavor_text: 'Longest venomous snake. Hisses before striking.' },
  { name: 'Leopard',             type: 'creature', value:  6, art_emoji: '🐆', flavor_text: 'Drags prey up trees. Nothing escapes.' },
  { name: 'Orangutan',           type: 'creature', value:  5, art_emoji: '🦧', flavor_text: '95% human DNA. 100% more dignified.' },
  { name: 'Toucan',              type: 'creature', value:  4, art_emoji: '🦜', flavor_text: 'Bill half the size of its body. Still manages.' },
  { name: 'Anaconda',            type: 'creature', value:  4, art_emoji: '🪢', flavor_text: 'Largest snake in the world. It constricts, then waits.' },
  { name: 'Crocodile',           type: 'creature', value:  3, art_emoji: '🐊', flavor_text: "Hasn't changed in 200 million years. Does not need to." },
  { name: 'Sloth',               type: 'creature', value:  2, art_emoji: '🦥', flavor_text: 'Takes its time. Arrives eventually. Never worried.' },
  { name: 'Poison Dart Frog',    type: 'creature', value:  1, art_emoji: '🐸', flavor_text: 'Bright colors mean danger. Locals know this.' },
  { name: 'Tapir',               type: 'creature', value:  0, art_emoji: '🐷', flavor_text: 'Ancient mammal. Pre-dates most things. Still here.' },
  { name: 'Piranha',             type: 'creature', value: -2, art_emoji: '🐟', flavor_text: 'Small teeth. Large ambitions. Schools of consequences.' },
  { name: 'Killer Bee Swarm',    type: 'creature', value: -4, art_emoji: '🐝', flavor_text: 'One is manageable. This is not one.' },
  // --- ITEMS ---
  { name: 'Vine Swing',    type: 'item', operator: '+3', operator_value:  3, art_emoji: '🌿', effect_text: 'Add +3 to one creature.', flavor_text: 'Tarzan-tested. Jungle-approved.' },
  { name: 'Rare Orchid',   type: 'item', operator: '+5', operator_value:  5, art_emoji: '🌺', effect_text: 'Add +5 to one creature.', flavor_text: 'Found only in the deepest jungle. Worth every step.' },
  { name: 'Jungle Map',    type: 'item', operator: '+2', operator_value:  2, art_emoji: '🗺️', effect_text: 'Add +2 to one creature.', flavor_text: 'Hand-drawn. Mostly accurate.' },
  { name: 'Camouflage',    type: 'item', operator: '+1', operator_value:  1, art_emoji: '🍃', effect_text: 'Add +1 to one creature.', flavor_text: 'Invisible to predators. Visible to opportunity.' },
  { name: 'Ripe Mango',    type: 'item', operator: '+1', operator_value:  1, art_emoji: '🥭', effect_text: 'Add +1 to one creature.', flavor_text: "Found ripe and falling. Nature's bonus." },
  { name: 'Quicksand',     type: 'item', operator: '-2', operator_value: -2, art_emoji: '😰', effect_text: 'Subtract 2 from one creature.', flavor_text: 'The slower you struggle, the worse it gets.' },
  { name: 'Snake Venom',   type: 'item', operator: '-3', operator_value: -3, art_emoji: '🐍', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Administered quietly. Noticed immediately.' },
  { name: 'Sacred Feather',type: 'item', operator: '+5', operator_value:  5, art_emoji: '🪶', effect_text: 'Add +5 to one creature.', flavor_text: 'Fallen from a bird that soars above the canopy.' },
  // --- ACTIONS ---
  { name: 'Jungle Charge',    type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🐅', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Nothing in the jungle moves faster when it chooses to.' },
  { name: 'Herd Stampede',    type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🦏', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'The jungle shakes. Five times the force.' },
  { name: 'Apex Predator',    type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🦁', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'At the top of the food chain, nothing is multiplied less.' },
  { name: 'Canopy Retreat',   type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🍃', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Hidden but halved. The jungle conceals, but takes a cost.' },
  { name: 'Swamp Sink',       type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🌊', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Down into the mud. One fifth remains.' },
  { name: 'Venom Reversal',   type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🐍', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'The venom turns every strength to weakness.' },
  // --- EVENTS ---
  { name: 'Jungle Echo', type: 'event', effect_type: 'mirror',  art_emoji: '🌿', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'Deep in the jungle, every sound — and every value — repeats.' },
  { name: 'Monsoon',     type: 'event', effect_type: 'reverse', art_emoji: '🌧️', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'The rains flood everything. What was above is now below.' },
];

// Release 20 — Legos
const r20Cards = [
  // --- CREATURES ---
  { name: 'Master Builder',       type: 'creature', value: 10, art_emoji: '🧱', flavor_text: 'Free-builds with no instructions. Impossible to stump.' },
  { name: 'LEGO Architect',       type: 'creature', value:  9, art_emoji: '🏗️', flavor_text: 'Designed an entire city skyline from memory.' },
  { name: 'Speed Builder',        type: 'creature', value:  7, art_emoji: '⚡', flavor_text: 'Completed the Millennium Falcon in eight hours. Judges were silent.' },
  { name: 'Castle Builder',       type: 'creature', value:  6, art_emoji: '🏰', flavor_text: 'Four thousand pieces, no misplaced bricks. It took a month.' },
  { name: 'Space Explorer',       type: 'creature', value:  5, art_emoji: '🚀', flavor_text: 'The whole galaxy, one LEGO set at a time.' },
  { name: 'LEGO Minifigure',      type: 'creature', value:  5, art_emoji: '👷', flavor_text: 'Small. Iconic. Yellow hand permanently raised in greeting.' },
  { name: 'Technic Engineer',     type: 'creature', value:  4, art_emoji: '⚙️', flavor_text: 'Gears, axles, motors. It actually works.' },
  { name: 'Duplo Kid',            type: 'creature', value:  4, art_emoji: '👶', flavor_text: 'Oversized bricks. Undersized hands. Maximum creativity.' },
  { name: 'Sets Collector',       type: 'creature', value:  3, art_emoji: '📦', flavor_text: 'Sealed in box. Never opened. Appreciating in value.' },
  { name: 'Instruction Follower', type: 'creature', value:  2, art_emoji: '📋', flavor_text: 'Step 47 of 432. On schedule. Somehow.' },
  { name: 'Free-Builder',         type: 'creature', value:  1, art_emoji: '🎨', flavor_text: 'No instructions. No plan. Several regrets.' },
  { name: 'Confused Assembler',   type: 'creature', value:  0, art_emoji: '😕', flavor_text: 'The instructions are in fifteen languages. None of them helping.' },
  { name: 'Stepped-On Brick',     type: 'creature', value: -2, art_emoji: '😫', flavor_text: 'The classic midnight encounter. Unforgettable. Unforgivable.' },
  { name: 'Wrong-Color Brick',    type: 'creature', value: -4, art_emoji: '💔', flavor_text: 'The red one. In the blue section. Inexplicably.' },
  // --- ITEMS ---
  { name: 'Rare Piece',          type: 'item', operator: '+3', operator_value:  3, art_emoji: '⭐', effect_text: 'Add +3 to one creature.', flavor_text: 'The one piece no set comes with twice.' },
  { name: 'Complete Set',        type: 'item', operator: '+5', operator_value:  5, art_emoji: '📦', effect_text: 'Add +5 to one creature.', flavor_text: 'Every piece. Every instruction. Perfect condition.' },
  { name: 'Sorted Bricks',       type: 'item', operator: '+2', operator_value:  2, art_emoji: '🎨', effect_text: 'Add +2 to one creature.', flavor_text: 'Sorted by color and size. A dream to build from.' },
  { name: 'Stud Remover',        type: 'item', operator: '+1', operator_value:  1, art_emoji: '🔧', effect_text: 'Add +1 to one creature.', flavor_text: 'The tiny tool that prevents impossible frustration.' },
  { name: 'Instruction Manual',  type: 'item', operator: '+1', operator_value:  1, art_emoji: '📋', effect_text: 'Add +1 to one creature.', flavor_text: 'Clear diagrams. Numbered steps. Confidence.' },
  { name: 'Missing Piece',       type: 'item', operator: '-2', operator_value: -2, art_emoji: '😤', effect_text: 'Subtract 2 from one creature.', flavor_text: 'The one piece. The only piece. Gone.' },
  { name: 'Melted Brick',        type: 'item', operator: '-3', operator_value: -3, art_emoji: '🔥', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Left near a heat vent. Deformed beyond use.' },
  { name: 'Golden Brick',        type: 'item', operator: '+5', operator_value:  5, art_emoji: '🟡', effect_text: 'Add +5 to one creature.', flavor_text: 'The legendary prize. Finding one changes everything.' },
  // --- ACTIONS ---
  { name: 'Double Layer',            type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🧱', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Built it again on top. Twice the height, twice the value.' },
  { name: 'Complete Modular',        type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🏗️', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'All five floors connected. Five times the impact.' },
  { name: 'Millennium Falcon Build', type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🚀', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Seven thousand pieces. Worth every one.' },
  { name: 'Deconstruction',          type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🔨', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Taken apart carefully. Half remains.' },
  { name: 'Everything Falls Apart',  type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '💥', effect_text: "Divide one creature's value by 5.",    flavor_text: 'The main support gave. One fifth survived.' },
  { name: 'Reverse Engineer',        type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Disassembled and rebuilt backwards. Everything inverts.' },
  // --- EVENTS ---
  { name: 'Stepped on a Lego', type: 'event', effect_type: 'banish', art_emoji: '😱', effect_text: 'Banish: Remove any one creature from the field permanently.', flavor_text: 'The pain. The consequences. Permanent removal.' },
  { name: 'MOC Goes Viral',    type: 'event', effect_type: 'x100',   art_emoji: '📱', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'Posted online at midnight. A hundred thousand views by morning.' },
];

// Release 21 — Baseball
const r21Cards = [
  // --- CREATURES ---
  { name: 'Babe Ruth',         type: 'creature', value: 10, art_emoji: '🏟️', flavor_text: 'Called his shot. Hit it. Said nothing more.' },
  { name: 'Mickey Mantle',     type: 'creature', value:  9, art_emoji: '⚡',  flavor_text: 'Switch hitter. Tape-covered knees. Played through everything.' },
  { name: 'Ted Williams',      type: 'creature', value:  7, art_emoji: '🎯',  flavor_text: 'Last man to hit .400. Served in two wars. Still found time to be the greatest hitter alive.' },
  { name: 'Ken Griffey Jr.',   type: 'creature', value:  6, art_emoji: '😊',  flavor_text: 'The most natural swing in history. Also the hat.' },
  { name: 'Shohei Ohtani',     type: 'creature', value:  6, art_emoji: '🌟',  flavor_text: 'Pitches on Monday. Bats cleanup on Tuesday. Does not understand why others cannot.' },
  { name: 'Sandy Koufax',      type: 'creature', value:  5, art_emoji: '🔥',  flavor_text: 'Four Cy Young Awards in five years. Then he retired at thirty. Nobody argued.' },
  { name: 'Mariano Rivera',    type: 'creature', value:  5, art_emoji: '✂️',  flavor_text: 'One pitch. Nobody could hit it. The only unanimous Hall of Famer.' },
  { name: 'Satchel Paige',     type: 'creature', value:  4, art_emoji: '🌙',  flavor_text: 'Kept from the majors for decades. Arrived anyway. Dominated anyway.' },
  { name: 'Hank Greenberg',    type: 'creature', value:  4, art_emoji: '✡️',  flavor_text: 'Took two years off to fight in World War II. Still finished with 331 home runs.' },
  { name: 'Aaron Judge',       type: 'creature', value:  3, art_emoji: '👑',  flavor_text: 'Broke the American League home run record. All rise.' },
  { name: 'Ricky Henderson',   type: 'creature', value:  2, art_emoji: '💨',  flavor_text: 'Stole 1,406 bases. Would like you to know that.' },
  { name: 'Casey Stengel',     type: 'creature', value:  1, art_emoji: '📋',  flavor_text: 'Won seven World Series as manager. Had opinions about everyone. Shared all of them.' },
  { name: 'Nomar Garciaparra', type: 'creature', value: -2, art_emoji: '💔',  flavor_text: 'Best shortstop of his era for three brilliant years. Then injuries. Then the trade.' },
  { name: 'Mark McGwire',      type: 'creature', value: -4, art_emoji: '💊',  flavor_text: 'Hit 70 home runs. Congress had questions.' },
  // --- ITEMS ---
  { name: 'Lucky Bat',     type: 'item', operator: '+3', operator_value:  3, art_emoji: '🏏', effect_text: 'Add +3 to one creature.', flavor_text: 'Pine tar, tape, and absolute belief.' },
  { name: 'Rookie of the Year', type: 'item', operator: '+5', operator_value:  5, art_emoji: '⭐', effect_text: 'Add +5 to one creature.', flavor_text: 'Best first-year player in the league. The plaque looks great.' },
  { name: 'MVP Award',         type: 'item', operator: '+3', operator_value:  3, art_emoji: '🏅', effect_text: 'Add +3 to one creature.', flavor_text: 'Most Valuable Player. The committee actually agreed.' },
  { name: 'Batting Gloves',type: 'item', operator: '+1', operator_value:  1, art_emoji: '🧤', effect_text: 'Add +1 to one creature.', flavor_text: 'Better grip. More confidence.' },
  { name: 'Rally Cap',     type: 'item', operator: '+1', operator_value:  1, art_emoji: '🧢', effect_text: 'Add +1 to one creature.', flavor_text: 'Turned inside out. The team believes.' },
  { name: 'Rain Delay',    type: 'item', operator: '-2', operator_value: -2, art_emoji: '🌧️', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Forty minutes under a tarp. Rhythm completely lost.' },
  { name: 'Strikeout',     type: 'item', operator: '-3', operator_value: -3, art_emoji: '❌', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Three swings. None connected.' },
  { name: 'Cy Young Award',type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏆', effect_text: 'Add +5 to one creature.', flavor_text: 'Best pitcher in the league. Named for the man who won 511 games.' },
  // --- ACTIONS ---
  { name: 'Double Play',    type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🔄', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Two outs, one play. Value doubled.' },
  { name: 'Grand Slam',     type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '💥', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Bases loaded. All four scored. Five times the impact.' },
  { name: 'Perfect Game',   type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🌟', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'Twenty-seven up. Twenty-seven down. Once in history.' },
  { name: 'Intentional Walk',type: 'action', operator: '÷2',   operator_value:  0.5, art_emoji: '🚶', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Chose not to face it. Half as relevant.' },
  { name: 'Balk',           type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '😳', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Runner advances. Pitcher loses composure. And points.' },
  { name: 'Hit by Pitch',   type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '⚾', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Takes the hit. Walks to first. Changes the sign on everything.' },
  // --- EVENTS ---
  { name: 'Trade Deadline', type: 'event', effect_type: 'swap',     art_emoji: '📋', effect_text: 'Swap: Exchange any two creatures between sides.', flavor_text: 'The phone rang. By midnight, nothing was where it was.' },
  { name: 'Ejection',       type: 'event', effect_type: 'zero_out', art_emoji: '🟥', effect_text: 'Zero Out: Set any one creature on the field to 0.', flavor_text: 'Tossed from the game. Value immediately becomes zero.' },
];

// Release 22 — Work
const r22Cards = [
  // --- CREATURES ---
  { name: 'CEO',                    type: 'creature', value: 10, art_emoji: '💼', flavor_text: 'Answers to no one. Usually.' },
  { name: 'Senior Engineer',        type: 'creature', value:  9, art_emoji: '💻', flavor_text: 'The person who actually knows how it works.' },
  { name: 'Employee of the Month',  type: 'creature', value:  7, art_emoji: '⭐', flavor_text: 'Framed photo in the lobby. Everyone resents and respects this.' },
  { name: 'Account Manager',        type: 'creature', value:  6, art_emoji: '📊', flavor_text: 'Keeps seventeen clients happy simultaneously. Nobody is sure how.' },
  { name: 'Marketing Lead',         type: 'creature', value:  5, art_emoji: '📣', flavor_text: 'Makes things sound better than they are. Professionally.' },
  { name: 'HR Manager',             type: 'creature', value:  5, art_emoji: '🤝', flavor_text: 'Has seen everything. Will not tell you about any of it.' },
  { name: 'Designer',               type: 'creature', value:  4, art_emoji: '🎨', flavor_text: 'Made it beautiful. Was told to use a different font.' },
  { name: 'Project Manager',        type: 'creature', value:  4, art_emoji: '📋', flavor_text: 'The schedule says Tuesday. Tuesday is a lie. They know this.' },
  { name: 'Intern',                 type: 'creature', value:  3, art_emoji: '☕', flavor_text: 'Makes the coffee. Takes the notes. Learning everything.' },
  { name: 'Customer Service Rep',   type: 'creature', value:  2, art_emoji: '📞', flavor_text: 'Has never been thanked once. Answers on the second ring every time.' },
  { name: 'New Hire',               type: 'creature', value:  1, art_emoji: '👋', flavor_text: 'First week. Enthusiastic. Unaware.' },
  { name: 'Quiet Quitter',          type: 'creature', value:  0, art_emoji: '😐', flavor_text: 'Present in body. Elsewhere in spirit.' },
  { name: 'Micromanager',           type: 'creature', value: -2, art_emoji: '😤', flavor_text: 'Reviews your work before you have started. Still finds changes.' },
  { name: 'That One Coworker',      type: 'creature', value: -4, art_emoji: '🙄', flavor_text: 'Has a reply-all problem. Has a lunch problem. Has several problems.' },
  // --- ITEMS ---
  { name: 'Promotion',            type: 'item', operator: '+3', operator_value:  3, art_emoji: '🎉', effect_text: 'Add +3 to one creature.', flavor_text: 'Title change. Responsibilities multiply. So does the paycheck.' },
  { name: 'Stock Options',        type: 'item', operator: '+5', operator_value:  5, art_emoji: '📈', effect_text: 'Add +5 to one creature.', flavor_text: 'Vesting cliff in four years. Currently worth everything.' },
  { name: 'Expense Account',      type: 'item', operator: '+2', operator_value:  2, art_emoji: '💳', effect_text: 'Add +2 to one creature.', flavor_text: 'Business meals, client gifts, and one surprisingly nice hotel.' },
  { name: 'Coffee',               type: 'item', operator: '+1', operator_value:  1, art_emoji: '☕', effect_text: 'Add +1 to one creature.', flavor_text: 'Third cup. Finally functional.' },
  { name: 'Good Performance Review', type: 'item', operator: '+1', operator_value: 1, art_emoji: '✅', effect_text: 'Add +1 to one creature.', flavor_text: 'Exceeded expectations in two categories. Documented.' },
  { name: 'Missed Deadline',      type: 'item', operator: '-2', operator_value: -2, art_emoji: '⏰', effect_text: 'Subtract 2 from one creature.', flavor_text: 'The client noticed. The manager noticed. Everyone noticed.' },
  { name: 'Demotion',             type: 'item', operator: '-3', operator_value: -3, art_emoji: '📉', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Effective immediately. All-hands meeting to follow.' },
  { name: 'Company Acquisition',  type: 'item', operator: '+5', operator_value:  5, art_emoji: '🤝', effect_text: 'Add +5 to one creature.', flavor_text: 'Bought out. Valuation goes through the roof.' },
  // --- ACTIONS ---
  { name: 'Overtime',            type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '🌙', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Stayed late. Got twice as much done.' },
  { name: 'All-Hands Meeting',   type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '📣', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Everyone in the room. Every message amplified.' },
  { name: 'IPO',                 type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '💰', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The company goes public. Value multiplied on the opening bell.' },
  { name: 'Budget Cut',          type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '✂️', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Resources halved. Expectations unchanged.' },
  { name: 'Layoffs',             type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '😰', effect_text: "Divide one creature's value by 5.",    flavor_text: 'One fifth of the team remains. One fifth the capacity.' },
  { name: 'Corporate Restructure',type:'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🔄', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'The org chart redrawn. Strengths and weaknesses exchange roles.' },
  // --- EVENTS ---
  { name: 'Reorg',        type: 'event', effect_type: 'reverse', art_emoji: '📊', effect_text: 'Reverse: Flip the sign of every creature on one side of the field.', flavor_text: 'New management. New priorities. Everything previously valued is now a liability.' },
  { name: 'Office Clone', type: 'event', effect_type: 'mirror',  art_emoji: '👥', effect_text: "Mirror: Copy one creature's current value onto another creature.", flavor_text: 'The shadow employee. Does everything exactly the same.' },
];

// Release 23 — Sports
const r23Cards = [
  // --- CREATURES ---
  { name: 'Olympic Champion',         type: 'creature', value: 10, art_emoji: '🥇', flavor_text: 'Four years of training. Ten seconds to show it.' },
  { name: 'World Record Holder',      type: 'creature', value:  9, art_emoji: '🌍', flavor_text: 'The record belongs to them. It may belong to them forever.' },
  { name: 'Championship Quarterback', type: 'creature', value:  7, art_emoji: '🏈', flavor_text: 'Reads the field in under two seconds. Throws to where the receiver will be.' },
  { name: 'Basketball Star',          type: 'creature', value:  6, art_emoji: '🏀', flavor_text: 'Forty points, eight assists, six rebounds. Also available for autographs.' },
  { name: 'Soccer Pro',               type: 'creature', value:  5, art_emoji: '⚽', flavor_text: 'Plays ninety minutes at full pace. Effortlessly.' },
  { name: 'Tennis Ace',               type: 'creature', value:  5, art_emoji: '🎾', flavor_text: 'First serve at 140 mph. Second serve is somehow faster.' },
  { name: 'Olympic Swimmer',          type: 'creature', value:  4, art_emoji: '🏊', flavor_text: 'Faster through water than most are on land.' },
  { name: 'Gymnast',                  type: 'creature', value:  4, art_emoji: '🤸', flavor_text: 'Defies physics daily. Scores near-perfect. Still finds something to improve.' },
  { name: 'Marathon Runner',          type: 'creature', value:  3, art_emoji: '🏃', flavor_text: 'Twenty-six miles. No shortcuts. Just will.' },
  { name: 'Hockey Player',            type: 'creature', value:  2, art_emoji: '🏒', flavor_text: 'Skates at forty miles per hour. On blades. While being checked.' },
  { name: 'Weekend Warrior',          type: 'creature', value:  1, art_emoji: '🏋️', flavor_text: 'Plays every sport badly. Loves every second.' },
  { name: 'Benchwarmer',              type: 'creature', value:  0, art_emoji: '🪑', flavor_text: 'Ready to contribute. Still waiting for that call.' },
  { name: 'Bad Sport',                type: 'creature', value: -2, art_emoji: '😡', flavor_text: 'Argues every call. Has never been right. Keeps arguing.' },
  { name: 'Performance Enhancer',     type: 'creature', value: -4, art_emoji: '💊', flavor_text: 'Found in testing. Banned from everything. Record stripped.' },
  // --- ITEMS ---
  { name: 'Sports Drink',       type: 'item', operator: '+3', operator_value:  3, art_emoji: '🧃', effect_text: 'Add +3 to one creature.', flavor_text: 'Electrolytes, glucose, and belief.' },
  { name: 'Championship Belt',  type: 'item', operator: '+5', operator_value:  5, art_emoji: '🏆', effect_text: 'Add +5 to one creature.', flavor_text: 'The heaviest accessory. Worth every ounce.' },
  { name: 'Training Montage',   type: 'item', operator: '+2', operator_value:  2, art_emoji: '💪', effect_text: 'Add +2 to one creature.', flavor_text: 'Upbeat music. Rapid improvement. Ready.' },
  { name: 'Lucky Socks',        type: 'item', operator: '+1', operator_value:  1, art_emoji: '🧦', effect_text: 'Add +1 to one creature.', flavor_text: 'Worn at every game. Washed at no game.' },
  { name: 'Game Day Breakfast', type: 'item', operator: '+1', operator_value:  1, art_emoji: '🥞', effect_text: 'Add +1 to one creature.', flavor_text: 'Pancakes and ritual. Essential.' },
  { name: 'Muscle Cramp',       type: 'item', operator: '-2', operator_value: -2, art_emoji: '😣', effect_text: 'Subtract 2 from one creature.', flavor_text: 'Last ten minutes of the final. Could not have worse timing.' },
  { name: 'Red Card',           type: 'item', operator: '-3', operator_value: -3, art_emoji: '🟥', effect_text: 'Subtract 3 from one creature.', flavor_text: 'Sent off. Team plays down one.' },
  { name: 'Hall of Fame Plaque',type: 'item', operator: '+5', operator_value:  5, art_emoji: '🌟', effect_text: 'Add +5 to one creature.', flavor_text: 'Inducted. Legacy secured. Numbers retired.' },
  // --- ACTIONS ---
  { name: 'Second Wind',        type: 'action', operator: '×2',    operator_value:  2,   art_emoji: '💨', effect_text: "Multiply one creature's value by 2.",   flavor_text: 'Found something in reserve. Doubled.' },
  { name: 'Playoffs',           type: 'action', operator: '×5',    operator_value:  5,   art_emoji: '🏟️', effect_text: "Multiply one creature's value by 5.",   flavor_text: 'Every game matters. Every point amplified.' },
  { name: 'World Championship', type: 'action', operator: '×10',   operator_value:  10,  art_emoji: '🌍', effect_text: "Multiply one creature's value by 10.",  flavor_text: 'The biggest stage. The highest stakes. Ten times everything.' },
  { name: 'Injury Timeout',     type: 'action', operator: '÷2',    operator_value:  0.5, art_emoji: '🩹', effect_text: "Divide one creature's value by 2.",    flavor_text: 'Down for recovery. Out at half capacity.' },
  { name: 'Penalty Box',        type: 'action', operator: '÷5',    operator_value:  0.2, art_emoji: '🚫', effect_text: "Divide one creature's value by 5.",    flavor_text: 'Two minutes. Everything drops to one fifth.' },
  { name: 'Own Goal',           type: 'action', operator: '×(-1)', operator_value: -1,   art_emoji: '🙈', effect_text: "Flip one creature's value to its opposite.", flavor_text: 'Went the wrong direction. Value flips accordingly.' },
  // --- EVENTS ---
  { name: 'GOAT Moment',        type: 'event', effect_type: 'x100',   art_emoji: '🐐', effect_text: "×100: Multiply any one creature's value by 100.", flavor_text: 'The greatest moment from the greatest of all time. One hundred times legendary.' },
  { name: 'Overtime Squared',   type: 'event', effect_type: 'square', art_emoji: '⏱️', effect_text: "x²: Square one creature's current value.", flavor_text: 'Double overtime. The pressure squares the stakes.' },
];

const newReleases = [
  { number:  8, name: 'Underwater',       icon: '🌊', color_hex: '#0077b6' },
  { number:  9, name: 'Superheroes',      icon: '🦸', color_hex: '#d62828' },
  { number: 10, name: 'Stuffed Animals',  icon: '🧸', color_hex: '#f4a261' },
  { number: 11, name: 'Art',              icon: '🎨', color_hex: '#7b2d8b' },
  { number: 12, name: 'Pets',             icon: '🐾', color_hex: '#2a9d8f' },
  { number: 13, name: 'Judaism',          icon: '✡️', color_hex: '#1b4f72' },
  { number: 14, name: 'Pottery',          icon: '🏺', color_hex: '#a0522d' },
  { number: 15, name: 'Summer Camp',      icon: '⛺', color_hex: '#2d6a4f' },
  { number: 16, name: 'Family Vacations', icon: '🏖️', color_hex: '#e76f51' },
  { number: 17, name: 'Dogs',             icon: '🐕', color_hex: '#8b5e3c' },
  { number: 18, name: 'Food',             icon: '🍕', color_hex: '#e63946' },
  { number: 19, name: 'Jungle Animals',   icon: '🌿', color_hex: '#386641' },
  { number: 20, name: 'Legos',            icon: '🧱', color_hex: '#ffbe0b' },
  { number: 21, name: 'Baseball',         icon: '⚾', color_hex: '#1d3557' },
  { number: 22, name: 'Work',             icon: '💼', color_hex: '#264653' },
  { number: 23, name: 'Sports',           icon: '🏅', color_hex: '#023e8a' },
];

const newReleaseCardPairs = [
  { number:  8, cards: r8Cards  },
  { number:  9, cards: r9Cards  },
  { number: 10, cards: r10Cards },
  { number: 11, cards: r11Cards },
  { number: 12, cards: r12Cards },
  { number: 13, cards: r13Cards },
  { number: 14, cards: r14Cards },
  { number: 15, cards: r15Cards },
  { number: 16, cards: r16Cards },
  { number: 17, cards: r17Cards },
  { number: 18, cards: r18Cards },
  { number: 19, cards: r19Cards },
  { number: 20, cards: r20Cards },
  { number: 21, cards: r21Cards },
  { number: 22, cards: r22Cards },
  { number: 23, cards: r23Cards },
];

async function addReleases() {
  console.log('Adding releases 8–23...');

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
