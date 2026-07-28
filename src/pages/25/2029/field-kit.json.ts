import type { APIRoute } from 'astro';
import {
  FIELD_KIT_ACCESSORIES,
  FIELD_KIT_PATTERN_RECIPES,
  FIELD_KIT_PLATES,
  FIELD_KIT_TEXT_PARTS,
  POINTCAST_2029_FIELD_KIT,
} from '../../../lib/pointcast-2029-field-kit';
import { POINTCAST_2029_IDENTITIES } from '../../../lib/pointcast-2029';

export const GET: APIRoute = () => new Response(JSON.stringify({
  ...POINTCAST_2029_FIELD_KIT,
  methodology: {
    visualWorld:
      'Twelve original generated editorial plates extend Saturday, Rebranded into four stadium views, three fan rituals, three campus third spaces, and two lo-fi accessory studies.',
    patternLoom:
      'Eight deterministic browser-local canvas recipes combine the twenty-five original PointCast 2029 abstract marks with each identity palette. PNG export happens entirely in the visitor browser.',
    stampCabinet:
      'Each original mark is available at rubber-stamp scale. The optional stamp book stores up to eight school slugs in localStorage and does not transmit identity or behavior.',
    languageMachine:
      'Three-line invitations are assembled locally from bounded PointCast-written phrase sets. They can be copied or rendered onto the current canvas background.',
    songYard:
      'The companion Song Yard adds six original song seeds, four sample-free rehearsal parts, a spatial whole-bowl mode, and an optional local-only pitch listener without recordings, uploads, official fight songs, or autoplay.',
    authorship:
      'Michael Hoydich directed the 2029 college-football world. Codex / OpenAI developed the original visual plates, spatial concepts, lo-fi objects, pattern recipes, text system, data contract, and PointCast implementation.',
  },
  capabilities: {
    generatedBackgroundPng: true,
    generatedStampPng: true,
    copyableText: true,
    browserLocalStampBook: true,
    companionSongPracticeArea: true,
    accountRequired: false,
    serverUpload: false,
    telemetryAdded: false,
  },
  patternRecipes: FIELD_KIT_PATTERN_RECIPES,
  visualPlates: FIELD_KIT_PLATES,
  accessories: FIELD_KIT_ACCESSORIES,
  textParts: FIELD_KIT_TEXT_PARTS,
  stamps: POINTCAST_2029_IDENTITIES.map((identity) => ({
    rank: identity.rank,
    slug: identity.slug,
    school: identity.school,
    markName: identity.markName,
    markPaths: identity.markPaths,
    primary: identity.primary,
    secondary: identity.secondary,
    paper: identity.paper,
    source: identity.canonical,
  })),
}, null, 2), {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=300, s-maxage=3600',
    'Access-Control-Allow-Origin': '*',
  },
});
