/**
 * /api/morning/confirm?t=<token> — the link in the confirmation email
 * (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §5.3).
 *
 * GET shows a page with one POST button and changes nothing, so a mail
 * scanner that fetches the link confirms nobody (the same pattern as
 * /api/morning/unsubscribe). POST confirms and answers 303 to
 * /morning?paper=confirmed|expired|invalid|unavailable#paper. A link used
 * before answers confirmed while its row is still confirmed. No account is
 * created and nothing about the address is returned.
 */
import type { AuthEnv } from '../auth/session.ts';
import { confirmByHash, confirmForm, validToken } from '../../_lib/morning-mail-store.ts';
// @ts-ignore — plain module shared with the Worker and the tests
import { sha256Hex } from '../../_lib/edition-mail.mjs';

const back = (paper: string, status = 303) => new Response(null, {
  status,
  headers: {
    Location: `/morning?paper=${paper}#paper`,
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
  },
});

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request }) => {
  const raw = new URL(request.url).searchParams.get('t') ?? '';
  if (!validToken(raw)) return back('invalid', 302);
  return confirmForm(raw);
};

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  const raw = new URL(request.url).searchParams.get('t') ?? '';
  if (!validToken(raw)) return back('invalid');
  if (!env.AUTH_DB) return back('unavailable');
  try {
    const outcome = await confirmByHash(env.AUTH_DB, await sha256Hex(raw), Date.now());
    return back(outcome === 'expired' ? 'expired' : 'confirmed');
  } catch {
    return back('unavailable');
  }
};
