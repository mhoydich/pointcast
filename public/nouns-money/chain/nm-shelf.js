// Nouns Money on devnet-2: reading the edition and checking a claim (pure).
//
// Everything a page decides about a note comes from chain reads plus the
// published recipes (chain.json), never from what a server says a note is:
//   - GET /edition/nouns-money-27/mints gives serial, owner and recipe hash;
//   - recipeIndex(chain.json entries) maps each of the 1,100 possible recipe
//     hashes back to (design, copy);
//   - a claim's approval is signed only after verifyClaim() rebuilt its recipe
//     from chain.json and found the same bytes.
// No DOM, no network: fetchAllMints takes the GET function.
import {
  NM_COPIES_PER_DESIGN,
  NM_DESIGNS,
  NM_EDITION_ID,
  decodeRecipe,
  recipeHash,
  recipeMatchesEntry,
  specimenSerial,
} from './nm-recipe.js';

const HEX64 = /^[0-9a-f]{64}$/;
const RECIPE_HEX = /^[0-9a-f]{106}$/;

/** Every token of the edition, following next_after. `get(path)` resolves to the parsed JSON. */
export async function fetchAllMints(get, edition = NM_EDITION_ID, { limit = 200, max = 2000 } = {}) {
  const mints = [];
  let after = 0;
  for (let page = 0; page < Math.ceil(max / limit) + 1; page += 1) {
    const j = await get(`/edition/${encodeURIComponent(edition)}/mints?after=${after}&limit=${limit}`);
    if (!j || j.edition === null) return { open: false, mints: [] };
    const batch = Array.isArray(j.mints) ? j.mints : [];
    mints.push(...batch);
    const next = Number(j.next_after);
    if (batch.length < limit || !Number.isInteger(next) || next <= after) break;
    after = next;
  }
  return { open: true, mints };
}

/**
 * Index the edition's tokens by design and serial. `index` is recipeIndex(entries).
 * Tokens whose recipe hash is not a published recipe land in `unknown`.
 */
export function indexMints(mints, index) {
  const byDesign = new Map();
  for (let d = 0; d < NM_DESIGNS; d += 1) byDesign.set(d, { specimen: null, copies: [] });
  const bySerial = new Map();
  const unknown = [];
  for (const m of Array.isArray(mints) ? mints : []) {
    const serial = Number(m && m.serial);
    const hash = String((m && m.recipe_hash) || '');
    const hit = index.get(hash);
    if (!Number.isInteger(serial) || serial < 1 || !hit) {
      unknown.push(m);
      continue;
    }
    const token = { serial, design: hit.design, copy: hit.copy, owner: String(m.owner || ''), recipe_hash: hash, minted_at: Number(m.minted_at) };
    bySerial.set(serial, token);
    const slot = byDesign.get(hit.design);
    if (hit.copy === 0) slot.specimen = token;
    else slot.copies.push(token);
  }
  return { byDesign, bySerial, unknown };
}

/** Copies left for one design (public copies 1..10). */
export const copiesLeft = (slot, copies = NM_COPIES_PER_DESIGN) => Math.max(0, copies - new Set(slot.copies.map((t) => t.copy)).size);

const fillT = (template, values) => String(template).replace(/\{(\w+)\}/g, (w, k) => (k in values ? String(values[k]) : w));
const shortAddr = (a) => (a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-4)}` : a);

/** "3 of 10 copies left · specimen on the house shelf", from the shelf copy strings. */
export function shelfLine(slot, { house, shelf, copies = NM_COPIES_PER_DESIGN }) {
  const left = copiesLeft(slot, copies);
  const first = left > 0 ? fillT(shelf.copiesLeft, { left, copies }) : fillT(shelf.allCollected, { copies });
  let second;
  if (!slot.specimen) second = shelf.specimenMissing;
  else if (house && slot.specimen.owner === house) second = shelf.specimenHouse;
  else second = fillT(shelf.specimenElsewhere, { owner: shortAddr(slot.specimen.owner) });
  return `${first} · ${second}`;
}

/**
 * Check a POST /nm/claim answer before anything is signed. Returns the fields
 * edition_mint needs; throws an Error whose message says what did not match.
 *
 * Expected answer (pointcast-chain nm.js, plan §3 step 3; INTEGRATION: the
 * Worker did not exist when this was written):
 *   { recipe: hex (53 bytes), approval: hex, approval_expires: height,
 *     recipe_hash?, design?, copy?, sender?, recipient?, edition? }
 */
export function verifyClaim(resp, { entry, sender }) {
  if (!resp || typeof resp !== 'object') throw new Error('no answer');
  const recipe = String(resp.recipe || '').toLowerCase();
  if (!RECIPE_HEX.test(recipe)) throw new Error('recipe is not 53 bytes of hex');
  let decoded;
  try {
    decoded = decodeRecipe(recipe);
  } catch (e) {
    throw new Error(`recipe does not decode (${e.message})`);
  }
  if (decoded.design !== entry.design) throw new Error(`recipe is design ${decoded.design}, asked for ${entry.design}`);
  if (decoded.copy < 1 || decoded.copy > NM_COPIES_PER_DESIGN) throw new Error(`copy ${decoded.copy} is not a public copy (1-${NM_COPIES_PER_DESIGN})`);
  if (!recipeMatchesEntry(decoded, entry)) throw new Error('art hashes differ from chain.json');
  const hash = recipeHash(recipe);
  if (resp.recipe_hash !== undefined && String(resp.recipe_hash).toLowerCase() !== hash) throw new Error('recipe_hash does not hash the recipe');
  if (resp.design !== undefined && Number(resp.design) !== decoded.design) throw new Error('design field disagrees with the recipe');
  if (resp.copy !== undefined && Number(resp.copy) !== decoded.copy) throw new Error('copy field disagrees with the recipe');
  if (resp.edition !== undefined && resp.edition !== NM_EDITION_ID) throw new Error(`edition is ${resp.edition}`);
  for (const k of ['sender', 'recipient']) {
    if (resp[k] !== undefined && resp[k] !== sender) throw new Error(`${k} is not your wallet`);
  }
  const approval = String(resp.approval || '');
  if (!/^[0-9a-f]{128}$/i.test(approval)) throw new Error('approval is not a 64-byte signature');
  const expires = Number(resp.approval_expires);
  if (!Number.isInteger(expires) || expires < 1) throw new Error('approval_expires is not a height');
  return { design: decoded.design, copy: decoded.copy, recipe, recipeHash: hash, approval, approval_expires: expires };
}

/** The token carrying `hash`, if the edition has minted it. */
export const findByRecipeHash = (mints, hash) => (Array.isArray(mints) ? mints : []).find((m) => m && m.recipe_hash === hash) || null;

/**
 * What the note page says about one serial. `token` is indexMints().bySerial.get(serial)
 * (or undefined); `rawMint` is the chain's record for that serial, if any.
 */
export function judgeSerial(serial, { token, rawMint, entries }) {
  if (!token && !rawMint) return { state: 'not-collected' };
  if (!token) return { state: 'unknown-recipe', rawMint };
  const entry = entries.find((e) => e.design === token.design);
  if (serial <= NM_DESIGNS && (token.copy !== 0 || specimenSerial(token.design) !== serial)) {
    return { state: 'order', token, entry, expected: serial - 1 };
  }
  return { state: 'found', token, entry };
}

/** sha256 hex of bytes, via WebCrypto (browsers and Node 20+). */
export async function sha256Hex(bytes) {
  const d = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const isHex64 = (s) => HEX64.test(String(s || ''));
