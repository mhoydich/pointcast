import type { APIRoute } from 'astro';
import { ROW_BY_ROW, ROW_BY_ROW_SOURCES } from '../../../lib/pointcast-sorority-row';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...ROW_BY_ROW,
        visualProvenance: ROW_BY_ROW.plates.map((plate) => ({
          id: plate.id,
          image: `https://pointcast.xyz${plate.image}`,
          generator: plate.model,
          jobId: plate.midjourneyJobId,
          imageIndex: plate.midjourneyIndex,
          promptSummary: plate.promptSummary,
          imaginedScene: true,
          documentaryPhotograph: false,
          representsSpecificChapter: false,
          representsSpecificCampus: false,
        })),
        sources: ROW_BY_ROW_SOURCES,
        editorialBoundary: {
          conferenceComparisonIsCensus: false,
          schoolFiguresAreNormalized: false,
          representsEveryFraternityOrSorority: false,
          representsSpecificChapter: false,
          depictsRealPeoplePlacesOrHouses: false,
          reproducesPrivateRitual: false,
          endorsesHazing: false,
          officialCollegeOrConferencePublication: false,
        },
        discovery: {
          human: ROW_BY_ROW.canonical,
          machine: ROW_BY_ROW.machineEdition,
          magazine: ROW_BY_ROW.magazine,
          previousFeature: ROW_BY_ROW.previousFeature,
          block: `https://pointcast.xyz/b/${ROW_BY_ROW.block}`,
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
      },
    },
  );
