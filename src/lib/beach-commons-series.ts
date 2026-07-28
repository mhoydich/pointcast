export type BeachCommonsPathId = 'build' | 'make' | 'kit' | 'coast';

export type BeachCommonsEdition = {
  edition: number;
  slug: string;
  title: string;
  subtitle: string;
  invitation: string;
  image: string;
  alt: string;
  path: BeachCommonsPathId;
  blockId: string;
  measure: string;
  current?: boolean;
};

export const BEACH_COMMONS_SERIES = {
  schema: 'https://pointcast.xyz/schemas/creative-work-series/v1',
  id: 'PC-BEACH-COMMONS',
  title: 'Beach Commons',
  subtitle: 'Twelve field studies for making public life at the edge.',
  dek: 'Architecture, games, weather, useful objects, radio, ecology, relays, and one working harbor—organized as a growing coastal commons.',
  url: 'https://pointcast.xyz/beach-commons',
  jsonUrl: 'https://pointcast.xyz/beach-commons.json',
  currentEdition: 12,
  currentUrl: 'https://pointcast.xyz/beach-commons/v12',
  firstEditionUrl: 'https://pointcast.xyz/beach-commons/v1',
  publishedAt: '2026-07-26',
  updatedAt: '2026-07-28',
  status:
    'An unofficial speculative editorial series. No physical event, installation, permit, purchase requirement, contribution drive, restoration action, or municipal affiliation is announced by this index.',
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating observations, and Beach Commons series',
    },
    {
      name: 'Codex / OpenAI',
      role: 'research, concept systems, image generation, interactive instruments, and PointCast editions',
    },
  ],
} as const;

export const BEACH_COMMONS_PATHS = [
  {
    id: 'build',
    number: '01',
    title: 'Build Together',
    shortTitle: 'Build',
    description:
      'Begin with shelter, scale it into collective play, then test what ten people can assemble around an existing fire ring.',
    color: '#f06a3a',
  },
  {
    id: 'make',
    number: '02',
    title: 'Make Weather',
    shortTitle: 'Weather',
    description:
      'Bake, weave, sculpt, listen, and turn sun, moon, wind, rain, water, fire, and stone into shared instruments.',
    color: '#efc75e',
  },
  {
    id: 'kit',
    number: '03',
    title: 'Bring a Kit',
    shortTitle: 'Utility',
    description:
      'Move from shopping lists and blanket systems into a public electronics bench where utility becomes culture.',
    color: '#92b6a6',
  },
  {
    id: 'coast',
    number: '04',
    title: 'Read the Coast',
    shortTitle: 'Coast',
    description:
      'Borrow attention from shells, measure a human relay from Pacific zero, and imagine a marina as civic metabolism.',
    color: '#7bb8cf',
  },
] as const;

