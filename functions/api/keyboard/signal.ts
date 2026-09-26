/**
 * /api/keyboard/signal — the universal keyboard channel.
 *
 * The keyboard sibling of /api/drum/signal. Anything can play the PointCast
 * keyboard: a /keyboard* page, a site running /keyboard.js, a Claude
 * artifact, a script, an agent. Every note lands on one global counter,
 * tallied by source, and pitched notes build the town's chord of the day.
 *
 * POST /api/keyboard/signal
 *   body (JSON, or text/plain JSON so navigator.sendBeacon works):
 *     { notes?: number[] (MIDI 0-127, ≤64), count?: 0-200 unpitched keys,
 *       text?: string (≤64 letters, played as notes; the text is not stored),
 *       app?, kind?, place? }
 *   → { ok, globalTotal, notes, keys, source, id }
 *
 * GET /api/keyboard/signal              → summary + today's key estimate
 * GET /api/keyboard/signal?since=<id>   → { latestId, phrases } for live listening
 * GET /api/keyboard/signal?league=1[&week=YYYY-MM-DD] → weekly app standings
 */

import { estimateKey, requestCountry, resolveSource, textToNotes } from '../../_lib/keyboard-signal.ts';

interface Env {
  KEYBOARD_SIGNAL?: DurableObjectNamespace;
}

const MAX_BODY = 8_000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS, ...(init?.headers ?? {}) },
  });
}

function counter(env: Env, query: string, init: RequestInit): Promise<Response> | null {
  if (!env.KEYBOARD_SIGNAL) return null;
  const id = env.KEYBOARD_SIGNAL.idFromName('global');
  return env.KEYBOARD_SIGNAL.get(id).fetch(`https://keyboard-signal.internal/${query ? `?${query}` : ''}`, init);
}

const unavailable = () => json({ ok: false, reason: 'counter-unavailable' }, { status: 503 });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ ok: false, reason: 'too-large' }, { status: 413 });
  let body: { notes?: unknown; count?: unknown; text?: unknown; app?: unknown; kind?: unknown; place?: unknown; source?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, reason: 'bad-body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') return json({ ok: false, reason: 'bad-body' }, { status: 400 });

  let notes = Array.isArray(body.notes) ? body.notes : [];
  if (!notes.length && typeof body.text === 'string') notes = textToNotes(body.text);
  const count = typeof body.count === 'number' ? body.count : 0;
  if (!notes.length && !(count >= 1)) return json({ ok: false, reason: 'no-notes' }, { status: 400 });

  const declared = body.source && typeof body.source === 'object'
    ? body.source
    : { kind: body.kind, app: body.app, place: body.place };
  const source = resolveSource(request, declared, requestCountry(request));

  try {
    const pending = counter(env, '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, count, source }),
    });
    if (!pending) return unavailable();
    const response = await pending;
    return new Response(response.body, { status: response.status, headers: { 'Content-Type': 'application/json', ...CORS } });
  } catch {
    return unavailable();
  }
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const params = new URLSearchParams();
  const since = url.searchParams.get('since');
  if (since !== null && /^\d{1,15}$/.test(since)) params.set('since', since);
  else if (url.searchParams.get('league') === '1') {
    params.set('league', '1');
    const week = url.searchParams.get('week');
    if (week && /^\d{4}-\d{2}-\d{2}$/.test(week)) params.set('week', week);
  }
  try {
    const pending = counter(env, params.toString(), { method: 'GET' });
    if (!pending) return unavailable();
    const response = await pending;
    if (!response.ok || params.size) {
      return new Response(response.body, {
        status: response.status,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
      });
    }
    const summary = (await response.json()) as { pitchClasses?: unknown; today?: { pitchClasses?: unknown } };
    return json({
      ...summary,
      key: { today: estimateKey(summary.today?.pitchClasses), allTime: estimateKey(summary.pitchClasses) },
    });
  } catch {
    return unavailable();
  }
};

export const onRequestOptions: PagesFunction<Env> = () => new Response(null, { status: 204, headers: CORS });
