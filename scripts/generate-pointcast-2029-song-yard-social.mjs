import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const source = path.resolve('public/images/pointcast-2029-field-kit/stadium-band-terrace.png');
const outDir = path.resolve('public/images/pointcast-2029-song-yard');
const output = path.join(outDir, 'social-card.png');

const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="710" height="630" fill="#18212a"/>
  <rect width="710" height="18" fill="#e4ad31"/>
  <circle cx="64" cy="77" r="25" fill="#c94a31"/>
  <path d="M108 56H131V104H108Z" fill="#e4ad31"/>
  <text x="151" y="87" fill="#f5eddb" font-family="Menlo, monospace" font-size="15" font-weight="700" letter-spacing="2">POINTCAST 25 · AUDIO PRACTICE · 2029</text>

  <text x="49" y="231" fill="#f5eddb" font-family="Arial Black, Helvetica, sans-serif" font-size="94" font-weight="900" letter-spacing="-7">THE SONG</text>
  <text x="46" y="329" fill="#e4ad31" font-family="Arial Black, Helvetica, sans-serif" font-size="103" font-weight="900" letter-spacing="-7">YARD.</text>

  <line x1="52" y1="369" x2="655" y2="369" stroke="#f5eddb" stroke-width="3"/>
  <text x="52" y="417" fill="#f5eddb" font-family="Helvetica, Arial, sans-serif" font-size="23" font-weight="800">LEARN ONE PART. THEN OPEN THE BOWL.</text>
  <text x="52" y="454" fill="#f5eddb" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="700">6 ORIGINAL SEEDS · 4 PARTS · 0 RECORDINGS</text>

  <g transform="translate(52 492)">
    <rect width="42" height="70" fill="#c94a31"/>
    <rect x="49" width="42" height="42" fill="#e4ad31"/>
    <rect x="98" width="42" height="58" fill="#557455"/>
    <rect x="147" width="42" height="32" fill="#f5eddb"/>
    <rect x="196" width="42" height="62" fill="#244b8f"/>
    <rect x="245" width="42" height="48" fill="#c94a31"/>
    <rect x="294" width="42" height="28" fill="#e4ad31"/>
    <rect x="343" width="42" height="54" fill="#557455"/>
  </g>

  <rect x="694" width="16" height="630" fill="#c94a31"/>
  <rect x="985" y="50" width="175" height="206" fill="#e4ad31" stroke="#171715" stroke-width="5" transform="rotate(3 985 50)"/>
  <text x="1012" y="102" fill="#171715" font-family="Menlo, monospace" font-size="13" font-weight="700" transform="rotate(3 1012 102)">PUBLIC SCORE / 0527</text>
  <text x="1009" y="161" fill="#171715" font-family="Arial Black, Helvetica, sans-serif" font-size="42" font-weight="900" transform="rotate(3 1009 161)">CALL ↘</text>
  <text x="1007" y="213" fill="#171715" font-family="Arial Black, Helvetica, sans-serif" font-size="37" font-weight="900" transform="rotate(3 1007 213)">ANSWER</text>
</svg>`;

await mkdir(outDir, { recursive: true });

const photo = await sharp(source)
  .resize(490, 630, { fit: 'cover', position: 'center' })
  .modulate({ saturation: 0.82 })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: '#171715',
  },
})
  .composite([
    { input: photo, left: 710, top: 0 },
    { input: Buffer.from(overlay), left: 0, top: 0 },
  ])
  .png()
  .toFile(output);

process.stdout.write(`${output}\n`);
