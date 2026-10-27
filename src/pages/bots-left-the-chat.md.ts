import type { APIRoute } from 'astro';
import content from '../content/guides/bots-left-the-chat.md?raw';
import { botsArticle as article, botsSources } from '../lib/bots-left-the-chat';

export const GET: APIRoute = () => new Response(`# ${article.title}\n\n${article.subtitle}\n\nPointCast · October 27, 2026 · Directed by ${article.director} · Written and researched with ${article.author}\n\n${article.url}\n\n${content}\n\n## Sources\n\nChecked ${article.checked}.\n\n${botsSources.map((source) => `- [${source.name}](${source.url}) — ${source.note}`).join('\n')}\n`, {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
});
