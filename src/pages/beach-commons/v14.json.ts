import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V14,
  HARDPOINT_PLATES,
  HARDPOINT_RULES,
  HARDPOINT_SOURCES,
  HARDPOINT_HOUSES,
  HARDPOINT_OUTCOMES,
  HARDPOINT_SCORE,
  HARDPOINT_FIXTURES,
} from '../../lib/beach-commons-v14';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V14,
        plates: HARDPOINT_PLATES.map((plate) => ({
          ...plate,
          image: new URL(plate.image, BEACH_COMMONS_V14.url).href,
        })),
        materialHouses: HARDPOINT_HOUSES,
        score: {
          total: HARDPOINT_SCORE.reduce((sum, category) => sum + category.points, 0),
          categories: HARDPOINT_SCORE,
          rule:
            'Standing up is only the beginning. The complete room must also prove comfort, access, raising clarity, repair legibility, material honesty, dismantling, inventory, and clean return.',
          resultsStatus:
            'All scores, standings, awards, revisions, and outcomes are fictional editorial simulations, not tests or engineering findings.',
        },
        seasonFixtures: HARDPOINT_FIXTURES,
        imaginedOutcomes: HARDPOINT_OUTCOMES,
        operatingRules: HARDPOINT_RULES,
        currentSources: HARDPOINT_SOURCES,
        localInstrument: {
          title: 'Fixture Board',
          availability: 'human HTML edition only',
          storage: false,
          analytics: false,
          networkWrites: false,
          engineeringCalculator: false,
          realStructure: false,
          realTeam: false,
          realEventRegistration: false,
          inputs: ['fictional material house', 'fictional league fixture'],
          actions: ['rehearse editorial commentary', 'copy fictional fixture card', 'reset'],
        },
        rights: {
          visuals: 'Original speculative images generated for this PointCast field study with OpenAI image generation.',
          affiliation:
            'No architect, engineer, fabricator, material maker, competition body, government agency, county department, venue, nonprofit, public owner, or neighborhood endorses this study.',
        },
        methodology: {
          researchCheckedAt: '2026-07-29T10:20:00-07:00',
          currentClaims:
            'Coastal corrosion and material-combination guidance, connector compatibility, timber moisture management, composite-infrastructure context, wind-force implications of enclosures, and current LA County beach activity distinctions were checked against the linked sources.',
          visualStatus:
            'Eight speculative concept plates; images are not photographs of an existing Hardpoint League, hardpoint, material house, event, structure, engineering detail, test, or public program.',
          designBoundary:
            'No structural calculations, connection dimensions, wind ratings, foundation details, code analysis, engineering approval, construction sequence, or site authorization are provided. Design professionals, authorities, manufacturers, owners, and actual conditions govern real work.',
          placeBoundary:
            'The proof ground and attached structures are fictional. No exact Dockweiler or other public-property site is proposed or represented as available.',
          eventStatus:
            'No hardpoint, chassis, material house, league, team, prize, event, operator, partner, sponsor, public program, permit, engineering approval, reservation, contribution request, product, sale, or gathering is announced.',
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
        Link: '<https://pointcast.xyz/beach-commons/v14>; rel="alternate"; type="text/html"',
      },
    },
  );
