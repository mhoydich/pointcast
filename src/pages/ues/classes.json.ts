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
      storage: 'local-browser-only',
      syncsToServer: false,
      identityStored: false,
      learnerArtifactsStored: false,
      note: 'Only completion choices and timestamps are saved in this browser. The learner may reset them or download a private receipt.',
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
