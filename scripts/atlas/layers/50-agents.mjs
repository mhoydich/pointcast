// Layer: agents — PointCast's residents, the Desk's house agents and the Grok field roster.
// Reads src/data/residents.ts, src/data/agent-identities.json (labels, vendors and dates only),
// src/lib/air.ts (AIR_DESK) and src/data/grok-roster.json. Never publishes keys, hosts or machine names.
import { loadTs } from '../_ts.mjs';

export const layer = {
  id: 'agents',
  name: 'Agents',
  description: 'The agents that work on PointCast: residents, the Desk\'s house agents, and the fictional Nouns characters of the Grok field.',
  types: ['agent'],
  inline: true,
  data: 'https://pointcast.xyz/agents.json',
  page: 'https://pointcast.xyz/residents',
  license: 'CC0-1.0',
  updated: '2026-10-06',
  source: { url: 'https://pointcast.xyz/agents.json', checked: '2026-05-02', label: 'fact', title: 'PointCast agents manifest' },
  notes: 'Residents come from src/data/residents.ts (listed in /agents.json); their checked date is the mint date in src/data/agent-identities.json (per instance where one exists, else the file date). Open slots are planned records. House agents come from AIR_DESK in src/lib/air.ts and the Grok roster from src/data/grok-roster.json; neither has an as-of field, so their date is the last commit date of the source file (2026-10-06) and their source is the page that shows them. Public keys, hosts and machine names in agent-identities.json are deliberately not read. The Desk callers (Sol, Terra, Luna, Frog) are not separate records.',
};

const vendorSlug = (v, slug) => slug(String(v || 'human'));
const IDENTITY_KEY = { cc: 'cc', codex: 'codex', manus: 'manus', mh: 'mike' };
const FILE_DATE = '2026-10-06';

export async function records(ctx) {
  const { site, helpers, readJson, resolve } = ctx;
  const { rid, slug, src, summary, compact } = helpers;
  const out = [];

  const { RESIDENTS } = await loadTs('src/data/residents.ts');
  const { AIR_DESK } = await loadTs('src/lib/air.ts');
  const ids = readJson(resolve('src/data/agent-identities.json'));
  const baseDate = String(ids.minted_at).slice(0, 10);
  const residentIds = new Map(RESIDENTS.map((r) => [r.slug, rid(site.host, 'agent', r.slug)]));

  for (const r of RESIDENTS) {
    const inst = ids.instances?.[IDENTITY_KEY[r.slug]];
    const checked = String(inst?.minted_at || ids.minted_at).slice(0, 10);
    const vendor = r.builtBy || inst?.vendor || null;
    const text = r.status === 'director'
      ? `Director of PointCast; role as published: ${r.role}.`
      : r.status === 'open'
        ? `Open resident slot${vendor ? ` for ${vendor}` : ''}: ${r.role}. No agent is seated yet.`
        : `${vendor ? `Resident agent built by ${vendor}. ` : 'Resident agent. '}Role on PointCast: ${r.role}.`;
    out.push(compact({
      id: rid(site.host, 'agent', r.slug),
      type: 'agent',
      name: r.name,
      summary: summary(text),
      site: site.host,
      url: 'https://pointcast.xyz/residents',
      data: 'https://pointcast.xyz/agents.json',
      source: [src('https://pointcast.xyz/agents.json', checked, 'fact', 'PointCast agents manifest')],
      updated: checked,
      license: 'CC0-1.0',
      tags: ['agent', vendorSlug(vendor, slug), r.status === 'open' ? 'open' : r.status],
      status: r.status === 'open' ? 'planned' : r.status === 'dormant' ? 'historical' : 'live',
      layer: 'agents',
    }));
  }

  for (const f of AIR_DESK.feeds) {
    const keeperId = residentIds.get(f.keeper);
    const keeper = AIR_DESK.agents.find((a) => a.call === f.keeper);
    out.push(compact({
      id: rid(site.host, 'agent', `desk-${f.id}`),
      type: 'agent',
      name: f.name,
      summary: summary(`House agent at the Desk that keeps the ${f.name} feed (${f.kind}), reading ${f.says}. Kept by ${keeper?.name || f.keeper}. It asks on-site people to check what it read.`),
      site: site.host,
      url: 'https://pointcast.xyz/r/desk',
      data: 'https://pointcast.xyz/agents.json',
      source: [src('https://pointcast.xyz/r/desk', FILE_DATE, 'derived', 'The Desk')],
      updated: FILE_DATE,
      license: 'CC0-1.0',
      tags: ['agent', 'house-agent', 'desk', f.kind],
      links: keeperId ? [{ rel: 'made-by', id: keeperId, note: 'keeper' }] : [],
      layer: 'agents',
    }));
  }

  const roster = readJson(resolve('src/data/grok-roster.json'));
  const cast = [
    ...[['partner', roster.partner], ['line-judge', roster.lineJudge]],
    ...roster.crowd.map((c) => ['crowd', c]),
    ...roster.favorite.map((c) => [`favorite-${c.seed}`, c]),
  ];
  const kindText = { partner: 'the doubles partner', 'line-judge': 'the line judge', crowd: 'a member of the crowd' };
  const seen = new Set();
  for (const [kind, c] of cast) {
    const id = rid(site.host, 'agent', `grok-${slug(c.name)}`);
    if (seen.has(id)) continue;
    seen.add(id);
    const role = kindText[kind] || `seed ${kind.replace('favorite-', '')} of the Grok favorites`;
    out.push(compact({
      id,
      type: 'agent',
      name: c.name,
      summary: summary(`Fictional CC0 Nouns character in the Grok pickleball field, ${role}. Not a real person or a numbered on-chain Noun.`),
      site: site.host,
      url: 'https://pointcast.xyz/grok',
      data: 'https://pointcast.xyz/grok.json',
      source: [src('https://pointcast.xyz/grok.json', FILE_DATE, 'derived', 'Grok field roster')],
      updated: FILE_DATE,
      license: 'CC0-1.0',
      tags: ['agent', 'fictional', 'grok', 'nouns'],
      layer: 'agents',
    }));
  }
  return out;
}