export const BEACH_COMMONS_EDITIONS: readonly BeachCommonsEdition[] = [
  {
    edition: 1,
    slug: 'v1',
    title: 'Hardpoint + Softkit',
    subtitle: 'A storm-tough center and rooms people can carry.',
    invitation: 'Start with one shared room before ten private ones.',
    image: '/beach-commons/assets/02-ten-people-one-courtyard.png',
    alt: 'Ten people gather in a modular beach courtyard around a brick-and-stone hearth.',
    path: 'build',
    blockId: '0506',
    measure: '6 shelter prototypes',
  },
  {
    edition: 2,
    slug: 'v2',
    title: 'Superstructures + Living Games',
    subtitle: 'Sport, moon rituals, energy, repair, and the long wave final.',
    invitation: 'Enter the great canopy loop and play through every useful job.',
    image: '/beach-commons/v2/assets/01-great-canopy-loop.png',
    alt: 'A large reversible beach canopy loops around shared games and community activity.',
    path: 'build',
    blockId: '0508',
    measure: '8 civic-scale rooms',
  },
  {
    edition: 3,
    slug: 'v3',
    title: 'Flash Bakery + Palm Loom',
    subtitle: 'Breakfast at sunrise; a woven roof by noon.',
    invitation: 'Bake, weave, play, eat together, and leave no kitchen behind.',
    image: '/beach-commons/v3/assets/01-flash-bakery.png',
    alt: 'A temporary sunrise bakery gathers people around clean worktables near the beach.',
    path: 'make',
    blockId: '0509',
    measure: '8 one-day systems',
  },
  {
    edition: 4,
    slug: 'v4',
    title: 'Sculpture Yard + Element Maxxing',
    subtitle: 'Seven elements become one public instrument.',
    invitation: 'Let shade move, wind play, rain compose, and stone remember.',
    image: '/beach-commons/v4/assets/01-element-yard.png',
    alt: 'A coastal sculpture yard turns weather and natural elements into social instruments.',
    path: 'make',
    blockId: '0511',
    measure: '8 elemental plates',
  },
  {
    edition: 5,
    slug: 'v5',
    title: 'Weather School + Tide Parliament',
    subtitle: 'Seven classrooms and one seasonal assembly.',
    invitation: 'Study the weather together, then give the tide the last word.',
    image: '/beach-commons/v5/assets/01-weather-school.png',
    alt: 'An open-air weather school gathers learners around instruments and coastal observations.',
    path: 'make',
    blockId: '0513',
    measure: '8 public classrooms',
  },
  {
    edition: 6,
    slug: 'v6',
    title: 'The $100 Fire-Ring Commons',
    subtitle: 'Ten modules. One quiet score. Everything goes home.',
    invitation: 'See what 10–20 people can coordinate around an existing fire ring.',
    image: '/beach-commons/v6/assets/01-ten-modules-arrive.png',
    alt: 'Ten portable non-food modules arrive by handcart at an existing beach fire ring.',
    path: 'build',
    blockId: '0516',
    measure: '$100 × 10 modules',
  },
  {
    edition: 7,
    slug: 'v7',
    title: 'The Beach Utility Index',
    subtitle: 'Twenty-five useful things and eight computed carts.',
    invitation: 'Shop the experiment without confusing more gear for a better gathering.',
    image: '/images/og/b/0518.png',
    alt: 'PointCast social card for the Beach Utility Index shopping desk.',
    path: 'kit',
    blockId: '0518',
    measure: '25 picks · 8 carts',
  },
  {
    edition: 8,
    slug: 'v8',
    title: 'The Beach Blanket Review',
    subtitle: 'Twelve products and seven ways to combine them.',
    invitation: 'Find the right six feet of sand, from pocket nylon to group layers.',
    image: '/beach-commons/v8/products/slowtide-koko.webp',
    alt: 'A patterned Slowtide blanket photographed as part of the Beach Blanket Review.',
    path: 'kit',
    blockId: '0521',
    measure: '12 reviews · 7 systems',
  },
  {
    edition: 9,
    slug: 'v9',
    title: 'Signal Shack',
    subtitle: 'A neighborhood electronics counter at the coast.',
    invitation: 'Move from crystal radio picnic to quiet hi-fi without needing a feed.',
    image: '/beach-commons/v9/assets/01-public-parts-counter.png',
    alt: 'A public coastal electronics parts counter supports group building and repair.',
    path: 'kit',
    blockId: '0526',
    measure: '8 benches · 1 signal rack',
  },
  {
    edition: 10,
    slug: 'v10',
    title: 'Tide Cabinet',
    subtitle: 'A field museum for borrowing attention, not nature.',
    invitation: 'Collect carefully, catch nothing, return everything, restore with partners.',
    image: '/beach-commons/v10/assets/01-tide-cabinet.png',
    alt: 'A temporary tide cabinet organizes exact-return shell and stone observation.',
    path: 'coast',
    blockId: '0528',
    measure: '8 exact-return rooms',
  },
  {
    edition: 11,
    slug: 'v11',
    title: 'The Reach Line',
    subtitle: 'A giant relay beginning at Pacific zero.',
    invitation: 'Measure hands connected, safe ground carried, and unbroken custody.',
    image: '/beach-commons/v11/assets/08-return-arc.png',
    alt: 'A soft relay baton returns through a community arc at sunrise.',
    path: 'coast',
    blockId: '0531',
    measure: '4 honest reach measures',
  },
  {
    edition: 12,
    slug: 'v12',
    title: 'Harbor Works',
    subtitle: 'A marina is not parking. It is metabolism.',
    invitation: 'Sort one imagined boat into five futures, then sit down at sunset.',
    image: '/beach-commons/v12/assets/01-useful-marina.png',
    alt: 'A useful marina combines repair, public launch, shared worktables, and calm harbor life.',
    path: 'coast',
    blockId: '0532',
    measure: '8 rooms · 5 futures',
    current: true,
  },
];

export const beachCommonsEditionUrl = (edition: BeachCommonsEdition) =>
  `${BEACH_COMMONS_SERIES.url}/${edition.slug}`;
