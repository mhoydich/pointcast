import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const source = path.join(
  repoRoot,
  'public/images/railroads/1964-shinkansen.webp',
);
const outDir = path.join(repoRoot, 'public/images/railroads');
const output = path.join(outDir, 'railroad-time-v1.png');

const width = 1200;
const height = 630;

const artwork = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="photoShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#111819" stop-opacity=".86"/>
      <stop offset=".53" stop-color="#111819" stop-opacity=".16"/>
      <stop offset="1" stop-color="#111819" stop-opacity=".06"/>
    </linearGradient>
    <linearGradient id="coalFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#101615"/>
      <stop offset=".84" stop-color="#101615" stop-opacity=".98"/>
      <stop offset="1" stop-color="#101615" stop-opacity=".76"/>
    </linearGradient>
    <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>

  <!-- Preserve the generated train plate while directing the eye toward its vanishing point. -->
  <rect width="1200" height="630" fill="url(#photoShade)"/>
  <path d="M0 0H610L750 630H0Z" fill="url(#coalFade)"/>
  <path d="M0 0H1200V18H0Z" fill="#c94737"/>
  <path d="M610 0L750 630" stroke="#f0e7d2" stroke-width="4" opacity=".82"/>
  <path d="M625 0L765 630" stroke="#276394" stroke-width="18" opacity=".96"/>

  <!-- Track and speed lines give the still image a kinetic first-frame read. -->
  <g fill="none" stroke-linecap="square">
    <path d="M310 630L777 352" stroke="#f0e7d2" stroke-width="5" opacity=".94"/>
    <path d="M420 630L790 360" stroke="#c94737" stroke-width="12" opacity=".92"/>
    <path d="M545 630L800 370" stroke="#f0e7d2" stroke-width="3" opacity=".72"/>
    <path d="M36 552L582 552" stroke="#276394" stroke-width="2" opacity=".76"/>
    <path d="M36 566L530 566" stroke="#f0e7d2" stroke-width="2" opacity=".35"/>
  </g>

  <!-- Signal mark. -->
  <circle cx="68" cy="75" r="28" fill="#c94737" opacity=".42" filter="url(#softGlow)"/>
  <circle cx="68" cy="75" r="18" fill="#c94737"/>
  <circle cx="68" cy="75" r="8" fill="#f0e7d2"/>
  <text x="107" y="81" fill="#f0e7d2" font-family="Menlo, Monaco, Consolas, monospace" font-size="15" font-weight="700" letter-spacing="1.8">POINTCAST · SPEAKABLE HISTORY · 1825—1964</text>

  <!-- Editorial masthead. -->
  <text x="46" y="211" fill="#f0e7d2" font-family="Arial Black, Helvetica, Arial, sans-serif" font-size="94" font-weight="900" letter-spacing="-6">RAILROAD</text>
  <text x="40" y="347" fill="#c94737" font-family="Arial Black, Helvetica, Arial, sans-serif" font-size="154" font-weight="900" letter-spacing="-11">TIME</text>
  <text x="48" y="400" fill="#f0e7d2" font-family="Helvetica, Arial, sans-serif" font-size="28" font-weight="800" letter-spacing="1">THE LINE THAT MADE TIME</text>

  <rect x="47" y="437" width="438" height="2" fill="#f0e7d2" opacity=".6"/>
  <text x="48" y="477" fill="#9fb7c5" font-family="Menlo, Monaco, Consolas, monospace" font-size="17" font-weight="700" letter-spacing="2">4 STOPS · 140 YEARS</text>

  <rect x="47" y="509" width="406" height="54" rx="2" fill="#f0e7d2"/>
  <text x="69" y="544" fill="#101615" font-family="Menlo, Monaco, Consolas, monospace" font-size="17" font-weight="700" letter-spacing="1.8">POINTCAST.XYZ/RAILROADS</text>

  <!-- Small route marker balances the train nose without obscuring it. -->
  <g transform="translate(1080 525)">
    <rect width="78" height="78" rx="39" fill="#101615" opacity=".86"/>
    <circle cx="39" cy="39" r="28" fill="none" stroke="#f0e7d2" stroke-width="2"/>
    <path d="M21 44H57M27 35H51M31 26H47" stroke="#c94737" stroke-width="5"/>
  </g>
</svg>`;

await mkdir(outDir, { recursive: true });

const photo = await sharp(source)
  .resize(width, height, {
    fit: 'cover',
    position: 'attention',
  })
  .modulate({ brightness: 0.9, saturation: 0.84 })
  .sharpen({ sigma: 0.55 })
  .png()
  .toBuffer();

await sharp(photo)
  .composite([{ input: Buffer.from(artwork), left: 0, top: 0 }])
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(output);

process.stdout.write(`${output}\n`);
