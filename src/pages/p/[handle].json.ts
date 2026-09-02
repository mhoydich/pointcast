import type { APIRoute } from 'astro';
import contracts from '../../data/contracts.json';
import { listProfilePages } from '../../lib/profile-object.mjs';

export async function getStaticPaths() {
  const profiles = await listProfilePages(contracts.profile_objects.mainnet);
  return profiles.map((profile) => ({
    params: { handle: profile.handle },
    props: { profile },
  }));
}

export const GET: APIRoute = ({ props }) => new Response(JSON.stringify(props.profile, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=60, s-maxage=300',
    'Access-Control-Allow-Origin': '*',
  },
});
