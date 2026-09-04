import {
  loadPaidIntent,
  PAID_ACTION_HEADERS,
  paidIntentJson,
  publicPaidIntent,
} from '../../_lib/paid-town-actions.ts';

type ActionsEnv = Cloudflare.Env & { AUTH_DB?: D1Database };

export const onRequestOptions = async () => new Response(null, {
  status: 204,
  headers: PAID_ACTION_HEADERS,
});

export const onRequestGet: PagesFunction<ActionsEnv> = async ({ env, params }) => {
  if (!env.AUTH_DB) {
    return new Response(JSON.stringify({ ok: false, error: 'action-intents-unavailable' }), {
      status: 503,
      headers: PAID_ACTION_HEADERS,
    });
  }
  const id = typeof params.id === 'string' ? params.id : '';
  if (!/^pai_[0-9a-f]{32}$/u.test(id)) {
    return new Response(JSON.stringify({ ok: false, error: 'action-not-found' }), {
      status: 404,
      headers: PAID_ACTION_HEADERS,
    });
  }
  const intent = await loadPaidIntent(env.AUTH_DB, id);
  if (!intent) {
    return paidIntentJson(id, { ok: false, error: 'action-not-found' }, 404);
  }
  return paidIntentJson(id, { ok: true, ...publicPaidIntent(intent) });
};
