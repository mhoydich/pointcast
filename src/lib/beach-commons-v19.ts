export type SeatPick = {
  id: string;
  maker: string;
  name: string;
  role: string;
  priceUsd: number;
  priceLabel: string;
  packed: string;
  weight: string;
  seatHeight: string;
  capacity: string;
  description: string;
  caveat: string;
  url: string;
  tags: readonly string[];
  sourceUrls?: readonly string[];
};

export const BEACH_COMMONS_V19 = {
  schema: 'https://pointcast.xyz/schemas/shopping-desk/v1',
  id: 'PC-FIELD-STUDY-019',
  edition: 19,
  title: 'The Extra Chair',
  subtitle: 'A place between games. A room for one more.',
  dek: 'The best seat is the one somebody brought for you.',
  url: 'https://pointcast.xyz/beach-commons/v19',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v19.json',
  blockUrl: 'https://pointcast.xyz/b/0591',
  blockId: '0591',
  publishedAt: '2026-09-15',
  priceCheckedAt: '2026-09-15',
  intro: [
    'The first five chairs are logistics. The sixth is a small act of imagination: somebody might arrive who was not in the group chat.',
    'They may have come on foot. They may have stayed longer than planned. They may love the water and hate getting up from the sand. The spare says: we thought about the possibility of you.',
    'The Beach Blanket Review asked what a rectangle should do. This next study asks what a seat makes possible. A low sling, an upright camp chair and a two-person loveseat produce different kinds of afternoon.',
    'So begin with the people. Ask what height they prefer, whether arms help, how far they want to carry, and whether they would rather bring their own seat. Then choose the equipment.',
    'A row facing the ocean is a small cinema. A crescent angled inward is a conversation. Mixed heights can belong to one room if everyone can see and hear, and nobody has to negotiate a wall of gear to join.',
    'Leave a place within the group for someone arriving in their own chair. Keep a clear way in and out. Let people rearrange things. The welcome is an offer, never a seating assignment.',
    'Buying six matching chairs is one possible answer. Borrowing five and remembering the sixth is another. The point is a comfortable visit, not a coordinated purchase.',
    'And give the spare a carrier. An invitation that stays in the trunk has not quite arrived.',
  ],
  priceBoundary:
    'Prices are USD snapshots checked September 15, 2026, before tax, shipping and optional accessories. Stock and prices can change by variant. Re-check the linked merchant page before buying.',
  testingBoundary:
    'This is a specification-led editorial field study, with no hands-on testing. Product roles and suggested uses are editorial inferences. Capacity, comfort, setup speed and surface-performance claims have not been independently tested here.',
  linkBoundary:
    'Shopping links are plain links without affiliate parameters. No merchant relationship or affiliation is asserted.',
  illustrationBoundary:
    'Original editorial illustration generated with OpenAI image generation. It represents an imagined scene, not product photography or evidence of a field test.',
  fieldBoundary:
    'No event or installation is announced. Before an outing, check the chosen site’s current access and use rules. Keep public routes and habitat clear. At courts, keep seats outside play and run-off space and follow venue directions.',
  receipt:
    'Who wanted a different seat? Who carried the spare? Was there an easy way in and out? Did every chair, bag and scrap go home?',
  creators: [
    { name: 'Michael Hoydich', role: 'direction and Beach Commons series' },
    { name: 'Codex / OpenAI', role: 'writing, source research and original editorial illustration' },
  ],
} as const;

