// scripts/generate-samples.ts
// Generates 3 image variations and opens a side-by-side comparison in your browser.
//
// Usage:
//   RELEASE_ID=1 npx tsx scripts/generate-samples.ts
//     → 3 style samples for Release 1 (Greek Mythology)
//
//   RELEASE_ID=2 SUBJECT="a wanted poster nailed to a saloon door" npx tsx scripts/generate-samples.ts
//     → 3 Wild West card art variations for that subject
//
//   PROMPT="your full custom prompt here" npx tsx scripts/generate-samples.ts
//     → 3 variations of any custom prompt, no style applied
//
//   RELEASE_ID=8 STYLE_PICKER=1 npx tsx scripts/generate-samples.ts
//     → 3 DIFFERENT art style candidates for Release 8 (Underwater), shown side-by-side

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as dotenv from 'dotenv';
import { exec } from 'child_process';
import { GoogleGenAI } from '@google/genai';

dotenv.config({ path: '.env.local' });

const PORT = 3457;
const SAMPLES_DIR = path.join(process.cwd(), 'art-samples', 'generated');

const RELEASE_STYLES: Record<number, { theme: string; directive: string }> = {
  1: { theme: 'Greek Mythology', directive: 'Neoclassical oil painting in the style of Jacques-Louis David — marble textures, deep cerulean and gold palette, formal symmetrical composition, divine light from above' },
  2: { theme: 'Wild West', directive: 'Vintage sepia daguerreotype / woodcut — warm burnt sienna and tan, scratched aged texture, dusty frontier landscapes, dramatic silhouettes at sunset' },
  3: { theme: 'Dinosaurs', directive: 'Victorian natural history illustration — precise linework like Audubon plates, earth tones and jungle greens, botanical-scientific composition, white vignette border' },
  4: { theme: 'Outer Space', directive: 'NASA concept art meets retro 1960s pulp sci-fi — deep navy background, electric cyan and silver, geometric retro spacecraft shapes, cosmic scale' },
  5: { theme: 'Music', directive: 'Art Deco poster / 1970s psychedelic album cover — bold geometric patterns, vibrant neons on black, musical notation elements, swirling color gradients' },
  6: { theme: 'Zombies', directive: "Spooky-fun Halloween cartoon — muted greens, purples, and grays with warm amber accents, expressive cartoonish characters, bold outlines, Goosebumps/children's graphic novel style, no blood or gore, suitable for ages 8+" },
};

interface StyleCandidate {
  label: string;
  directive: string;
}

interface StylePickerEntry {
  theme: string;
  subject: string;
  candidates: [StyleCandidate, StyleCandidate, StyleCandidate];
}

