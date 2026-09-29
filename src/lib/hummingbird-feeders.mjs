/**
 * Hummingbird feeders — PointCast Review Lab desk review (2026-09-28).
 *
 * DESK REVIEW: PointCast has not used these feeders. Every spec, price and
 * complaint below comes from the maker pages, retailer listings and testers
 * cited in SOURCES. Hands-on tester reports cover only two of the nine (Bob
 * Vila on the HighView and the 217) plus Bird Watching HQ on the 16-oz
 * sibling of the First Nature 3055; the rest rest on maker and retailer pages. The ranking is computed from a published rubric in this
 * file, so the page, the JSON and the tests all read the same numbers.
 *
 * No affiliate links. Product links go only to maker pages opened in the
 * research pass; retailer listings appear as citations, never as buy links.
 */

export const DESK_DATE = '2026-09-28';
export const ART_CREDIT = 'Art: Astra (Codex), after hummingbird paintings supplied by Mike Hoydich';
export const NO_COMMISSION = 'No link, no commission.';

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

/** kind: maker | retailer | tester | care | field | study | plants */
export const SOURCES = [
  { id: 'pp-209b', kind: 'maker', publisher: 'Perky-Pet', title: 'Our Best Glass Hummingbird Feeder 209B-1SR', url: 'https://www.perkypet.com/perky-pet-best-glass-hummingbird-feeder-209b-1sr' },
  { id: 'pp-217', kind: 'maker', publisher: 'Perky-Pet', title: 'Window-Mount Plastic Hummingbird Feeder 217', url: 'https://www.perkypet.com/perky-pet-window-mount-plastic-hummingbird-feeder-217' },
  { id: 'mb-diamond', kind: 'maker', publisher: 'Perky-Pet', title: 'More Birds Bird Health+ Diamond (30 oz, ant moat)', url: 'https://www.perkypet.com/more-birds-bird-health-plus-diamond-hummingbird-feeder-with-glass-bottle-built-in-ant-moat' },
  { id: 'mb-big-gulp', kind: 'maker', publisher: 'Perky-Pet', title: 'More Birds Bird Health+ Big Gulp (40 oz, ant moat)', url: 'https://www.perkypet.com/more-birds-bird-health-plus-big-gulp-hummingbird-feeder-with-glass-bottle-built-in-ant-moat' },
  { id: 'hz-jewel-box', kind: 'maker', publisher: 'Aspects / HummZinger', title: 'Jewel Box Window Hummingbird Feeder', url: 'https://hummzinger.com/product/jewel-box-window-hummingbird-feeder/' },
  { id: 'jcs-first-nature', kind: 'retailer', publisher: "JCs Wildlife", title: 'First Nature 3055 32 oz Hummingbird Feeder', url: 'https://www.jcswildlife.com/products/first-nature-large-hummingbird-feeder-3055-32-oz-1-2-3-4-or-6-pack' },
  { id: 'duncraft-best-1', kind: 'retailer', publisher: 'Duncraft', title: 'Best-1 Hummingbird Feeder 32 oz', url: 'https://duncraft.com/products/best-1-hummingbird-feeder-32-oz' },
  { id: 'coastal-ace-3in1', kind: 'retailer', publisher: 'Coastal Ace', title: 'More Birds 3-in-1 Saucer Hummingbird Feeder', url: 'https://www.mycoastalace.com/products/feeder-humbird-3-n-1' },
  { id: 'bwhq', kind: 'tester', publisher: 'Bird Watching HQ', title: 'The 9 Best Hummingbird Feeders', url: 'https://birdwatchinghq.com/best-hummingbird-feeders/' },
  { id: 'bob-vila', kind: 'tester', publisher: 'Bob Vila', title: 'Our Tested Picks: The Best Hummingbird Feeders', url: 'https://www.bobvila.com/articles/best-hummingbird-feeders/' },
  { id: 'birds-blooms', kind: 'tester', publisher: 'Birds & Blooms', title: 'Glass vs Plastic Hummingbird Feeder', url: 'https://www.birdsandblooms.com/birding/attracting-hummingbirds/glass-vs-plastic-hummingbird-feeder/' },
  { id: 'audubon-pests', kind: 'care', publisher: 'Audubon', title: 'How to Keep Your Hummingbird Feeder Free from Pests', url: 'https://www.audubon.org/news/how-keep-your-hummingbird-feeder-free-pests' },
  { id: 'audubon-nectar', kind: 'care', publisher: 'Audubon', title: 'How to Make Hummingbird Nectar', url: 'https://www.audubon.org/news/how-make-hummingbird-nectar' },
  { id: 'audubon-faq', kind: 'care', publisher: 'Audubon', title: 'Hummingbird Feeding FAQs', url: 'https://www.audubon.org/magazine/hummingbird-feeding-faqs' },
  { id: 'hummingbird-society', kind: 'care', publisher: 'Hummingbird Society', title: 'How to Keep Bees, Wasps, and Ants Out of Your Hummingbird Feeders', url: 'https://www.hummingbirdsociety.org/post/how-to-keep-bees-wasps-and-ants-out-of-your-hummingbird-feeders' },
  { id: 'yakima-audubon', kind: 'care', publisher: 'Yakima Valley Audubon Society', title: 'Preventing Bird Window Strikes', url: 'https://yakimaaudubon.org/help-birds/preventing-bird-window-strikes/' },
  { id: 'audubon-annas', kind: 'field', publisher: 'Audubon Field Guide', title: "Anna's Hummingbird", url: 'https://www.audubon.org/field-guide/bird/annas-hummingbird' },
  { id: 'audubon-allens', kind: 'field', publisher: 'Audubon Field Guide', title: "Allen's Hummingbird", url: 'https://www.audubon.org/field-guide/bird/allens-hummingbird' },
  { id: 'condor-2017', kind: 'study', publisher: 'The Condor (Clark, 2017)', title: "eBird records show substantial growth of the Allen's Hummingbird population in urban Southern California", url: 'https://academic.oup.com/condor/article/119/1/122/5152898' },
  { id: 'feederwatch-winter', kind: 'field', publisher: 'Cornell Lab Project FeederWatch', title: 'Hummingbirds in Winter', url: 'https://feederwatch.org/learn/articles/hummingbirds-in-winter/' },
  { id: 'pvsb-sierra', kind: 'field', publisher: 'Palos Verdes–South Bay Sierra Club', title: 'Along the Path: Hummingbirds, the Fastest Thing on Wings', url: 'https://pvsbsierraclub.org/2018/10/30/along-the-path-hummingbirds-the-fastest-thing-on-wings/' },
  { id: 'cnps-south-coast', kind: 'plants', publisher: 'CNPS South Coast Chapter', title: 'CA Native Plants for the S. CA Habitat Garden', url: 'https://chapters.cnps.org/southcoast/2024/10/07/ca-native-plants-for-the-s-ca-habitat-garden/' },
  { id: 'calscape', kind: 'plants', publisher: 'Calscape (CNPS)', title: 'California Native Plants Support Wildlife and Pollinators', url: 'https://calscape.org/support-wildlife/' },
];

