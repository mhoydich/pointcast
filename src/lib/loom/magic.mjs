/**
 * Magic words (OFF-49 A). A message whose first line is one word alone — shout, dice, time,
 * drum or noun — gets a small server-made fact attached as `magic` at send time. The body is
 * never changed; the plain words are always there underneath. See docs/loom-magic-words.md.
 *
 * Normalization: the first line, trimmed and lowercased, must equal the word exactly.
 * "dice", "  DICE  " and "dice\nwhat a night" count; "Dice!" and "dice roll please" do not.
 *
 * Rules this module keeps: a word never spends, mints, ships or approves; a fetch word says
 * where its fact came from and when; one word per message (only the first line is read).
 */
import { NOUN_ACCESSORIES, NOUN_BACKGROUNDS, NOUN_BODIES, NOUN_GLASSES, NOUN_HEADS } from './noun-traits.mjs';

export const MAGIC_WORDS = ['shout', 'dice', 'time', 'drum', 'noun'];
const WORDS = new Set(MAGIC_WORDS);
const DRUM_WAIT_MS = 1500;

/** The magic word a body starts with, or null. */
export function magicWord(body) {
  const first = String(body ?? '').split('\n', 1)[0].trim().toLowerCase();
  return WORDS.has(first) ? first : null;
}

/** One fair roll, 1 to 6: bytes 252..255 are thrown back so no face is favoured. */
export function rollDie() {
  const buf = new Uint8Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    if (buf[0] < 252) return (buf[0] % 6) + 1;
  }
}

function clockParts(date, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone, weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }).formatToParts(date).map((p) => [p.type, p.value]));
  return { clock: `${parts.hour}:${parts.minute}${String(parts.dayPeriod).toLowerCase()}`, day: `${parts.weekday} ${parts.month} ${parts.day}` };
}

/** The server clock as New York time and UTC. The poster's own zone is not known to the server. */
export function timeValue(date) {
  const ny = clockParts(date, 'America/New_York');
  const utc = date.toISOString();
  return { newYork: ny.clock, newYorkDay: ny.day, zone: 'New York', utc: `${utc.slice(11, 16)}`, utcDay: utc.slice(0, 10) };
}

/** A small Noun from the sender's name: the same name always gets the same trait names. */
export async function nounFor(name) {
  const norm = String(name ?? '').trim().toLowerCase();
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`loom:noun:${norm}`)));
  const view = new DataView(digest.buffer);
  const pick = (list, i) => list[view.getUint32(i * 4) % list.length];
  return {
    background: pick(NOUN_BACKGROUNDS, 0),
    body: pick(NOUN_BODIES, 1),
    accessory: pick(NOUN_ACCESSORIES, 2),
    head: pick(NOUN_HEADS, 3),
    glasses: pick(NOUN_GLASSES, 4),
  };
}

async function readDrum(drumCount) {
  if (typeof drumCount !== 'function') return null;
  let timer;
  try {
    const n = await Promise.race([drumCount(), new Promise((r) => { timer = setTimeout(() => r(null), DRUM_WAIT_MS); })]);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  } catch { return null; } finally { clearTimeout(timer); }
}

/**
 * The server-made field for a message, or null when its first line is not a magic word.
 * Never throws: a fact that cannot be read comes back as value null.
 */
export async function makeMagic(body, { from, now, drumCount } = {}) {
  const word = magicWord(body);
  if (!word) return null;
  const at = now ?? new Date().toISOString();
  if (word === 'shout') return { word };
  if (word === 'dice') return { word, value: rollDie(), source: 'the Loom server', at };
  if (word === 'time') return { word, value: timeValue(new Date(at)), source: 'the Loom server clock', at };
  if (word === 'drum') return { word, value: await readDrum(drumCount), source: 'the PointCast drum counter, read by the Loom server', at };
  try {
    return { word, value: await nounFor(from?.name), source: 'the Loom server, from the sender’s name', at };
  } catch { return { word, value: null, source: 'the Loom server, from the sender’s name', at }; }
}

/** Fold helper: the magic still shows only while the first line still says its word. */
export const magicStillSays = (magic, body) => !!magic && magicWord(body) === magic.word;
