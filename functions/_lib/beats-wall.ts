/**
 * Noun Beats v2 server: the Beat Wall, Floor presence and Moment serials.
 *
 * Route files (thin wrappers):
 *   functions/api/beats.ts            GET  /api/beats?sort=new|top&limit=   · GET /api/beats?ids=a,b   · POST /api/beats
 *   functions/api/beats/[id]/nod.ts   POST /api/beats/<id>/nod
 *   functions/api/beats/floor.ts      GET  /api/beats/floor
 *   functions/api/beats/moment.ts     POST /api/beats/moment
 *
 * Storage in env.VISITS KV (modelled on /api/keyboard and /api/brick-scores):
 *   nb:beat:<id>                 → { id, enc, title, name, noun, createdAt, nods }
 *   nb:wall:new                  → summaries (same shape), newest first, capped at 500
 *   nb:wall:top                  → summaries, most nods first (ties: newest), capped at 50
 *   nb:rl:<ip-hash>              → 60 s marker: one publish per minute per visitor
 *   nb:nod:<id>:<ip-hash>:<day>  → one nod per visitor per beat per UTC day (TTL 2 days)
 *   nb:mser:<type>               → last Moment serial handed out for a type (best effort, see below)
 *   nb:rlm:<ip-hash>             → Moment claims this minute (≤ 8, TTL 60 s)
 *
 * A beat is its v1 share encoding (the same bytes as /beats/#b=…). The server decodes it to validate:
 * checksum, version, structure and at least 3 hits. Titles and names go through the Rooms blur list.
 *
 * KV caveats, stated plainly: KV has no transactions and allows about one write per second per key.
 * Nod counts and Moment serials are read-modify-write, so two writes in the same instant can lose
 * one increment (nods) or hand out the same serial twice (Moments). For a toy wall that's acceptable;
 * a Durable Object would make both exact.
 */

export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
interface DOStubLike { fetch(input: string | Request): Promise<Response> }
interface DONamespaceLike { idFromName(name: string): unknown; get(id: unknown): DOStubLike }
export interface BeatsEnv { VISITS?: KVLike; DRUM_ROOM?: DONamespaceLike }

export const HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
export const json = (b: unknown, s = 200, extra?: Record<string, string>) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...HEADERS, ...(extra || {}) } });
export const options = async () => new Response(null, { status: 204, headers: HEADERS });

export const LIMITS = { NEW_CAP: 500, TOP_CAP: 50, MAX_ENC: 400, MAX_BODY: 2000, TITLE: 40, MIN_HITS: 3, LIST_MAX: 100, LIST_DEFAULT: 30, IDS_MAX: 20, MOMENT_PER_MIN: 8 };
const ID_RE = /^[a-z0-9]{10}$/;
const NOUN_MAX = 1199;

export interface BeatRow { id: string; enc: string; title: string; name: string; noun: number; createdAt: number; nods: number }

/* ---------- the v1 share format, decoded (mirror of NB.decodeBeat in src/pages/beats/index.astro) ---------- */
function bytesFromB64url(str: string): Uint8Array | null {
  if (typeof str !== 'string' || !/^[A-Za-z0-9_-]+$/.test(str)) return null;
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  let bin: string;
  try { bin = atob(s); } catch { return null; }
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export interface DecodedBeat { bpm: number; swing: number; key: number; mode: number; nouns: number[]; author: number; cur: number; chain: number[]; mask: number; slots: number[][][]; name: string }
export function decodeBeat(str: string): DecodedBeat | null {
  const b = bytesFromB64url(str);
  if (!b || b.length < 25) return null;
  let sum = 0;
  for (let i = 0; i < b.length - 1; i++) sum = (sum + b[i]) & 255;
  if (sum !== b[b.length - 1] || b[0] !== 1) return null;
  let o = 1;
  const bpm = clamp(b[o++] + 70, 70, 160), swing = clamp(b[o++], 0, 100);
  const km = b[o++];
  const key = clamp(km & 15, 0, 11), mode = (km >> 4) & 1, hasName = (km >> 5) & 1;
  const nouns: number[] = [];
  for (let t = 0; t < 7; t++) { nouns.push(clamp((b[o] << 8) | b[o + 1], 0, NOUN_MAX)); o += 2; }
  const author = clamp((b[o] << 8) | b[o + 1], 0, NOUN_MAX); o += 2;
  const mc = b[o++], mask = mc & 15, cur = (mc >> 4) & 3;
  const clen = Math.min(8, b[o++]), cw = (b[o] << 8) | b[o + 1]; o += 2;
  const chain: number[] = [];
  for (let i = 0; i < clen; i++) chain.push((cw >> (14 - 2 * i)) & 3);
  const slots = [0, 1, 2, 3].map(() => Array.from({ length: 7 }, () => new Array(16).fill(0)));
  for (let i = 0; i < 4; i++) {
    if (!(mask & (1 << i))) continue;
    if (o + 26 > b.length - 1) return null;
    const p = slots[i];
    for (let t = 0; t < 5; t++) { const w = (b[o] << 8) | b[o + 1]; o += 2; for (let s = 0; s < 16; s++) p[t][s] = (w >> (15 - s)) & 1; }
    for (let t = 5; t < 7; t++) for (let s = 0; s < 16; s += 2) { const x = b[o++]; p[t][s] = clamp(x >> 4, 0, 8); p[t][s + 1] = clamp(x & 15, 0, 8); }
  }
  let name = '';
  if (hasName) {
    const len = b[o++];
    if (len > 24 || o + len > b.length - 1) return null;
    try { name = new TextDecoder().decode(b.subarray(o, o + len)).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16); } catch { return null; }
    o += len;
  }
  if (o !== b.length - 1) return null;
  return { bpm, swing, key, mode, nouns, author, cur, chain, mask, slots, name };
}
export function countHits(beat: DecodedBeat): number {
  let n = 0;
  for (let i = 0; i < 4; i++) if (beat.mask & (1 << i)) for (const row of beat.slots[i]) for (const v of row) if (v) n++;
  return n;
}