export const SOURCE_GROUPS = [
  { kind: 'maker', label: 'Maker pages' },
  { kind: 'retailer', label: 'Retailer listings (cited for specs only; not buy links)' },
  { kind: 'tester', label: 'Testers and reviewers' },
  { kind: 'care', label: 'Nectar, pests and window care' },
  { kind: 'field', label: 'Field guides and local birding' },
  { kind: 'study', label: 'Science' },
  { kind: 'plants', label: 'Native plants' },
];

export const sourcesById = new Map(SOURCES.map((s) => [s.id, s]));

/** What this pass could not confirm. Printed on the page and in the JSON. */
export const UNVERIFIED = [
  "Cornell's All About Birds cleaning page returned a 403 during research, so its widely repeated guidance (a weekly hot-water wash with no soap, or a 1:9 bleach soak followed by a thorough clean-water rinse; nectar changed every 3 to 5 days) is second-hand here. The care guide follows Audubon's stricter rule instead: wash the feeder at every nectar change.",
  'Wirecutter has no dedicated hummingbird-feeder review that we found.',
  'Each verified price is one listing, named in the table and checked 2026-09-28; prices move by retailer and season. Every "dishwasher-safe" claim is a retailer listing, not a lab-tested spec, and no source confirmed dishwasher safety for any glass-and-plastic model.',
  'The HummZinger HighView price is not listed on the maker site and no retailer listing was opened; the $27 to $35 street price is unverified.',
  'The Aspects Jewel Box price is not listed on the maker site; the $15 to $20 street price is unverified.',
  'Hands-on tester reports exist for two of the nine (Bob Vila on the HighView and the Perky-Pet 217, a six-week yard test) plus Bird Watching HQ on the 16-oz sibling of the First Nature 3055. The other six rest on maker and retailer pages.',
];

