export type BeachUtilityCategory =
  | 'carry'
  | 'coffee'
  | 'fire'
  | 'ground'
  | 'light'
  | 'seat'
  | 'shade'
  | 'table';

export type BeachUtilityPick = {
  id: string;
  maker: string;
  name: string;
  category: BeachUtilityCategory;
  priceUsd: number;
  priceLabel: string;
  url: string;
  availability: 'current' | 'last-chance' | 'sale' | 'service';
  badge: string;
  verdict: string;
  fieldNote: string;
  boundary?: string;
  affiliateProgram?: {
    status: 'available-not-enrolled';
    label: string;
    url: string;
  };
};

export type BeachUtilityCart = {
  id: string;
  name: string;
  eyebrow: string;
  dek: string;
  people: string;
  productIds: readonly { id: string; quantity: number }[];
  note: string;
};

export const BEACH_COMMONS_V7 = {
  schema: 'https://pointcast.xyz/schemas/shopping-desk/v1',
  id: 'PC-FIELD-STUDY-007',
  edition: 7,
  title: 'The Beach Utility Index',
  subtitle: 'Twenty-five useful things. Eight carts. Nothing earns a ride home for free.',
  dek: 'A 2026 shopping desk for the $100 Beach Commons: IKEA hacks, serious shade, coffee without a generator, reusable cups, low light, fire-ring safety, and the products we would leave on the shelf.',
  url: 'https://pointcast.xyz/beach-commons/v7',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v7.json',
  blockUrl: 'https://pointcast.xyz/b/0518',
  blockId: '0518',
  publishedAt: '2026-07-27',
  priceCheckedAt: '2026-07-27T20:20:00-07:00',
  priceBoundary:
    'Prices are editorial snapshots in USD before tax, shipping, local stock, memberships, or promotions. Re-check the merchant page before buying.',
  affiliateBoundary:
    'Every product link in this edition is a plain direct merchant link. PointCast earns $0 from them today. No affiliate parameters, referral codes, sponsored placement, merchant samples, or hands-on product testing are claimed.',
  editorialBoundary:
    'This is independent PointCast service journalism inspired by the clarity and pleasure of a good magazine shopping desk. It is not affiliated with, commissioned by, or presented as New York Magazine or The Strategist.',
  fieldBoundary:
    'This is a shopping and coordination prototype, not an announced or permitted event. Organized groups, tables, chairs, tents, cooking, amplified sound, vendors, and paid activity may trigger County review or permits.',
  previousEdition: {
    title: 'The $100 Fire-Ring Commons',
    url: 'https://pointcast.xyz/beach-commons/v6',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v6.json',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating Beach Commons challenge, and PointCast',
    },
    {
      name: 'Codex / OpenAI',
      role: 'current-product research, field constraints, editorial system, data, and implementation',
    },
  ],
} as const;

