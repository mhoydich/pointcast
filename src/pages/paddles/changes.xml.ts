// RSS for the register's changes feed: what was added, corrected, cut,
// approved or delisted, so enthusiasts and agents can subscribe to the record.
import type { APIRoute } from 'astro';
import { CHANGES, CHANGE_WORDS, PADDLE_REGISTER_URL, paddleById } from '../../lib/paddle-register';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = () => {
  const items = CHANGES.slice(0, 100).map((c, i) => {
    const p = c.paddle ? paddleById(c.paddle) : undefined;
    const link = p ? `${PADDLE_REGISTER_URL}/${p.id}` : `${PADDLE_REGISTER_URL}/changes`;
    const title = `${CHANGE_WORDS[c.kind] ?? c.kind}: ${p ? `${p.brand} ${p.model}` : 'the register'}`;
    return `<item><title>${esc(title)}</title><link>${esc(link)}</link><guid isPermaLink="false">${esc(`paddles-change-${c.date}-${i}`)}</guid><pubDate>${new Date(`${c.date}T12:00:00Z`).toUTCString()}</pubDate><description>${esc(c.text + (c.source ? ` Source: ${c.source}` : ''))}</description></item>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>The Paddle Register: changes</title><link>${PADDLE_REGISTER_URL}/changes</link><description>Corrections, price cuts, approvals, delistings and additions to PointCast's paddle register, each with a source.</description><language>en-us</language>${items.join('')}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
};
