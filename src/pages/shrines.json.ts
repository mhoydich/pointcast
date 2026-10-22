import type { APIRoute } from 'astro';
import { absoluteImage, absoluteUrl, SHRINE_SETS, UNFURL_SHRINES } from '../lib/unfurl-shrines';

export const GET: APIRoute = async () => {
  const shrinesBySlug = new Map(UNFURL_SHRINES.map((shrine) => [shrine.slug, shrine]));

  const payload = {
    $schema: 'https://pointcast.xyz/shrines.json',
    title: 'PointCast URL shrine sets',
    version: '1.0',
    description: 'Visual shrine sets for PointCast URL unfurls, grouped by share ritual and backed by generated background art.',
    updatedAt: new Date().toISOString(),
    source: absoluteUrl('/unfurls.json'),
    builder: absoluteUrl('/unfurls#builder'),
    meditationRooms: [
      {
        title: 'Small Shrines',
        url: absoluteUrl('/small-shrines/'),
        json: absoluteUrl('/small-shrines.json'),
        description: 'Four secular art-led pauses with original short meditations and optional browser-synthesized sound.',
        image: absoluteImage('/images/small-shrines/ocean.webp'),
      },
      { title: 'Elemental Shrine', url: absoluteUrl('/elemental-shrine') },
      { title: 'Shrine of the Open Road', url: absoluteUrl('/open-road') },
    ],
    backgrounds: {
      sheet: absoluteImage('/images/shrines/shrine-background-sheet.png'),
      elementSheet: absoluteImage('/images/shrines/element-shrine-background-sheet.png'),
      generatedFor: 'URL unfurl shrines',
    },
    sets: SHRINE_SETS.map((set) => ({
      ...set,
      background: absoluteImage(set.background),
      backgroundVariants: set.backgroundVariants?.map(absoluteImage),
      url: absoluteUrl(`/shrines#${set.slug}`),
      shrines: set.slugs
        .map((slug) => shrinesBySlug.get(slug))
        .filter(Boolean)
        .map((shrine) => ({
          ...shrine,
          url: absoluteUrl(shrine!.path),
          miniUrl: absoluteUrl(shrine!.miniPath),
          miniImage: absoluteUrl(`${shrine!.miniPath}/og.png`),
          image: absoluteImage(shrine!.image),
          proof: shrine!.proof.map(absoluteUrl),
        })),
    })),
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
