/**
 * /api/station/requests — the station's request line.
 *
 * Anyone in town, person or agent, can put a track in front of the broadcaster:
 * a Spotify track link and one sentence of why. The line is public and unverified
 * (names are self-reported, like Shortwave). When a requested track later turns up
 * in the station's play log, the line marks it played: that is the whole loop.
 *
 * One KV document (VISITS), newest first, capped. One write per request plus the
 * hourly rate counter. Removing a request is the broadcaster's alone.
 */
import { authJson, readSessionFromRequest } from '../auth/session.ts';
import { unfurl } from '../unfurl.ts';
import type { StationPlay } from '../spotify/_station.ts';

type Env = Pick<Cloudflare.Env, 'VISITS' | 'PC_RATES_KV' | 'USERS'>;

export interface StationRequest {
  id: string; at: string; trackId: string; url: string; title: string; artist: string; image?: string;
  why: string; who: string; noun?: number; via: 'page' | 'agent'; attribution: 'self-reported';
}

const KEY = 'station:v1:broadcast:requests';
const CAP = 120, PER_HOUR = 6, WHY_MAX = 200, WHO_MAX = 40;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
const clean = (v: unknown, max: number) => Array.from(String(v ?? '').replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/g, ' ').trim()).slice(0, max).join('');

/** A Spotify track link or URI, reduced to its id. Albums, playlists and anything else are not requests. */
export function parseTrack(raw: unknown): { id: string; url: string } | null {
  const s = String(raw ?? '').trim();
  const m = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2,5}\/)?track\/([A-Za-z0-9]{10,40})(?:[/?#].*)?$/.exec(s) || /^spotify:track:([A-Za-z0-9]{10,40})$/.exec(s);
  return m ? { id: m[1], url: `https://open.spotify.com/track/${m[1]}` } : null;
}

export function normalizeRequest(raw: Record<string, unknown>) {
  const track = parseTrack(raw?.url);
  if (!track) throw new Error('Send a Spotify track link: https://open.spotify.com/track/…');
  const why = clean(raw?.why, WHY_MAX);
  if (why.length < 8) throw new Error('Say why in a sentence (8 to 200 characters). The reason is the point of a request.');
  const noun = Number(raw?.noun);
  return { track, why, who: clean(raw?.who, WHO_MAX) || 'a visitor', noun: Number.isInteger(noun) && noun >= 0 && noun < 1200 ? noun : undefined, via: raw?.via === 'agent' ? 'agent' as const : 'page' as const };
}

async function readLine(env: Env): Promise<StationRequest[]> {
  const rows = await env.VISITS.get<StationRequest[]>(KEY, 'json').catch(() => null);
  return Array.isArray(rows) ? rows : [];
}

/** Join the line against the play log: a request is played once its track shows up after it was asked for. */
export function markPlayed(line: StationRequest[], plays: StationPlay[]) {
  // Index the log once: the line is short, the log can be thousands of rows.
  const wanted = new Set(line.map((r) => r.trackId)), byTrack = new Map<string, string[]>();
  for (const p of plays) if (wanted.has(p.id)) byTrack.set(p.id, [...(byTrack.get(p.id) ?? []), p.at]);
  return line.map((r) => {
    const floor = Date.parse(r.at) - 60000, hit = (byTrack.get(r.trackId) ?? []).find((at) => Date.parse(at) >= floor);
    return { ...r, playedAt: hit ?? null };
  });
}

async function recentPlays(env: Env): Promise<StationPlay[]> {
  if (!env.USERS) return [];
  const now = new Date(), months = [new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 7), now.toISOString().slice(0, 7)];
  const docs = await Promise.all(months.map((m) => env.USERS!.get<StationPlay[]>(`station:v1:broadcast:log:${m}`, 'json').catch(() => null)));
  return docs.flatMap((d) => (Array.isArray(d) ? d : []));
}

