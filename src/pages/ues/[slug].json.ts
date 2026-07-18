import type { APIRoute } from 'astro';
import { UES_SEASON_ONE_COURSES, type UesSeasonOneCourse } from '../../lib/ues-classes';

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