const STYLE_PICKER_DATA: Record<number, StylePickerEntry> = {
  8: {
    theme: 'Underwater',
    subject: 'an octopus emerging from a coral reef cave, surrounded by glowing tropical fish',
    candidates: [
      {
        label: 'A — Japanese Woodblock (ukiyo-e)',
        directive: 'Japanese woodblock print in the style of Hokusai — bold outlines, flat color fields, deep teal and seafoam palette, elegant stylized waves and sea creatures, traditional Japanese aesthetic, printmaking texture',
      },
      {
        label: 'B — Luminous Underwater Oil Painting',
        directive: 'Luminous underwater oil painting — deep blue atmosphere, bioluminescent glow effects, painterly realism, shafts of light filtering down from above, dramatic depth, wonder and mystery',
      },
      {
        label: 'C — Bright Tropical Marine Illustration',
        directive: 'Bright tropical marine illustration — clean friendly outlines, vivid coral reef colors, educational poster energy, cheerful and charming, suitable for ages 8+',
      },
    ],
  },
  9: {
    theme: 'Superheroes',
    subject: 'a caped hero landing on a city rooftop, fist raised, skyline glowing at dusk behind them',
    candidates: [
      {
        label: 'A — Silver Age Comic Book',
        directive: 'Silver Age comic book illustration — Ben-Day halftone dots, bold primary colors, Jack Kirby-era action poses, classic Marvel/DC panel energy, bold outlines, dynamic composition',
      },
      {
        label: 'B — Dark Cinematic Graphic Novel',
        directive: 'Dark cinematic graphic novel illustration in the style of Frank Miller — dramatic chiaroscuro shadows, moody and powerful, high contrast, cinematic noir atmosphere',
      },
      {
        label: 'C — Retro Saturday Morning Cartoon',
        directive: 'Retro Saturday morning cartoon illustration — clean round shapes, bright solid colors, 1980s superhero cartoon nostalgia, energetic and fun, expressive characters',
      },
    ],
  },
  10: {
    theme: 'Stuffed Animals',
    subject: 'a stuffed panda sitting on a cozy bedroom shelf surrounded by bunny and other plush toys',
    candidates: [
      {
        label: 'A — Soft Watercolor Children\'s Book',
        directive: 'Soft watercolor children\'s book illustration — gentle color washes, warm pastels, Beatrix Potter warmth, visible paper texture, plush fabric texture, intimate and cozy',
      },
      {
        label: 'B — Bold Flat Cartoon (Bluey-style)',
        directive: 'Bold flat cartoon illustration — clean thick outlines, bright saturated colors, simple shapes, reminiscent of Bluey or early Adventure Time, expressive characters, kid-friendly and joyful',
      },
      {
        label: 'C — Painterly Gouache Picture Book',
        directive: 'Painterly gouache illustration in the style of Jon Klassen or Carson Ellis — rich opaque colors, visible brushstrokes, slightly whimsical, understated charm, earthy and jewel tones',
      },
    ],
  },
  11: {
    theme: 'Art',
    subject: 'a colorful swirling abstract painting on a canvas with brushes and paint tubes scattered around',
    candidates: [
      {
        label: 'A — Kid\'s Crayon & Tempera Art Class',
        directive: 'Crayon and tempera paint style, looks like a talented child painted it — vivid primary colors, construction paper texture, visible crayon outlines, joyful rawness and energy',
      },
      {
        label: 'B — Abstract Expressionism',
        directive: 'Abstract expressionist painting — bold gestural brushstrokes, Pollock and Rothko energy, rich layered pigments, painterly texture, museum-quality dynamism',
      },
      {
        label: 'C — Pop Art (Warhol/Lichtenstein)',
        directive: 'Pop Art illustration in the style of Warhol and Lichtenstein — bold color blocks, Ben-Day halftone dots, graphic impact, ironic energy, flat and striking',
      },
    ],
  },
  12: {
    theme: 'Pets',
    subject: 'a golden retriever and a tabby cat curled up together on a cozy armchair, both asleep',
    candidates: [
      {
        label: 'A — Norman Rockwell / Saturday Evening Post',
        directive: 'Norman Rockwell / Saturday Evening Post illustration — warm nostalgic realism, golden tones, heartwarming Americana, soft edges, cozy domestic scene',
      },
      {
        label: 'B — Kawaii Illustration',
        directive: 'Cute kawaii illustration — round shapes, pastel colors, big expressive eyes, Japanese kawaii aesthetic, charming and endearing, simple and sweet',
      },
      {
        label: 'C — Vintage Pet Portrait Painting',
        directive: '18th-century European pet portraiture style — formal but endearing, warm rich tones, lush painterly background, pets depicted with dignity and character',
      },
    ],
  },
  13: {
    theme: 'Judaism',
    subject: 'a Hanukkah menorah fully lit with eight candles glowing warmly against a dark background',
    candidates: [
      {
        label: 'A — Medieval Hebrew Illuminated Manuscript',
        directive: 'Medieval Hebrew illuminated manuscript — gold leaf accents, intricate geometric borders, rich jewel tones (sapphire, crimson, gold), ornate calligraphic flourishes, Byzantine illumination quality',
      },
      {
        label: 'B — Eastern European Jewish Folk Art',
        directive: 'Eastern European Jewish folk art, Judaica papercutting tradition — intricate symmetrical patterns, warm earthy colors, traditional handcrafted aesthetic, deeply ornamental',
      },
      {
        label: 'C — Modern Sacred Geometric Art',
        directive: 'Modern sacred art with clean geometric composition — Star of David and menorah motifs woven into the design, deep navy and gold palette, contemporary but reverent and timeless',
      },
    ],
  },
  14: {
    theme: 'Pottery',
    subject: 'a potter\'s hands shaping a clay vessel on a spinning wheel, clay flying, intensely focused',
    candidates: [
      {
        label: 'A — Ancient Greek Red-Figure Pottery',
        directive: 'Ancient Greek red-figure pottery style — terracotta red-orange background, black silhouette figures in Attic vase style, clean elegant linework, museum artifact quality',
      },
      {
        label: 'B — Earthy Watercolor Craft Illustration',
        directive: 'Earthy watercolor illustration — warm earth tones, soft painterly gradients like fired glaze, artisanal and honest, loose and expressive brushwork',
      },
      {
        label: 'C — Japanese Mingei Folk Art',
        directive: 'Japanese folk art in the mingei tradition — bold simplified shapes, earthy warm tones, handmade quality, dignified simplicity, wabi-sabi aesthetic',
      },
    ],
  },
  15: {
    theme: 'Summer Camp',
    subject: 'kids roasting marshmallows around a campfire at dusk, pine trees and a lake in the background',
    candidates: [
      {
        label: 'A — Retro WPA / National Park Poster',
        directive: 'Retro 1960s WPA / national park poster style — screen-print look, limited bold colors (forest green, sunny yellow, sky blue), pine trees and lake, vintage summer camp badge energy',
      },
      {
        label: 'B — Warm Nostalgic Painted Illustration',
        directive: 'Warm nostalgic painted illustration — soft golden hour light, glowing campfire warmth, memory-book quality, painterly and atmospheric, summer memory feeling',
      },
      {
        label: 'C — Fun Camp Cartoon',
        directive: 'Fun energetic cartoon illustration — thick outlines, cheerful bright colors, camp brochure style, expressive characters, joyful and kid-friendly, ages 8+',
      },
    ],
  },
  16: {
    theme: 'Family Vacations',
    subject: 'a family of four standing in front of a famous landmark, maps in hand, grinning ear to ear',
    candidates: [
      {
        label: 'A — 1930s Art Deco Travel Poster',
        directive: '1930s Art Deco travel poster — bold flat color illustration, sunburst compositions, stylized landmarks, warm Mediterranean palette, vintage "Visit..." poster grandeur',
      },
      {
        label: 'B — Warm Family Scrapbook Illustration',
        directive: 'Warm painted family scrapbook illustration — hand-painted look, collage aesthetic, polaroid-photo energy, warmth of treasured memories, soft and nostalgic',
      },
      {
        label: 'C — Whimsical Adventure Book',
        directive: 'Whimsical adventure book illustration — soft painterly style, slightly surreal Wes Anderson color palette, pastel symmetrical composition, magical family adventure',
      },
    ],
  },
  17: {
    theme: 'Dogs',
    subject: 'a golden retriever catching a frisbee mid-air at a sunny park, ears flying, pure joy',
    candidates: [
      {
        label: 'A — Victorian Kennel Club Portrait',
        directive: 'Victorian kennel club / sporting dog portrait — lush oil painted background, dog rendered with dignity and personality, warm mahogany tones, British heritage sporting print',
      },
      {
        label: 'B — Children\'s Book Illustration',
        directive: 'Charming children\'s book illustration — friendly linework, warm colors, expressive dog personality, cozy and loveable, Rosemary Wells-style warmth',
      },
      {
        label: 'C — Bold Graphic Breed Poster',
        directive: 'Bold graphic dog breed poster illustration — clean vector shapes, vibrant colors, modern illustrated dog show poster, graphic design energy, striking and minimal',
      },
    ],
  },
  18: {
    theme: 'Food',
    subject: 'a freshly baked margherita pizza just pulled from a wood-fired oven, bubbling cheese, steam rising',
    candidates: [
      {
        label: 'A — French Culinary Engraving',
        directive: 'French culinary illustration in the style of Larousse Gastronomique — detailed pen-and-ink cross-hatching, cream background, food as haute cuisine, elegant 19th century cookbook',
      },
      {
        label: 'B — Retro Italian Restaurant Poster',
        directive: 'Retro Italian restaurant poster illustration — bold warm colors, tomato red and cream palette, 1950s Italian-American diner nostalgia, cheerful and appetizing',
      },
      {
        label: 'C — Bright Editorial Food Illustration',
        directive: 'Bright editorial food illustration — appetizing overhead composition, vivid saturated food colors, modern clean food styling, editorial magazine quality',
      },
    ],
  },
  19: {
    theme: 'Jungle Animals',
    subject: 'a jaguar perched on a mossy jungle branch, surrounded by lush tropical leaves and dappled light',
    candidates: [
      {
        label: 'A — Little Golden Books Style',
        directive: '1950s Little Golden Books / children\'s encyclopedia illustration — bright saturated colors, clean friendly linework, cheerful and educational, warm and inviting',
      },
      {
        label: 'B — Tropical Botanical Naturalist Plate',
        directive: 'Lush tropical botanical naturalist illustration — detailed precise linework, rich jungle greens and golds, Audubon-level scientific accuracy, breathtaking beauty',
      },
      {
        label: 'C — Adventure Movie Poster Illustration',
        directive: 'Jungle adventure movie poster illustration — dramatic atmospheric lighting, vivid saturated colors, epic cinematic scale, action-adventure energy',
      },
    ],
  },
  20: {
    theme: 'Legos',
    subject: 'a Lego castle under construction with minifig builders on scaffolding, colorful bricks everywhere',
    candidates: [
      {
        label: 'A — Isometric Pixel Art',
        directive: 'Isometric pixel art illustration — clean geometric pixels, bright primary Lego colors (red, yellow, blue, green), satisfying grid-based composition, retro video game sprite energy',
      },
      {
        label: 'B — Official Lego Box Art Style',
        directive: 'Official Lego box art illustration style — clean and cheerful, bright primary colors, dynamic characters, product catalog joyfulness, bold white highlights',
      },
      {
        label: 'C — Lego Brick Mosaic Art',
        directive: 'Lego brick mosaic art — the entire image is composed of visible Lego stud tiles, pixelated but clearly recognizable, clever trompe l\'oeil, bright primary color palette',
      },
    ],
  },
  21: {
    theme: 'Baseball',
    subject: 'a batter at the plate, mid-swing, stadium crowd visible behind them',
    candidates: [
      {
        label: 'A — 1987 Topps',
        directive: '1987 Topps baseball card style — iconic wood-grain textured border in warm oak brown, central action scene with a bold diagonal team-color banner across the bottom, bright saturated late-80s color printing, clean white inner border around the image, cheerful and energetic',
      },
      {
        label: 'B — 1952 Topps',
        directive: '1952 Topps baseball card style — hand-painted portrait illustration, soft painted artwork in the style of early 1950s Topps cards, slightly naive proportions, pastel wash background behind the player, bold block-letter team name at the bottom, white border with simple color accent, vintage printing color palette with warm faded tones',
      },
      {
        label: 'C — Modern Topps Chrome / Prizm',
        directive: 'Modern Topps Chrome / Prizm autograph card style — photorealistic illustration with a holographic rainbow refractor background, prismatic light diffraction effect, chrome metallic finish, crisp clean modern typography zone at bottom, a stylized autograph signature scrawled across the lower portion, premium high-gloss collectible feel',
      },
    ],
  },
  22: {
    theme: 'Work',
    subject: 'a busy open office, someone presenting a colorful chart at a whiteboard to engaged colleagues',
    candidates: [
      {
        label: 'A — Corporate Memphis Flat Design',
        directive: 'Corporate Memphis flat design illustration — clean vector shapes, minimal color palette, friendly geometric figures, modern tech startup aesthetic, bold simple composition',
      },
      {
        label: 'B — Vintage 1960s Office Scene',
        directive: 'Vintage 1960s Mad Men era advertising illustration — clean mid-century design, limited warm palette, retro sophistication, Saul Bass-adjacent graphic sensibility',
      },
      {
        label: 'C — New Yorker Editorial Illustration',
        directive: 'New Yorker magazine editorial illustration — sophisticated muted color palette, dry wit, slightly surreal, intellectual charm, refined and witty',
      },
    ],
  },
  23: {
    theme: 'Sports',
    subject: 'an athlete crossing the finish line of a race, arms raised in triumph, crowd a blurred cheer behind them',
    candidates: [
      {
        label: 'A — Duotone Sports Action',
        directive: 'Duotone sports action illustration — single bold color + black treatment, cinematic motion blur, dramatic perspective, Sports Illustrated energy, powerful and modern',
      },
      {
        label: 'B — Vintage Olympic Poster',
        directive: 'Vintage Olympic Games poster illustration (1936–1948 style) — heroic silhouette, limited warm palette, monumental composition, timeless athletic grandeur',
      },
      {
        label: 'C — Modern Sports Broadcast Graphic',
        directive: 'Modern sports broadcast graphic illustration — clean digital style, bold color gradients, dynamic compositional energy, contemporary ESPN/NBC Sports aesthetic',
      },
    ],
  },
};

