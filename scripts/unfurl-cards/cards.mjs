// Unfurl cards for the static areas under public/: which pages have a card, the words on it,
// and the <head> tags that point at it. Data and string helpers only, so the page generators
// (scripts/coast-commons/build.mjs, scripts/coast-commons-studies/build.mjs) and the tests can
// import this file without a renderer. The drawings are in draw.mjs; build.mjs writes the files.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const PUBLIC = resolve(ROOT, 'public');
export const SITE = 'https://pointcast.xyz';
export const W = 1200;
export const H = 630;
// Unfurl text limits. Titles and descriptions longer than this get cut off in previews.
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 160;

const BB = 'baby-bonfire';
const CC = 'coast-commons';
const HC = 'house';

// Baby Bonfire scenes with a card. One template: the scene's own house from the hub street
// with its window lit. Two scenes draw something of their own instead. A scene that joins the
// street later keeps the request-time card until it gets a row here and the build is run.
const SCENES = [
  ['light-the-hearth', 'Light the Hearth', ['Light the', 'Hearth'], ['Stack three pallets, carry a flame', 'over, then put the lid on.']],
  ['the-shelf', 'The Shelf', ['The Shelf'], ['Set seven pieces on five stones', 'and see what the room does.']],
  ['pieces-roam', 'The Roaming Shelf', ['The Roaming', 'Shelf'], ['Carry eight pieces around a home', 'seen from above.'], {
    motif: 'plan',
    description: 'A home seen from above. Carry eight pieces between seventeen places and the arrangement is the message: a piece on the entry shelf says home.',
    alt: 'The Roaming Shelf, a Baby Bonfire concept sketch. A drawing of a home seen from above: four rooms, seventeen round places and eight glowing pieces, one being carried from the desk to the window.',
  }],
  ['the-rounds', 'The Rounds', ['The Rounds'], ['Carry a piece to a spot at dawn,', 'midday, dusk or night.']],
  ['any-object', 'Any Object, Any World', ['Any Object,', 'Any World'], ['Stick a dot on anything you love', 'and it becomes a piece.']],
  ['paired-hearths', 'Paired Hearths', ['Paired', 'Hearths'], ['Tap one hearth to light it', 'and the other home glows.']],
  ['mesh-street', 'Mesh Street', ['Mesh Street'], ['Tap a house to light it and watch', 'the signal cross town.'], {
    motif: 'mesh',
    alt: 'Mesh Street, a Baby Bonfire concept sketch. A drawing of four small houses at dusk with a signal hopping from roof to roof and up to a relay mast.',
  }],
  ['stations', 'Stations', ['Stations'], ['Try four places that like company:', 'drum, voice, dance, stretch.']],
  ['weather-in-the-house', 'Weather in the House', ['Weather in', 'the House'], ['Set the sky and watch six pieces', 'follow it indoors.']],
  ['five-levels', 'Five Levels of Magic', ['Five Levels', 'of Magic'], ['Step one hearth through five', 'levels of magic.']],
  ['seven-homes', 'Seven Homes', ['Seven Homes'], ['Explore seven houses, then', 'build your own.']],
  ['cabinet-of-no-bounds', 'The Cabinet of No Bounds', ['The Cabinet', 'of No Bounds'], ['Open a niche and try one of', 'sixteen impossible objects.']],
  ['ritual-atlas', 'Ritual Atlas', ['Ritual Atlas'], ['Browse thirty-five rituals', 'by element and by occasion.']],
  ['anchors-and-open-time', 'Anchors and Open Time', ['Anchors and', 'Open Time'], ['Spin three rings and mark', 'the moments you did not plan.']],
  ['precedents', 'Precedents Wall', ['Precedents', 'Wall'], ['Browse other people’s work,', 'each card with a link out.']],
];

