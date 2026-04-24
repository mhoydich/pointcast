import type { APIRoute } from 'astro';
import { PASSPORT_IMAGE_GENERATOR, PASSPORT_STORAGE_KEY, passportDateKey } from '../../lib/passport';
import {
  PASSPORT_ACHIEVEMENTS,
  passportAchievementSummary,
} from '../../lib/passport-achievements';
import posterSet from '../../data/passport-posters.json';

const absolute = (path: string) => `https://pointcast.xyz${path}`;
const postersBySlug = new Map(posterSet.posters.map((poster) => [poster.slug, poster]));

export const GET: APIRoute = async () => {
  const now = new Date();
  const routes = PASSPORT_ACHIEVEMENTS.map((achievement) => {
    const poster = achievement.posterSlug ? postersBySlug.get(achievement.posterSlug) : null;

    return {
      ...passportAchievementSummary(achievement),
      poster: poster
        ? {
            slug: poster.slug,
            image: absolute(poster.image),
            sourceImage: absolute(poster.sourceImage),
          }
        : null,
    };
  });

  const payload = {
    $schema: 'https://pointcast.xyz/passport/routes.json',
    name: 'PointCast Passport Route Achievements',
    description:
      'Route achievements for the Station Passport. Completion is inferred from browser-local stamp slugs.',
    home: 'https://pointcast.xyz/passport/routes',
    generatedAt: now.toISOString(),
    date: passportDateKey(now),
    storage: {
      mechanism: 'localStorage (client-only, v0)',
      key: PASSPORT_STORAGE_KEY,
      completionRule: 'A route is complete when every stampSlug in the achievement exists in passport.stamps.',
    },
    imageGenerator: PASSPORT_IMAGE_GENERATOR,
    routes,
    adjacent: {
      passport: 'https://pointcast.xyz/passport',
      book: 'https://pointcast.xyz/passport/book',
      collection: 'https://pointcast.xyz/passport/collection',
      receipts: 'https://pointcast.xyz/passport/receipts',
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
