#!/usr/bin/env node
// broadcast.mjs — after a deploy, tell the outside world about new blocks.
//
// One source (the block in the repo), fanned out:
//   - Bluesky: one post per new block, as the PointCast desk, linking back.
//   - Farcaster: the same, as a cast with the block as its embed (via Neynar).
//   - IndexNow: the block URLs, through the site's own /api/indexnow.
//
// Stateless on purpose. Each network's own feed is the record of what was
// sent: a block is skipped when the account's recent posts already link to it, so a
// cancelled or repeated run neither loses a block nor posts it twice, and
// any agent can read the same feed to see what went out.
//
// Rules (docs/setup/broadcast.md):
//   - Only agent-written blocks (author cc or codex). Blocks in Mike's words
//     (mike, mh+cc) and guests' words are theirs to post.
//   - No drafts, nothing dated in the future, nothing older than WINDOW_DAYS.
//   - At most MAX_POSTS per run, oldest first.
//   - A block is posted only once its page answers 200 on production.
//
// Usage:
//   node scripts/broadcast.mjs            post (needs the two env vars below)
//   node scripts/broadcast.mjs --dry-run  print what would be sent
//
// Env: BLUESKY_HANDLE, BLUESKY_APP_PASSWORD (an app password, never the
// account password); NEYNAR_API_KEY, FARCASTER_SIGNER_UUID, FARCASTER_FID,
// optional FARCASTER_CHANNEL. A network without its env is skipped, not
// failed, and one network failing does not stop the other.

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SITE = 'https://pointcast.xyz';
export const AUTO_AUTHORS = new Set(['cc', 'codex']);
export const WINDOW_DAYS = 3;
export const MAX_POSTS = 3;
export const POST_MAX = 300; // Bluesky's limit, in graphemes
export const CAST_MAX_BYTES = 300; // under Farcaster's 320-byte cast limit
const NEYNAR = 'https://api.neynar.com/v2/farcaster';
const PDS = 'https://bsky.social';

export function blockUrl(id) {
  return `${SITE}/b/${id}`;
}

function graphemes(text) {
  return [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)].map((s) => s.segment);
}

function clip(text, max) {
  const parts = graphemes(text);
  if (parts.length <= max) return text;
  return parts.slice(0, Math.max(0, max - 1)).join('').trimEnd() + '…';
}

/** Blocks eligible for automatic posting, oldest first. */
export function selectBlocks(blocks, now = new Date(), windowDays = WINDOW_DAYS) {
  const end = now.getTime();
  const start = end - windowDays * 24 * 3600 * 1000;
  return blocks
    .filter((b) => b && typeof b.id === 'string' && /^\d{4}$/.test(b.id))
    .filter((b) => b.draft !== true)
    .filter((b) => AUTO_AUTHORS.has(b.author ?? 'cc'))
    .filter((b) => typeof b.title === 'string' && b.title.trim())
    .filter((b) => {
      const t = Date.parse(b.timestamp);
      return Number.isFinite(t) && t >= start && t <= end;
    })
    .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

/** The Bluesky post record for one block. The link is a facet and a card. */
export function buildPost(block, now = new Date()) {
  const url = blockUrl(block.id);
  const shown = url.replace(/^https:\/\//, '');
  const tail = `\n\n${shown}`;
  const room = POST_MAX - graphemes(tail).length;
  const title = block.title.trim();
  const dek = typeof block.dek === 'string' ? block.dek.trim() : '';
  let head = dek ? `${title}\n\n${dek}` : title;
  if (graphemes(head).length > room) head = clip(dek ? `${title}: ${dek}` : title, room);
  const text = head + tail;
  const enc = new TextEncoder();
  const byteStart = enc.encode(head + '\n\n').length;
  const byteEnd = byteStart + enc.encode(shown).length;
  return {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: now.toISOString(),
    langs: ['en'],
    facets: [
      { index: { byteStart, byteEnd }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }] },
    ],
    embed: {
      $type: 'app.bsky.embed.external',
      external: { uri: url, title: clip(title, 200), description: clip(dek || 'A block from PointCast, El Segundo.', 280) },
    },
  };
}

/** Block ids named anywhere in a list of strings. */
export function idsIn(strings) {
  const ids = new Set();
  for (const text of strings ?? []) {
    if (typeof text !== 'string') continue;
    for (const m of text.matchAll(/pointcast\.xyz\/b\/(\d{4})\b/g)) ids.add(m[1]);
  }
  return ids;
}

/** Block ids the Bluesky account's recent posts already link to. */
export function postedIds(feed) {
  return idsIn((feed ?? []).flatMap((item) => {
    const record = item?.post?.record ?? {};
    return [record.text, record.embed?.external?.uri, ...(record.facets ?? []).flatMap((f) => (f.features ?? []).map((x) => x.uri))];
  }));
}

/** Block ids the Farcaster account's recent casts already link to. */
export function castIds(casts) {
  return idsIn((casts ?? []).flatMap((cast) => [cast?.text, ...(cast?.embeds ?? []).map((e) => e?.url)]));
}

/** The cast for one block. The link rides as the embed, not in the text. */
export function buildCast(block) {
  const title = block.title.trim();
  const dek = typeof block.dek === 'string' ? block.dek.trim() : '';
  const enc = new TextEncoder();
  let text = dek ? `${title}\n\n${dek}` : title;
  if (enc.encode(text).length > CAST_MAX_BYTES) {
    const parts = graphemes(text);
    while (parts.length && enc.encode(parts.join('') + '…').length > CAST_MAX_BYTES) parts.pop();
    text = parts.join('').trimEnd() + '…';
  }
  return { text, embeds: [{ url: blockUrl(block.id) }] };
}

