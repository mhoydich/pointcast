/** Local artwork preferences and print planning. No accounts, tokens or network operations. */
export const FAVORITES_KEY = 'pointcast.nouns-money.app.favorites.v1';
const MAX_RECORDS = 512;
const MAX_STORAGE_BYTES = 65536;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,63}$/;
const TABS = new Set(['catalog', 'saved', 'workshop', 'studio']);

function text(value, label, fallback) {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'string' || !value.trim() || value.length > 2000) throw new TypeError(`Invalid ${label}`);
  return value.trim();
}
function sourceList(value, label, catalogObject = false) {
  if (value === undefined) return [];
  const list = catalogObject && !Array.isArray(value) ? value?.catalog : value;
  if (!Array.isArray(list) || list.length > MAX_RECORDS) throw new TypeError(`Invalid ${label} catalog`);
  return list;
}
function filename(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/.test(value) || value.includes('..')) throw new TypeError('Invalid artwork filename');
  return value;
}
function asset(value, prefix, extension) {
  if (typeof value !== 'string' || !value.startsWith(prefix) || !value.endsWith(extension)) throw new TypeError('Invalid artwork asset path');
  filename(value.slice(prefix.length, -extension.length));
  return value;
}
function dimensions(note, width, height) {
  if (note.width === undefined && note.height === undefined) return { width, height };
  if (![note.width, note.height].every(n => Number.isSafeInteger(n) && n >= 1 && n <= 20000)) throw new RangeError('Invalid artwork dimensions');
  return { width: note.width, height: note.height };
}
function nounId(value) {
  if (!Number.isInteger(value) || value < 0 || value > 99) throw new RangeError('Invalid source Noun ID');
  return value;
}
const EXACT_DISCLAIMER = 'Exact-source CC0 Noun artwork in a collectible design. No source NFT ownership, official endorsement, monetary value or redemption. Physical production is unverified.';
const STUDY_DISCLAIMER = 'Generated visual interpretation, not an exact-source print master. Numbers and serial-like marks are fictional. Material and security effects and physical production are unverified; no monetary value or redemption.';

