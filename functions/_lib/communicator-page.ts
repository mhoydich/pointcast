/**
 * The /c/r/<token> reply page (docs/prd/communicator-v1.md 4.5): plain HTML, no JavaScript, works from any
 * mail client. GET shows the message and one form button per chip (a prefetching mail scanner that GETs
 * the link changes nothing); POST applies the answer through the same logic as /reply. It renders message
 * text and a game status only, never anyone's contact details.
 */
import { applyReply, lookupToken, type FlowCtx } from './communicator-flow.ts';
import { actionableChips } from './communicator-deliver.ts';

const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CSS = `:root{color-scheme:light dark;--bg:#fff;--fg:#1a1a1a;--mute:#555;--line:#d5d5d5;--btn:#0b5fff;--btnfg:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#121212;--fg:#f0f0f0;--mute:#b0b0b0;--line:#3a3a3a;--btn:#6aa0ff;--btnfg:#0a0a0a}}
*{box-sizing:border-box}body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}
main{max-width:30rem;margin:0 auto}h1{font-size:1.25rem;margin:0 0 12px}p{margin:0 0 16px}.mute{color:var(--mute);font-size:.9rem}
form{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}button{min-height:44px;min-width:44px;padding:0 16px;font:inherit;border:1px solid var(--line);border-radius:8px;background:transparent;color:var(--fg);cursor:pointer}
button.pick{background:var(--btn);color:var(--btnfg);border-color:var(--btn)}a{color:var(--btn)}li{margin:0 0 8px}`;

const HEADERS = {
  'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'",
};
const html = (title: string, inner: string, status = 200) => new Response(
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title><style>${CSS}</style></head><body><main>${inner}</main></body></html>`,
  { status, headers: HEADERS },
);
const GAME_LINK = '<p><a href="/communicator/">Open the Communicator</a></p>';

export async function replyPage(c: FlowCtx, token: string): Promise<Response> {
  if (!c.env.AUTH_DB) return html('Unavailable', '<h1>Not available right now</h1><p>Try the link again in a little while.</p>', 503);
  const url = new URL(c.request.url);
  const now = new Date(c.now ?? Date.now()).toISOString();

  if (c.request.method === 'POST') {
    const o = c.request.headers.get('Origin');
    if (o && o !== url.origin) return html('Not allowed', '<h1>Not allowed</h1>', 403);
    let a: string | null = url.searchParams.get('a');
    try { const f = await c.request.formData(); a = (f.get('a') as string | null) ?? a; } catch { /* no form body: keep ?a= */ }
    const r = await applyReply(c, token, a);
    if (r.status === 200) {
      const b = r.body;
      const next = (b.next as { text: string; chips: string[] }[]).length
        ? `<p>Still waiting on you:</p><ul>${(b.next as { text: string; chips: string[] }[]).map((n) => `<li>${esc(n.text)} <span class="mute">(${n.chips.map(esc).join(' / ')}; use the link in your email)</span></li>`).join('')}</ul>`
        : '';
      return html('Got it', `<h1>Got it: ${esc(cap(String(b.answered)))}</h1><p>The game is now <strong>${esc(b.status)}</strong>.</p>${next}${GAME_LINK}`);
    }
    return failPage(r.body.reason, r.status);
  }

  const m = await lookupToken(c.env.AUTH_DB, token, now);
  if (m.state !== 'ok') return failPage(m.state === 'used' ? 'already-used' : m.state === 'expired' ? 'expired' : 'bad-token', m.state === 'used' ? 409 : m.state === 'expired' ? 410 : 404);
  const chips = actionableChips(m.row.kind, m.row.replies);
  const want = url.searchParams.get('a');
  const form = chips.length
    ? `<form method="post" action="/c/r/${encodeURIComponent(token)}">${chips.map((ch) => `<button type="submit" name="a" value="${esc(ch)}"${ch === want ? ' class="pick"' : ''}>${esc(cap(ch))}</button>`).join('')}</form>`
    : '<p class="mute">Nothing to answer here.</p>';
  return html('Your reply', `<h1>PointCast Communicator</h1><p>${esc(m.row.text)}</p>${form}<p class="mute">This link works once.</p>${GAME_LINK}`);
}

function failPage(reason: string, status: number): Response {
  if (reason === 'already-used') return html('Link used', `<h1>This link was already used</h1><p>Your answer is in. Nothing more to do here.</p>${GAME_LINK}`, 409);
  if (reason === 'expired') return html('Link expired', `<h1>This link has expired</h1><p>Reply links last 72 hours.</p>${GAME_LINK}`, 410);
  if (reason === 'bad-state') return html('Cannot apply', `<h1>That cannot be applied now</h1><p>The game has moved on.</p>${GAME_LINK}`, 409);
  if (reason === 'bad-answer') return html('Not an option', `<h1>That is not an option here</h1>${GAME_LINK}`, 400);
  return html('Link not found', `<h1>We could not find that link</h1><p>Check that the whole link was copied.</p>${GAME_LINK}`, status === 404 ? 404 : status);
}
