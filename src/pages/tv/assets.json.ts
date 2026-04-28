import type { APIRoute } from 'astro';
import {
  TV_ASSET_GROUPS,
  TV_PRIMARY_NAV,
  TV_SOURCE_RUNS,
  TV_STATION_NAV,
  TV_SURFACE_NAV,
  getTvAssetInventory,
} from '../../lib/tv-assets';

export const GET: APIRoute = async () => {
  const inventory = getTvAssetInventory();

  return new Response(JSON.stringify({
    $schema: 'https://pointcast.xyz/tv/assets.json',
    name: 'PointCast TV asset library',
    description: 'Central manifest for PointCast TV surfaces, station presets, published public assets, and source design runs.',
    generatedAt: new Date().toISOString(),
    urls: {
      human: 'https://pointcast.xyz/tv/assets',
      broadcast: 'https://pointcast.xyz/tv',
      local: 'https://pointcast.xyz/local',
    },
    totals: inventory.totals,
    navigation: {
      primary: TV_PRIMARY_NAV,
      surfaces: TV_SURFACE_NAV,
      stations: TV_STATION_NAV,
    },
    assetGroups: TV_ASSET_GROUPS,
    publishedAssets: inventory.assets.map((asset) => ({
      ...asset,
      url: `https://pointcast.xyz${asset.href}`,
    })),
    sourceRuns: TV_SOURCE_RUNS,
  }, null, 2), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
};
