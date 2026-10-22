import type { APIRoute } from 'astro';
import contracts from '../../data/contracts.json';
import { listOwnerKennelDogs, listOwnerSeals, listProfilePages } from '../../lib/profile-object.mjs';

export async function getStaticPaths() {
  const profiles = await listProfilePages(contracts.profile_objects.mainnet).catch((error) => {
    // Offline builds (no route to TzKT) still complete; CI and deploys have network.
    console.warn(`[profile pages] indexer unreachable, building with no profile pages: ${error.message}`);
    return [];
  });
  const enriched = await Promise.all(profiles.map(async (profile) => ({
    ...profile,
    dogs: await listOwnerKennelDogs(profile.owner, contracts.kennel_club.mainnet).catch(() => []),
    seals: await listOwnerSeals(profile.owner, contracts.seal_soulbound.mainnet).catch(() => []),
  })));
  return enriched.flatMap((profile) => [profile.handle, `@${profile.handle}`].map((handle) => ({
    params: { handle },
    props: { profile },
  })));
}

export const GET: APIRoute = ({ props }) => new Response(JSON.stringify(props.profile, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=60, s-maxage=300',
    'Access-Control-Allow-Origin': '*',
  },
});
