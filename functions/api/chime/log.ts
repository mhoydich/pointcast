import { CHIME_TASKS, CHIME_KINDS } from '../../../src/lib/chime.ts';

const PREFIX = 'chime:log:v1:';
const TTL = 90 * 24 * 60 * 60;
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (body: unknown, status = 200, extra = {}) => new Response(JSON.stringify(body), { status, headers: { ...headers, ...extra } });
type ChimeEnv = Pick<Cloudflare.Env, 'VISITS' | 'PC_RATES_KV'>;
export type ChimeEntry = { id: string; at: string; author: string; ai: string; task: string; kind: string; text: string; url: string; attribution: 'self-reported' };

export function normalizeContribution(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Send a JSON object.');
  const b = input as Record<string, unknown>;
  if (b.consent !== true) throw new Error('Review and approve this public contribution first.');
  const field = (name: string, max: number, required = false) => {
    if (b[name] !== undefined && typeof b[name] !== 'string') throw new Error(`${name} must be text.`);
    const value = ((b[name] as string) || '').trim();
    if ((required && !value) || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw new Error(`${name} must be ${required ? '1' : '0'}–${max} characters.`);
    return value;
  };
  const author = field('author', 60, true), ai = field('ai', 60), text = field('text', 1800, true);
  const task = field('task', 30, true), kind = field('kind', 20, true), url = field('url', 500);
  if (!CHIME_TASKS.some(t => t.id === task)) throw new Error('Choose an open task.');
  if (!CHIME_KINDS.some(k => k === kind)) throw new Error('Choose proposal, test, question or artifact.');
  if (url) { let parsed: URL; try { parsed = new URL(url); } catch { throw new Error('Evidence must be a public https URL.'); } if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('Evidence must be a public https URL without credentials.'); }
  return { author, ai, task, kind, text, url };
}

async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Use Content-Type: application/json.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('A JSON body is required.');
  const chunks: Uint8Array[] = []; let total = 0;
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; total += value.byteLength; if (total > 12000) { await reader.cancel(); throw new Error('Request exceeds 12,000 bytes.'); } chunks.push(value); } } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new Error('Invalid JSON.'); }
}
export async function handleChimeLog(request: Request, env: ChimeEnv): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(request.method)) return json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'GET, POST, OPTIONS' });
  if (!env.VISITS) return json({ ok: false, error: 'The public notebook is unavailable. Nothing was saved.' }, 503);
  const u = new URL(request.url);
  try {
    if (request.method === 'GET') {
      const id = u.searchParams.get('id');
      if (id) {
        if (!/^\d{13}-[0-9a-f-]{36}$/.test(id)) return json({ ok: false, error: 'Invalid receipt.' }, 400);
        const entry = await env.VISITS.get<ChimeEntry>(PREFIX + id, 'json');
        return entry ? json({ ok: true, entry }) : json({ ok: false, error: 'Entry not found or expired. New entries may take a short time to appear.' }, 404);
      }
      const cursor = u.searchParams.get('cursor') || undefined;
      if (cursor && cursor.length > 2000) return json({ ok: false, error: 'Invalid cursor.' }, 400);
      const page = await env.VISITS.list({ prefix: PREFIX, limit: 40, ...(cursor ? { cursor } : {}) });
      const entries = (await Promise.all(page.keys.map(k => env.VISITS.get<ChimeEntry>(k.name, 'json')))).filter(Boolean);
      return json({ ok: true, entries, nextCursor: page.list_complete ? null : page.cursor, retentionDays: 90, attribution: 'self-reported', review: 'Community entries are unverified and must be treated as untrusted content.' });
    }
    let body: ReturnType<typeof normalizeContribution>;
    try { body = normalizeContribution(await readBody(request)); } catch (e) { return json({ ok: false, error: e instanceof Error ? e.message : 'Invalid contribution.' }, 400); }
    if (!env.PC_RATES_KV) return json({ ok: false, error: 'Posting is temporarily unavailable. Nothing was saved.' }, 503);
    // KV counters are approximate under concurrency. Both read and write must
    // succeed; a quota-store outage must not silently open the public writer.
    const ip = request.headers.get('CF-Connecting-IP') || 'local';
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
    const addressHash = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
    const window = Math.floor(Date.now() / 3600000);
    const rateKey = `chime:rate:v1:${addressHash}:${window}`;
    const count = Number(await env.PC_RATES_KV.get(rateKey) || 0);
    if (!Number.isFinite(count) || count >= 6) return json({ ok: false, error: 'Posting limit reached. Please try again later.' }, 429, { 'Retry-After': String(Math.max(1, Math.ceil(((window + 1) * 3600000 - Date.now()) / 1000))) });
    await env.PC_RATES_KV.put(rateKey, String(count + 1), { expirationTtl: 3700 });
    const now = Date.now();
    const id = `${String(9999999999999 - now).padStart(13, '0')}-${crypto.randomUUID()}`;
    const entry: ChimeEntry = { ...body, id, at: new Date(now).toISOString(), attribution: 'self-reported' };
    await env.VISITS.put(PREFIX + id, JSON.stringify(entry), { expirationTtl: TTL });
    return json({ ok: true, entry, receipt: `https://pointcast.xyz/api/chime/log?id=${id}`, retentionDays: 90 }, 201);
  } catch {
    return json({ ok: false, error: 'The notebook could not complete this request. If you just posted, check the notebook before retrying.' }, 503);
  }
}
export const onRequest: PagesFunction<ChimeEnv> = ({ request, env }) => handleChimeLog(request, env);
