import type { APIRoute } from 'astro';
import {
  MICRODUCK_CONSUMER_ARC,
  MICRODUCK_META,
  MICRODUCK_MISSIONS,
  MICRODUCK_MODEL_HORIZON,
  MICRODUCK_SOURCES,
  MICRODUCK_SPECS,
} from '../../lib/digital-pets-microduck';

const base = 'https://pointcast.xyz';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...MICRODUCK_META,
        schema: 'pointcast.future-book-companion/v1',
        url: `${base}${MICRODUCK_META.route}`,
        jsonUrl: `${base}${MICRODUCK_META.jsonRoute}`,
        futureBook: {
          title: 'The Animal After the Internet',
          url: `${base}/digital-pets`,
          jsonUrl: `${base}/digital-pets.json`,
          relationship: 'Companion 05 and Field Report 01',
        },
        review: {
          thesis: 'The toy is the hook. The real product is a body for agents.',
          verdict: 'A development platform disguised as a character.',
          preorderIf: 'You want to train, modify, and break things in simulation first.',
          waitIf: 'You expect a polished household assistant that understands open-ended requests.',
          ratings: {
            approachability: 9,
            softwareOpenness: 8.5,
            outOfBoxAutonomy: 4,
            builderValue: 8.5,
          },
        },
        disclosure:
          'Microduck had not shipped when this review was published. This is a review of launch hardware, public code, and the documented developer path—not a hands-on durability or battery test. Several specifications remained provisional.',
        specifications: MICRODUCK_SPECS,
        architecture: {
          principle: 'Reflexes live in the duck; intent can live anywhere.',
          loop: ['human goal', 'model plan', 'agent contract', '50 Hz local policy', 'camera and robot-state feedback'],
          boundary:
            'A frontier model should choose bounded skills, not improvise individual servo commands. Local control retains physical authority.',
        },
        programmingPath: [
          { step: 1, name: 'Operate and observe', outcome: 'Learn the body before changing the brain.' },
          { step: 2, name: 'Train a behavior', outcome: 'Write a reward rather than a choreography.' },
          { step: 3, name: 'Program with AI', outcome: 'Describe the outcome and let an agent build and evaluate the loop.' },
        ],
        behaviorLab: MICRODUCK_MISSIONS,
        agentForwardProjects: [
          'natural-language skill builder',
          'embodied memory',
          'reward-design partner',
          'flock orchestration',
          'skill provenance',
        ],
        modelHorizon: MICRODUCK_MODEL_HORIZON,
        consumerArc: MICRODUCK_CONSUMER_ARC,
        media: {
          hero: `${base}/images/digital-pets/microduck/morning.webp`,
          watching: `${base}/images/digital-pets/microduck/watching.webp`,
          flock: `${base}/images/digital-pets/microduck/kickabout.webp`,
          social: `${base}/images/digital-pets/microduck/social-card.jpg`,
          photoCredit: 'Pollen Robotics press kit',
          socialCredit: 'PointCast editorial illustration; not product photography',
        },
        sourceSatellite: {
          url: 'https://mhoydich.github.io/pointcast-microduck/',
          repository: 'https://github.com/mhoydich/pointcast-microduck',
          relationship: 'The standalone first edition remains available; this PointCast route is the canonical Future Book integration.',
        },
        creators: [
          { name: 'Michael Hoydich', role: 'Direction and editorial brief' },
          { name: 'OpenAI Codex', role: 'Research, writing, design, and implementation collaborator' },
        ],
        sources: MICRODUCK_SOURCES,
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        Link: `<${base}${MICRODUCK_META.route}>; rel="alternate"; type="text/html"`,
      },
    },
  );
