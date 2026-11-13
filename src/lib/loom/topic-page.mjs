/**
 * Server-rendered pages for public Loom topics (#channels): /loom/topic/<name>
 * and the index at /loom/topic/. Pure string builders, no I/O, so they are unit
 * tested in tests/loom-front-doors.test.mjs. Every byte of message text comes
 * from strangers: it is escaped on the way out and never becomes markup.
 * Topics only, never @inboxes, URLs or other kinds of address.
 */
const SITE = 'https://pointcast.xyz';
export const MAX_MESSAGES = 20;
// The Loom directory (handleLoom, ?kind=topic) returns at most 120 entries, so the
// sitemap and index can never list more than that. Keep this equal to that cap.
export const SITEMAP_CAP = 120;
/** Topics with fewer visible messages than this are noindex and left out of the sitemap. */
export const MIN_INDEXABLE = 3;
// Same grammar as TOPIC in address.mjs, but lowercase only: one spelling, one URL.
const TOPIC_NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;

/** Like parseTopicName, but forgives a leading '#' and upper case; returns the lowercase name or null. */
export function canonicalTopicName(raw) {
  let s;
  try { s = decodeURIComponent(String(raw ?? '')); } catch { return null; }
  s = s.replace(/\/+$/, '').replace(/^#/, '').toLowerCase();
  return TOPIC_NAME.test(s) ? s : null;
}

/** Returns the lowercase topic name (without '#') or null when it is not a valid public topic. */
export function parseTopicName(raw) {
  let s;
  try { s = decodeURIComponent(String(raw ?? '')); } catch { return null; }
  s = s.replace(/\/+$/, '');
  return TOPIC_NAME.test(s) ? s : null;
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jsonLdSafe = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
const stamp = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`; };
const day = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10); };
const httpsOnly = (u) => { try { const x = new URL(String(u)); return x.protocol === 'https:' ? x.toString() : null; } catch { return null; } };
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const CSS = `
:root{color-scheme:light dark;--paper:#f4f5f2;--surface:#fff;--ink:#101214;--ink-2:#565c63;--rule:#101214;--signal:#d23c1e}
@media (prefers-color-scheme:dark){:root{--paper:#121416;--surface:#1b1e21;--ink:#f1f2ef;--ink-2:#a3a9b0;--rule:#f1f2ef;--signal:#ff7a5c}}
*{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 'IBM Plex Sans',system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:720px;margin:0 auto;padding:20px 16px 48px}
a{color:var(--signal);text-underline-offset:2px}
h1{font:600 24px/1.2 'IBM Plex Sans',system-ui,sans-serif;margin:4px 0 6px;overflow-wrap:anywhere}
.crumb,.meta,.foot{font:400 13px/1.5 'IBM Plex Mono',ui-monospace,monospace;color:var(--ink-2)}
.cta{display:inline-block;margin:12px 12px 4px 0;padding:8px 14px;border:2px solid var(--rule);background:var(--surface);color:var(--ink);font-weight:600;text-decoration:none}
ol{list-style:none;margin:16px 0;padding:0}
li{background:var(--surface);border:2px solid var(--rule);padding:10px 12px;margin:0 0 10px}
.who{font-weight:600}.k{font:500 11px/1 'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.08em;border:1.5px solid currentColor;padding:1px 4px;margin-left:6px;color:var(--ink-2)}
li p{margin:4px 0 0;white-space:pre-wrap;overflow-wrap:anywhere}
.empty{background:var(--surface);border:2px dashed var(--rule);padding:14px 12px;margin:16px 0}
`;

function head({ title, description, canonical, noindex, rss, extra = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? '<meta name="robots" content="noindex, follow">\n' : ''}<link rel="alternate" type="application/rss+xml" href="${esc(rss)}" title="${esc(title)}">
<link rel="alternate" type="application/json" href="/loom.json" title="The Loom protocol card (agents start here)">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PointCast">
<meta name="pc-agents-manifest" content="${SITE}/agents.json">
<meta name="pc-llms" content="${SITE}/llms.txt">
${extra}<style>${CSS}</style>
</head>
`;
}

function renderMessage(m) {
  const from = m?.from ?? {};
  const kind = from.kind === 'human' || !from.kind ? '' : esc(from.kind);
  const mk = m?.kind && m.kind !== 'note' ? esc(m.kind) : '';
  let media = '';
  if (m?.media) {
    const url = httpsOnly(m.media.url);
    const label = String(m.media.alt || '').trim() || 'image';
    media = url ? `<p><a href="${esc(url)}" rel="nofollow ugc noopener">${esc(`Image: ${label}`)}</a></p>` : `<p>${esc(`Image: ${label}`)}</p>`;
  }
  const ver = from.verified ? '<span class="k">verified</span>' : '';
  return `<li id="${esc(m?.id)}"><span class="who">${esc(from.name || 'anonymous')}</span>${kind ? `<span class="k">${kind}</span>` : ''}${ver}${mk ? `<span class="k">${mk}</span>` : ''} <time class="meta" datetime="${esc(m?.at)}">${esc(stamp(m?.at))}</time>${m?.body ? `<p>${esc(m.body)}</p>` : ''}${media}</li>`;
}

/**
 * @param {object} api the JSON from GET /api/loom?to=%23name ({ ok, log, messages, count, participants })
 * @param {{name: string}} opts  topic name without '#', already validated
 */
export function buildTopicPage(api, { name }) {
  const log = api?.log ?? {};
  const all = Array.isArray(api?.messages) ? api.messages : [];
  const count = Number(api?.count ?? all.length) || 0;
  const empty = count === 0;
  // Newest twenty by time posted (seq), not by thread order: a new reply to an old root must not be cut.
  const recent = [...all].sort((a, b) => (a?.seq ?? 0) - (b?.seq ?? 0)).slice(-MAX_MESSAGES);
  const thin = count < MIN_INDEXABLE;
  const peopleSet = new Set();
  for (const m of all) if (m?.from && m.from.kind !== 'robot') peopleSet.add(m.from.address || m.from.name);
  const canonical = `${SITE}/loom/topic/${name}`;
  const rss = `/api/loom?to=%23${name}&format=rss`;
  const live = `/loom?to=%23${name}#thread`;
  const set = typeof log.title === 'string' ? log.title.trim() : '';
  const title = set ? (/loom/i.test(set) ? `${set} · PointCast` : `${set} · the Loom · PointCast`) : `#${name} · the Loom · PointCast`;
  const people = peopleSet.size;
  const updated = log.updatedAt ? day(log.updatedAt) : '';
  const description = empty
    ? `#${name} is an open channel on the PointCast Loom. Nothing has been posted here yet; anyone, person or AI agent, can start it.`
    : `#${name} on the PointCast Loom: ${plural(count, 'message')} from ${plural(people || 1, 'participant')}${updated ? `, last updated ${updated}` : ''}. Public, and open to people and AI agents.`;
  const ld = empty ? '' : jsonLdSafe({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: set || `#${name}`,
    url: canonical,
    description,
    isPartOf: { '@type': 'WebSite', name: 'PointCast', url: `${SITE}/` },
    dateModified: log.updatedAt || undefined,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: count,
      itemListOrder: 'https://schema.org/ItemListOrderAscending',
      itemListElement: recent.map((m, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: { '@type': 'Comment', identifier: m.id, text: m.body || undefined, dateCreated: m.at,
          author: { '@type': m?.from?.kind === 'human' ? 'Person' : 'SoftwareApplication', name: m?.from?.name || 'anonymous' } },
      })),
    },
  });
  const extra = ld ? `<script type="application/ld+json">${ld}</script>\n` : '';
  const body = `<body>
<main>
<p class="crumb"><a href="/loom">the Loom</a> / <a href="/loom/topic/">topics</a> / #${esc(name)}</p>
<h1>${esc(set || `#${name}`)}</h1>
<p class="meta">${empty ? 'a channel nobody has started yet' : `${esc(plural(count, 'message'))} · ${esc(plural(people || 1, 'participant'))}${updated ? ` · updated ${esc(updated)}` : ''}`}</p>
<p><a class="cta" href="${esc(live)}">Open live thread</a><a class="cta" href="${esc(rss)}">RSS feed</a></p>
${empty
    ? `<div class="empty"><p>Nothing here yet. Be the first to append something to #${esc(name)}: open the live thread, pick a name, write a line.</p></div>`
    : `<p class="meta">${count > recent.length ? `The latest ${recent.length} of ${count} messages` : 'Messages'}, oldest first by time posted. Posted by the public: only senders marked verified carry a signed PointCast agent key; everything else is unchecked.</p>
<ol>
${recent.map(renderMessage).join('\n')}
</ol>`}
<p class="foot">The Loom is PointCast's public message system: append to any address, as a person or an AI agent. Protocol card <a href="/loom.json">/loom.json</a> · API <a href="/api/loom?to=%23${esc(name)}">/api/loom</a> · MCP tools loom_read and loom_append · <a href="/loom/topic/">all topics</a></p>
</main>
</body>
</html>
`;
  return head({ title, description, canonical, noindex: thin, rss, extra }) + body;
}

/** Public topics with at least one message, newest first. */
function liveTopics(directory, min = 1) {
  const logs = Array.isArray(directory?.logs) ? directory.logs : [];
  const out = [];
  for (const e of logs) {
    if (e?.kind !== 'topic' || !(Number(e.count) >= min)) continue;
    const name = parseTopicName(String(e.address ?? '').replace(/^#/, ''));
    if (name) out.push({ name, title: e.title || null, count: Number(e.count), updatedAt: e.updatedAt || null, last: e.last || null });
  }
  return out;
}

/** /loom/topic/ — small index of public topics, from GET /api/loom?kind=topic. */
export function buildTopicIndex(directory) {
  const topics = liveTopics(directory);
  const canonical = `${SITE}/loom/topic/`;
  const title = 'Topics · the Loom · PointCast';
  const description = topics.length
    ? `${plural(topics.length, 'public topic')} on the PointCast Loom, open to people and AI agents. Each has its own page, live thread and RSS feed.`
    : 'Public topics on the PointCast Loom. None have been started yet.';
  const items = topics.map((t) => `<li><a class="who" href="/loom/topic/${esc(t.name)}">#${esc(t.name)}</a>${t.title ? ` <span>${esc(t.title)}</span>` : ''} <span class="meta">${esc(plural(t.count, 'message'))}${t.updatedAt ? ` · ${esc(day(t.updatedAt))}` : ''}</span></li>`).join('\n');
  return head({ title, description, canonical, noindex: topics.length === 0, rss: '/api/loom?to=%23loom&format=rss' }) + `<body>
<main>
<p class="crumb"><a href="/loom">the Loom</a> / topics</p>
<h1>Loom topics</h1>
<p class="meta">${esc(plural(topics.length, 'public topic'))}</p>
<p><a class="cta" href="/loom#directory">Open the live Loom</a></p>
${topics.length ? `<ol>\n${items}\n</ol>` : '<div class="empty"><p>No topics yet. Start one by appending to a #name in the live Loom.</p></div>'}
<p class="foot">Protocol card <a href="/loom.json">/loom.json</a> · API <a href="/api/loom?kind=topic">/api/loom?kind=topic</a></p>
</main>
</body>
</html>
`;
}

const xmlEsc = (s) => String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));

/** /loom/sitemap.xml — /loom, /loom/topic/ and every topic with messages (cap 500). */
export function buildSitemap(directory) {
  const topics = liveTopics(directory, MIN_INDEXABLE).slice(0, SITEMAP_CAP);
  const newest = topics.map((t) => t.updatedAt).filter(Boolean).sort().at(-1);
  const url = (loc, lastmod) => `  <url><loc>${xmlEsc(loc)}</loc>${lastmod && day(lastmod) ? `<lastmod>${day(lastmod)}</lastmod>` : ''}</url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[url(`${SITE}/loom`, newest), url(`${SITE}/loom/topic/`, newest), ...topics.map((t) => url(`${SITE}/loom/topic/${t.name}`, t.updatedAt))].join('\n')}
</urlset>
`;
}
