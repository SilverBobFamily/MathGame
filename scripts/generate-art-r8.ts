// Usage: npx tsx scripts/generate-art-r8.ts
//   CARD_ID=241              — regenerate one card (auto picks)
//   PICK=1                   — picker mode: 3 variants per card, browser selection
//   CARD_ID=241 PICK=1       — picker mode for one card only
// Generates bold flat cartoon (Bluey-style) art for all 45 Release 8 (SilverBobs) cards.
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { exec } from 'child_process';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const RELEASE_ID = 8;
const OUTPUT_DIR = `./art-output/release-${RELEASE_ID}`;
const PHOTOS = `${process.cwd()}/art-refs/r8`;
const PICKER_PORT = 3457;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const STYLE = `Bold flat cartoon illustration: clean thick black outlines, bright saturated colors with flat fills, zero gradients or shading, simple expressive character shapes, high contrast compositions, energetic and joyful. Characters have clear distinct silhouettes. This is an original illustration style — do NOT imitate or reference any existing animated television show. Square format, portrait orientation, no text or letters in the image, trading card game art for a family math game.`;

const hidePanda = (where: string, material: string) =>
  `Hidden easter egg: a tiny stuffed black-and-white panda with a big round head and large sparkly eyes is ${where}, rendered in the same tones as the surrounding ${material} so it blends in naturally. It occupies a very small area of the image. It is NOT a subject — it is a hidden secret that requires careful inspection to find.`;

const hideBunny = (where: string, material: string) =>
  `Hidden easter egg: a tiny sage-green stuffed bunny rabbit with floppy ears is ${where}, rendered in the same muted green tones as the surrounding ${material} so it blends in. It occupies a very small area. It is NOT a subject — it is a hidden secret requiring careful inspection to find.`;

interface CardEntry { id: number; name: string; prompt: string; refPhotos?: string[]; }

