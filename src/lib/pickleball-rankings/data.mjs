// Build-time data for /pickleball/rankings/. Every page and endpoint reads from here,
// so the HTML, JSON and CSV can never disagree.
import { buildTiers, coverage, byLevel, LEVEL_BANDS, slugOf } from './tiers.mjs';
import { LINK_ONLY_HOSTS } from './rules.mjs';
import identities from '../../data/pickleball-rankings/identities.json';
import doNotList from '../../data/pickleball-rankings/do-not-list.json';
import sources from '../../data/pickleball-rankings/sources.json';

const feedModules = import.meta.glob('../../data/pickleball-rankings/feeds/*.json', { eager: true });
export const FEEDS = Object.values(feedModules).map((m) => m.default || m);
export const TIERS = buildTiers(FEEDS, { identities, doNotList });
export const SOURCES = sources;
export { LINK_ONLY_HOSTS, LEVEL_BANDS, byLevel, coverage, slugOf };

export const BASE = '/pickleball/rankings/';
export const MAIL = 'mh@pointcast.xyz';
export const PREVIEW = true;

// One page per person, keyed by slug, from the widest tier they appear on.
export const PEOPLE = new Map(TIERS.global.players.map((p) => [p.slug, p]));
export const nameOf = (id) => {
  const p = PEOPLE.get(slugOf(id));
  return p ? p.name : null;
};

// Status, said plainly, for each scale. A table can exist while the scale itself is unavailable.
export function tierStatus(key) {
  const c = (t) => coverage(t);
  if (key === 'national') {
    const cv = c(TIERS.national);
    const nationalFeeds = TIERS.national.feeds.filter((f) => f.scale === 'national').length;
    return nationalFeeds ? { available: true, coverage: cv } : {
      available: false, coverage: cv,
      reason: `No reusable national source yet. Current US national and pro results sit on link-only platforms (see the source survey). What is below is the regional rollup so far: ${cv.feeds} regional feed, ${cv.events} events in ${cv.cities.join(', ')}. It is not a US ranking.`,
    };
  }
  if (key === 'global') {
    const cv = c(TIERS.global);
    return cv.countries.length > 1 ? { available: true, coverage: cv } : {
      available: false, coverage: cv,
      reason: `Only one country has any feed (${cv.countries.join(', ') || 'none'}). Global opens when a second national ladder exists.`,
    };
  }
  return { available: true };
}

export const fmtDate = (iso) => (iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: 'short', day: 'numeric' }) : 'unavailable');
export const fix2 = (n) => (Number.isFinite(n) ? n.toFixed(2) : 'unavailable');
export const PLACE = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };

export function mailto(kind, name) {
  const subject = `PointCast pickleball rankings: ${kind} ${name || '[your name]'}`;
  return `mailto:${MAIL}?subject=${encodeURIComponent(subject)}`;
}

// Rows for JSON and CSV. Missing values stay null with status "unavailable", never 0.
export function tierRows(t) {
  return t.players.map((p) => ({
    rank: p.rank, slug: p.slug, name: p.name, court_rating: p.court_rating, band: p.band, level: p.level,
    tag: p.tag, results_counted: p.results.filter((r) => r.recency > 0).length, weight: p.weight,
    feeds: p.feed_ids, url: `https://pointcast.xyz${BASE}player/${p.slug}/`,
  }));
}

export function csv(rows, cols) {
  const cell = (v) => {
    if (v === null || v === undefined || v === '') return 'unavailable';
    const s = Array.isArray(v) ? v.join(' ') : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n') + '\n';
}
