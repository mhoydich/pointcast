/**
 * Shared plumbing for request-time unfurl cards (functions/og/page.png.ts,
 * functions/og/live/[room].ts): resvg-wasm rasterising with the same
 * Latin font subsets as the Kennel Club card, image fetches as data: URIs,
 * the edge cache, and the unfurl counter.
 *
 * Every failure degrades to a 302 onto a static card — a crawler that gets
 * nothing keeps its old cached image, which is worse than a plain one.
 */
import { Resvg, initWasm } from '@resvg/resvg-wasm';
import wasm from '@resvg/resvg-wasm/index_bg.wasm?module';
import interFont from '../og/kennel-club/inter-latin.bin';
import jetBrainsMonoFont from '../og/kennel-club/jetbrains-mono-latin.bin';

export const FALLBACK_CARD = '/images/og/og-home-v5.png';

let wasmReady: Promise<void> | undefined;

export async function renderPng(svg: string): Promise<Uint8Array> {
  // One module instance per isolate; resvg rejects a second initialisation.
  wasmReady ??= initWasm(wasm).catch((error) => {
    // A warm isolate that already initialised the module is ready; anything else retries next time.
    if (/already initiali[sz]ed/i.test(String(error))) return;
    wasmReady = undefined;
    throw error;
  });
  await wasmReady;
  const renderer = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: {
      loadSystemFonts: false,
      fontBuffers: [new Uint8Array(interFont), new Uint8Array(jetBrainsMonoFont)],
      defaultFontFamily: 'Inter',
      sansSerifFamily: 'Inter',
      monospaceFamily: 'JetBrains Mono Variable',
    },
  });
  const png = renderer.render().asPng();
  renderer.free();
  return png;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

/** Fetch with a deadline. Resolves null on timeout or error instead of throwing. */
export async function fetchSoft(input: string | URL, init: RequestInit = {}, ms = 2500): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res.ok ? res : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function jsonSoft<T = unknown>(input: string | URL, ms = 2500): Promise<T | null> {
  const res = await fetchSoft(input, { headers: { accept: 'application/json' } }, ms);
  if (!res) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** An image as a data: URI, or '' when it is missing, slow, or over 1.5 MB. */
export async function imageDataUri(input: string | URL, ms = 2500): Promise<string> {
  const res = await fetchSoft(input, {}, ms);
  if (!res) return '';
  const type = res.headers.get('content-type')?.split(';', 1)[0] || 'image/png';
  if (!/^image\//.test(type)) return '';
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > 1_500_000) return '';
  return `data:${type};base64,${bytesToBase64(bytes)}`;
}

type CounterEnv = { AUTH_DB?: D1Database };
let counterReady: Promise<unknown> | undefined;

/**
 * Count one card drawn (an edge-cache miss) and return the running total —
 * the "UNFURL #N" stamp — or 0 when D1 is absent or slow, which hides the
 * stamp. `IF NOT EXISTS` keeps this out of the migration ledger.
 */
export async function bumpUnfurlCounter(env: CounterEnv, key = 'all'): Promise<number> {
  const db = env.AUTH_DB;
  if (!db) return 0;
  try {
    counterReady ??= db.prepare('CREATE TABLE IF NOT EXISTS unfurl_counts (key TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0, updated_at TEXT)').run();
    await counterReady;
    const work = db.prepare(
      "INSERT INTO unfurl_counts (key, n, updated_at) VALUES (?1, 1, datetime('now')) ON CONFLICT(key) DO UPDATE SET n = n + 1, updated_at = datetime('now') RETURNING n",
    ).bind(key).first<{ n: number }>();
    const row = await Promise.race([work, new Promise<null>((r) => setTimeout(() => r(null), 800))]);
    return Number(row?.n) || 0;
  } catch {
    counterReady = undefined;
    return 0;
  }
}

export function pngResponse(png: Uint8Array, maxAge: number, extra: Record<string, string> = {}): Response {
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      'Access-Control-Allow-Origin': '*',
      ...extra,
    },
  });
}

export function fallback(request: Request, reason: string, path = FALLBACK_CARD): Response {
  const res = Response.redirect(new URL(path, request.url).toString(), 302);
  const headers = new Headers(res.headers);
  headers.set('X-PointCast-Card', `fallback:${reason}`);
  headers.set('Cache-Control', 'public, max-age=60');
  return new Response(null, { status: 302, headers });
}

/** Serve from the edge cache, or build, store, and serve. HEAD shares the same entry. */
export async function cached(
  request: Request,
  cacheKey: string,
  waitUntil: (p: Promise<unknown>) => void,
  build: () => Promise<Response>,
): Promise<Response> {
  const cache = (caches as unknown as { default: Cache }).default;
  const key = new Request(cacheKey, { method: 'GET' });
  const hit = await cache.match(key).catch(() => undefined);
  const res = hit ?? await build();
  if (!hit && res.status === 200) waitUntil(cache.put(key, res.clone()).catch(() => {}));
  if (request.method === 'HEAD') return new Response(null, { status: res.status, headers: res.headers });
  return res;
}