/* ------------------------------------------------------------------ */
/* Rubric                                                              */
/* ------------------------------------------------------------------ */

export const RUBRIC = [
  {
    key: 'cleaning',
    label: 'Cleaning',
    weight: 0.4,
    why: 'Nectar spoils in days, so a feeder is only as good as the cleaning it allows. Testers agree that open dishes are easiest and bottles are harder.',
    scale: [
      { score: 9, rule: 'Saucer or dish whose reservoir opens into an open dish with no hard-to-reach corners (Bird Watching HQ; Birds & Blooms).' },
      { score: 8, rule: 'Saucer that disassembles, with no tester report on cleaning it.' },
      { score: 7, rule: 'Window mount that comes apart completely with a wide mouth.' },
      { score: 6, rule: 'Glass bottle with a wide mouth and a detachable base. Brushable, but more parts, and Bird Watching HQ calls bottles "much harder to clean."' },
      { score: 5, rule: 'Cleaning detail not published by the maker.' },
    ],
    note: 'No feeder scored 10. That score is reserved for a feeder a source confirms is dishwasher-safe with every surface reachable by brush, and none was.',
  },
  {
    key: 'defenses',
    label: 'Bee and ant defenses',
    weight: 0.2,
    why: 'Ants and bees both go for the nectar, and insects in the reservoir mean dumping it. Audubon notes that guards only help when the outside of the feeder stays clean.',
    scale: [
      { score: 5, rule: 'Ant side: built-in ant moat.' },
      { score: 4, rule: 'Ant side: ant guard included in the box.' },
      { score: 2, rule: 'Ant side: moat sold separately.' },
      { score: 0, rule: 'Ant side: none, or not confirmed.' },
      { score: 5, rule: 'Bee side: bee-guard or bee-resistant ports built in.' },
      { score: 3, rule: 'Bee side: bee tips offered as an option.' },
      { score: 0, rule: 'Bee side: none.' },
    ],
    note: 'Ant points plus bee points, out of 10.',
  },
  {
    key: 'durability',
    label: 'Durability reports',
    weight: 0.2,
    why: 'We cannot drop-test a feeder we have not bought, so this criterion counts what owners and testers report.',
    scale: [
      { score: 7, rule: 'Start here.' },
      { score: 1, rule: '+1 for a body material a cited tester credits for longevity (glass, per Bob Vila; the HummZinger polycarbonate, per Bob Vila).' },
      { score: 1, rule: '+1 for multi-year hands-on use reported without failure.' },
      { score: -1, rule: '-1 for a style-wide failure testers report: bottle feeders leak more (Bird Watching HQ).' },
      { score: -1, rule: '-1 for each model-specific complaint found, including owner reports on the maker page.' },
      { score: -1, rule: '-1 when we found little or no independent long-term data.' },
    ],
    note: 'Absence of complaints is not proof of durability, which is why thin data costs a point.',
  },
  {
    key: 'capacity',
    label: 'Capacity fit',
    weight: 0.1,
    why: 'Nectar gets changed every few days whatever the bottle size, so a bigger reservoir does not save work in a mild coastal yard. It only has to outlast the birds between changes.',
    scale: [
      { score: 10, rule: '16 to 32 oz. Fill it partway.' },
      { score: 9, rule: '12 oz.' },
      { score: 8, rule: '40 oz. Fine filled partway, but heavy when full: Bob Vila found a 40-oz More Birds Garnet needed its strongest hook.' },
      { score: 7, rule: '8 oz. Expect refills between changes.' },
      { score: 6, rule: '6 oz. Frequent refills.' },
    ],
    note: 'This is our reading of the change schedule, not a tester finding.',
  },
  {
    key: 'price',
    label: 'Price',
    weight: 0.1,
    why: 'Prices move by retailer and season, so we score the cited listing as checked on 2026-09-28, or the midpoint when that listing shows both a list and a sale price. Unverified street prices are marked.',
    scale: [
      { score: 10, rule: '$15 or less.' },
      { score: 8, rule: '$15 to $20.' },
      { score: 7, rule: '$20 to $25.' },
      { score: 6, rule: '$25 to $30.' },
      { score: 5, rule: 'Over $30.' },
    ],
    note: 'Price is 10 percent of the score on purpose: the cheapest feeder is the wrong one if it is hard to clean.',
  },
];

