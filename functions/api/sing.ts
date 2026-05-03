/**
 * /api/sing — soft polyphonic chorus for /sing.
 *
 * One tap = one note recorded. Page polls this endpoint every 3-4
 * seconds; recent taps from other visitors play as a soft chorus
 * underneath your own. 24-hour TTL — yesterday's chorus fades.
 *
 * Per Mike chat 2026-05-02 hour-plan: "/sing — polyphonic tap singer".
 *
 * KV layout (PC_CAKE_KV — same namespace as /wish + /cake + /decades,
 * different prefix):
 *   - sing:{ts}-{fp} → JSON entry { note, syllable, fp, at }
 *
 * GET ?since=<iso>  → taps after that timestamp (default: last 30s)
 * POST { note, syllable } → records your tap
 */

export interface Env {
  PC_CAKE_KV?: KVNamespace;
}

interface SingPayload {
  type?: string;
  note?: string;
  syllable?: string;
  timestamp?: string;
}

interface SingEntry {
  note: string;
  syllable: string;
  fp: string;
  at: string;
}

const TTL_24H = 24 * 60 * 60;

const ALLOWED_NOTES = new Set([
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
  'C5', 'D5', 'E5', 'F5', 'G5',
]);

const ALLOWED_SYLLABLES = new Set([
  'hap', 'py', 'birth', 'day', 'to', 'you', 'dear', 'name',
]);

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const ri: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...ri,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type',
      ...((ri.headers as Record<string, string>) ?? {}),
    },
  });
}

async function fingerprint(req: Request): Promise<string> {
  const ua = req.headers.get('user-agent') || 'unknown';
  const ip = req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'noip';
  const enc = new TextEncoder().encode(ua + ':' + ip);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') return json({ ok: true }, 204);
  if (request.method === 'HEAD') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'X-Pc-Service': 'sing',
        'X-Pc-Kv-Bound': String(Boolean(env.PC_CAKE_KV)),
      },
    });
  }

  if (request.method === 'GET') {
    if (!env.PC_CAKE_KV) return json({ ok: false, reason: 'kv-unbound', taps: [], total24h: 0 }, 503);

    const url = new URL(request.url);
    const since = url.searchParams.get('since');
    const cutoff = since ? new Date(since).getTime() : Date.now() - 30_000;

    try {
      const list = await env.PC_CAKE_KV.list({ prefix: 'sing:', limit: 200 });
      const recent: SingEntry[] = [];
      const now24hCutoff = Date.now() - 24 * 60 * 60 * 1000;
      let total24h = 0;
      for (const k of list.keys) {
        const v = await env.PC_CAKE_KV.get(k.name);
        if (!v) continue;
        try {
          const e = JSON.parse(v) as SingEntry;
          const t = new Date(e.at).getTime();
          if (Number.isFinite(t)) {
            if (t > now24hCutoff) total24h++;
            if (t > cutoff) recent.push(e);
          }
        } catch {}
      }
      recent.sort((a, b) => a.at.localeCompare(b.at));
      return json({ ok: true, taps: recent, total24h });
    } catch (err: any) {
      return json({ ok: false, error: 'kv-list-failed', message: err?.message, taps: [], total24h: 0 }, 500);
    }
  }

  if (request.method !== 'POST') return json({ ok: false, error: 'method-not-allowed' }, 405);

  if (!env.PC_CAKE_KV) {
    return json({ ok: false, reason: 'kv-unbound', hint: 'Bind PC_CAKE_KV in wrangler.toml.' }, 503);
  }

  let body: SingPayload;
  try { body = (await request.json()) as SingPayload; } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }
  if (body.type !== 'pc-sing-v1') return json({ ok: false, error: 'unsupported-type', got: body.type }, 400);

  const note = String(body.note ?? '').trim();
  const syllable = String(body.syllable ?? '').trim().toLowerCase();
  if (!ALLOWED_NOTES.has(note)) return json({ ok: false, error: 'bad-note', allowed: Array.from(ALLOWED_NOTES) }, 400);
  if (!ALLOWED_SYLLABLES.has(syllable)) return json({ ok: false, error: 'bad-syllable', allowed: Array.from(ALLOWED_SYLLABLES) }, 400);

  const fp = await fingerprint(request);
  const at = body.timestamp || new Date().toISOString();
  const entry: SingEntry = { note, syllable, fp, at };
  const ts = at.replace(/[^0-9]/g, '').slice(0, 14);
  const key = `sing:${ts}-${fp}`;

  try {
    await env.PC_CAKE_KV.put(key, JSON.stringify(entry), { expirationTtl: TTL_24H });
    return json({ ok: true, entry });
  } catch (err: any) {
    return json({ ok: false, error: 'kv-write-failed', message: err?.message }, 500);
  }
};
