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
import {
  PASSPORT_ACHIEVEMENTS,
  passportAchievementSummary,
} from '../../lib/passport-achievements';
import posterSet from '../../data/passport-posters.json';

const absolute = (path: string) => `https://pointcast.xyz${path}`;

export const GET: APIRoute = async () => {
  const now = new Date();
  const firstCompanionId = passportCompanionNounId(PASSPORT_STAMPS[0]);
  const lastCompanionId = passportCompanionNounId(PASSPORT_STAMPS[PASSPORT_STAMPS.length - 1]);
  const stampSheet = PASSPORT_STAMPS.map((stamp) => ({
    ...stamp,
    art: absolute(`/passport/art/${stamp.slug}.svg`),
    metadata: absolute(`/passport/stamps/${stamp.slug}.json`),
    passportUrl: absolute(`/passport#${stamp.slug}`),
    bookUrl: absolute(`/passport/book#${stamp.slug}`),
    mint: passportStampMintPlan(stamp),
  }));

  const payload = {
    $schema: 'https://pointcast.xyz/passport/collection.json',
    name: 'PointCast Passport Collection Cabinet',
    description:
      'The collection cabinet for Station Passport stamps, book, poster set, metadata, and Tezos mint status.',
    home: 'https://pointcast.xyz/passport/collection',
    generatedAt: now.toISOString(),
    date: passportDateKey(now),
    storage: {
      mechanism: 'localStorage (client-only, v0)',
      key: PASSPORT_STORAGE_KEY,
      sharedWith: ['https://pointcast.xyz/passport', 'https://pointcast.xyz/passport/book'],
    },
    objects: {
      book: {
        name: 'Station Passport Book',
        url: 'https://pointcast.xyz/passport/book',
        jsonUrl: 'https://pointcast.xyz/passport/book.json',
        coverImage: absolute(posterSet.posters[0].image),
        spreads: Math.ceil(PASSPORT_STAMPS.length / 4) + 2,
      },
      stampSheet: {
        name: 'Station Stamp Sheet',
        count: stampSheet.length,
        items: stampSheet,
      },
      posterSet: {
        name: posterSet.name,
        url: 'https://pointcast.xyz/passport/posters',
        jsonUrl: 'https://pointcast.xyz/passport/posters.json',
        generator: posterSet.generator,
        count: posterSet.posters.length,
        items: posterSet.posters.map((poster) => ({
          ...poster,
          image: absolute(poster.image),
          sourceImage: absolute(poster.sourceImage),
        })),
      },
      routeAchievements: {
        name: 'Route Visas',
        url: 'https://pointcast.xyz/passport/routes',
        jsonUrl: 'https://pointcast.xyz/passport/routes.json',
        count: PASSPORT_ACHIEVEMENTS.length,
        items: PASSPORT_ACHIEVEMENTS.map((achievement) => passportAchievementSummary(achievement)),
      },
      receipts: {
        name: 'Mint Receipt Drawer',
        url: 'https://pointcast.xyz/passport/receipts',
        jsonUrl: 'https://pointcast.xyz/passport/receipts.json',
      },
    },
    minting: {
      current: {
        ...PASSPORT_COMPANION_COLLECTION,
        purpose: `Live wallet action for ${PASSPORT_STAMPS[0].code}-${PASSPORT_STAMPS[PASSPORT_STAMPS.length - 1].code} companion proofs through Visit Nouns #${firstCompanionId}-#${lastCompanionId}.`,
      },
      future: {
        ...PASSPORT_STAMP_COLLECTION,
        purpose: 'Native generated stamp-art mints after Passport Stamps FA2 origination.',
      },
      prd: absolute(PASSPORT_STAMP_PRD_PATH),
      truthLabel:
        'The collection can call a live Tezos companion mint path from the passport. Native stamp-art tokens are not live until a Passport Stamps FA2 KT1 is configured.',
    },
    imageGenerator: PASSPORT_IMAGE_GENERATOR,
    endpoints: {
      passport: 'https://pointcast.xyz/passport',
      passportJson: 'https://pointcast.xyz/passport.json',
      book: 'https://pointcast.xyz/passport/book',
      bookJson: 'https://pointcast.xyz/passport/book.json',
      routes: 'https://pointcast.xyz/passport/routes',
      routesJson: 'https://pointcast.xyz/passport/routes.json',
      receipts: 'https://pointcast.xyz/passport/receipts',
      receiptsJson: 'https://pointcast.xyz/passport/receipts.json',
      posters: 'https://pointcast.xyz/passport/posters',
      postersJson: 'https://pointcast.xyz/passport/posters.json',
      stampMetadata: 'https://pointcast.xyz/passport/stamps/{slug}.json',
      stampArt: 'https://pointcast.xyz/passport/art/{slug}.svg',
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
