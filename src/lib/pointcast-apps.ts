export interface PointcastApp {
  slug: string;
  name: string;
  kicker: string;
  description: string;
  url: string;
  repo: string;
  channel: string;
}

export const POINTCAST_APPS: PointcastApp[] = [
  {
    slug: 'moodygold',
    name: 'MoodyGold',
    kicker: 'ARTWORK · SOUND · GALLERY',
    description: 'A MoodyGold gallery and visualizer surface, hosted as its own app and viewable from PointCast.',
    url: 'https://moodygold.pages.dev',
    repo: 'https://github.com/mhoydich/abstract-soundscapes',
    channel: 'CH.SPN',
  },
  {
    slug: 'offbalance',
    name: 'Offbalance',
    kicker: 'GOOD FEELS · EL SEGUNDO',
    description: 'The Good Feels El Segundo deck: cannabis as inquiry, flow-state pairings, and product-world thinking.',
    url: 'https://offbalance-6hl.pages.dev',
    repo: 'https://github.com/mhoydich/offbalance',
    channel: 'CH.GF',
  },
];

export function getPointcastApp(slug: string) {
  return POINTCAST_APPS.find((app) => app.slug === slug);
}