// path: the page. headline and line: the words drawn on the card, already broken into rows.
// title and description: only where the page's own og:title or og:description is too long for
// an unfurl; pages that leave them out keep the words they have. alt: what the picture shows.
export const CARDS = [
  {
    path: '/baby-bonfire/', area: BB, kicker: 'OPEN EXPLORATION', motif: 'street',
    // No count in these words: the street grows, and the card draws however many houses it has.
    headline: ['Baby Bonfire'], line: ['Open the windows on one dusk', 'street, each a sketch to play with.'],
    description: 'Small home objects that bring fire, water, air, earth, light, weather and sound indoors without a screen. Concept sketches. Nothing is for sale.',
    alt: 'Baby Bonfire. A drawing of small houses on a hillside street at dusk, every window lit, and a beacon burning on the hilltop.',
  },
  ...SCENES.map(([slug, name, headline, line, extra = {}]) => ({
    path: `/baby-bonfire/${slug}/`, area: BB, kicker: 'BABY BONFIRE', motif: 'house', scene: slug, headline, line,
    alt: `${name}, a Baby Bonfire concept sketch. A drawing of a small house on a dusk street with its window lit.`,
    ...extra,
  })),
  {
    path: '/coast-commons/', area: CC, kicker: 'A PUBLIC GOOD · OPEN STUDY', motif: 'coast',
    headline: ['Coast', 'Commons'], line: ['Read what a shared house could', 'be in fifteen beach towns.'],
    title: 'Coast Commons: shared houses for beach towns near El Segundo',
    description: "A free, open study of community-run shared houses for fifteen beach towns within about 25 miles of El Segundo, with each town's official rules. Not an offer.",
    alt: 'Coast Commons. A study, not an offer. A drawn strip of coast with fifteen stops from Malibu to Seal Beach and a small house marking El Segundo.',
  },
  {
    path: '/coast-commons/el-segundo/', area: CC, kicker: 'COAST COMMONS', motif: 'tenSeats',
    headline: ['The El Segundo', 'house'], line: ['Tick through six steps that start', 'with ten people and no purchase.'],
    description: 'What a shared, openly run commons house could be in El Segundo, what the city permits, and a six-step ladder that starts with ten people. A study, not an offer.',
    alt: 'The El Segundo house, a Coast Commons study, not an offer. A drawing of a small gabled house on a bluff above the sea with ten round seats in a ring in front of it.',
  },
  {
    path: '/coast-commons/pattern/', area: CC, kicker: 'COAST COMMONS', motif: 'recipe',
    headline: ['The commons', 'recipe'], line: ['Copy six ingredients, in order,', 'then split a weekend’s cost.'],
    description: 'The open recipe behind Coast Commons: six ingredients, in order, with a cost-split calculator and a ledger template. A study, not an offer.',
    alt: 'The commons recipe, a Coast Commons study, not an offer. A drawn recipe card listing six numbered ingredients, from the first ten people to a public-good share.',
  },
  {
    path: '/coast-commons/sb-surf-house/', area: CC, kicker: 'COAST COMMONS', motif: 'surfHouse',
    headline: ['SB Surf House'], line: ['Compare three schematic plans', 'and work out a cost per member.'],
    description: 'What it would take for a community to run a shared surf house on the Santa Barbara coast: rules, ownership, costs and a nine-step ladder. A study, not an offer.',
    alt: 'SB Surf House, a Coast Commons study, not an offer. A drawing of fog over a ridge, kelp beds, a wave along the point and a small tile-roofed house on a sandstone bluff.',
  },
  {
    path: '/coast-commons/fresh-milk/', area: CC, kicker: 'COAST COMMONS', motif: 'freshMilk',
    headline: ['Fresh Milk,', 'Local'], line: ['Read the dairy rules, then count', 'the animals a group would need.'],
    description: 'Could a South Bay neighbourhood get fresh milk from close by? Dairy law, food safety, animal zoning by town and a six-rung ladder. A study, not an offer.',
    alt: 'Fresh Milk, Local, a Coast Commons study, not an offer. A drawing of a cow on a hill above the ocean, a barn, bands of fog and a glass milk bottle.',
  },
  {
    path: '/house/', area: HC, kicker: 'A TV AND A PHONE', motif: 'tv',
    headline: ['House', 'Channel'], line: ['Put a hearth on the TV and', 'use your phone as the remote.'],
    alt: 'House Channel. A drawing of a TV in a dark room showing a hearth fire, with a phone beside it as the remote.',
  },
  {
    path: '/house/about/', area: HC, kicker: 'HOUSE CHANNEL', motif: 'fourViews',
    headline: ['The TV as', 'the hearth'], line: ['Open one page on the TV,', 'type five letters on a phone.'],
    alt: 'House Channel: the TV as the hearth. A drawing of four small screens: a hearth, a window on the sky, a hillside of lights and a drum.',
  },
];

// Small type at the foot of every card in an area.
export const STATUS = {
  [BB]: 'concept sketch · nothing is for sale',
  [CC]: 'a study, not an offer',
  [HC]: 'no account · no app',
};

const byPath = new Map(CARDS.map((c) => [c.path, c]));
export const cardFor = (path) => byPath.get(path) ?? null;
export const pngFile = (card) => `public${card.path}card.png`;
export const pageFile = (card) => `public${card.path}index.html`;

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The card's absolute URL. It carries a hash of the PNG, the same hash BlockLayout puts on
 * its cards (versionedImageUrl in src/lib/og-version.mjs): apps cache a preview image by URL,
 * so new pixels need a new URL. Read fresh each time, because build.mjs rewrites the files.
 */
export function cardUrl(card, publicDir = PUBLIC) {
  const file = resolve(publicDir, `.${card.path}card.png`);
  if (!existsSync(file)) throw new Error(`unfurl cards: ${pngFile(card)} is missing. Run node scripts/unfurl-cards/build.mjs`);
  const hash = createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 10);
  return `${SITE}${card.path}card.png?v=${hash}`;
}

