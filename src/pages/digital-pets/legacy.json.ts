import type { APIRoute } from 'astro';
import {
  LEGACY_ART,
  LEGACY_CREDITS,
  LEGACY_DISCLOSURE,
  LEGACY_META,
  LEGACY_SECTIONS,
  LEGACY_VOWS,
} from '../../lib/digital-pets-legacy';

const base = 'https://pointcast.xyz';

const absolute = (path: string) => new URL(path, base).href;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...LEGACY_META,
        url: absolute(LEGACY_META.route),
        jsonUrl: absolute(LEGACY_META.jsonRoute),
        parentUrl: absolute(LEGACY_META.parentRoute),
        commonsUrl: absolute(LEGACY_META.commonsRoute),
        format: 'original literary fiction with a browser-local interactive reading object',
        coreQuestion:
          'If Creature Commons succeeded completely, what would remain after the organization itself was gone?',
        thesis:
          'The collective’s best legacy is not permanent institutional grandeur but promises that become ordinary household customs.',
        sections: LEGACY_SECTIONS.map((section) => ({
          ...section,
          url: `${absolute(LEGACY_META.route)}#${section.slug}`,
        })),
        interaction: {
          id: 'amber-seed',
          storage: 'browser localStorage only',
          storageKey: 'pc:amber-seed-v1',
          transmission: 'none',
          sound: 'three short browser-synthesized sine tones after an explicit reader gesture',
          choices: LEGACY_VOWS,
        },
        art: {
          hero: {
            ...LEGACY_ART.hero,
            src: absolute(LEGACY_ART.hero.src),
            tool: 'OpenAI image generation',
          },
          cartoons: LEGACY_ART.cartoons.map((cartoon) => ({
            ...cartoon,
            src: absolute(cartoon.src),
            tool: 'OpenAI image generation',
          })),
          interludes: LEGACY_ART.midjourney.map((work) => ({
            ...work,
            src: absolute(work.src),
            tool: 'Midjourney',
            directionAndCuration: 'Michael Hoydich',
          })),
        },
        credits: LEGACY_CREDITS,
        disclosure: LEGACY_DISCLOSURE,
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        Link: `<${absolute(LEGACY_META.route)}>; rel="alternate"; type="text/html"`,
      },
    },
  );
