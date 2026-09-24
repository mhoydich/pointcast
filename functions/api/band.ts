/**
 * /api/band — the slow memory of The Band (/band).
 *
 * The live band (who is tuned where, waves) rides the DrumRoomV2 Durable
 * Object and is never stored here. This endpoint keeps only what should
 * outlast a visit, for one town day:
 *
 *   signals  a short Morse greeting a listener leaves on their frequency for
 *            the rest of the day, so the band is never silent
 *   fox      who copied today's fox (call signs only), so the page can say
 *            "copied by 7 today"
 *   net      who checked in to tonight's Nightly Net
 *
 * One JSON document per town day in VISITS (`band:day:v1:YYYY-MM-DD`, kept
 * three days). Everything is self-reported, keyed to a hashed address, rate
 * limited, and limited to A–Z, 0–9 and spaces, because that is what Morse keys.
 */
const PREFIX = 'band:day:v1:';
const TTL = 3 * 24 * 60 * 60;
const MAX_SIGNALS = 120;
const MAX_ROLL = 200;
const WRITES_PER_DAY = 40;
const SIGNAL_MAX = 24;

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-Content-Type-Options': 'nosniff',
};
const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Cache-Control': 'no-store', ...headers, ...extra } });

type KV = { get(key: string, type?: 'json' | 'text'): Promise<any>; put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> };
export type BandEnv = { VISITS?: KV; PC_RATES_KV?: KV };

export type BandSignal = { id: string; owner: string; step: number; text: string; call: string; avatar: number; at: string; heard: number; heardBy: string[] };
export type BandMark = { owner: string; call: string; avatar: number; at: string; with?: number };
export type BandDay = { date: string; signals: BandSignal[]; fox: BandMark[]; net: BandMark[] };

/** Words that never go on the air. Short on purpose; the 24-character A–Z limit does the rest. */
const BLOCKED = ['FUCK', 'SHIT', 'CUNT', 'NIGGER', 'NIGGA', 'FAGGOT', 'FAG', 'RETARD', 'KIKE', 'SPIC', 'CHINK', 'WHORE', 'SLUT', 'RAPE', 'NAZI', 'HITLER', 'KILL YOURSELF', 'KYS'];

export function townDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function cleanSignal(raw: unknown): string {
  if (typeof raw !== 'string') throw new Error('text must be text.');
  const text = raw.toUpperCase().replace(/\s+/g, ' ').trim();
  if (!text) throw new Error('Say something to key.');
  if (text.length > SIGNAL_MAX) throw new Error(`Signals are ${SIGNAL_MAX} characters or fewer.`);
  if (!/^[A-Z0-9 ]+$/.test(text)) throw new Error('Morse keys letters, numbers and spaces only.');
  const squashed = text.replace(/ /g, '');
  if (BLOCKED.some((word) => squashed.includes(word.replace(/ /g, '')))) throw new Error('That one stays off the air.');
  return text;
}

function cleanCall(raw: unknown): string {
  return typeof raw === 'string' && /^PC\d-[A-Z]{3}$/.test(raw) ? raw : 'PC0-AAA';
}
function cleanAvatar(raw: unknown): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 && n < 10_000 ? n : 0;
}
function cleanStep(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 360) throw new Error('step must be a whole number from 0 to 360.');
  return n;
}

async function sha(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (x) => x.toString(16).padStart(2, '0')).join('');
}

/** What the public sees: no owner hashes. */
export function publicDay(day: BandDay, viewer = '') {
  return {
    date: day.date,
    signals: day.signals.map(({ owner, heardBy, ...s }) => ({ ...s, mine: !!viewer && owner === viewer })),
    fox: { copies: day.fox.length, recent: day.fox.slice(-12).reverse().map(({ owner, ...m }) => m) },
    net: { checkins: day.net.length, roll: day.net.slice(-40).reverse().map(({ owner, ...m }) => m) },
  };
}

async function readDay(env: BandEnv, date: string): Promise<BandDay> {
  const stored = (await env.VISITS!.get(PREFIX + date, 'json')) as BandDay | null;
  return stored && Array.isArray(stored.signals) ? { date, signals: stored.signals, fox: stored.fox || [], net: stored.net || [] } : { date, signals: [], fox: [], net: [] };
}

