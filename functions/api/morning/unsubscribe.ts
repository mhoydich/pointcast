/**
 * /api/morning/unsubscribe?t=<token> (docs/plans/2026-10-18-field-reports-v2-paper-spec.md §5.4).
 *
 * GET shows a page with one POST form and never changes a row, so a link
 * scanner cannot unsubscribe anyone. POST (that form, or a mail client's
 * RFC 8058 one-click, body List-Unsubscribe=One-Click, no Origin check)
 * unsubscribes and answers the same 200 page whether or not the token matched
 * a row, so it never says who is on the list.
 */
import type { AuthEnv } from '../auth/session.ts';
import { tokenExists, unsubscribeByToken, unsubscribeForm, unsubscribePage, validToken } from '../../_lib/morning-mail-store.ts';

const INVALID = 'That link is not valid.';
const DOWN = 'Email preferences are temporarily unavailable.';

export const onRequestGet: PagesFunction<AuthEnv> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get('t') ?? '';
  if (!validToken(token)) return unsubscribePage(INVALID, 400);
  if (!env.AUTH_DB) return unsubscribePage(DOWN, 503);
  try {
    if (!(await tokenExists(env.AUTH_DB, token))) return unsubscribePage(INVALID, 404);
  } catch {
    return unsubscribePage(DOWN, 503);
  }
  return unsubscribeForm(token);
};

export const onRequestPost: PagesFunction<AuthEnv> = async ({ request, env }) => {
  const token = new URL(request.url).searchParams.get('t') ?? '';
  if (!validToken(token)) return unsubscribePage(INVALID, 400);
  if (!env.AUTH_DB) return unsubscribePage(DOWN, 503);
  try {
    await unsubscribeByToken(env.AUTH_DB, token, Date.now());
  } catch {
    return unsubscribePage(DOWN, 503);
  }
  return unsubscribePage("You're unsubscribed from the Morning Edition.", 200);
};
