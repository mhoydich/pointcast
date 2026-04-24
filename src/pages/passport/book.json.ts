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
  passportCompanionNounId,
  passportStampMintPlan,
} from '../../lib/passport-mint';
import posterSet from '../../data/passport-posters.json';

const absolute = (path: string) => `https://pointcast.xyz${path}`;

const stampSpreadTitles = [
  'Origin + Strand',
  'Westside + Mesh',
  'County + Horizon',
  'Edges + Wildcard',
  'Airgate + Arena',
  'Studio + North Coast',
];
const stampSpreads = Array.from({ length: Math.ceil(PASSPORT_STAMPS.length / 4) }, (_, index) => {
  const stamps = PASSPORT_STAMPS.slice(index * 4, index * 4 + 4);

  return {
    index: index + 1,
    title: stampSpreadTitles[index] ?? `Stamp Sheet ${index + 1}`,
    pages: [
      {
        side: 'left',
        stamps: stamps.slice(0, 2).map((stamp) => ({
          ...stamp,
          art: absolute(`/passport/art/${stamp.slug}.svg`),
          metadata: absolute(`/passport/stamps/${stamp.slug}.json`),
          mint: passportStampMintPlan(stamp),
        })),
      },
      {
        side: 'right',
        stamps: stamps.slice(2).map((stamp) => ({
          ...stamp,
          art: absolute(`/passport/art/${stamp.slug}.svg`),
          metadata: absolute(`/passport/stamps/${stamp.slug}.json`),
          mint: passportStampMintPlan(stamp),
        })),
      },
    ],
  };
});

export const GET: APIRoute = async () => {
  const now = new Date();
  const firstCompanionId = passportCompanionNounId(PASSPORT_STAMPS[0]);
  const lastCompanionId = passportCompanionNounId(PASSPORT_STAMPS[PASSPORT_STAMPS.length - 1]);
  const payload = {
    $schema: 'https://pointcast.xyz/passport/book.json',
    name: 'PointCast Station Passport Book',
    description:
      'A tactile booklet view for the Station Passport collection: cover, identity page, stamp spreads, and a collection receipt.',
    home: 'https://pointcast.xyz/passport/book',
    generatedAt: now.toISOString(),
    date: passportDateKey(now),
    storage: {
      mechanism: 'localStorage (client-only, v0)',
      key: PASSPORT_STORAGE_KEY,
      sharedWith: ['https://pointcast.xyz/passport', 'https://pointcast.xyz/passport/collection'],
    },
    cover: {
      poster: posterSet.posters[0].title,
      image: absolute(posterSet.posters[0].image),
      backImage: absolute(posterSet.posters[9].image),
    },
    spreads: [
      {
        index: 0,
        title: 'Cover',
        pages: [
          { side: 'left', role: 'cover', image: absolute(posterSet.posters[0].image) },
          {
            side: 'right',
            role: 'identity',
            issuingOffice: 'El Segundo Broadcast Desk',
            proofPath: `${PASSPORT_COMPANION_COLLECTION.name} #${firstCompanionId}-#${lastCompanionId}`,
            nativeStampStatus: PASSPORT_STAMP_COLLECTION.status,
          },
        ],
      },
      ...stampSpreads,
      {
        index: stampSpreads.length + 1,
        title: 'Back Cover',
        pages: [
          {
            side: 'left',
            role: 'receipt',
            knows: [
              `${PASSPORT_STAMPS.length} stable station and expansion slugs`,
              'Browser-local collection state',
              'Live Tezos companion proof plan',
              'Native Passport Stamps FA2 source pending origination',
            ],
          },
          { side: 'right', role: 'poster', image: absolute(posterSet.posters[9].image) },
        ],
      },
    ],
    minting: {
      current: PASSPORT_COMPANION_COLLECTION,
      future: PASSPORT_STAMP_COLLECTION,
      prd: absolute(PASSPORT_STAMP_PRD_PATH),
      truthLabel:
        'Live wallet mints currently produce Visit Nouns companion proofs; generated stamp-art minting waits for Passport Stamps FA2 origination.',
    },
    imageGenerator: PASSPORT_IMAGE_GENERATOR,
    adjacent: {
      passport: 'https://pointcast.xyz/passport',
      collection: 'https://pointcast.xyz/passport/collection',
      collectionJson: 'https://pointcast.xyz/passport/collection.json',
      routes: 'https://pointcast.xyz/passport/routes',
      routesJson: 'https://pointcast.xyz/passport/routes.json',
      receipts: 'https://pointcast.xyz/passport/receipts',
      receiptsJson: 'https://pointcast.xyz/passport/receipts.json',
      posters: 'https://pointcast.xyz/passport/posters',
      postersJson: 'https://pointcast.xyz/passport/posters.json',
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
