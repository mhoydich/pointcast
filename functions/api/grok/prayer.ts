/**
 * /api/grok/prayer — the quiet bell on /grok.
 *
 * GET is public. POST accepts { id } from this site (and local preview)
 * and is rate-limited by a hash of the visitor address. The handler,
 * including CORS, lives in functions/_lib/grok-prayer.mjs.
 */

import { handlePrayer } from '../../_lib/grok-prayer.mjs';

type PrayerEnv = { VISITS?: KVNamespace; AUTH_DB?: D1Database };

export const onRequestGet: PagesFunction<PrayerEnv> = ({ request, env }) => handlePrayer(request, env);
export const onRequestPost: PagesFunction<PrayerEnv> = ({ request, env }) => handlePrayer(request, env);
export const onRequestOptions: PagesFunction<PrayerEnv> = ({ request, env }) => handlePrayer(request, env);
