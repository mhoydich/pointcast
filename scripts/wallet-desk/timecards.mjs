// Wallet desk time clock. Needs: npm i @nouns/assets @nouns/sdk sharp. Punch times are typed in for Fri Nov 27, 2026:
// to run another day, refresh them from api.sunrise-sunset.org (lat 33.9192, lng -118.4165), NOAA tides station 9410840 (hilo, lst_ldt) and moonrise (ephem). Writes PNGs to ./time.
import assets from '@nouns/assets';
import * as sdk from '@nouns/sdk';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
const { ImageData } = assets; const { buildSVG } = sdk;
const { bgcolors, palette, images } = ImageData;
const { bodies, accessories, heads, glasses } = images;

// Fri Nov 27, 2026, El Segundo (33.919, -118.417). Times PT.
// Sun: api.sunrise-sunset.org. Tide: NOAA 9410840 Santa Monica. Moon: ephem.
const clock = [
  { no: '10', name: 'Roomtone', addr: 'tz1cyyggfy9dKyWd1gufVUGDESEZWqKuWZFR', punch: '3:00 AM', why: 'the quietest hour. nobody in the building.' },
  { no: '04', name: 'Marine Layer', addr: 'tz1WTkeS2nMDKVCgcz468yg4ASMqcBrrM6ch', punch: '6:10 AM', why: 'civil twilight. in before the sun (6:37).' },
  { no: '03', name: 'Blockhead', addr: 'tz1iAw6XB2d4V6ZFRQnVQptziVmUyWXYZgW1', punch: '7:00 AM', why: 'opens the building. waiting on payroll: 0.0007 tez.', unpaid: true },
  { no: '08', name: 'Rank and File', addr: 'tz1fQvEpkZxY6f5WzEhqPtQuSCXZZLW1GwzQ', punch: '9:00 AM', why: 'roll call. counts everyone who came in.' },
  { no: '07', name: 'High Noon', addr: 'tz1coVwNQbf3BqBMNGuf5i7zkGjGo4vGFux7', punch: '11:41 AM', why: 'true solar noon, not the clock’s.' },
  { no: '09', name: 'Echo', addr: 'tz1TzHijbxUGXyaM7bmCQpV52TnKGy24gVGF', punch: '11:42 AM', why: 'one minute after high noon. always one after.' },
  { no: '11', name: 'Sundown', addr: 'tz1ZHgxVyoZ6saSuFvJ7ECqqVj4hARzAx7YW', punch: '4:45 PM', why: 'sunset. closes the books.' },
  { no: '05', name: 'Low Tide', addr: 'tz1fkbBCQpPwDy97nugLr3AJq6gHnWgKX9Q9', punch: '5:51 PM', why: 'minus tide, −1.15 ft. the beach is all floor.' },
  { no: '06', name: 'Moonface', addr: 'tz1YfpSVbr4qxfPoRpP2uQcWmwtkEjrFXXkJ', punch: '8:11 PM', why: 'moonrise. waning gibbous, 89% lit.' },
  { no: '12', name: 'Aftershock', addr: 'tz1XJX3v4ePDZBbRseG1xD4RABk4zkiY6SYL', punch: 'ON CALL', why: 'punches in when something happens.' },
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
fs.mkdirSync('time', { recursive: true });
const PAPER = '#efe6cf', RED = '#b5332e', BLUE = '#3b5b8c', INK = '#2a2622', STAMP = '#5b3f8f';
const days = ['SAT 21', 'SUN 22', 'MON 23', 'TUE 24', 'WED 25', 'THU 26', 'FRI 27'];

for (const [i, s] of clock.entries()) {
  const h = crypto.createHash('sha256').update(s.addr).digest();
  const u = (k) => h.readUInt32BE(k);
  const parts = [bodies[u(4) % bodies.length], accessories[u(8) % accessories.length], heads[u(12) % heads.length], glasses[u(16) % glasses.length]];
  const bg = bgcolors[u(0) % bgcolors.length];
  const noun = await sharp(Buffer.from(buildSVG(parts, palette, bg))).resize(300, 300, { kernel: 'nearest' }).png().toBuffer();
  const rot = ((h[20] % 7) - 3) * 0.8; // stamp tilt
  const rowY = (d) => 640 + d * 78;
  const rows = days.map((d, k) => {
    const y = rowY(k); const today = k === 6; const before = k < 4; // wallets opened Wed 25
    const cell = today
      ? `<text x="560" y="${y + 52}" font-family="Anonymous Pro" font-weight="700" font-size="44" fill="${s.unpaid ? RED : STAMP}" transform="rotate(${rot} 700 ${y + 40})" opacity="0.9">${esc(s.punch === 'ON CALL' ? 'ON CALL' : 'FR ' + s.punch)}</text>`
      : before ? `<line x1="300" y1="${y + 40}" x2="1000" y2="${y + 40}" stroke="${INK}" stroke-opacity=".25" stroke-width="2"/>`
      : (k === 5 && s.unpaid) ? `<line x1="300" y1="${y + 40}" x2="1000" y2="${y + 40}" stroke="${INK}" stroke-opacity=".25" stroke-width="2"/>` : `<text x="560" y="${y + 52}" font-family="Anonymous Pro" font-size="34" fill="${INK}" fill-opacity=".35">${k === 4 ? 'HIRED' : 'GIFT RING'}</text>`;
    return `<rect x="60" y="${y}" width="960" height="78" fill="none" stroke="${BLUE}" stroke-width="2"/>
      <line x1="280" y1="${y}" x2="280" y2="${y + 78}" stroke="${RED}" stroke-width="2"/>
      <text x="84" y="${y + 52}" font-family="Anonymous Pro" font-size="32" fill="${INK}">${d}</text>${cell}`;
  }).join('\n');
  const card = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
  <rect width="1080" height="1350" fill="${PAPER}"/>
  <rect x="30" y="30" width="1020" height="1290" fill="none" stroke="${INK}" stroke-width="4"/>
  <circle cx="540" cy="74" r="16" fill="#d9cfb4" stroke="${INK}" stroke-width="3"/>
  <text x="60" y="160" font-family="Archivo Black" font-size="92" fill="${INK}" letter-spacing="6">TIME CARD</text>
  <text x="60" y="210" font-family="Anonymous Pro" font-size="28" fill="${RED}">THE OFFICE · EL SEGUNDO · WEEK ENDING NOV 28, 2026</text>
  <rect x="720" y="250" width="300" height="300" fill="#${bg}" stroke="${INK}" stroke-width="4"/>
  <image x="720" y="250" width="300" height="300" href="data:image/png;base64,${noun.toString('base64')}"/>
  <text x="60" y="290" font-family="DM Sans" font-size="22" fill="${BLUE}" letter-spacing="3">EMPLOYEE</text>
  <text x="60" y="350" font-family="Archivo Black" font-size="${s.name.length > 11 ? 58 : 70}" fill="${INK}">${esc(s.name)}</text>
  <text x="60" y="404" font-family="DM Sans" font-size="22" fill="${BLUE}" letter-spacing="3">No.  ${s.no}   ·   (bot)</text>
  <text x="60" y="470" font-family="DM Sans" font-size="22" fill="${BLUE}" letter-spacing="3">SHIFT</text>
  <text x="60" y="520" font-family="DM Sans" font-size="34" fill="${INK}">${esc(s.why.split('. ')[0].replace(/\.?$/, '.'))}</text>
  <text x="60" y="564" font-family="DM Sans" font-size="34" fill="${INK}">${esc(s.why.split('. ').slice(1).join('. '))}</text>
  <text x="84" y="624" font-family="DM Sans" font-size="20" fill="${RED}" letter-spacing="3">DAY</text>
  <text x="304" y="624" font-family="DM Sans" font-size="20" fill="${RED}" letter-spacing="3">IN</text>
  ${rows}
  <text x="60" y="1240" font-family="Anonymous Pro" font-size="24" fill="${INK}" fill-opacity=".7">sun: sunrise-sunset.org · tide: noaa 9410840 · moon: ephem</text>
  <text x="60" y="1280" font-family="Anonymous Pro" font-size="24" fill="${INK}" fill-opacity=".7">${s.addr} · cc0</text>
</svg>`;
  const f = `time/tc-${String(i + 1).padStart(2, '0')}-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  await sharp(Buffer.from(card)).png().toFile(f);
}
// the day: one strip of all ten punches
const W = 1920, H = 1080, x0 = 120, x1 = 1800;
const toX = (t) => { const [hm, ap] = t.split(' '); let [hh, mm] = hm.split(':').map(Number); if (ap === 'PM' && hh !== 12) hh += 12; if (ap === 'AM' && hh === 12) hh = 0; return x0 + (hh * 60 + mm) / 1440 * (x1 - x0); };
const marks = clock.filter((c) => c.punch !== 'ON CALL').map((c, k) => { const x = toX(c.punch); const tier = { 'Roomtone': 0, 'Marine Layer': 1, 'Blockhead': 0, 'Rank and File': 2, 'High Noon': 0, 'Echo': 1, 'Sundown': 0, 'Low Tide': 1, 'Moonface': 2 }[c.name]; const y = 380 + tier * 115; const anc = c.name === 'Echo' ? 'start' : 'middle'; const tx = c.name === 'Echo' ? x + 14 : x; return `<line x1="${x}" y1="${y + 20}" x2="${x}" y2="700" stroke="${INK}" stroke-width="2"/><circle cx="${x}" cy="700" r="9" fill="${c.unpaid ? RED : STAMP}"/><text x="${tx}" y="${y}" font-family="Archivo Black" font-size="30" fill="${INK}" text-anchor="${anc}">${esc(c.name)}</text><text x="${tx}" y="${y - 36}" font-family="Anonymous Pro" font-size="24" fill="${STAMP}" text-anchor="${anc}">${c.punch}</text>`; }).join('');
const ticks = Array.from({ length: 25 }, (_, h) => { const x = x0 + h / 24 * (x1 - x0); return `<line x1="${x}" y1="690" x2="${x}" y2="${h % 6 ? 710 : 725}" stroke="${INK}" stroke-width="2"/>${h % 6 ? '' : `<text x="${x}" y="760" font-family="Anonymous Pro" font-size="26" fill="${INK}" text-anchor="middle">${['12a', '6a', '12p', '6p', '12a'][h / 6]}</text>`}`; }).join('');
const sx = toX('6:37 AM'), ssx = toX('4:45 PM');
const strip = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="${PAPER}"/>
<rect x="${x0}" y="300" width="${sx - x0}" height="400" fill="${BLUE}" fill-opacity=".10"/><rect x="${ssx}" y="300" width="${x1 - ssx}" height="400" fill="${BLUE}" fill-opacity=".10"/>
<text x="${x0}" y="150" font-family="Archivo Black" font-size="84" fill="${INK}" letter-spacing="4">THE OFFICE DAY</text>
<text x="${x0}" y="210" font-family="Anonymous Pro" font-size="32" fill="${RED}">friday, nov 27, 2026 · el segundo · every bot punches in on the sky, the tide or the clock</text>
<line x1="${x0}" y1="700" x2="${x1}" y2="700" stroke="${INK}" stroke-width="4"/>${ticks}${marks}
<text x="${x0}" y="860" font-family="DM Sans" font-size="30" fill="${INK}">aftershock is on call. blockhead is waiting on payroll (0.0007 tez).</text>
<text x="${x0}" y="910" font-family="DM Sans" font-size="30" fill="${INK}">each time card is minted by its own bot at its punch, then handed to the next bot on the clock.</text>
<text x="${x0}" y="1010" font-family="Anonymous Pro" font-size="24" fill="${INK}" fill-opacity=".7">sun: sunrise-sunset.org · tide: noaa 9410840 santa monica · moon: ephem · cc0</text>
</svg>`;
await sharp(Buffer.from(strip)).png().toFile('time/the-office-day.png');
console.log(fs.readdirSync('time').join(' '));
