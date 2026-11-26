#!/usr/bin/env node
// Turn the El Segundo 25-mile ladder's open feed (elsegundo.xyz/pickleball/players/players.json)
// into a PointCast regional feed: src/data/pickleball-rankings/feeds/el-segundo-25.json.
//
//   node scripts/pickleball-rankings/sync-el-segundo.mjs <players.json path or https URL>
//
// It keeps only the fields the rankings may show (name as listed, division, level, age bracket
// as published, place, draw size, partners, dates, source) and refuses anything else:
// a source on a link-only host, a junior division, or a name on the do-not-list.
// One team finish appears once per teammate in players.json; here it becomes one row.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkRow, nameHash, LINK_ONLY_HOSTS } from '../../src/lib/pickleball-rankings/rules.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'src/data/pickleball-rankings/feeds/el-segundo-25.json');
const DNL = join(ROOT, 'src/data/pickleball-rankings/do-not-list.json');
const FEED_URL = 'https://elsegundo.xyz/pickleball/players/players.json';

const arg = process.argv[2];
if (!arg) { console.error('usage: sync-el-segundo.mjs <players.json path or https URL>'); process.exit(1); }
const src = /^https:\/\//.test(arg) ? await (await fetch(arg)).json() : JSON.parse(readFileSync(arg, 'utf8'));
const doNot = new Set(JSON.parse(readFileSync(DNL, 'utf8')).entries.map((e) => e.sha256));

const names = new Map(src.players.map((p) => [p.slug, p.name]));
const blocked = new Set([...names].filter(([, n]) => doNot.has(nameHash(n))).map(([s]) => s));
const players = {};
const rows = new Map();
const refused = [];
for (const p of src.players) {
  if (blocked.has(p.slug)) continue;
  for (const r of p.results) {
    const team = [p.slug, ...r.partners].map((s) => (s && !blocked.has(s) && names.has(s) ? s : null));
    const row = {
      event_id: r.event_id, division: r.division, category: r.category, skill_level: r.skill_level,
      age_bracket: r.age_bracket || '', place: Number(r.place), draw_size: r.draw_size ?? null,
      team, source_url: r.source_url,
    };
    const why = checkRow(row);
    if (why) { refused.push(`${r.event_id} ${r.division}: ${why}`); continue; }
    const key = [row.event_id, row.division, row.place, [...team].map(String).sort().join('+')].join('|');
    if (!rows.has(key)) rows.set(key, row);
    for (const s of team) if (s) players[s] = { name: names.get(s) };
  }
}
const usedEvents = new Set([...rows.values()].map((r) => r.event_id));
const feed = {
  about: 'PointCast regional feed built from the El Segundo 25-mile ladder\'s open data. Public, organizer-published results only. Regenerate with scripts/pickleball-rankings/sync-el-segundo.mjs; do not hand-edit.',
  feed_id: 'el-segundo-25',
  name: 'El Segundo 25-mile ladder',
  scale: 'regional',
  country: 'US',
  region: { center: 'El Segundo Recreation Park, El Segundo, CA', home_radius_miles: src.radius_miles, event_radius_miles: src.event_radius_miles },
  upstream: { feed: FEED_URL, method: 'https://elsegundo.xyz/pickleball/players/method/', directory: 'https://elsegundo.xyz/pickleball/players/' },
  as_of: src.as_of,
  link_only_hosts: LINK_ONLY_HOSTS,
  events: src.events.filter((e) => usedEvents.has(e.id)).map((e) => ({
    id: e.id, name: e.name, organizer: e.organizer, start_date: e.start_date, end_date: e.end_date,
    city: e.city, country: 'US', sources: e.sources,
  })),
  players: Object.fromEntries(Object.entries(players).sort(([a], [b]) => a.localeCompare(b))),
  results: [...rows.values()],
};
writeFileSync(OUT, JSON.stringify(feed, null, 1) + '\n');
console.log(`wrote ${OUT}: ${feed.events.length} events, ${Object.keys(feed.players).length} players, ${feed.results.length} team finishes, ${refused.length} refused, ${blocked.size} on do-not-list`);
if (refused.length) console.log(refused.slice(0, 20).join('\n'));
