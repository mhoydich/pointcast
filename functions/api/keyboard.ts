/**
 * /api/keyboard — takes for /keyboard (Keyboard Bloom).
 *
 * A take is a keystroke recording: settings + [ms, code, down] events,
 * plus an optional song line and music link. A few KB each.
 *
 * Storage in env.VISITS KV:
 *   - `kb:take:<id>`  → full take JSON (includes a sha-256 of the delete secret)
 *   - `kb:index`      → JSON array of public take summaries, newest first, capped
 *
 * GET               → { takes: Summary[] }   (public wall)
 * GET ?id=<id>      → { take }               (public or unlisted, no secret)
 * POST {take}       → { id, secret, summary }
 * DELETE ?id&secret → { ok }
 */

import type { Env } from './visit';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const INDEX_KEY = 'kb:index';
const MAX_INDEX = 150;
const MAX_EVENTS = 20000;
const MAX_DUR = 180000;
const MAX_BODY = 400_000;
const SCALES = new Set(['majpent', 'minpent', 'hirajoshi', 'dorian', 'lydian', 'whole']);
const VOICES = new Set(['bloom', 'glass', 'reed']);
const CODE_RE = /^[A-Za-z0-9]{1,16}$/;
const ID_RE = /^[a-z0-9]{6,24}$/;

type Link = { url: string; kind: string; label: string };
interface Summary {
  id: string; at: string; title: string; name: string; song: string; note: string;
  link: Link | null; dur: number; visibility: 'public' | 'unlisted';
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

const str = (v: unknown, cap: number) =>
  typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, cap) : '';

function rid(n = 10): string {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
}

async function sha(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
}

function cleanLink(v: any): Link | null {
  if (!v || typeof v.url !== 'string') return null;
  try {
    const u = new URL(v.url);
    if (!/^https?:$/.test(u.protocol)) return null;
    const h = u.hostname.replace(/^www\./, '');
    const kind = /spotify\.com$/.test(h) ? 'spotify'
      : /music\.apple\.com$/.test(h) ? 'apple'
      : /(youtube\.com|youtu\.be)$/.test(h) ? 'youtube'
      : /soundcloud\.com$/.test(h) ? 'soundcloud'
      : /bandcamp\.com$/.test(h) ? 'bandcamp'
      : /tidal\.com$/.test(h) ? 'tidal' : 'other';
    const labels: Record<string, string> = { spotify: 'Spotify', apple: 'Apple Music', youtube: 'YouTube', soundcloud: 'SoundCloud', bandcamp: 'Bandcamp', tidal: 'Tidal' };
    return { url: u.href.slice(0, 500), kind, label: labels[kind] ?? h.slice(0, 40) };
  } catch {
    return null;
  }
}

async function loadIndex(env: Env): Promise<Summary[]> {
  const raw = await env.VISITS?.get(INDEX_KEY);
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: JSON_HEADERS });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ takes: [], note: 'storage not bound' });
  const id = new URL(request.url).searchParams.get('id');
  if (id) {
    if (!ID_RE.test(id)) return json({ error: 'bad id' }, 400);
    const raw = await env.VISITS.get(`kb:take:${id}`);
    if (!raw) return json({ error: 'not found' }, 404);
    const { secretHash, ...take } = JSON.parse(raw);
    return json({ take });
  }
  return json({ takes: await loadIndex(env) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ error: 'storage not bound' }, 503);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: 'take too long' }, 413);
  let b: any;
  try { b = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400); }

  const s = b?.settings ?? {};
  const settings = {
    scale: SCALES.has(s.scale) ? s.scale : 'minpent',
    root: Number.isInteger(s.root) && s.root >= 0 && s.root < 12 ? s.root : 2,
    voice: VOICES.has(s.voice) ? s.voice : 'bloom',
    bpm: Number.isFinite(s.bpm) ? Math.min(150, Math.max(70, Math.round(s.bpm))) : 104,
    sync: !!s.sync,
  };
  const dur = Number(b?.dur);
  if (!Number.isFinite(dur) || dur <= 0 || dur > MAX_DUR) return json({ error: 'bad duration' }, 400);
  if (!Array.isArray(b?.events) || b.events.length < 2 || b.events.length > MAX_EVENTS) return json({ error: 'bad events' }, 400);
  const events: [number, string, number][] = [];
  for (const e of b.events) {
    if (!Array.isArray(e) || e.length !== 3) return json({ error: 'bad event' }, 400);
    const [t, code, down] = e;
    if (!Number.isFinite(t) || t < 0 || t > MAX_DUR + 1000 || typeof code !== 'string' || !CODE_RE.test(code)) return json({ error: 'bad event' }, 400);
    events.push([Math.round(t), code, down ? 1 : 0]);
  }

  const id = rid(10);
  const secret = rid(20);
  const summary: Summary = {
    id,
    at: new Date().toISOString(),
    title: str(b.title, 80) || 'Untitled take',
    name: str(b.name, 40),
    song: str(b.song, 100),
    note: str(b.note, 140),
    link: cleanLink(b.link),
    dur: Math.round(dur),
    visibility: b.visibility === 'unlisted' ? 'unlisted' : 'public',
  };
  await env.VISITS.put(`kb:take:${id}`, JSON.stringify({ ...summary, settings, events, secretHash: await sha(secret), v: 1 }));
  if (summary.visibility === 'public') {
    const idx = await loadIndex(env);
    await env.VISITS.put(INDEX_KEY, JSON.stringify([summary, ...idx].slice(0, MAX_INDEX)));
  }
  return json({ id, secret, summary }, 201);
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.VISITS) return json({ error: 'storage not bound' }, 503);
  const q = new URL(request.url).searchParams;
  const id = q.get('id') ?? '';
  const secret = q.get('secret') ?? '';
  if (!ID_RE.test(id) || !secret) return json({ error: 'bad request' }, 400);
  const raw = await env.VISITS.get(`kb:take:${id}`);
  if (!raw) return json({ error: 'not found' }, 404);
  const take = JSON.parse(raw);
  if (take.secretHash !== (await sha(secret))) return json({ error: 'forbidden' }, 403);
  await env.VISITS.delete(`kb:take:${id}`);
  const idx = await loadIndex(env);
  await env.VISITS.put(INDEX_KEY, JSON.stringify(idx.filter((t) => t.id !== id)));
  return json({ ok: true });
};
