// Nouns Wave v0 — a habit chain. One block per day seals the day's atomic habits.
// Each block links to the previous block's hash; the block's own hash draws that day's Noun
// from the official CC0 Nouns traits. Small habits, compounding in public.
//
// Usage (run from a dir with node_modules: @nouns/assets @nouns/sdk sharp):
//   node nouns-wave.js chain.json day.json outdir
// day.json: {"date":"2026-11-22","habits":{"draw":8,"mint":8,"post":1,"gift":0,"note":1,"ship":2},
//            "receipts":["#mint-queue m_6z0x233j38", ...]}
// Writes: chain.json (block appended), outdir/wave-<height>.png (card), outdir/wave-<height>.webp (32x32 Noun).
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nm = p => require(path.join(process.cwd(), 'node_modules', p));
const { ImageData } = nm('@nouns/assets');
const { buildSVG } = nm('@nouns/sdk');
const sharp = nm('sharp');

const HABITS = ['draw', 'mint', 'post', 'gift', 'note', 'ship'];
const LABEL = { draw: 'draw a noun', mint: 'mint it', post: 'post it', gift: 'gift one', note: 'write a note', ship: 'ship code' };
const [chainPath, dayPath, outDir = 'wave'] = process.argv.slice(2);
const chain = fs.existsSync(chainPath) ? JSON.parse(fs.readFileSync(chainPath, 'utf8')) : { name: 'Nouns Wave', version: 0, blocks: [] };
const day = JSON.parse(fs.readFileSync(dayPath, 'utf8'));
const canon = o => JSON.stringify(o, Object.keys(o).sort());
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const prev = chain.blocks[chain.blocks.length - 1];
if (prev && prev.date >= day.date) throw new Error('block for ' + day.date + ' already sealed (last: ' + prev.date + ')');
const height = chain.blocks.length;

// streaks: a habit's streak grows when it is done (>0) on consecutive sealed days, resets on a zero
const streak = {};
for (const h of HABITS) {
  const done = (day.habits[h] || 0) > 0;
  streak[h] = done ? (prev ? (prev.streak[h] || 0) : 0) + 1 : 0;
}
const kept = HABITS.filter(h => (day.habits[h] || 0) > 0).length;
const totals = {};
for (const h of HABITS) totals[h] = (prev ? prev.totals[h] : 0) + (day.habits[h] || 0);

const body = {
  height, date: day.date, prev: prev ? prev.hash : '0'.repeat(64),
  habits: Object.fromEntries(HABITS.map(h => [h, day.habits[h] || 0])),
  receipts: day.receipts || [],
};
const hash = crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex');

// hash → Noun: four bytes pick body, accessory, head, glasses; one bit picks the bg
const I = ImageData.images;
const b = i => parseInt(hash.slice(i * 4, i * 4 + 4), 16);
const parts = [I.bodies[b(0) % I.bodies.length], I.accessories[b(1) % I.accessories.length],
  I.heads[b(2) % I.heads.length], I.glasses[b(3) % I.glasses.length]];
const bg = ImageData.bgcolors[b(4) % ImageData.bgcolors.length];
const traits = parts.map(p => p.filename);

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const svgNoun = buildSVG(parts, ImageData.palette, bg);
  const big = await sharp(Buffer.from(svgNoun)).resize(320, 320, { kernel: 'nearest' }).png().toBuffer();
  const nat = await sharp(big).resize(32, 32, { kernel: 'nearest' }).webp({ lossless: true }).toBuffer();
  fs.writeFileSync(path.join(outDir, `wave-${height}.webp`), nat);

  const W = 1080, H = 1350, S = 14, N = 32 * S, ink = '1a1a1a', soft = '1a1a1a99';
  let rows = '', y = 760;
  for (const h of HABITS) {
    const n = day.habits[h] || 0, on = n > 0;
    rows += `<circle cx="96" cy="${y - 12}" r="14" fill="${on ? '#' + ink : 'none'}" stroke="#${ink}" stroke-width="3"/>`
      + `<text x="132" y="${y}" font-family="DM Sans" font-weight="700" font-size="38" fill="#${on ? ink : soft}">${esc(LABEL[h])}</text>`
      + `<text x="${W - 300}" y="${y}" font-family="Anonymous Pro" font-size="30" fill="#${ink}" text-anchor="end">${n}</text>`
      + `<text x="${W - 72}" y="${y}" font-family="Anonymous Pro" font-size="30" fill="#${soft}" text-anchor="end">streak ${streak[h]}</text>`;
    y += 64;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="100%" height="100%" fill="#${bg}"/>
<text x="72" y="118" font-family="Archivo Black" font-size="64" fill="#${ink}" letter-spacing="2">NOUNS WAVE</text>
<text x="${W - 72}" y="104" font-family="Anonymous Pro" font-size="26" fill="#${soft}" text-anchor="end">BLOCK ${height}${height === 0 ? ' · GENESIS' : ''}</text>
<text x="${W - 72}" y="136" font-family="Anonymous Pro" font-size="26" fill="#${soft}" text-anchor="end">${esc(day.date)}</text>
<rect x="72" y="160" width="${W - 144}" height="4" fill="#${ink}"/>
<text x="72" y="690" font-family="DM Sans" font-weight="700" font-size="46" fill="#${ink}">${kept} of 6 habits kept</text>
${rows}
<rect x="72" y="1150" width="${W - 144}" height="2" fill="#${soft}"/>
<text x="72" y="1200" font-family="Anonymous Pro" font-size="26" fill="#${ink}">hash ${hash.slice(0, 16)}…${hash.slice(-8)}</text>
<text x="72" y="1244" font-family="Anonymous Pro" font-size="26" fill="#${soft}">prev ${body.prev.slice(0, 16)}… · this hash drew this noun</text>
<text x="72" y="1290" font-family="Anonymous Pro" font-size="26" fill="#${soft}">small habits, every day, on the loom and tezos · cc0</text>
</svg>`;
  const noun = await sharp(nat).resize(N, N, { kernel: 'nearest' }).png().toBuffer();
  await sharp(Buffer.from(svg)).composite([{ input: noun, left: (W - N) / 2, top: 196 }]).png().toFile(path.join(outDir, `wave-${height}.png`));

  chain.blocks.push({ ...body, hash, streak, totals, kept, noun: { traits, bg, sha256: crypto.createHash('sha256').update(nat).digest('hex'), b64: nat.toString('base64') } });
  fs.writeFileSync(chainPath, JSON.stringify(chain, null, 1));
  console.log(JSON.stringify({ height, hash, kept, streak, traits, bg }));
})();
