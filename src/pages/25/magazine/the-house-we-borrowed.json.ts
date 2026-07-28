import type { APIRoute } from 'astro';
import { HOUSE_WE_BORROWED } from '../../../lib/pointcast-college-house';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...HOUSE_WE_BORROWED,
        visualProvenance: HOUSE_WE_BORROWED.plates.map((plate) => ({
          id: plate.id,
          image: `https://pointcast.xyz${plate.image}`,
          generator: plate.model,
          jobId: plate.midjourneyJobId,
          imageIndex: plate.midjourneyIndex,
          promptSummary: plate.promptSummary,
          imaginedScene: true,
          documentaryPhotograph: false,
        })),
        editorialBoundary: {
          representsEveryFraternity: false,
          representsSpecificChapter: false,
          depictsRealPeopleOrPlaces: false,
          endorsesHazing: false,
          officialCollegePublication: false,
        },
        discovery: {
          human: HOUSE_WE_BORROWED.canonical,
          machine: HOUSE_WE_BORROWED.machineEdition,
          magazine: HOUSE_WE_BORROWED.magazine,
          block: `https://pointcast.xyz/b/${HOUSE_WE_BORROWED.block}`,
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
