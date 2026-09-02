import { authJson } from '../../auth/session.ts';
import type { CollectEnv } from '../../collect/_shared.ts';

interface StatusEnv extends CollectEnv {
  PRESENCE?: DurableObjectNamespace;
}

export const onRequestGet: PagesFunction<StatusEnv> = async ({ env }) => authJson({
  ok: true,
  configured: Boolean(env.AUTH_DB && env.SEND_EMAIL),
  bindings: {
    authDb: Boolean(env.AUTH_DB),
    email: Boolean(env.SEND_EMAIL),
    presence: Boolean(env.PRESENCE),
  },
  cron: '0 7 * * *',
  timeZone: 'America/Los_Angeles',
  worker: 'pointcast-kennel-daily',
}, {
  headers: { 'Cache-Control': 'no-store' },
});

