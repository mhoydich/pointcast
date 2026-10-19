/**
 * /api/beats/moment — numbers a Noun Beats Moment within its type ("Peak Groove #12").
 * POST { type } → { type, serial, scope: "global" }  · ≤ 8 claims per visitor per minute.
 * Moments are earned and kept on the phone; this only hands out serials (best effort on KV).
 */
import { claimMoment, options, type BeatsEnv } from '../../_lib/beats-wall';

export const onRequestOptions: PagesFunction<BeatsEnv> = options;
export const onRequestPost: PagesFunction<BeatsEnv> = ({ request, env }) => claimMoment(request, env);
