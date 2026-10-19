// pointcast-morning-daily: the Morning Edition by email.
// Spec: docs/plans/2026-10-18-field-reports-v2-paper-spec.md §6.3.
//
// Crons: 45 13 * * * and 45 14 * * *. 6:45 AM in El Segundo is one of them,
// whichever side of the November change it is on; runMorningDaily sends in the
// 6 AM LA hour, and a later tick the same LA day only finishes a run that was
// cut short or left failed sends. The edition goes first, then the confirm
// sweep, both on one deadline under the 15-minute invocation limit.
//
// POST /send-confirm (the Pages signup route asks for a confirm mail) and
// POST /run (a resident re-run, a dry run by default) sit behind
// X-Morning-Key = MORNING_INTERNAL_KEY. Nothing here echoes an email address.
// @ts-ignore — plain module shared with the Pages routes and the tests
import { normalizeEmail, timingSafeEqual } from '../../../functions/_lib/edition-mail.mjs';
import { RUN_BUDGET_MS, runMorningDaily, safeError, sendConfirm, status, sweepConfirms, type Env } from './run';

export type { Env };

const MAX_BODY_BYTES = 2000;

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function log(event: Record<string, unknown>): void {
  console.log(JSON.stringify(event));
}

/** null when the request may proceed; otherwise the refusal to return. 503 unset, 403 wrong. */
function keyRefusal(request: Request, env: Env): Response | null {
  if (!env.MORNING_INTERNAL_KEY) return json({ ok: false, reason: 'internal-key-unset' }, 503);
  const presented = request.headers.get('X-Morning-Key') || '';
  if (!presented || !timingSafeEqual(presented, env.MORNING_INTERNAL_KEY)) return json({ ok: false, reason: 'bad-key' }, 403);
  return null;
}

/** The body as parsed JSON: {value} on success, {tooLarge} past the cap, {invalid} otherwise. */
async function readBody(request: Request): Promise<{ value: unknown } | { tooLarge: true } | { invalid: true }> {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return { tooLarge: true };
  try {
    return { value: JSON.parse(text) };
  } catch {
    return { invalid: true };
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/status')) {
      return status(env);
    }

    if (request.method === 'POST' && url.pathname === '/send-confirm') {
      const refusal = keyRefusal(request, env);
      if (refusal) return refusal;
      const body = await readBody(request);
      if ('tooLarge' in body) return json({ ok: false, reason: 'body-too-large' }, 413);
      if ('invalid' in body) return json({ ok: false, reason: 'bad-json' }, 400);
      const raw = body.value && typeof body.value === 'object' ? (body.value as Record<string, unknown>).email : null;
      const email = normalizeEmail(raw) as string | null;
      if (!email) return json({ ok: false, reason: 'invalid-email' }, 400);
      const result = await sendConfirm(env, email, { now: Date.now() });
      if (result.reason === 'email-not-configured') return json({ ok: false, reason: result.reason }, 503);
      if (result.reason === 'send-failed') return json({ ok: false, reason: result.reason }, 502);
      if (result.sent) return json({ ok: true, sent: true }, 202);
      return json({ ok: true, sent: false, reason: result.reason });
    }

    if (request.method === 'POST' && url.pathname === '/run') {
      const refusal = keyRefusal(request, env);
      if (refusal) return refusal;
      let dryRun = true;
      const body = await readBody(request);
      if ('value' in body && body.value && typeof body.value === 'object' && (body.value as Record<string, unknown>).dryRun === false) dryRun = false;
      const result = await runMorningDaily(env, { now: Date.now(), dryRun, force: true });
      return json(result);
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(controller, env): Promise<void> {
    const now = controller.scheduledTime;
    const deadline = Date.now() + RUN_BUDGET_MS;
    try {
      await runMorningDaily(env, { now, deadline });
    } catch (error) {
      console.error(JSON.stringify({ message: 'morning daily failed', error: safeError(error) }));
    }
    try {
      await sweepConfirms(env, { now, deadline });
    } catch (error) {
      console.error(JSON.stringify({ message: 'morning confirm sweep failed', error: safeError(error) }));
    }
  },
} satisfies ExportedHandler<Env>;
