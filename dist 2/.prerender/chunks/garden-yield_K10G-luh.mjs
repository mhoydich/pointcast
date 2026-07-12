import { N as NATIVE_PLANTING_PALETTE } from './local_DC-fTB3e.mjs';
import { G as GARDEN_YIELD_PLANTS, b as GARDEN_YIELD_SOURCE_BLOCK, e as GARDEN_YIELD_LOOP, a as GARDEN_YIELD_SITES, c as GARDEN_YIELD_METRICS, d as GARDEN_YIELD_CONTEXT } from './garden-yield_wWVjRngN.mjs';

const paletteBySlug = new Map(NATIVE_PLANTING_PALETTE.map((plant) => [plant.slug, plant]));
const GET = async () => {
  const payload = {
    $schema: "https://pointcast.xyz/garden-yield.json",
    name: GARDEN_YIELD_CONTEXT.name,
    description: GARDEN_YIELD_CONTEXT.purpose,
    home: GARDEN_YIELD_CONTEXT.url,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    archiveBlock: {
      id: "0336",
      url: "https://pointcast.xyz/b/0336",
      jsonUrl: "https://pointcast.xyz/b/0336.json"
    },
    sourceBlock: GARDEN_YIELD_SOURCE_BLOCK,
    mode: "ecological value yield, not financial yield",
    metrics: GARDEN_YIELD_METRICS,
    sitePresets: GARDEN_YIELD_SITES,
    plants: GARDEN_YIELD_PLANTS.map((plant) => {
      const palette = paletteBySlug.get(plant.slug);
      return {
        ...plant,
        name: palette?.name ?? plant.slug,
        scientific: palette?.scientific ?? null,
        form: palette?.form ?? null,
        source: palette ? { label: palette.sourceLabel, url: palette.sourceUrl } : null
      };
    }),
    establishmentLoop: GARDEN_YIELD_LOOP,
    related: {
      nature: "https://pointcast.xyz/nature",
      natureJson: "https://pointcast.xyz/nature.json",
      plantingPaletteBlock: GARDEN_YIELD_SOURCE_BLOCK.url,
      plantingPaletteJson: GARDEN_YIELD_SOURCE_BLOCK.jsonUrl
    }
  };
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      "Access-Control-Allow-Origin": "*"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