const CLEANING = { 'open-dish': 9, 'saucer-parts': 8, 'window-open': 7, 'bottle-wide': 6, undocumented: 5 };
const ANT = { moat: 5, guard: 4, 'sold-separately': 2, none: 0 };
const BEE = { 'built-in': 5, optional: 3, none: 0 };

export function cleaningScore(kind) {
  if (!(kind in CLEANING)) throw new Error(`unknown cleaning kind ${kind}`);
  return CLEANING[kind];
}

export function defensesScore(ant, bee) {
  if (!(ant in ANT) || !(bee in BEE)) throw new Error(`unknown defense ${ant}/${bee}`);
  return ANT[ant] + BEE[bee];
}

export function durabilityScore(adjustments) {
  const raw = 7 + adjustments.reduce((sum, a) => sum + a.delta, 0);
  return Math.max(0, Math.min(10, raw));
}

export function capacityScore(oz) {
  if (oz >= 40) return 8;
  if (oz >= 16) return 10;
  if (oz >= 12) return 9;
  if (oz >= 8) return 7;
  return 6;
}

export function priceScore(low, high) {
  const mid = (low + high) / 2;
  if (mid <= 15) return 10;
  if (mid <= 20) return 8;
  if (mid <= 25) return 7;
  if (mid <= 30) return 6;
  return 5;
}

export function weightedTotal(scores) {
  const raw = RUBRIC.reduce((sum, c) => sum + c.weight * scores[c.key], 0);
  return Math.round(raw * 10) / 10;
}

/* ------------------------------------------------------------------ */
/* The nine feeders                                                    */
/* ------------------------------------------------------------------ */

const GLASS = { delta: 1, why: 'Glass bottle, which Bob Vila says wears better long-term than plastic.' };
const BOTTLE_LEAK = { delta: -1, why: 'Bottle feeders have a "higher tendency to leak," per Bird Watching HQ.' };
const THIN = { delta: -1, why: 'Little or no independent long-term data found.' };