export const BEACH_SEATS: readonly SeatPick[] = [
  {
    id: 'campwell',
    maker: 'REI Co-op',
    name: 'Campwell Chair',
    role: 'The Everyday Spare',
    priceUsd: 59.95,
    priceLabel: '$59.95',
    packed: 'Not verified',
    weight: '8 lb 2 oz listed',
    seatHeight: '15 in',
    capacity: '300 lb · maker rating',
    description:
      'A familiar armed folding chair for the person who did not pack one. The mesh seat and included carry bag make this a straightforward candidate for a shared gear cupboard.',
    caveat:
      'The steel frame adds carrying weight. Aspen Pine was marked sold out; other colors were not verified. Try the seat before treating it as a universal fit.',
    url: 'https://www.rei.com/product/229079/rei-co-op-campwell-chair',
    tags: ['beach', 'spare', 'arms'],
  },
  {
    id: 'highboy',
    maker: 'Tommy Bahama',
    name: 'Solid Navy Highboy',
    role: 'The Higher Seat',
    priceUsd: 99.5,
    priceLabel: '$99.50',
    packed: 'Not verified',
    weight: '9.5 lb product weight',
    seatHeight: '17 in',
    capacity: '250 lb dynamic · maker rating',
    description:
      'The tallest confirmed seat in the beach shortlist, with wood arms, four positions and a headrest. A useful candidate when someone prefers to sit farther from the ground.',
    caveat:
      'Seat height alone does not establish ease of standing or access. The maker flags oversized shipping charges. Listed weight is the product weight.',
    url: 'https://www.tommybahama.com/en/Tommy-Bahama-Solid-Navy-Highboy-Beach-Chair/p/SC641FTB2628-220',
    tags: ['beach', 'higher-seat', 'arms'],
  },
  {
    id: 'chair-one-re',
    maker: 'Helinox',
    name: 'Chair One (re)',
    role: 'The Longer Walk',
    priceUsd: 139.95,
    priceLabel: '$139.95',
    packed: 'Not verified',
    weight: '2 lb 7.5 oz packed',
    seatHeight: 'Not verified · conflicting maker text',
    capacity: '320 lb · maker rating',
    description:
      'The lowest stated carrying weight in the beach shortlist. A compact pole-and-sling chair makes the case for carrying less when the walk is the demanding part of the afternoon.',
    caveat:
      'Numerical seat height is omitted because the maker page conflicts. A sand Ground Sheet is a separate accessory and must fit the (re) model. Sand performance was not tested.',
    url: 'https://helinox.com/products/chair-one-re',
    tags: ['beach', 'light-carry', 'backrest'],
  },
  {
    id: 'low-loveseat',
    maker: 'Kelty',
    name: 'Low Loveseat',
    role: 'The Two-Person Room',
    priceUsd: 149.95,
    priceLabel: '$149.95',
    packed: 'Not verified',
    weight: '15.38 lb product weight',
    seatHeight: '13.5 in',
    capacity: '600 lb total · maker rating',
    description:
      'Two places on one shared frame. A compelling ingredient for a small conversation crescent when both people want the same low, slightly reclined position.',
    caveat:
      'One bulky load needs an agreed carrier. Confirm the selected color at the merchant; stock was unclear. Weight is listed product weight, not separately verified packed weight.',
    url: 'https://kelty.com/products/low-loveseat',
    tags: ['beach', 'shared-seat', 'lounge'],
  },
  {
    id: 'beach-rocker',
    maker: 'GCI Outdoor',
    name: 'Beach Rocker',
    role: 'The Little Movement',
    priceUsd: 85,
    priceLabel: '$85.00',
    packed: 'Not verified',
    weight: '10 lb listed',
    seatHeight: 'Low seat · height unlisted',
    capacity: '250 lb · maker rating',
    description:
      'A spring-assisted rocker with padded arms and a folding frame. Its reason to join the room is motion: a different way to enjoy sitting still.',
    caveat:
      'Ten pounds is a real carrying assignment. The page contains mixed availability labels; check the chosen color. We have not verified rocking behavior on soft sand.',
    url: 'https://gcioutdoor.com/products/beach-rocker',
    tags: ['beach', 'rocker', 'arms'],
  },
  {
    id: 'utopia-breeze',
    maker: 'Coleman',
    name: 'Utopia Breeze',
    role: 'The Budget Watchlist',
    priceUsd: 41.99,
    priceLabel: '$41.99 sale · out of stock',
    packed: 'Not verified',
    weight: '6.65 lb listed · bag inclusion unclear',
    seatHeight: 'About 10 in · rounded',
    capacity: '250 lb · maker rating',
    description:
      'A low beach sling with a carry bag, cup holder and rear pocket. The current price provides a budget reference, but this candidate cannot anchor a buy-now group kit.',
    caveat:
      'Explicitly out of stock when checked. List price is $50.99. Maker text differs slightly on seat height; we round to about 10 in. Listed weight does not clarify bag inclusion.',
    url: 'https://www.coleman.com/outdoor-living/furniture-sports/camp-chairs/utopia-breeze-beach-sling-chair/SP_270967.html',
    tags: ['beach', 'low-seat', 'watchlist'],
  },
];

