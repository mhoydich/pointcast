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
