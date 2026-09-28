/**
 * GET /api/air — every Field Reports station at a glance: each spot's live
 * reading (label, status, age, signal bars) or null, when someone on site
 * last reported, and whether Court Call is on now.
 *
 * → { spots: [{ id, name, short, mhz, channel, color, kind, reading: {label, status, ageMin, bars} | null, lastAt }],
 *     courtCall: { live, minutesUntil, minutesLeft }, serverTime }
 */
import { AIR_CONFIG } from '../../../src/lib/air.ts';
import { json, stationsPayload, unavailable, type AirEnv } from '../../_lib/air-store.ts';

export const onRequestGet: PagesFunction<AirEnv> = async ({ env }) => {
  if (!env.AUTH_DB) return unavailable();
  try {
    return json(await stationsPayload(env.AUTH_DB, AIR_CONFIG, Date.now()));
  } catch {
    return unavailable();
  }
};
