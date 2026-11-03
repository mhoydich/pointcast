/**
 * /tide-pool-census.json - the daily tide pools (Ten Doors, 2026-11-02).
 * Static build: today plus 13 more days. Positions are 0 to 1 across the pool.
 */
import type { APIRoute } from 'astro';
import { doorManifest, jsonResponse } from '../lib/ten-doors.mjs';
import { SPECIES, addDays, tidePool, townDay } from '../lib/ten-doors/daily.mjs';

export const GET: APIRoute = () => {
  const today = townDay(new Date());
  return jsonResponse(
    doorManifest('tide-pool-census', {
      census: {
        species: SPECIES,
        dayChanges: 'midnight Pacific',
        hidden: 'hidden creatures only show near where a person stirs the water',
        days: Array.from({ length: 14 }, (_, i) => tidePool(addDays(today, i))),
      },
    }),
  );
};
