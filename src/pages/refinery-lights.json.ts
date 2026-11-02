/** /refinery-lights.json - machine-readable manifest for a Ten Doors area (2026-11-02). Shape lives in src/lib/ten-doors.mjs. */
import type { APIRoute } from 'astro';
import { doorManifest, jsonResponse } from '../lib/ten-doors.mjs';
import { DETAILS } from '../lib/ten-doors/details.mjs';

export const GET: APIRoute = () => jsonResponse(doorManifest('refinery-lights', DETAILS['refinery-lights']));
