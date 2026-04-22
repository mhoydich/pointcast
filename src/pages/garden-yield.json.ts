/**
 * /garden-yield.json - machine mirror of the garden value-yield system.
 */
import type { APIRoute } from 'astro';
import { NATIVE_PLANTING_PALETTE } from '../lib/local';
import {
  GARDEN_YIELD_CONTEXT,
  GARDEN_YIELD_LOOP,
  GARDEN_YIELD_METRICS,
  GARDEN_YIELD_PLANTS,
  GARDEN_YIELD_SITES,
  GARDEN_YIELD_SOURCE_BLOCK,
} from '../lib/garden-yield';

const paletteBySlug = new Map(NATIVE_PLANTING_PALETTE.map((plant) => [plant.slug, plant]));

export const GET: APIRoute = async () => {
  const payload = {
    $schema: 'https://pointcast.xyz/garden-yield.json',
    name: GARDEN_YIELD_CONTEXT.name,
    description: GARDEN_YIELD_CONTEXT.purpose,
    home: GARDEN_YIELD_CONTEXT.url,
    generatedAt: new Date().toISOString(),
    archiveBlock: {
      id: '0336',
      url: 'https://pointcast.xyz/b/0336',
      jsonUrl: 'https://pointcast.xyz/b/0336.json',
    },
    sourceBlock: GARDEN_YIELD_SOURCE_BLOCK,
    mode: 'ecological value yield, not financial yield',
    metrics: GARDEN_YIELD_METRICS,
    sitePresets: GARDEN_YIELD_SITES,
    plants: GARDEN_YIELD_PLANTS.map((plant) => {
      const palette = paletteBySlug.get(plant.slug);
      return {
        ...plant,
        name: palette?.name ?? plant.slug,
        scientific: palette?.scientific ?? null,
        form: palette?.form ?? null,
        source: palette
          ? { label: palette.sourceLabel, url: palette.sourceUrl }
          : null,
      };
    }),
    establishmentLoop: GARDEN_YIELD_LOOP,
    related: {
      nature: 'https://pointcast.xyz/nature',
      natureJson: 'https://pointcast.xyz/nature.json',
      plantingPaletteBlock: GARDEN_YIELD_SOURCE_BLOCK.url,
      plantingPaletteJson: GARDEN_YIELD_SOURCE_BLOCK.jsonUrl,
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
