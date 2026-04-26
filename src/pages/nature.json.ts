/**
 * /nature.json - machine mirror of /nature.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import {
  GARDEN_YIELD_CONTEXT,
  GARDEN_YIELD_METRICS,
  GARDEN_YIELD_SITES,
  GARDEN_YIELD_SOURCE_BLOCK,
} from '../lib/garden-yield';
import {
  ANCHOR,
  NATURE_NOTES,
  NATURE_OVERVIEW_AREAS,
  NATIVE_PLANTING_PALETTE,
  PLANTING_VALUE_SYSTEM,
  PLANTING_YIELD_SITES,
  SEASONAL_SIGNALS,
  filterInRangeBlocks,
} from '../lib/local';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const related = filterInRangeBlocks(blocks)
    .filter((block) => block.data.channel === 'GDN' || block.data.meta?.series === 'local nature')
    .slice(0, 20);

  const payload = {
    $schema: 'https://pointcast.xyz/nature.json',
    name: 'PointCast · Nature',
    description:
      'El Segundo field guide: local flora, dune habitat, and the El Segundo blue butterfly.',
    home: 'https://pointcast.xyz/nature',
    generatedAt: new Date().toISOString(),
    anchor: {
      name: ANCHOR.name,
      coords: ANCHOR.coords,
    },
    sourceBlock: {
      id: '0330',
      url: 'https://pointcast.xyz/b/0330',
      jsonUrl: 'https://pointcast.xyz/b/0330.json',
    },
    overview: {
      title: 'El Segundo nature overview',
      description:
        'A high-level read of the local nature register: ocean, flora, trees, and wildlife before the detailed dune field guide.',
      areas: NATURE_OVERVIEW_AREAS,
      signals: NATURE_OVERVIEW_AREAS.flatMap((area) => area.signals),
    },
    plantingBlock: {
      id: '0331',
      url: 'https://pointcast.xyz/b/0331',
      jsonUrl: 'https://pointcast.xyz/b/0331.json',
    },
    valueYieldSystem: {
      name: GARDEN_YIELD_CONTEXT.name,
      description: GARDEN_YIELD_CONTEXT.purpose,
      url: GARDEN_YIELD_CONTEXT.url,
      jsonUrl: GARDEN_YIELD_CONTEXT.jsonUrl,
      sourceBlock: GARDEN_YIELD_SOURCE_BLOCK,
      metrics: GARDEN_YIELD_METRICS.map((metric) => metric.id),
      sitePresets: GARDEN_YIELD_SITES.map((site) => site.id),
    },
    notes: NATURE_NOTES,
    plantingPalette: NATIVE_PLANTING_PALETTE,
    nativePlantingYield: {
      ...PLANTING_VALUE_SYSTEM,
      jsonUrl: 'https://pointcast.xyz/nature-yield.json',
      sitePlans: PLANTING_YIELD_SITES,
    },
    seasonalSignals: SEASONAL_SIGNALS,
    sources: [...new Map([...NATURE_NOTES, ...NATIVE_PLANTING_PALETTE].map((item) => [
      item.sourceUrl,
      { label: item.sourceLabel, url: item.sourceUrl },
    ])).values()],
    transect: [
      { step: 1, label: 'Sand', signal: 'Open dune, beach suncups, wind, sparse growth.' },
      { step: 2, label: 'Buckwheat', signal: 'Seacliff buckwheat anchors the butterfly story.' },
      { step: 3, label: 'Scrub', signal: 'Coyote brush and deerweed hold structure.' },
      { step: 4, label: 'Town', signal: 'Balconies, yards, parks, and tiny native patches.' },
    ],
    fieldRules: [
      'Stay on paths around protected dune habitat.',
      'Plant climate-matched California natives where possible.',
      'Notice small seasonal signals: flowerheads, seed pods, wind shadow, and return.',
    ],
    relatedBlockCount: related.length,
    relatedBlocks: related.map((block) => {
      const channel = CHANNELS[block.data.channel];
      return {
        id: block.data.id,
        title: block.data.title,
        dek: block.data.dek ?? null,
        channel: { code: channel.code, slug: channel.slug, name: channel.name },
        type: block.data.type,
        location: block.data.meta?.location ?? null,
        timestamp: block.data.timestamp.toISOString(),
        url: `https://pointcast.xyz/b/${block.data.id}`,
        jsonUrl: `https://pointcast.xyz/b/${block.data.id}.json`,
      };
    }),
    adjacent: {
      houseplants: 'https://pointcast.xyz/houseplants',
      houseplantsJson: 'https://pointcast.xyz/houseplants.json',
      houseplantBlock: 'https://pointcast.xyz/b/0333',
      gardenYield: GARDEN_YIELD_CONTEXT.url,
      gardenYieldJson: GARDEN_YIELD_CONTEXT.jsonUrl,
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
