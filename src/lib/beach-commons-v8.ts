export type BlanketTag =
  | 'budget'
  | 'cotton'
  | 'dry'
  | 'group'
  | 'pack'
  | 'sand'
  | 'warmth';

export type BlanketPick = {
  id: string;
  maker: string;
  name: string;
  priceUsd: number;
  priceLabel: string;
  url: string;
  image: string;
  imageSource: string;
  imageCredit: string;
  availability: 'current' | 'last-chance' | 'sale';
  badge: string;
  verdict: string;
  fieldNote: string;
  dimensions: string;
  weight: string;
  waterproof: string;
  wash: string;
  anchors: string;
  tags: readonly BlanketTag[];
  caveat: string;
};

export type BlanketSystem = {
  id: string;
  name: string;
  eyebrow: string;
  dek: string;
  people: string;
  lines: readonly { id: string; quantity: number }[];
  assignment: string;
};

export const BEACH_COMMONS_V8 = {
  schema: 'https://pointcast.xyz/schemas/shopping-desk/v1',
  id: 'PC-FIELD-STUDY-008',
  edition: 8,
  title: 'The Beach Blanket Review',
  subtitle: 'Twelve ways to claim six feet of sand—and seven ways to combine them.',
  dek: 'A photographed 2026 field guide to cotton throws, pocket nylon, sand-through mesh, insulated camp blankets, waterproof mats, umbrella holes, pet hair, and the honest state of every affiliate link.',
  url: 'https://pointcast.xyz/beach-commons/v8',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v8.json',
  blockUrl: 'https://pointcast.xyz/b/0521',
  blockId: '0521',
  publishedAt: '2026-07-28',
  priceCheckedAt: '2026-07-27T20:58:00-07:00',
  priceBoundary:
    'Prices and availability are editorial snapshots in USD before tax, shipping, memberships, color-specific discounts, or local stock. Re-check the merchant page before buying.',
  affiliateBoundary:
    'PointCast is not enrolled in a merchant affiliate program for this edition and earns $0 from every product link. All twelve shopping links are plain direct links with no referral, campaign, or affiliate parameters.',
  photographyBoundary:
    'Product photographs are reduced editorial reference images credited to the maker or merchant and linked to the source product page. They are not PointCast product photography, advertising creative, or evidence of hands-on testing.',
  editorialBoundary:
    'This is independent PointCast service journalism. Products were compared from current maker and retailer specifications; no merchant paid, supplied samples, reviewed copy, or determined placement.',
  fieldBoundary:
    'Beach Commons remains an unofficial shopping and coordination prototype, not an announced or permitted Dockweiler event. Keep blankets clear of access routes, habitat, fire rings, hot embers, and other visitors.',
  previousEdition: {
    title: 'The Beach Utility Index',
    url: 'https://pointcast.xyz/beach-commons/v7',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v7.json',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, blanket-review assignment, and PointCast',
    },
    {
      name: 'Codex / OpenAI',
      role: 'current-product research, comparison system, data, implementation, and release',
    },
  ],
} as const;

