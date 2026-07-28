import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V12,
  BOAT_FUTURES,
  HARBOR_PATHS,
  HARBOR_PLATES,
  HARBOR_RULES,
  HARBOR_SOURCES,
} from '../../lib/beach-commons-v12';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V12,
        plates: HARBOR_PLATES.map((plate) => ({
          ...plate,
          image: new URL(plate.image, BEACH_COMMONS_V12.url).href,
        })),
        vesselFutures: BOAT_FUTURES,
        realityPaths: HARBOR_PATHS,
        operatingRules: HARBOR_RULES,
        currentSources: HARBOR_SOURCES,
        localInstrument: {
          title: 'One Boat, Five Futures',
          availability: 'human HTML edition only',
          storage: false,
          networkWrites: false,
          realVesselAssessment: false,
          inputs: ['ownership and authority', 'hazard screen', 'structure', 'shared-fleet value', 'safe component value'],
          gates: ['resolve ownership', 'contain and survey'],
          futures: BOAT_FUTURES.map((future) => future.title),
          actions: ['sort imagined boat', 'copy local educational receipt'],
        },
        rights: {
          visuals: 'Original speculative images generated for this PointCast field study with OpenAI image generation.',
          affiliation: 'No agency, county, marina, yacht club, leaseholder, boat owner, school, environmental organization, or harbor business endorses this study.',
        },
        methodology: {
          researchCheckedAt: '2026-07-28T09:25:00-07:00',
          currentClaims:
            'Marina capacity, active development, navigation, no-discharge, dock repair, pump-out, absorbent-pad, coastal-planning, and fire-damaged clubhouse context were checked against current official LA County sources.',
          provocationBoundary:
            'The originating X post is treated as a creative prompt. PointCast did not verify its broad claim of marina-wide languishing or a massive abandoned-boat epidemic.',
          visualStatus:
            'Eight speculative concept plates; images are not photographs of existing Harbor Works facilities, current Marina del Rey conditions, available land, abandoned vessels, or approved projects.',
          vesselBoundary:
            'No real vessel is assessed, acquired, offered, salvaged, dismantled, donated, or declared abandoned. Ownership and hazards are mandatory gates before any future is considered.',
          eventStatus:
            'No lease, acquisition drive, salvage call, repair program, public launch, contribution request, permit, or event is announced.',
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
        Link: '<https://pointcast.xyz/beach-commons/v12>; rel="alternate"; type="text/html"',
      },
    },
  );