export const BEACH_UTILITY_PICKS: readonly BeachUtilityPick[] = [
  {
    id: 'frakta',
    maker: 'IKEA',
    name: 'FRAKTA large shopping bag',
    category: 'carry',
    priceUsd: 0.99,
    priceLabel: '$0.99',
    url: 'https://www.ikea.com/us/en/p/frakta-shopping-bag-large-blue-20611108/',
    availability: 'current',
    badge: 'Best 99¢ architecture',
    verdict: 'Buy ten before buying one precious beach bag.',
    fieldNote: 'Nineteen gallons, a 55-pound listed maximum load, flat-folding, wipe-clean, and easy to assign by module.',
    boundary: 'Not approved for direct food contact. A bag is not a rigid crate and should not carry hot ash.',
  },
  {
    id: 'kalas',
    maker: 'IKEA',
    name: 'KALAS tumbler, six-pack',
    category: 'coffee',
    priceUsd: 1.99,
    priceLabel: '$1.99 / 6',
    url: 'https://www.ikea.com/us/en/p/kalas-tumbler-mixed-colors-00461379/',
    availability: 'current',
    badge: 'Color-code the commons',
    verdict: 'The cheapest useful way to make “that one is mine” obvious.',
    fieldNote: 'Stackable, impact-resistant reusable cups whose colors can double as team or task markers.',
  },
  {
    id: 'grilltider-mugs',
    maker: 'IKEA',
    name: 'GRILLTIDER stainless-steel mugs, two-pack',
    category: 'coffee',
    priceUsd: 4.99,
    priceLabel: '$4.99 / 2',
    url: 'https://www.ikea.com/us/en/cat/grilltider-series-54974/',
    availability: 'current',
    badge: 'Tiny steel upgrade',
    verdict: 'Two nearly indestructible cups for less than one disposable-coffee run.',
    fieldNote: 'Use for hot drinks or as durable measuring and sorting cups. Mark the handles with removable bands.',
  },
  {
    id: 'grilltider-tools',
    maker: 'IKEA',
    name: 'GRILLTIDER two-piece barbecue tool set',
    category: 'fire',
    priceUsd: 6.99,
    priceLabel: '$6.99',
    url: 'https://www.ikea.com/us/en/p/grilltider-2-piece-barbecue-tools-set-stainless-steel-40615092/',
    availability: 'current',
    badge: 'Long-handled, low drama',
    verdict: 'A spatula and tongs are more useful than another decorative fire accessory.',
    fieldNote: 'Reserve and label them for the fire-ring module so they do not disappear into the coffee station.',
    boundary: 'Tools do not authorize a fire, grill, fuel, or cooking setup.',
  },
  {
    id: 'soluppgang-board',
    maker: 'IKEA',
    name: 'SOLUPPGÅNG bamboo cutting board',
    category: 'table',
    priceUsd: 7.99,
    priceLabel: '$7.99',
    url: 'https://www.ikea.com/us/en/p/soluppgang-cutting-board-bamboo-10619869/',
    availability: 'last-chance',
    badge: 'The $8 station top',
    verdict: 'A small clean work surface that makes a floppy setup feel intentional.',
    fieldNote: 'Use as a coffee tray, repair surface, cup corral, or sign board. It hangs from its corner hole.',
  },
  {
    id: 'taggoga',
    maker: 'IKEA',
    name: 'TAGGÖGA vacuum flask, 1.7 qt',
    category: 'coffee',
    priceUsd: 14.99,
    priceLabel: '$14.99',
    url: 'https://www.ikea.com/us/en/p/taggoega-vacuum-flask-off-white-90541353/',
    availability: 'current',
    badge: 'Best group thermos value',
    verdict: 'Bring two: one regular, one decaf or hot water.',
    fieldNote: 'The generous volume suits a serve-from-home coffee station and avoids a burner, kettle, or generator on sand.',
  },
  {
    id: 'soluppgang-bag',
    maker: 'IKEA',
    name: 'SOLUPPGÅNG drawstring bag',
    category: 'carry',
    priceUsd: 16.99,
    priceLabel: '$16.99',
    url: 'https://www.ikea.com/us/en/p/soluppgang-bag-mixed-colors-20619798/',
    availability: 'last-chance',
    badge: 'Soft gear captain',
    verdict: 'The nice-looking bag for the module that needs pockets and a closure.',
    fieldNote: 'Machine-washable recycled polyester, expandable height, shoulder handles, outer pocket, and practical gear loops.',
  },
  {
    id: 'tarpco',
    maker: 'TARPCO / Home Depot',
    name: 'Silver-black 8 × 10 ft heavy-duty tarp',
    category: 'ground',
    priceUsd: 31.48,
    priceLabel: '$31.48',
    url: 'https://www.homedepot.com/p/321673749',
    availability: 'current',
    badge: 'The unglamorous essential',
    verdict: 'Buy the thick tarp; use it flat; hose it; fold it; stop romanticizing it.',
    fieldNote: 'Fourteen-mil polyethylene, waterproof, UV-resistant, and grommeted. Useful as a ground or gear cloth.',
    boundary: 'At Dockweiler, do not improvise this into an overhead sail without current clearance and a wind-safe plan.',
  },
  {
    id: 'soluppgang-lantern',
    maker: 'IKEA',
    name: 'SOLUPPGÅNG dimmable outdoor LED lantern',
    category: 'light',
    priceUsd: 24.99,
    priceLabel: '$24.99',
    url: 'https://www.ikea.com/us/en/p/soluppgang-led-lantern-outdoor-battery-operated-dimmable-40621286/',
    availability: 'last-chance',
    badge: 'Low light, on purpose',
    verdict: 'Put it on the lowest useful setting and let the moon keep its job.',
    fieldNote: 'A dimmable, battery-operated marker for a coffee table, gear wagon, or access edge.',
    boundary: 'Keep light low, shielded, warm-looking, and away from habitat and wildlife.',
  },
  {
    id: 'soluppgang-stool',
    maker: 'IKEA',
    name: 'SOLUPPGÅNG folding outdoor stool',
    category: 'seat',
    priceUsd: 25,
    priceLabel: '$25',
    url: 'https://www.ikea.com/us/en/p/soluppgang-stool-outdoor-eucalyptus-70621303/',
    availability: 'last-chance',
    badge: 'Four make $100',
    verdict: 'The cleanest literal answer to the contribution challenge.',
    fieldNote: 'Foldable eucalyptus seat, listed at 2 lb 9 oz and tested to 243 lb. Four become a neat $100 module.',
  },
  {
    id: 'kidde',
    maker: 'Kidde / Home Depot',
    name: 'Home 1-A:10-B:C fire extinguisher',
    category: 'fire',
    priceUsd: 26.47,
    priceLabel: '$26.47',
    url: 'https://www.homedepot.com/p/303196116',
    availability: 'current',
    badge: 'Ask first, then equip',
    verdict: 'A concrete starting point for the safety conversation, not the end of it.',
    fieldNote: 'ABC-rated for wood, trash, flammable-liquid, gas, and electrical fires; listed weight is 2.5 lb of agent.',
    boundary: 'Confirm the required extinguisher type, size, placement, and trained operator with County or fire staff for the actual activity.',
  },
  {
    id: 'fire-gloves',
    maker: 'G & F Products / Home Depot',
    name: 'Long-cuff suede fire gloves',
    category: 'fire',
    priceUsd: 14.4,
    priceLabel: '$14.40',
    url: 'https://www.homedepot.com/p/300641028',
    availability: 'current',
    badge: 'Long cuff, clear limit',
    verdict: 'Good hand protection for tools and hot grates, with the important warning that resistant is not fireproof.',
    fieldNote: 'Cowhide suede, cotton lining, and a 14.5-inch cuff. Keep them dry, marked, and assigned to one steward.',
    boundary: 'Avoid prolonged contact with flame or hot material; gloves do not make unsafe handling safe.',
  },
  {
    id: 'metal-pail',
    maker: 'Behrens / Home Depot',
    name: '10 qt galvanized-steel pail',
    category: 'fire',
    priceUsd: 18.97,
    priceLabel: '$18.97',
    url: 'https://www.homedepot.com/b/Behrens/N-5yc1vZ47eZ25egxe',
    availability: 'current',
    badge: 'Cold-tool corral',
    verdict: 'A simple metal container for cold tools and cleanup—never a license to move live ash.',
    fieldNote: 'Use only according to current official fire and ash direction; label the pail for the fire module.',
    boundary: 'Do not move, store, or transport hot coals or ash unless officials explicitly direct the method.',
  },
  {
    id: 'sluka',
    maker: 'IKEA',
    name: 'SLUKA vacuum flask, 61 oz',
    category: 'coffee',
    priceUsd: 29.99,
    priceLabel: '$29.99',
    url: 'https://www.ikea.com/us/en/p/sluka-vacuum-flask-stainless-steel-40149848/',
    availability: 'current',
    badge: 'The big coffee one',
    verdict: 'The sturdier-looking choice when one flask has to be the station.',
    fieldNote: 'A 61-ounce stainless-steel vacuum flask with a pump-style group-serving form and dishwasher-safe listing.',
  },
  {
    id: 'matador',
    maker: 'Matador',
    name: 'Pocket Blanket',
    category: 'ground',
    priceUsd: 35,
    priceLabel: '$35',
    url: 'https://www.matadorequipment.com/products/pocket-blanket-slate-blue',
    availability: 'current',
    badge: 'Best always-with-you ground',
    verdict: 'The blanket you can actually keep in the wagon’s emergency pocket.',
    fieldNote: 'Seats two to four, weighs 3.9 ounces, packs to pocket size, and uses water-resistant recycled nylon.',
    boundary: 'Its integrated corner stakes and sand pockets still require responsible placement and full removal.',
  },
  {
    id: 'klean-four',
    maker: 'Klean Kanteen',
    name: '16 oz steel pint cups, four-pack',
    category: 'coffee',
    priceUsd: 35.96,
    priceLabel: '$35.96 sale',
    url: 'https://www.kleankanteen.com/collections/cups-mugs/products/stainless-steel-pint-cup-16oz-4-pack',
    availability: 'sale',
    badge: 'Cups worth keeping',
    verdict: 'Spend here when the group will reuse them for years.',
    fieldNote: 'Nestable 18/8 stainless steel, dishwasher-safe, non-breakable, and backed by a lifetime limited warranty.',
  },
  {
    id: 'strandon-table',
    maker: 'IKEA',
    name: 'STRANDÖN folding beach table',
    category: 'table',
    priceUsd: 39.99,
    priceLabel: '$39.99',
    url: 'https://www.ikea.com/us/en/p/strandoen-folding-table-bright-yellow-00600460/',
    availability: 'last-chance',
    badge: 'Best table for actual sand',
    verdict: 'The yellow mesh top looks cheerful and lets water and sand pass instead of pooling.',
    fieldNote: 'A folding table explicitly sold for the beach or park. Make it the coffee, first-aid, or repair station.',
    boundary: 'An organized setup of tables and chairs may require a Special Event Use Permit.',
  },
  {
    id: 'soluppgang-blanket',
    maker: 'IKEA',
    name: 'SOLUPPGÅNG picnic blanket',
    category: 'ground',
    priceUsd: 39.99,
    priceLabel: '$39.99',
    url: 'https://www.ikea.com/us/en/p/soluppgang-picnic-blanket-brown-70619852/',
    availability: 'last-chance',
    badge: 'Comfort without a sofa',
    verdict: 'Room for four, washable, water-repellent, and already equipped with roll straps.',
    fieldNote: 'A padded 51 × 67 inch ground layer that rolls into its own carry shape.',
  },
  {
    id: 'biolite',
    maker: 'BioLite',
    name: 'AlpenGlow 250 lantern',
    category: 'light',
    priceUsd: 59.95,
    priceLabel: '$59.95',
    url: 'https://www.bioliteenergy.com/products/alpenglow-250',
    availability: 'current',
    badge: 'Best little party light',
    verdict: 'Useful white light first, color and candle play second, phone charging only in a pinch.',
    fieldNote: '250 lumens, rechargeable 3,200 mAh battery, warm and cool modes, multicolor play, 7.4 ounces, and IPX4 resistance.',
    boundary: 'Party mode is not permission for glare, amplified entertainment, or all-night use.',
    affiliateProgram: {
      status: 'available-not-enrolled',
      label: 'BioLite has an affiliate program; PointCast is not enrolled and this link is plain.',
      url: 'https://www.bioliteenergy.com/pages/biolite-affiliate-program',
    },
  },
  {
    id: 'cgear',
    maker: 'CGEAR',
    name: 'Original Sand-Free Mat, small',
    category: 'ground',
    priceUsd: 64.99,
    priceLabel: 'from $64.99',
    url: 'https://www.cgear-sandfree.com/products/original-sand-free-mat',
    availability: 'current',
    badge: 'Best base for a station',
    verdict: 'More floor than blanket: sand and spills pass down through the dual-layer weave.',
    fieldNote: 'UV-stabilized polyethylene, reinforced seams, quick drying, and useful under the coffee or repair station.',
    boundary: 'Do not leave D-rings or anchors behind; avoid habitat and any placement that blocks public access.',
  },
  {
    id: 'aeropress',
    maker: 'AeroPress',
    name: 'Go Plus travel coffee system',
    category: 'coffee',
    priceUsd: 89.95,
    priceLabel: '$89.95',
    url: 'https://aeropress.com/products/aeropress-go-plus',
    availability: 'current',
    badge: 'Best one-person coffee ritual',
    verdict: 'Excellent object, wrong tool for serving twenty people unless brewing becomes the activity.',
    fieldNote: 'The press, tumbler, scoop, stirrer, and filter holder pack together. Capacity is one to two cups.',
    boundary: 'Bring safe hot water from home; do not add a burner merely to justify the brewer.',
  },
  {
    id: 'mac-wagon',
    maker: 'MacSports',
    name: 'All-Terrain Beach Wagon',
    category: 'carry',
    priceUsd: 125.99,
    priceLabel: '$125.99 sale',
    url: 'https://macsports.com/products/allterrain-beach-wagon',
    availability: 'sale',
    badge: 'Best commons multiplier',
    verdict: 'If the group buys one thing above $100, make it the thing that gets everything else home.',
    fieldNote: 'Large wheels, 150-pound listed capacity, under-10-inch folded footprint, and under-22-pound listed weight.',
    boundary: 'A wagon does not create an accessible route; use the official access mat and service where appropriate.',
  },
  {
    id: 'holiday-umbrella',
    maker: 'Business & Pleasure Co.',
    name: 'Holiday Beach Umbrella',
    category: 'shade',
    priceUsd: 199,
    priceLabel: '$199',
    url: 'https://businessandpleasureco.com/products/holiday-beach-umbrella-ocean-mimosa-stripe',
    availability: 'current',
    badge: 'The style-tax umbrella',
    verdict: 'Compact, handsome, and half the shade of the cheaper communal imagination.',
    fieldNote: 'The maker lists a five-foot canopy, 6 ft 6 in height, seven-pound weight, and a two-piece timber pole.',
    boundary: 'Use only with a wind-safe setup that complies with current shelter rules; close and pack it when conditions turn.',
  },
  {
    id: 'helinox',
    maker: 'Helinox',
    name: 'Beach Chair (re)',
    category: 'seat',
    priceUsd: 209.95,
    priceLabel: '$209.95',
    url: 'https://helinox.com/products/beach-chair-re',
    availability: 'current',
    badge: 'The luxury personal seat',
    verdict: 'A thoughtful sand chair, but one costs more than eight IKEA stools.',
    fieldNote: 'Low, high-backed, flat-footed for sand, 3.8-pound packed weight, 320-pound listed capacity, and five-year warranty.',
  },
  {
    id: 'shibumi-mini',
    maker: 'Shibumi Shade',
    name: 'Shibumi Shade Mini',
    category: 'shade',
    priceUsd: 215,
    priceLabel: 'from $215',
    url: 'https://shibumishade.com/collections/shades',
    availability: 'current',
    badge: 'Best tiny shared roof',
    verdict: 'Two pounds and 75 square feet of shade is a compelling communal object—when the wind and rules agree.',
    fieldNote: 'The maker lists shade for up to four, a carry-on-friendly bag, UPF 50+, and setup in under three minutes.',
    boundary: 'Wind-powered shade still needs current rule, wind, placement, anchoring, habitat, and public-passage checks.',
  },
];

