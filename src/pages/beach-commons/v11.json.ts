import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V11,
  REACH_DIMENSIONS,
  REACH_LINE_PLATES,
  REACH_LINE_ROLES,
  REACH_LINE_RULES,
  REACH_LINE_SOURCES,
  REACH_PATHS,
} from '../../lib/beach-commons-v11';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V11,
        plates: REACH_LINE_PLATES.map((plate) => ({
          ...plate,
          image: new URL(plate.image, BEACH_COMMONS_V11.url).href,
        })),
        scoreDimensions: REACH_DIMENSIONS,
        roles: REACH_LINE_ROLES,
        realityPaths: REACH_PATHS,
        operatingRules: REACH_LINE_RULES,
        currentSources: REACH_LINE_SOURCES,
        localInstrument: {
          title: 'Reach Meter',
          availability: 'human HTML edition only',
          storage: 'browser localStorage only',
          networkWrites: false,
          publicScore: false,
          liveParticipantCount: false,
          liveLocation: false,
          modes: ['one-armspan handoff', 'safe hosted station leg'],
          actions: ['pass', 'staffed pause', 'resume', 'turn home', 'undo', 'reset', 'copy receipt'],
          audio: {
            title: 'Handoff Bell',
            engine: 'three browser-native Web Audio oscillators',
            autoPlay: false,
            samplesOrRecordings: false,
            requiresVisitorGesture: true,
          },
        },
        rights: {
          visuals: 'Original images generated for this PointCast field study with OpenAI image generation.',
          audio: 'Original real-time browser synthesis; no samples, recordings, stems, lyrics, or third-party music.',
          affiliation: 'No agency, county, city, school, route owner, athletic body, or event organization endorses this speculative study.',
        },
        methodology: {
          researchCheckedAt: '2026-07-28T09:25:00-07:00',
          currentClaims:
            'Site, event, accessibility, path, navigation, fire-ring, and moving-event boundaries were checked against current LA County Beaches and Harbors, LA County Public Works, and California State Parks sources.',
          visualStatus:
            'Eight speculative concept plates; images are not photographs of an existing relay, approved route, permitted gathering, official station, or public program.',
          custodyDefinition:
            'Continuous means accountable custody, not nonstop motion. Human hands or a staffed padded cradle remain responsible for the baton through every pause and transfer.',
          crossingBoundary:
            'The relay stops completely at crossings, uses existing legal controls, stays out of roadways and bicycle lanes, and never assigns traffic direction to volunteers.',
          eventStatus:
            'No relay, route, gathering, ticket, contribution drive, record attempt, permit, road closure, or live participant count is announced.',
        },
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        Link: '<https://pointcast.xyz/beach-commons/v11>; rel="alternate"; type="text/html"',
      },
    },
  );
