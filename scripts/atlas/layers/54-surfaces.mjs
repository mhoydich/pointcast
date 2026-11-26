// Layer: surfaces — the machine-facing doors in the agent-surface registry (src/data/agent-surfaces.ts)
// plus one JSON feed per PointCast channel.
import { loadTs } from '../_ts.mjs';

export const layer = {
  id: 'surfaces',
  name: 'Surfaces and feeds',
  description: 'Pages and feeds PointCast lists as its current doors for agents, plus one feed per channel.',
  types: ['page', 'feed'],
  inline: true,
  data: 'https://pointcast.xyz/agents.json',
  page: 'https://pointcast.xyz/for-agents',
  license: 'CC0-1.0',
  updated: '2026-10-25',
  source: { url: 'https://pointcast.xyz/agents.json', checked: '2026-10-25', label: 'fact', title: 'PointCast agents manifest' },
  notes: 'One record per concrete URL in AGENT_SURFACES (human, json, api, feeds). The registry has no as-of field, so the date is the last commit date of src/data/agent-surfaces.ts (2026-10-25). URL templates with {id}, {handle}, {date} or {name} are patterns, not places, and are left out. The Pickleball Home page is recorded by the pickleball layer, not here. Channel feeds come from CHANNEL_LIST in src/lib/channels.ts (file date 2026-10-06) and the /c/[channel].json route.',
};

// Pages another layer already records under the same id (12-pickleball.mjs owns pc:page:pickleball-home).
const OWNED_ELSEWHERE = new Set(['pc:page:pickleball-home']);

const isFeedUrl = (u) => /\.(json|xml|txt|md|jsonl)$/i.test(u.split('?')[0]) || u.includes('/api/');
const words = (key) => key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ').trim();
const title = (key) => { const w = words(key); return w.charAt(0).toUpperCase() + w.slice(1); };

export async function records(ctx) {
  const { site, helpers } = ctx;
  const { rid, slug, src, summary, compact } = helpers;
  const { AGENT_SURFACES } = await loadTs('src/data/agent-surfaces.ts');
  const { CHANNEL_LIST } = await loadTs('src/lib/channels.ts');
  const REG = '2026-10-25';
  // Surfaces added by the Atlas pull request itself: dated to that work and labeled derived until the manifest is live.
  const NEW_IN_ATLAS_PR = new Set(['cartographyMap', 'cartographyAtlasSpec', 'atlasJson', 'atlasIndex', 'atlasSchema']);
  const ATLAS_PR_DATE = '2026-11-08';
  const humans = AGENT_SURFACES.human || {};
  const out = [];
  const used = new Map(); // id -> data/url signature

  for (const [section, map] of Object.entries(AGENT_SURFACES)) {
    for (const [key, url] of Object.entries(map)) {
      if (typeof url !== 'string' || !/^https:\/\//.test(url) || /[{}]/.test(url)) continue;
      const feed = isFeedUrl(url);
      const type = feed ? 'feed' : 'page';
      let id = rid(site.host, type, slug(words(key)));
      if (OWNED_ELSEWHERE.has(id)) continue;
      const sig = url;
      if (used.has(id)) {
        if (used.get(id) === sig) continue;
        id = rid(site.host, type, `${slug(words(key))}-${section}`);
        if (used.has(id)) continue;
      }
      used.set(id, sig);
      const page = feed && typeof humans[key] === 'string' && !isFeedUrl(humans[key]) ? humans[key] : url;
      const path = new URL(url).pathname;
      out.push(compact({
        id,
        type,
        name: title(key),
        summary: summary(feed
          ? `Machine-readable ${section === 'api' ? 'API' : 'feed'} at ${path}, listed in the PointCast agent surface registry.`
          : `Page at ${path}, listed in the PointCast agent surface registry.`),
        site: site.host,
        url: page,
        data: feed ? url : undefined,
        source: [src('https://pointcast.xyz/agents.json', NEW_IN_ATLAS_PR.has(key) ? ATLAS_PR_DATE : REG, NEW_IN_ATLAS_PR.has(key) ? 'derived' : 'fact', 'PointCast agents manifest')],
        updated: NEW_IN_ATLAS_PR.has(key) ? ATLAS_PR_DATE : REG,
        license: 'CC0-1.0',
        tags: ['surface', section],
        layer: 'surfaces',
      }));
    }
  }

  for (const ch of CHANNEL_LIST) {
    out.push(compact({
      id: rid(site.host, 'feed', `channel-${ch.slug}`),
      type: 'feed',
      name: `${ch.name} channel`,
      summary: summary(`JSON feed of blocks in the ${ch.name} channel (code ${ch.code}).`),
      site: site.host,
      url: `https://pointcast.xyz/c/${ch.slug}`,
      data: `https://pointcast.xyz/c/${ch.slug}.json`,
      source: [src(`https://pointcast.xyz/c/${ch.slug}.json`, '2026-10-06', 'derived', `${ch.name} channel feed`)],
      updated: '2026-10-06',
      license: 'CC0-1.0',
      tags: ['channel', ch.code.toLowerCase()],
      layer: 'surfaces',
    }));
  }
  return out;
}