export const BEACH_UTILITY_CARTS: readonly BeachUtilityCart[] = [
  {
    id: 'blue-bag-commons',
    name: 'The $98.95 IKEA Commons',
    eyebrow: 'Best first contribution',
    dek: 'A real table, four kinds of cup capacity, two seats, and two bags. Almost no object is too precious to lend.',
    people: '2 seated / 8 drinking',
    productIds: [
      { id: 'strandon-table', quantity: 1 },
      { id: 'soluppgang-stool', quantity: 2 },
      { id: 'frakta', quantity: 2 },
      { id: 'kalas', quantity: 1 },
      { id: 'grilltider-mugs', quantity: 1 },
    ],
    note: 'The literal $100 play. Local tax pushes it over; the pre-tax cart does not.',
  },
  {
    id: 'four-stools',
    name: 'The Exact $100 Seat Module',
    eyebrow: 'Best clean handoff',
    dek: 'Four identical folding stools. No shopping puzzle, no duplicate chargers, no mystery bin.',
    people: '4 seated',
    productIds: [{ id: 'soluppgang-stool', quantity: 4 }],
    note: 'Assign each stool a color band and teardown owner.',
  },
  {
    id: 'coffee-dock',
    name: 'The $94.89 Two-Flask Coffee Dock',
    eyebrow: 'Best morning station',
    dek: 'Brew at home, arrive hot, pour into steel, and keep an inexpensive second cup set for late arrivals.',
    people: '8–12 small pours',
    productIds: [
      { id: 'taggoga', quantity: 2 },
      { id: 'klean-four', quantity: 1 },
      { id: 'soluppgang-bag', quantity: 1 },
      { id: 'soluppgang-board', quantity: 1 },
      { id: 'kalas', quantity: 1 },
      { id: 'frakta', quantity: 2 },
    ],
    note: 'No burner, generator, glass server, or live brew queue.',
  },
  {
    id: 'ground-truth',
    name: 'The $106.47 Ground Truth',
    eyebrow: 'Best three-layer experiment',
    dek: 'One rugged tarp, one pocket blanket, and one padded picnic blanket. Learn what the site actually needs.',
    people: '6–10 sitting or sorting',
    productIds: [
      { id: 'tarpco', quantity: 1 },
      { id: 'matador', quantity: 1 },
      { id: 'soluppgang-blanket', quantity: 1 },
    ],
    note: 'Use flat. Do not turn the tarp into an unengineered canopy.',
  },
  {
    id: 'low-light',
    name: 'The $84.94 Low-Light Pair',
    eyebrow: 'Best blue-hour upgrade',
    dek: 'One good rechargeable lantern for task light and one inexpensive dimmable lantern for the table edge.',
    people: 'One compact station',
    productIds: [
      { id: 'biolite', quantity: 1 },
      { id: 'soluppgang-lantern', quantity: 1 },
    ],
    note: 'Use the least light that does the job. Color mode is a short score, not the default.',
  },
  {
    id: 'fire-backup',
    name: 'The $66.83 Fire-Ring Starter',
    eyebrow: 'Best safety conversation',
    dek: 'An ABC extinguisher, long suede gloves, and long-handled tools—then an actual authority check before use.',
    people: 'One trained fire steward',
    productIds: [
      { id: 'kidde', quantity: 1 },
      { id: 'grilltider-tools', quantity: 1 },
      { id: 'fire-gloves', quantity: 1 },
      { id: 'metal-pail', quantity: 1 },
    ],
    note: 'Confirm the full setup with current official guidance; do not improvise extinguishing or ash handling.',
  },
  {
    id: 'pack-out',
    name: 'The $135.89 One-Trip Pack-Out',
    eyebrow: 'Best operational purchase',
    dek: 'A sand-capable wagon plus ten blue module bags. Setup and teardown become legible at a glance.',
    people: '10 module captains',
    productIds: [
      { id: 'mac-wagon', quantity: 1 },
      { id: 'frakta', quantity: 10 },
    ],
    note: 'Number the bags 01–10 and make the final empty-beach count public.',
  },
  {
    id: 'shared-shade',
    name: 'The $279.99 Shared-Shade Upgrade',
    eyebrow: 'Best one-object splurge',
    dek: 'A compact wind-powered shade above a sand-shedding mat. A roof and a room, but only for the day.',
    people: 'Up to 4 in shade',
    productIds: [
      { id: 'shibumi-mini', quantity: 1 },
      { id: 'cgear', quantity: 1 },
    ],
    note: 'Buy only after checking shelter dimensions, anchoring, weather, habitat, public access, and event-permit scope.',
  },
];

