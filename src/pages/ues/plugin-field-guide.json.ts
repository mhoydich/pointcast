import type { APIRoute } from 'astro';
import guide from '../../data/plugin-field-guide.json';

export const GET: APIRoute = () => new Response(JSON.stringify({
  kind: 'educational-field-guide',
  publicationStatus: 'draft-review-required',
  author: 'codex',
  featureActivation: false,
  ...guide,
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Robots-Tag': 'noindex, nofollow',
  },
});
