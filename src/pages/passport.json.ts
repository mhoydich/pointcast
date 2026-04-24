import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import {
  PASSPORT_IMAGE_GENERATOR,
  PASSPORT_STAMPS,
  PASSPORT_STORAGE_KEY,
  getDailyPassportRoute,
  passportDateKey,
  passportDaySeed,
  passportStampSummary,
} from '../lib/passport';
import {
  PASSPORT_COMPANION_COLLECTION,
  PASSPORT_STAMP_COLLECTION,
  PASSPORT_STAMP_PRD_PATH,
  passportCompanionNounId,
} from '../lib/passport-mint';
import {
  PASSPORT_ACHIEVEMENTS,
  passportAchievementSummary,
} from '../lib/passport-achievements';
import posterSet from '../data/passport-posters.json';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const now = new Date();
  const today = passportDateKey(now);
  const dailyRoute = getDailyPassportRoute(now, 4);
  const firstCompanionId = passportCompanionNounId(PASSPORT_STAMPS[0]);
  const lastCompanionId = passportCompanionNounId(PASSPORT_STAMPS[PASSPORT_STAMPS.length - 1]);

  const payload = {
    $schema: 'https://pointcast.xyz/passport.json',
    name: 'PointCast Station Passport',
    description:
      `A client-side stamp board for the 100-mile local lens. El Segundo is the origin stamp; the ${PASSPORT_STAMPS.length - 1} route and field stations make the collection. Stamps are localStorage in v0, mint a live Visit Noun companion proof now, and are metadata-ready for a dedicated Passport Stamps FA2.`,
    home: 'https://pointcast.xyz/passport',
    generatedAt: now.toISOString(),
    date: today,
    daySeed: passportDaySeed(now),
    storage: {
      mechanism: 'localStorage (client-only, v0)',
      key: PASSPORT_STORAGE_KEY,
      schema:
        '{ version: 1, updatedAt: ISO-string, stamps: { [slug]: { slug, at, date, station, code } }, mints: { [slug]: { mode, contract, tokenId, nounId?, opHash, tzktUrl, at } } }',
      future:
        'KV tally + wallet-signed stamp attestations can read the same slug/code/date shape.',
    },
    minting: {
      current: {
        ...PASSPORT_COMPANION_COLLECTION,
        purpose:
          `Browser stamp buttons call mint_noun(${firstCompanionId}-${lastCompanionId}) as a live Tezos companion proof for each passport stamp.`,
        tzkt: PASSPORT_COMPANION_COLLECTION.contract
          ? `https://tzkt.io/${PASSPORT_COMPANION_COLLECTION.contract}`
          : null,
      },
      future: PASSPORT_STAMP_COLLECTION,
      prd: `https://pointcast.xyz${PASSPORT_STAMP_PRD_PATH}`,
      note:
        'The current on-chain object is a Visit Noun companion. True stamp-art minting requires originating the Passport Stamps FA2 in the PRD.',
    },
    imageGenerator: {
      ...PASSPORT_IMAGE_GENERATOR,
      note:
        'PointCast target for generated stamp art. Public OpenAI docs checked on 2026-04-21 list GPT Image 1.5 as the visible reference model; this manifest records the project default requested by Mike.',
    },
    posters: {
      name: posterSet.name,
      url: 'https://pointcast.xyz/passport/posters',
      jsonUrl: 'https://pointcast.xyz/passport/posters.json',
      count: posterSet.posters.length,
      generator: posterSet.generator,
      items: posterSet.posters.map((poster) => ({
        slug: poster.slug,
        number: poster.number,
        title: poster.title,
        subtitle: poster.subtitle,
        stampCodes: poster.stampCodes,
        stationSlugs: poster.stationSlugs,
        image: `https://pointcast.xyz${poster.image}`,
        sourceImage: `https://pointcast.xyz${poster.sourceImage}`,
        prompt: poster.prompt,
      })),
    },
    visuals: {
      book: {
        name: 'PointCast Station Passport Book',
        url: 'https://pointcast.xyz/passport/book',
        jsonUrl: 'https://pointcast.xyz/passport/book.json',
        coverImage: `https://pointcast.xyz${posterSet.posters[0].image}`,
        description:
          'A tactile booklet view that shares the same localStorage stamp state as /passport.',
      },
      collection: {
        name: 'PointCast Passport Collection Cabinet',
        url: 'https://pointcast.xyz/passport/collection',
        jsonUrl: 'https://pointcast.xyz/passport/collection.json',
        description:
          'A cabinet view for the stamp sheet, poster set, book, metadata links, and mint status.',
      },
      routes: {
        name: 'PointCast Passport Route Achievements',
        url: 'https://pointcast.xyz/passport/routes',
        jsonUrl: 'https://pointcast.xyz/passport/routes.json',
        count: PASSPORT_ACHIEVEMENTS.length,
        description:
          'Route visas inferred from the shared browser-local passport stamp state.',
      },
      receipts: {
        name: 'PointCast Passport Mint Receipts',
        url: 'https://pointcast.xyz/passport/receipts',
        jsonUrl: 'https://pointcast.xyz/passport/receipts.json',
        description:
          'Client-side receipt cards for wallet-signed companion proof broadcasts.',
      },
      posters: {
        name: posterSet.name,
        url: 'https://pointcast.xyz/passport/posters',
        jsonUrl: 'https://pointcast.xyz/passport/posters.json',
        count: posterSet.posters.length,
      },
    },
    routes: {
      name: 'PointCast Passport Route Achievements',
      url: 'https://pointcast.xyz/passport/routes',
      jsonUrl: 'https://pointcast.xyz/passport/routes.json',
      count: PASSPORT_ACHIEVEMENTS.length,
      items: PASSPORT_ACHIEVEMENTS.map((achievement) => passportAchievementSummary(achievement)),
    },
    receipts: {
      name: 'PointCast Passport Mint Receipts',
      url: 'https://pointcast.xyz/passport/receipts',
      jsonUrl: 'https://pointcast.xyz/passport/receipts.json',
      sourceOfTruth:
        'Client-side mints saved under localStorage mints.{slug} after wallet approval.',
    },
    totals: {
      stamps: PASSPORT_STAMPS.length,
      origin: 1,
      stations: PASSPORT_STAMPS.length - 1,
      routeAchievements: PASSPORT_ACHIEVEMENTS.length,
    },
    dailyRoute: dailyRoute.map((stamp, index) => ({
      order: index + 1,
      slug: stamp.slug,
      code: stamp.code,
      name: stamp.name,
      miles: stamp.miles,
      direction: stamp.direction,
      prompt: stamp.prompt,
      action: stamp.localAction,
      url: `https://pointcast.xyz${stamp.links.passport}`,
      tvUrl: `https://pointcast.xyz${stamp.links.tv}`,
      image: passportStampSummary(stamp, blocks).image,
    })),
    stamps: PASSPORT_STAMPS.map((stamp) => passportStampSummary(stamp, blocks)),
    adjacent: {
      local: 'https://pointcast.xyz/local',
      localJson: 'https://pointcast.xyz/local.json',
      tv: 'https://pointcast.xyz/tv',
      coffeeMap: 'https://pointcast.xyz/collabs/map',
      beacon: 'https://pointcast.xyz/beacon',
      here: 'https://pointcast.xyz/here',
      passportBook: 'https://pointcast.xyz/passport/book',
      passportBookJson: 'https://pointcast.xyz/passport/book.json',
      passportCollection: 'https://pointcast.xyz/passport/collection',
      passportCollectionJson: 'https://pointcast.xyz/passport/collection.json',
      passportRoutes: 'https://pointcast.xyz/passport/routes',
      passportRoutesJson: 'https://pointcast.xyz/passport/routes.json',
      passportReceipts: 'https://pointcast.xyz/passport/receipts',
      passportReceiptsJson: 'https://pointcast.xyz/passport/receipts.json',
      agents: 'https://pointcast.xyz/agents.json',
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
