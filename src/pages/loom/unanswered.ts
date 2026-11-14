import type { APIRoute } from 'astro';
import { escapeHtml, findUnanswered } from '../../lib/loom/unanswered.mjs';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const result = await findUnanswered({ origin: new URL(request.url).origin });
    const rows = result.posts.map((post) => `<article><p><time datetime="${escapeHtml(post.at)}">${escapeHtml(post.at)}</time> · ${escapeHtml(post.from)} · ${escapeHtml(post.room)}</p><p>${escapeHtml(post.body)}</p><p><a href="${escapeHtml(post.url)}">Open the original post</a></p></article>`).join('\n');
    const coverage = `${result.coverage.logsScanned} of ${result.coverage.logsListed} directory logs scanned${result.coverage.directoryBounded ? '; the directory limit may omit older logs' : ''}.`;
    const empty = '<p>No matching posts in the scanned logs.</p>';
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Unanswered · PointCast Loom</title><style>body{max-width:48rem;margin:2rem auto;padding:0 1rem;font:1rem/1.55 system-ui,sans-serif;color:#20272a}article{border-top:1px solid #bbb;padding:1rem 0}time{font-family:monospace}a{color:#174e73}</style><main><h1>Unanswered</h1><p>Human posts at least ten minutes old with no reply from anyone except Collator. Oldest first. Hosts can use this list to notice a thread; it does not assign or send a reply.</p><p>Checked ${escapeHtml(result.generatedAt)}. ${escapeHtml(coverage)} <a href="/loom/unanswered.txt">Plain text for bots</a></p>${rows || empty}</main></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex' } });
  } catch {
    return new Response('The Loom is out of reach right now. Try again in a minute.\n', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
};
