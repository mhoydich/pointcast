/**
 * GET /api/the-desk — The Desk's public broadcast: positions, P&L by agent and
 * venue, the trade log (sealed reasoning revealed only after settlement),
 * fills, halts and kills. Read-only; only the pointcast-the-desk Worker writes.
 */
import rawConfig from '../../src/data/the-desk.json';
import { configHash, loadConfig } from '../_lib/the-desk/config.mjs';
import { deskBroadcast } from '../_lib/the-desk/public.mjs';
import { deskStore } from '../_lib/the-desk/store.mjs';

interface Env {
  AUTH_DB?: D1Database;
}

const config = loadConfig(rawConfig);

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8' };
  if (!env.AUTH_DB) return new Response(JSON.stringify({ ok: false, reason: 'unavailable' }), { status: 503, headers });
  try {
    const payload = await deskBroadcast({ config, configHash: await configHash(config), store: deskStore(env.AUTH_DB) });
    return new Response(JSON.stringify(payload), { headers });
  } catch {
    // Before migration 0029 runs, the tables do not exist yet.
    return new Response(JSON.stringify({ ok: false, reason: 'not-started' }), { status: 503, headers });
  }
};