export const BLANKET_PICKS: readonly BlanketPick[] = [
  {
    id: 'ikea-throw',
    maker: 'IKEA',
    name: 'SOLUPPGÅNG throw',
    priceUsd: 19.99,
    priceLabel: '$19.99',
    url: 'https://www.ikea.com/us/en/p/soluppgang-throw-double-sided-blue-off-white-50619773/',
    image: '/beach-commons/v8/products/ikea-throw.webp',
    imageSource: 'https://www.ikea.com/us/en/images/products/soluppgang-throw-double-sided-blue-off-white__1450500_pe990339_s5.jpg',
    imageCredit: 'Product photograph: IKEA',
    availability: 'last-chance',
    badge: 'Best $20 top layer',
    verdict: 'A pleasant blanket. A terrible floor.',
    fieldNote: 'The double-sided 50% cotton and 50% lyocell weave is soft, machine washable, and cheap enough to color-code across a group.',
    dimensions: '51 × 67 in',
    weight: 'Not listed',
    waterproof: 'No',
    wash: 'Machine',
    anchors: 'None',
    tags: ['budget', 'cotton', 'group'],
    caveat: 'Put it over a dry ground layer. The fringe and absorbent weave will collect damp sand.',
  },
  {
    id: 'matador-pocket',
    maker: 'Matador',
    name: 'Pocket Blanket',
    priceUsd: 35,
    priceLabel: '$35',
    url: 'https://www.matadorequipment.com/products/pocket-blanket-slate-blue',
    image: '/beach-commons/v8/products/matador-pocket.webp',
    imageSource: 'https://www.matadorequipment.com/cdn/shop/files/MATL5001BL_Matador_PocketBlanket_slate_1_cropped_d6e57a88-c633-449c-af38-4cec78e10a03.jpg?v=1759512821',
    imageCredit: 'Product photograph: Matador',
    availability: 'current',
    badge: 'Best pocket insurance',
    verdict: 'The blanket you can carry when you did not plan to carry a blanket.',
    fieldNote: 'Recycled nylon, water resistance, four integrated corner stakes, sand pockets, and a genuinely tiny packed shape.',
    dimensions: '63 × 44 in',
    weight: '3.9 oz',
    waterproof: 'Water-resistant',
    wash: 'Hand',
    anchors: 'Stakes + sand pockets',
    tags: ['budget', 'dry', 'pack'],
    caveat: 'Thin by design. It makes a clean boundary, not a padded living room.',
  },
  {
    id: 'ikea-picnic',
    maker: 'IKEA',
    name: 'SOLUPPGÅNG picnic blanket',
    priceUsd: 39.99,
    priceLabel: '$39.99',
    url: 'https://www.ikea.com/us/en/p/soluppgang-picnic-blanket-brown-70619852/',
    image: '/beach-commons/v8/products/ikea-picnic.webp',
    imageSource: 'https://www.ikea.com/us/en/images/products/soluppgang-picnic-blanket-brown__1501620_pe1007384_s5.jpg',
    imageCredit: 'Product photograph: IKEA',
    availability: 'last-chance',
    badge: 'Best inexpensive real picnic blanket',
    verdict: 'The cheapest complete answer: padding, repellent backing, handles.',
    fieldNote: 'A room-for-four format with a water-repellent underside, soft padded top, sewn-in carry handles, and machine washing.',
    dimensions: '51⅛ × 66⅞ in',
    weight: '3 lb 4 oz',
    waterproof: 'Repellent base',
    wash: 'Machine',
    anchors: 'None',
    tags: ['budget', 'dry', 'group'],
    caveat: 'IKEA labels it last chance. It is compact for four seated people, not four sprawled adults.',
  },
  {
    id: 'kelty-biggie',
    maker: 'Kelty',
    name: 'Biggie Blanket',
    priceUsd: 54.95,
    priceLabel: '$54.95',
    url: 'https://kelty.com/products/biggie-blanket?variant=44685009584304',
    image: '/beach-commons/v8/products/kelty-biggie.webp',
    imageSource: 'https://kelty.com/cdn/shop/files/582772_source_1737160196.jpg?v=1743617583&width=1200',
    imageCredit: 'Product photograph: Kelty',
    availability: 'current',
    badge: 'Best sunset warmth per dollar',
    verdict: 'A huge warm layer that should arrive after the ground layer.',
    fieldNote: 'Oversized, insulated, soft on both sides, and sold with a stuff sack. It is the transition from beach day to night air.',
    dimensions: 'About 80 × 82 in',
    weight: '2.95 lb',
    waterproof: 'No',
    wash: 'Machine',
    anchors: 'None',
    tags: ['group', 'warmth'],
    caveat: 'Warmth is not a moisture barrier. Keep it well away from sparks and the fire-ring steward zone.',
  },
  {
    id: 'cgear-original',
    maker: 'CGear',
    name: 'Original Sand-Free Mat, small',
    priceUsd: 64.99,
    priceLabel: '$64.99',
    url: 'https://www.cgear-sandfree.com/products/original-sand-free-mat',
    image: '/beach-commons/v8/products/cgear-original.webp',
    imageSource: 'https://www.cgear-sandfree.com/cdn/shop/files/1_CompactCGearSand-FreeMatinblueandgreen_shownrolledwithcarrybag_perfectforcampingandcaravans_jpg.webp?v=1760155162',
    imageCredit: 'Product photograph: CGear',
    availability: 'current',
    badge: 'Best sand behavior',
    verdict: 'Not sand-proof: sand passes down and resists coming back up.',
    fieldNote: 'Dual-layer polyethylene mesh lets small particles and spills fall through. D-rings give a group an explicit anchoring job.',
    dimensions: '6 × 6 ft',
    weight: '2.9 lb',
    waterproof: 'Permeable by design',
    wash: 'Hose / air-dry',
    anchors: 'D-rings',
    tags: ['group', 'sand'],
    caveat: 'Mesh is a floor, not softness. Add a top layer for elbows, babies, or a long sit.',
  },
  {
    id: 'nomadix-festival',
    maker: 'Nomadix',
    name: 'Festival Blanket',
    priceUsd: 69.95,
    priceLabel: '$69.95',
    url: 'https://www.nomadix.co/products/festival-blanket-hula-multi?variant=42809661325464',
    image: '/beach-commons/v8/products/nomadix-festival.webp',
    imageSource: 'https://www.nomadix.co/cdn/shop/files/festival-blanket-hula-multi-1087810.jpg?v=1761341738',
    imageCredit: 'Product photograph: Nomadix',
    availability: 'current',
    badge: 'Best all-rounder',
    verdict: 'The median answer gets a lot right without becoming furniture.',
    fieldNote: 'A sand-resistant top, water-resistant base, anchoring corners, recycled material, useful 60-by-72-inch area, and sensible two-pound weight.',
    dimensions: '60 × 72 in',
    weight: '32 oz',
    waterproof: 'Water-resistant base',
    wash: 'Machine',
    anchors: 'Corner anchors',
    tags: ['dry', 'pack', 'sand'],
    caveat: 'Water-resistant is not waterproof; no integrated padding is listed.',
  },
  {
    id: 'nemo-victory',
    maker: 'NEMO',
    name: 'Victory Patio Blanket, medium (2025)',
    priceUsd: 70,
    priceLabel: '$70 sale',
    url: 'https://www.nemoequipment.com/products/victory-patio-blanket-2025',
    image: '/beach-commons/v8/products/nemo-victory.webp',
    imageSource: 'https://cdn.shopify.com/s/files/1/0582/1136/9133/files/a9oynk28hlxzdyznxo1i.jpg?v=1751900715',
    imageCredit: 'Product photograph: NEMO Equipment',
    availability: 'sale',
    badge: 'Best padded sale buy',
    verdict: 'A long, plush, waterproof-backed patio that happens to fold.',
    fieldNote: 'Recycled PFC-free top, waterproof bottom, foam padding, machine washability, and an aluminum closure that doubles as a bottle opener.',
    dimensions: '50 × 88 in',
    weight: '5 lb 3 oz',
    waterproof: 'Waterproof base',
    wash: 'Machine',
    anchors: 'None listed',
    tags: ['dry', 'warmth'],
    caveat: 'This is the discounted 2025 model. It is heavy and sale inventory can disappear.',
  },
  {
    id: 'slowtide-koko',
    maker: 'Slowtide',
    name: 'Koko Driftweave Blanket',
    priceUsd: 70,
    priceLabel: '$70',
    url: 'https://slowtide.co/products/koko-driftweave-beach-blanket-cream',
    image: '/beach-commons/v8/products/slowtide-koko.webp',
    imageSource: 'https://slowtide.co/cdn/shop/files/KOKO_TURKISHBLANKET_CREAM_CORNERFLIP_FLAT.jpg?v=1770401594',
    imageCredit: 'Product photograph: Slowtide',
    availability: 'current',
    badge: 'Best hot-day cotton',
    verdict: 'The dry, breathable, good-looking top layer.',
    fieldNote: 'A double-layer cotton gauze weave with a large 66-by-80-inch footprint and a texture intended to release sand more easily than plush cotton.',
    dimensions: '66 × 80 in',
    weight: 'Not listed',
    waterproof: 'No',
    wash: 'Machine',
    anchors: 'None',
    tags: ['cotton', 'group', 'sand'],
    caveat: 'Cream cotton looks great until it meets damp ground. Pair it with mesh or a water-resistant base.',
  },
  {
    id: 'rumpl-everywhere',
    maker: 'Rumpl',
    name: 'Everywhere Mat, Coast Retro Rays',
    priceUsd: 79.95,
    priceLabel: '$79.95',
    url: 'https://www.rumpl.com/products/everywhere-mat-coast-retro-rays',
    image: '/beach-commons/v8/products/rumpl-everywhere.webp',
    imageSource: 'https://www.rumpl.com/cdn/shop/files/rumpl-everywhere-mat-one-size-everywhere-mat-coast-retro-rays-tnsm-crr-o-1146110630.webp?v=1756299322',
    imageCredit: 'Product photograph: Rumpl',
    availability: 'current',
    badge: 'Best engineered compact mat',
    verdict: 'The neatest pack-and-carry object in the group.',
    fieldNote: 'Waterproof bottom, DWR-treated microsuede top, hidden corner stash pockets, and an attached carrying case in a 1.2-pound package.',
    dimensions: '52 × 75 in',
    weight: '1.2 lb',
    waterproof: 'Waterproof base',
    wash: 'Machine',
    anchors: 'Corner loops',
    tags: ['dry', 'pack', 'sand'],
    caveat: 'Full-price colors cost more than some discounted prints. Pick the pattern only after checking the current price.',
  },
  {
    id: 'parks-shadows',
    maker: 'Parks Project',
    name: 'Park Shadows Woven Blanket',
    priceUsd: 110,
    priceLabel: '$110',
    url: 'https://www.parksproject.us/products/park-shadows-woven-blanket',
    image: '/beach-commons/v8/products/parks-shadows.webp',
    imageSource: 'https://www.parksproject.us/cdn/shop/files/PP402092_BLKWHT_ParkShadowsWovenBlanket_001_e1e70305-5d82-446a-982c-4742d677050b.jpg?v=1767746131',
    imageCredit: 'Product photograph: Parks Project',
    availability: 'current',
    badge: 'Best graphic gathering flag',
    verdict: 'A visual center for the group, not a technical ground barrier.',
    fieldNote: 'A 60-inch cotton and recycled-cotton square whose bold woven artwork can make one station immediately legible from across the sand.',
    dimensions: '60 × 60 in',
    weight: 'Not listed',
    waterproof: 'No',
    wash: 'Machine',
    anchors: 'None',
    tags: ['cotton', 'group'],
    caveat: 'You are paying for graphic presence and mission, not wet-ground performance.',
  },
  {
    id: 'business-pleasure',
    maker: 'Business & Pleasure Co.',
    name: 'The Beach Blanket',
    priceUsd: 119,
    priceLabel: '$119',
    url: 'https://businessandpleasureco.com/products/the-beach-blanket-antique-white',
    image: '/beach-commons/v8/products/business-pleasure.webp',
    imageSource: 'https://businessandpleasureco.com/cdn/shop/files/the-beach-blanket-2115048.jpg?v=1780479323',
    imageCredit: 'Product photograph: Business & Pleasure Co.',
    availability: 'current',
    badge: 'Best umbrella ritual',
    verdict: 'The only pick here designed to let the umbrella pass through the room.',
    fieldNote: 'A 68-inch square of fast-drying cotton with a center umbrella hole and a cotton-and-leather carry strap.',
    dimensions: '68 × 68 in',
    weight: '4 lb listed shipping weight',
    waterproof: 'No',
    wash: 'Machine',
    anchors: 'Umbrella center',
    tags: ['cotton', 'group'],
    caveat: 'The center hole is useful only with a properly installed, wind-safe beach umbrella. The blanket itself is not a wet-ground layer.',
  },
  {
    id: 'yeti-lowlands',
    maker: 'YETI',
    name: 'Lowlands Blanket',
    priceUsd: 200,
    priceLabel: '$200',
    url: 'https://www.yeti.com/outdoor-living/outdoor-living-lifestyle/blankets/lowlands-blanket.html',
    image: '/beach-commons/v8/products/yeti-lowlands.webp',
    imageSource: 'https://yeti-webmedia.imgix.net/asset/fc543cd0-76a6-464e-a039-9568be80e381/W/site_studio_outdoor_Lowlands_Cape_Taupe_3QTER_Folded_081_V2_Primary_B_2400x2400.png?bg=0fff&auto=format,compress&w=1200&h=1200',
    imageCredit: 'Product photograph: YETI',
    availability: 'current',
    badge: 'Best dog-and-toddler splurge',
    verdict: 'Heavy, washable, insulated, and difficult to bully with wind.',
    fieldNote: 'A true waterproof utility layer, soft padded top, pet-hair resistance, six utility loops, machine wash-and-dry care, and a large carry bag.',
    dimensions: '78 × 55 in',
    weight: 'About 6.1 lb',
    waterproof: 'Waterproof base',
    wash: 'Machine + dryer',
    anchors: 'Six loops',
    tags: ['dry', 'group', 'warmth'],
    caveat: 'It weighs as much as several compact mats and costs five IKEA picnic blankets. Wet insulation can become much heavier.',
  },
] as const;

