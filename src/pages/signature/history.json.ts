/**
 * /signature/history.json — the history page, as sections and source URLs.
 */
import type { APIRoute } from 'astro';
import { HISTORY } from '../../data/signature-history';
import { HISTORY_PATH, HONESTY, NOT_LEGAL, PATH } from '../../data/signature-studio';

export const GET: APIRoute = () => {
  const body = {
    surface: HISTORY_PATH,
    url: 'https://pointcast.xyz' + HISTORY_PATH + '/',
    studio: 'https://pointcast.xyz' + PATH + '/',
    disclaimer: NOT_LEGAL,
    honesty: HONESTY,
    sections: HISTORY.map((section) => ({
      id: section.id,
      title: section.title,
      paragraphs: section.paragraphs,
      sources: section.sources,
    })),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