const FEEDER_INPUTS = [
  {
    id: 'hummzinger-highview',
    model: 'HummZinger HighView',
    maker: 'Aspects',
    style: 'Saucer',
    capacityOz: 12,
    ports: 4,
    material: 'Polycarbonate',
    cleaningText: 'Base pops off into one open dish; hand-wash. Dishwasher-safe unverified.',
    defensesText: 'Built-in ant moat; Nectar-Guard bee tips optional.',
    priceLow: 27, priceHigh: 35, priceText: '~$27–35 (unverified)', priceVerified: false,
    complaints: 'Short hanging hook (Bob Vila).',
    makerPage: null,
    sourceIds: ['bob-vila', 'bwhq'],
    cleaning: 'open-dish',
    ant: 'moat', bee: 'optional',
    durability: [
      { delta: 1, why: 'Polycarbonate body; Bob Vila names it best overall and calls it unbreakable.' },
    ],
  },
  {
    id: 'first-nature-3055',
    model: 'First Nature 3055',
    maker: 'First Nature',
    style: 'Saucer',
    capacityOz: 32,
    ports: 10,
    material: 'Red plastic',
    cleaningText: 'Two-part base twists apart; wide mouth; sealing ring.',
    defensesText: 'Ant guards included; no dedicated bee guard.',
    priceLow: 20.96, priceHigh: 20.96, priceText: '$20.96 (JCs Wildlife, 1-pack)', priceVerified: true,
    complaints: 'Recurring reports of leaks at the base seam if not seated exactly right; occasional top popping loose mid-refill.',
    makerPage: null,
    sourceIds: ['jcs-first-nature', 'bwhq'],
    cleaning: 'open-dish',
    ant: 'guard', bee: 'none',
    durability: [
      { delta: 1, why: "Bird Watching HQ's reviewer reports years of personal use, leaking only in extreme wind. That report is for First Nature's 16-oz model, not the 32-oz 3055 scored here." },
      { delta: -1, why: 'Recurring reports of a leaking base seam when it is not seated exactly right.' },
      { delta: -1, why: 'Occasional reports of the top popping loose mid-refill.' },
    ],
  },
  {
    id: 'more-birds-big-gulp',
    model: 'More Birds Bird Health+ Big Gulp',
    maker: 'More Birds (Perky-Pet)',
    style: 'High-capacity bottle',
    capacityOz: 40,
    ports: 5,
    material: 'Glass bottle, plastic base',
    cleaningText: 'Wide opening and detachable base. No dishwasher; maker advises a vinegar soak.',
    defensesText: 'Bee-guard ports and built-in ant moat.',
    priceLow: 11.49, priceHigh: 19.99, priceText: '$19.99 list, $11.49 on sale (Perky-Pet)', priceVerified: true,
    complaints: 'Owners on the maker page report the clear plastic base cracking at the threads and leaking, and the soft flower-port inserts rotting with no replacement parts sold. Heavy when full, so hang it from a sturdy hook.',
    makerPage: 'https://www.perkypet.com/more-birds-bird-health-plus-big-gulp-hummingbird-feeder-with-glass-bottle-built-in-ant-moat',
    sourceIds: ['mb-big-gulp'],
    cleaning: 'bottle-wide',
    ant: 'moat', bee: 'built-in',
    durability: [
      GLASS,
      BOTTLE_LEAK,
      { delta: -1, why: 'Owners on the maker page report the clear plastic base cracking, at the threads or over time, and leaking.' },
      { delta: -1, why: 'Owners on the maker page report the flower-port inserts rotting, with no replacement parts offered.' },
    ],
  },
  {
    id: 'more-birds-diamond',
    model: 'More Birds Bird Health+ Diamond',
    maker: 'More Birds (Perky-Pet)',
    style: 'Bottle',
    capacityOz: 30,
    ports: 5,
    material: 'Glass bottle, plastic base',
    cleaningText: 'Wide opening and detachable flat base. Maker says no dishwasher; vinegar-water soak.',
    defensesText: 'Bee-guard ports and built-in ant moat.',
    priceLow: 27.49, priceHigh: 27.49, priceText: '$27.49 (Perky-Pet)', priceVerified: true,
    complaints: 'Owners on the maker page report the soft port inserts wearing out in a year or two with no replacement parts sold, and plastic parts turning brittle and breaking.',
    makerPage: 'https://www.perkypet.com/more-birds-bird-health-plus-diamond-hummingbird-feeder-with-glass-bottle-built-in-ant-moat',
    sourceIds: ['mb-diamond'],
    cleaning: 'bottle-wide',
    ant: 'moat', bee: 'built-in',
    durability: [
      GLASS,
      BOTTLE_LEAK,
      { delta: -1, why: 'Soft port inserts wear out and are not sold as replacement parts, per owners on the maker page.' },
      { delta: -1, why: 'Owners on the maker page report plastic parts turning brittle and breaking.' },
    ],
  },
  {
    id: 'perky-pet-209b',
    model: 'Perky-Pet "Our Best" 209B-1SR',
    maker: 'Perky-Pet',
    style: 'Bottle',
    capacityOz: 30,
    ports: 6,
    material: 'Glass bottle, plastic base and perch',
    cleaningText: 'Wide-mouth bottle; base comes apart. Not confirmed dishwasher-safe.',
    defensesText: 'Built-in bee guards and ant moat.',
    priceLow: 19.99, priceHigh: 19.99, priceText: '$19.99 (Perky-Pet)', priceVerified: true,
    complaints: 'Owners on the maker page report brittle plastic perches and flower base that break, with no replacement parts sold, and an S-hook connection that broke in the first week.',
    makerPage: 'https://www.perkypet.com/perky-pet-best-glass-hummingbird-feeder-209b-1sr',
    sourceIds: ['pp-209b'],
    cleaning: 'bottle-wide',
    ant: 'moat', bee: 'built-in',
    durability: [
      GLASS,
      BOTTLE_LEAK,
      { delta: -1, why: 'Owners on the maker page report plastic perches and flower base turning brittle and breaking, with no replacement parts sold.' },
      { delta: -1, why: 'An owner on the maker page reports the S-hook connection breaking in the first week.' },
    ],
  },
  {
    id: 'more-birds-3-in-1',
    model: 'More Birds 3-in-1 Saucer',
    maker: 'More Birds',
    style: 'Saucer (window, stake or hang)',
    capacityOz: 6,
    ports: 3,
    material: 'BPA-free plastic',
    cleaningText: 'Disassembles for cleaning. Dishwasher-safe unverified.',
    defensesText: 'Bee-guard ports; no ant moat.',
    priceLow: 17.99, priceHigh: 17.99, priceText: '$17.99 (Coastal Ace)', priceVerified: true,
    complaints: 'Small capacity means frequent refills; little independent long-term review data.',
    makerPage: null,
    sourceIds: ['coastal-ace-3in1'],
    cleaning: 'saucer-parts',
    ant: 'none', bee: 'built-in',
    durability: [THIN],
  },
  {
    id: 'perky-pet-217',
    model: 'Perky-Pet 217 Window-Mount',
    maker: 'Perky-Pet',
    style: 'Window mount',
    capacityOz: 8,
    ports: 3,
    material: 'Shatter-resistant plastic',
    cleaningText: 'Comes apart completely; wide mouth; maker recommends a weekly wash.',
    defensesText: 'Tapered bee-resistant ports; no ant moat.',
    priceLow: 12.99, priceHigh: 12.99, priceText: '$12.99 (Perky-Pet)', priceVerified: true,
    complaints: 'Small capacity needs frequent refills (Bob Vila). Owners on the maker page report that the suction cup on newer units does not fit the mounting hole; Bob Vila\'s test unit held through six weeks of heavy rain.',
    makerPage: 'https://www.perkypet.com/perky-pet-window-mount-plastic-hummingbird-feeder-217',
    sourceIds: ['pp-217', 'bob-vila'],
    cleaning: 'window-open',
    ant: 'none', bee: 'built-in',
    durability: [
      { delta: -1, why: 'Owners on the maker page report that the suction cup on newer units does not fit the mounting hole. Bob Vila\'s test unit held through six weeks of heavy rain.' },
      { delta: -1, why: "Bob Vila's test ran six weeks; no longer-term independent data found." },
    ],
  },
  {
    id: 'best-1-32oz',
    model: 'Best-1 32 oz',
    maker: 'Birds Choice',
    style: 'High-capacity bottle',
    capacityOz: 32,
    ports: 8,
    material: 'Glass bottle, high-impact plastic base',
    cleaningText: 'Two-piece base twists apart. Dishwasher-safe unconfirmed.',
    defensesText: 'Bee- and wasp-resistant ports; ant moat not confirmed.',
    priceLow: 26.95, priceHigh: 26.95, priceText: '$26.95 (Duncraft, backordered)', priceVerified: true,
    complaints: 'Backordered at one retailer at check time; no complaint pattern surfaced.',
    makerPage: null,
    sourceIds: ['duncraft-best-1'],
    cleaning: 'bottle-wide',
    ant: 'none', bee: 'built-in',
    durability: [GLASS, BOTTLE_LEAK, { delta: -1, why: 'No tester review found; no complaint pattern either.' }],
  },
  {
    id: 'aspects-jewel-box',
    model: 'Aspects Jewel Box',
    maker: 'Aspects / HummZinger',
    style: 'Window mount',
    capacityOz: 8,
    ports: 3,
    material: 'Polycarbonate',
    cleaningText: 'Hinged lid for refills; cleaning detail thin on the maker page.',
    defensesText: 'Optional Nectar-Guard bee tips; ant moat sold separately.',
    priceLow: 15, priceHigh: 20, priceText: '~$15–20 (unverified)', priceVerified: false,
    complaints: 'None model-specific found. It hangs on a suction-cup bracket; no source reported how well that holds.',
    makerPage: 'https://hummzinger.com/product/jewel-box-window-hummingbird-feeder/',
    sourceIds: ['hz-jewel-box'],
    cleaning: 'undocumented',
    ant: 'sold-separately', bee: 'optional',
    durability: [
      { delta: 1, why: 'Polycarbonate body, the material Bob Vila credits on the HighView.' },
      { delta: -1, why: 'No model-specific durability reports found.' },
    ],
  },
];

