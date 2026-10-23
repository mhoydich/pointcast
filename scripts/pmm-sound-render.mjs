#!/usr/bin/env node
/* Render every PMM earcon through real Web Audio in headless Chromium and check it.
   For every event × mood it renders the cue with an OfflineAudioContext through the same master
   chain the app uses, at full volume, and asserts: no NaN, no clipping, peak ≤ -6 dBFS, and an
   audible length (above -60 dBFS) within 10% of the shared timing table. It also loads the lab at
   390 and 1280 px and checks for console errors and horizontal scroll.

   node scripts/pmm-sound-render.mjs [--wav] [--json out.json] [--shots dir]
   --wav writes a few 22.05 kHz previews to public/pmm/sound/previews/.
   Needs playwright-core and a Chromium (PW_CHROMIUM, default /opt/pw-browsers/chromium). */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pub = join(root, 'public');
const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);

const require = createRequire(import.meta.url);
let chromium;
for (const p of ['playwright-core', '/opt/node-tools/node_modules/playwright-core']) {
  try { ({ chromium } = require(p)); break; } catch (_) {}
}
if (!chromium) { console.error('playwright-core not found'); process.exit(2); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (path.endsWith('/')) path += 'index.html';
  try { const body = await readFile(join(pub, path)); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body); }
  catch { res.writeHead(404); res.end('not found'); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
let failed = 0;
const fail = (msg) => { failed++; console.error(`FAIL ${msg}`); };

// 1. The lab renders at phone and desktop width.
for (const width of [390, 1280]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}/pmm/sound/`, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, buttons: document.querySelectorAll('button').length }));
  await page.click('#final button');
  const cap = await page.textContent('#caption');
  if (r.sw > r.iw) fail(`${width}px: horizontal scroll (${r.sw} > ${r.iw})`);
  if (errors.length) fail(`${width}px: console errors ${errors.join(' | ')}`);
  if (!/boot/.test(cap)) fail(`${width}px: pressing boot did not caption (${cap})`);
  if (opt('--shots')) await page.screenshot({ path: join(opt('--shots'), `pmm-sound-${width}.png`), fullPage: true });
  console.log(`lab ${width}px: scrollWidth ${r.sw}/${r.iw}, ${r.buttons} buttons, caption "${cap.slice(0, 60)}…", errors ${errors.length}`);
  await page.close();
}

// 2. Render every cue.
const page = await browser.newPage();
await page.goto(`${base}/pmm/sound/`, { waitUntil: 'networkidle' });
const results = await page.evaluate(async (wantWav) => {
  const S = await import('/pmm/sound/sound.js');
  const { SKETCHES, SKETCH_EVENTS } = await import('/pmm/sound/sketches.js');
  const SR = 48000;
  async function render(notes, ms) {
    const len = Math.ceil(SR * (ms / 1000 + 0.3));
    const ctx = new OfflineAudioContext(1, len, SR);
    const { input } = S.buildChain(ctx, 1);
    S.scheduleNotes(ctx, notes, input, 0);
    const d = (await ctx.startRendering()).getChannelData(0);
    let peak = 0, sum = 0, nan = 0, clip = 0, lastLoud = 0;
    for (let i = 0; i < d.length; i++) {
      const x = d[i];
      if (!Number.isFinite(x)) { nan++; continue; }
      const a = Math.abs(x); if (a > peak) peak = a; if (a >= 1) clip++; if (a > 0.001) lastLoud = i;
      sum += x * x;
    }
    const n = Math.max(1, lastLoud);
    return { peak, rms: Math.sqrt(sum / n), nan, clip, audibleMs: (lastLoud / SR) * 1000, data: wantWav ? Array.from(d.subarray(0, lastLoud + 1)) : null };
  }
  const out = [];
  const pairEvents = new Set(['receive', 'their-mood', 'connect']);
  for (const e of S.EVENTS) {
    for (const a of S.MOOD_IDS) for (const b of pairEvents.has(e) ? S.MOOD_IDS : ['calm']) {
      const r = await render(S.plan(e, { mood: a, theirMood: b }), S.DURATION_MS[e]);
      out.push({ sys: 'final', event: e, mood: a, theirMood: b, ...r, data: wantWav && ((e === 'receive' && a === 'calm' && ['hyped', 'low'].includes(b)) || (a === 'calm' && b === 'calm' && ['boot', 'connect', 'send', 'fail', 'settle'].includes(e)) || (e === 'their-mood' && a === 'calm' && b === 'low')) ? r.data : null });
    }
  }
  for (const [key, d] of Object.entries(SKETCHES)) for (const e of SKETCH_EVENTS) for (const a of S.MOOD_IDS) {
    const r = await render(d.plan(e, { mood: a, theirMood: 'hyped' }), S.DURATION_MS[e]);
    out.push({ sys: key, event: e, mood: a, theirMood: 'hyped', ...r, data: null });
  }
  return { out, durations: S.DURATION_MS };
}, flag('--wav'));

const dB = (x) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
const LIMIT = 10 ** (-6 / 20);
for (const r of results.out) {
  const tag = `${r.sys} ${r.event} ${r.mood}/${r.theirMood}`;
  const want = results.durations[r.event];
  if (r.nan) fail(`${tag}: ${r.nan} NaN samples`);
  if (r.clip) fail(`${tag}: ${r.clip} clipped samples`);
  if (r.sys === 'final' && r.peak > LIMIT) fail(`${tag}: peak ${dB(r.peak).toFixed(1)} dBFS`);
  if (r.sys === 'final' && Math.abs(r.audibleMs - want) > want * 0.1) fail(`${tag}: audible ${r.audibleMs.toFixed(0)} ms vs ${want}`);
}

// Report: per event, RMS and peak in dBFS across every mood rendered.
const rows = [];
for (const sys of ['final', 'sid', 'vcs', 'glass']) {
  const events = [...new Set(results.out.filter((r) => r.sys === sys).map((r) => r.event))];
  for (const e of events) {
    const rs = results.out.filter((r) => r.sys === sys && r.event === e);
    const rms = rs.map((r) => dB(r.rms)), pk = rs.map((r) => dB(r.peak)), ms = rs.map((r) => r.audibleMs);
    rows.push({ sys, event: e, n: rs.length, rmsMin: Math.min(...rms), rmsMax: Math.max(...rms), rmsMean: rms.reduce((a, b) => a + b, 0) / rms.length,
      peakMax: Math.max(...pk), msMin: Math.min(...ms), msMax: Math.max(...ms), want: results.durations[e] });
  }
}
console.log('\n| system | event | renders | RMS dBFS (mean, min to max) | worst peak dBFS | audible ms (min to max) | table ms |\n|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.sys} | ${r.event} | ${r.n} | ${r.rmsMean.toFixed(1)} (${r.rmsMin.toFixed(1)} to ${r.rmsMax.toFixed(1)}) | ${r.peakMax.toFixed(1)} | ${r.msMin.toFixed(0)} to ${r.msMax.toFixed(0)} | ${r.want} |`);
if (opt('--json')) await writeFile(opt('--json'), JSON.stringify({ rows, renders: results.out.map(({ data, ...r }) => r) }, null, 2));

