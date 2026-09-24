import { CODE_TTL_SECONDS, ISSUER, KNOWN_APPS, SCOPES } from '../../functions/_lib/pointcast-connect.ts';

/** Sign in with PointCast, described as data for agents and builders. */
export const CONNECT_BRIEF = {
  spec: 'pointcast.connect/v1',
  title: 'Sign in with PointCast',
  canonical: 'https://pointcast.xyz/connect',
  json: 'https://pointcast.xyz/connect.json',
  summary: 'A login for the small web that does not track people. Any site adds a button with one script tag and nothing to register. The person sees exactly what the site gets and says yes. The site receives a one-time code and trades it for a snapshot of the person\'s town card. Each site gets a different id for the same person, and no site keeps ongoing access.',
  promises: [
    'Nothing to register: a site\'s origin (scheme + host + port) is its client id.',
    'Consent is itemized: the town card always, the Tezos wallet only when the site asks, shown as the exact address.',
    `One-time codes: single use, ${CODE_TTL_SECONDS} seconds, delivered only to the requesting origin (postMessage targetOrigin or a redirect on that origin), redeemable only by that origin or a server naming it.`,
    'Pairwise ids: sub is stable per origin and unrelated across origins.',
    'No ongoing access: there is no access token, no refresh token and no API to call later. Ask again to hear from the person again.',
  ],
  issuer: ISSUER,
  sdk: {
    script: 'https://pointcast.xyz/connect.js',
    button: '<button data-pointcast-connect data-scope="card">Continue with PointCast</button> → listen for the pointcast:connected event (detail = identity) or pointcast:error.',
    call: 'await PointCast.connect({ scope: ["card", "wallet"], mode?: "popup" | "redirect", exchange?: false, redirectUri? })',
    redirect: 'In redirect mode PointCast returns to your page with pc_code and pc_state (or pc_error). connect.js handles this on load and fires pointcast:connected.',
  },
  protocol: {
    consent: 'GET https://pointcast.xyz/connect?client={origin}&scope={card|card wallet}&state={yours}&mode={popup|redirect}&redirect_uri={url on your origin, redirect mode only}',
    popupMessage: '{ type: "pointcast:connect", state, code } or { type: "pointcast:connect", state, error: "denied" }, posted to your origin only.',
    token: 'POST https://pointcast.xyz/api/connect/token, application/json { code, client } → { ok, iss, aud, sub, scope, card, wallet?, approvedAt, issuedAt, access: "none-ongoing" }. CORS open. If an Origin header is sent it must equal client.',
    scopes: SCOPES,
    card: '{ handle, name, noun (noun.pics seed), bio, now, place, song (open.spotify.com), links [{label,url}] ≤3, color, wallet ("" unless the person chose to show one), onchain ({contract, tokenId, owner} when the handle is a Tezos profile object they hold) | null, url, avatar } or null when the person has no card.',
    errors: 'invalid-client · invalid-code (unknown, used, expired, or issued to another site; a code presented by the wrong site is burned) · origin-mismatch (403).',
  },
  trust: 'An identity traded in the browser is as trustworthy as the browser. For server-side trust call PointCast.connect({ exchange: false }), send the code to your server, and trade it there.',
  knownApps: Object.entries(KNOWN_APPS).map(([origin, app]) => ({ origin, ...app, meaning: 'Shown by name with a "known to PointCast" note. Grants nothing extra.' })),
  cards: {
    api: 'GET https://pointcast.xyz/api/card?handle={handle} → { ok, card } (public, CORS open). Members edit their own card on https://pointcast.xyz/shortwave#card.',
    handles: '3–24 of a–z, 0–9, hyphen (the on-chain profile contract rules). A handle held as a Tezos profile object can only be used by the account with the holding wallet linked.',
    shortwave: 'Posts by a signed-in member with a card carry verified: true, handle and the card\'s name and Noun from the account. GET https://pointcast.xyz/api/shortwave?handle={handle} lists them.',
  },
};

export const GET = () => new Response(JSON.stringify(CONNECT_BRIEF, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