export const BLANKET_SYSTEMS: readonly BlanketSystem[] = [
  {
    id: 'ikea-layer-lab',
    name: 'The four-blanket color field',
    eyebrow: '$99.96 IKEA layer lab',
    dek: 'One real ground blanket and three washable throws: base, warmth, spill swap, and an easy way to mark zones.',
    people: '4–8 people',
    lines: [
      { id: 'ikea-picnic', quantity: 1 },
      { id: 'ikea-throw', quantity: 3 },
    ],
    assignment: 'One person owns the dry base; three people each wash and return a throw.',
  },
  {
    id: 'exact-sand-kit',
    name: 'The exact sand kit',
    eyebrow: '$99.99, on the nose',
    dek: 'A six-foot sand-through floor plus the pocket blanket that can move to a satellite conversation.',
    people: '3–5 people',
    lines: [
      { id: 'cgear-original', quantity: 1 },
      { id: 'matador-pocket', quantity: 1 },
    ],
    assignment: 'The CGear owner brings anchors; the Matador owner creates the quiet edge.',
  },
  {
    id: 'warm-dry',
    name: 'The sunset stack',
    eyebrow: '$124.90 warm + dry',
    dek: 'Nomadix faces the ground. Kelty comes out when the wind changes and the group stops pretending it is still hot.',
    people: '3–6 people',
    lines: [
      { id: 'nomadix-festival', quantity: 1 },
      { id: 'kelty-biggie', quantity: 1 },
    ],
    assignment: 'Two carriers, two wash loads, one explicit ember-free warm zone.',
  },
  {
    id: 'engineered-pair',
    name: 'The padded station and roaming mat',
    eyebrow: '$149.95 engineered pair',
    dek: 'The heavier NEMO stays put as the home base; the light Rumpl can become coffee station, kid zone, or moon seat.',
    people: '4–7 people',
    lines: [
      { id: 'nemo-victory', quantity: 1 },
      { id: 'rumpl-everywhere', quantity: 1 },
    ],
    assignment: 'Assign the five-pound NEMO before arrival. The Rumpl lives in the shared wagon.',
  },
  {
    id: 'cotton-square',
    name: 'The soft hot-day room',
    eyebrow: '$140 cotton pair',
    dek: 'Two big breathable cotton fields, intentionally chosen for a dry forecast and paired edge-to-edge.',
    people: '6–8 people',
    lines: [{ id: 'slowtide-koko', quantity: 2 }],
    assignment: 'Two contributors wash one each. Bring a separate damp-proof layer if the marine layer is staying.',
  },
  {
    id: 'graphic-room',
    name: 'The visible living room',
    eyebrow: '$229 graphic + umbrella',
    dek: 'One black-and-white visual flag plus the cotton square whose center can accept a properly secured umbrella.',
    people: '6–10 people',
    lines: [
      { id: 'parks-shadows', quantity: 1 },
      { id: 'business-pleasure', quantity: 1 },
    ],
    assignment: 'This is the celebration path: one art steward, one shade steward, and a backup plan for wind.',
  },
  {
    id: 'yeti-single',
    name: 'The one-object base camp',
    eyebrow: '$200 single splurge',
    dek: 'A heavy, padded, pet-ready, washable ground room for the group that values one dependable object over a layered kit.',
    people: '3–5 people + dog',
    lines: [{ id: 'yeti-lowlands', quantity: 1 }],
    assignment: 'The owner also owns the carry, wash, dry, and return-to-storage cycle.',
  },
] as const;