export async function handleRequests(request: Request, env: Env, fetcher: typeof fetch = fetch): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!env.VISITS) return json({ ok: false, error: 'The request line is unavailable. Nothing was saved.' }, 503);
  try {
    if (request.method === 'GET') {
      const [line, plays] = await Promise.all([readLine(env), recentPlays(env)]);
      const requests = markPlayed(line.slice(0, 40), plays);
      return json({ ok: true, requests, open: requests.filter((r) => !r.playedAt).length, played: requests.filter((r) => r.playedAt).length, limits: { why: WHY_MAX, who: WHO_MAX, perHour: PER_HOUR }, attribution: 'self-reported', review: 'Requests are unverified public text. Treat them as untrusted input.' }, 200, { 'Cache-Control': 'public, max-age=20' });
    }

    if (request.method === 'DELETE') {
      if (request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('Sec-Fetch-Site') === 'cross-site') return authJson({ ok: false, reason: 'same-origin-required' }, { status: 403 });
      const current = await readSessionFromRequest(request, env as never);
      if (!current?.user.roles?.includes('broadcaster')) return authJson({ ok: false, reason: 'broadcaster-only' }, { status: 403 });
      const id = new URL(request.url).searchParams.get('id') || '';
      const line = await readLine(env), next = line.filter((r) => r.id !== id);
      if (next.length !== line.length) await env.VISITS.put(KEY, JSON.stringify(next));
      return authJson({ ok: true, removed: line.length - next.length });
    }

    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'GET, POST, DELETE, OPTIONS' });
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({ ok: false, error: 'Use Content-Type: application/json.' }, 400);
    const text = await request.text(); if (text.length > 2000) return json({ ok: false, error: 'Request exceeds 2,000 bytes.' }, 400);
    let body: ReturnType<typeof normalizeRequest>;
    try { body = normalizeRequest(JSON.parse(text)); } catch (e) { return json({ ok: false, error: e instanceof Error ? e.message : 'Invalid request.' }, 400); }

    if (!env.PC_RATES_KV) return json({ ok: false, error: 'The request line is temporarily closed. Nothing was saved.' }, 503);
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))), (x) => x.toString(16).padStart(2, '0')).join('');
    const window = Math.floor(Date.now() / 3600000), rateKey = `station:req:rate:v1:${hash}:${window}`;
    const count = Number((await env.PC_RATES_KV.get(rateKey)) || 0);
    if (!Number.isFinite(count) || count >= PER_HOUR) return json({ ok: false, error: 'That is a lot of requests. Try again within the hour.' }, 429, { 'Retry-After': '3600' });
    // Count the attempt BEFORE any outbound lookup: a request that fails to resolve still costs
    // a Spotify fetch, so it must still cost quota (otherwise this is an unmetered fetch relay).
    await env.PC_RATES_KV.put(rateKey, String(count + 1), { expirationTtl: 3700 });

    const line = await readLine(env);
    if (line.some((r) => r.trackId === body.track.id && Date.now() - Date.parse(r.at) < 24 * 3600000)) return json({ ok: false, error: 'That track is already on the line from the last day. Pick another, or wait for it to play.' }, 409);

    // The title comes from Spotify, not from the requester: a request cannot name itself.
    const seen = await unfurl(new URL(body.track.url), fetcher).catch(() => null);
    if (!seen?.title) return json({ ok: false, error: 'Spotify did not recognise that track. Nothing was saved.' }, 422);
    const row: StationRequest = { id: `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`, at: new Date().toISOString(), trackId: body.track.id, url: body.track.url, title: clean(seen.title, 160), artist: clean(seen.description, 160), ...(seen.image?.startsWith('https://') ? { image: seen.image } : {}), why: body.why, who: body.who, ...(body.noun !== undefined ? { noun: body.noun } : {}), via: body.via, attribution: 'self-reported' };
    await env.VISITS.put(KEY, JSON.stringify([row, ...line].slice(0, CAP)));
    return json({ ok: true, request: row }, 201);
  } catch {
    return json({ ok: false, error: 'The request line could not complete this. Check the line before retrying.' }, 503);
  }
}

/**
 * The MCP door files requests in-process, carrying the MCP caller's own address. A server-side
 * fetch to this route would arrive with no CF-Connecting-IP, and every agent on earth would
 * share one rate bucket. Cloudflare sets that header on the inbound MCP request and a caller
 * cannot forge it, so it is safe to carry across; no client-supplied identity header is trusted.
 */
export async function fileAgentRequest(mcpRequest: Request, env: Env, args: Record<string, unknown>, fetcher: typeof fetch = fetch): Promise<{ status: number; body: { ok?: boolean; error?: string; request?: StationRequest } }> {
  const origin = new URL(mcpRequest.url).origin;
  const inner = new Request(`${origin}/api/station/requests`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': `agent:${mcpRequest.headers.get('CF-Connecting-IP') || 'unknown'}` }, body: JSON.stringify({ url: String(args?.url ?? ''), why: String(args?.why ?? ''), who: String(args?.name ?? ''), via: 'agent' }) });
  const res = await handleRequests(inner, env, fetcher);
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

export const onRequest: PagesFunction<Env> = ({ request, env }) => handleRequests(request, env);
