/**
 * /api/feedback-list — admin-only viewer for the feedback inbox.
 *
 * Token auth via ?token=<ADMIN_TOKEN>. The expected value is the
 * `ADMIN_TOKEN` Worker secret (set via `npx wrangler pages secret put`).
 * No token = 401; invalid token = 401; correct token = JSON payload.
 *
 * Lists up to 200 most-recent feedback entries with timestamps.
 */

import type { Env as VisitEnv } from './visit';

interface Env extends VisitEnv {
  ADMIN_TOKEN?: string;
}

const FEEDBACK_PREFIX = 'feedback:';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';

  // Constant-time-ish comparison — short-circuits still fine given the
  // attack surface, but we avoid the extra-early `!env.ADMIN_TOKEN` 401
  // leak ("token not set server-side" vs "wrong token").
  const expected = env.ADMIN_TOKEN ?? '';
  if (!expected || !token || token !== expected) {
    return new Response(
      JSON.stringify({ ok: false, reason: 'unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!env.VISITS) {
    return new Response(
      JSON.stringify({ ok: false, reason: 'kv-not-bound' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { keys } = await env.VISITS.list({ prefix: FEEDBACK_PREFIX, limit: 200 });
  // Keys are `feedback:<ts>:<rand>` — sort by key desc = newest first.
  const sorted = keys.sort((a, b) => (a.name < b.name ? 1 : -1));
  const values = await Promise.all(sorted.map((k) => env.VISITS!.get(k.name)));
  const entries = values
    .map((raw) => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } })
    .filter(Boolean);

  return new Response(
    JSON.stringify({ ok: true, count: entries.length, entries }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  );
};
