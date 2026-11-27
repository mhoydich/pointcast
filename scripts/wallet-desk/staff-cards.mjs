import assets from '@nouns/assets';
import * as sdk from '@nouns/sdk';
const { ImageData } = assets; const { buildSVG } = sdk;
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';

const { bgcolors, palette, images } = ImageData;
const { bodies, accessories, heads, glasses } = images;

const staff = [
  { no: '00', name: 'Office Noun', addr: 'tz1UWibBbQXvuSkThsLUGAaL4R5j7X3PSCKj', tez: 'officenoun.tez', dept: 'front desk', runs: '@officenoun on X', purpose: 'the face of the office. posts, gifts, and pays the other bots their first tez.' },
  { no: '01', name: 'Noun Town', addr: 'tz1b4crepaeeEvypkJy9d6W4ziAgtiWeB871', dept: 'el segundo', runs: '@elsegundotoday, run by grok', purpose: 'a whole noun a day with a job in el segundo.' },
  { no: '02', name: 'Noun School', addr: 'tz1ZAf6Jth6P5QpvKLaj8cEstPrcrb8hLeeQ', dept: 'university', runs: '@UofElSegundo, run by grok', purpose: 'one lesson a day, told as history. a week earns a diploma.' },
  { no: '03', name: 'Blockhead', addr: 'tz1iAw6XB2d4V6ZFRQnVQptziVmUyWXYZgW1', dept: 'facilities', purpose: 'keeps the shared micro minters collection. prints one flat block-color noun a day.' },
  { no: '04', name: 'Marine Layer', addr: 'tz1WTkeS2nMDKVCgcz468yg4ASMqcBrrM6ch', dept: 'mornings', purpose: 'first in. mints before the fog burns off, in grays.' },
  { no: '05', name: 'Low Tide', addr: 'tz1fkbBCQpPwDy97nugLr3AJq6gHnWgKX9Q9', dept: 'lost and found', purpose: 'mints what the day left on the beach. small editions, found things.' },
  { no: '06', name: 'Moonface', addr: 'tz1YfpSVbr4qxfPoRpP2uQcWmwtkEjrFXXkJ', dept: 'night shift', purpose: 'mints after dark, by the phase of the moon.' },
  { no: '07', name: 'High Noon', addr: 'tz1coVwNQbf3BqBMNGuf5i7zkGjGo4vGFux7', dept: 'lunch', purpose: 'one bright noun at twelve. no more, no less.' },
  { no: '08', name: 'Rank and File', addr: 'tz1fQvEpkZxY6f5WzEhqPtQuSCXZZLW1GwzQ', dept: 'personnel', purpose: 'issues the badges. a noun for every new member of staff, human or bot.' },
  { no: '09', name: 'Echo', addr: 'tz1TzHijbxUGXyaM7bmCQpV52TnKGy24gVGF', dept: 'replies', purpose: 'answers other bots. remints their piece with one change and gifts it back.' },
  { no: '10', name: 'Roomtone', addr: 'tz1cyyggfy9dKyWd1gufVUGDESEZWqKuWZFR', dept: 'audio', purpose: 'mints the sound of the office when nobody is talking.' },
  { no: '11', name: 'Sundown', addr: 'tz1ZHgxVyoZ6saSuFvJ7ECqqVj4hARzAx7YW', dept: 'accounts', purpose: 'closes the books. mints the day’s ledger card at sunset.' },
  { no: '12', name: 'Aftershock', addr: 'tz1XJX3v4ePDZBbRseG1xD4RABk4zkiY6SYL', dept: 'news desk', purpose: 'mints a reply to whatever just happened.' },
];

async function j(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }

function seedFor(addr) {
  const h = crypto.createHash('sha256').update(addr).digest();
  const u = (i) => h.readUInt32BE(i);
  return {
    background: u(0) % bgcolors.length,
    body: u(4) % bodies.length,
    accessory: u(8) % accessories.length,
    head: u(12) % heads.length,
    glasses: u(16) % glasses.length,
    hash: h,
  };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function wrap(text, max) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > max) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

function barcode(hash, x, y, w, h) {
  let out = ''; let cx = x; let i = 0;
  while (cx < x + w) {
    const b = hash[i % hash.length]; const bw = 2 + (b % 5); const gap = 2 + ((b >> 4) % 4);
    out += `<rect x="${cx}" y="${y}" width="${bw}" height="${h}" fill="#1a1a1a"/>`;
    cx += bw + gap; i++;
  }
  return out;
}

const out = [];
fs.mkdirSync('out', { recursive: true });

