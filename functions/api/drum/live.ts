/**
 * /api/drum/live — who is drumming right now.
 *
 * "Here" on the drum means a beat reached the DrumCounter in the last two
 * minutes, from any /drum* room, embed, artifact, or agent. The site-wide
 * /api/visit presence only sees pages that run the visit widget, which is why
 * the drum used to report an empty room while people were playing.
 *
 * GET /api/drum/live
 *   → { windowSeconds, count, drummers: [{ hash, nounId, lastAt }],
 *       sources: [{ kind, app, beats, lastAt }], globalTotal, recovered }
 */

interface Env {
  DRUM_COUNTER?: DurableObjectNamespace;
}

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DRUM_COUNTER) {
    return new Response(JSON.stringify({ ok: false, reason: 'counter-unavailable' }), { status: 503, headers: HEADERS });
  }
  try {
    const stub = env.DRUM_COUNTER.get(env.DRUM_COUNTER.idFromName('global'));
    const response = await stub.fetch('https://drum-counter.internal/?live=1');
    return new Response(response.body, { status: response.status, headers: HEADERS });
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'counter-unavailable' }), { status: 503, headers: HEADERS });
  }
};
