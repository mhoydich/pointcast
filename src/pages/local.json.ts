/**
 * /local.json — machine mirror of /local. The 100-mile-radius lens as
 * a single agent-ingestable payload: anchor coordinates, radius,
 * name-drops, stations (with direction + miles), and in-range blocks
 * keyed to their canonical /b/{id} URLs and JSON mirrors.
 *
 * Completes the agent-native pattern ("every human surface has a
 * machine mirror") for the /local surface landed in the 8:11 tick.
 * Data shared with /local.astro via src/lib/local.ts.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { CHANNELS } from '../lib/channels';
import {
  ANCHOR,
  RADIUS_MILES,
  RADIUS_METERS,
  NAME_DROPS,
  NATURE_NOTES,
  NATIVE_PLANTING_PALETTE,
  SEASONAL_SIGNALS,
  STATIONS,
  filterInRangeBlocks,
  filterBlocksForStation,
  getStationPath,
} from '../lib/local';

export const GET: APIRoute = async () => {
  const blocks = (await getCollection('blocks', ({ data }) => !data.draft))
    .sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());

  const inRange = filterInRangeBlocks(blocks);
  const stations = [...STATIONS]
    .sort((a, b) => a.miles - b.miles)
    .map((station) => ({
      ...station,
      blockCount: filterBlocksForStation(blocks, station).length,
      url: `https://pointcast.xyz${getStationPath(station)}`,
    }));

  const payload = {
    $schema: 'https://pointcast.xyz/local.json',
    name: 'PointCast · Local (100mi)',
    description:
      "PointCast's 100-mile lens. El Segundo-anchored. Name-drops, stations, in-range blocks, and the geometry. Data layer for /tv STATIONS mode and for any agent doing location-aware queries against PointCast.",
    home: 'https://pointcast.xyz/local',
    generatedAt: new Date().toISOString(),

    // Geometry — schema.org GeoCircle-compatible.
    anchor: {
      name: ANCHOR.name,
      coords: ANCHOR.coords,
    },
    radiusMiles: RADIUS_MILES,
    radiusMeters: RADIUS_METERS,

    // Mike's verbatim ES institutions (from block 0276).
    nameDrops: NAME_DROPS,

    // Dune / flora / local nature module shared with /local.
    nature: {
      moduleUrl: 'https://pointcast.xyz/local#nature',
      fieldGuideUrl: 'https://pointcast.xyz/nature',
      fieldGuideJson: 'https://pointcast.xyz/nature.json',
      blockUrl: 'https://pointcast.xyz/b/0330',
      plantingBlockUrl: 'https://pointcast.xyz/b/0331',
      notes: NATURE_NOTES,
      plantingPalette: NATIVE_PLANTING_PALETTE,
      seasonalSignals: SEASONAL_SIGNALS,
    },

    // Stations within the radius, sorted by distance to anchor.
    stations,

    // Blocks whose meta.location resolves inside the radius.
    inRangeBlockCount: inRange.length,
    inRangeBlocks: inRange.map((b) => {
      const ch = CHANNELS[b.data.channel];
      return {
        id: b.data.id,
        title: b.data.title,
        channel: { code: ch.code, slug: ch.slug, name: ch.name },
        type: b.data.type,
        location: b.data.meta?.location ?? null,
        timestamp: b.data.timestamp.toISOString(),
        mood: b.data.mood ?? null,
        moodUrl: b.data.mood ? `https://pointcast.xyz/mood/${b.data.mood}` : null,
        url: `https://pointcast.xyz/b/${b.data.id}`,
        jsonUrl: `https://pointcast.xyz/b/${b.data.id}.json`,
      };
    }),

    // Adjacent surfaces — curated cross-links so an agent following
    // /local.json can fan out to related endpoints without scraping HTML.
    adjacent: {
      beacon: 'https://pointcast.xyz/beacon',
      beaconJson: 'https://pointcast.xyz/beacon.json',
      nameDropsEditorial: 'https://pointcast.xyz/b/0276',
      radiusEditorial: 'https://pointcast.xyz/b/0254',
      nature: 'https://pointcast.xyz/nature',
      natureJson: 'https://pointcast.xyz/nature.json',
      elSegundoNature: 'https://pointcast.xyz/b/0330',
      esNameDropsPoll: 'https://pointcast.xyz/poll/es-name-drops',
      broadcastTv: 'https://pointcast.xyz/tv',
      goodFeelsShop: 'https://shop.getgoodfeels.com',
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
