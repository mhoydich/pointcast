#!/usr/bin/env node
/**
 * score-live.mjs — refresh .score-live.json for score-projects.mjs.
 * 1) counts weighted pageviews from PC_ANALYTICS_KV's ten-second batches (90-day TTL) via the CF REST API
 *    (uses wrangler's OAuth token, or CLOUDFLARE_API_TOKEN). Paths starting with /_ are ignored (smoke tests).
 * 2) merges the public room counters (drum hits, prayers, votives, …)
 * Usage: node scripts/score-live.mjs   (needs a wrangler login on this machine)
 */
import { writeFileSync, readFileSync } from 'node:fs';
const NS = (readFileSync('wrangler.toml', 'utf8').match(/binding = "PC_ANALYTICS_KV"\s*\nid = "([0-9a-f]+)"/) || [])[1];
const ACCOUNT = '699061394cac705067bad6a7a4bd2db5';
// `wrangler kv key list` silently returns [] for this namespace (verified 2026-08-17),
// so read keys through the REST API with wrangler's own OAuth token.
const tokenFile = [`${process.env.HOME}/.wrangler/config/default.toml`, `${process.env.HOME}/Library/Preferences/.wrangler/config/default.toml`].find((f) => { try { readFileSync(f); return true; } catch { return false; } });
const TOKEN = process.env.CLOUDFLARE_API_TOKEN || (tokenFile && (readFileSync(tokenFile, 'utf8').match(/oauth_token = "([^"]+)"/) || [])[1]);
const live = { pageviews: {}, counters: {}, frontDoor: { shown: 0, completed: 0, nextDoorTaken: 0, eligibleForSevenDayReturn: 0, returnedAfterSevenDays: 0 } };
const frontDoorVisits = new Map();
if (NS && TOKEN) {
  let cursor = '';
  let pages = 0;
  do {
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${NS}/keys?limit=1000&prefix=analytics-batch:${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    const data = await res.json();
    if (!data.success) { console.error('kv list failed', JSON.stringify(data.errors)); break; }
    for (const k of data.result) {
      const valueUrl = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/storage/kv/namespaces/${NS}/values/${encodeURIComponent(k.name)}`;
      const valueRes = await fetch(valueUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
      if (!valueRes.ok) continue;
      let records; try { records = await valueRes.json(); } catch { continue; }
      if (!Array.isArray(records)) continue;
      for (const record of records) {
        if (typeof record?.event === 'string' && record.event.startsWith('front_door.')) {
          if (record.event === 'front_door.primary_shown') {
            live.frontDoor.shown += 1;
            const visitor = typeof record?.meta?.visitor === 'string' ? record.meta.visitor.slice(0, 80) : '';
            const at = Date.parse(record?.ts || '');
            if (visitor && Number.isFinite(at)) {
              const visits = frontDoorVisits.get(visitor) || [];
              visits.push(at);
              frontDoorVisits.set(visitor, visits);
            }
          } else if (record.event === 'front_door.primary_completed') live.frontDoor.completed += 1;
          else if (record.event === 'front_door.next_door_taken') live.frontDoor.nextDoorTaken += 1;
          continue;
        }
        if (record?.event === 'dock') {
          live.counters['/dock'] = (live.counters['/dock'] || 0) + 1;
          continue;
        }
        const path = typeof record?.meta?.path === 'string' ? record.meta.path : '';
        if ((record?.event !== 'pageview' && record?.event !== 'page_view') || !path || path.startsWith('/_')) continue;
        const weight = Number.isFinite(record.sampled) && record.sampled > 0 ? record.sampled : 1;
        live.pageviews[path] = (live.pageviews[path] || 0) + weight;
      }
    }
    cursor = data.result_info?.cursor || '';
    pages += 1;
  } while (cursor && pages < 200);
} else {
  console.error('no namespace id or token; skipping pageviews');
}
for (const visits of frontDoorVisits.values()) {
  const ordered = visits.sort((a, b) => a - b);
  const first = ordered[0];
  const later = ordered.some((visit) => visit - first >= 7 * 24 * 60 * 60 * 1000);
  if (Date.now() - first >= 7 * 24 * 60 * 60 * 1000) live.frontDoor.eligibleForSevenDayReturn += 1;
  if (later) live.frontDoor.returnedAfterSevenDays += 1;
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