export const AFFILIATE_PATHS = [
  {
    maker: 'Kelty',
    status: 'Public affiliate application',
    terms: 'Up to 10% commission, 30-day cookie, AvantLink; acceptance required.',
    url: 'https://kelty.com/pages/affiliate-program',
  },
  {
    maker: 'Slowtide',
    status: 'Creator / ambassador application',
    terms: 'Affiliate commissions and discount codes are listed as possible opportunities; approval required.',
    url: 'https://slowtide.co/pages/collab',
  },
  {
    maker: 'Nomadix',
    status: 'Collaboration application',
    terms: 'Official page lists affiliate marketing and 15% commission for approved links.',
    url: 'https://www.nomadix.co/pages/collab',
  },
  {
    maker: 'Rumpl',
    status: 'Affiliate contact published',
    terms: 'Rumpl publishes affiliate@rumpl.com; no PointCast account or commission terms are verified.',
    url: 'https://www.rumpl.com/pages/contact',
  },
  {
    maker: 'Business & Pleasure Co.',
    status: 'Creator Collective application',
    terms: 'Affiliate opportunities, gifting, and collaborations are considered; approval required.',
    url: 'https://businessandpleasureco.com/pages/creator-collective',
  },
  {
    maker: 'REI Co-op',
    status: 'Public affiliate application',
    terms: 'Useful future retailer path for some reviewed outdoor brands; PointCast is not enrolled.',
    url: 'https://www.rei.com/help?a=Become-an-REI-Co-op-Affiliate',
  },
] as const;