export const BEACH_UTILITY_OFFICIAL_CONTEXT = [
  {
    title: 'LA County Beach Rules FAQ',
    url: 'https://beaches.lacounty.gov/la-county-beach-rules-faq/',
    note: 'Canopies and picnics are generally allowed; big parties need permits; portable fire pits are not allowed.',
  },
  {
    title: 'LA County beach ordinance',
    url: 'https://library.municode.com/ca/los%20angeles%20county/codes/code%20of%20ordinances?nodeId=TIT17PABEOTPUAR_CH17.12BE_PT3RURE_17.12.170APPR',
    note: 'No overnight camping; ordinary shelters must be under 10 × 10 feet, open on two sides, and visible from outside on at least two sides.',
  },
  {
    title: 'Dockweiler fire pits',
    url: 'https://beaches.lacounty.gov/dockweiler-beach-fire-pits/',
    note: 'About 40 first-come rings; grills must fit inside a two-foot ring; no fire or grill on the sand; do not use sand to put out a fire.',
  },
  {
    title: 'LA County Special Event Permit',
    url: 'https://beaches.lacounty.gov/special-event-permit/',
    note: 'Organized groups and activities with tables, chairs, vendors, or non-school field trips need advance review.',
  },
  {
    title: 'LA County beach access',
    url: 'https://beaches.lacounty.gov/la-county-beach-ada-access/',
    note: 'Dockweiler has an access mat and six free beach wheelchairs at the Youth Center, with reservation guidance on the official page.',
  },
] as const;

export function getBeachUtilityPick(id: string) {
  return BEACH_UTILITY_PICKS.find((pick) => pick.id === id);
}

export function beachUtilityCartTotal(cart: BeachUtilityCart) {
  return cart.productIds.reduce((total, line) => {
    const product = getBeachUtilityPick(line.id);
    return total + (product?.priceUsd ?? 0) * line.quantity;
  }, 0);
}
