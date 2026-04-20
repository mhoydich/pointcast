/**
 * /eth-legacy.json — machine mirror. Same shape as the page, public only.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const tokens = (await getCollection('ethLegacy', ({ data }) => !data.draft))
    .map((t) => ({
      slug: t.data.slug,
      name: t.data.name,
      ticker: t.data.ticker ?? null,
      deployer: t.data.deployer ?? null,
      contract: t.data.contract ?? null,
      network: t.data.network,
      notes: t.data.notes ?? null,
      story: t.data.story ?? null,
      addedAt: t.data.addedAt.toISOString(),
      author: t.data.author,
    }));

  return new Response(JSON.stringify({
    $schema: 'https://pointcast.xyz/eth-legacy.json',
    name: 'PointCast ETH Legacy',
    description: 'Retrospective of Mike\'s ~43 ERC-20 token deployments on Ethereum/Ropsten/Polygon between 2018 and 2021. Public addresses only — private keys and mnemonics explicitly NOT stored in this repo.',
    generatedAt: new Date().toISOString(),
    count: tokens.length,
    tokens,
  }, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
