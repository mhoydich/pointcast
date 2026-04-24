import type { APIRoute } from 'astro';
import { PASSPORT_IMAGE_GENERATOR, PASSPORT_STAMPS } from '../../../lib/passport';
import {
  passportCompanionNounId,
  passportStampArtUrl,
  passportStampMetadataUrl,
  passportStampMintPlan,
} from '../../../lib/passport-mint';

export function getStaticPaths() {
  return PASSPORT_STAMPS.map((stamp) => ({ params: { slug: stamp.slug } }));
}

export const GET: APIRoute = async ({ params }) => {
  const stamp = PASSPORT_STAMPS.find((item) => item.slug === params.slug);
  if (!stamp) {
    return new Response(JSON.stringify({ error: 'stamp-not-found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
  }

  const mint = passportStampMintPlan(stamp);
  const body = {
    name: `PointCast Passport Stamp ${stamp.code} - ${stamp.name}`,
    symbol: 'PCPASS',
    decimals: 0,
    isBooleanAmount: false,
    description:
      `${stamp.name} stamp for the PointCast Station Passport. ${stamp.prompt} ` +
      'This metadata is ready for the dedicated Passport Stamps FA2; the live v0 proof mints a companion Visit Noun on Tezos mainnet.',
    displayUri: passportStampArtUrl(stamp),
    thumbnailUri: passportStampArtUrl(stamp),
    artifactUri: passportStampArtUrl(stamp),
    mime: 'image/svg+xml',
    creators: ['tz2FjJhB1gb9Xc2qNB7QgFkdBZkGCCRMxdFw'],
    contributors: ['PointCast', PASSPORT_IMAGE_GENERATOR.provider],
    publishers: ['PointCast'],
    date: '2026-04-21',
    language: 'en',
    rights: 'Creative Commons CC0 1.0 Universal',
    rightsUri: 'https://creativecommons.org/publicdomain/zero/1.0/',
    tags: ['pointcast', 'passport', 'station-stamp', stamp.slug, stamp.band, 'tezos'],
    externalUri: `https://pointcast.xyz${stamp.links.passport}`,
    attributes: [
      { name: 'code', value: stamp.code },
      { name: 'station', value: stamp.name },
      { name: 'band', value: stamp.band },
      { name: 'distance_miles', value: String(stamp.miles) },
      { name: 'direction', value: stamp.direction },
      { name: 'local_action', value: stamp.localAction },
      { name: 'proof', value: stamp.proof },
      { name: 'reward', value: stamp.reward },
      { name: 'image_generator', value: PASSPORT_IMAGE_GENERATOR.model },
      { name: 'companion_visit_noun_id', value: String(passportCompanionNounId(stamp)) },
    ],
    formats: [
      {
        uri: passportStampArtUrl(stamp),
        mimeType: 'image/svg+xml',
        dimensions: { value: '1024x1024', unit: 'px' },
      },
    ],
    minting: {
      metadataUri: passportStampMetadataUrl(stamp),
      ...mint,
    },
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
