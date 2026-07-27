import type { APIRoute } from 'astro';
import {
  DIGITAL_PETS_LAUNCH_SEQUENCE,
  DIGITAL_PETS_OUTREACH_NOTES,
  DIGITAL_PETS_PROMO_ANGLES,
  DIGITAL_PETS_PROMO_ASSETS,
  DIGITAL_PETS_PROMO_MEASURES,
  DIGITAL_PETS_PROMO_META,
  DIGITAL_PETS_SINGLE_POSTS,
  DIGITAL_PETS_X_THREAD,
} from '../../lib/digital-pets-promo';

const base = 'https://pointcast.xyz';
const absolute = (path: string) => new URL(path, base).href;

export const GET: APIRoute = async () => {
  const payload = {
    ...DIGITAL_PETS_PROMO_META,
    url: absolute(DIGITAL_PETS_PROMO_META.route),
    jsonUrl: absolute(DIGITAL_PETS_PROMO_META.jsonRoute),
    bookUrl: absolute(DIGITAL_PETS_PROMO_META.bookRoute),
    blockUrl: absolute(DIGITAL_PETS_PROMO_META.blockRoute),
    angles: DIGITAL_PETS_PROMO_ANGLES.map((angle) => ({
      ...angle,
      url: absolute(angle.path),
      imageUrl: absolute(angle.image),
    })),
    xThread: DIGITAL_PETS_X_THREAD,
    singlePosts: DIGITAL_PETS_SINGLE_POSTS,
    outreachNotes: DIGITAL_PETS_OUTREACH_NOTES.map((note) => ({
      ...note,
      url: absolute(note.path),
    })),
    assets: DIGITAL_PETS_PROMO_ASSETS.map((asset) => ({
      ...asset,
      url: absolute(asset.path),
    })),
    launchSequence: DIGITAL_PETS_LAUNCH_SEQUENCE,
    measures: DIGITAL_PETS_PROMO_MEASURES,
    disclosure:
      'Michael Hoydich originated and edited the book. Codex / OpenAI developed the first-edition manuscript, campaign system, and PointCast implementation. OpenAI image generation and Michael Hoydich’s Midjourney archive are credited inside the book.',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      Link: `<${absolute(DIGITAL_PETS_PROMO_META.route)}>; rel="alternate"; type="text/html"`,
    },
  });
};
