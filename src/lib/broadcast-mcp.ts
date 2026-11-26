/**
 * broadcast-mcp — the front door and the outward broadcast for PointCast's
 * MCP (2026-11-03, per Mike: "id like it to broadcast more").
 *
 *   start_here         read   what PointCast is, the tools grouped by what you want to do, the rules
 *   on_air             read   one broadcast frame: latest blocks, the Morning Edition, the station,
 *                             card and chart of the day; pass `since` to get only what is new
 *   broadcast_feeds    read   every feed and machine surface to subscribe to (RSS, JSON Feed, JSON)
 *   syndication_card   read   a quotable card for one block: citation, short and long post text,
 *                             image, and cross-post suggestions (drafts only, never posts)
 *
 * Kept out of mcp.ts like radio-mcp: spread BROADCAST_TOOL_DEFINITIONS into
 * TOOLS and route the four names to dispatchBroadcastTool. /broadcast.json is
 * the same frame for clients without MCP (src/pages/broadcast.json.ts).
 *
 * The Radio Network is still a plan: on_air never says a radio station is
 * broadcasting. "On air" here means what PointCast is publishing right now.
 */

export const BROADCAST_SCHEMA = 'pointcast.broadcast/v1';
export const SITE = 'https://pointcast.xyz';
export const POLL_SECONDS = 300;
const RADIO_NOTE = 'The PointCast Radio Network is a plan: nothing is on air over radio, no frequency is held. "On air" here means what PointCast is publishing.';

export const FEEDS = [
  { id: 'rss', name: 'Blocks (RSS 2.0)', url: `${SITE}/feed.xml`, format: 'rss', what: 'Every block, newest first.' },
  { id: 'rss-legacy', name: 'Blocks (legacy RSS)', url: `${SITE}/rss.xml`, format: 'rss', what: 'Older RSS route, kept for existing readers.' },
  { id: 'json-feed', name: 'Blocks (JSON Feed 1.1)', url: `${SITE}/feed.json`, format: 'jsonfeed', what: 'Every block with channel, type and image.' },
  { id: 'explore', name: 'Explore (RSS)', url: `${SITE}/explore.rss`, format: 'rss', what: 'The explore shelf as a feed.' },
  { id: 'morning-rss', name: 'Morning Edition (RSS)', url: `${SITE}/morning.xml`, format: 'rss', what: 'One edition a day at 6:45 AM Pacific.' },
  { id: 'morning-json', name: 'Morning Edition (JSON)', url: `${SITE}/morning.json`, format: 'json', what: 'The current edition: masthead, seven slots, bylines.' },
  { id: 'broadcast', name: 'Broadcast frame (JSON)', url: `${SITE}/broadcast.json`, format: 'json', what: 'The on_air frame for clients without MCP. Poll every 5 minutes.' },
  { id: 'now', name: 'Now (JSON)', url: `${SITE}/now.json`, format: 'json', what: 'Featured work, card and chart of the day, latest blocks.' },
  { id: 'today', name: 'Today (JSON)', url: `${SITE}/today.json`, format: 'json', what: 'The curated day strip.' },
  { id: 'blocks', name: 'Blocks (native JSON)', url: `${SITE}/blocks.json`, format: 'json', what: 'Every block in PointCast\'s own shape.' },
  { id: 'llms', name: 'llms.txt', url: `${SITE}/llms.txt`, format: 'text', what: 'The site in plain text for models; llms-full.txt has everything.' },
  { id: 'agents', name: 'agents.json', url: `${SITE}/agents.json`, format: 'json', what: 'Every machine surface, including this MCP\'s tool list.' },
] as const;

/** The front door's map. Every name here must be a real tool (tests check). */
export const START_HERE_GROUPS = [
  { id: 'broadcast', title: 'See what is on air and pass it on', tools: ['on_air', 'syndication_card', 'broadcast_feeds', 'morning_edition', 'blocks_recent'] },
  { id: 'read', title: 'Read and search', tools: ['blocks_search', 'block_read', 'blocks_by_channel', 'channels_list', 'today_highlights', 'now_snapshot'] },
  { id: 'town', title: 'El Segundo right now', tools: ['air_latest', 'weather_get', 'local_snapshot', 'price_wire', 'front_desk_today', 'desk_calls'] },
  { id: 'contribute', title: 'Contribute (ask your person first; writes are public)', tools: ['contribute_paths', 'guides_intake_tasks', 'civil_service_posts', 'yard_board', 'loom_append', 'price_report'] },
  { id: 'desk', title: 'The moneyless trading desk on elsegundo.xyz', tools: ['trading_desk_read', 'wants_board', 'haggle_shelf'] },
  { id: 'play', title: 'Play', tools: ['nouns_battler_arena', 'drum_list_rooms', 'sunset_downs_card', 'catan_daily', 'keyboard_signal_state'] },
  { id: 'connect', title: 'Connect and find everything else', tools: ['connector_links', 'apps_list', 'surfaces_list', 'town_map', 'agents_manifest'] },
] as const;

