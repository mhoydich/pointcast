import { g as getTvAssetInventory, d as TV_SOURCE_RUNS, T as TV_ASSET_GROUPS, b as TV_STATION_NAV, c as TV_SURFACE_NAV, a as TV_PRIMARY_NAV } from './tv-assets_BEJURzHD.mjs';

const GET = async () => {
  const inventory = getTvAssetInventory();
  return new Response(JSON.stringify({
    $schema: "https://pointcast.xyz/tv/assets.json",
    name: "PointCast TV asset library",
    description: "Central manifest for PointCast TV surfaces, station presets, published public assets, and source design runs.",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    urls: {
      human: "https://pointcast.xyz/tv/assets",
      broadcast: "https://pointcast.xyz/tv",
      local: "https://pointcast.xyz/local"
    },
    totals: inventory.totals,
    navigation: {
      primary: TV_PRIMARY_NAV,
      surfaces: TV_SURFACE_NAV,
      stations: TV_STATION_NAV
    },
    assetGroups: TV_ASSET_GROUPS,
    publishedAssets: inventory.assets.map((asset) => ({
      ...asset,
      url: `https://pointcast.xyz${asset.href}`
    })),
    sourceRuns: TV_SOURCE_RUNS
  }, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
