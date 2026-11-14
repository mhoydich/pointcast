/** Draft badges, using the repository's official-trait renderer. */
import {mkdir,writeFile} from 'node:fs/promises';
import {renderPortrait} from '../src/lib/nouns-parts.mjs';

const recipes = [
 {name:'Tess',background:'cool',body:'body-green',accessory:'accessory-leaf',head:'head-earth',glasses:'glasses-square-teal'},
 {name:'Loom desk',background:'warm',body:'body-computerblue',accessory:'accessory-id',head:'head-mailbox',glasses:'glasses-square-fullblack'},
 {name:'Ada',background:'cool',body:'body-purple',accessory:'accessory-bling-sparkles',head:'head-star-sparkles',glasses:'glasses-square-magenta'},
 {name:'Sid',background:'warm',body:'body-orange-yellow',accessory:'accessory-sunset',head:'head-sunset',glasses:'glasses-square-yellow-saturated'},
 {name:'Lou',background:'warm',body:'body-bluegrey',accessory:'accessory-moon-block',head:'head-moon',glasses:'glasses-square-grey-light'},
 {name:'Mike',background:'cool',body:'body-blue-sky',accessory:'accessory-wave',head:'head-wave',glasses:'glasses-square-blue'},
 // Deterministic Loom nounFor('Daniel'); offered as a draft, not claimed as his choice.
 {name:'Daniel',background:'warm',body:'body-foggrey',accessory:'accessory-glasses-logo',head:'head-goat',glasses:'glasses-square-red'},
];
await mkdir('public/images/ufogp/badges',{recursive:true});
for (const {name,...traits} of recipes) {
 const art=renderPortrait(traits).svg.replace(/^<svg\b[^>]*>/,'').replace(/<\/svg>$/,'');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="560" height="720" viewBox="0 0 560 720" role="img" aria-label="Draft Noun badge for ${name}"><rect width="560" height="720" fill="#d4dae0"/><rect x="20" y="20" width="520" height="680" fill="none" stroke="#344b92" stroke-width="8"/><text x="45" y="75" fill="#192434" font-family="monospace" font-size="24">UFOGP / DRAFT BADGE</text><svg x="120" y="115" width="320" height="320" viewBox="0 0 320 320" shape-rendering="crispEdges">${art}</svg><text x="45" y="520" fill="#192434" font-family="monospace" font-size="52">${name.toUpperCase()}</text><text x="45" y="585" fill="#192434" font-family="monospace" font-size="20">TAKE NOTHING. LEAVE MAPS.</text><text x="45" y="650" fill="#192434" font-family="monospace" font-size="18">NOUNS ART / CC0</text></svg>`;
 await writeFile(`public/images/ufogp/badges/${name.toLowerCase().replaceAll(' ','-')}.svg`,svg+'\n');
}
await writeFile('public/images/ufogp/badges/recipes.json',JSON.stringify({status:'draft',note:'The six seats use their published seat recipes. Daniel uses the Loom name-derived recipe as an offer, not a claimed preference. Nouns are not minted.',source:'public/images/nouns-money/source-100/sources/official-image-data.json',renderer:'src/lib/nouns-parts.mjs',recipes},null,2)+'\n');
