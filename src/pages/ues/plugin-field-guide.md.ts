import type { APIRoute } from 'astro';
import guide from '../../data/plugin-field-guide.json';
import { guideMarkdown } from '../../lib/plugin-field-guide.mjs';

export const GET: APIRoute = () => new Response(guideMarkdown(guide), {
  headers: {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Content-Disposition': 'attachment; filename="plugin-field-guide.md"',
    'X-Robots-Tag': 'noindex, nofollow',
  },
});