const CARDS: CardEntry[] = [
  // ── CREATURES ──────────────────────────────────────────────────────────────
  {
    id: 241, name: 'Josh (Dad)',
    refPhotos: [`${PHOTOS}/josh-dad.jpeg`],
    prompt: `Using the reference photo, render Josh (Dad) as a storybook illustration — bald head, dark beard with gray only on the chin, warm confident smile. ${STYLE} Scene: at a desk with a laptop open, overflowing with sticky notes and coffee cups, a whiteboard of frameworks behind him, entirely pleased with himself. ${hidePanda('on a sticky note pinned to the edge of the whiteboard', 'yellow paper')}`,
  },
  {
    id: 242, name: 'Rachel (Mom)',
    refPhotos: [`${PHOTOS}/rachel-mom.jpeg`],
    prompt: `Using the reference photo, render Rachel (Mom) as a storybook illustration — dark hair with colorful headband, glasses, bright warm smile. ${STYLE} Scene: managing six things simultaneously with cheerful competence — dinner, homework, phone tucked to shoulder. ${hideBunny('behind a stack of books on the kitchen counter', 'wooden counter surface')}`,
  },
  {
    id: 243, name: 'Gana',
    refPhotos: [`${PHOTOS}/gana.jpeg`],
    prompt: `Using the reference photo, render Gana as a storybook illustration — white hair, joyful luminous smile, purple top, radiating the warmth of 95 years of wisdom. ${STYLE} Scene: seated in a plush armchair, cup of tea in hand, smiling like she knows something the rest of us will figure out eventually. ${hidePanda('on the armchair side table blending into the cream doily', 'cream lace fabric')}`,
  },
  {
    id: 244, name: 'Nana & Papa',
    refPhotos: [`${PHOTOS}/nana.jpeg`, `${PHOTOS}/papa.jpeg`],
    prompt: `Using both reference photos, render Nana and Papa together as a storybook illustration. Nana: short curly gray hair, glasses, warm smile, red patterned top. Papa: salt-and-pepper hair, warm smile, blue polo. ${STYLE} Scene: together at a kitchen table loaded with cookies and warmth, lamplight glowing. ${hideBunny('behind the cookie jar on the counter in the background', 'ceramic jar texture')}`,
  },
  {
    id: 245, name: 'Grandpa & Judy',
    refPhotos: [`${PHOTOS}/grandpa-judy.jpeg`],
    prompt: `Using the reference photo, render Grandpa and Judy together as a storybook illustration — Judy, 72, with shoulder-length brown hair and warm smile; Grandpa, 75, with glasses, gray hair, plaid flannel vest. ${STYLE} Scene: relaxing outdoors by a lake, fishing poles nearby, completely at ease — they have seen everything and nothing worries them. ${hidePanda('in an open tackle box in the background, blending into the lure colors', 'tackle box interior')}`,
  },
  {
    id: 246, name: 'Readee McGee',
    refPhotos: [`${PHOTOS}/readee-mcgee.jpeg`],
    prompt: `Using the reference photo, render Readee McGee — this exact large stuffed black-and-white panda with big sparkly blue eyes — as a storybook illustration character. ${STYLE} Scene: the panda enthusiastically reading an enormous book, nose nearly touching the page, surrounded by a towering library. ${hideBunny('peeking out from behind a lower bookshelf, blending into sage-green book spines', 'book spine colors')}`,
  },
  {
    id: 247, name: 'Blue Lou',
    refPhotos: [`${PHOTOS}/blue-lou.jpeg`],
    prompt: `Using the reference photo, render Blue Lou — this exact soft sage-green stuffed bunny with floppy ears, slightly worn and well-loved — as a storybook illustration character. ${STYLE} Scene: Blue Lou lounging in an effortlessly cool pose on a velvet cushion under warm lamplight, utterly fabulous. ${hidePanda('tucked behind a decorative pillow in the far background, blending into cream cushion fabric', 'cream pillow fabric')}`,
  },
  {
    id: 248, name: 'Anna',
    refPhotos: [`${PHOTOS}/anna.jpeg`],
    prompt: `Using the reference photo, render Anna as a storybook illustration — girl 11 years old, brown hair, big bright smile, blue jacket. ${STYLE} Scene: outdoors in nature on a trail, sunlight filtering through bare trees, steady and genuinely happy to be there. ${hideBunny('nestled in the roots of a tree in the background, blending into the mossy earth', 'mossy green roots')}`,
  },
  {
    id: 249, name: 'Watchee McGee',
    refPhotos: [`${PHOTOS}/watchee-mcgee.jpeg`],
    prompt: `Using the reference photo, render Watchee McGee — this stuffed black-and-white panda — as a storybook illustration. ${STYLE} Scene: staring at a glowing television with wide, captivated eyes, snacks untouched beside him, completely in another world. ${hideBunny('on the TV stand beside the television, blending into the gray electronics shadow', 'dark shelf shadow')}`,
  },
  {
    id: 250, name: 'Danny',
    refPhotos: [`${PHOTOS}/danny.jpeg`],
    prompt: `Using the reference photo, render Danny as a storybook illustration — boy around 9 years old, light brown wavy hair, blue t-shirt, easy natural smile, relaxed and confident outdoors. ${STYLE} Scene: outside on a summer day, trees and a cabin visible behind him, totally at ease and ready for anything. ${hidePanda('on a picnic table in the background, blending into the wood grain', 'weathered wood surface')}`,
  },
  {
    id: 251, name: 'Benny',
    refPhotos: [`${PHOTOS}/benny.jpeg`],
    prompt: `Using the reference photo, render Benny as a storybook illustration — boy almost 6 years old, brown hair, gap-toothed smile with missing front tooth, red t-shirt, enormous joyful expression. ${STYLE} Scene: flexing both arms with total conviction, biggest smile imaginable, absolutely certain of his own power. ${hideBunny('peeking around a door frame behind Benny, blending into the wall shadow', 'wall shadow')}`,
  },
  {
    id: 252, name: 'Abby',
    refPhotos: [`${PHOTOS}/abby.jpeg`],
    prompt: `Using the reference photo, render Abby as a storybook illustration — golden/cream-colored dog with a sweet soft face, warm brown eyes, wearing a festive bandana. ${STYLE} Scene: lounging contentedly on a couch, tail mid-wag, the most beloved good dog in any room. ${hidePanda('tucked between couch cushions in the background, only its ear visible, blending into cream cushion fabric', 'cream cushion fabric')}`,
  },
  {
    id: 253, name: 'Hearee McGee',
    refPhotos: [`${PHOTOS}/hearee-mcgee.jpeg`],
    prompt: `Using the reference photo, render Hearee McGee — this stuffed black-and-white panda — as a storybook illustration. ${STYLE} Scene: one ear tilted dramatically toward the viewer, eyes doing a classic "who, me?" expression, completely caught mid-eavesdrop. ${hideBunny('behind a houseplant in the background, sage green blending with the leaves', 'plant foliage')}`,
  },
  {
    id: 254, name: 'Melvin',
    prompt: `${STYLE} Subject: Melvin — a very large tan stuffed bunny rabbit with long floppy ears, wearing a small handwritten name tag that reads "STEVE." The bunny looks entirely at peace with this. Scene: seated primly in a reading chair, name tag front and center, unbothered by everything. ${hidePanda('under the reading chair, blending into the dark floor shadow', 'wood floor shadow')}`,
  },
  {
    id: 255, name: 'Maple',
    prompt: `${STYLE} Subject: Maple — a brown and white stuffed bunny rabbit with a tiny maple leaf on her ear, exuding polite but firm Canadian energy. Sweet on the outside. Do not test her. Scene: standing confidently in a snowy landscape, cozy cabin behind her, maple leaf on her collar catching the light. ${hideBunny('in a snowdrift near the cabin door, blending into white snow', 'white snow')}`,
  },
  {
    id: 256, name: 'Dizzy McGee',
    prompt: `${STYLE} Subject: Dizzy McGee — a flat, floppy stuffed black-and-white panda — not round or rotund, but flat and floppy like a beanbag, similar in shape and size to a small pillow. Extremely fluffy texture, wide permanent grin. Caught mid-spin. Scene: spinning wildly on the living room rug while Benny (almost 6, brown hair, red shirt) sits cross-legged nearby watching with pure delight, one finger pointing. Paw blur trails circle the panda. ${hideBunny('on a shelf in the background among other stuffed animals, sage green blending into the row', 'stuffed animal shelf colors')}`,
  },
  {
    id: 257, name: 'Meh McGee',
    prompt: `${STYLE} Subject: Meh McGee — a tiny stuffed black-and-white panda with NO arms and NO legs, shaped exactly like a small oblong potato or a stubby hot dog. He has a small flat face. A small speech bubble above him reads "meh." Scene: Meh McGee sits propped on a bed. On the TV in front of him: something visually spectacular — fireworks, a dragon, confetti, general amazingness. Meh McGee's expression is perfectly, completely neutral. He could not be less moved. ${hidePanda('reflected in the TV screen in the background, blending into the glow', 'TV screen reflection')}`,
  },
  {
    id: 258, name: 'Squatchy',
    prompt: `${STYLE} Subject: Squatchy — an all-white stuffed bunny with large feet and slightly wild fluffy fur. Scene: Anna (11, brown hair, blue jacket) is hiking in the backyard woods and has just stopped, pointing with wide eyes at something behind a bush. Half-hidden in the foliage: one oversized white paw and two ancient knowing eyes. Squatchy was definitely there. Anna has one hand raised pointing, one arm at her side. ${hidePanda('deep in the background foliage, blending into dark leaf shadows', 'dark leaf shadow')}`,
  },
  {
    id: 259, name: 'Blippy Sue',
    prompt: `${STYLE} Subject: Blippy Sue — a white stuffed bunny with extremely long floppy ears and a head noticeably bigger than her body, wearing a pearl necklace, sitting with perfect Southern posture. She holds one long floppy ear up delicately and fans herself with it, expression composed and gracious. Scene: Blippy Sue is seated in a pretty armchair in the living room, fanning herself with one ear, a glass of sweet tea on the side table beside her. She is perfectly at ease and thoroughly genteel. ${hideBunny('tucked into a flower arrangement on the side table, blending into cream petals', 'flower petals')}`,
  },
  {
    id: 260, name: 'CiCi',
    refPhotos: [`${PHOTOS}/cici.jpeg`],
    prompt: `Using the reference photo, render CiCi as a flat cartoon illustration capturing her likeness. CiCi is a uniformly solid pink stuffed bunny — flat pink color throughout, zero shading, zero color variation. ${STYLE} Scene: CiCi trots proudly through the family living room trailing a cheerful little green cloud behind her. She is completely delighted. On the couch: Josh (bald, dark beard) and Rachel (dark hair, glasses) each leaning subtly away in opposite directions while maintaining polite expressions. CiCi does not notice or care. One green puff, two adults leaning, one proud bunny — clear staging, no extra hands. ${hidePanda('half-hidden behind the doorframe at the edge of the scene, blending into the door shadow', 'door frame shadow')}`,
  },
  {
    id: 261, name: 'Luna',
    prompt: `${STYLE} Subject: Luna — a cute stuffed bunny with dark gray fur wearing a tiny royal-blue cape with a gold clasp, looking regal and self-important. Very much a nighttime bunny. Scene: Luna sits on a bedroom windowsill with a full moon glowing cheerfully outside. She gazes at the moon with total queenly composure. Stars visible in the sky. Cozy curtains on either side. Kid-friendly and charming throughout. ${hideBunny('reflected faintly in the window glass, a tiny second bunny shape among the stars', 'night sky reflection')}`,
  },
  // ── ITEMS ──────────────────────────────────────────────────────────────────
  {
    id: 262, name: 'Shabbat Dinner',
    prompt: `${STYLE} Subject: the family's Friday night Shabbat dinner. At the table: Josh (bald, dark beard) at one end, Rachel (dark hair, glasses) at the other — Rachel's two hands are extended lighting the two tall candles at the center. Anna (11), Danny (9), and Benny (almost 6) are seated along the sides. Abby (golden dog) is visible under the table. Golden braided challah, wine glasses, and flowers fill the center. Warm candlelight. Everyone has their own chair and their own pair of hands — no extra limbs. ${hidePanda('on the far end chair at the edge of the table, blending into the cream tablecloth', 'white tablecloth')}`,
  },
  {
    id: 263, name: 'Lake House',
    prompt: `${STYLE} Subject: the family at a lake house dock at golden hour. Josh (bald, dark beard) sits in an Adirondack chair on the dock with one hand holding a drink. Rachel wades at the shore. Anna kayaks in the distance. Danny and Benny run down the wooden dock planks toward the water. Abby (golden dog) is already in the water. Warm porch glow behind the cabin in the background. Each character has a clear distinct position — no overlapping limbs. ${hideBunny('tucked in a hammock strung between trees in the background, blending into the rope texture', 'rope hammock')}`,
  },
  {
    id: 264, name: 'Library Books',
    prompt: `${STYLE} Subject: a towering wobbly stack of library books on the family living room table, due-date slips poking out at odd angles — renewed twice, will be renewed again. Anna (11, brown hair) sits in a chair reading one book with both hands on it. Benny (almost 6) stands beside the table attempting to add one more book to the top of the already-teetering stack with both his hands. Two kids, clear actions, no extra limbs. ${hidePanda('on the shelf directly behind the stack, peeking between two volumes', 'dark bookshelf shadow')}`,
  },
  {
    id: 265, name: "Angel's Potatoes",
    prompt: `${STYLE} Subject: a perfect roasting pan of golden cubed potatoes — crispy edges, glistening, aromatic — fresh from the oven resting on the kitchen counter. Josh (bald, dark beard) reaches toward the pan with one hand and one extremely obvious expression of intent. Rachel (dark hair, glasses) stands in the background with one hand raised in a clear "not yet" gesture. Two people, two hands total visible, one pan of potatoes. ${hideBunny('on the kitchen windowsill in the background, blending into the white curtain', 'white curtain fabric')}`,
  },
  {
    id: 266, name: 'Pottery Wheel',
    prompt: `${STYLE} Subject: Rachel (dark hair, colorful headband, clay-splattered apron) seated at a spinning pottery wheel, both hands centered in wet clay. Benny (almost 6, brown hair, red shirt) sits on a stool beside her, chin resting in one hand, watching with total fascination. Soft warm studio light. Rachel has two hands in clay, Benny has one hand on chin, one at his side — clear and accurate. ${hidePanda('on a clay-dusted shelf in the background, same gray-beige as the clay pots', 'clay pot surface')}`,
  },
  {
    id: 267, name: 'Yogibo',
    prompt: `${STYLE} Subject: Danny (9, brown hair) has completely sunk into an enormous bean bag chair — only his head and one arm visible above the surface, holding a game controller. Benny (almost 6) attempts to climb in beside him from the side, both hands gripping the edge. Abby (golden dog) sits next to the Yogibo looking in. The Yogibo has won. Three characters, clear positions, no extra limbs. ${hideBunny('tucked into the far side of the bean bag fabric folds, blending into the material color', 'soft fabric folds')}`,
  },
  {
    id: 268, name: 'Robo-Sushi',
    prompt: `${STYLE} Subject: the family at a conveyor belt sushi restaurant. Danny (9) and Benny (almost 6) lean forward over the counter with wide eyes as colorful plates glide past on the belt. Josh (bald, dark beard) reaches toward one plate with one hand. Anna (11) studies a menu she holds with both hands. Rachel already has a piece of sushi in one hand. Each person has their own space — no overlapping arms or shared hands. ${hidePanda('sitting on the conveyor belt far in the background, just another small plate going around', 'conveyor belt plate row')}`,
  },
  {
    id: 269, name: 'Bruno (the Rhinocorn)',
    prompt: `${STYLE} Subject: Bruno the Rhinocorn — a magnificent creature that is half rhinoceros, half unicorn. Solid rhino body, one large horn that is simultaneously a rhino horn and a unicorn horn, maximum dignity, regal pose in the backyard. Benny (almost 6, brown hair, red shirt) stands nearby looking up at Bruno with total awe, one hand pointing up. Bruno gazes into the distance. One boy, one magnificent creature, clear space between them. ${hideBunny('tucked in the lower background foliage, blending into the green leaves', 'green foliage')}`,
  },
  {
    id: 270, name: '3D Printer',
    prompt: `${STYLE} Subject: a 3D printer on a desk, mid-print, extruder moving purposefully. Josh (bald, dark beard) stands beside it with one hand on his chin and an expression of genuine uncertainty about whether it's working. The object being printed is ambiguous and unidentifiable. Warm workshop light. One man, one printer, one mysterious object taking shape. ${hidePanda('reflected in the shiny side panel of the printer, blending into the metallic surface', 'metallic panel reflection')}`,
  },
  {
    id: 271, name: 'Legos',
    prompt: `${STYLE} Subject: Benny (almost 6, brown hair, red shirt) sits in the middle of the living room floor completely surrounded by Legos, adding the final piece to a magnificent structure as tall as he is — both hands on the brick, focused. In the foreground: one single Lego brick sits alone on the floor, center of frame, directly in the path of Josh's approaching bare foot. Josh's foot is visible at the very bottom edge of the frame, mid-step. The creation is beautiful. The timing is terrible. Benny has two hands on the structure. The foot belongs to one person. ${hideBunny('built into the Lego creation in the background, same light-colored bricks blending in', 'light Lego brick row')}`,
  },
  {
    id: 272, name: 'Monkeys!',
    prompt: `${STYLE} Subject: three comically wise stuffed toy monkeys seated in a row on a shelf, each in a different thoughtful pose — one covering its ears with both hands, one shielding its eyes with both hands, one holding one paw to its mouth. They look like they know the answer to absolutely everything. Very philosophical. Very smug. Each monkey has exactly two hands, doing exactly one thing. ${hidePanda('between two of the monkeys in the back, blending into the shadow between them', 'shadow between figures')}`,
  },
  {
    id: 273, name: "Dad's Softball Gear",
    prompt: `${STYLE} Subject: the open trunk of a family car. In the corner: a softball glove, batting helmet, and cleats are permanently installed, alongside a half-zipped equipment bag with a batting glove hanging out. Josh (bald, dark beard) stands at the side of the car looking into the trunk with one hand on the trunk lid and a resigned expression. Rachel (dark hair, glasses) stands beside him with both arms crossed and one eyebrow raised. Two people, clear expressions, no extra hands. ${hideBunny('deep inside the equipment bag, blending into the dark fabric interior', 'dark bag interior')}`,
  },
  // ── ACTIONS ────────────────────────────────────────────────────────────────
  {
    id: 274, name: 'Get Coached',
    prompt: `${STYLE} Subject: Josh (bald, dark beard) stands at a whiteboard covered in diagrams and arrows, one hand pointing at the board, one hand at his side. Across the table sits one person (seen from behind) taking notes. The person taking notes has both hands on a notepad. Josh has two hands — one pointing, one at his side. Warm motivating atmosphere. ${hideBunny('on a bookshelf in the background, blending into business book spines', 'book spine colors')}`,
  },
  {
    id: 275, name: 'Build with Legos',
    prompt: `${STYLE} Subject: Danny (9, brown hair) and Benny (almost 6, red shirt) building an enormous Lego structure together in the living room — Lego bricks cover the entire floor. Danny places one brick on top with both hands while Benny hands him another with both hands. The structure reaches nearly to the ceiling. In the doorway: Josh (bald, dark beard) stands in socks with one foot raised, mid-decision about whether to enter. Each person has two hands doing one clear thing. ${hidePanda('built into the Lego structure in the background, blending into light-colored bricks', 'white Lego bricks')}`,
  },
  {
    id: 276, name: 'Dance Party',
    prompt: `${STYLE} Subject: the whole family in a spontaneous living room dance party. Josh (bald, dark beard) dances with both arms up. Rachel (dark hair, glasses) spins with both arms out. Anna (11) does her own move. Danny (9) attempts something ambitious. Benny (almost 6) just spins wildly. Abby (golden dog) runs excited laps around everyone's feet. Colorful socks on hardwood floor, disco ball light scattered across the scene. Each person has two arms doing one thing — clear separation between characters. ${hideBunny('tucked behind a couch leg in the corner, blending into the dark floor shadow', 'dark corner shadow')}`,
  },
  {
    id: 277, name: 'Watch Bluey',
    prompt: `${STYLE} Subject: the whole family crammed onto the couch watching an animated dog show on television. From left: Josh (bald, dark beard) at one end with one arm along the back of the couch. Rachel (dark hair, glasses) beside him. Anna (11) in the middle. Danny (9) and Benny (almost 6) squeezed in at the other end. Abby (golden dog) is in someone's lap. The TV glows. Every face is completely absorbed. Each person is in their own space with their own hands. ${hidePanda('on the TV stand beside the television, blending into the dark surface', 'dark TV stand')}`,
  },
  {
    id: 278, name: 'Take A Nap',
    prompt: `${STYLE} Subject: Rachel (dark hair, glasses) peacefully asleep on the couch, throw blanket pulled up, one arm resting at her side, afternoon light through the window behind her. In the background — clearly visible but not bothering her: Benny zooms past on a scooter with both hands on the handlebars. Danny sits on the floor with a controller in both hands. Anna reads on a beanbag with a book in both hands. Abby is curled up on the far end of the couch. Rachel is asleep. Everyone else is doing exactly what they want. ${hideBunny('tucked against Rachel\'s side under the blanket, blending into the throw blanket folds', 'throw blanket texture')}`,
  },
  {
    id: 279, name: 'Go to Shul',
    prompt: `${STYLE} Subject: the family in a warm synagogue. In the pew from left: Josh (bald, dark beard) holding an open book with both hands. Rachel (dark hair, glasses) beside him. Anna (11) on the other side. Danny (9) and Benny (almost 6) at the end. Stained-glass light through tall windows, Torah ark with decorative doors at the front. The congregation is mid-sit — everyone is in the process of sitting down. Each person has two hands on their prayer book or at their sides. ${hidePanda('on a window ledge in the background, blending into the stone sill', 'stone window ledge')}`,
  },
  {
    id: 280, name: 'Screen Time!',
    prompt: `${STYLE} Subject: Benny (almost 6, brown hair, red shirt) reaches toward a glowing tablet on the coffee table with one hand, eyes fixed on the screen. Josh (bald, dark beard) sits on the couch beside the table, one hand gently redirecting Benny's wrist. Benny's expression: maximum negotiation. Josh's expression: this is the fifth time today. One tablet, one child's hand, one parent's hand — clear and clean, no extra limbs. ${hideBunny('reflected in the tablet screen surface, blending into the glow of the interface', 'screen glow reflection')}`,
  },
  {
    id: 281, name: 'Papa Tells A Story',
    prompt: `${STYLE} Subject: Papa (silver hair, warm smile, blue polo) at the dinner table, one hand raised and gesturing dramatically mid-story. Danny (9, brown hair) leans forward on his elbows from one side of the table, completely hooked. Benny (almost 6, red shirt) leans in from the other side, fork frozen mid-air in one hand. Papa has one hand gesturing and one at the table. Danny has both elbows on the table. Benny has one hand holding a fork. The story is about Spidey. Or Chase. Or Pikachu. ${hidePanda('on the windowsill in the background, blending into the curtain fabric', 'curtain folds')}`,
  },
  {
    id: 282, name: 'Run Out of Gas',
    prompt: `${STYLE} Subject: a car pulled over on the highway shoulder, hazard lights blinking, fuel gauge on E visible through the windshield. The driver — seen through the window — holds a phone to one ear with one hand, other hand on the wheel, expression communicating that this has definitely happened before. No one else is in the scene. One car, one driver, one empty tank. ${hideBunny('in the back seat visible through the rear window, blending into the dark car interior', 'dark car interior')}`,
  },
  // ── EVENTS ─────────────────────────────────────────────────────────────────
  {
    id: 283, name: 'QFaRT',
    prompt: `${STYLE} Subject: Quality Family Reading Time in the living room. Josh (bald, dark beard) sits in the armchair holding a book with both hands. Rachel (dark hair, glasses) is at one end of the couch, book open in both hands. Anna (11) is at the other end of the couch, book up in both hands. Danny (9) lies on his stomach on the floor, book open in front of him, chin in both hands. Benny (almost 6) is upside-down on the beanbag, book held above his face. Abby is asleep in the middle of the floor. Nobody is reading together. It is exactly right. ${hideBunny('tucked between two books on the bookshelf, blending into cream book spines', 'book spine colors')}`,
  },
  {
    id: 284, name: 'Family Vacation',
    prompt: `${STYLE} Subject: the family at a roadside highway diner at midnight. Josh (bald, dark beard), Rachel (dark hair, glasses), Anna (11), Danny (9), and Benny (almost 6) are crammed into a diner booth. Hot dogs and fries on the table. Everyone is laughing. Each person has their own food and their own hands. Through the diner window in the background: their minivan in the parking lot. This was not the plan. This is better. ${hidePanda('pressed against the minivan rear window in the parking lot background, blending into the dark glass', 'dark window glass')}`,
  },
  {
    id: 285, name: 'Sibling Love',
    prompt: `${STYLE} Subject: Anna (11, brown hair, blue jacket), Danny (9, brown hair), and Benny (almost 6, red shirt) in a full three-way theatrical argument. All three face each other in a triangle. Anna points at Danny with one hand, other hand on her hip. Danny points at Benny with one hand, other arm crossed. Benny points at Anna with one hand, other arm at his side. Maximum dramatic injustice on all three faces. Abby (golden dog) sits to the side watching with a tired expression. Each child has exactly two hands doing one clear thing. They love each other enormously. ${hideBunny('on a shelf behind them, blending into the background decor colors', 'shelf decor')}`,
  },
];

