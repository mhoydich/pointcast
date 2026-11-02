/**
 * /meter-oracle.json - the Meter Oracle's fortunes (Ten Doors, 2026-11-02).
 * The site is static, so the build writes the next 24 hours of 15-minute
 * windows and the rule to compute any window yourself.
 */
import type { APIRoute } from 'astro';
import { doorManifest, jsonResponse } from '../lib/ten-doors.mjs';
import { FORTUNES, METER_WINDOW_MS, meterFortune } from '../lib/ten-doors/daily.mjs';

export const GET: APIRoute = () => {
  const now = Date.now();
  const windows = Array.from({ length: 96 }, (_, i) => meterFortune(new Date(now + i * METER_WINDOW_MS)));
  return jsonResponse(
    doorManifest('meter-oracle', {
      oracle: {
        windowMinutes: 15,
        rule: 'window = floor(unix milliseconds / 900000). half = FORTUNES.length / 2. fortune = FORTUNES[(window mod 2) * half + floor(mulberry32(fnv1a("meter:" + window))() * half)]. Even windows draw from the first half of the deck and odd windows from the second, so neighbors never repeat. Source: src/lib/ten-doors/daily.mjs.',
        builtAt: new Date(now).toISOString(),
        windows,
        note: 'Windows run 24 hours from the last build. The page itself always computes the live window in the browser.',
        fortunes: FORTUNES,
        coin: 'pretend: a sound, never a charge',
      },
    }),
  );
};