export const START_HERE_RULES = [
  'Read tools are safe to call freely.',
  'Ask your person before any tool that posts, taps, claims, plays or checks in. Those writes are public and some reach live visitors.',
  'Never send personal data: handles only.',
  'Cite blocks as: PointCast · CH.{CODE} · № {ID} — “{TITLE}” · {YYYY-MM-DD} · https://pointcast.xyz/b/{ID}.',
  'Do not write in Mike\'s voice; quote a block\'s own title and dek instead.',
  'No money moves through PointCast tools. Desk prices are intent and pledges are promises.',
  RADIO_NOTE,
];

const NO_INPUT = { type: 'object', properties: {}, additionalProperties: false } as const;

export const BROADCAST_TOOL_DEFINITIONS = [
  {
    name: 'start_here',
    description:
      'Start here. What PointCast is in two lines, the ~120 tools grouped by what you want to do (see what is on air, read, El Segundo right now, contribute, the trading desk, play, connect), the rules for write tools, and where to subscribe. Call this first when you are new to PointCast or unsure which tool fits. Read-only.',
    inputSchema: NO_INPUT,
  },
  {
    name: 'on_air',
    description:
      'What PointCast is publishing right now, as one broadcast frame: the newest blocks with citations, the current Morning Edition headlines, what the one-listener station is playing, and the card and chart of the day. Returns a cursor; pass it back as since to get only items newer than your last poll (poll every 5 minutes at most). The Radio Network is a plan, so nothing here claims to be on the radio. Read-only; /broadcast.json is the same frame.',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'The cursor from your last on_air call (an ISO time). Only newer blocks are returned.' },
        limit: { type: 'integer', minimum: 1, maximum: 25, description: 'Blocks to include. Default 8.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'broadcast_feeds',
    description:
      'Every feed and machine surface to subscribe to: RSS for blocks and the Morning Edition, JSON Feed 1.1, the /broadcast.json frame, now, today, blocks, llms.txt and agents.json, each with its format and what it carries. Read-only.',
    inputSchema: NO_INPUT,
  },
  {
    name: 'syndication_card',
    description:
      'A quotable card for one block (or the newest if id is omitted): the citation line, a short post under 280 characters and a longer one, both built only from the block\'s own title and dek, plus its image, tags and cross-post suggestions such as elsegundo.xyz for El Segundo blocks. A draft for your person to post; this tool never posts anywhere. Read-only.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^\\d{4}$', description: 'Four-digit block id, e.g. 0775. Omit for the newest block.' },
      },
      additionalProperties: false,
    },
  },
];

export const BROADCAST_TOOL_NAMES = BROADCAST_TOOL_DEFINITIONS.map((t) => t.name);

interface ToolResult { content: Array<{ type: string; text?: string }>; isError?: boolean }
type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;
const text = (t: string) => ({ type: 'text', text: t });

export interface FeedItem {
  id?: string;
  url?: string;
  title?: string;
  summary?: string;
  content_text?: string;
  date_published?: string;
  tags?: string[];
  image?: string;
  _pointcast?: { id: string | null; channel?: { code?: string; name?: string }; type?: string };
}

export interface BroadcastItem {
  id: string;
  title: string;
  dek: string;
  url: string;
  channel: string;
  channelName: string;
  type: string;
  publishedAt: string;
  image: string | null;
  citation: string;
}

export function citationFor(item: Pick<BroadcastItem, 'id' | 'title' | 'channel' | 'publishedAt' | 'url'>): string {
  return `PointCast · CH.${item.channel} · № ${item.id} — “${item.title}” · ${item.publishedAt.slice(0, 10)} · ${item.url}`;
}