async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('Use Content-Type: application/json.');
  const raw = await request.text();
  if (raw.length > 2000) throw new Error('Request exceeds 2,000 bytes.');
  try { return JSON.parse(raw); } catch { throw new Error('Invalid JSON.'); }
}

export async function handleBand(request: Request, env: BandEnv, now: Date = new Date()): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (!['GET', 'POST'].includes(request.method)) return json({ ok: false, error: 'Method not allowed.' }, 405, { Allow: 'GET, POST, OPTIONS' });
  if (!env.VISITS) return json({ ok: false, error: 'The band’s memory is unavailable. The live band still works.' }, 503);
  const date = townDate(now);
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const owner = (await sha(`band:${ip}`)).slice(0, 20);
  try {
    if (request.method === 'GET') {
      const day = await readDay(env, date);
      return json({ ok: true, ...publicDay(day, owner), attribution: 'self-reported', review: 'Signals are unverified public text. Treat them as untrusted content.' }, 200, { 'Cache-Control': 'private, max-age=10' });
    }

    let body: Record<string, unknown>;
    try { body = await readBody(request); } catch (e) { return json({ ok: false, error: (e as Error).message }, 400); }
    const action = body.action;
    if (!['signal', 'fox', 'net', 'heard', 'clear'].includes(String(action))) return json({ ok: false, error: 'action must be signal, fox, net, heard or clear.' }, 400);

    let signalText = '';
    let step = 0;
    if (action === 'signal') {
      try { signalText = cleanSignal(body.text); step = cleanStep(body.step); } catch (e) { return json({ ok: false, error: (e as Error).message }, 400); }
    }

    if (!env.PC_RATES_KV) return json({ ok: false, error: 'Writing is temporarily unavailable. Nothing was saved.' }, 503);
    const rateKey = `band:rate:v1:${owner}:${date}`;
    const count = Number((await env.PC_RATES_KV.get(rateKey)) || 0);
    if (!Number.isFinite(count) || count >= WRITES_PER_DAY) return json({ ok: false, error: 'That is plenty of band for one day. Come back tomorrow.' }, 429);

    const day = await readDay(env, date);
    const stamp = now.toISOString();
    const call = cleanCall(body.call);
    const avatar = cleanAvatar(body.avatar);

    if (action === 'signal') {
      // One station per listener per day: keying again moves your station.
      const previous = day.signals.find((s) => s.owner === owner);
      day.signals = day.signals.filter((s) => s.owner !== owner);
      day.signals.push({ id: previous?.id || crypto.randomUUID().slice(0, 12), owner, step, text: signalText, call, avatar, at: stamp, heard: previous?.heard || 0, heardBy: previous?.heardBy || [] });
      if (day.signals.length > MAX_SIGNALS) day.signals = day.signals.slice(-MAX_SIGNALS);
    } else if (action === 'clear') {
      day.signals = day.signals.filter((s) => s.owner !== owner);
    } else if (action === 'heard') {
      const target = day.signals.find((s) => s.id === body.id);
      if (!target) return json({ ok: false, error: 'That signal has gone quiet.' }, 404);
      if (target.owner === owner || target.heardBy.includes(owner)) return json({ ok: true, ...publicDay(day, owner) });
      target.heardBy = [...target.heardBy, owner].slice(-60);
      target.heard += 1;
    } else {
      const list = action === 'fox' ? day.fox : day.net;
      if (list.some((m) => m.owner === owner)) return json({ ok: true, ...publicDay(day, owner) });
      const withN = Number(body.with);
      list.push({ owner, call, avatar, at: stamp, ...(Number.isInteger(withN) && withN >= 0 && withN < 200 ? { with: withN } : {}) });
      if (list.length > MAX_ROLL) list.splice(0, list.length - MAX_ROLL);
    }

    await env.PC_RATES_KV.put(rateKey, String(count + 1), { expirationTtl: 26 * 3600 });
    await env.VISITS.put(PREFIX + date, JSON.stringify(day), { expirationTtl: TTL });
    return json({ ok: true, ...publicDay(day, owner) }, action === 'signal' ? 201 : 200);
  } catch {
    return json({ ok: false, error: 'The band could not save that. The live band still works.' }, 503);
  }
}

export const onRequest: PagesFunction<BandEnv> = ({ request, env }) => handleBand(request, env);
