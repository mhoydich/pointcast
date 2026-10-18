/**
 * GET /api/morning/confirm?t=<token> — the link in the confirmation email
 * (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §5.3). Always a 302 to
 * /morning?paper=confirmed|expired|invalid|unavailable#paper. No account is
 * created and nothing about the address is returned.
 */
import type { AuthEnv } from '../auth/session.ts';
import { confirmByHash, validToken } from '../../_lib/morning-mail-store.ts';
// @ts-ignore — plain module shared with the Worker and the tests
import { sha256Hex } from '../../_lib/edition-mail.mjs';

const back = (paper: string) => new Response(null, {
  status: 302,
  headers: {
    Location: `/morning?paper=${paper}#paper`,
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  },
});

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  const raw = new URL(request.url).searchParams.get('t') ?? '';
  if (!validToken(raw)) return back('invalid');
  if (!env.AUTH_DB) return back('unavailable');
  try {
    return back((await confirmByHash(env.AUTH_DB, await sha256Hex(raw), Date.now())) ? 'confirmed' : 'expired');
  } catch {
    return back('unavailable');
  }
};