function limit(card, title, description) {
  // Lengths are of the words as read, not of their HTML escapes.
  const plain = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  if (plain(title).length > TITLE_MAX) throw new Error(`unfurl cards: ${card.path} title is over ${TITLE_MAX} characters`);
  if (plain(description).length > DESCRIPTION_MAX) throw new Error(`unfurl cards: ${card.path} description is over ${DESCRIPTION_MAX} characters`);
}

/**
 * The image and Twitter tags for a page with a card. `title` and `description` are the page's
 * og:title and og:description as they sit in the HTML, already escaped.
 */
export function cardTags(card, title, description, publicDir = PUBLIC) {
  limit(card, title, description);
  const url = cardUrl(card, publicDir);
  const alt = esc(card.alt);
  return [
    `<meta property="og:image" content="${url}">`,
    '<meta property="og:image:type" content="image/png">',
    `<meta property="og:image:width" content="${W}">`,
    `<meta property="og:image:height" content="${H}">`,
    `<meta property="og:image:alt" content="${alt}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${url}">`,
    `<meta name="twitter:image:alt" content="${alt}">`,
  ].join('\n');
}

/**
 * For the page generators: the whole Open Graph block of a page with a card, given the title
 * and description the page would otherwise use. Returns null for a page without a card.
 */
export function shareHead(path, title, description, publicDir = PUBLIC) {
  const card = cardFor(path);
  if (!card) return null;
  const t = esc(card.title ?? title);
  const d = esc(card.description ?? description);
  return [
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:url" content="${SITE}${path}">`,
    '<meta property="og:type" content="website">',
    cardTags(card, t, d, publicDir),
  ].join('\n');
}

const OWNED = /^<meta (?:property="og:image(?::[a-z_]+)?"|name="twitter:[a-z:_]+") content="[^"]*">\n/gm;
const META = (prop) => new RegExp(`(<meta property="${prop}" content=")([^"]*)(">)`);

/**
 * For the hand-written pages: the same page with its card tags in place, after the last og:
 * tag in the head. Writing them twice changes nothing.
 */
export function stampHead(html, card, publicDir = PUBLIC) {
  const end = html.indexOf('</head>');
  if (end < 0) throw new Error(`unfurl cards: ${pageFile(card)} has no </head>`);
  let head = html.slice(0, end).replace(OWNED, '');
  for (const [prop, value] of [['og:title', card.title], ['og:description', card.description]]) {
    if (!META(prop).test(head)) throw new Error(`unfurl cards: ${pageFile(card)} has no ${prop}`);
    if (value !== undefined) head = head.replace(META(prop), (_, a, __, c) => `${a}${esc(value)}${c}`);
  }
  const title = head.match(META('og:title'))[2];
  const description = head.match(META('og:description'))[2];
  const lines = head.split('\n');
  let last = -1;
  lines.forEach((line, i) => { if (line.startsWith('<meta property="og:')) last = i; });
  lines.splice(last + 1, 0, cardTags(card, title, description, publicDir));
  return lines.join('\n') + html.slice(end);
}

/** Scenes on the Baby Bonfire street (public/baby-bonfire.json) that have no card yet. */
export function scenesWithoutCard(root = ROOT) {
  const twin = JSON.parse(readFileSync(resolve(root, 'public/baby-bonfire.json'), 'utf8'));
  return twin.scenes.map((s) => s.slug).filter((slug) => !byPath.has(`/baby-bonfire/${slug}/`));
}

/** Pages whose HTML is written by another generator, which calls shareHead() itself. */
export const GENERATED = (card) => card.area === CC;

/** Width and height of a PNG file, read from its header. */
export function pngSize(file) {
  const b = readFileSync(file);
  if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47 || b.toString('latin1', 12, 16) !== 'IHDR') throw new Error(`${file} is not a PNG`);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

/** What is out of step: a missing or wrong-sized PNG, or a page whose tags do not match. */
export function stale(root = ROOT) {
  const out = [];
  const publicDir = resolve(root, 'public');
  for (const card of CARDS) {
    const png = resolve(root, pngFile(card));
    const page = resolve(root, pageFile(card));
    if (!existsSync(png)) { out.push(`${pngFile(card)}: missing`); continue; }
    const { width, height } = pngSize(png);
    if (width !== W || height !== H) out.push(`${pngFile(card)}: ${width}x${height}, not ${W}x${H}`);
    if (!existsSync(page)) { out.push(`${pageFile(card)}: missing`); continue; }
    const html = readFileSync(page, 'utf8');
    if (GENERATED(card)) {
      if (!html.includes(`<meta property="og:image" content="${cardUrl(card, publicDir)}">`)) out.push(`${pageFile(card)}: card tags are out of date; run its generator`);
    } else if (stampHead(html, card, publicDir) !== html) out.push(`${pageFile(card)}: card tags are out of date`);
  }
  return out;
}