// WAV previews: 22.05 kHz mono 16-bit, decimated from the 48 kHz render with a box filter.
if (flag('--wav')) {
  const dir = join(pub, 'pmm/sound/previews');
  await mkdir(dir, { recursive: true });
  let total = 0;
  for (const r of results.out.filter((x) => x.data)) {
    const SR = 22050, step = 48000 / SR, n = Math.floor(r.data.length / step);
    const buf = Buffer.alloc(44 + n * 2);
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28);
    buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) {
      const a = Math.floor(i * step), b = Math.max(a + 1, Math.floor((i + 1) * step));
      let s = 0; for (let j = a; j < b; j++) s += r.data[j] || 0;
      buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round((s / (b - a)) * 32767))), 44 + i * 2);
    }
    const name = r.event === 'receive' || r.event === 'their-mood' ? `${r.event}-from-${r.theirMood}.wav` : `${r.event}.wav`;
    await writeFile(join(dir, name), buf); total += buf.length;
  }
  console.log(`\npreviews: ${(total / 1024).toFixed(0)} KB in public/pmm/sound/previews/`);
  if (total > 300 * 1024) fail('previews over 300 KB');
}

await browser.close(); server.close();
console.log(failed ? `\n${failed} failures` : `\nall ${results.out.length} renders pass`);
process.exit(failed ? 1 : 0);