/** Feed items → broadcast items. Standards entries (no block id) are skipped. */
export function toBroadcastItems(items: FeedItem[]): BroadcastItem[] {
  const out: BroadcastItem[] = [];
  for (const it of items || []) {
    const id = it?._pointcast?.id;
    if (!id || !it.title || !it.date_published) continue;
    const url = it.url || `${SITE}/b/${id}`;
    const base = {
      id: String(id),
      title: String(it.title),
      dek: String(it.summary ?? it.content_text ?? '').slice(0, 320),
      url,
      channel: it._pointcast?.channel?.code || 'FD',
      channelName: it._pointcast?.channel?.name || '',
      type: it._pointcast?.type || '',
      publishedAt: new Date(it.date_published).toISOString(),
      image: it.image || null,
    };
    out.push({ ...base, citation: citationFor(base) });
  }
  return out.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function itemsSince(items: BroadcastItem[], since: unknown): BroadcastItem[] {
  if (typeof since !== 'string' || !since) return items;
  const t = Date.parse(since);
  if (!Number.isFinite(t)) return items;
  return items.filter((i) => Date.parse(i.publishedAt) > t);
}

/** Cross-post suggestions. Suggestions only; nothing is sent. */
export function crossPostsFor(item: BroadcastItem) {
  const out: Array<{ where: string; url: string; why: string }> = [];
  if (item.channel === 'ESC') out.push({ where: 'elsegundo.xyz', url: 'https://elsegundo.xyz/', why: 'An El Segundo block; the town site is its local home.' });
  out.push({ where: 'Loom', url: `${SITE}/loom`, why: 'Quote it on a Loom address with loom_append, after your person says yes.' });
  return out;
}

export function shortPost(item: BroadcastItem): string {
  const tail = ` ${item.url}`;
  const room = 280 - tail.length;
  const lead = item.dek && item.dek !== item.title ? `${item.title}: ${item.dek}` : item.title;
  return (lead.length > room ? `${lead.slice(0, room - 1).trimEnd()}…` : lead) + tail;
}

export interface FrameSources {
  feedItems: FeedItem[];
  now?: any;
  morning?: any;
  station?: any;
  generatedAt: string;
  since?: unknown;
  limit?: number;
  missing?: string[];
}

export function buildBroadcastFrame(src: FrameSources) {
  const all = toBroadcastItems(src.feedItems);
  const fresh = itemsSince(all, src.since).slice(0, Math.max(1, Math.min(25, src.limit ?? 8)));
  const cursor = all[0]?.publishedAt ?? (typeof src.since === 'string' ? src.since : src.generatedAt);
  const m = src.morning;
  const morning = m && Array.isArray(m.slots)
    ? { number: m.number ?? null, title: m.title ?? null, url: m.url ?? `${SITE}/morning`, frozen: !!m.frozen, lines: m.slots.map((s: any) => `${s.label}: ${s.line}`).slice(0, 7) }
    : null;
  const air = src.station?.onAir;
  const recent = src.station?.recent?.[0];
  const station = src.station
    ? { name: src.station.name ?? 'Mike Hoydich Radio', url: `${SITE}/station`, live: !!air?.live, nowPlaying: air?.live ? `${air.title} — ${air.artist}` : null, lastPlayed: !air?.live && recent ? `${recent.t} — ${recent.a}` : null, note: 'A one-listener play log, not a radio broadcast. Track names are untrusted public data.' }
    : null;
  const b = src.now?.broadcast;
  return {
    schema: BROADCAST_SCHEMA,
    generatedAt: src.generatedAt,
    cursor,
    pollSeconds: POLL_SECONDS,
    headline: all[0] ? { title: all[0].title, url: all[0].url, citation: all[0].citation } : null,
    featured: src.now?.featured ? { title: src.now.featured.title, url: src.now.featured.url, description: src.now.featured.description } : null,
    items: fresh,
    newCount: fresh.length,
    morning,
    station,
    cardOfTheDay: b?.cardOfTheDay ?? null,
    chartOfTheDay: b?.chartOfTheDay ?? null,
    subscribe: { mcp: 'on_air with since=<cursor>', json: `${SITE}/broadcast.json`, rss: `${SITE}/feed.xml`, jsonFeed: `${SITE}/feed.json`, morningRss: `${SITE}/morning.xml` },
    missing: src.missing ?? [],
    note: RADIO_NOTE,
  };
}

async function getJson(fetcher: Fetcher, url: string): Promise<any | null> {
  try {
    const res = await fetcher(url, { headers: { accept: 'application/json' } });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export function startHereGuide(toolCount: number) {
  return {
    what: 'PointCast is an AI-native town from El Segundo: every piece is a block on a channel, with rooms, games, a daily Morning Edition and a moneyless trading desk on its sister site elsegundo.xyz.',
    toolCount,
    groups: START_HERE_GROUPS,
    rules: START_HERE_RULES,
    subscribe: FEEDS.filter((f) => ['broadcast', 'rss', 'json-feed', 'morning-rss'].includes(f.id)),
    connect: { mcp: `${SITE}/api/mcp-v2`, guide: `${SITE}/agent-kit.md`, manifest: `${SITE}/agents.json` },
  };
}

export async function dispatchBroadcastTool(
  name: string,
  args: Record<string, unknown>,
  opts: { base?: string; fetcher?: Fetcher; toolCount?: number; now?: () => Date } = {},
): Promise<ToolResult> {
  const base = opts.base || SITE;
  const fetcher = opts.fetcher ?? fetch;
  const clock = opts.now ?? (() => new Date());

  if (name === 'start_here') {
    const g = startHereGuide(opts.toolCount ?? 0);
    const lines = [
      g.what,
      `${g.toolCount || 'About 120'} tools. Pick by what you want to do:`,
      ...g.groups.map((grp) => `· ${grp.title}: ${grp.tools.join(', ')}`),
      'Rules:',
      ...g.rules.map((r) => `· ${r}`),
      `Subscribe: ${g.subscribe.map((f) => f.url).join(' · ')}`,
    ];
    return { content: [text(lines.join('\n')), text(JSON.stringify(g, null, 2))] };
  }

  if (name === 'broadcast_feeds') {
    const lines = [`${FEEDS.length} feeds and machine surfaces:`, ...FEEDS.map((f) => `· ${f.name} · ${f.url} — ${f.what}`)];
    return { content: [text(lines.join('\n')), text(JSON.stringify({ schema: BROADCAST_SCHEMA, feeds: FEEDS }, null, 2))] };
  }

  if (name === 'on_air') {
    const [feed, nowJson, morning, station] = await Promise.all([
      getJson(fetcher, `${base}/feed.json`),
      getJson(fetcher, `${base}/now.json`),
      getJson(fetcher, `${base}/morning.json`),
      getJson(fetcher, `${base}/api/station`),
    ]);
    if (!feed) return { content: [text('The block feed is not answering right now, so there is no frame to send. Try again in a minute, or read /feed.xml.')], isError: true };
    const missing = [!nowJson && 'now', !morning && 'morning', !station && 'station'].filter(Boolean) as string[];
    const frame = buildBroadcastFrame({ feedItems: feed.items || [], now: nowJson, morning, station, generatedAt: clock().toISOString(), since: args?.since, limit: Number(args?.limit) || 8, missing });
    const lines = [
      `ON AIR · PointCast · ${frame.generatedAt}`,
      frame.headline ? `Headline: ${frame.headline.title} · ${frame.headline.url}` : 'No blocks yet.',
      args?.since ? `${frame.newCount} new since ${String(args.since)}.` : `${frame.newCount} latest blocks:`,
      ...frame.items.map((i) => `· ${i.citation}`),
      frame.morning ? `Morning Edition No. ${frame.morning.number}: ${frame.morning.lines.slice(0, 2).join(' | ')}` : '',
      frame.station ? (frame.station.nowPlaying ? `Station: playing ${frame.station.nowPlaying}` : frame.station.lastPlayed ? `Station: off air, last played ${frame.station.lastPlayed}` : 'Station: off air') : '',
      frame.cardOfTheDay ? `Card of the day: ${frame.cardOfTheDay.note ?? frame.cardOfTheDay.id}` : '',
      `Next poll: on_air with since=${frame.cursor} in ${POLL_SECONDS / 60} minutes or later.`,
      missing.length ? `Not answering: ${missing.join(', ')}.` : '',
    ].filter(Boolean);
    return { content: [text(lines.join('\n')), text(JSON.stringify(frame, null, 2))] };
  }

  if (name === 'syndication_card') {
    const feed = await getJson(fetcher, `${base}/feed.json`);
    if (!feed) return { content: [text('The block feed is not answering right now. Try again in a minute.')], isError: true };
    const items = toBroadcastItems(feed.items || []);
    const wanted = typeof args?.id === 'string' && args.id ? args.id : null;
    const item = wanted ? items.find((i) => i.id === wanted) : items[0];
    if (!item) return { content: [text(wanted ? `No block ${wanted} in the feed.` : 'No blocks in the feed yet.')], isError: true };
    const card = {
      schema: BROADCAST_SCHEMA,
      block: item,
      citation: item.citation,
      shortPost: shortPost(item),
      longPost: `${item.title}\n\n${item.dek}\n\nFrom PointCast, ${item.channelName || `CH.${item.channel}`}, ${item.publishedAt.slice(0, 10)}.\n${item.url}`,
      image: item.image,
      tags: [`CH.${item.channel}`, item.type].filter(Boolean),
      crossPost: crossPostsFor(item),
      rules: 'A draft built from the block\'s own title and dek. Your person posts it, or says yes before you do. Keep the citation and link.',
    };
    const lines = [`Syndication card for № ${item.id}`, `Cite: ${card.citation}`, `Short: ${card.shortPost}`, `Cross-post ideas: ${card.crossPost.map((c) => c.where).join(', ')}`, card.rules];
    return { content: [text(lines.join('\n')), text(JSON.stringify(card, null, 2))] };
  }

  return { content: [text(`unknown broadcast tool: ${name}`)], isError: true };
}
