/**
 * Home share art, October 2026. Each edition path and PNG identifies fixed art.
 * Preserve these records and bytes; publish changed art under a new edition ID.
 * The root home link cycles the bounded set by UTC day. Sharing a fixed
 * /share/home/<edition>/ link keeps its metadata reproducible; third-party
 * preview caches decide when to fetch either link again.
 */
export const HOME_SHARE_CANONICAL = 'https://pointcast.xyz/';
export const HOME_SHARE_TITLE = 'PointCast';
export const HOME_SHARE_DESCRIPTION = 'Small worlds for art, music, games, and making. Explore PointCast.';
export const HOME_SHARE_WIDTH = 1200;
export const HOME_SHARE_HEIGHT = 630;
export const HOME_SHARE_ANCHOR = '2026-10-03';

const DAY_MS = 86_400_000;
const ANCHOR_DAY = Date.parse(`${HOME_SHARE_ANCHOR}T00:00:00Z`) / DAY_MS;
const collection = '2026-10';
const artwork = [
  ['signal-atlas', 'Signal Atlas', 'PointCast Signal Atlas: cobalt and vermilion cartographic islands with radial signal rings on ivory.'],
  ['listening-garden', 'Listening Garden', 'PointCast Listening Garden: coral flowers made from record grooves and green leaves on ivory.'],
  ['paper-constellation', 'Paper Constellation', 'PointCast Paper Constellation: ivory, ultramarine, and yellow paper doorways with floating stars and kites.'],
  ['tide-observatory', 'Tide Observatory', 'PointCast Tide Observatory: teal paper waveforms, a cream moon, and a lime orbital ring.'],
  ['making-room', 'Making Room', 'PointCast Making Room: an orange and lilac folded-paper workshop with arches and tools.'],
  ['night-arcade', 'Night Arcade', 'PointCast Night Arcade: a neon chartreuse planet with a magenta ring, cobalt shapes, and ivory portals on black.'],
];

export const HOME_SHARE_EDITIONS = Object.freeze(artwork.map(([slug, title, alt], index) => {
  const id = `${collection}-${slug}`;
  const number = index + 1;
  const imagePath = `/images/home-share/${collection}/${String(number).padStart(2, '0')}-${slug}.png`;
  const path = `/share/home/${id}/`;
  return Object.freeze({
    id, slug, title, number, alt, imagePath, path,
    // An explicit, fixed version also keeps BlockLayout's image hashing from
    // changing the URL between static fallbacks and request-time metadata.
    imageUrl: new URL(`${imagePath}?v=${id}`, HOME_SHARE_CANONICAL).href,
    url: new URL(path, HOME_SHARE_CANONICAL).href,
  });
}));

/** A UTC day selects the same edition for every user agent and query string. */
export function homeShareEditionForDate(now = new Date()) {
  const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (!Number.isFinite(timestamp)) return HOME_SHARE_EDITIONS[0];
  const day = Math.floor(timestamp / DAY_MS) - ANCHOR_DAY;
  const index = ((day % HOME_SHARE_EDITIONS.length) + HOME_SHARE_EDITIONS.length) % HOME_SHARE_EDITIONS.length;
  return HOME_SHARE_EDITIONS[index];
}

/** Unknown IDs remain unknown; only the six declared edition routes are built. */
export function findHomeShareEdition(id) {
  return HOME_SHARE_EDITIONS.find((edition) => edition.id === id) ?? null;
}
