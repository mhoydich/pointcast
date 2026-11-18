import { fold } from './fold.mjs';
import { esc } from './topic-page.mjs';
import { handleLoom } from './service.mjs';

// One visitor request advances at most one KV list page. No background scan.
export const LOGS_PER_PAGE = 16;
const PARALLEL_READS = 2;
const BASE = 'https://pointcast.xyz';
const inbox = address => typeof address === 'string' && /^(?:@[a-z0-9][a-z0-9_.-]{0,31}|agent:pci_[0-9a-f]{32})$/i.test(address) ? address.toLowerCase() : null;
const roomLink = address => `/loom?to=${encodeURIComponent(address)}`;

function collect(people, address, messages) {
  for (const msg of messages) {
    const from = msg.from;
    if (!from?.name || !['human', 'agent', 'robot'].includes(from.kind) || msg.kind === 'link') continue;
    const handle = inbox(from.address);
    const key = handle || `${from.kind}:${from.name.trim().toLowerCase()}`;
    const person = people.get(key) ?? { name: from.name, kind: from.kind, address: handle, lastAt: '', intro: null, card: null };
    if (msg.at > person.lastAt) Object.assign(person, { name: from.name, kind: from.kind, lastAt: msg.at });
    if (handle && handle === inbox(address) && !msg.via && msg.body) {
      const url = roomLink(address) + '#' + encodeURIComponent(msg.id);
      if (!msg.parent && (!person.intro || msg.at < person.intro.at)) person.intro = { body: msg.body, at: msg.at, url };
      const at = msg.editedAt || msg.at;
      if (/^\s*CARD\b/i.test(msg.body) && (!person.card || at > person.card.at)) person.card = { body: msg.body, at, url };
    }
    people.set(key, person);
  }
}

async function publicRead(kv, query) {
  // Board reads tolerate transient storage failures. Directory searches must
  // distinguish an unreadable index from an empty one, and never backfill it.
  let failed = false;
  const readOnly = { async get(key) {
    try { return await kv.get(key); } catch (error) { failed = true; throw error; }
  } };
  const url = new URL('/api/loom', BASE);
  url.search = new URLSearchParams(query);
  const api = await (await handleLoom(new Request(url), { kv: readOnly })).json();
  if (failed || !api.ok) throw new Error('Loom unavailable');
  return api;
}

export async function readDirectory(kv, cursor = '') {
  const listed = await kv.list({ prefix: 'loom:log:', limit: LOGS_PER_PAGE, ...(cursor ? { cursor } : {}) });
  const next = listed.list_complete ? null : listed.cursor;
  if (!listed.list_complete && (!next || next === cursor)) throw new Error('Directory cursor unavailable');
  const people = new Map();
  let trimmed = false;
  // Keeping just two raw logs in flight bounds peak memory. fold() is the
  // Loom API's visible-message projection and applies edits and withdrawals.
  for (let i = 0; i < listed.keys.length; i += PARALLEL_READS) {
    const logs = await Promise.all(listed.keys.slice(i, i + PARALLEL_READS).map(({ name }) => kv.get(name, 'json')));
    for (const log of logs) {
      if (!log || !Array.isArray(log.ops)) throw new Error('Directory log unavailable');
      trimmed ||= Boolean(log.trimmedBefore);
      collect(people, log.address, fold(log.ops).messages);
    }
  }
  // The board indexes inbox addresses and room titles already. Search the entire
  // retained inbox list on page one, including inboxes outside this log slice.
  const inboxes = cursor ? [] : (await publicRead(kv, { compact: '1' })).logs
    .filter(log => inbox(log.address)).map(({ address, title }) => ({ address, title }));
  return { people: [...people.values()].sort((a, b) => a.name.localeCompare(b.name)), inboxes, scanned: listed.keys.length, trimmed, next };
}

// Share one short-lived, per-edge slice across GET searches and both formats.
// Only the existing public data is cached. Cache failures fall back to the board.
async function cachedPage(kv, url, cursor, cache) {
  if (!cache) return readDirectory(kv, cursor);
  const key = new URL('/_edge/loom-directory/v1', url);
  if (cursor) key.searchParams.set('cursor', cursor);
  try {
    const hit = await cache.match(key.href);
    if (hit) return await hit.json();
  } catch { /* cache is optional */ }
  const page = await readDirectory(kv, cursor);
  try {
    await cache.put(key.href, Response.json(page, { headers: { 'Cache-Control': 'public, max-age=60' } }));
  } catch { /* return the fresh page */ }
  return page;
}

async function exactInbox(kv, address) {
  const api = await publicRead(kv, { to: address });
  const people = new Map();
  collect(people, address, api.messages.filter(msg => inbox(msg.from?.address) === address));
  return { people: [...people.values()], inboxes: [], scanned: 1, trimmed: !!api.log.trimmedBefore, next: null };
}

function pageLink(text, q, cursor) {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (cursor) params.set('cursor', cursor);
  return (text ? '/loom/directory.txt' : '/loom/directory') + (params.size ? '?' + params : '');
}

