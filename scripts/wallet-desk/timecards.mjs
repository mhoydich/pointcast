// Wallet desk time clock: one time card per micro minter, punched on a real El Segundo signal.
// Usage:  TZ=America/Los_Angeles node scripts/wallet-desk/timecards.mjs [YYYY-MM-DD]
// Needs:  npm i @nouns/assets @nouns/sdk sharp suncalc   (run from a scratch dir with those installed,
//         or install them at the repo root; nothing here is imported by the site build)
// Writes: public/wallet-desk/time-clock/<date>/tc-NN-<bot>.png, the-office-day.png, day.json, ticket.txt
// Sources: sun and moon from suncalc (computed, no network); tide from NOAA station 9410840 (Santa Monica);
//          balances from TzKT. If NOAA or TzKT can't be reached the card says so instead of guessing.
import assets from '@nouns/assets';
import * as sdk from '@nouns/sdk';
import sharp from 'sharp';
import { createRequire } from 'node:module';
const SunCalc = createRequire(import.meta.url)('suncalc');
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

if (process.env.TZ !== 'America/Los_Angeles') { console.error('Run with TZ=America/Los_Angeles so the day and times are Pacific.'); process.exit(1); }
const { ImageData } = assets; const { buildSVG } = sdk;
const { bgcolors, palette, images } = ImageData;
const { bodies, accessories, heads, glasses } = images;
const LAT = 33.9192, LNG = -118.4165;

const today = new Date(); const pad = (n) => String(n).padStart(2, '0');
const ymd = process.argv[2] || `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
const [Y, M, D] = ymd.split('-').map(Number);
const day = new Date(Y, M - 1, D, 12, 0, 0); // local noon, Pacific
const OUT = path.join('public/wallet-desk/time-clock', ymd);
fs.mkdirSync(OUT, { recursive: true });

const hm = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
const at = (h, m) => new Date(Y, M - 1, D, h, m);
const sun = SunCalc.getTimes(day, LAT, LNG);
const moon = SunCalc.getMoonTimes(new Date(Y, M - 1, D), LAT, LNG);
const moonLit = Math.round(SunCalc.getMoonIllumination(moon.rise || day).fraction * 100);
const phase = SunCalc.getMoonIllumination(moon.rise || day).phase; // 0 new .5 full
const phaseName = moonLit < 3 ? 'new moon' : moonLit > 97 ? 'full moon' : (phase < 0.5 ? (moonLit < 50 ? 'waxing crescent' : 'waxing gibbous') : (moonLit < 50 ? 'waning crescent' : 'waning gibbous'));

async function getJSON(url) { try { const r = await fetch(url, { signal: AbortSignal.timeout(15000) }); return r.ok ? r.json() : null; } catch { return null; } }
const tideDate = `${Y}${pad(M)}${pad(D)}`;
const tide = await getJSON(`https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&station=9410840&begin_date=${tideDate}&end_date=${tideDate}&datum=MLLW&time_zone=lst_ldt&interval=hilo&units=english&format=json`);
const lows = (tide?.predictions || []).filter((p) => p.type === 'L').map((p) => ({ t: new Date(p.t.replace(' ', 'T')), v: Number(p.v) }));
const low = lows.sort((a, b) => a.v - b.v)[0];

const staff = [
  { no: '10', name: 'Roomtone', addr: 'tz1cyyggfy9dKyWd1gufVUGDESEZWqKuWZFR', venue: 'akaSwap', t: at(3, 0), why: 'the quietest hour. nobody in the building.' },
  { no: '04', name: 'Marine Layer', addr: 'tz1WTkeS2nMDKVCgcz468yg4ASMqcBrrM6ch', venue: 'Teia', t: sun.dawn, why: `civil twilight. in before the sun (${hm(sun.sunrise).toLowerCase()}).` },
  { no: '03', name: 'Blockhead', addr: 'tz1iAw6XB2d4V6ZFRQnVQptziVmUyWXYZgW1', venue: 'objkt', t: at(7, 0), why: 'opens the building.' },
  { no: '08', name: 'Rank and File', addr: 'tz1fQvEpkZxY6f5WzEhqPtQuSCXZZLW1GwzQ', venue: 'Teia', t: at(9, 0), why: 'roll call. counts everyone who came in.' },
  { no: '07', name: 'High Noon', addr: 'tz1coVwNQbf3BqBMNGuf5i7zkGjGo4vGFux7', venue: 'Teia', t: sun.solarNoon, why: 'true solar noon, not the clock’s.' },
  { no: '09', name: 'Echo', addr: 'tz1TzHijbxUGXyaM7bmCQpV52TnKGy24gVGF', venue: 'akaSwap', t: new Date(sun.solarNoon.getTime() + 60000), why: 'one minute after high noon. always one after.' },
  { no: '11', name: 'Sundown', addr: 'tz1ZHgxVyoZ6saSuFvJ7ECqqVj4hARzAx7YW', venue: 'akaSwap', t: sun.sunset, why: 'sunset. closes the books.' },
  { no: '05', name: 'Low Tide', addr: 'tz1fkbBCQpPwDy97nugLr3AJq6gHnWgKX9Q9', venue: 'Teia', t: low ? low.t : null,
    why: low ? `${low.v < 0 ? 'minus tide' : 'low tide'}, ${low.v < 0 ? '−' : ''}${Math.abs(low.v).toFixed(2)} ft. ${low.v < 0 ? 'the beach is all floor.' : 'what the water left.'}` : 'tide table unreachable today. on call.' },
  { no: '06', name: 'Moonface', addr: 'tz1YfpSVbr4qxfPoRpP2uQcWmwtkEjrFXXkJ', venue: 'Teia', t: moon.rise || null,
    why: moon.rise ? `moonrise. ${phaseName}, ${moonLit}% lit.` : 'no moonrise today. the moon stays up or stays down.' },
  { no: '12', name: 'Aftershock', addr: 'tz1XJX3v4ePDZBbRseG1xD4RABk4zkiY6SYL', venue: 'akaSwap', t: null, why: 'punches in when something happens.' },
];

// payroll: a bot with under 0.15 tez can't mint, and its card says so
const MIN = 0.15;
for (const s of staff) {
  const a = await getJSON(`https://api.tzkt.io/v1/accounts/${s.addr}?metadata=false`);
  s.balance = a ? (a.balance || 0) / 1e6 : null;
  s.unpaid = s.balance !== null && s.balance < MIN;
  s.punch = s.t ? hm(s.t) : 'ON CALL';
  if (s.unpaid) s.why = `${s.why.split('. ')[0].replace(/\.?$/, '.')} waiting on payroll: ${s.balance.toFixed(4)} tez.`;
}