export const POCKET_SEATS_INTRO =
  'A place between games. A perch beside a project. A little room in the bag. The useful split is between a quick backless perch, a compact backrest chair for watching a match, and a reclining or padded seat for camping. Packed shape, carrying weight and sitting support deserve separate comparisons.';

export const POCKET_SEATS: readonly SeatPick[] = [
  {
    id: 'numanu',
    maker: 'NUMANU',
    name: 'Standard Round Stool',
    role: 'The Telescoping Disc',
    priceUsd: 23.99,
    priceLabel: '$23.99 · stool only',
    packed: '10 in diameter × 2.5 in thick',
    weight: '2.2 lb listed',
    seatHeight: 'Adjustable up to 18 in',
    capacity: '620 lb · maker claim, not independently tested',
    description:
      'The literal pull-out seat: a round nested body extends into a backless perch, then closes into a disc. A first candidate for a short wait between games or a small utility job.',
    caveat:
      'Fully engage the locks. It has no backrest, and its 10-inch diameter still needs bag space. The $23.99 version is stool only; the cushion/carry-bag package is $37.99. No capacity or comfort claim has been independently tested here.',
    url: 'https://numanu.com/products/2026-standard-round-collapsible-stool',
    tags: ['perch'],
  },
  {
    id: 'btr-20',
    maker: 'Hillsound',
    name: 'BTR 20',
    role: 'The Slim Tripod',
    priceUsd: 99.95,
    priceLabel: '$99.95',
    packed: '15.6 × 3 × 3 in',
    weight: '17.07 oz / 484 g listed',
    seatHeight: '20.6 in deployed height',
    capacity: '240 lb · maker rating',
    description:
      'Three telescoping legs and a mesh seat make a narrow bundle for a gear bag. This is the taller backless option: useful to compare for sidelines, photography or seated utility tasks.',
    caveat:
      'All three legs must extend and lock fully before use. The 240-lb rating is from the maker. For a shorter bundle, BTR 17 is $94.95: 13.6 × 3 × 3 in, 15.27 oz and 17.5 in deployed.',
    url: 'https://hillsound.com/products/btr',
    tags: ['perch'],
  },
  {
    id: 'cliq-classiq',
    maker: 'CLIQ',
    name: 'ClassiQ 2.0',
    role: 'The Attached-Frame Chair',
    priceUsd: 149.95,
    priceLabel: '$149.95',
    packed: '13.5 × 3.4 × 3.4 in',
    weight: '3.53 lb listed',
    seatHeight: '10.5 in · as listed by maker',
    capacity: '400 lb · maker rating',
    description:
      'An integrated telescoping frame and attached seat give you a backrest without fitting a separate fabric sling each time. A strong format to investigate for repeatedly sitting out one game.',
    caveat:
      'Small packed dimensions do not mean ultralight: it is heavier than the sling chairs below. Its low seat may not suit frequent standing. Confirm bag inclusion for the exact offer; the maker pages disagree.',
    url: 'https://www.cliqproducts.com/products/classiq-portable-camping-chair',
    tags: ['backrest'],
  },
  {
    id: 'chair-zero-lt',
    maker: 'Helinox',
    name: 'Chair Zero LT',
    role: 'The Light Carry',
    priceUsd: 159.95,
    priceLabel: '$159.95',
    packed: '14 × 4.5 × 4.5 in',
    weight: '1 lb 3 oz packed',
    seatHeight: 'Numeric seat height unverified',
    capacity: '265 lb · maker rating',
    description:
      'A very light backrest chair for a longer walk, a camp kit or a day bag. The pole frame and fabric seat assemble separately. The maker includes an X-Strap with this model.',
    caveat:
      'Try the sitting and standing motion before choosing it for sidelines. The page conflates overall and seat height, so we omit the latter. The handling guide specifies a flat, solid surface; we make no sand-performance claim.',
    url: 'https://helinox.com/products/chair-zero-lt',
    sourceUrls: [
      'https://helinox.com/products/chair-zero-lt',
      'https://guides.helinox.com/en/product/chair-zero-lt',
    ],
    tags: ['backrest'],
  },
  {
    id: 'moonlite-elite',
    maker: 'NEMO',
    name: 'Moonlite Elite',
    role: 'The Compact Reclining Scoop',
    priceUsd: 189.95,
    priceLabel: '$189.95',
    packed: '12.5 × 4.5 × 3.5 in',
    weight: '1 lb 7 oz packed · Campman',
    seatHeight: 'Not verified',
    capacity: 'Not verified',
    description:
      'A small reclining sling chair for the wait that turns into watching the rest of the match. It brings a moon-chair feeling in a short bundle, with a separate frame and seat to assemble.',
    caveat:
      'The maker lists 1 lb 3 oz minimum; Campman lists 1 lb 7 oz packed. We use the carry figure. Its included Platform Pack doubles as a ground platform. Recline and comfort are features to try, not findings from our testing.',
    url: 'https://www.nemoequipment.com/products/moonlite-elite-reclining-camp-chair',
    sourceUrls: [
      'https://www.nemoequipment.com/products/moonlite-elite-reclining-camp-chair',
      'https://www.campman.com/nemo-equipment/nemo-moonlite-elite-reclining-backpacking-chair/',
    ],
    tags: ['backrest'],
  },
  {
    id: 'kingcamp-moon',
    maker: 'KingCamp',
    name: 'Moon Saucer KC3989',
    role: 'The Padded Car-Camp Moon',
    priceUsd: 109.99,
    priceLabel: '$109.99',
    packed: '35 × 9 × 8 in',
    weight: '10.4 lb listed',
    seatHeight: '15.7 in',
    capacity: '330 lb · maker rating',
    description:
      'The cushioned, round moon chair: padded seat and back, attached folding frame and no separate assembly. Include it as the comfort comparison for car camping or a longer stay.',
    caveat:
      'A 35-inch bundle belongs in the car-carry category. It is much larger and heavier than the compact scoop chairs. The maker lists 330-lb capacity; weight is not explicitly labeled packed weight.',
    url: 'https://www.kingcamp.com/products/padded-oversized-moon-saucer-round-chairs',
    tags: ['lounge'],
  },
];

