// scripts/style-browser.ts
// Usage: npx tsx scripts/style-browser.ts
// Opens a local web page showing all release styles with sample images.
// Prints SELECTED_RELEASE=N to stdout when the user confirms a selection, then exits.
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

const PORT = 3456;
const ART_SAMPLES_DIR = path.join(process.cwd(), 'art-samples');

const STYLES = [
  {
    id: 1,
    theme: 'Greek Mythology',
    directive: 'Neoclassical oil painting — marble textures, deep cerulean and gold palette, divine light from above, reminiscent of Jacques-Louis David',
    colors: ['#1a3a6b', '#c5a028', '#f0f0e8'],
    sample: 'v2/R1-Zeus-panda.png',
  },
  {
    id: 2,
    theme: 'Wild West',
    directive: 'Vintage sepia daguerreotype / woodcut — warm burnt sienna and tan, dusty frontier landscapes, dramatic silhouettes at sunset',
    colors: ['#8b5e3c', '#d4a56a', '#f5e6c8'],
    sample: 'v2/R2-WantedPoster-bunny.png',
  },
  {
    id: 3,
    theme: 'Dinosaurs',
    directive: 'Victorian natural history illustration — precise Audubon-style linework, earth tones and jungle greens, botanical-scientific composition, white vignette border',
    colors: ['#2d5a27', '#8b7355', '#c8c89a'],
    sample: null,
  },
  {
    id: 4,
    theme: 'Outer Space',
    directive: 'NASA concept art meets retro 1960s pulp sci-fi — deep navy background, electric cyan and silver, geometric retro spacecraft shapes',
    colors: ['#050518', '#00bcd4', '#9090b0'],
    sample: 'v2/R4-BlackHole-bunny.png',
  },
  {
    id: 5,
    theme: 'Music',
    directive: 'Art Deco poster / 1970s psychedelic album cover — bold geometric patterns, vibrant neons on black, swirling color gradients',
    colors: ['#12001e', '#ff1493', '#ffd700'],
    sample: null,
  },
  {
    id: 6,
    theme: 'Zombies',
    directive: 'Spooky-fun Halloween cartoon — muted greens, purples, and grays with warm amber accents, bold outlines, Goosebumps style, ages 8+',
    colors: ['#2d4a35', '#6b4f8a', '#d4824a'],
    sample: 'v2/R6-PlagueDoctor-panda.png',
  },
];

function buildHtml(): string {
  const cards = STYLES.map(s => {
    const imgTag = s.sample
      ? `<img src="/sample/${s.sample}" alt="${s.theme} sample" />`
      : `<div class="swatch" style="background: linear-gradient(135deg, ${s.colors.join(', ')})"><span>No sample yet</span></div>`;

    return `<div class="card" data-id="${s.id}" onclick="pick(${s.id})">
      <div class="thumb">${imgTag}<span class="badge">R${s.id}</span></div>
      <div class="info"><h3>${s.theme}</h3><p>${s.directive}</p></div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mathemagic — Choose a Release Style</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f13;color:#e8e8e8;min-height:100vh;padding:2rem}
  h1{text-align:center;font-size:1.6rem;color:#fff;margin-bottom:.3rem}
  .sub{text-align:center;color:#666;font-size:.85rem;margin-bottom:1.8rem}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.1rem;max-width:900px;margin:0 auto}
  .card{border-radius:10px;overflow:hidden;background:#1a1a24;border:2px solid transparent;cursor:pointer;transition:border-color .15s,transform .15s,box-shadow .15s}
  .card:hover{border-color:#3a5a8a;transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.5)}
  .card.sel{border-color:#60a5fa;box-shadow:0 0 0 3px rgba(96,165,250,.25),0 6px 20px rgba(0,0,0,.5)}
  .thumb{position:relative;aspect-ratio:1;overflow:hidden;background:#111}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .swatch{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
  .swatch span{font-size:.7rem;color:rgba(255,255,255,.45);background:rgba(0,0,0,.35);padding:3px 8px;border-radius:4px}
  .badge{position:absolute;top:7px;left:7px;background:rgba(0,0,0,.72);color:#fff;font-size:.7rem;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:.04em}
  .info{padding:.8rem}
  .info h3{font-size:.9rem;font-weight:600;color:#fff;margin-bottom:.25rem}
  .info p{font-size:.72rem;color:#777;line-height:1.45}
  .bar{text-align:center;margin-top:1.8rem}
  .bar button{padding:.65rem 2.2rem;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:.95rem;font-weight:600;cursor:pointer;display:none;transition:background .15s}
  .bar button:hover{background:#1d4ed8}
  .bar button.show{display:inline-block}
  .bar .lbl{margin-top:.5rem;font-size:.82rem;color:#60a5fa;min-height:1.1em}
  .done{text-align:center;padding:5rem 2rem}
  .done h2{font-size:1.4rem;color:#60a5fa;margin-bottom:.5rem}
  .done p{color:#666}
</style>
</head>
<body>
<h1>Mathemagic — Choose a Release Style</h1>
<p class="sub">Click a style to preview it, then confirm your selection.</p>
<div class="grid">${cards}</div>
<div class="bar">
  <button id="btn" onclick="confirm_()">Use this style →</button>
  <div class="lbl" id="lbl"></div>
</div>
<script>
const styles=${JSON.stringify(STYLES.map(s=>({id:s.id,theme:s.theme})))};
let sel=null;
function pick(id){
  sel=id;
  document.querySelectorAll('.card').forEach(c=>c.classList.remove('sel'));
  document.querySelector('[data-id="'+id+'"]').classList.add('sel');
  const s=styles.find(x=>x.id===id);
  document.getElementById('lbl').textContent='Release '+id+' — '+s.theme;
  document.getElementById('btn').classList.add('show');
}
function confirm_(){
  if(!sel)return;
  fetch('/select',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({release:sel})})
    .then(()=>{document.body.innerHTML='<div class="done"><h2>✓ Release '+sel+' selected</h2><p>Return to your terminal — you can close this tab.</p></div>';});
}
</script>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(buildHtml());
    return;
  }

  if (req.method === 'GET' && req.url?.startsWith('/sample/')) {
    const rel = req.url.slice('/sample/'.length);
    const filePath = path.join(ART_SAMPLES_DIR, rel);
    if (fs.existsSync(filePath)) {
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end();
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/select') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const { release } = JSON.parse(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      console.log(`\nSELECTED_RELEASE=${release}`);
      const s = STYLES.find(x => x.id === release)!;
      console.log(`Theme: ${s.theme}`);
      console.log(`Style: ${s.directive}\n`);
      setTimeout(() => { server.close(); process.exit(0); }, 250);
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Style browser → ${url}`);
  exec(`open "${url}"`);
  console.log('Select a style in your browser, then confirm.');
});