export const FEEDERS = FEEDER_INPUTS.map((f) => {
  const scores = {
    cleaning: cleaningScore(f.cleaning),
    defenses: defensesScore(f.ant, f.bee),
    durability: durabilityScore(f.durability),
    capacity: capacityScore(f.capacityOz),
    price: priceScore(f.priceLow, f.priceHigh),
  };
  return { ...f, scores, total: weightedTotal(scores) };
})
  .sort((a, b) => b.total - a.total || b.scores.cleaning - a.scores.cleaning || b.scores.price - a.scores.price)
  .map((f, i) => ({ ...f, rank: i + 1 }));

export const feedersById = new Map(FEEDERS.map((f) => [f.id, f]));

/** Editorial picks, named against the computed ranking (tests check they agree). */
export const PICKS = [
  { label: 'Top of the rubric', id: 'hummzinger-highview', why: 'A saucer that opens into one dish, a built-in ant moat, and a polycarbonate body Bob Vila calls unbreakable. Its street price is unverified and likely the highest here, and its bee tips are optional.' },
  { label: 'Runner-up saucer', id: 'first-nature-3055', why: "The easy-clean dish design for about $21 at JCs Wildlife. Bird Watching HQ reports years of use with First Nature's 16-oz model. Seat the base exactly or it leaks, and plan your own bee defense: keep it clean." },
  { label: 'Glass bottle, full defenses', id: 'perky-pet-209b', why: 'The top-scoring glass bottle: a wide mouth, built-in bee guards and ant moat, $19.99 at the maker. Owners report brittle perches and a flimsy S-hook connection, with no replacement parts sold, so handle the plastic gently.' },
  { label: 'On the window', id: 'perky-pet-217', why: "Comes apart completely and costs $12.99 at the maker. Bob Vila's test unit held for six weeks, but owners report newer suction cups that do not fit the mounting hole." },
];

