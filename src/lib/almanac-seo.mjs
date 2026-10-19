/**
 * SEO copy for Daily Almanac cards. Date labels match cardDateLabel in
 * functions/_lib/almanac-card.mjs (UTC weekday, long month, numeric day).
 * Kept here so sitemap rules and tests do not import the tide/sky modules.
 */
export const ALMANAC_EPOCH = '2026-10-05';
export const ALMANAC_LAST = '2026-12-31';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function pacificDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function isAlmanacCardDate(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso >= ALMANAC_EPOCH && iso <= ALMANAC_LAST;
}

export function isFutureAlmanacCard(pathname, now = new Date()) {
  const match = String(pathname).match(/^\/almanac\/(\d{4}-\d{2}-\d{2})\/?$/);
  if (!match || !isAlmanacCardDate(match[1])) return false;
  return match[1] > pacificDay(now);
}

export function almanacCardPath(now = new Date()) {
  const day = pacificDay(now);
  return isAlmanacCardDate(day) ? `/almanac/${day}` : '/almanac';
}

function cardNumber(iso) {
  const noon = (value) => Date.parse(`${value}T12:00:00Z`);
  return Math.round((noon(iso) - noon(ALMANAC_EPOCH)) / 86400000) + 1;
}

function cardDateLabel(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Title stays under 60 characters once BlockLayout appends " — PointCast". */
export function cardSeo(iso, now = new Date()) {
  const number = cardNumber(iso);
  const [year, month, day] = iso.split('-').map(Number);
  const title = `Almanac No. ${number}, ${MONTHS[month - 1]} ${day}, ${year}`;
  const description = `No. ${number} for ${cardDateLabel(iso)} in El Segundo: NOAA tide, marine layer, price basket, Morning Edition, and weather. Missing lines stay marked.`;
  return {
    number,
    title,
    description,
    label: cardDateLabel(iso),
    upcoming: isAlmanacCardDate(iso) && iso > pacificDay(now),
  };
}
