import type { APIRoute } from 'astro';
import {
  DIVISION_ONE_CONFERENCES,
  DIVISION_ONE_DIRECTORY,
  DIVISION_ONE_PROGRAMS,
  DIVISION_ONE_STATES,
} from '../../lib/pointcast-division-one-directory';

export const prerender = true;

export const GET: APIRoute = () => {
  const payload = {
    $schema: 'https://schema.org/Dataset',
    spec: DIVISION_ONE_DIRECTORY.spec,
    status: 'published',
    live: true,
    title: DIVISION_ONE_DIRECTORY.title,
    subtitle: DIVISION_ONE_DIRECTORY.subtitle,
    issue: DIVISION_ONE_DIRECTORY.issue,
    publishedAt: DIVISION_ONE_DIRECTORY.publishedAt,
    asOf: DIVISION_ONE_DIRECTORY.asOf,
    academicYear: DIVISION_ONE_DIRECTORY.academicYear,
    canonical: DIVISION_ONE_DIRECTORY.canonical,
    machineEdition: DIVISION_ONE_DIRECTORY.machineEdition,
    permanentBlock: `https://pointcast.xyz/b/${DIVISION_ONE_DIRECTORY.block}`,
    counts: DIVISION_ONE_DIRECTORY.counts,
    fieldOrder: DIVISION_ONE_DIRECTORY.fieldOrder,
    studentPromise: DIVISION_ONE_DIRECTORY.studentPromise,
    studentQuestions: DIVISION_ONE_DIRECTORY.studentQuestions,
    conferences: DIVISION_ONE_CONFERENCES,
    states: DIVISION_ONE_STATES,
    programs: DIVISION_ONE_PROGRAMS.map((program) => ({
      fieldPosition: program.fieldPosition,
      pointcastRank: program.pointcastRank,
      ncaaId: program.ncaaId,
      slug: program.slug,
      name: program.displayName,
      officialName: program.officialName,
      subdivision: program.subdivision,
      conference: program.conference,
      state: program.state,
      stateName: program.stateName,
      institutionType: program.institutionType,
      hbcu: program.hbcu,
      institutionUrl: program.institutionUrl,
      athleticsUrl: program.athleticsUrl,
    })),
    sources: DIVISION_ONE_DIRECTORY.sources,
    boundaries: DIVISION_ONE_DIRECTORY.boundaries,
    discovery: {
      directory: DIVISION_ONE_DIRECTORY.canonical,
      magazine: 'https://pointcast.xyz/25/magazine',
      pointcast25: 'https://pointcast.xyz/25',
      fanClique: 'https://pointcast.xyz/25/fan-clique',
      mascotAtlas: 'https://pointcast.xyz/mascot-battler',
      apps: 'https://pointcast.xyz/apps',
      pressWire: 'https://pointcast.xyz/press',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