export function readBlocks(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try { return JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { return null; }
    })
    .filter(Boolean);
}

async function xrpc(method, { token, body, query } = {}) {
  const qs = query ? `?${new URLSearchParams(query)}` : '';
  const res = await fetch(`${PDS}/xrpc/${method}${qs}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* not json */ }
  if (!res.ok) throw new Error(`${method} ${res.status}: ${data?.message ?? text.slice(0, 200)}`);
  return data;
}

async function isLive(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    return res.status === 200;
  } catch {
    return false;
  }
}

/** The block's share image as a Bluesky blob, or null. Never fatal. */
async function uploadThumb(block, token) {
  const path = block.meta?.ogImage;
  if (typeof path !== 'string' || !path) return null;
  try {
    const res = await fetch(new URL(path, SITE));
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !type.startsWith('image/')) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > 950_000) return null;
    const up = await fetch(`${PDS}/xrpc/com.atproto.repo.uploadBlob`, {
      method: 'POST',
      headers: { 'Content-Type': type.split(';')[0], Authorization: `Bearer ${token}` },
      body: bytes,
    });
    if (!up.ok) return null;
    return (await up.json()).blob ?? null;
  } catch {
    return null;
  }
}

async function bluesky(candidates) {
  const handle = process.env.BLUESKY_HANDLE;
  const password = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !password) {
    console.log('bluesky: BLUESKY_HANDLE / BLUESKY_APP_PASSWORD not set, skipping');
    return [];
  }
  const session = await xrpc('com.atproto.server.createSession', { body: { identifier: handle, password } });
  const feed = await xrpc('app.bsky.feed.getAuthorFeed', {
    token: session.accessJwt,
    query: { actor: session.did, limit: '100', filter: 'posts_no_replies' },
  });
  const already = postedIds(feed.feed);
  const todo = candidates.filter((b) => !already.has(b.id)).slice(0, MAX_POSTS);
  console.log(`bluesky: ${already.size} block(s) already posted, ${todo.length} to post`);
  const sent = [];
  for (const block of todo) {
    const url = blockUrl(block.id);
    if (!(await isLive(url))) {
      console.log(`bluesky: ${url} is not live yet, leaving it for the next run`);
      continue;
    }
    const record = buildPost(block);
    const thumb = await uploadThumb(block, session.accessJwt);
    if (thumb) record.embed.external.thumb = thumb;
    const out = await xrpc('com.atproto.repo.createRecord', {
      token: session.accessJwt,
      body: { repo: session.did, collection: 'app.bsky.feed.post', record },
    });
    console.log(`bluesky: posted ${block.id} -> ${out.uri}`);
    sent.push(url);
  }
  return sent;
}

async function neynar(path, { key, body } = {}) {
  const res = await fetch(`${NEYNAR}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'x-api-key': key, accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* not json */ }
  if (!res.ok) throw new Error(`neynar ${path.split('?')[0]} ${res.status}: ${data?.message ?? text.slice(0, 200)}`);
  return data;
}

async function farcaster(candidates) {
  const key = process.env.NEYNAR_API_KEY;
  const signer = process.env.FARCASTER_SIGNER_UUID;
  const fid = process.env.FARCASTER_FID;
  if (!key || !signer || !fid) {
    console.log('farcaster: NEYNAR_API_KEY / FARCASTER_SIGNER_UUID / FARCASTER_FID not set, skipping');
    return [];
  }
  const feed = await neynar(`/feed/user/casts?fid=${encodeURIComponent(fid)}&limit=50&include_replies=false`, { key });
  const already = castIds(feed?.casts);
  const todo = candidates.filter((b) => !already.has(b.id)).slice(0, MAX_POSTS);
  console.log(`farcaster: ${already.size} block(s) already cast, ${todo.length} to cast`);
  const channel = process.env.FARCASTER_CHANNEL;
  const sent = [];
  for (const block of todo) {
    const url = blockUrl(block.id);
    if (!(await isLive(url))) {
      console.log(`farcaster: ${url} is not live yet, leaving it for the next run`);
      continue;
    }
    const out = await neynar('/cast', { key, body: { signer_uuid: signer, ...buildCast(block), ...(channel ? { channel_id: channel } : {}) } });
    console.log(`farcaster: cast ${block.id} -> ${out?.cast?.hash ?? 'ok'}`);
    sent.push(url);
  }
  return sent;
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const candidates = selectBlocks(readBlocks(join(root, 'src/content/blocks')));
  console.log(`broadcast: ${candidates.length} agent-written block(s) in the last ${WINDOW_DAYS} days`);
  if (!candidates.length) return;

  if (dry) {
    for (const block of candidates.slice(0, MAX_POSTS)) {
      console.log('--- bluesky\n' + buildPost(block).text);
      const cast = buildCast(block);
      console.log('--- farcaster\n' + cast.text + '\n[embed] ' + cast.embeds[0].url);
    }
    return;
  }

  const sent = new Set();
  let failed = false;
  for (const [name, leg] of [['bluesky', bluesky], ['farcaster', farcaster]]) {
    try {
      for (const url of await leg(candidates)) sent.add(url);
    } catch (error) {
      failed = true;
      console.error(`${name}: failed (${error.message})`);
    }
  }

  // IndexNow, through the site's own endpoint (which holds the key). A 503
  // there means the key is not bound yet; that is reported, not fatal.
  if (sent.size) {
    try {
      const res = await fetch(`${SITE}/api/indexnow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [...sent] }),
      });
      console.log(`broadcast: IndexNow ${res.status} for ${sent.size} url(s)`);
    } catch (error) {
      console.log(`broadcast: IndexNow unreachable (${error.message})`);
    }
  }
  if (failed) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`broadcast failed: ${error.message}`);
    process.exit(1);
  });
}