type PromptEntry = { prompt: string; label: string };

let activePickerData: StylePickerEntry | null = null;
let activeReleaseId: number | null = null;

function buildPrompts(): PromptEntry[] {
  const releaseId = process.env.RELEASE_ID ? parseInt(process.env.RELEASE_ID, 10) : null;
  const isStylePicker = process.env.STYLE_PICKER === '1' || process.env.R8_STYLES === '1';

  // Style picker mode
  if (isStylePicker) {
    const rid = releaseId ?? 8;
    const pickerData = STYLE_PICKER_DATA[rid];
    if (!pickerData) {
      console.error(`No style picker data for RELEASE_ID=${rid}. Valid range: 8–23.`);
      process.exit(1);
    }
    activePickerData = pickerData;
    activeReleaseId = rid;
    return pickerData.candidates.map(c => ({
      prompt: `${c.directive}. Subject: ${pickerData.subject}. Square format, portrait orientation, no text or letters in the image, suitable for a trading card game.`,
      label: c.label,
    }));
  }

  const subject = process.env.SUBJECT;
  const customPrompt = process.env.PROMPT;

  if (customPrompt) {
    return [1, 2, 3].map(() => ({ prompt: customPrompt, label: 'Custom prompt' }));
  }

  if (releaseId !== null && !RELEASE_STYLES[releaseId]) {
    console.error(`Unknown RELEASE_ID=${releaseId}. For style-picking new releases, add STYLE_PICKER=1. For generating cards, valid values: 1–6.`);
    process.exit(1);
  }

  if (releaseId !== null && subject) {
    const style = RELEASE_STYLES[releaseId];
    const prompt = `${style.directive}. Subject: ${subject}. Square format, portrait orientation, no text or letters in the image, suitable for a trading card game.`;
    return [1, 2, 3].map(() => ({ prompt, label: `R${releaseId} — ${style.theme}: ${subject}` }));
  }

  if (releaseId !== null) {
    const style = RELEASE_STYLES[releaseId];
    const prompt = `${style.directive}. Demonstrate the full art style: show a characteristic scene with typical composition, lighting, color palette, and mood. Square format, no text or letters.`;
    return [1, 2, 3].map(() => ({ prompt, label: `R${releaseId} — ${style.theme} (style sample)` }));
  }

  console.error('Provide at least one of: PROMPT, RELEASE_ID, RELEASE_ID + SUBJECT, or RELEASE_ID=N STYLE_PICKER=1.\n');
  console.error('Examples:');
  console.error('  RELEASE_ID=8 STYLE_PICKER=1 npx tsx scripts/generate-samples.ts');
  console.error('  RELEASE_ID=1 npx tsx scripts/generate-samples.ts');
  console.error('  RELEASE_ID=2 SUBJECT="a sheriff at high noon" npx tsx scripts/generate-samples.ts');
  console.error('  PROMPT="your full custom prompt" npx tsx scripts/generate-samples.ts');
  process.exit(1);
}

