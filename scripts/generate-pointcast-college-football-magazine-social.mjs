import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve('public/images/pointcast-2029-field-kit/stadium-band-terrace.png');
const outDir = path.resolve('public/images/pointcast-college-football-magazine');
const output = path.join(outDir, 'social-card.png');

const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="730" height="630" fill="#f1ead8"/>
  <rect width="730" height="22" fill="#f2ff3f"/>
  <rect x="0" y="22" width="24" height="608" fill="#d94f36"/>
  <text x="58" y="76" fill="#171716" font-family="Menlo, monospace" font-size="15" font-weight="700" letter-spacing="2">POINTCAST · ISSUE 001 · TALKIN' SEASON</text>
  <line x1="58" y1="98" x2="682" y2="98" stroke="#171716" stroke-width="3"/>
  <text x="54" y="236" fill="#171716" font-family="Arial Black, Helvetica, sans-serif" font-size="104" font-weight="900" letter-spacing="-7">COLLEGE</text>
  <text x="50" y="346" fill="#254b90" font-family="Arial Black, Helvetica, sans-serif" font-size="112" font-weight="900" letter-spacing="-7">FOOTBALL</text>
  <rect x="55" y="384" width="620" height="86" fill="#f2ff3f" stroke="#171716" stroke-width="3"/>
  <text x="75" y="423" fill="#171716" font-family="Helvetica, Arial, sans-serif" font-size="23" font-weight="800">THE RANKING IS ONE DEPARTMENT.</text>
  <text x="75" y="453" fill="#171716" font-family="Menlo, monospace" font-size="13" font-weight="700">35 PROGRAMS · 16 DOSSIERS · 48 SONG REFERENCES</text>
  <g transform="translate(58 505)">
    <rect width="96" height="72" fill="#d94f36"/>
    <rect x="108" width="96" height="72" fill="#254b90"/>
    <rect x="216" width="96" height="72" fill="#3f694b"/>
    <rect x="324" width="96" height="72" fill="#f2ff3f"/>
    <rect x="432" width="96" height="72" fill="#171716"/>
    <rect x="540" width="96" height="72" fill="#d94f36"/>
  </g>
  <rect x="713" width="17" height="630" fill="#171716"/>
  <rect x="940" y="54" width="206" height="207" fill="#f2ff3f" stroke="#171716" stroke-width="5" transform="rotate(3 940 54)"/>
  <text x="971" y="103" fill="#171716" font-family="Menlo, monospace" font-size="13" font-weight="700" transform="rotate(3 971 103)">OPEN FIELD / 10</text>
  <text x="962" y="169" fill="#171716" font-family="Arial Black, Helvetica, sans-serif" font-size="55" font-weight="900" transform="rotate(3 962 169)">ISSUE</text>
  <text x="1000" y="226" fill="#d94f36" font-family="Arial Black, Helvetica, sans-serif" font-size="63" font-weight="900" transform="rotate(3 1000 226)">001</text>
</svg>`;

await mkdir(outDir, { recursive: true });

const photo = await sharp(source)
  .resize(470, 630, { fit: 'cover', position: 'center' })
  .modulate({ saturation: 0.74 })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: '#171716',
  },
})
  .composite([
    { input: photo, left: 730, top: 0 },
    { input: Buffer.from(overlay), left: 0, top: 0 },
  ])
  .png()
  .toFile(output);

process.stdout.write(`${output}\n`);
