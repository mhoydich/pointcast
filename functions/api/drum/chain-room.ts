/** Proxy to the standalone Worker so chain/genesis routing has one authority. */
interface Env { DRUM_ATTEST_WORKER?: Fetcher; }
export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DRUM_ATTEST_WORKER) return Response.json({ error: 'attestor-not-configured' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  try { return await env.DRUM_ATTEST_WORKER.fetch(request); }
  catch { return Response.json({ error: 'attestor-unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
};