async function generateOne(ai: GoogleGenAI, prompt: string, index: number, outDir: string): Promise<string> {
  console.log(`  [${index}/3] Generating...`);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { responseModalities: ['IMAGE', 'TEXT'] } as any,
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));
  if (!imagePart?.inlineData?.data) throw new Error(`No image returned for sample ${index}`);

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const filePath = path.join(outDir, `${index}.png`);
  fs.writeFileSync(filePath, buffer);
  console.log(`  [${index}/3] ✓ ${filePath}`);
  return filePath;
}

function buildHtml(entries: PromptEntry[], ts: string, pickerData: StylePickerEntry | null): string {
  const isStylePicker = pickerData !== null;
  const title = isStylePicker
    ? `Pick Art Style — ${pickerData!.theme}`
    : `Sample Comparison — ${entries[0].label}`;
  const subtitle = isStylePicker
    ? `Three different art styles for the same scene. Click to select, then confirm.`
    : `Prompt: ${entries[0].prompt.slice(0, 200)}${entries[0].prompt.length > 200 ? '…' : ''}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mathemagic — ${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f13;color:#e8e8e8;min-height:100vh;padding:2rem}
  h1{text-align:center;font-size:1.4rem;color:#fff;margin-bottom:.4rem}
  .subtitle{text-align:center;font-size:.72rem;color:#555;max-width:820px;margin:0 auto 1.8rem;line-height:1.5}
  .grid{display:flex;gap:1.2rem;max-width:1020px;margin:0 auto;justify-content:center;flex-wrap:wrap}
  .card{flex:1;min-width:260px;max-width:310px;border-radius:10px;overflow:hidden;background:#1a1a24;border:2px solid transparent;cursor:pointer;transition:border-color .15s,transform .15s,box-shadow .15s}
  .card:hover{border-color:#3a5a8a;transform:translateY(-2px)}
  .card.sel{border-color:#60a5fa;box-shadow:0 0 0 3px rgba(96,165,250,.25)}
  .card img{width:100%;display:block;aspect-ratio:1;object-fit:cover}
  .card-lbl{padding:.6rem .7rem;text-align:center;font-size:.78rem;color:#666;line-height:1.4}
  .card.sel .card-lbl{color:#60a5fa}
  .card-lbl strong{display:block;margin-bottom:.2rem;font-size:.82rem;color:#aaa}
  .card.sel .card-lbl strong{color:#60a5fa}
  .bar{text-align:center;margin-top:1.8rem}
  .bar button{padding:.65rem 2.2rem;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:.95rem;font-weight:600;cursor:pointer;display:none;transition:background .15s}
  .bar button:hover{background:#1d4ed8}
  .bar button.show{display:inline-block}
  .bar .info{margin-top:.5rem;font-size:.82rem;color:#60a5fa;min-height:1.1em}
  .done{text-align:center;padding:5rem 2rem}
  .done h2{font-size:1.4rem;color:#60a5fa;margin-bottom:.6rem}
  .done p{color:#555;font-size:.85rem}
</style>
</head>
<body>
<h1>${title}</h1>
<p class="subtitle">${subtitle}</p>
<div class="grid">
${entries.map((entry, i) => {
  const n = i + 1;
  const lbl = entry.label;
  const desc = isStylePicker ? pickerData!.candidates[i].directive.slice(0, 100) + '…' : '';
  return `  <div class="card" data-n="${n}" onclick="pick(${n})">
    <img src="/img/${ts}/${n}.png" alt="${lbl}" />
    <div class="card-lbl"><strong>${lbl}</strong>${desc ? `<span>${desc}</span>` : ''}</div>
  </div>`;
}).join('\n')}
</div>
<div class="bar">
  <button id="btn" onclick="go()">Use sample <span id="n"></span></button>
  <div class="info" id="info"></div>
</div>
<script>
let sel=null;
function pick(n){
  sel=n;
  document.querySelectorAll('.card').forEach(c=>c.classList.remove('sel'));
  document.querySelector('[data-n="'+n+'"]').classList.add('sel');
  document.getElementById('info').textContent='Sample '+n+' selected';
  document.getElementById('n').textContent=n;
  document.getElementById('btn').classList.add('show');
}
function go(){
  if(!sel)return;
  fetch('/select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sample:sel})})
    .then(()=>{document.body.innerHTML='<div class="done"><h2>✓ Sample '+sel+' selected</h2><p>Check your terminal for the file path and style directive.</p></div>';});
}
</script>
</body>
</html>`;
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not set in .env.local');
    process.exit(1);
  }

  const prompts = buildPrompts();
  const isStylePicker = activePickerData !== null;
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = path.join(SAMPLES_DIR, ts);
  fs.mkdirSync(outDir, { recursive: true });

  if (isStylePicker) {
    console.log(`\n=== ${activePickerData!.theme} — Style Selection ===`);
    console.log(`Subject: ${activePickerData!.subject}\n`);
    activePickerData!.candidates.forEach((c, i) => console.log(`  Style ${i + 1}: ${c.label}`));
    console.log('');
  } else {
    console.log(`\nGenerating 3 samples — ${prompts[0].label}`);
    console.log(`Prompt: ${prompts[0].prompt.slice(0, 130)}${prompts[0].prompt.length > 130 ? '…' : ''}\n`);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  for (let i = 0; i < prompts.length; i++) {
    await generateOne(ai, prompts[i].prompt, i + 1, outDir);
    if (i < prompts.length - 1) await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\nAll done. Opening browser comparison...\n');

  const html = buildHtml(prompts, ts, activePickerData);

  const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/img/')) {
      const parts = req.url.slice('/img/'.length).split('/');
      if (parts.length === 2) {
        const filePath = path.join(SAMPLES_DIR, parts[0], parts[1]);
        if (fs.existsSync(filePath)) {
          res.writeHead(200, { 'Content-Type': 'image/png' });
          res.end(fs.readFileSync(filePath));
          return;
        }
      }
      res.writeHead(404);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/select') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        const { sample } = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        const selected = path.join(outDir, `${sample}.png`);
        console.log(`\nSelected: Sample ${sample}`);
        if (isStylePicker && activePickerData && activeReleaseId !== null) {
          const chosen = activePickerData.candidates[sample - 1];
          console.log(`Style:    ${chosen.label}`);
          console.log(`\nStyle directive:\n\n  ${chosen.directive}\n`);

          // Persist to art-samples/selected-styles.json
          const stylesFile = path.join(process.cwd(), 'art-samples', 'selected-styles.json');
          let styles: Record<string, unknown> = {};
          if (fs.existsSync(stylesFile)) {
            try { styles = JSON.parse(fs.readFileSync(stylesFile, 'utf8')); } catch {}
          }
          styles[String(activeReleaseId)] = {
            theme: activePickerData.theme,
            label: chosen.label,
            directive: chosen.directive,
            sampleFile: selected,
            selectedAt: new Date().toISOString(),
          };
          fs.mkdirSync(path.dirname(stylesFile), { recursive: true });
          fs.writeFileSync(stylesFile, JSON.stringify(styles, null, 2));
          console.log(`Saved → art-samples/selected-styles.json\n`);
        }
        console.log(`File:     ${selected}\n`);
        setTimeout(() => { server.close(); process.exit(0); }, 250);
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.listen(PORT, '127.0.0.1', () => {
    exec(`open "http://localhost:${PORT}"`);
    console.log(`Comparison browser → http://localhost:${PORT}`);
  });
}

main().catch(err => { console.error(err); process.exit(1); });