// week rows: Sunday..Saturday of this week
const HIRED = '2026-11-25', RING = '2026-11-26';
const start = new Date(Y, M - 1, D - day.getDay());
const week = Array.from({ length: 7 }, (_, k) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + k));
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const label = (d) => d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() + ' ' + d.getDate();
const weekEnd = week[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PAPER = '#efe6cf', RED = '#b5332e', BLUE = '#3b5b8c', INK = '#2a2622', STAMP = '#5b3f8f';
const order = [...staff].sort((a, b) => (a.t ? a.t.getTime() : Infinity) - (b.t ? b.t.getTime() : Infinity));

for (const [i, s] of order.entries()) {
  const h = crypto.createHash('sha256').update(s.addr).digest();
  const u = (k) => h.readUInt32BE(k);
  const parts = [bodies[u(4) % bodies.length], accessories[u(8) % accessories.length], heads[u(12) % heads.length], glasses[u(16) % glasses.length]];
  const bg = bgcolors[u(0) % bgcolors.length];
  const noun = await sharp(Buffer.from(buildSVG(parts, palette, bg))).resize(300, 300, { kernel: 'nearest' }).png().toBuffer();
  const rot = ((h[20] + D) % 7 - 3) * 0.8;
  const rows = week.map((d, k) => {
    const y = 640 + k * 78; const kk = key(d);
    let cell;
    if (kk === ymd) cell = `<text x="560" y="${y + 52}" font-family="Anonymous Pro" font-weight="700" font-size="44" fill="${s.unpaid ? RED : STAMP}" transform="rotate(${rot} 700 ${y + 40})" opacity="0.9">${esc(s.punch === 'ON CALL' ? 'ON CALL' : label(d).slice(0, 2) + ' ' + s.punch)}</text>`;
    else if (kk === HIRED) cell = `<text x="560" y="${y + 52}" font-family="Anonymous Pro" font-size="34" fill="${INK}" fill-opacity=".35">HIRED</text>`;
    else if (kk === RING && s.name !== 'Blockhead') cell = `<text x="560" y="${y + 52}" font-family="Anonymous Pro" font-size="34" fill="${INK}" fill-opacity=".35">GIFT RING</text>`;
    else if (kk > RING && kk < ymd) cell = `<text x="560" y="${y + 52}" font-family="Anonymous Pro" font-size="34" fill="${INK}" fill-opacity=".35">PUNCHED</text>`;
    else cell = `<line x1="300" y1="${y + 40}" x2="1000" y2="${y + 40}" stroke="${INK}" stroke-opacity=".25" stroke-width="2"/>`;
    return `<rect x="60" y="${y}" width="960" height="78" fill="none" stroke="${BLUE}" stroke-width="2"/><line x1="280" y1="${y}" x2="280" y2="${y + 78}" stroke="${RED}" stroke-width="2"/><text x="84" y="${y + 52}" font-family="Anonymous Pro" font-size="32" fill="${INK}">${label(d)}</text>${cell}`;
  }).join('\n');
  const [w1, ...rest] = s.why.split('. ');
  const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
  <rect width="1080" height="1350" fill="${PAPER}"/>
  <rect x="30" y="30" width="1020" height="1290" fill="none" stroke="${INK}" stroke-width="4"/>
  <circle cx="540" cy="74" r="16" fill="#d9cfb4" stroke="${INK}" stroke-width="3"/>
  <text x="60" y="160" font-family="Archivo Black" font-size="92" fill="${INK}" letter-spacing="6">TIME CARD</text>
  <text x="60" y="210" font-family="Anonymous Pro" font-size="28" fill="${RED}">THE OFFICE · EL SEGUNDO · WEEK ENDING ${weekEnd}</text>
  <rect x="720" y="250" width="300" height="300" fill="#${bg}" stroke="${INK}" stroke-width="4"/>
  <image x="720" y="250" width="300" height="300" href="data:image/png;base64,${noun.toString('base64')}"/>
  <text x="60" y="290" font-family="DM Sans" font-size="22" fill="${BLUE}" letter-spacing="3">EMPLOYEE</text>
  <text x="60" y="350" font-family="Archivo Black" font-size="${s.name.length > 11 ? 58 : 70}" fill="${INK}">${esc(s.name)}</text>
  <text x="60" y="404" font-family="DM Sans" font-size="22" fill="${BLUE}" letter-spacing="3">No.  ${s.no}   ·   (bot)   ·   ${s.balance === null ? 'balance unread' : s.balance.toFixed(2) + ' tez'}</text>
  <text x="60" y="470" font-family="DM Sans" font-size="22" fill="${BLUE}" letter-spacing="3">SHIFT</text>
  <text x="60" y="520" font-family="DM Sans" font-size="34" fill="${INK}">${esc(w1.replace(/\.?$/, '.'))}</text>
  <text x="60" y="564" font-family="DM Sans" font-size="34" fill="${s.unpaid ? RED : INK}">${esc(rest.join('. '))}</text>
  <text x="84" y="624" font-family="DM Sans" font-size="20" fill="${RED}" letter-spacing="3">DAY</text>
  <text x="304" y="624" font-family="DM Sans" font-size="20" fill="${RED}" letter-spacing="3">IN</text>
  ${rows}
  <text x="60" y="1240" font-family="Anonymous Pro" font-size="24" fill="${INK}" fill-opacity=".7">sun + moon: suncalc · tide: noaa 9410840 · balance: tzkt</text>
  <text x="60" y="1280" font-family="Anonymous Pro" font-size="24" fill="${INK}" fill-opacity=".7">${s.addr} · cc0</text>
</svg>`;
  s.file = `tc-${pad(i + 1)}-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  await sharp(Buffer.from(card)).png().toFile(path.join(OUT, s.file));
}

// the day strip
const W = 1920, H = 1080, x0 = 120, x1 = 1800;
const toX = (d) => x0 + ((d.getHours() * 60 + d.getMinutes()) / 1440) * (x1 - x0);
const timed = order.filter((s) => s.t);
const placed = [];
const marks = timed.map((s) => {
  const x = toX(s.t); let tier = 0; while (placed.some((p) => p.tier === tier && Math.abs(p.x - x) < 230)) tier++;
  placed.push({ x, tier });
  const y = 380 + Math.min(tier, 2) * 115; const near = placed.some((p) => p !== placed.at(-1) && Math.abs(p.x - x) < 8);
  const anc = near ? 'start' : 'middle'; const tx = near ? x + 14 : x;
  return `<line x1="${x}" y1="${y + 20}" x2="${x}" y2="700" stroke="${INK}" stroke-width="2"/><circle cx="${x}" cy="700" r="9" fill="${s.unpaid ? RED : STAMP}"/><text x="${tx}" y="${y}" font-family="Archivo Black" font-size="30" fill="${INK}" text-anchor="${anc}">${esc(s.name)}</text><text x="${tx}" y="${y - 36}" font-family="Anonymous Pro" font-size="24" fill="${s.unpaid ? RED : STAMP}" text-anchor="${anc}">${s.punch}</text>`;
}).join('');
const ticks = Array.from({ length: 25 }, (_, hh) => { const x = x0 + hh / 24 * (x1 - x0); return `<line x1="${x}" y1="690" x2="${x}" y2="${hh % 6 ? 710 : 725}" stroke="${INK}" stroke-width="2"/>${hh % 6 ? '' : `<text x="${x}" y="760" font-family="Anonymous Pro" font-size="26" fill="${INK}" text-anchor="middle">${['12a', '6a', '12p', '6p', '12a'][hh / 6]}</text>`}`; }).join('');
const unpaid = staff.filter((s) => s.unpaid).map((s) => s.name.toLowerCase());
const offcall = staff.filter((s) => !s.t).map((s) => s.name.toLowerCase());
const dayName = day.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();
const strip = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${PAPER}"/>
<rect x="${x0}" y="300" width="${toX(sun.sunrise) - x0}" height="400" fill="${BLUE}" fill-opacity=".10"/><rect x="${toX(sun.sunset)}" y="300" width="${x1 - toX(sun.sunset)}" height="400" fill="${BLUE}" fill-opacity=".10"/>
<text x="${x0}" y="150" font-family="Archivo Black" font-size="84" fill="${INK}" letter-spacing="4">THE OFFICE DAY</text>
<text x="${x0}" y="210" font-family="Anonymous Pro" font-size="32" fill="${RED}">${esc(dayName)} · el segundo · every bot punches in on the sky, the tide or the clock</text>
<line x1="${x0}" y1="700" x2="${x1}" y2="700" stroke="${INK}" stroke-width="4"/>${ticks}${marks}
<text x="${x0}" y="860" font-family="DM Sans" font-size="30" fill="${INK}">${esc([offcall.length ? offcall.join(', ') + ' on call.' : '', unpaid.length ? unpaid.join(', ') + ' waiting on payroll.' : 'everyone on payroll.'].filter(Boolean).join(' '))}</text>
<text x="${x0}" y="910" font-family="DM Sans" font-size="30" fill="${INK}">each time card is minted by its own bot at its punch, then handed to the next bot on the clock.</text>
<text x="${x0}" y="1010" font-family="Anonymous Pro" font-size="24" fill="${INK}" fill-opacity=".7">sun + moon: suncalc · tide: noaa 9410840 santa monica · balances: tzkt · cc0</text>
</svg>`;
await sharp(Buffer.from(strip)).png().toFile(path.join(OUT, 'the-office-day.png'));

const minters = order.filter((s) => !s.unpaid);
const chain = minters.map((s) => s.name);
fs.writeFileSync(path.join(OUT, 'day.json'), JSON.stringify({ date: ymd, sun: { dawn: hm(sun.dawn), sunrise: hm(sun.sunrise), solarNoon: hm(sun.solarNoon), sunset: hm(sun.sunset) }, moon: { rise: moon.rise ? hm(moon.rise) : null, lit: moonLit, phase: phaseName }, lowTide: low ? { at: hm(low.t), ft: low.v } : null, staff: order.map(({ no, name, addr, venue, punch, why, balance, unpaid, file }) => ({ no, name, addr, venue, punch, why, balance, unpaid, file })), giftChain: chain }, null, 1));
const ticket = `MINT TICKET · THE TIME CLOCK · ${dayName.toUpperCase()} (standing go on Office Noun / Tezos wallet work)
from: Wallet desk (time clock)

Each bot mints its own time card, from its own wallet, on its own venue, at or after its punch (PT), then gives one edition to the next bot on the clock.
${minters.map((s) => `${s.name} ${s.punch} · ${s.venue} · ${s.why}`).join('\n')}
${unpaid.length ? `Not minting (under ${MIN} tez, card printed in red): ${staff.filter((s) => s.unpaid).map((s) => `${s.name} ${s.balance.toFixed(4)}`).join(', ')}. PAYROLL ASK: 1 tez each from officenoun.tez.` : 'Everyone is on payroll.'}

what: "Time card · <bot> · ${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}" — "<shift line>. clocked in on the sky, the tide or the clock. free, cc0, no cash value."
art: <BASE>/${OUT}/ (files listed in day.json)
edition: 10 · free · royalty 0 on Teia / 0.1% akaSwap minimum · CC0
gift chain (1 edition each): ${chain.join(' → ')}
announce: hand the-office-day.png to the X desk after the last receipt.`;
fs.writeFileSync(path.join(OUT, 'ticket.txt'), ticket);
console.log(ticket);
