interface Env {
  PC_STUDIO_KV?: KVNamespace;
}

type Composition = {
  id: string;
  kind: 'postcard' | 'stamp';
  workId: string;
  owner: string;
  title: string;
  message: string;
  credit: string;
  createdAt: string;
};

export const onRequestGet: PagesFunction<Env> = async ({ request, params, env }) => {
  const id = String(params.id || '').replace(/\.json$/i, '');
  if (!env.PC_STUDIO_KV || !/^[0-9a-f]{24}$/.test(id)) return new Response('Not found', { status: 404 });
  const composition = await env.PC_STUDIO_KV.get(`ess:composition:${id}`, 'json') as Composition | null;
  if (!composition) return new Response('Not found', { status: 404 });
  const origin = new URL(request.url).origin;
  const artifactUri = `${origin}/api/el-segundo-school/render/${id}.svg`;
  const metadata = {
    name: composition.title,
    description: `${composition.kind === 'stamp' ? 'Stampz custom stamp' : 'Passport postcard'} made from The El Segundo School archive by Michael Hoydich. ${composition.message}`.trim(),
    symbol: composition.kind === 'stamp' ? 'STAMPZ' : 'PCARD',
    artifactUri,
    displayUri: artifactUri,
    thumbnailUri: `https://el-segundo-school-archive.pages.dev/thumb/${composition.workId}.webp`,
    creators: ['tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'],
    minter: composition.owner,
    isBooleanAmount: true,
    formats: [{ uri: artifactUri, mimeType: 'image/svg+xml' }],
    attributes: [
      { name: 'Maker', value: composition.kind === 'stamp' ? 'Stampz' : 'Passport Postcard' },
      { name: 'Source work', value: composition.workId },
      { name: 'Place', value: 'El Segundo, California' },
      { name: 'Network', value: 'Tezos Mainnet' },
      { name: 'Price', value: '1 tez' },
    ],
    date: composition.createdAt,
    rights: 'Artist-published collector edition',
    sourceDisclosure: 'AI-assisted source image: Midjourney; composition directed by collector',
  };
  return new Response(JSON.stringify(metadata), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
};
