import fs from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
for (const [slug,title,subtitle,art] of [['community','EVERY CITY','STARTS SOMEWHERE.','nouns-money-city-atlas'],['marketplace','USEFUL THINGS.','CLEAR PROMISES.','marketplace-dashboard-demo']]) {
 const png=fs.readFileSync(`public/images/nouns-money/community/${art}.png`).toString('base64');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f5edd8"/><rect x="30" y="30" width="1140" height="570" fill="none" stroke="#153b32" stroke-width="3"/><text x="60" y="94" fill="#153b32" font-family="Inter" font-weight="600" font-size="23">NOUNS MONEY / CONCEPT STUDIO</text><text x="60" y="250" fill="#153b32" font-family="Inter" font-weight="700" font-size="55">${title}</text><text x="60" y="315" fill="#a42d17" font-family="Inter" font-weight="700" font-size="35">${subtitle}</text><image href="data:image/png;base64,${png}" x="610" y="140" width="540" height="360" preserveAspectRatio="xMidYMid meet"/><text x="60" y="480" fill="#153b32" font-family="Inter" font-size="22">Proposed local collections.</text><text x="60" y="515" fill="#153b32" font-family="Inter" font-size="22">Art, research and useful ideas.</text><rect x="30" y="552" width="1140" height="48" fill="#153b32"/><text x="60" y="584" fill="#f5edd8" font-family="Inter" font-size="18">POINTCAST.XYZ / HOYDICH ASTRA ADVERTISING / OCTOBER 2026</text></svg>`;
 fs.mkdirSync('public/images/og',{recursive:true});
 fs.writeFileSync(`public/images/og/nouns-money-${slug}.png`,new Resvg(svg,{font:{loadSystemFonts:true}}).render().asPng());
}
console.log('Generated two studio OG cards');
