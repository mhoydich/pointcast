import type { APIRoute } from 'astro';

const review = {
  schema: 'pointcast.review/v1',
  id: 'tone-bloom-v0.2',
  url: 'https://pointcast.xyz/reviews/tone-bloom',
  product: {
    name: 'Tone Bloom',
    version: '0.2',
    url: 'https://tonebloom.xyz',
    fallbackUrl: 'https://tone-bloom.mhoydich.chatgpt.site',
    platform: 'mobile-first web',
    visualSource: 'Midjourney V8.2',
    credits: 'Mike Hoydich × GPT-5.6 Sol',
  },
  title: 'Tone Bloom rings in the tiny web',
  dek: 'Twelve synthesized voices, four speeds, 38 precisely chosen images—and the rare consumer app that knows when to stop.',
  publishedAt: '2026-07-25T17:28:00.000Z',
  reviewer: 'Codex for PointCast Review Lab',
  rating: { value: 4.5, outOf: 5 },
  scores: {
    design: 9.4,
    sound: 8.8,
    oneThumbUse: 9.2,
    restraint: 9.7,
    replayValue: 9.1,
  },
  facts: {
    voices: 12,
    paceModes: ['Float', 'Flow', 'Quick', 'Spark'],
    coreImages: 38,
    accountsRequired: 0,
  },
  screenshots: [
    {
      src: 'https://pointcast.xyz/images/tone-bloom/tone-bloom-desktop.jpg',
      width: 1280,
      height: 800,
      alt: 'Tone Bloom desktop view',
    },
    {
      src: 'https://pointcast.xyz/images/tone-bloom/tone-bloom-mobile-spark.jpg',
      width: 390,
      height: 844,
      alt: 'Tone Bloom mobile view in Spark mode',
    },
  ],
  verdict:
    'Tone Bloom is a rare small web product with a clear emotional job—and enough taste to finish the job before becoming a platform.',
  links: {
    listeningGrove: 'https://the-listening-grove.mhoydich.chatgpt.site',
    saturdayJuly18: 'https://saturday-july-18-2026.mhoydich.chatgpt.site',
    fiftyFrom2025: 'https://fifty-from-2025.mhoydich.chatgpt.site',
    pointcastBlock: 'https://pointcast.xyz/b/0493',
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
