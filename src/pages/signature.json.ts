/**
 * /signature.json — agent-readable twin of Signature Studio.
 */
import type { APIRoute } from 'astro';
import {
  BLOCK,
  EDITION_GAP,
  FONTS,
  HISTORY_PATH,
  HONESTY,
  MEANINGS,
  NOT_LEGAL,
  PATH,
} from '../data/signature-studio';

export const GET: APIRoute = () => {
  const body = {
    surface: PATH,
    url: 'https://pointcast.xyz' + PATH + '/',
    history: 'https://pointcast.xyz' + HISTORY_PATH + '/',
    block: BLOCK,
    disclaimer: NOT_LEGAL,
    honesty: HONESTY,
    description: 'Type, draw, or upload a signature. Export PNG and SVG. Hash the PNG, sign a statement with an in-browser ed25519 key, and optionally record a signature/v1 post on the PointCast devnet channel ART.',
    not: ['legally binding e-signature service', 'notary', 'proof of identity', 'edition mint'],
    fonts: FONTS.map((font) => ({
      id: font.id,
      family: font.family,
      license: font.license,
      credit: font.credit,
      file: font.file,
      paths: font.paths,
      note: font.note,
    })),
    meanings: MEANINGS,
    edition: EDITION_GAP,
    record: {
      format: 'signature/v1',
      channel: 'ART',
      network: 'pointcast-devnet-2',
      value: 'none',
      mayReset: true,
    },
    fontsGuide: '/signature/fonts/README.md',
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
