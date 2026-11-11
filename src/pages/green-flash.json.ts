/**
 * /green-flash.json - computed sunsets for El Segundo (Ten Doors, 2026-11-02).
 * Static build: 60 days of sunsets from the build date, plus the method.
 */
import type { APIRoute } from 'astro';
import { doorManifest, jsonResponse } from '../lib/ten-doors.mjs';
import { EL_SEGUNDO, addDays, sunsetReport, townDay } from '../lib/ten-doors/daily.mjs';

export const GET: APIRoute = () => {
  const today = townDay(new Date());
  return jsonResponse(
    doorManifest('green-flash', {
      sunset: {
        place: { name: 'El Segundo, California', lat: EL_SEGUNDO.lat, lon: EL_SEGUNDO.lon, timeZone: EL_SEGUNDO.tz },
        method: 'NOAA general solar position equations (fractional year, equation of time, declination), zenith 90.833 degrees for refraction and the solar disc.',
        accuracy: 'About one minute; local terrain, haze and marine layer are not modeled.',
        days: Array.from({ length: 60 }, (_, i) => sunsetReport(addDays(today, i))),
      },
      game: {
        window: 'a tap within 0.1 s of the last sliver going under counts as a green flash; a faint edge shows out to 0.5 s',
        sunsetLengthSeconds: { min: 30, max: 44 },
        storage: 'localStorage key green-flash:record',
      },
      realWorld: 'A real green flash needs a clear, flat ocean horizon and is brief: watch the last instant, never look at the full sun.',
    }),
  );
};
