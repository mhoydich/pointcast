#!/usr/bin/env node
/**
 * score-live.mjs — refresh .score-live.json for score-projects.mjs.
 * 1) counts pageviews per path from PC_ANALYTICS_KV (`pv:` keys, 90-day TTL) via wrangler
 * 2) merges the public room counters (drum hits, prayers, votives, …)
 * Usage: node scripts/score-live.mjs   (needs wrangler login)
 */
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
const NS = (readFileSync('wrangler.toml', 'utf8').match(/binding = "PC_ANALYTICS_KV"\s*\nid = "([0-9a-f]+)"/) || [])[1];
const live = { pageviews: {}, counters: {} };
if (NS) {
  try {
    const keys = JSON.parse(execSync(`npx wrangler kv key list --namespace-id ${NS} --prefix pv:`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
    for (const k of keys) { const path = k.name.slice(3).replace(/:\d{4}-\d{2}-\d{2}T.*$/, ''); live.pageviews[path] = (live.pageviews[path] || 0) + 1; }
  } catch (e) { console.error('kv list failed', e.message); }
}
const j = async (u) => { try { const r = await fetch(u, { signal: AbortSignal.timeout(8000) }); return r.ok ? r.json() : null; } catch { return null; } };
const drum = await j('https://pointcast.xyz/api/drum'); if (drum?.globalTotal) { live.counters['/drum-house'] = drum.globalTotal; live.counters['/drum-v8'] = drum.globalTotal; }
const prayer = await j('https://pointcast.xyz/api/prayer'); if (prayer?.counts) live.counters['/prayer-altars'] = Object.values(prayer.counts).reduce((a, b) => a + b, 0);
const votive = await j('https://pointcast.xyz/api/votive'); if (votive?.total != null) live.counters['/prayer-candles'] = votive.total;
const bell = await j('https://pointcast.xyz/api/bell-post'); if (bell?.total != null) live.counters['/bell-post'] = bell.total;
const meadow = await j('https://pointcast.xyz/api/meadow'); if (meadow?.total != null) live.counters['/meadow'] = meadow.total;
const letters = await j('https://pointcast.xyz/api/letters'); if (letters?.count != null) live.counters['/letters'] = letters.count;
const bulletin = await j('https://pointcast.xyz/api/bulletin'); if (bulletin?.count != null) live.counters['/bulletin'] = bulletin.count;
// score-projects reads a flat path→number map; pageviews win where present, else counters.
const flat = { ...live.counters };
for (const [p, n] of Object.entries(live.pageviews)) flat[p] = Math.max(flat[p] || 0, n);
writeFileSync('.score-live.json', JSON.stringify(flat, null, 2));
writeFileSync('.score-live.detail.json', JSON.stringify({ generatedAt: new Date().toISOString(), ...live }, null, 2));
console.log(`pageview paths: ${Object.keys(live.pageviews).length}, counters: ${Object.keys(live.counters).length}`);
