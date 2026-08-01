import path from 'node:path';
import sharp from 'sharp';

const output = path.resolve('public/images/og/b/0551.png');
const grid = Array.from({ length: 31 }, (_, index) => `<path d="M${index * 40} 0V630"/>`).join('')
  + Array.from({ length: 17 }, (_, index) => `<path d="M0 ${index * 40}H1200"/>`).join('');
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#07100d"/>
  <g stroke="#294438" stroke-width="1" opacity=".42">${grid}</g>
  <rect x="28" y="26" width="1144" height="578" rx="10" fill="#0c1713" stroke="#4d7c68" stroke-width="2"/>
  <rect x="28" y="26" width="1144" height="52" rx="10" fill="#111f19"/>
  <circle cx="59" cy="52" r="7" fill="#ff7b6b"/><circle cx="83" cy="52" r="7" fill="#ffc857"/><circle cx="107" cy="52" r="7" fill="#b8ff58"/>
  <text x="146" y="58" fill="#8ba596" font-family="Menlo, monospace" font-size="15" font-weight="700">eng25@el-segundo:~$ catalog --mode=proof</text>
  <text x="65" y="225" fill="#b8ff58" font-family="Menlo, monospace" font-size="142" font-weight="900" letter-spacing="-14">ENG/25</text>
  <text x="71" y="286" fill="#e9f7eb" font-family="Menlo, monospace" font-size="34" font-weight="700">THE ENGINEERING CATALOG</text>
  <text x="72" y="340" fill="#69e6df" font-family="Menlo, monospace" font-size="20" font-weight="700">Find a capability. Compile a stack. Publish proof.</text>
  <rect x="65" y="389" width="683" height="62" rx="4" fill="#07100d" stroke="#294438"/>
  <text x="85" y="428" fill="#b8ff58" font-family="Menlo, monospace" font-size="21" font-weight="700">$ find "salt air"</text>
  <text x="805" y="150" fill="#8ba596" font-family="Menlo, monospace" font-size="14">CAPABILITY INDEX</text>
  <text x="805" y="196" fill="#e9f7eb" font-family="Menlo, monospace" font-size="25" font-weight="700">18 MAN PAGES</text>
  <text x="805" y="246" fill="#e9f7eb" font-family="Menlo, monospace" font-size="25" font-weight="700">06 MISSION STACKS</text>
  <text x="805" y="296" fill="#e9f7eb" font-family="Menlo, monospace" font-size="25" font-weight="700">17 OFFICIAL DOORS</text>
  <text x="805" y="346" fill="#e9f7eb" font-family="Menlo, monospace" font-size="25" font-weight="700">08 PROOF FIELDS</text>
  <rect x="805" y="389" width="298" height="62" rx="4" fill="#b8ff58"/>
  <text x="827" y="428" fill="#07100d" font-family="Menlo, monospace" font-size="17" font-weight="900">00 PRIVATE PEOPLE</text>
  <text x="70" y="513" fill="#ffc857" font-family="Menlo, monospace" font-size="16" font-weight="700">RADIUS 25 · FIELD COMPANION 018.B · BLOCK 0551</text>
  <text x="70" y="564" fill="#8ba596" font-family="Menlo, monospace" font-size="14" font-weight="700">POINTCAST.XYZ/BEACH-COMMONS/V18/ENGINEERING</text>
  <rect x="1136" y="103" width="8" height="455" fill="#b8ff58"/>
</svg>`;

await sharp(Buffer.from(overlay))
  .png({ compressionLevel: 9 })
  .toFile(output);

console.log(output);