/* ---------- the Rooms blur list (rot13, same folding as /keyboard/rooms and the client) ---------- */
const ROT = (w: string) => w.replace(/[a-z]/g, (c) => String.fromCharCode((c.charCodeAt(0) - 97 + 13) % 26 + 97));
const BLUR = new Set(['shpx', 'shpxvat', 'shpxre', 'fuvg', 'ohyyfuvg', 'ovgpu', 'phag', 'nffubyr', 'nff', 'qvpx', 'pbpx', 'chffl', 'onfgneq', 'fyhg', 'juber', 'snt', 'snttbg', 'avttre', 'avttn', 'ergneq', 'jnaxre', 'gjng', 'cevpx', 'qbhpuront', 'zbgureshpxre'].map(ROT));
const foldLeet = (w: string) => w.toLowerCase().replace(/[@4]/g, 'a').replace(/3/g, 'e').replace(/[1!|]/g, 'i').replace(/0/g, 'o').replace(/[$5]/g, 's').replace(/7/g, 't').replace(/(.)\1+/g, '$1$1');
function isRudeWord(word: string): boolean {
  if (!/[a-z]/i.test(word)) return false; // a bare number ("beat 455") is not leetspeak
  const f = foldLeet(word).replace(/[^a-z]/g, '');
  if (!f) return false;
  if (BLUR.has(f) || BLUR.has(f.replace(/(.)\1/g, '$1'))) return true;
  return /^(shpx|fuvg|phag)/.test(ROT(f));
}
export const isRude = (text: string) => String(text || '').split(/[\s_.,\-]+/).some(isRudeWord);
// Three-letter arcade initials get one more list (rot13): short forms the word list can't see.
const INITIALS = new Set(['shx', 'spx', 'shp', 'fug', 'pag', 'qvx', 'xxx', 'avt', 'gvg', 'phz', 'wvm', 'snt', 'nff'].map(ROT));
export const isRudeInitials = (name: string) => INITIALS.has(foldLeet(name).replace(/[^a-z]/g, '')) || isRude(name);

/* ---------- helpers ---------- */
const cleanText = (v: unknown, cap: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, cap) : '');
export const isoDay = (d = new Date()) => d.toISOString().slice(0, 10);
function rid(n = 10): string {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, (x) => 'abcdefghijklmnopqrstuvwxyz0123456789'[x % 36]).join('');
}
export async function ipHash(req: Request): Promise<string> {
  const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('nb:' + ip));
  return Array.from(new Uint8Array(d).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}
async function loadList(env: BeatsEnv, key: string): Promise<BeatRow[]> {
  const raw = await env.VISITS?.get(key);
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
}
const byTop = (a: BeatRow, z: BeatRow) => (z.nods - a.nods) || (z.createdAt - a.createdAt);
const summary = (r: BeatRow): BeatRow => ({ id: r.id, enc: r.enc, title: r.title, name: r.name, noun: r.noun, createdAt: r.createdAt, nods: r.nods });

