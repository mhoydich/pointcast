import type { APIRoute } from 'astro';
import {
  ENGINEERING_CAPABILITIES,
  ENGINEERING_CATALOG,
  ENGINEERING_LAYERS,
  ENGINEERING_MISSIONS,
  ENGINEERING_PROOF_PACKET,
  REGIONAL_ENGINEERING_DOORS,
  TERMINAL_COMMANDS,
} from '../../../lib/radius25-engineering';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...ENGINEERING_CATALOG,
  premise: 'A regional engineering advantage is not a list of company names. It is the ability to locate the right capabilities, make interfaces explicit, cross qualification gates, and carry evidence from question through maintenance and closeout.',
  layers: ENGINEERING_LAYERS,
  capabilities: ENGINEERING_CAPABILITIES,
  missionStacks: ENGINEERING_MISSIONS,
  regionalDoors: REGIONAL_ENGINEERING_DOORS,
  proofPacket: ENGINEERING_PROOF_PACKET,
  terminal: {
    availability: 'human HTML companion only',
    commands: TERMINAL_COMMANDS,
    parser: 'bounded in-page command parser; no arbitrary shell or code execution',
    search: 'case-insensitive token matching against checked-in capability data',
    state: 'browser memory only for the current page view',
    actions: ['filter capability cards', 'select a checked-in mission stack', 'scroll to a catalog section', 'copy a work order to the clipboard'],
    storage: false,
    cookies: false,
    analytics: false,
    identity: false,
    geolocation: false,
    registration: false,
    arbitraryExecution: false,
    networkWrites: false,
  },
  methodology: {
    researchCheckedAt: '2026-08-01T01:45:00-07:00',
    sourcePolicy: 'Official government, regulator, educational institution, or organization-owned sources. No private-person catalog, third-party people aggregator, or inferred individual skill profile.',
    radiusBoundary: 'A roughly 25-mile straight-line editorial field centered on El Segundo. Bands are orientation labels, not measured commute, service, legal, labor-market, procurement, or geofence boundaries. Edge doors are approximate.',
    capabilityBoundary: 'Named organizations and programs are evidence that a capability or learning route exists in the regional field. They are not members, partners, hosts, vendors, endorsers, available facilities, or commitments.',
    qualificationBoundary: 'The catalog cannot determine licensure, competence, authorization, suitability, code compliance, or a safe means and method. Verify current rules and responsible professionals for real work.',
    activityBoundary: 'No crew, job, hiring process, contract, procurement, permit, site, facility access, installation, test, sampling, transmission, construction, environmental activity, public program, or partnership is announced or promised.',
    freshness: 'Programs, role listings, regulations, access, and URLs change. Recheck the official source before relying on a door.',
  },
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
    Link: '<https://pointcast.xyz/beach-commons/v18/engineering>; rel="alternate"; type="text/html"',
  },
});
