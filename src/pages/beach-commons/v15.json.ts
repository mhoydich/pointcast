import type { APIRoute } from 'astro';
import {
  BEACH_COMMONS_V15,
  GEAR_CARTS,
  GEAR_PICKS,
  GEAR_PLATES,
  GEAR_PLAYLIST,
  GEAR_RULES,
  GEAR_SCORE_WEIGHTS,
} from '../../lib/beach-commons-v15';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        ...BEACH_COMMONS_V15,
        scoring: {
          total: GEAR_SCORE_WEIGHTS.reduce((sum, category) => sum + category.points, 0),
          categories: GEAR_SCORE_WEIGHTS,
          status:
            'Transparent PointCast editorial judgment from official specifications, service signals, packability, public-use logic, price, and design. Not laboratory or hands-on test data.',
        },
        picks: GEAR_PICKS,
        carts: GEAR_CARTS.map((cart) => ({
          ...cart,
          items: cart.itemIds.map((id) => {
            const item = GEAR_PICKS.find((pick) => pick.id === id);
            return item ? { id: item.id, maker: item.maker, name: item.name, priceUsd: item.priceUsd } : { id };
          }),
        })),
        originalVisuals: GEAR_PLATES.map((plate) => ({
          ...plate,
          image: new URL(plate.image, BEACH_COMMONS_V15.url).href,
        })),
        playlist: GEAR_PLAYLIST,
        operatingRules: GEAR_RULES,
        localInstrument: {
          title: 'Cart Composer',
          availability: 'human HTML edition only',
          storage: false,
          analytics: false,
          networkWrites: false,
          checkout: false,
          affiliateLinks: false,
          inputs: ['first light, all day, blue hour, or repair day', '$100, $300, or $700 ceiling'],
          actions: ['compose a local editorial cart', 'copy the resulting list'],
        },
        pinterestCompanion: {
          plates: GEAR_PLATES.length,
          action:
            'Human HTML edition opens Pinterest’s standard create-pin flow with the canonical article anchor, original image URL, and PointCast description. PointCast does not save to or modify a Pinterest account.',
        },
        rights: {
          visuals:
            'Eight original brand-neutral speculative editorial images generated for this PointCast field study with OpenAI image generation.',
          productMarks:
            'Product and maker names belong to their respective owners. No maker, merchant, Spotify, Pinterest, public agency, or venue endorses this review.',
        },
        methodology: {
          researchCheckedAt: BEACH_COMMONS_V15.priceCheckedAt,
          productSources:
            'Each pick links to the official maker page used for current price, specification, warranty, service, and availability context.',
          playlistStatus: GEAR_PLAYLIST.status,
          eventStatus:
            'No event, organized gathering, contribution drive, affiliate relationship, purchase requirement, reservation, permit, partner, sponsor, product collaboration, municipal program, or field test is announced.',
        },
      },
      null,
      2,
    ),
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Access-Control-Allow-Origin': '*',
        Link: '<https://pointcast.xyz/beach-commons/v15>; rel="alternate"; type="text/html"',
      },
    },
  );
