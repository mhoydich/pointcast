import {normalize as normalizeWorkshop, DEFAULT as WORKSHOP_DEFAULT, seal, nounSvg, nounName, ASSET_SHA} from './workshop-model.mjs';
export const VERSION = 1;
export const STORAGE_KEY = 'pointcast.ues.currency-lab.v1';
export const ASSET_BASE = '/assets/ues-currency-lab/';
export const THEMES = Object.freeze({
  place: {label: 'A place', title: 'Pacific afternoons', subtitle: 'A little piece of El Segundo', noun: 'sailboat', head: 182, prompt: 'A familiar place can turn a small object into a reminder. Which detail would a neighbor recognize?', finding: 'Meaning can come from a shared place. It does not create spending power.'},
  memory: {label: 'A memory', title: 'Golden hour club', subtitle: 'Keep a moment, give it a shape', noun: 'sunset', head: 201, prompt: 'Two people may value the same object differently. What memory would make someone keep yours?', finding: 'Personal value need not have a price. A story can matter to one person or many.'},
  craft: {label: 'The making', title: 'Made with care', subtitle: 'Look closely. Someone made this.', noun: 'pencil', head: 149, prompt: 'Care, materials, and skill can matter to a viewer. Which small detail rewards a closer look?', finding: 'Craft can invite attention. Time spent making does not guarantee a market value.'},
});
export const PALETTES = Object.freeze({
  grove: {label: 'Grove', paper: '#f4ecd8', ink: '#3c3024', accent: '#345b46'},
  clay: {label: 'Clay', paper: '#f3e5d5', ink: '#612f37', accent: '#ac5e45'},
});
export const COMPOSITIONS = Object.freeze({
  portrait: {label: 'Portrait', feedback: 'One strong portrait, then title, then specimen label. A clear order helps someone know where to look.'},
  typographic: {label: 'Type first', feedback: 'A large title leads. The Noun becomes a small companion. Read the specimen label before you judge the decoration.'},
  field: {label: 'Field note', feedback: 'A divided grid separates picture, title, and label. Structure can be expressive without making every element loud.'},
});
export function initialState() {
  return {version: VERSION, theme: 'place', palette: 'grove', composition: 'portrait', side: 'front', step: 0, title: THEMES.place.title, story: '', copies: 6, duplicated: false, meaningAnswer: '', copyAnswer: '', completed: [], checks: [false, false, false],assetOverride:null,colorsOverride:null,editionNumber:1};
}
const cleanText = (value, max) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
export function normalizeState(input) {
  const s = initialState();
  if (!input || typeof input !== 'object' || input.version !== VERSION) return s;
  if (Object.hasOwn(THEMES, input.theme)) s.theme = input.theme;
  if (Object.hasOwn(PALETTES, input.palette)) s.palette = input.palette;
  if (Object.hasOwn(COMPOSITIONS, input.composition)) s.composition = input.composition;
  s.side = input.side === 'back' ? 'back' : 'front';
  s.step = Number.isInteger(input.step) && input.step >= 0 && input.step <= 3 ? input.step : 0;
  s.title = cleanText(input.title, 36) || THEMES[s.theme].title;
  s.story = cleanText(input.story, 160);
  s.copies = Number.isInteger(input.copies) ? Math.max(1, Math.min(24, input.copies)) : 6;
  s.duplicated = input.duplicated === true;
  s.meaningAnswer = ['collectible', 'voucher', 'money'].includes(input.meaningAnswer) ? input.meaningAnswer : '';
  s.copyAnswer = ['yes', 'no'].includes(input.copyAnswer) ? input.copyAnswer : '';
  s.completed = Array.isArray(input.completed) ? [...new Set(input.completed.filter(n => Number.isInteger(n) && n >= 0 && n <= 3))] : [];
  s.editionNumber = Number.isInteger(input.editionNumber) && input.editionNumber >= 1 && input.editionNumber <= 99 ? input.editionNumber : 1;
  s.checks = Array.from({length: 3}, (_, i) => input.checks?.[i] === true);
  try {if(input.assetOverride)s.assetOverride=normalizeWorkshop({...WORKSHOP_DEFAULT,asset:input.assetOverride}).asset;} catch {}
  try {if(input.colorsOverride)s.colorsOverride=normalizeWorkshop({...WORKSHOP_DEFAULT,colors:input.colorsOverride}).colors;} catch {}
  // A verified imported edition label is an exact shared-design field.
  // Keep its whitespace through lab changes and device-local restoration.
  if(s.assetOverride && typeof input.title==='string' && input.title.trim() && /^[A-Z0-9 .&-]{1,28}$/.test(input.title)) s.title=input.title;
  return s;
}
export function applyWorkshopDesign(state, design) {
  const imported=normalizeWorkshop(design);
  return normalizeState({...state,theme:{'el-segundo':'place',pacific:'memory',workshop:'craft'}[imported.theme],title:imported.edition.label,checks:[false,false,false],assetOverride:imported.asset,colorsOverride:imported.colors,editionNumber:imported.edition.number});
}
export async function verifiedNounsData(raw) {
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));
  const sha=Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join('');
  if(sha!==ASSET_SHA)throw new Error('The original artwork file did not match its recorded checksum.');
  return JSON.parse(raw);
}
export function importedArt(state,data) {
  return state.assetOverride ? {href:'data:image/svg+xml;base64,'+btoa(nounSvg(state.assetOverride.seed,data)),name:nounName(state.assetOverride.seed,data)} : null;
}
export function escapeXML(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
}
export function titleLines(value, max = 23) {
  const words = String(value).split(/\s+/); const lines = [''];
  for (const word of words) {
    for (let i = 0; i < word.length; i += max) {
      const piece = word.slice(i,i+max), last=lines.length-1;
      if ((lines[last]+' '+piece).trim().length<=max) lines[last]=(lines[last]+' '+piece).trim();
      else lines.push(piece);
    }
  }
  return lines.slice(0,2);
}
export async function workshopDesign(input) {
  const s=normalizeState(input), palette=s.colorsOverride||PALETTES[s.palette];
  const label = s.assetOverride && s.title.trim() && /^[A-Z0-9 .&-]{1,28}$/.test(s.title) ? s.title : s.title.toUpperCase().replace(/[^A-Z0-9 .&-]/g,'').trim().slice(0,28) || 'UES ART STUDY';
  // Property order is the nmw-design/1 canonical order. Keep the full learner
  // story and composition in the separate brief, not extra schema properties.
  const design={schemaVersion:'nmw-design/1',theme:{place:'el-segundo',memory:'pacific',craft:'workshop'}[s.theme],asset:{collection:'nouns-cc0-local-seed',sourceCommit:'2213eea1c15f331f786784c2621d53bdecf907e2',sourceSha256:'a03f22b7838b35fdf0332617c9b8e2b032eb26cf1632afbefb200fec64c4bc20',seed:{background:0,body:17,accessory:41,head:THEMES[s.theme].head,glasses:2}},colors:{paper:palette.paper,ink:palette.ink,accent:palette.accent},edition:{label,number:s.editionNumber}};
  if(s.assetOverride)design.asset=s.assetOverride;
  return seal(design);
}
export function workshopURL(design) {
  return '/nouns-money/workshop/#design='+btoa(JSON.stringify(design)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export function readyForBrief(input) {
  const s = normalizeState(input);
  return s.story.length > 0 && s.meaningAnswer === 'collectible' && s.duplicated && s.copyAnswer === 'no' && s.checks.every(Boolean);
}
export function specimenId(input) {
  const s = normalizeState(input);
  // A local design label, deliberately not an issuance counter or registry lookup.
  let hash = 2166136261;
  for (const c of [s.theme, s.palette, s.composition, s.title,JSON.stringify(s.assetOverride),JSON.stringify(s.colorsOverride)].join('|')) { hash ^= c.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return 'UES-' + (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
}
export function noteSVG(input, {side, id = 'note', assetHref,assetName} = {}) {
  const s = normalizeState(input), p = s.colorsOverride||PALETTES[s.palette], theme = THEMES[s.theme];
  const face = side || s.side, title = escapeXML(s.title), uid = String(id).replace(/[^a-zA-Z0-9_-]/g, '');
  const titleText=(x,y,size,max)=>`<text x="${x}" y="${y}" font-family="Georgia,serif" font-size="${size}">${titleLines(s.title,max).map((line,i)=>`<tspan x="${x}" dy="${i?size*1.1:0}"${line.length*size*.95>850-x?` textLength="${850-x}" lengthAdjust="spacingAndGlyphs"`:''}>${escapeXML(line)}</tspan>`).join('')}</text>`;
  const noun = escapeXML(assetHref || `${ASSET_BASE}${theme.noun}.svg`);
  const identifier = specimenId(s);
  let engraving = '';
  for (let n = 0; n < 16; n++) engraving += `<ellipse cx="223" cy="195" rx="${75+n*2}" ry="${80+n*1.5}" transform="rotate(${n*11.25} 223 195)"/>`;
  const border = `<rect x="12" y="12" width="876" height="356" fill="none" stroke="${p.ink}" stroke-width="1.8"/><rect x="20" y="20" width="860" height="340" fill="none" stroke="${p.ink}" stroke-width=".6"/><path d="M32 65H868M32 313H868" stroke="${p.ink}"/>`;
  const heading = `<text x="34" y="48" font-size="15" letter-spacing="3">NOUNS MONEY WORKSHOP</text><text x="866" y="48" text-anchor="end" font-size="12" letter-spacing="1">UES / LEARNING BY MAKING</text>`;
  const footer = `<text x="34" y="337" font-size="13" letter-spacing="1">ART SPECIMEN · NO MONETARY VALUE</text><text x="866" y="337" text-anchor="end" font-size="12">${identifier}</text>`;
  let content;
  if (face === 'back') {
    content = `<g stroke="${p.ink}" fill="none" opacity=".3">${Array.from({length:13},(_,i)=>`<path d="M40 ${120+i*12}Q240 ${58+i*12} 450 ${120+i*12}T860 ${120+i*12}"/>`).join('')}</g><rect x="170" y="93" width="560" height="188" fill="${p.paper}"/><text x="450" y="133" text-anchor="middle" font-size="13" letter-spacing="4">AN OBJECT CAN HOLD A STORY</text><text x="450" y="185" text-anchor="middle" font-family="Georgia,serif" font-size="38">Made to be looked at.</text><text x="450" y="224" text-anchor="middle" font-size="16">No payment, redemption, ownership, or financial rights.</text><text x="450" y="254" text-anchor="middle" font-size="12">Original Nouns art · CC0 · Independent learning project</text>`;
  } else if (s.composition === 'typographic') {
    content = `<path d="M50 100H580M50 280H580" stroke="${p.ink}"/><text x="50" y="131" font-size="12" letter-spacing="3">COLLECT A LITTLE ATTENTION</text>${titleText(50,180,31,23)}<text x="50" y="256" font-size="15">${escapeXML(theme.subtitle)}</text><circle cx="730" cy="186" r="97" fill="none" stroke="${p.ink}"/><image href="${noun}" x="625" y="81" width="210" height="210" style="image-rendering:pixelated"/>`;
  } else if (s.composition === 'field') {
    content = `<path d="M310 80V299M330 248H850" stroke="${p.ink}"/><image href="${noun}" x="65" y="75" width="225" height="225" style="image-rendering:pixelated"/><text x="340" y="113" font-size="13" letter-spacing="3">EL SEGUNDO / FIELD STUDY</text>${titleText(340,163,29,23)}<text x="340" y="231" font-size="14">${escapeXML(theme.subtitle)}</text><text x="340" y="277" font-size="12">COPY PLAN ${s.copies} · PRINTING IS NOT RESTRICTED</text>`;
  } else {
    content = `<g stroke="${p.ink}" stroke-width=".55" fill="none" opacity=".6">${engraving}</g><ellipse cx="223" cy="199" rx="95" ry="109" fill="${p.paper}"/><image href="${noun}" x="108" y="79" width="230" height="230" style="image-rendering:pixelated"/><text x="425" y="116" font-size="13" letter-spacing="3">A SMALL PAPER WORLD</text>${titleText(425,168,27,21)}<text x="425" y="232" font-size="15">${escapeXML(theme.subtitle)}</text><path d="M425 250H820" stroke="${p.ink}"/><text x="425" y="277" font-size="13" letter-spacing="1">EL SEGUNDO · ART &amp; OBSERVATION</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" role="img" aria-labelledby="${uid}-title ${uid}-desc"><title id="${uid}-title">${title}, ${face} of a collectible art specimen</title><desc id="${uid}-desc">${face==='front'?'Original Nouns '+escapeXML(assetName||theme.noun)+' character in a '+COMPOSITIONS[s.composition].label.toLowerCase()+' composition.':'A statement of the object’s artistic purpose.'} Label: art specimen, no monetary value. ${identifier} is a local design identifier that copies with the artwork.</desc><rect width="900" height="380" rx="2" fill="${p.paper}"/><g fill="${p.ink}" font-family="Arial,Helvetica,sans-serif">${border}${heading}${content}${footer}</g></svg>`;
}
export function briefText(input) {
  const s = normalizeState(input);
  return ['NOUNS MONEY WORKSHOP / UNIVERSITY OF EL SEGUNDO', readyForBrief(s) ? 'PROJECT BRIEF · SELF-CHECKED' : 'PROJECT BRIEF · DRAFT', '', s.title, s.story || '[Add the story you want this object to hold.]', '', `Meaning: ${THEMES[s.theme].label}`, `Composition: ${COMPOSITIONS[s.composition].label}`, `Palette: ${s.colorsOverride?'Imported Workshop colors':PALETTES[s.palette].label}`, `Local design label: ${specimenId(s)} (copies with the artwork; not a registered serial)`, `Planned paper copies: ${s.copies} (a studio plan, not an enforced limit)`, '', ...['A reader identified it as collectible art.','The key label stayed readable on paper.','I can explain why a duplicate has the same identifier.'].map((v,i)=>`[${s.checks[i]?'x':' '}] ${v}`), '', 'ART SPECIMEN · NO MONETARY VALUE', 'No payment, redemption, ownership, accreditation, or financial rights are created.', 'Original Nouns artwork is CC0. Independent project, no official Nouns affiliation.', 'Exhibition proposal: a small El Segundo table display of notes and their stories, with permission from the host. Keep display optional; a private brief counts equally.'].join('\n');
}
