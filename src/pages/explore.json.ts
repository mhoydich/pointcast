/**
 * /explore.json — agent-legible feature manifest.
 *
 * Mirrors what /explore renders for humans: every page surface bucketed
 * by category, every channel, every external app. Agents can crawl this
 * to discover what exists without scraping HTML.
 */
import type { APIRoute } from 'astro';
import { FEATURES, CATEGORIES, countByCategory } from '../lib/explore';
import { POINTCAST_APPS } from '../lib/pointcast-apps';
import { CHANNELS } from '../lib/channels';

export const GET: APIRoute = () => {
  const counts = countByCategory();

  const payload = {
    $schema: 'https://pointcast.xyz/explore.json',
    updatedAt: new Date().toISOString(),
    total: FEATURES.length,
    categories: CATEGORIES.map((c) => ({
      key: c.key,
      label: c.label,
      blurb: c.blurb,
      count: counts[c.key] ?? 0,
    })),
    features: FEATURES.map((f) => ({
      slug: f.slug,
      url: `https://pointcast.xyz${f.slug}`,
      title: f.title,
      description: f.description,
      category: f.category,
    })),
    channels: Object.values(CHANNELS).map((ch) => ({
      code: ch.code,
      slug: ch.slug,
      name: ch.name,
      url: `https://pointcast.xyz/c/${ch.slug}`,
      purpose: ch.purpose,
      color: ch.color600,
    })),
    apps: POINTCAST_APPS.map((a) => ({
      slug: a.slug,
      name: a.name,
      url: a.url,
      description: a.description,
      channel: a.channel,
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