/* ---------- GET /api/beats ---------- */
export async function getBeats(request: Request, env: BeatsEnv): Promise<Response> {
  const u = new URL(request.url);
  const sort = u.searchParams.get('sort') === 'top' ? 'top' : 'new';
  if (!env.VISITS) return json({ sort, beats: [], note: 'storage not bound' });
  const ids = u.searchParams.get('ids');
  if (ids != null) {
    const list = ids.split(',').filter((x) => ID_RE.test(x)).slice(0, LIMITS.IDS_MAX);
    const rows = await Promise.all(list.map((id) => env.VISITS!.get(`nb:beat:${id}`)));
    const beats = rows.map((r) => { try { return r ? summary(JSON.parse(r)) : null; } catch { return null; } }).filter(Boolean);
    return json({ beats });
  }
  let limit = Math.floor(Number(u.searchParams.get('limit') ?? LIMITS.LIST_DEFAULT));
  if (!Number.isFinite(limit) || limit < 1) limit = LIMITS.LIST_DEFAULT;
  limit = Math.min(limit, LIMITS.LIST_MAX);
  const list = await loadList(env, sort === 'top' ? 'nb:wall:top' : 'nb:wall:new');
  return json({ sort, beats: list.slice(0, limit), count: list.length });
}

/* ---------- POST /api/beats ---------- */
export async function postBeat(request: Request, env: BeatsEnv): Promise<Response> {
  if (!env.VISITS) return json({ error: 'storage not bound' }, 503);
  const text = await request.text();
  if (text.length > LIMITS.MAX_BODY) return json({ error: 'too big', field: 'body' }, 413);
  let b: any;
  try { b = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400); }
  if (!b || typeof b !== 'object') return json({ error: 'bad json' }, 400);
  const enc = typeof b.enc === 'string' ? b.enc : '';
  if (enc.length > LIMITS.MAX_ENC) return json({ error: 'too big', field: 'enc' }, 413);
  const beat = enc ? decodeBeat(enc) : null;
  if (!beat) return json({ error: 'bad beat', field: 'enc' }, 400);
  if (countHits(beat) < LIMITS.MIN_HITS) return json({ error: 'empty beat', field: 'enc' }, 400);
  if (typeof b.title === 'string' && b.title.length > 200) return json({ error: 'too long', field: 'title' }, 400);
  const title = cleanText(b.title, LIMITS.TITLE);
  if (title && isRude(title)) return json({ error: 'title not allowed', field: 'title' }, 400);
  const name = String(b.name ?? '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 3);
  if (!name) return json({ error: 'bad name', field: 'name' }, 400);
  if (isRudeInitials(name) || (beat.name && isRude(beat.name))) return json({ error: 'name not allowed', field: 'name' }, 400);
  const noun = Math.floor(Number(b.noun));
  if (!Number.isFinite(noun) || noun < 0 || noun > NOUN_MAX) return json({ error: 'bad noun', field: 'noun' }, 400);

  const rl = `nb:rl:${await ipHash(request)}`;
  if (await env.VISITS.get(rl)) return json({ error: 'slow down', retryAfter: 60 }, 429, { 'Retry-After': '60' });
  await env.VISITS.put(rl, '1', { expirationTtl: 60 });

  const row: BeatRow = { id: rid(10), enc, title: title || 'Untitled beat', name: name.padEnd(3, '-'), noun, createdAt: Date.now(), nods: 0 };
  await env.VISITS.put(`nb:beat:${row.id}`, JSON.stringify(row));
  const [news, top] = await Promise.all([loadList(env, 'nb:wall:new'), loadList(env, 'nb:wall:top')]);
  const nextNew = [summary(row), ...news];
  const dropped = nextNew.splice(LIMITS.NEW_CAP);
  await env.VISITS.put('nb:wall:new', JSON.stringify(nextNew));
  if (top.length < LIMITS.TOP_CAP) await env.VISITS.put('nb:wall:top', JSON.stringify([...top, summary(row)].sort(byTop)));
  // Beats that fall off the New list and aren't on Top are deleted, so storage stays bounded.
  const onTop = new Set(top.map((t) => t.id));
  await Promise.all(dropped.filter((d) => !onTop.has(d.id)).map((d) => env.VISITS!.delete(`nb:beat:${d.id}`)));
  return json({ beat: summary(row) }, 201);
}