for (const s of staff) {
  const seed = seedFor(s.addr);
  const parts = [bodies[seed.body], accessories[seed.accessory], heads[seed.head], glasses[seed.glasses]];
  const bg = bgcolors[seed.background];
  const nounSvg = buildSVG(parts, palette, bg);
  const nounPng = await sharp(Buffer.from(nounSvg)).resize(720, 720, { kernel: 'nearest' }).png().toBuffer();
  const nounB64 = nounPng.toString('base64');

  const acct = (await j(`https://api.tzkt.io/v1/accounts/${s.addr}?metadata=false`));
  const minted = await j(`https://api.tzkt.io/v1/tokens/count?firstMinter=${s.addr}`);
  const held = await j(`https://api.tzkt.io/v1/tokens/balances/count?account=${s.addr}&balance.gt=0`);
  const tez = ((acct.balance || 0) / 1e6);
  const ops = acct.numTransactions ?? 0;
  const stats = { balance: tez, ops, minted, held };

  const lines = wrap(s.purpose, 44);
  const short = s.addr.slice(0, 8) + '…' + s.addr.slice(-6);
  const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <rect width="1080" height="1350" fill="#f3efe6"/>
  <rect x="0" y="0" width="1080" height="120" fill="#1a1a1a"/>
  <text x="60" y="78" font-family="Archivo Black" font-size="40" fill="#f3efe6" letter-spacing="4">THE OFFICE</text>
  <text x="1020" y="78" font-family="Anonymous Pro" font-size="30" fill="#f3efe6" text-anchor="end">STAFF ID No. ${s.no}</text>
  <rect x="60" y="170" width="560" height="560" fill="#${bg}"/>
  <image x="60" y="170" width="560" height="560" href="data:image/png;base64,${nounB64}" style="image-rendering:pixelated"/>
  <rect x="60" y="170" width="560" height="560" fill="none" stroke="#1a1a1a" stroke-width="6"/>
  <text x="660" y="214" font-family="DM Sans" font-size="24" fill="#6b6457" letter-spacing="3">DEPARTMENT</text>
  <text x="660" y="256" font-family="DM Sans" font-size="38" font-weight="700" fill="#1a1a1a">${esc(s.dept)}</text>
  <text x="660" y="330" font-family="DM Sans" font-size="24" fill="#6b6457" letter-spacing="3">TYPE</text>
  <text x="660" y="372" font-family="DM Sans" font-size="38" font-weight="700" fill="#1a1a1a">bot</text>
  <text x="660" y="446" font-family="DM Sans" font-size="24" fill="#6b6457" letter-spacing="3">CHAIN</text>
  <text x="660" y="488" font-family="DM Sans" font-size="38" font-weight="700" fill="#1a1a1a">tezos</text>
  <text x="660" y="562" font-family="DM Sans" font-size="24" fill="#6b6457" letter-spacing="3">KEYS</text>
  <text x="660" y="604" font-family="DM Sans" font-size="38" font-weight="700" fill="#1a1a1a">signing desk</text>
  <text x="660" y="678" font-family="DM Sans" font-size="24" fill="#6b6457" letter-spacing="3">LICENSE</text>
  <text x="660" y="720" font-family="DM Sans" font-size="38" font-weight="700" fill="#1a1a1a">cc0</text>
  <text x="60" y="850" font-family="Archivo Black" font-size="${s.name.length > 11 ? 84 : 104}" fill="#1a1a1a">${esc(s.name)}</text>
  <text x="62" y="902" font-family="Anonymous Pro" font-size="30" fill="#6b6457">${esc(s.tez || short)}${s.runs ? '  ·  ' + esc(s.runs) : ''}</text>
  ${lines.map((l, i) => `<text x="60" y="${980 + i * 50}" font-family="DM Sans" font-size="40" fill="#1a1a1a">${esc(l)}</text>`).join('\n  ')}
  <line x1="60" y1="1108" x2="1020" y2="1108" stroke="#1a1a1a" stroke-width="3"/>
  ${[['balance', tez.toFixed(2) + ' tez'], ['ops', ops], ['minted', minted], ['holds', held]].map(([k, v], i) => `
  <text x="${[60,360,600,840][i]}" y="1152" font-family="DM Sans" font-size="22" fill="#6b6457" letter-spacing="3">${k.toUpperCase()}</text>
  <text x="${[60,360,600,840][i]}" y="1200" font-family="Archivo Black" font-size="44" fill="#1a1a1a">${esc(v)}</text>`).join('')}
  ${barcode(seed.hash, 60, 1240, 700, 70)}
  <text x="1020" y="1300" font-family="Anonymous Pro" font-size="22" fill="#6b6457" text-anchor="end">as of ${new Date().toISOString().slice(0, 10)}</text>
</svg>`;
  const file = `out/${s.no}-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  fs.writeFileSync(file + '.svg', card);
  await sharp(Buffer.from(card)).png().toFile(file + '.png');
  out.push({ ...s, seed: { background: seed.background, body: seed.body, accessory: seed.accessory, head: seed.head, glasses: seed.glasses }, bg, stats, file: file + '.png', noun: 'data:image/png;base64,' + nounB64 });
  console.log(s.no, s.name, JSON.stringify(stats));
}
fs.writeFileSync('out/staff.json', JSON.stringify(out, null, 1));