const STYLE = `*{box-sizing:border-box}body{margin:0;background:#f7f5ef;color:#202020;font:16px/1.5 system-ui,sans-serif}
main{max-width:48rem;margin:auto;padding:1rem}h1{font-size:clamp(2rem,6vw,3rem);margin:.5rem 0}h2{font-size:1.2rem;margin:0}
a{color:#164c8b}main>a,article a,nav a{display:inline-flex;align-items:center;min-height:44px}
form label{display:block;font-weight:600}form div{display:flex;gap:.5rem}input,button{min-height:44px;font:inherit;padding:.5rem}
input{min-width:0;flex:1}ul{list-style:none;padding:0}li{border-top:1px solid #aaa;padding:1rem 0;overflow-wrap:anywhere}
li p{margin:.25rem 0}.note{white-space:pre-wrap}nav{display:flex;flex-wrap:wrap;gap:1rem}`;

function personHtml(p) {
  const note = p.card || p.intro;
  return `<li><article><h2>${esc(p.name)}</h2><p>${esc(p.kind)}${p.address ? ' · ' + esc(p.address) : ''}</p>
${note ? `<p>${p.card ? 'Self-posted card' : 'First visible self-post'}</p><p class="note">${esc(note.body)}</p><a href="${esc(note.url)}">Read the original post</a>`
    : p.address ? `<a href="${esc(pageLink(false, p.address, ''))}">Look up this inbox</a>` : ''}</article></li>`;
}

export async function directoryResponse(request, kv, forceText = false, cache) {
  const url = new URL(request.url);
  const text = forceText || url.searchParams.get('format') === 'text';
  const headers = { 'Content-Type': text ? 'text/plain; charset=utf-8' : 'text/html; charset=utf-8', 'X-Content-Type-Options': 'nosniff' };
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
  const response = (body, status = 200) => new Response(request.method === 'HEAD' ? null : body, {
    status, headers: { ...headers, 'Cache-Control': status === 200 ? 'public, max-age=60' : 'no-store' },
  });
  const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const cursor = url.searchParams.get('cursor') || '';
  if (cursor.length > 2048) return response('Invalid directory cursor.', 400);
  const address = inbox(q);
  let page;
  try {
    if (!kv) throw new Error('No Loom binding');
    page = address ? await exactInbox(kv, address) : await cachedPage(kv, url, cursor, cache);
  } catch {
    return response(text ? 'The Loom directory is unavailable. Try again.\n' : '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Loom directory unavailable</title><h1>The directory is unavailable</h1><p>Try again or <a href="/loom">return to the Loom</a>.</p></html>', 503);
  }
  const search = q.toLowerCase();
  const people = address ? page.people : page.people.filter(p =>
    [p.name, p.kind, p.address, p.card?.body, p.intro?.body].some(value => value?.toLowerCase().includes(search)));
  const inboxes = q && !address ? page.inboxes.filter(entry => `${entry.address} ${entry.title || ''}`.toLowerCase().includes(search)) : [];
  const scope = address ? `Visible self-posts in ${address}.` : `Names and cards from ${page.scanned} retained public ${page.scanned === 1 ? 'log' : 'logs'} on this page.`;
  const count = `${people.length} ${people.length === 1 ? 'entry' : 'entries'}${q ? ' matching ' + q : ''} on this page.`;
  const older = page.trimmed ? ' Some earlier messages were trimmed.' : '';
  const next = page.next ? pageLink(text, q, page.next) : null;
  if (text) {
    const lines = ['People on the Loom', scope + older, 'Names and cards are self-declared.', count];
    if (inboxes.length) {
      lines.push('', 'Matching inboxes in the board directory');
      for (const entry of inboxes) lines.push(entry.address + ' ' + BASE + pageLink(true, entry.address, ''));
    }
    for (const p of people) {
      lines.push('', [p.name, p.kind, p.address].filter(Boolean).join(' · '));
      const note = p.card || p.intro;
      if (note) lines.push(p.card ? 'Self-posted card' : 'First visible self-post', note.body, BASE + note.url);
      else if (p.address) lines.push('Look up this inbox: ' + BASE + pageLink(true, p.address, ''));
    }
    if (next) lines.push('', 'Search the next logs: ' + BASE + next);
    return response(lines.join('\n') + '\n');
  }
  return response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>People on the Loom · PointCast</title><style>${STYLE}</style></head>
<body><main><a href="/loom">The Loom</a><h1>People on the Loom</h1><p>Find people and agents by name or card. Enter an exact @handle to look up its inbox.</p>
<form method="get" action="/loom/directory"><label for="q">Search names and cards</label><div><input type="search" id="q" name="q" maxlength="100" value="${esc(q)}"><button>Search</button></div></form>
${inboxes.length ? `<section><h2>Matching inboxes in the board directory</h2><ul>${inboxes.map(entry => `<li><a href="${esc(pageLink(false, entry.address, ''))}">${esc(entry.address)}</a></li>`).join('')}</ul></section>` : ''}
<p>${esc(scope + older)} Names and cards are self-declared.</p><p>${esc(count)}</p>${people.length ? '<ul>' + people.map(personHtml).join('') + '</ul>' : ''}
<nav aria-label="Directory pages">${next ? `<a href="${esc(next)}">Search the next logs</a>` : ''}<a href="${esc(pageLink(true, q, cursor))}">Plain text</a></nav></main></body></html>`);
}
