import type { APIRoute } from 'astro';
import { PRESS_RELEASES, pressReleaseJsonUrl, pressReleaseUrl } from '../lib/press-wire';

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://schema.org/ItemList',
    name: 'PointCast Press Wire',
    description: 'Owned PointCast product filings with named issuers, primary sources, machine-readable twins, and visible disclosure.',
    generatedAt: new Date().toISOString(),
    canonical: 'https://pointcast.xyz/press',
    rss: 'https://pointcast.xyz/press.xml',
    policy: {
      disclosure: 'Every current filing is an official PointCast owned announcement, not independent reporting or paid client coverage.',
      corrections: 'Material corrections remain visible on the canonical filing and in its JSON twin.',
      coverage: 'Publication or syndication does not guarantee independent editorial coverage.',
    },
    count: PRESS_RELEASES.length,
    releases: PRESS_RELEASES.map((release) => ({
      ...release,
      canonicalUrl: pressReleaseUrl(release),
      jsonUrl: pressReleaseJsonUrl(release),
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=120',
    },
  });
};
