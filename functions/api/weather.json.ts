/**
 * functions/api/weather.json.ts — agent-friendly alias of /api/weather.
 *
 * Returns the rich El Segundo payload (no params accepted). Exists because
 * PointCast's agent surfaces follow the convention that machine-readable
 * twins of human routes live at `*.json`. Delegates to the same handler so
 * caching and shape stay in lockstep.
 */
import { onRequest as weatherOnRequest } from './weather';

export const onRequest: PagesFunction = async (ctx) => {
  // Strip any query params so the handler takes the rich-El-Segundo path
  // even if a caller pastes /api/weather.json?station=foo by mistake.
  const url = new URL(ctx.request.url);
  url.search = '';
  const cleanRequest = new Request(url.toString(), {
    method: ctx.request.method,
    headers: ctx.request.headers,
  });
  return weatherOnRequest({ ...ctx, request: cleanRequest });
};