/* ---------- POST /api/beats/<id>/nod ---------- */
export async function nodBeat(request: Request, env: BeatsEnv, id: string): Promise<Response> {
  if (!env.VISITS) return json({ error: 'storage not bound' }, 503);
  if (!ID_RE.test(id || '')) return json({ error: 'bad id' }, 400);
  const raw = await env.VISITS.get(`nb:beat:${id}`);
  if (!raw) return json({ error: 'not found' }, 404);
  const row: BeatRow = JSON.parse(raw);
  const key = `nb:nod:${id}:${await ipHash(request)}:${isoDay()}`;
  if (await env.VISITS.get(key)) return json({ error: 'already nodded today', id, nods: row.nods }, 409);
  await env.VISITS.put(key, '1', { expirationTtl: 2 * 86400 });
  row.nods = (row.nods || 0) + 1;
  await env.VISITS.put(`nb:beat:${id}`, JSON.stringify(row));
  // Keep the two lists' snapshots current (best effort; the record above is the source of truth).
  try {
    const news = await loadList(env, 'nb:wall:new');
    const i = news.findIndex((n) => n.id === id);
    if (i >= 0) { news[i].nods = row.nods; await env.VISITS.put('nb:wall:new', JSON.stringify(news)); }
    const top = (await loadList(env, 'nb:wall:top')).filter((t) => t.id !== id);
    const next = [...top, summary(row)].sort(byTop);
    const out = next.slice(0, LIMITS.TOP_CAP);
    await env.VISITS.put('nb:wall:top', JSON.stringify(out));
    const fell = next.slice(LIMITS.TOP_CAP).filter((f) => !news.some((n) => n.id === f.id));
    await Promise.all(fell.map((f) => env.VISITS!.delete(`nb:beat:${f.id}`)));
  } catch { /* a KV write hiccup only delays the list snapshot */ }
  return json({ id, nods: row.nods });
}

/* ---------- GET /api/beats/floor ---------- */
// Presence for the Floor's public rooms. Each room's DrumRoomV2 answers `?stats=1` with `connected`
// (open sockets = humans; the house band is client-side and never connects). One edge-cached response
// for all rooms keeps it to one cheap request per viewer instead of a socket per room.
export const FLOOR_SLUGS = ['basement', 'roof', 'porch', 'stage', 'patio', 'hall', 'market'];
export async function floorStats(request: Request, env: BeatsEnv): Promise<Response> {
  if (!env.DRUM_ROOM) return json({ rooms: null, note: 'drum rooms not bound' });
  const cache: Cache | undefined = typeof caches === 'undefined' ? undefined : (caches as any).default;
  const cacheKey = new Request(new URL('/api/beats/floor', request.url).toString());
  if (cache) { try { const hit = await cache.match(cacheKey); if (hit) return hit; } catch { /* no cache here */ } }
  const ns = env.DRUM_ROOM;
  const counts = await Promise.all(FLOOR_SLUGS.map(async (slug) => {
    const room = 'bc-nbpub-' + slug;
    try {
      const r = await ns.get(ns.idFromName(room)).fetch(`https://drum-room.internal/api/drum/room?room=${room}&stats=1`);
      const j: any = await r.json();
      return typeof j?.connected === 'number' ? j.connected : null;
    } catch { return null; }
  }));
  const rooms: Record<string, number | null> = {};
  FLOOR_SLUGS.forEach((s, i) => { rooms[s] = counts[i]; });
  const res = json({ rooms, at: Date.now(), maxAge: 8 }, 200, { 'Cache-Control': 'public, max-age=8' });
  if (cache) { try { await cache.put(cacheKey, res.clone()); } catch { /* fine */ } }
  return res;
}

/* ---------- POST /api/beats/moment ---------- */
// Hands out the next serial for a Moment type so "#12" means the 12th of its kind anywhere.
// Moments are earned on the phone (the server can't see a room peak or a Daily), so this only numbers
// them; best effort, because KV has no atomic increment (see the header).
export const MOMENT_TYPES = ['peak-groove', 'perfect-daily', 'first-beat', 'tenth-beat', 'hundredth-beat', 'ten-nods', 'floor-hopper'];
export async function claimMoment(request: Request, env: BeatsEnv): Promise<Response> {
  if (!env.VISITS) return json({ error: 'storage not bound' }, 503);
  let b: any;
  try { b = JSON.parse((await request.text()).slice(0, 500)); } catch { return json({ error: 'bad json' }, 400); }
  const type = String(b?.type ?? '');
  if (!MOMENT_TYPES.includes(type)) return json({ error: 'bad type' }, 400);
  const rl = `nb:rlm:${await ipHash(request)}`;
  const used = Number(await env.VISITS.get(rl)) || 0;
  if (used >= LIMITS.MOMENT_PER_MIN) return json({ error: 'slow down', retryAfter: 60 }, 429, { 'Retry-After': '60' });
  await env.VISITS.put(rl, String(used + 1), { expirationTtl: 60 });
  const key = `nb:mser:${type}`;
  const serial = (Number(await env.VISITS.get(key)) || 0) + 1;
  await env.VISITS.put(key, String(serial));
  return json({ type, serial, scope: 'global' });
}
