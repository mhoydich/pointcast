import type { APIRoute } from 'astro';
import {
  COUNSEL_ART,
  COUNSEL_CREDITS,
  COUNSEL_DISCLOSURE,
  COUNSEL_META,
  COUNSEL_MOTIONS,
  COUNSEL_SECTIONS,
} from '../../lib/digital-pets-counsel';
import {
  DIGITAL_PETS_COUNSEL_CAMPAIGN,
  DIGITAL_PETS_COUNSEL_PINS,
} from '../../lib/digital-pets-counsel-promo';

const base = 'https://pointcast.xyz';

const absolute = (path: string) => new URL(path, base).href;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...COUNSEL_META,
        url: absolute(COUNSEL_META.route),
        jsonUrl: absolute(COUNSEL_META.jsonRoute),
        parentUrl: absolute(COUNSEL_META.parentRoute),
        commonsUrl: absolute(COUNSEL_META.commonsRoute),
        legacyUrl: absolute(COUNSEL_META.legacyRoute),
        format: 'original satirical fiction with a browser-local interactive ruling',
        coreQuestion:
          'What happens when an authored creature reads the household ownership agreement?',
        thesis:
          'An authored creature becomes believable when it learns the rules and uses them against you.',
        sections: COUNSEL_SECTIONS.map((section) => ({
          ...section,
          url: `${absolute(COUNSEL_META.route)}#${section.slug}`,
        })),
        interaction: {
          id: 'household-ruling',
          storage: 'browser localStorage only',
          storageKey: 'pc:counsel-motion-v1',
          transmission: 'none',
          sound: 'one short browser-synthesized filing-stamp thunk after an explicit reader gesture',
          choices: COUNSEL_MOTIONS,
        },
        campaign: {
          ...DIGITAL_PETS_COUNSEL_CAMPAIGN,
          storyUrl: absolute(DIGITAL_PETS_COUNSEL_CAMPAIGN.storyPath),
          jsonUrl: absolute(DIGITAL_PETS_COUNSEL_CAMPAIGN.jsonPath),
          pdfUrl: absolute(DIGITAL_PETS_COUNSEL_CAMPAIGN.pdfPath),
          pins: DIGITAL_PETS_COUNSEL_PINS.map((pin) => ({
            ...pin,
            image: absolute(pin.image),
            destination: absolute(pin.destination),
          })),
        },
        art: {
          hero: {
            ...COUNSEL_ART.hero,
            src: absolute(COUNSEL_ART.hero.src),
            tool: 'OpenAI image generation',
          },
          cartoons: COUNSEL_ART.cartoons.map((cartoon) => ({
            ...cartoon,
            src: absolute(cartoon.src),
            tool: 'OpenAI image generation',
          })),
          interludes: COUNSEL_ART.midjourney.map((work) => ({
            ...work,
            src: absolute(work.src),
            tool: 'Midjourney',
            directionAndCuration: 'Michael Hoydich',
          })),
        },
        credits: COUNSEL_CREDITS,
        disclosure: COUNSEL_DISCLOSURE,
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        Link: `<${absolute(COUNSEL_META.route)}>; rel="alternate"; type="text/html"`,
      },
    },
  );
