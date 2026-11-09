// Layer: blocks — the block archive as a single dataset record; the blocks themselves are referenced, not inlined.
import { readdirSync, readFileSync } from 'node:fs';

const DIR = 'src/content/blocks';

export const layer = {
  id: 'blocks',
  name: 'Block archive',
  description: 'The PointCast block archive: numbered posts across ten channels, with a JSON feed and an MCP reader.',
  types: ['dataset'],
  inline: true,
  data: 'https://pointcast.xyz/blocks.json',
  page: 'https://pointcast.xyz/archive',
  license: 'CC0-1.0',
  updated: '2026-11-08',
  source: { url: 'https://pointcast.xyz/blocks.json', checked: '2026-11-08', label: 'derived', title: 'PointCast blocks feed' },
  notes: 'The 500+ blocks are referenced through https://pointcast.xyz/blocks.json and the blocks_search / block_read MCP tools, not inlined, so this layer holds one dataset record. count is the number of files in src/content/blocks at build time; updated is the newest block timestamp.',
  count: readdirSync(new URL('../../../' + DIR, import.meta.url)).filter((f) => f.endsWith('.json')).length,
};

export async function records({ site, helpers, resolve }) {
  const { rid, src, summary, compact } = helpers;
  const files = readdirSync(resolve(DIR)).filter((f) => f.endsWith('.json'));
  let newest = '';
  for (const f of files) {
    const ts = JSON.parse(readFileSync(resolve(`${DIR}/${f}`), 'utf8')).timestamp;
    if (ts && String(ts) > newest) newest = String(ts);
  }
  const updated = newest.slice(0, 10);
  return [compact({
    id: rid(site.host, 'dataset', 'blocks'),
    type: 'dataset',
    name: 'PointCast block archive',
    summary: summary(`${files.length} numbered blocks across ten channels, each with a title, dek, channel, type and timestamp. Read it as JSON or through the blocks_search and block_read MCP tools.`),
    site: site.host,
    url: 'https://pointcast.xyz/archive',
    data: 'https://pointcast.xyz/blocks.json',
    source: [src('https://pointcast.xyz/blocks.json', updated, 'derived', 'PointCast blocks feed')],
    updated,
    license: 'CC0-1.0',
    tags: ['blocks', 'archive'],
    layer: 'blocks',
  })];
}
