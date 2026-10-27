import type { APIRoute } from 'astro';
import content from '../content/guides/bots-left-the-chat.md?raw';
import { botsArticle, botsSources } from '../lib/bots-left-the-chat';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...botsArticle,
  block: `https://pointcast.xyz/b/${botsArticle.block}`,
  contentFormat: 'text/markdown',
  content,
  sources: botsSources,
  illustrations: ['atelier-hero', 'quiet-morning', 'connected-studios'].map((name) => ({
    url: `https://pointcast.xyz/images/bots-left-the-chat/${name}.webp`,
    width: 1672,
    height: 941,
    credit: 'AI-generated editorial art',
  })),
}, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
