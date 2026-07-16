// Wireframe Studio × Axie — backend (xAI / Grok Imagine, multi-image edit)
// Sends the user's photo + the Axie reference (assets/axie.png) to Grok so the
// model reproduces the exact Axie. Prompt + key live server-side.
//
// Setup:
//   1) npm install
//   2) put your key in a .env file:   XAI_API_KEY=xai-...
//   3) npm start   ->  http://localhost:3000
//
// Requires Node 18+ (built-in fetch).

require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFile } = require('child_process');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

const XAI_API_KEY = process.env.XAI_API_KEY;
const MODEL = process.env.XAI_IMAGE_MODEL || 'grok-imagine-image-quality';

// The prompt lives ONLY on the server. Users never see or edit it.
const PROMPT = `Hand-drawn retro WIREFRAME technical illustration — flat 2D white line-art on a solid black background. Everything is rendered as fine white wireframe / quad-topology grid lines wrapping the forms (like a retopology wireframe), drawn completely flat as line-art: no 3D perspective, no realistic rendering, no shading, no fills.

Main subject: a character inspired by the PERSON in the FIRST image (use their face, hair and vibe as inspiration) drawn in this flat wireframe line style — recognisable but artistic, with a cool, confident, effortlessly stylish look, calmly focused, looking down at the PCB. Match the person's actual features from the FIRST image as closely as possible — same hairstyle, face shape and distinctive details — so they are clearly recognisable as that person. Give them bold, well-defined stylised hair with clear flowing strands and volume — not faint. Seated, soldering a small PCB with a soldering iron; a thin wisp of white smoke rises from the soldering point on the PCB. A mechanical ROBOT body — segmented wireframe torso, shoulders, arms and joints, with some cables plugged into body ports.

Add exactly ONE small robot — Axi, from the SECOND image — in the bottom-right holding the PCB up toward the person. Only one Axi; never duplicate it.

No colour, no text, no logos, lots of negative space.`;

// Load the Axie reference once at startup -> data URI (sent as 2nd source image)
let AXIE_REF = null;
try {
  const p = path.join(__dirname, 'assets', 'axie.png');
  AXIE_REF = 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
  console.log('Axie reference loaded from assets/axie.png');
} catch (e) {
  console.warn('WARNING: assets/axie.png not found — generating without the Axie reference.');
}

// Optional STYLE anchor: drop the look you want at assets/style-ref.png
let STYLE_REF = null;
try {
  const p = path.join(__dirname, 'assets', 'style-ref.png');
  STYLE_REF = 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
  console.log('Style reference loaded from assets/style-ref.png');
} catch (e) {
  console.log('(No assets/style-ref.png yet — add one to lock the look to a reference image.)');
}

app.use(express.static(__dirname));

// List sponsor logos in assets/ (any image), excluding Axie, Anthropic, the style ref and Unicorn Mafia.
app.get('/api/logos', (req, res) => {
  try {
    const dir = path.join(__dirname, 'assets');
    const files = fs.readdirSync(dir)
      .filter(f => /\.(png|jpe?g|webp|svg)$/i.test(f))
      .filter(f => !/(axie|axiometa|style-ref|anthropic|um[-_]?white|unicorn|seedcamp)/i.test(f));
    res.json({ sponsors: files.sort() });
  } catch (e) {
    res.json({ sponsors: [] });
  }
});

async function urlToDataUri(url) {
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  const ct = r.headers.get('content-type') || 'image/png';
  return `data:${ct};base64,${buf.toString('base64')}`;
}

