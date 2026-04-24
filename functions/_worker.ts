/**
 * Cloudflare Pages Functions entry — module-worker form.
 *
 * Pages Functions normally uses per-route files (functions/api/*.ts).
 * This file exists so we can export a `scheduled()` handler for Cron
 * Triggers (Pages Functions doesn't auto-discover route-level cron
 * handlers yet). The Cron Trigger is configured in `wrangler.toml`:
 *
 *   [triggers]
 *   crons = ["*\/5 * * * *"]
 *
 * All HTTP traffic still flows through the per-route files — Pages's
 * router picks them up before this worker's default export runs.
 */

import { dispatchDueBroadcasts } from './lib/schedule-dispatcher';

export interface Env {
  PC_SCHEDULE_KV?: KVNamespace;
  PC_PING_KV?: KVNamespace;
  // ASSETS is the static-asset handler Pages injects. We call it through
  // for any non-function URL so the site serves normally under this worker.
  ASSETS: { fetch: (req: Request) => Promise<Response> };
}

export default {
  // HTTP fallthrough — Pages's own router already handled /api/* paths
  // before we got here, so this mostly just hands static assets back.
  async fetch(req: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(req);
  },

  // Cron Trigger — dispatches due broadcasts every 5 minutes.
  // Delegates to lib/schedule-dispatcher so unit tests can import the
  // core logic without the worker harness.
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    ctx.waitUntil(dispatchDueBroadcasts(env));
  },
};
