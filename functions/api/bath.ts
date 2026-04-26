/**
 * /api/bath — Spotify link inbox for /bath listening sessions.
 *
 * POST { spotify_url, spotify_type, spotify_id, mood, address?, timestamp }
 * GET  ?wallet=tz1...  → saved links for that wallet (newest first)
 * GET  (no params)     → last 50 global saves
 *
 * KV layout (PC_BATH_KV):
 *   bath:saves:{tz-address} → SaveEntry[] cap 100, 1yr TTL
 *   bath:recent             → SaveEntry[] cap 50,  90d TTL
 *
 * Graceful empty-state when PC_BATH_KV is unbound — same pattern as
 * PC_PING_KV / PC_POLLS_KV / PC_DROP_KV.
 */

export interface Env {
  PC_BATH_KV?: KVNamespace;
}

interface SaveEntry {
  spotify_url: string;
  spotify_type: 'track' | 'playlist' | 'album' | 'episode';
  spotify_id: string;
  mood: string;
  address?: string;
  timestamp: string;
}

function json<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
  });
}

const VALID_MOODS = new Set(['warm','cool','electric','earth','void','dawn','neon','ocean']);
const VALID_TYPES = new Set(['track','playlist','album','episode']);
const TZ_RE      = /^tz[123][A-Za-z0-9]{33}$/;
const SPOT_ID_RE = /^[A-Za-z0-9]{22}$/;

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method === 'OPTIONS') return json({ ok: true }, 204);

  const url = new URL(request.url);

  // ── GET ──────────────────────────────────────────────────────────
  if (request.method === 'GET') {
    if (!env.PC_BATH_KV) return json({ ok: false, reason: 'kv-not-bound', saves: [], recent: [] });

    const wallet = url.searchParams.get('wallet');
    if (wallet && TZ_RE.test(wallet)) {
      const raw = await env.PC_BATH_KV.get(`bath:saves:${wallet}`);
      const saves = raw ? (JSON.parse(raw) as SaveEntry[]) : [];
      return json({ ok: true, wallet, count: saves.length, saves });
    }

    const raw = await env.PC_BATH_KV.get('bath:recent');
    const recent = raw ? (JSON.parse(raw) as SaveEntry[]) : [];
    return json({ ok: true, count: recent.length, recent });
  }

  // ── POST ─────────────────────────────────────────────────────────
  if (request.method !== 'POST') return json({ ok: false, reason: 'method-not-allowed' }, 405);
  if (!env.PC_BATH_KV) return json({ ok: false, reason: 'kv-not-bound' });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, reason: 'bad-json' }, 400);
  }

  const { spotify_url, spotify_type, spotify_id, mood, address } = body as {
    spotify_url?: string; spotify_type?: string; spotify_id?: string;
    mood?: string; address?: string;
  };

  if (
    typeof spotify_url !== 'string' ||
    typeof spotify_type !== 'string' ||
    typeof spotify_id !== 'string' ||
    typeof mood !== 'string' ||
    !VALID_TYPES.has(spotify_type) ||
    !VALID_MOODS.has(mood) ||
    !SPOT_ID_RE.test(spotify_id)
  ) {
    return json({ ok: false, reason: 'invalid-fields' }, 400);
  }

  const entry: SaveEntry = {
    spotify_url: spotify_url.slice(0, 200),
    spotify_type: spotify_type as SaveEntry['spotify_type'],
    spotify_id,
    mood,
    address: typeof address === 'string' && TZ_RE.test(address) ? address : undefined,
    timestamp: new Date().toISOString(),
  };

  // Per-wallet save
  if (entry.address) {
    const key = `bath:saves:${entry.address}`;
    const prev = JSON.parse((await env.PC_BATH_KV.get(key)) ?? '[]') as SaveEntry[];
    const next = [entry, ...prev.filter((e) => e.spotify_id !== entry.spotify_id)].slice(0, 100);
    await env.PC_BATH_KV.put(key, JSON.stringify(next), { expirationTtl: 60 * 60 * 24 * 365 });
  }

  // Global recent
  const prevRecent = JSON.parse((await env.PC_BATH_KV.get('bath:recent')) ?? '[]') as SaveEntry[];
  const nextRecent = [entry, ...prevRecent.filter((e) => e.spotify_id !== entry.spotify_id)].slice(0, 50);
  await env.PC_BATH_KV.put('bath:recent', JSON.stringify(nextRecent), { expirationTtl: 60 * 60 * 24 * 90 });

  return json({ ok: true, saved: entry });
};
