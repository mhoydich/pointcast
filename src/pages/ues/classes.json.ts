import type { APIRoute } from 'astro';
import { ONLINE_SEASON_ONE, UES_SEASON_ONE_BUDGET, UES_SEASON_ONE_COURSES } from '../../lib/ues-classes';
import { ONLINE_SEASON_ZERO, UES_COURSES } from '../../lib/ues-program';

export const GET: APIRoute = () => {
  const participationContract = {
    status: 'active',
    deliveryMode: 'self-paced',
    start: 'anytime',
    durationModules: 6,
    learnerPriceUsd: 0,
    requirements: {
      account: false,
      application: false,
      deadlines: false,
      liveAttendance: false,
      wallet: false,
    },
    progress: {
      storage: 'local-browser-by-default',
      syncsToServer: 'explicit-snapshot-only-when-enabled',
      identityStored: 'only-for-optional-account-copy',
      optionalAccountEndpoint: '/api/me/courses',
      attestation: 'self-attested',
      publicProfile: false,
      learnerArtifactsStored: false,
      note: 'No automatic upload. A signed-in learner may explicitly save or remove a private checklist copy when enabled. An account copy links the public course code, choices and timestamps to that account; it is not a verified qualification or voting right.',
    },
    optionalSupportedCohorts: {
      availableWhenFunded: true,
      requiredForAccessOrCompletion: false,
      note: 'A scheduled cohort may add human review and facilitation, but every course remains independently completable.',
    },
    completionReceipt: {
      kind: 'self-attested',
      privateByDefault: true,
      walletRequired: false,
      onChain: false,
      disclaimer:
        'The receipt is not academic credit, accreditation, verified identity, an on-chain credential, or a financial credential.',
    },
  } as const;

  const body = {
    $schema: 'https://pointcast.xyz/for-agents',
    generatedAt: new Date().toISOString(),
    name: 'University of El Segundo Online Class Catalog',
    human: 'https://pointcast.xyz/ues',
    current: {
      term: ONLINE_SEASON_ONE,
      courses: UES_SEASON_ONE_COURSES,
      budget: UES_SEASON_ONE_BUDGET,
      participationContract,
    },
    foundations: {
      term: ONLINE_SEASON_ZERO,
      courses: UES_COURSES,
    },
    previousCurriculum: [{ code: 'UES-05', title: 'The Rebuildable Town', path: '/ues/track-05', status: 'historical' }],
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
