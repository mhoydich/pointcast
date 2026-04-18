/**
 * functions/api/indexnow.ts — IndexNow submission endpoint for PointCast.
 *
 * IndexNow is the Microsoft/Yandex/Seznam/Naver protocol for push-indexing
 * URLs to participating search engines. Instead of waiting 24-72h for a
 * spider to find a new URL, you POST it to the IndexNow endpoint and the
 * receiver (Bing et al.) fetches the page within minutes.
 *
 * Spec: https://www.indexnow.org/documentation
 *
 * ## How this endpoint works
 *
 * POST /api/indexnow
 * body: { urls: ["https://pointcast.xyz/b/0230", ...] }
 *   (or a single URL in body.url, or a pre-formatted IndexNow payload)
 *
 * The handler:
 *   1. Reads INDEXNOW_KEY from env (Cloudflare Pages secret).
 *   2. If unset → returns 503 with { ok: false, reason: 'key-not-bound' }.
 *      This is the expected shape until Manus binds the secret via
 *      Cloudflare Pages → Settings → Environment variables.
 *   3. If set → forwards to https://api.indexnow.org/IndexNow with the
 *      canonical payload shape:
 *        { host, key, keyLocation, urlList }
 *      keyLocation is a URL on the site that serves the key in plaintext —
 *      i.e., https://pointcast.xyz/<key>.txt — so the receiver can verify
 *      ownership of the host before trusting the payload.
 *
 * ## Authentication
 *
 * This endpoint is callable by anyone — IndexNow itself is a push protocol
 * with no author auth (the key IS the auth). We don't want randos spamming
 * our pings, so this function will later add a header-based token gate
 * (INDEXNOW_SUBMIT_TOKEN) once Manus sets one up. Until then, anyone can
 * POST; worst case is we send extra pings and Bing rate-limits us.
 *
 * ## Typical use
 *
 * From a deploy hook (CI/Cloudflare build-complete webhook → CF Worker) or
 * from scripts/indexnow-submit.mjs after a content change lands.
 */

export interface Env {
  INDEXNOW_KEY?: string;
  /** Optional simple token gate for this endpoint itself (header "x-pc-submit"). */
  INDEXNOW_SUBMIT_TOKEN?: string;
}

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const HOST = 'pointcast.xyz';

interface SubmitBody {
  url?: string;
  urls?: string[];
}

function json<T>(data: T, init: number | ResponseInit = 200): Response {
  const response_init: ResponseInit = typeof init === 'number' ? { status: init } : init;
  return new Response(JSON.stringify(data, null, 2), {
    ...response_init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-pc-submit',
      ...((response_init.headers as Record<string, string>) ?? {}),
    },
  });
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  if (request.method === 'OPTIONS') {
    return json({ ok: true }, 204);
  }

  // GET → status check + documentation-friendly response
  if (request.method === 'GET') {
    return json({
      ok: true,
      endpoint: 'https://pointcast.xyz/api/indexnow',
      keyBound: Boolean(env.INDEXNOW_KEY),
      usage: 'POST body { urls: ["https://pointcast.xyz/..."] } or { url: "https://pointcast.xyz/..." }',
      notes: [
        'The key is a Cloudflare Pages environment variable (INDEXNOW_KEY).',
        'It must also be hosted at https://pointcast.xyz/<key>.txt so IndexNow receivers can verify ownership.',
        'keyLocation is auto-derived from HOST + INDEXNOW_KEY.',
        'Submit POST when new Blocks are added; receivers (Bing, Yandex) will fetch the URLs within minutes.',
      ],
      spec: 'https://www.indexnow.org/documentation',
    });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, error: 'method-not-allowed' }, 405);
  }

  // Optional token gate — set INDEXNOW_SUBMIT_TOKEN to require a header
  if (env.INDEXNOW_SUBMIT_TOKEN) {
    const provided = request.headers.get('x-pc-submit') ?? '';
    if (provided !== env.INDEXNOW_SUBMIT_TOKEN) {
      return json({ ok: false, error: 'unauthorized' }, 401);
    }
  }

  if (!env.INDEXNOW_KEY) {
    return json({
      ok: false,
      reason: 'key-not-bound',
      hint: 'Set INDEXNOW_KEY in Cloudflare Pages env + host https://pointcast.xyz/<key>.txt',
    }, 503);
  }

  let body: SubmitBody;
  try {
    body = (await request.json()) as SubmitBody;
  } catch {
    return json({ ok: false, error: 'invalid-json' }, 400);
  }

  const urlList: string[] = Array.isArray(body.urls)
    ? body.urls
    : typeof body.url === 'string'
      ? [body.url]
      : [];

  if (urlList.length === 0) {
    return json({ ok: false, error: 'no-urls' }, 400);
  }

  // Validate every URL is on our host — IndexNow receivers reject
  // payloads that mix hosts, and this prevents accidentally spamming
  // other sites.
  const offHost = urlList.filter((u) => {
    try { return new URL(u).host !== HOST; } catch { return true; }
  });
  if (offHost.length > 0) {
    return json({ ok: false, error: 'off-host-urls', offHost }, 400);
  }

  const payload = {
    host: HOST,
    key: env.INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${env.INDEXNOW_KEY}.txt`,
    urlList,
  };

  try {
    const r = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    // IndexNow typically returns 200 (accepted) or 202 (accepted for
    // processing). Anything else, relay the status for visibility.
    return json({
      ok: r.status === 200 || r.status === 202,
      status: r.status,
      submitted: urlList.length,
      host: HOST,
    });
  } catch (err: any) {
    return json({
      ok: false,
      error: 'fetch-failed',
      message: err?.message || String(err),
    }, 500);
  }
};
