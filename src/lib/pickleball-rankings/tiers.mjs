// PointCast pickleball rankings: one recipe, four scales.
//   regional  one named ladder (El Segundo 25-mile is the first)
//   national  every regional or national feed whose events are in that country, deduped
//   global    every feed, deduped
//   level     a filter over any tier by Level (nearest half step, 2.0 to 8.0)
// Court Rating comes from rating.js, copied verbatim from the El Segundo ladder.
import { fromResults, blend, tagFor, levelName, LEVEL_VALUES } from './rating.js';
import { checkRow, nameHash } from './rules.mjs';

// Division level, as elsegundo.xyz reads it: Open, pro and elite divisions read as 5.5,
// a division with no level as 3.5.
export const LEVEL_FOR_OPEN_OR_PRO = 5.5;
export const LEVEL_WHEN_UNKNOWN = 3.5;
export const HALF_LIFE_DAYS = 365;
export const MAX_AGE_DAYS = 730;

export function divisionLevel(skill) {
  const s = String(skill || '').toLowerCase();
  if (/open|pro|elite/.test(s)) return LEVEL_FOR_OPEN_OR_PRO;
  const m = s.match(/(\d(?:\.\d+)?)/);
  return m ? Number(m[1]) : LEVEL_WHEN_UNKNOWN;
}
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export function recency(endDate, asOf) {
  const age = Math.max(0, days(endDate, asOf));
  return age > MAX_AGE_DAYS ? 0 : 0.5 ** (age / HALF_LIFE_DAYS);
}

const rowKey = (r) => [r.event_id, r.division, r.place, [...r.team].map(String).sort().join('+')].join('|');

// Merge feeds into one pool of team finishes. Player ids are `feed/slug` until identities.json
// merges them; a slug shared by two feeds without a merge record stays two entries.
export function pool(feeds, { identities = { merges: [], claims: {} }, doNotList = { entries: [] }, country = null } = {}) {
  const blocked = new Set(doNotList.entries.map((e) => e.sha256));
  const merge = new Map();
  for (const m of identities.merges || []) for (const id of m.ids) merge.set(id, m.into);
  const people = new Map();
  const events = new Map();
  const rows = new Map();
  const feedsUsed = [];
  for (const f of feeds) {
    if (country && f.country !== country) continue;
    feedsUsed.push({ feed_id: f.feed_id, name: f.name, scale: f.scale, country: f.country, as_of: f.as_of, upstream: f.upstream });
    const ev = new Map(f.events.filter((e) => !country || e.country === country).map((e) => [e.id, e]));
    for (const e of ev.values()) events.set(e.id, { ...e, feed_id: f.feed_id });
    const pid = (slug) => (slug ? merge.get(`${f.feed_id}/${slug}`) || `${f.feed_id}/${slug}` : null);
    for (const r of f.results) {
      if (!ev.has(r.event_id) || checkRow(r)) continue;
      const team = r.team.map((s) => (s && f.players[s] && !blocked.has(nameHash(f.players[s].name)) ? pid(s) : null));
      for (const [i, s] of r.team.entries()) if (team[i]) people.set(team[i], people.get(team[i]) || { id: team[i], name: f.players[s].name, feed_ids: new Set() });
      for (const t of team) if (t) people.get(t).feed_ids.add(f.feed_id);
      const row = { ...r, team };
      const k = rowKey(row);
      if (!rows.has(k)) rows.set(k, row);
    }
  }
  return { people, events, rows: [...rows.values()], feeds: feedsUsed, claims: identities.claims || {} };
}

// Rank everyone in a pool. Order: Court Rating (high first), then the narrower band, then name.
export function rank(p, asOf) {
  const byPlayer = new Map();
  for (const r of p.rows) {
    const e = p.events.get(r.event_id);
    const rec = recency(e.end_date || e.start_date, asOf);
    for (const id of r.team) if (id) {
      if (!byPlayer.has(id)) byPlayer.set(id, []);
      byPlayer.get(id).push({ row: r, event: e, recency: rec, partners: r.team.filter((x) => x !== id) });
    }
  }
  const list = [];
  for (const [id, res] of byPlayer) {
    const counted = res.filter((x) => x.recency > 0);
    const est = fromResults(counted.map((x) => ({ level: divisionLevel(x.row.skill_level), place: x.row.place, teams: Number(x.row.draw_size), recency: x.recency })));
    const declared = Number(p.claims[id]?.self_rating);
    const r = blend({ est: est.est, weight: est.weight, declared: Number.isFinite(declared) ? declared : null });
    if (!r) continue;
    const person = p.people.get(id);
    list.push({
      id, slug: slugOf(id), name: person.name, feed_ids: [...person.feed_ids],
      court_rating: r.value, band: r.plusMinus, level: r.level, weight: est.weight,
      tag: tagFor({ results: counted.length, declared: Number.isFinite(declared) }),
      gap: r.gap, results: res.sort((a, b) => String(b.event.end_date).localeCompare(String(a.event.end_date))),
    });
  }
  list.sort((a, b) => b.court_rating - a.court_rating || a.band - b.band || a.name.localeCompare(b.name));
  let prev = null;
  list.forEach((x, i) => { x.rank = prev && prev.court_rating === x.court_rating && prev.band === x.band ? prev.rank : i + 1; prev = x; });
  return list;
}

export const slugOf = (id) => id.replace('/', '--');
export const LEVEL_BANDS = LEVEL_VALUES.map((v) => v.toFixed(1));
export const byLevel = (list, band) => list.filter((x) => x.level === band);
export { levelName };

// Every tier the preview publishes, from the feeds on hand.
export function buildTiers(feeds, opts = {}) {
  const asOf = opts.asOf || feeds.map((f) => f.as_of).sort().at(-1);
  const tier = (key, label, scope, pooled) => ({ key, label, scope, as_of: asOf, feeds: pooled.feeds, events: [...pooled.events.values()], players: rank(pooled, asOf) });
  const regional = feeds.filter((f) => f.scale === 'regional').map((f) => tier(`regional/${f.feed_id}`, f.name, f.region?.center || f.name, pool([f], opts)));
  const national = tier('national/us', 'National (United States)', 'United States', pool(feeds, { ...opts, country: 'US' }));
  const global = tier('global', 'Global', 'All countries', pool(feeds, opts));
  return { as_of: asOf, regional, national, global };
}

// Coverage, said plainly. A tier with one regional feed is a preview of the rollup, not a ranking of that scale.
export function coverage(t) {
  const countries = new Set(t.events.map((e) => e.country));
  const cities = new Set(t.events.map((e) => e.city));
  return { feeds: t.feeds.length, events: t.events.length, players: t.players.length, countries: [...countries], cities: [...cities] };
}