export const MERCHANT_OFFERS = [
  {
    maker: 'Rumpl',
    offer: '15% off a first eligible full-price order after email signup.',
    code: 'No public code; signup offer',
    checkedAt: '2026-07-27',
    url: 'https://www.rumpl.com/pages/promotions',
  },
  {
    maker: 'Business & Pleasure Co.',
    offer: '10% off a first order after newsletter and SMS signup; merchant terms apply.',
    code: 'No public code; signup offer',
    checkedAt: '2026-07-27',
    url: 'https://businessandpleasureco.com/pages/promotions-and-coupon-codes',
  },
] as const;

export const BLANKET_OFFICIAL_CONTEXT = [
  {
    title: 'Dockweiler State Beach',
    note: 'LA County’s primary visitor page for hours, parking, conditions, contacts, and current beach information.',
    url: 'https://beaches.lacounty.gov/dockweiler-beach/',
  },
  {
    title: 'Beach access',
    note: 'Access mats and beach-wheelchair information should shape the layout before blankets do.',
    url: 'https://beaches.lacounty.gov/la-county-beach-ada-access/',
  },
  {
    title: 'Beach rules',
    note: 'Re-check current rules and do not treat a product guide as permission for a gathering, structure, fire, or commercial activity.',
    url: 'https://beaches.lacounty.gov/la-county-beach-rules/',
  },
] as const;

export function getBlanketPick(id: string) {
  return BLANKET_PICKS.find((pick) => pick.id === id);
}

export function blanketSystemTotal(system: BlanketSystem) {
  return system.lines.reduce(
    (total, line) => total + (getBlanketPick(line.id)?.priceUsd ?? 0) * line.quantity,
    0,
  );
}
