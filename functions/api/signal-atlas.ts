import { readLegacySnapshot } from '../../public/signal-atlas/adapter.mjs';
type Env = { VISITS?: KVNamespace };

// Read-only projection of an existing binding. No additional writes or keys.
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const snapshot = await readLegacySnapshot(env);
  return new Response(JSON.stringify(snapshot), {
    status: snapshot.status === 'unavailable' ? 503 : 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
};
