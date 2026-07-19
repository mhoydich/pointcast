import type { APIRoute } from 'astro';
import { ONLINE_SEASON_ONE, UES_SEASON_ONE_COURSES, type UesSeasonOneCourse } from '../../lib/ues-classes';

export function getStaticPaths() {
  return UES_SEASON_ONE_COURSES.map((course) => ({ params: { slug: course.slug }, props: { course } }));
}

export const GET: APIRoute = ({ props }) => {
  const course = props.course as UesSeasonOneCourse;
  const body = {
    $schema: 'https://pointcast.xyz/for-agents',
    ...course,
    human: `https://pointcast.xyz${course.path}`,
    catalog: 'https://pointcast.xyz/ues',
    fundingProgram: 'https://pointcast.xyz/university-of-el-segundo',
    participation: {
      status: 'active',
      deliveryMode: 'self-paced',
      start: 'anytime',
      durationModules: course.weeks.length,
      learnerPriceUsd: ONLINE_SEASON_ONE.learnerPriceUsd,
      requirements: {
        account: false,
        application: false,
        deadlines: false,
        liveAttendance: false,
        wallet: false,
      },
    },
    progressPolicy: {
      storage: 'local-browser-only',
      syncsToServer: false,
      identityStored: false,
      learnerArtifactsStored: false,
      note: 'Only completion choices and timestamps are saved in this browser. The learner may reset them or download a private receipt.',
    },
    optionalSupportedCohort: {
      availableWhenFunded: true,
      requiredForAccessOrCompletion: false,
      note: 'A scheduled cohort may add human review and facilitation, but it never gates the independent path.',
    },
    completionReceipt: {
      kind: 'self-attested',
      privateByDefault: true,
      walletRequired: false,
      onChain: false,
      disclaimer:
        'The receipt is not academic credit, accreditation, verified identity, an on-chain credential, or a financial credential.',
    },
    transactionPolicy: 'Course browsing and participation are wallet-free. Tezos support is optional and requires separate explicit Mainnet review.',
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
