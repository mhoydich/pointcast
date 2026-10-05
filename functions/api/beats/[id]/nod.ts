/**
 * /api/beats/<id>/nod — one nod per visitor (IP hash) per beat per UTC day.
 * POST → { id, nods } · 409 { error, nods } if already nodded today · 404 if the beat is gone.
 */
import { nodBeat, options, type BeatsEnv } from '../../../_lib/beats-wall';

export const onRequestOptions: PagesFunction<BeatsEnv> = options;
export const onRequestPost: PagesFunction<BeatsEnv> = ({ request, env, params }) => nodBeat(request, env, String(params.id || ''));
