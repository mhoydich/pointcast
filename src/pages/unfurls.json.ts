import type { APIRoute } from 'astro';
import { absoluteImage, absoluteUrl, getMiniShrineDescription, UNFURL_SHRINES } from '../lib/unfurl-shrines';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/unfurls.json',
    title: 'PointCast URL unfurl shrines',
    version: '2.0',
    description: 'Canonical URL preview manifest for high-signal PointCast routes, plus the source data for the /unfurls shrine builder.',
    updatedAt: new Date().toISOString(),
    count: UNFURL_SHRINES.length,
    builder: {
      url: 'https://pointcast.xyz/unfurls#builder',
      requiredFields: ['path', 'miniPath', 'title', 'description', 'image', 'kind', 'audience', 'ritual'],
      optionalFields: ['proof', 'shrineSet'],
    },
    rule: {
      human: 'When you send a PointCast link, its preview should read like a mini shrine: stable image, clear object, proof links, and a single next action.',
      miniShrinePattern: 'https://pointcast.xyz/u/{slug}',
    },
    shrines: UNFURL_SHRINES.map((shrine) => ({
      ...shrine,
      url: absoluteUrl(shrine.path),
      miniUrl: absoluteUrl(shrine.miniPath),
      miniTitle: `${shrine.title} · mini shrine`,
      miniDescription: getMiniShrineDescription(shrine),
      image: absoluteImage(shrine.image),
      proof: shrine.proof.map(absoluteUrl),
      validators: {
        opengraph: `https://www.opengraph.xyz/url/${encodeURIComponent(absoluteUrl(shrine.path))}`,
        miniShrineOpengraph: `https://www.opengraph.xyz/url/${encodeURIComponent(absoluteUrl(shrine.miniPath))}`,
        twitterCard: `https://cards-dev.twitter.com/validator?url=${encodeURIComponent(absoluteUrl(shrine.path))}`,
        facebookSharing: `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(absoluteUrl(shrine.path))}`,
      },
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
