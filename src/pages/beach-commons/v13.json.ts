import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V13,
  FERMENTATION_PLATES,
  FERMENTATION_RULES,
  FERMENTATION_SOURCES,
  FERMENTATION_TEAMS,
  FESTIVAL_PHASES,
  FESTIVAL_SCORE,
  LOCAL_GAMES,
} from '../../lib/beach-commons-v13';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V13,
        plates: FERMENTATION_PLATES.map((plate) => ({
          ...plate,
          image: new URL(plate.image, BEACH_COMMONS_V13.url).href,
        })),
        regionalTeams: FERMENTATION_TEAMS,
        score: {
          total: FESTIVAL_SCORE.reduce((sum, category) => sum + category.points, 0),
          categories: FESTIVAL_SCORE,
          rule: 'A complete place-system wins; consumption volume is never scored.',
        },
        festivalPhases: FESTIVAL_PHASES,
        localGames: LOCAL_GAMES,
        operatingRules: FERMENTATION_RULES,
        currentSources: FERMENTATION_SOURCES,
        localInstrument: {
          title: 'Festival Draft Board',
          availability: 'human HTML edition only',
          storage: false,
          analytics: false,
          networkWrites: false,
          realRecipe: false,
          realEventRegistration: false,
          inputs: ['place-team', 'beer style argument', 'bread', 'honey', 'local game'],
          actions: ['draft speculative festival slate', 'copy local rehearsal receipt', 'reset'],
        },
        rights: {
          visuals: 'Original speculative images generated for this PointCast field study with OpenAI image generation.',
          affiliation:
            'No brewery, brewer, bakery, beekeeper, club, competition body, government agency, county department, venue, nonprofit, producer, or neighborhood endorses this study.',
        },
        methodology: {
          researchCheckedAt: '2026-07-28T12:40:00-07:00',
          currentClaims:
            'Federal personal-use and brew-on-premises boundaries, California license and daily-event context, Dockweiler alcohol-permit limits, LA County temporary food-event context, 2026 beer-style references, honey fermentation, cottage-food context, and infant honey safety were checked against the linked current sources.',
          visualStatus:
            'Eight speculative concept plates; images are not photographs of an existing Fermentation League, community brewery, festival, competition, recipe, batch, or public program.',
          productionBoundary:
            'No instructions on recipe quantities, hot-side operation, fermentation parameters, packaging, commercial production, or alcohol service are provided. Qualified operators and the actual licenses govern real work.',
          placeBoundary:
            'Coast, Basin, Valley, and Foothill are fictional editorial teams. Their style arguments do not claim exclusive regional ingredients, cultures, recipes, or flavor.',
          eventStatus:
            'No brewery, club, nonprofit, team, batch, recipe, partnership, public tasting, beach game, permit, competition, festival, contribution request, product, sale, or event is announced.',
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
        Link: '<https://pointcast.xyz/beach-commons/v13>; rel="alternate"; type="text/html"',
      },
    },
  );
