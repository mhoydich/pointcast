/**
 * /api/frame/drum — Farcaster Frame v1 POST handler for /drum.
 *
 * When a Warpcast user taps the "Tap the drum" button on a cast embedding
 * pointcast.xyz/drum, Warpcast POSTs here with the tap event. We:
 *   1. Validate the request shape (at minimum — signature verification is
 *      deferred until we wire a Neynar key; see note below).
 *   2. Bump the global drum counter in KV (same `drum:total` key used by
 *      the main site) so Warpcast taps contribute to the collective.
 *   3. Return Frame HTML with updated meta tags so Warpcast renders the
 *      next-state image + same "Tap" button again.
 *
 * Signature verification note:
 *   Real validation requires a call to Neynar's /v2/farcaster/frame/validate
 *   or local ed25519 verification against the Farcaster hub. For now we
 *   accept untrustedData as-authoritative — fine for a rate-limited,
 *   non-payable drum counter (the worst case is a bot spamming the count,
 *   which already exists on-site). Swap in Neynar validation once Mike
 *   has a NEYNAR_API_KEY secret set.
 *
 * Targeted spec: Farcaster Frames v1 (in-feed static frames). Frames v2
 * renamed to "Mini Apps" in March 2025; Mini Apps require a full React
 * web target and a .well-known/farcaster.json manifest — overkill for a
 * single-tap drum. v1 is still universally supported in Warpcast.
 */

export interface Env {
  VISITS?: KVNamespace;
}

const JSON_HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

const DRUM_COUNT_KEY = 'drum:total';
const FRAME_TAP_RATE_PREFIX = 'frame:fid:';
const FRAME_RATE_LIMIT_SECONDS = 2;  // per-FID rate limit
const FRAME_MAX_PER_TAP = 10;         // cap per POST (Warpcast button tap = 1 drum burst)

async function loadCount(env: Env): Promise<number> {
  if (!env.VISITS) return 0;
  const raw = await env.VISITS.get(DRUM_COUNT_KEY);
  return raw ? Number(raw) || 0 : 0;
}

async function saveCount(env: Env, n: number): Promise<void> {
  if (!env.VISITS) return;
  await env.VISITS.put(DRUM_COUNT_KEY, String(n));
}

function frameHtml(count: number, fid?: number): string {
  const imageUrl = `https://pointcast.xyz/api/frame/drum-image?c=${count}&t=${Date.now()}`;
  // Frames v1: post_url is where the NEXT tap POSTs. Button label
  // includes the updated count so the CTA stays fresh.
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta property="og:title" content="PointCast Drum Room \u00b7 ${count.toLocaleString()} drums" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
    <meta property="fc:frame:button:1" content="\u{1F941} Drum along (${count.toLocaleString()})" />
    <meta property="fc:frame:post_url" content="https://pointcast.xyz/api/frame/drum" />
    <meta property="fc:frame:button:2" content="Visit pointcast.xyz \u2197" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="https://pointcast.xyz/drum" />
  </head>
  <body>
    <p>PointCast Drum \u00b7 total ${count}</p>
  </body>
</html>`;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, reason: 'bad-body' }), {
      status: 400, headers: JSON_HEADERS,
    });
  }

  // Warpcast shape: { untrustedData: {fid, buttonIndex, url, ...}, trustedData: {messageBytes} }
  const untrusted = body?.untrustedData ?? {};
  const fid = typeof untrusted.fid === 'number' ? untrusted.fid : 0;
  const buttonIndex = typeof untrusted.buttonIndex === 'number' ? untrusted.buttonIndex : 1;

  // Rate-limit per-FID so a single user can't spam 100 drums per second
  // through the Frame. 2-second window per FID.
  if (env.VISITS && fid > 0) {
    const rlKey = `${FRAME_TAP_RATE_PREFIX}${fid}`;
    const existing = await env.VISITS.get(rlKey);
    if (existing) {
      // Rate-limited — don't bump count but DO return a valid Frame so
      // Warpcast doesn't error. Just the current state.
      const current = await loadCount(env);
      return new Response(frameHtml(current, fid), {
        status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    await env.VISITS.put(rlKey, '1', { expirationTtl: FRAME_RATE_LIMIT_SECONDS });
  }

  // Button 1 = "Drum along" (the tap action). Button 2 has action=link so
  // Warpcast handles it directly and never POSTs here.
  let nextCount = await loadCount(env);
  if (buttonIndex === 1) {
    nextCount += FRAME_MAX_PER_TAP;
    await saveCount(env, nextCount);
  }

  return new Response(frameHtml(nextCount, fid), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};

// GET fallback — Warpcast sometimes previews by issuing a GET before
// rendering. Return the same Frame HTML as the initial state.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const count = await loadCount(env);
  return new Response(frameHtml(count), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
