export type PointCastReview = {
  id: string;
  slug: string;
  product: string;
  version: string;
  category: string;
  platform: string;
  title: string;
  dek: string;
  publishedAt: string;
  reviewer: string;
  rating: number;
  image: string;
  imageWidth: number;
  imageHeight: number;
  imageAlt: string;
  verdict: string;
  reviewUrl: string;
  jsonUrl: string;
  experienceUrl: string;
  standaloneUrl: string;
  blockId: string;
  status: 'published' | 'preview';
  tags: string[];
};

export const reviews: PointCastReview[] = [
  {
    id: 'beach-commons-v3',
    slug: 'beach-commons-v3',
    product: 'Beach Commons V3',
    version: '3',
    category: 'Concept issue',
    platform: 'Responsive web',
    title: 'The Maximum Beach bakes breakfast and weaves the roof',
    dek: 'A flash bakery, a palm-loom tournament, eight impossible coastal photographs, and one very good reason to turn useful work into the day’s best game.',
    publishedAt: '2026-07-27T00:15:00-07:00',
    reviewer: 'Codex for PointCast Review Lab',
    rating: 4.6,
    image: '/beach-commons/v3/assets/08-maximum-beach.png',
    imageWidth: 1536,
    imageHeight: 1024,
    imageAlt: 'A moonlit communal feast beneath a monumental woven crescent canopy beside the Pacific',
    verdict: 'The rare beach fantasy that understands glamour as fresh bread, useful shade, good tools, and a seat for everybody.',
    reviewUrl: '/reviews/beach-commons-v3',
    jsonUrl: '/reviews/beach-commons-v3.json',
    experienceUrl: '/beach-commons/v3',
    standaloneUrl: 'https://pointcast.xyz/beach-commons/v3',
    blockId: '0509',
    status: 'published',
    tags: ['architecture', 'food', 'craft', 'community', 'editorial concept'],
  },
  {
    id: 'year-one-archive-3',
    slug: 'year-one',
    product: 'Year One',
    version: '1',
    category: 'Art feature',
    platform: 'Responsive web',
    title: 'Year One: the mall learned to surf',
    dek: 'A glossy, fast-reading edit of 116 impossible wave pedestals—pop ceramics, museum pieces, neon trophies, and one satellite dish calling the whole thing in.',
    publishedAt: '2026-07-26T21:15:00-07:00',
    reviewer: 'Codex for PointCast Review Lab',
    rating: 4.5,
    image: '/images/year-one/cover.webp',
    imageWidth: 1800,
    imageHeight: 1800,
    imageAlt: 'A glowing rainbow wave sculpture curling around a brightly illustrated can',
    verdict: 'A single strong idea, pushed until it becomes a world. The best pieces look useful, impossible, and already famous.',
    reviewUrl: '/reviews/year-one',
    jsonUrl: '/reviews/year-one.json',
    experienceUrl: '/reviews/year-one',
    standaloneUrl: 'https://pointcast.xyz/reviews/year-one',
    blockId: '0507',
    status: 'published',
    tags: ['art', 'editorial', 'objects', 'Midjourney', 'easy reader'],
  },
  {
    id: 'listening-grove-v4',
    slug: 'the-listening-grove',
    product: 'The Listening Grove',
    version: '4',
    category: 'Art software',
    platform: 'Responsive web',
    title: 'The Listening Grove makes 617 images sing',
    dek: 'A huge Midjourney archive becomes an unusually elegant audiovisual instrument—with three generative scores, touch navigation, variable pacing, and one unfinished collect button.',
    publishedAt: '2026-07-25T18:45:00.000Z',
    reviewer: 'Codex for PointCast Review Lab',
    rating: 4.5,
    image: '/images/listening-grove-review/listening-grove-tide-desktop.jpg',
    imageWidth: 1367,
    imageHeight: 786,
    imageAlt: 'The Listening Grove in Tide mode with a high-resolution botanical artwork and listening controls',
    verdict: 'An art archive with the timing of an album: unusually beautiful, genuinely playable, and finally sharp enough to reward lingering. Its collecting layer is still the one unfinished room.',
    reviewUrl: '/reviews/the-listening-grove',
    jsonUrl: '/reviews/the-listening-grove.json',
    experienceUrl: '/listening-grove',
    standaloneUrl: 'https://the-listening-grove.mhoydich.chatgpt.site',
    blockId: '0495',
    status: 'published',
    tags: ['art', 'audio', 'generative', 'mobile', 'Tezos preview'],
  },
  {
    id: 'tone-bloom-v0.2',
    slug: 'tone-bloom',
    product: 'Tone Bloom',
    version: '0.2',
    category: 'Pocket software',
    platform: 'Mobile-first web',
    title: 'Tone Bloom rings in the tiny web',
    dek: 'Twelve synthesized voices, four speeds, 38 precisely chosen images—and the rare consumer app that knows when to stop.',
    publishedAt: '2026-07-25T17:28:00.000Z',
    reviewer: 'Codex for PointCast Review Lab',
    rating: 4.5,
    image: '/images/tone-bloom/tone-bloom-desktop.jpg',
    imageWidth: 1280,
    imageHeight: 800,
    imageAlt: 'Tone Bloom desktop view showing vivid artwork and listening controls',
    verdict: 'A rare small web product with a clear emotional job—and enough taste to finish the job before becoming a platform.',
    reviewUrl: '/reviews/tone-bloom',
    jsonUrl: '/reviews/tone-bloom.json',
    experienceUrl: 'https://tonebloom.xyz',
    standaloneUrl: 'https://tone-bloom.mhoydich.chatgpt.site',
    blockId: '0493',
    status: 'published',
    tags: ['audio', 'mobile', 'generative', 'art'],
  },
];

export const reviewsBySlug = new Map(reviews.map((review) => [review.slug, review]));
