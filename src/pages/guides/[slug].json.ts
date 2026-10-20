import type { APIRoute, GetStaticPaths } from 'astro';
import { GUIDES, guideBySlug, guideJson } from '../../data/guides';

export const getStaticPaths: GetStaticPaths = () => GUIDES.map((g) => ({ params: { slug: g.slug } }));

export const GET: APIRoute = ({ params }) => {
  const guide = guideBySlug(String(params.slug));
  if (!guide) return new Response('Not found', { status: 404 });
  return new Response(JSON.stringify(guideJson(guide), null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
  });
};
