import { resolveNowPlaying, type SpotifyBroadcastEnv } from './api/spotify/_broadcast';

export const onRequestGet: PagesFunction<SpotifyBroadcastEnv> = async (context) => {
  const staticResponse = await context.next();
  if (!staticResponse.ok) return staticResponse;

  try {
    const contentLength = Number(staticResponse.headers.get('content-length') ?? '0');
    if (contentLength > 1_000_000) return staticResponse;
    const [feed, nowPlaying] = await Promise.all([
      staticResponse.clone().json() as Promise<Record<string, unknown>>,
      resolveNowPlaying(context.env),
    ]);
    const headers = new Headers(staticResponse.headers);
    headers.set('Content-Type', 'application/json; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    headers.set('Access-Control-Allow-Origin', '*');
    return new Response(JSON.stringify({ ...feed, nowPlaying }, null, 2), {
      status: staticResponse.status,
      headers,
    });
  } catch {
    return staticResponse;
  }
};
