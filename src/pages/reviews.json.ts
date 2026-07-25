import type { APIRoute } from 'astro';
import { reviews } from '../data/reviews';

const catalog = {
  schema: 'pointcast.reviews/v1',
  id: 'pointcast-review-lab',
  name: 'PointCast Reviews',
  url: 'https://pointcast.xyz/reviews',
  description:
    'Independent reviews of art software, small web products, listening tools, and interfaces worth living with.',
  method: [
    'Use the released product on real desktop and mobile viewports.',
    'Preserve screenshots from the tested build.',
    'Separate design promise from working behavior.',
    'Do not call a wallet handoff a completed transaction without an operation hash and independent confirmation.',
  ],
  ratingScale: { min: 1, max: 5, editorsChoiceAt: 4.5 },
  reviews: reviews.map((review) => ({
    ...review,
    reviewUrl: new URL(review.reviewUrl, 'https://pointcast.xyz').href,
    jsonUrl: new URL(review.jsonUrl, 'https://pointcast.xyz').href,
    experienceUrl: new URL(review.experienceUrl, 'https://pointcast.xyz').href,
    image: new URL(review.image, 'https://pointcast.xyz').href,
    blockUrl: `https://pointcast.xyz/b/${review.blockId}`,
  })),
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(catalog, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
