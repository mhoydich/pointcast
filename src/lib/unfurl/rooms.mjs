/**
 * Unfurl rooms — which pages get a live card, which get a motion loop, what
 * channel colour a generated card wears, and the one-liner at its foot.
 *
 * Plain data so the build (BlockLayout), the edge (functions/og/*) and the
 * tests all read the same table. Channel colours mirror src/lib/channels.ts.
 */

export const CHANNEL_COLORS = {
  FD:  { name: 'Front Door', c600: '#185FA5', tint: '#EEF4FA' },
  CRT: { name: 'Court',      c600: '#3B6D11', tint: '#EFF5E9' },
  SPN: { name: 'Spinning',   c600: '#993C1D', tint: '#FBEEE9' },
  GF:  { name: 'Good Feels', c600: '#993556', tint: '#F8ECF0' },
  GDN: { name: 'Garden',     c600: '#0F6E56', tint: '#EAF5F1' },
  ESC: { name: 'El Segundo', c600: '#534AB7', tint: '#EFEDF8' },
  FCT: { name: 'Faucet',     c600: '#BA7517', tint: '#FBF3E4' },
  VST: { name: 'Visit',      c600: '#5F5E5A', tint: '#F3F3F1' },
  BTL: { name: 'Battler',    c600: '#8A2432', tint: '#F6ECEF' },
  BDY: { name: 'Birthday',   c600: '#D86440', tint: '#FCEFEA' },
};

/** First matching prefix wins. Anything unmatched gets a stable colour from its path. */
const CHANNEL_PREFIXES = [
  [/^\/(drum|station|music|karaoke|sing|sounds|listen|dj|beat)/, 'SPN'],
  [/^\/(paddle|rally|pickleball|court|tug|race|duel)/, 'CRT'],
  [/^\/(prayer|bell|garden|meditat|grey-hour|zen|candle|votive|bench|altar|labyrinth|chime)/, 'GDN'],
  [/^\/(el-segundo|window|weather|solar|almanac|marine|tide|beach|pool-together|potters|room-weather)/, 'ESC'],
  [/^\/(faucet|drop|collect|mint|editions|till|x402)/, 'FCT'],
  [/^\/(nouns-battler|battle|battler|arena)/, 'BTL'],
  [/^\/(good-feels|gf|goodfeels|kennel)/, 'GF'],
  [/^\/(visit|residents|yard|u\/|me|profile|auth|dashboard)/, 'VST'],
  [/^\/(birthday|cake|party)/, 'BDY'],
  [/^\/(shortwave|today|b\/|wire|now|front|start)/, 'FD'],
];

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function channelForPath(pathname = '/') {
  const p = String(pathname).toLowerCase();
  for (const [re, code] of CHANNEL_PREFIXES) if (re.test(p)) return code;
  const codes = Object.keys(CHANNEL_COLORS);
  return codes[hashString(p) % codes.length];
}

/** Noun seed 0–1199 (the Visit Nouns FA2 range served by noun.pics) for a path. */
export function nounForPath(pathname = '/') {
  return hashString(`noun:${String(pathname).toLowerCase()}`) % 1200;
}