export const ROOM_LAYOUTS = [
  {
    id: 'conversation-circle',
    number: '01',
    title: 'The Conversation Circle',
    configuration: 'Four regular places + one spare.',
    description:
      'Use seats whose heights and arms suit their owners. Turn them toward one another and keep an open entrance. Ask one person to carry the extra chair; ask another to check the route before everyone hauls gear.',
  },
  {
    id: 'blue-hour-crescent',
    number: '02',
    title: 'The Blue-Hour Crescent',
    configuration: 'Two shared places + two singles + a spare.',
    description:
      'Put a loveseat and individual chairs in a shallow curve toward the water. Keep a higher seat available for anyone who prefers it. Agree who carries the loveseat home before the group settles in.',
  },
  {
    id: 'welcome-room',
    number: '03',
    title: 'The Welcome Room',
    configuration: 'Mixed heights + one spare + an open place.',
    description:
      'Make space inside the gathering for someone arriving in their own chair. Ask where they would like to be. Choose a location and approach that work for the people coming; equipment alone cannot solve the route.',
  },
] as const;

export const POCKET_SEAT_TESTS = [
  {
    id: 'bag',
    title: 'The Bag Test',
    description:
      'Pack it alongside paddles, balls and a water bottle. Does the bag still close? Record the complete carry weight, including the case and any pad.',
  },
  {
    id: 'next-game',
    title: 'The Next-Game Test',
    description:
      'Time unpacking, opening, checking the locks, sitting, standing and repacking. Repeat it. The fastest first opening is only part of the story.',
  },
  {
    id: 'stay',
    title: 'The Stay Test',
    description:
      'Try a short wait and a longer sit. Record seat pressure, back support, leg position and how standing feels. Let each sitter report their own preference.',
  },
  {
    id: 'place',
    title: 'The Place Test',
    description:
      'Use the manufacturer-approved surface and position. For courts, keep the seat outside play and run-off space and follow venue directions. Check feet and floor compatibility before using it indoors.',
  },
  {
    id: 'return',
    title: 'The Return Test',
    description:
      'Inspect locks, feet and fabric after use. Note how easily dirt clears, whether parts can be replaced and whether you would carry it again tomorrow.',
  },
] as const;

export const POCKET_SEATS_SHORTLIST =
  'NUMANU for a low-cost perch; BTR for a slim, taller stool; CLIQ when an attached backrest chair is worth the extra weight. These are research priorities, not field-tested winners.';
