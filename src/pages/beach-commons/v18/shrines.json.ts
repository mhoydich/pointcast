import type { APIRoute } from 'astro';
import { SHRINE_25, SHRINE_BOUNDARIES, SHRINE_COMPANY, SHRINE_DOORS, SHRINE_LANES, SHRINE_PROTOCOLS, SHRINE_SOURCES, SHRINE_WATCHES } from '../../../lib/radius25-shrines';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...SHRINE_25,
  premise: 'A local public shrine is a hosted interval of attention, not an unattended object or a claim on public land. The offering is attention. The proof is the clean close.',
  protocols: SHRINE_PROTOCOLS,
  watches: SHRINE_WATCHES,
  company: SHRINE_COMPANY,
  publicDoors: SHRINE_DOORS,
  activityLanes: SHRINE_LANES,
  boundaries: SHRINE_BOUNDARIES,
  currentSources: SHRINE_SOURCES,
  interaction: {
    availability: 'human HTML companion only',
    composer: 'manual selection of a public door, portable ritual, watch, and company size',
    timer: 'gesture-started ninety-second browser timer',
    bell: 'gesture-started Web Audio oscillator; no sample, recording, microphone, upload, or autoplay',
    copy: 'user-controlled clipboard copy of the generated score',
    defaultPersistence: 'page memory only',
    optionalPersistence: 'browser localStorage only after the visitor presses Keep this score',
    erase: 'user-controlled removal of the pointcast.shrine25.v1 localStorage key',
    account: false, geolocation: false, camera: false, microphone: false, cookies: false, analytics: false, networkWrites: false, automaticSharing: false,
  },
  status: {
    official: false,
    permit: false,
    reservation: false,
    event: false,
    installation: false,
    memorial: false,
    publicArtApproval: false,
    liveConditions: false,
    affiliation: false,
  },
  methodology: {
    researchedAt: '2026-08-03T22:40:00-07:00',
    editorialBoundary: 'This is an independent PointCast design study and private composer. It does not announce, authorize, reserve, install, schedule, fund, host, or invite attendance to a real-world event.',
    ruleBoundary: 'The pocket, hosted, built, and event lanes are editorial operating distinctions, not legal advice. Current official sources, posted rules, staff direction, permits, access conditions, closures, and protected-area requirements control.',
    natureBoundary: 'Observe and remember. Do not collect, alter, feed, plant, restore, stack, move, or use site material.',
  },
}, null, 2), { headers: {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=300, s-maxage=3600',
  'Access-Control-Allow-Origin': '*',
  Link: '<https://pointcast.xyz/beach-commons/v18/shrines>; rel="alternate"; type="text/html"',
} });