/** Normalise a page path the way cards and caches key it: leading slash, no trailing slash, no query. */
export function cardPath(pathname = '/') {
  let p = String(pathname || '/').split(/[?#]/, 1)[0];
  if (!p.startsWith('/') || p.startsWith('//') || p.includes('..')) return null;
  if (p.length > 1) p = p.replace(/\/+$/, '');
  if (p.length > 160 || /[^A-Za-z0-9/_.~%-]/.test(p)) return null;
  return p || '/';
}

/**
 * Rooms whose card is drawn from live state at request time. The middleware
 * points their og:image at /og/live/<room>.png with a five-minute bucket.
 */
export const LIVE_ROOMS = {
  '/shortwave': 'shortwave',
  '/station':   'station',
  '/tug':       'tug',
  '/drum':      'drum',
  '/window':    'window',
  '/bell-post': 'bell-post',
};

/**
 * Rooms with a short motion loop (og:video). Clients that play video in link
 * previews (iMessage, Discord, Telegram, Facebook) show the loop; X and Slack
 * keep the still card. Files come from scripts/og-motion.mjs.
 */
export const MOTION_ROOMS = {
  '/drum':       { src: '/images/og/motion/drum.mp4' },
  '/bell-choir': { src: '/images/og/motion/bell-choir.mp4' },
  '/tug':        { src: '/images/og/motion/tug.mp4' },
  '/station':    { src: '/images/og/motion/station.mp4' },
};

export function liveRoomFor(pathname) {
  const p = cardPath(pathname);
  return p ? LIVE_ROOMS[p] ?? null : null;
}

export function motionFor(pathname) {
  const p = cardPath(pathname);
  return p ? MOTION_ROOMS[p] ?? null : null;
}

/** The generic default cards a page falls back to — these get swapped for a page card. */
export const DEFAULT_CARD_RE = /\/images\/(og\/)?og-home-v[0-9]+\.png/;

/**
 * Cards dozens of pages borrowed (51 drum-house pages wore the altars card,
 * 32 wore the drum card). Only the owner keeps them; everyone else gets
 * a card of their own.
 */
const SHARED_CARDS = [
  { re: /\/images\/og-drum-altars\.png/, owner: '/drum-altars' },
  { re: /\/images\/og-drum\.png/, owner: '/drum' },
];

/** Should this page's current card be replaced with its own generated card? */
export function wantsOwnCard(pathname, currentImage = '') {
  if (!currentImage || DEFAULT_CARD_RE.test(currentImage)) return true;
  const p = cardPath(pathname);
  return SHARED_CARDS.some(({ re, owner }) => re.test(currentImage) && p !== owner);
}

/* ---------------------------------------------------------------- quips */

const GENERIC_QUIPS = [
  'Still experimental. Still on.',
  'Broadcasting from El Segundo, population: whoever is here.',
  'This card was drawn for you about a minute ago.',
  'No login required to look around.',
  'Every door in town is open. Some of them squeak.',
  'Made by a person and a few agents who keep odd hours.',
  'The sign says OPEN. The sign is usually right.',
  'A small internet town. Mind the drum circle.',
  'Tap in. Nothing to sign up for.',
  'Hand-made. Machine-helped. Human-signed.',
  'You are one link away from the whole town.',
  'Local news from a very local internet.',
  'It changes. Come back and see.',
  'Weather: the marine layer has opinions.',
  'Somewhere in this town a bell is ringing.',
  'The card knows what time it is. Do you?',
];

const ROOM_QUIPS = {
  SPN: ['Turn it up a little.', 'Currently spinning. Always spinning.', 'Requests welcome at the station.'],
  CRT: ['Dink responsibly.', 'Scores kept honestly.', 'Winners buy the next round of paddles.'],
  GDN: ['Breathe out. The card will wait.', 'Quiet room. Leave a candle.', 'A bell for whoever needs one.'],
  ESC: ['Wind from the west, as usual.', 'Fog in, fog out.', 'Somewhere near Imperial and Main.'],
  FCT: ['One drip at a time.', 'Free, then free again tomorrow.', 'The faucet does not judge.'],
  BTL: ['Nouns were harmed in the making of this card. Slightly.', 'Rivalry night is every night.', 'Pick a side. Bring noggles.'],
  GF:  ['Good feels, measured honestly.', 'Today’s dog is judging you kindly.', 'Sit. Stay. Claim.'],
  VST: ['Wipe your feet, come on in.', 'Residents welcome. So are visitors.', 'The yard is open for building.'],
  BDY: ['Somebody in town is a year older.', 'Cake is a state of mind.', 'Candles lit, wishes pending.'],
  FD:  ['Front page of a very small town.', 'Hot off the wire.', 'Read it before it changes.'],
};

/** The client line: who is unfurling this card, if they said so. */
export const CLIENT_LINES = {
  slack: 'hello, Slack.',
  imessage: 'hello, iMessage.',
  x: 'hello, X.',
  discord: 'hello, Discord.',
  telegram: 'hello, Telegram.',
  whatsapp: 'hello, WhatsApp.',
  linkedin: 'hello, LinkedIn. We promise this is not a job post.',
  facebook: 'hello, Facebook.',
  bluesky: 'hello, Bluesky.',
  mastodon: 'hello, fediverse.',
  signal: 'hello, Signal.',
  google: 'hello, Google.',
  agent: 'hello, agent. There is a manifest at /agents.json.',
};

/** Deterministic quip for (path, bucket): stable within a light period, different the next. */
export function quipFor(pathname, bucket = '', channel = channelForPath(pathname)) {
  const pool = [...(ROOM_QUIPS[channel] ?? []), ...GENERIC_QUIPS];
  return pool[hashString(`${pathname}|${bucket}`) % pool.length];
}
