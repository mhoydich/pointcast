/**
 * /ice-cream-route.json - the daily street maps (Ten Doors, 2026-11-02).
 * Static build: today plus 13 more days, each with three rounds.
 */
import type { APIRoute } from 'astro';
import { doorManifest, jsonResponse } from '../lib/ten-doors.mjs';
import { ROUTE_SIZE, addDays, routeDay, townDay } from '../lib/ten-doors/daily.mjs';

export const GET: APIRoute = () => {
  const today = townDay(new Date());
  return jsonResponse(
    doorManifest('ice-cream-route', {
      map: {
        grid: `${ROUTE_SIZE} by ${ROUTE_SIZE} corners, numbered row by row from the top left: corner = y * ${ROUTE_SIZE} + x`,
        oneWays: 'each [a, b] pair is a street that may be driven only from a to b',
        jingle: 'notes in the song = blocks you may drive; best = the fewest blocks that reach every kid',
        score: 'notes left when the last kid is served',
        days: Array.from({ length: 14 }, (_, i) => routeDay(addDays(today, i))),
      },
    }),
  );
};