/** Accept the current source JSON catalogs and exported original/study arrays, without changing them. */
export function buildCatalog({ hundred, originals, studies, everyday, flowers } = {}) {
  const catalog = [];
  const add = record => {
    if (!SAFE_ID.test(record.id) || catalog.some(note => note.id === record.id) || catalog.length >= MAX_RECORDS) throw new RangeError('Duplicate or invalid artwork ID');
    catalog.push(record);
  };
  for (const note of sourceList(hundred, 'Nordic', true)) {
    const n = nounId(note.nounId);
    const id = `nm100-${String(n).padStart(3, '0')}`;
    const serial = `NM27-${String(n + 1).padStart(6, '0')}`;
    const file = `Nouns-Money-2027-Noun-${String(n).padStart(3, '0')}-${serial}`;
    if (note.file !== file || note.serial !== serial) throw new TypeError('Nordic artwork identity mismatch');
    const base = `/images/nouns-money/nordic-100/${file}`;
    add({ id, title: `Noun #${n} · ${serial}`, seriesKey: 'nordic', seriesLabel: 'Nordic 2027', kind: 'exact-source', image: `${base}.webp`, original: `${base}.svg`, svg: `${base}.svg`, ...dimensions(note, 1000, 500), description: `Authentic Noun #${n} in the Nordic 2027 collectible art catalog. ${serial} identifies this design, not an issued note or token.`, disclaimer: EXACT_DISCLAIMER, detailHref: '/nouns-money/#hundred' });
  }
  for (const note of sourceList(originals, 'Original')) {
    if (typeof note.id !== 'string' || !/^nm-(0[1-9]|10)$/.test(note.id)) throw new TypeError('Invalid original artwork ID');
    const file = filename(note.file);
    if (!Array.isArray(note.nouns) || !note.nouns.length || note.nouns.length > 10) throw new TypeError('Invalid original Noun references');
    note.nouns.forEach(nounId);
    const base = `/images/nouns-money/${file}`;
    add({ id: `original-${note.id}`, title: text(note.name, 'original title'), seriesKey: 'originals', seriesLabel: 'Original ten · Collection 01', kind: 'exact-source', image: `${base}.webp`, original: `${base}.svg`, svg: `${base}.svg`, ...dimensions(note, 1400, 700), description: `Original collectible design with ${note.nouns.map(n => `Noun #${n}`).join(', ')}. ${text(note.specimenId, 'specimen identifier')} is a design identifier, not an issued-note serial.`, disclaimer: EXACT_DISCLAIMER, detailHref: '/nouns-money/#collection' });
  }
  sourceList(studies, 'Study').forEach((note, index) => {
    const file = filename(note.file);
    const image = `/images/nouns-money/nordic-2027/${file}.webp`;
    if (note.referenceNoun !== null && note.referenceNoun !== undefined) nounId(note.referenceNoun);
    add({ id: `study-${String(index + 1).padStart(2, '0')}`, title: text(note.name, 'study title'), seriesKey: 'studies', seriesLabel: 'Nordic 2027 · visual studies', kind: 'generated-study', image, original: image, ...dimensions(note, 1400, 700), description: `Generated Nordic 2027 visual study${note.referenceNoun === null || note.referenceNoun === undefined ? '.' : ` using Noun #${note.referenceNoun} as a reference.`}`, disclaimer: STUDY_DISCLAIMER, detailHref: '/nouns-money/#nordic-2027' });
  });
  for (const note of sourceList(everyday, 'Everyday', true)) {
    if (typeof note.serial !== 'string' || !/^NM28-(00[1-9]|0[1-4][0-9]|050)$/.test(note.serial)) throw new TypeError('Invalid Everyday artwork serial');
    nounId(note.nounId);
    const prefix = '/images/nouns-money/everyday-2028/';
    const id = note.serial.toLowerCase();
    add({ id, title: text(note.title, 'Everyday title'), seriesKey: 'everyday', seriesLabel: 'Everyday Collection · 2028', kind: 'exact-source', image: asset(note.preview, prefix, '.webp'), original: asset(note.svg, prefix, '.svg'), svg: note.svg, ...dimensions(note, 1000, 667), description: text(note.description, 'Everyday description'), disclaimer: `${EXACT_DISCLAIMER} Planned 1 tez price only; mint unavailable and edition quantity undecided.`, detailHref: `/nouns-money/editions/#${id}` });
  }
  for (const note of sourceList(flowers, 'Flower')) {
    const match = typeof note.id === 'string' && /^(?:flower-)?(0[1-9]|[1-9][0-9])$/.exec(note.id);
    if (!match) throw new TypeError('Invalid flower artwork ID');
    const id = `flower-${match[1]}`;
    const file = filename(note.file);
    const base = `/images/nouns-money/flowers-2026/${file}`;
    add({ id, title: text(note.title, 'flower title'), seriesKey: 'flowers', seriesLabel: 'Flower plates · 2026', kind: 'generated-study', image: `${base}.webp`, original: `${base}.png`, ...dimensions(note, 1536, 1024), description: text(note.description, 'flower description'), disclaimer: 'Generated Nouns-inspired flower concept plate, not authenticated Noun pixel art. Decorative collectible art, not valid postage, legal tender, an issued coin, backing or redemption. Physical production is unverified.', detailHref: `/nouns-money/app/#catalog/art/${id}` });
  }
  return catalog;
}

function catalogIds(catalog) {
  if (!Array.isArray(catalog) || catalog.length > MAX_RECORDS) throw new TypeError('Invalid catalog');
  const ids = catalog.map(note => note?.id);
  if (ids.some(id => typeof id !== 'string' || !SAFE_ID.test(id)) || new Set(ids).size !== ids.length) throw new TypeError('Invalid catalog IDs');
  return ids;
}

/** Malformed or inaccessible storage is left untouched and honestly becomes visit-only memory. */
export function createFavorites(catalog, storage) {
  const order = catalogIds(catalog);
  const known = new Set(order);
  let saved = [];
  let durable = false;
  try { durable = Boolean(storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function'); }
  catch { /* Storage capability getters can be denied too. */ }
  const normalize = values => { const selected = new Set(values.filter(id => typeof id === 'string' && known.has(id))); return order.filter(id => selected.has(id)); };
  const reconcile = () => {
    if (!durable) return;
    try {
      const raw = storage.getItem(FAVORITES_KEY);
      if (raw === null) { saved = []; return; }
      if (typeof raw !== 'string' || raw.length > MAX_STORAGE_BYTES) throw new TypeError('Invalid favorites storage');
      const value = JSON.parse(raw);
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 2 || value.version !== 1 || !Array.isArray(value.ids) || value.ids.length > MAX_RECORDS) throw new TypeError('Invalid favorites version');
      saved = normalize(value.ids);
    } catch { durable = false; }
  };
  const commit = values => {
    saved = normalize(values);
    if (durable) {
      try { storage.setItem(FAVORITES_KEY, JSON.stringify({ version: 1, ids: saved })); }
      catch { durable = false; }
    }
    return [...saved];
  };
  reconcile();
  return {
    ids() { reconcile(); return [...saved]; },
    toggle(id) {
      if (typeof id !== 'string' || !known.has(id)) throw new RangeError('Unknown artwork ID');
      reconcile();
      return commit(saved.includes(id) ? saved.filter(value => value !== id) : [...saved, id]);
    },
    clear() { return commit([]); },
    persistent() { return durable; },
  };
}

/** Keep catalog order even when search terms or favorite IDs arrive in another order. */
export function filterCatalog(catalog, { series = 'all', query = '', savedOnly = false, savedIds = [] } = {}) {
  if (typeof series !== 'string' || typeof query !== 'string' || query.length > 2000 || !Array.isArray(savedIds)) throw new TypeError('Invalid catalog filter');
  const saved = new Set(savedIds);
  const terms = query.trim().toLocaleLowerCase('en-US').split(/\s+/).filter(Boolean);
  return catalog.filter(note => {
    if (series !== 'all' && note.seriesKey !== series || savedOnly && !saved.has(note.id)) return false;
    const haystack = `${note.id} ${note.title} ${note.seriesLabel} ${note.description}`.toLocaleLowerCase('en-US');
    return terms.every(term => haystack.includes(term));
  });
}

export function parseRoute(hash, catalog) {
  if (hash === '' || hash === '#') return { tab: 'catalog', artId: null };
  if (typeof hash !== 'string' || hash.length > 100) return null;
  const match = /^#(catalog|saved|workshop|studio)(?:\/art\/([a-z0-9][a-z0-9-]{0,63}))?$/.exec(hash);
  if (!match) return null;
  const artId = match[2] || null;
  if (artId && !catalog.some(note => note.id === artId)) return null;
  return { tab: match[1], artId };
}

export function formatRoute({ tab = 'catalog', artId = null } = {}) {
  if (!TABS.has(tab) || artId !== null && (typeof artId !== 'string' || !SAFE_ID.test(artId))) throw new RangeError('Invalid app route');
  return `#${tab}${artId === null ? '' : `/art/${artId}`}`;
}

/** One-column sheets, ratio = artwork width / height. Bounds are planning aids, not press certification. */
export function printPlan({ paper, widthMm, count, ratio } = {}) {
  const sizes = { letter: [215.9, 279.4], a4: [210, 297] };
  if (!Object.hasOwn(sizes, paper)) throw new RangeError('Choose Letter or A4 paper');
  if (typeof widthMm !== 'number' || !Number.isFinite(widthMm) || widthMm < 40 || widthMm > 170) throw new RangeError('Artwork width must be 40–170 mm');
  if (!Number.isInteger(count) || count < 1 || count > 12) throw new RangeError('Print count must be 1–12');
  if (typeof ratio !== 'number' || !Number.isFinite(ratio) || ratio < 0.25 || ratio > 4) throw new RangeError('Artwork width/height ratio must be 0.25–4');
  const [paperWidthMm, paperHeightMm] = sizes[paper];
  const marginMm = 20;
  const captionAllowanceMm = 18;
  const gapMm = 8;
  // Reserve the sheet header, calibration line and footer before placing artwork.
  const sheetChromeMm = 32;
  const usableWidthMm = paperWidthMm - marginMm * 2;
  const usableHeightMm = paperHeightMm - marginMm * 2 - sheetChromeMm;
  const heightMm = widthMm / ratio;
  const itemHeightMm = heightMm + captionAllowanceMm;
  const perPage = Math.floor((usableHeightMm + gapMm) / (itemHeightMm + gapMm));
  if (widthMm > usableWidthMm || perPage < 1) throw new RangeError('Artwork and caption do not fit this paper; reduce the width');
  return { paper, paperWidthMm, paperHeightMm, marginMm, captionAllowanceMm, gapMm, sheetChromeMm, usableWidthMm, usableHeightMm, widthMm, heightMm, itemHeightMm, count, ratio, perPage, pages: Math.ceil(count / perPage) };
}