app.post('/api/generate', upload.single('image'), async (req, res) => {
  try {
    if (!XAI_API_KEY) return res.status(500).json({ error: 'Server missing XAI_API_KEY' });
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    // source photo + axie reference (+ optional style anchor)
    const photo = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const images = [{ type: 'image_url', url: photo }];
    if (AXIE_REF) images.push({ type: 'image_url', url: AXIE_REF });

    let prompt = PROMPT;
    if (STYLE_REF) {
      images.push({ type: 'image_url', url: STYLE_REF });
      prompt += '\n\nSTYLE ANCHOR: copy the exact wireframe line-art style, mesh/grid density, line weight and flat black-and-white treatment of the LAST reference image. Use that last image for STYLE ONLY — never copy its face, hair, pose or identity; the person\'s identity comes from the FIRST image.';
    }

    const r = await fetch('https://api.x.ai/v1/images/edits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${XAI_API_KEY}` },
      body: JSON.stringify({ model: MODEL, prompt, images, aspect_ratio: '1:1' })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || data.error || 'Upstream API error' });

    const item = (data.data && data.data[0]) || data;
    let image;
    if (item.b64_json) image = 'data:image/png;base64,' + item.b64_json;
    else if (item.url) image = await urlToDataUri(item.url);
    else return res.status(502).json({ error: 'No image returned by the model' });

    res.json({ image });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ---------- ANIMATE: Grok image-to-video -> ffmpeg -> looping GIF ----------
// Resolve ffmpeg even when it isn't on the Node process PATH (common with Homebrew on macOS)
const FFMPEG = process.env.FFMPEG_PATH
  || ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg', '/opt/local/bin/ffmpeg'].find(p => { try { return fs.existsSync(p); } catch (e) { return false; } })
  || 'ffmpeg';
const FF_ENV = { ...process.env, PATH: (process.env.PATH || '') + ':/opt/homebrew/bin:/usr/local/bin:/usr/bin:/opt/local/bin' };
console.log('ffmpeg path:', FFMPEG);
function ff(args) {
  return new Promise((resolve, reject) => {
    execFile(FFMPEG, args, { maxBuffer: 1 << 28, env: FF_ENV }, (e, so, se) => e ? reject(new Error(se || e.message)) : resolve());
  });
}
const MOTION_PROMPT = `Subtle, seamless looping animation of this flat white wireframe line-art image on solid black. The person gently moves as she solders the small PCB — small hand and soldering-iron motions — and a thin wisp of white smoke drifts and curls upward from the PCB. Keep the EXACT same flat white wireframe line-art style, no colour, no shading. Minimal camera movement, elegant and understated.`;

app.post('/api/animate', express.json({ limit: '30mb' }), async (req, res) => {
  const tmp = os.tmpdir();
  const id = crypto.randomBytes(6).toString('hex');
  const f = (s) => path.join(tmp, `wf-${id}${s}`);
  const cleanup = [];
  try {
    if (!XAI_API_KEY) return res.status(500).json({ error: 'Server missing XAI_API_KEY' });
    const { image, overlay, duration } = req.body || {};
    if (!image) return res.status(400).json({ error: 'No image provided' });

    // 1) start the video job
    const startR = await fetch('https://api.x.ai/v1/videos/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${XAI_API_KEY}` },
      body: JSON.stringify({ model: 'grok-imagine-video-1.5', prompt: MOTION_PROMPT, image: { url: image }, duration: duration || 5 })
    });
    const startData = await startR.json();
    if (!startR.ok) return res.status(startR.status).json({ error: startData.error?.message || startData.error || 'Video start failed' });
    const reqId = startData.request_id || startData.id;
    if (!reqId) return res.status(502).json({ error: 'No request_id returned by video API' });

    // 2) poll until done (up to ~5 min)
    let videoUrl = null;
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const pR = await fetch('https://api.x.ai/v1/videos/' + reqId, { headers: { Authorization: `Bearer ${XAI_API_KEY}` } });
      const pD = await pR.json();
      const st = (pD.status || '').toLowerCase();
      if (st === 'done' || st === 'completed' || st === 'succeeded') { videoUrl = pD.video?.url || pD.url || (pD.data && pD.data[0] && pD.data[0].url); break; }
      if (st === 'failed' || st === 'expired' || st === 'error') return res.status(502).json({ error: 'Video job ' + st });
    }
    if (!videoUrl) return res.status(504).json({ error: 'Video generation timed out' });

    // 3) download mp4
    const mp4 = f('.mp4'); cleanup.push(mp4);
    fs.writeFileSync(mp4, Buffer.from(await (await fetch(videoUrl)).arrayBuffer()));

    // 4) ffmpeg -> gif (overlay static branding if provided)
    const pal = f('-pal.png'); cleanup.push(pal);
    const gif = f('.gif'); cleanup.push(gif);
    let vsrc = mp4;
    if (overlay) {
      const ov = f('-ov.png'); cleanup.push(ov);
      fs.writeFileSync(ov, Buffer.from(overlay.split(',')[1], 'base64'));
      const overlaid = f('-ov.mp4'); cleanup.push(overlaid);
      await ff(['-y', '-i', mp4, '-i', ov, '-filter_complex', '[0:v]scale=1024:1024[b];[b][1:v]overlay=0:0', '-an', overlaid]);
      vsrc = overlaid;
    }
    await ff(['-y', '-i', vsrc, '-vf', 'fps=15,scale=720:-1:flags=lanczos,palettegen', pal]);
    await ff(['-y', '-i', vsrc, '-i', pal, '-lavfi', 'fps=15,scale=720:-1:flags=lanczos[x];[x][1:v]paletteuse', '-loop', '0', gif]);

    const gifBuf = fs.readFileSync(gif);
    res.setHeader('Content-Type', 'image/gif');
    res.send(gifBuf);
  } catch (err) {
    const msg = /ENOENT/.test(err.message) ? 'ffmpeg not found on this machine — install it with: brew install ffmpeg' : (err.message || 'Animate error');
    res.status(500).json({ error: msg });
  } finally {
    cleanup.forEach(p => { try { fs.unlinkSync(p); } catch (e) {} });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Wireframe Studio (Grok, multi-image) running on http://localhost:${PORT}`));
