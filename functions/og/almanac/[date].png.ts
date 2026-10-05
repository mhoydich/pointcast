/**
 * /og/almanac/{date}.png — the share card for one Daily Almanac date.
 * The drawing uses the same lines as /almanac.json. A miss stays a miss.
 */
import { FALLBACK_CARD, renderPng } from '../../_lib/og-render';
// @ts-ignore — plain module shared with the tests
import { almanacResponse, cardSvg, isCardDate } from '../../_lib/almanac-card.mjs';
import { marineForCard } from '../../_lib/almanac-marine.ts';

type Env = { VISITS?: KVNamespace; ASSETS?: { fetch: (input: Request | URL | string) => Promise<Response> } };

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const date = String(params.date || '');
  if (!isCardDate(date)) return Response.redirect(new URL(FALLBACK_CARD, request.url).toString(), 302);
  try {
    const url = new URL(request.url);
    url.pathname = '/almanac.json';
    url.search = `?date=${date}`;
    const result = await almanacResponse(env, url.toString(), { marine: marineForCard });
    const png = await renderPng(cardSvg(result.body?.card));
    return new Response(png, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch {
    return Response.redirect(new URL(FALLBACK_CARD, request.url).toString(), 302);
  }
};