/* ------------------------------------------------------------------ */
/* Care guide + local notes                                            */
/* ------------------------------------------------------------------ */

export const NECTAR = {
  ratio: '1:4',
  recipe: 'Dissolve 1/4 cup refined white sugar in 1 cup boiling water. Let it cool, then fill.',
  never: [
    'No red dye. Audubon: not necessary, and could prove harmful.',
    'No honey. It can promote dangerous fungal growth.',
    'No artificial sweeteners. The birds need the calories in real sucrose.',
  ],
  sourceIds: ['audubon-nectar'],
};

/** Audubon feeding FAQ: the feeder is emptied AND cleaned on this schedule, not just refilled. */
export const CHANGE_SCHEDULE = [
  { weather: 'Hot', every: 'Empty and wash every day or every other day' },
  { weather: 'Temperate', every: 'Empty and wash every three days' },
  { weather: 'Cool', every: 'Empty and wash twice a week' },
];

export const PLANTS = [
  { common: 'California fuchsia', latin: 'Epilobium canum', note: 'Late-summer and fall nectar when little else blooms.' },
  { common: 'Hummingbird sage', latin: 'Salvia spathacea', note: 'Takes dappled shade; no summer water once established.' },
  { common: 'Purple sage', latin: 'Salvia leucophylla', note: 'Little to no irrigation once rooted.' },
  { common: 'Showy penstemon', latin: 'Penstemon spectabilis', note: 'Tubular, hummingbird-pollinated flowers.' },
  { common: 'Climbing penstemon', latin: 'Keckiella cordifolia', note: 'Tubular, hummingbird-pollinated flowers.' },
  { common: 'Monkeyflower', latin: 'Mimulus aurantiacus', note: 'Little to no irrigation once rooted.' },
];
