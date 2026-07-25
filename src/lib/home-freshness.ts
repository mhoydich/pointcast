export type HomeFreshFeature = {
  label: string;
  kicker: string;
  title: string;
  dek: string;
  href: string;
  jsonHref: string;
  blockId: string;
  image: string;
  imageAlt: string;
  publishedAt: string;
  facts: readonly string[];
};

/**
 * The single editorial freshness slot on the PointCast front door.
 *
 * Keep this small and intentional: a new release only needs to update this
 * record for the human homepage and /now.json to point at the same current
 * work. The latest-block rail remains independent for routine publishing.
 */
export const HOME_FRESH_FEATURE: HomeFreshFeature = {
  label: 'New now',
  kicker: 'PointCast Showcast 001',
  title: 'Bells / Bloom',
  dek: 'A bell is a flower you can hear. Twenty-eight archive works move through signal, garden, geometry, and beautiful machine weather.',
  href: '/showcast/bells-bloom',
  jsonHref: '/showcast/bells-bloom.json',
  blockId: '0492',
  image: '/images/og/bells-bloom-showcast.png',
  imageAlt: 'Bells / Bloom, a PointCast showcast of floral signals and geometric bell forms',
  publishedAt: '2026-07-25T17:02:22.000Z',
  facts: ['28 works', '4 movements', '8-second drift'],
};
