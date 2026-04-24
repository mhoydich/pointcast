import type { APIRoute } from 'astro';
import {
  PASSPORT_IMAGE_GENERATOR,
  PASSPORT_STAMPS,
  PASSPORT_STORAGE_KEY,
  passportDateKey,
} from '../../lib/passport';
import {
  PASSPORT_COMPANION_COLLECTION,
  PASSPORT_STAMP_COLLECTION,
  PASSPORT_STAMP_PRD_PATH,
  passportStampMintPlan,
} from '../../lib/passport-mint';

const absolute = (path: string) => `https://pointcast.xyz${path}`;

export const GET: APIRoute = async () => {
  const now = new Date();
  const receipts = PASSPORT_STAMPS.map((stamp) => {
    const mint = passportStampMintPlan(stamp);

    return {
      slug: stamp.slug,
      code: stamp.code,
      name: stamp.name,
      receiptUrl: `https://pointcast.xyz/passport/receipts#${stamp.slug}`,
      passportUrl: absolute(stamp.links.passport),
      art: absolute(`/passport/art/${stamp.slug}.svg`),
      metadata: absolute(`/passport/stamps/${stamp.slug}.json`),
      currentMint: mint.current,
      futureMint: mint.future,
      localStorageMintKey: `mints.${stamp.slug}`,
    };
  });

  const payload = {
    $schema: 'https://pointcast.xyz/passport/receipts.json',
    name: 'PointCast Passport Mint Receipts',
    description:
      'Client-side receipt templates for Station Passport mint broadcasts. Runtime status is read from localStorage after wallet approval.',
    home: 'https://pointcast.xyz/passport/receipts',
    generatedAt: now.toISOString(),
    date: passportDateKey(now),
    storage: {
      mechanism: 'localStorage (client-only, v0)',
      key: PASSPORT_STORAGE_KEY,
      mintShape:
        '{ [slug]: { mode, contract, tokenId, nounId?, opHash, tzktUrl, at } }',
    },
    minting: {
      current: PASSPORT_COMPANION_COLLECTION,
      future: PASSPORT_STAMP_COLLECTION,
      prd: absolute(PASSPORT_STAMP_PRD_PATH),
      truthLabel:
        'Receipt cards become confirmed only after a wallet-signed transaction is broadcast and stored by the passport page.',
    },
    imageGenerator: PASSPORT_IMAGE_GENERATOR,
    receipts,
    adjacent: {
      passport: 'https://pointcast.xyz/passport',
      routes: 'https://pointcast.xyz/passport/routes',
      book: 'https://pointcast.xyz/passport/book',
      collection: 'https://pointcast.xyz/passport/collection',
      manifest: 'https://pointcast.xyz/passport.json',
    },
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
