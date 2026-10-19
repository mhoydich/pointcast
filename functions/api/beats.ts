/**
 * /api/beats — the Noun Beats Beat Wall.
 *
 * GET  ?sort=new|top&limit=1..100 → { sort, beats: Summary[], count }
 * GET  ?ids=a,b,c (≤ 20)          → { beats: Summary[] }        (your own beats' nods)
 * POST { enc, title, name, noun } → 201 { beat }                 (one per minute per visitor)
 *
 * Summary = { id, enc, title, name, noun, createdAt, nods }; `enc` is the /beats/#b= share encoding.
 * Logic, KV keys and bounds: functions/_lib/beats-wall.ts.
 */
import { getBeats, postBeat, options, type BeatsEnv } from '../_lib/beats-wall';

export const onRequestOptions: PagesFunction<BeatsEnv> = options;
export const onRequestGet: PagesFunction<BeatsEnv> = ({ request, env }) => getBeats(request, env);
export const onRequestPost: PagesFunction<BeatsEnv> = ({ request, env }) => postBeat(request, env);
