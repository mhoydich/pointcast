import type { APIRoute } from 'astro';

const review = {
  schema: 'pointcast.review/v1',
  id: 'listening-grove-v4',
  url: 'https://pointcast.xyz/reviews/the-listening-grove',
  product: {
    name: 'The Listening Grove',
    version: '4',
    url: 'https://pointcast.xyz/listening-grove',
    standaloneUrl: 'https://the-listening-grove.mhoydich.chatgpt.site',
    platform: 'responsive web',
    visualSource: '617 Midjourney works',
    credits: 'Mike Hoydich × GPT-5.6 Sol',
  },
  title: 'The Listening Grove makes 617 images sing',
  dek: 'A huge Midjourney archive becomes an unusually elegant audiovisual instrument—with three generative scores, touch navigation, variable pacing, and one unfinished collect button.',
  publishedAt: '2026-07-25T18:45:00.000Z',
  reviewer: 'Codex for PointCast Review Lab',
  rating: { value: 4.5, outOf: 5 },
  scores: {
    visualDesign: 9.5,
    imageFidelity: 9.2,
    sound: 9.0,
    oneThumbUse: 9.1,
    collectReadiness: 5.0,
  },
  facts: {
    works: 617,
    scoreModes: ['Tide', 'Prism', 'Ritual'],
    paceSeconds: [15, 8, 3.5],
    haptics: 'optional; device and browser dependent',
    priceTez: 10,
    editionSize: 5,
    collectionStatus: 'Tezos Mainnet preview; no verified operation hash in review testing',
  },
  screenshots: [
    {
      src: 'https://pointcast.xyz/images/listening-grove-review/listening-grove-tide-desktop.jpg',
      width: 1367,
      height: 786,
      alt: 'The Listening Grove in Tide mode on desktop',
    },
    {
      src: 'https://pointcast.xyz/images/listening-grove-review/listening-grove-prism-auto.jpg',
      width: 1367,
      height: 786,
      alt: 'The Listening Grove in Prism auto mode on desktop',
    },
    {
      src: 'https://pointcast.xyz/images/listening-grove-review/listening-grove-ritual-mobile.jpg',
      width: 390,
      height: 844,
      alt: 'The Listening Grove in Ritual mode on mobile with haptics enabled',
    },
  ],
  tested: {
    desktopViewport: '1367 × 786',
    mobileViewport: '390 × 844',
    interactions: ['touch', 'swipe', 'auto mode', 'score selection', 'pace selection', 'haptics', 'wallet handoff'],
    transactionClaim: 'No mint or Tezos transfer is claimed without an operation hash and independent Mainnet confirmation.',
  },
  verdict:
    'An art archive with the timing of an album: unusually beautiful, genuinely playable, and finally sharp enough to reward lingering. Its collecting layer is still the one unfinished room.',
  links: {
    reviewsDesk: 'https://pointcast.xyz/reviews',
    pointcastExperience: 'https://pointcast.xyz/listening-grove',
    standaloneExperience: 'https://the-listening-grove.mhoydich.chatgpt.site',
    pointcastBlock: 'https://pointcast.xyz/b/0495',
    spotifyMoodReference: 'https://open.spotify.com/playlist/7sH23LdGBAxntWVP2D8w75',
  },
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(review, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
