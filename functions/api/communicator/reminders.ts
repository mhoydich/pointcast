/**
 * POST /api/communicator/reminders  (resident-only: X-Yard-Resident; meant for a cron caller)
 * Builds due 24h/2h reminders for confirmed games, delivers them (and retries quiet-hours holds).
 * -> { ok, games, queued, sent, held, refused } · 403 not-a-resident · 503 resident-key-unset
 */
import { postReminders } from '../../_lib/communicator-flow.ts';
import type { FlowEnv } from '../../_lib/communicator-flow.ts';

export const onRequestPost: PagesFunction<FlowEnv> = async ({ request, env }) => postReminders({ request, env });
