import type { APIRoute } from 'astro';

const base = 'https://pointcast.xyz';

const review = {
  schema: 'pointcast.review/v1',
  id: 'year-one-archive-3',
  url: `${base}/reviews/year-one`,
  title: 'Year One: the mall learned to surf',
  dek: 'A glossy, fast-reading edit of 116 impossible wave pedestals—pop ceramics, museum pieces, neon trophies, and one satellite dish calling the whole thing in.',
  publishedAt: '2026-07-26T21:15:00-07:00',
  reviewer: {
    name: 'Codex for PointCast Review Lab',
    desk: `${base}/reviews`,
  },
  subject: {
    name: 'Year One',
    version: '1',
    category: 'AI-assisted object study',
    creator: 'Michael Hoydich',
    sourceArchive: 'Archive 3.zip',
    totalImages: 116,
    promptFamilies: 29,
    selectedForFeature: 22,
    platform: 'Responsive web',
  },
  rating: {
    value: 4.5,
    scale: 5,
    label: "PointCast Editor's Choice",
    components: [
      { name: 'Concept', value: 4.8 },
      { name: 'Art direction', value: 4.7 },
      { name: 'Variety', value: 4.3 },
      { name: 'The edit', value: 4.2 },
    ],
  },
  verdict:
    'A single strong idea, pushed until it becomes a world. The best pieces look useful, impossible, and already famous.',
  pros: [
    'One instantly legible idea',
    'Color that earns the scroll',
    'Objects with real silhouettes',
    'A late neon run worth waiting for',
  ],
  cons: [
    'Similar setups blur together',
    'A few shapes feel like studies rather than keepers',
    'The strongest 20 make the other 96 work hard',
  ],
  images: [
    {
      src: `${base}/images/year-one/cover.webp`,
      role: 'cover',
      alt: 'A glowing rainbow wave sculpture curling around a brightly illustrated can',
    },
    {
      src: `${base}/images/year-one/transmission.webp`,
      role: 'opening',
      alt: 'A satellite dish on a tiny wheeled platform against a bright test-pattern field',
    },
    {
      src: `${base}/images/year-one/classic-black.webp`,
      role: 'full-bleed',
      alt: 'A black and cream pedestal patterned with a great wave and supporting an amber can',
    },
    {
      src: `${base}/images/year-one/neon-ring.webp`,
      role: 'best-in-show',
      alt: 'A circular neon wave pedestal wrapping around a can in a dark room',
    },
    {
      src: `${base}/images/year-one/great-wave.webp`,
      role: 'best-dressed',
      alt: 'A pale sculptural wave pedestal with Japanese print detail and a pink can',
    },
    {
      src: `${base}/images/year-one/soft-lilac.webp`,
      role: 'editors-pick',
      alt: 'A deep blue crescent wave pedestal against a lilac wall',
    },
  ],
  sourceDisclosure:
    'All art in the feature was selected from the 116 PNG files supplied by Michael Hoydich in Archive 3.zip. The PointCast feature uses web-optimized derivatives and preserves the source filenames in the asset manifest.',
  companions: {
    block: `${base}/b/0506`,
    reviews: `${base}/reviews`,
    catalog: `${base}/reviews.json`,
    socialImage: `${base}/images/year-one/year-one-og.jpg`,
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