// ── Image generation ─────────────────────────────────────────────────────────

// Variant tweaks — appended to the base prompt to push the model toward genuinely different compositions
const VARIANT_NUDGES = [
  `Composition: close-up portrait framing, subject fills most of the frame, warm focused lighting.`,
  `Composition: wide establishing shot, subject small in a richly detailed environment, dynamic background storytelling.`,
  `Composition: three-quarter angle, subject caught mid-action, bold graphic shapes and high-energy posing.`,
];

async function generateImage(entry: CardEntry, variantIndex = 0): Promise<Buffer> {
  const nudge = VARIANT_NUDGES[variantIndex % VARIANT_NUDGES.length];
  const promptWithNudge = variantIndex > 0 ? `${entry.prompt} ${nudge}` : entry.prompt;

  const parts: any[] = [];
  if (entry.refPhotos) {
    for (const photoPath of entry.refPhotos) {
      if (fs.existsSync(photoPath)) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: fs.readFileSync(photoPath).toString('base64') } });
      } else {
        console.log(`  (no ref photo at ${photoPath}, text-only)`);
      }
    }
  }
  parts.push({ text: promptWithNudge });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['IMAGE', 'TEXT'] } as any,
  });

  const responseParts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = responseParts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart?.inlineData?.data) throw new Error(`No image returned for ${entry.name}`);
  return Buffer.from(imagePart.inlineData.data, 'base64');
}

