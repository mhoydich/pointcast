import type { APIRoute } from 'astro';
import { ANTI_PATTERNS, COVERAGE_PROTOCOL, ELIGIBLE_ROLES, FIRST_THREE_INSTANCES, FUNDING_DESIGN, PURPOSE, REFERENCES, RETURN_PROTOCOL, SABBATICAL_META, SABBATICAL_NOTES } from '../lib/sabbatical';
export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/sabbatical.json',
    name: SABBATICAL_META.title, subtitle: SABBATICAL_META.subtitle, thesis: SABBATICAL_META.thesis,
    paperNumber: SABBATICAL_META.paperNumber, parents: SABBATICAL_META.parents, status: SABBATICAL_META.status, date: SABBATICAL_META.date,
    purpose: PURPOSE,
    eligibleRoles: ELIGIBLE_ROLES,
    fundingDesign: FUNDING_DESIGN,
    coverageProtocol: COVERAGE_PROTOCOL,
    returnProtocol: RETURN_PROTOCOL,
    antiPatterns: ANTI_PATTERNS,
    firstThreeInstances: FIRST_THREE_INSTANCES,
    notes: SABBATICAL_NOTES,
    references: REFERENCES,
    counts: { roleClasses: ELIGIBLE_ROLES.length, antiPatterns: ANTI_PATTERNS.length, firstInstances: FIRST_THREE_INSTANCES.length },
    generatedAt: new Date().toISOString(),
    human: 'https://pointcast.xyz/sabbatical',
    parent: 'https://pointcast.xyz/time',
    related: { time: 'https://pointcast.xyz/time', bathHouse: 'https://pointcast.xyz/bath-house', concertHall: 'https://pointcast.xyz/concert-hall', federationCouncil: 'https://pointcast.xyz/federation-council', giantWorks: 'https://pointcast.xyz/giant-works', ues: 'https://pointcast.xyz/university-of-el-segundo' },
  };
  return new Response(JSON.stringify(payload, null, 2), { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } });
};
