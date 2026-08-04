import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../public/images/pointcast-tonight/social-card.png', import.meta.url);
await mkdir(new URL('../public/images/pointcast-tonight/', import.meta.url), { recursive: true });

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f2eddf"/>
  <rect width="710" height="630" fill="#ffd84a"/>
  <rect x="710" width="490" height="630" fill="#3755f5"/>
  <path d="M0 54H1200M710 0V630" stroke="#11100d" stroke-width="6"/>
  <g fill="#11100d" font-family="Arial, Helvetica, sans-serif" font-weight="900">
    <text x="54" y="38" font-size="18" letter-spacing="3">POINTCAST · TONIGHT · EDITION 001</text>
    <text x="50" y="207" font-size="136" letter-spacing="-11">GO</text>
    <text x="50" y="325" font-size="136" letter-spacing="-11">OUT</text>
    <text x="55" y="383" font-size="23" letter-spacing="2">25 MILES · ROUGHLY</text>
    <text x="55" y="535" font-size="30">ONE WEEK. OFFICIAL SOURCES.</text>
    <text x="55" y="575" font-size="18" letter-spacing="2">EVENTS + PUBLIC ACCESS TV</text>
  </g>
  <g transform="translate(770 115)">
    <path d="M76 0L147 72M272 0L199 72" stroke="#11100d" stroke-width="10"/>
    <rect x="0" y="68" width="354" height="360" rx="70" fill="#11100d" stroke="#f2eddf" stroke-width="8"/>
    <rect x="35" y="108" width="284" height="224" rx="80" fill="#182b29" stroke="#f2eddf" stroke-width="6"/>
    <path d="M49 142H305M49 174H305M49 206H305M49 238H305M49 270H305M49 302H305" stroke="#a9ffcd" stroke-width="3" opacity=".28"/>
    <text x="68" y="190" fill="#a9ffcd" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900">STAY</text>
    <text x="88" y="266" fill="#a9ffcd" font-family="Arial, Helvetica, sans-serif" font-size="70" font-weight="900">IN</text>
    <circle cx="90" cy="375" r="23" fill="#ffd84a" stroke="#f2eddf" stroke-width="4"/>
    <circle cx="264" cy="375" r="23" fill="#ff4c31" stroke="#f2eddf" stroke-width="4"/>
  </g>
  <rect x="0" y="0" width="1200" height="630" fill="none" stroke="#11100d" stroke-width="12"/>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(fileURLToPath(output));
console.log(`Wrote ${output.pathname}`);