// ── Browser picker ────────────────────────────────────────────────────────────

function buildPickerHtml(name: string, buffers: Buffer[], ts: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Pick art — ${name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f13;color:#e8e8e8;min-height:100vh;padding:2rem}
  h1{text-align:center;font-size:1.3rem;color:#ffd54f;margin-bottom:.3rem}
  .sub{text-align:center;font-size:.8rem;color:#555;margin-bottom:1.8rem}
  .grid{display:flex;gap:1.2rem;max-width:1020px;margin:0 auto;justify-content:center}
  .card{flex:1;max-width:310px;border-radius:10px;overflow:hidden;background:#1a1a24;border:2px solid transparent;cursor:pointer;transition:border-color .15s,transform .15s,box-shadow .15s}
  .card:hover{border-color:#3a5a8a;transform:translateY(-2px)}
  .card.sel{border-color:#60a5fa;box-shadow:0 0 0 3px rgba(96,165,250,.25)}
  .card img{width:100%;display:block;aspect-ratio:1;object-fit:cover}
  .lbl{padding:.5rem;text-align:center;font-size:.82rem;color:#555}
  .card.sel .lbl{color:#60a5fa}
  .bar{text-align:center;margin-top:1.6rem}
  button{padding:.65rem 2.2rem;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:.95rem;font-weight:600;cursor:pointer;display:none}
  button.show{display:inline-block}
  button:hover{background:#1d4ed8}
  .info{margin-top:.5rem;font-size:.82rem;color:#60a5fa;min-height:1.1em}
  .done{text-align:center;padding:4rem 2rem}
  .done h2{font-size:1.3rem;color:#a5d6a7;margin-bottom:.5rem}
  .done p{color:#555;font-size:.85rem}
</style>
</head>
<body>
<h1>Pick art for: ${name}</h1>
<p class="sub">Click a variant to select, then confirm. Server closes automatically.</p>
<div class="grid">
${buffers.map((_, i) => `  <div class="card" data-n="${i + 1}" onclick="pick(${i + 1})">
    <img src="/img/${ts}/${i + 1}.png" alt="Variant ${i + 1}" />
    <div class="lbl">Variant ${i + 1}</div>
  </div>`).join('\n')}
</div>
<div class="bar">
  <button id="btn" onclick="go()">Use variant <span id="n"></span></button>
  <div class="info" id="info"></div>
</div>
<script>
let sel=null;
function pick(n){sel=n;document.querySelectorAll('.card').forEach(c=>c.classList.remove('sel'));document.querySelector('[data-n="'+n+'"]').classList.add('sel');document.getElementById('info').textContent='Variant '+n+' selected';document.getElementById('n').textContent=n;document.getElementById('btn').classList.add('show');}
function go(){if(!sel)return;fetch('/select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({variant:sel})}).then(()=>{document.body.innerHTML='<div class="done"><h2>✓ Variant '+sel+' selected</h2><p>Uploading… check terminal for next card.</p></div>';});}
</script>
</body>
</html>`;
}

function openPicker(name: string, buffers: Buffer[]): Promise<number> {
  return new Promise((resolve) => {
    const ts = Date.now().toString();
    const html = buildPickerHtml(name, buffers, ts);

    const server = http.createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
      }
      if (req.method === 'GET' && req.url?.startsWith(`/img/${ts}/`)) {
        const idx = parseInt(req.url.split('/').pop()?.replace('.png', '') ?? '0', 10) - 1;
        if (idx >= 0 && idx < buffers.length) {
          res.writeHead(200, { 'Content-Type': 'image/png' });
          res.end(buffers[idx]);
          return;
        }
      }
      if (req.method === 'POST' && req.url === '/select') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          const { variant } = JSON.parse(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          setTimeout(() => { server.close(); resolve(variant - 1); }, 200);
        });
        return;
      }
      res.writeHead(404); res.end();
    });

    server.listen(PICKER_PORT, '127.0.0.1', () => {
      exec(`open "http://localhost:${PICKER_PORT}"`);
      console.log(`  Picker open → http://localhost:${PICKER_PORT}`);
    });
  });
}

// ── Upload ────────────────────────────────────────────────────────────────────

async function uploadBuffer(entry: CardEntry, buffer: Buffer) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const safeName = entry.name.replace(/[^a-zA-Z0-9]/g, '-');
  const localPath = path.join(OUTPUT_DIR, `${entry.id}-${safeName}.png`);
  fs.writeFileSync(localPath, buffer);
  console.log(`  Saved: ${localPath}`);

  const storagePath = `cards/release-${RELEASE_ID}/${entry.id}.png`;
  const { error: uploadError } = await supabase.storage
    .from('card-art').upload(storagePath, buffer, { contentType: 'image/png', upsert: true });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('card-art').getPublicUrl(storagePath);
  console.log(`  Uploaded: ${urlData.publicUrl}`);

  const { error: dbError } = await supabase
    .from('cards').update({ art_url: urlData.publicUrl }).eq('id', entry.id);
  if (dbError) throw dbError;

  console.log(`  ✓ Done`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function generateVariants(entry: CardEntry): Promise<Buffer[]> {
  const buffers: Buffer[] = [];
  for (let i = 0; i < 3; i++) {
    buffers.push(await generateImage(entry, i));
    if (i < 2) await new Promise(r => setTimeout(r, 1500));
  }
  return buffers;
}

async function main() {
  const targetId = process.env.CARD_ID ? parseInt(process.env.CARD_ID) : null;
  const startId = process.env.START_ID ? parseInt(process.env.START_ID) : null;
  const pickerMode = process.env.PICK === '1';
  const batch = targetId
    ? CARDS.filter(c => c.id === targetId)
    : startId
    ? CARDS.filter(c => c.id >= startId)
    : CARDS;

  if (pickerMode) {
    console.log(`Picker mode — ${batch.length} card(s), 3 variants each. Browser opens per card.\n`);
  } else {
    console.log(`Auto mode — generating art for ${batch.length} card(s)...\n`);
  }

  if (pickerMode && batch.length > 1) {
    // Pipeline: pre-generate up to 2 cards ahead so generation runs while picker is open.
    // variantQueue[i] is a Promise<Buffer[]> that starts generating as soon as we kick it off.
    const variantQueue: Array<Promise<Buffer[]> | null> = batch.map(() => null);

    const ensureGenerating = (idx: number) => {
      if (idx >= batch.length || variantQueue[idx]) return;
      console.log(`  [pre-gen] Starting variants for: ${batch[idx].name}`);
      variantQueue[idx] = generateVariants(batch[idx]);
    };

    // Kick off first five cards immediately
    ensureGenerating(0);
    ensureGenerating(1);
    ensureGenerating(2);
    ensureGenerating(3);
    ensureGenerating(4);

    for (let i = 0; i < batch.length; i++) {
      const entry = batch[i];
      console.log(`\n[${entry.name}] (id: ${entry.id})`);

      // Ensure current card is generating (may already be)
      ensureGenerating(i);

      const buffers = await variantQueue[i]!;

      // While picker is open, pre-generate the next 5
      ensureGenerating(i + 1);
      ensureGenerating(i + 2);
      ensureGenerating(i + 3);
      ensureGenerating(i + 4);
      ensureGenerating(i + 5);

      console.log('  Opening picker...');
      const chosen = await openPicker(entry.name, buffers);
      console.log(`  Selected variant ${chosen + 1} — uploading...`);
      await uploadBuffer(entry, buffers[chosen]);
    }

    console.log('\nAll done!');
    return;
  }

  for (const entry of batch) {
    console.log(`\n[${entry.name}] (id: ${entry.id})`);

    if (pickerMode) {
      // Single-card picker (no pipeline needed)
      console.log('  Generating 3 variants...');
      const buffers = await generateVariants(entry);
      console.log('  Opening picker...');
      const chosen = await openPicker(entry.name, buffers);
      console.log(`  Selected variant ${chosen + 1} — uploading...`);
      await uploadBuffer(entry, buffers[chosen]);
    } else {
      const buffer = await generateImage(entry);
      await uploadBuffer(entry, buffer);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('\nAll done!');
}

main().catch(console.error);
