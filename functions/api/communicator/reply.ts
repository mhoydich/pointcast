/**
 * POST /api/communicator/reply  { token, answer, slot? }  (the single-use reply token is the credential)
 * -> { ok, answered, status, game, next: [{kind,text,chips}], sent, held, refused } · 404 bad-token · 409 already-used · 410 expired
 */
import { postReply } from '../../_lib/communicator-flow.ts';
import type { FlowEnv } from '../../_lib/communicator-flow.ts';

export const onRequestPost: PagesFunction<FlowEnv> = async ({ request, env }) => postReply({ request, env });
