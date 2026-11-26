// Data rules for PointCast pickleball rankings. Shared by the sync script, the tier engine and tests.
import { createHash } from 'node:crypto';

// Link out only. Never copy names, numbers or results from these hosts.
export const LINK_ONLY_HOSTS = [
  'pickleball.com', 'pickleballtournaments.com', 'pickleballbrackets.com', 'ppatour.com',
  'usapickleball.org', 'dupr.com', 'mydupr.com', 'pickleballden.com', 'utrsports.net', 'pickleheads.com',
];
export const JUNIOR_WORDS = ['junior', 'youth', 'under 18', 'u18', 'u16', 'u14', 'u12', 'boys', 'girls', 'kids', 'high school'];
// The only fields a result row may carry. Anything else (addresses, contacts, photos, socials,
// birth years, ages beyond the published bracket, guesses) has no column to live in.
export const ROW_FIELDS = ['event_id', 'division', 'category', 'skill_level', 'age_bracket', 'place', 'draw_size', 'team', 'source_url'];

export function isLinkOnly(url) {
  try {
    const h = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    return LINK_ONLY_HOSTS.some((b) => h === b || h.endsWith('.' + b));
  } catch { return true; }
}

// Same normalization as elsegundo.xyz, so one do-not-list hash works on both sites.
export function normalizeName(name) {
  return String(name).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/["“”'‘’`]/g, '').replace(/[^a-z]+/g, ' ').trim().replace(/\s+/g, ' ');
}
export const nameHash = (name) => createHash('sha256').update(normalizeName(name)).digest('hex');

// Returns why a row is refused, or null when it may be used.
export function checkRow(row) {
  const extra = Object.keys(row).filter((k) => !ROW_FIELDS.includes(k));
  if (extra.length) return `fields not allowed: ${extra.join(', ')}`;
  if (!/^https:\/\//.test(row.source_url || '')) return 'no https source';
  if (isLinkOnly(row.source_url)) return 'source is a link-only host';
  const d = String(row.division || '').toLowerCase();
  if (JUNIOR_WORDS.some((w) => d.includes(w))) return 'junior division';
  if (![1, 2, 3, 4].includes(row.place)) return 'place must be 1 to 4';
  return null;
}
