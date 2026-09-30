/**
 * shop.pointcast.xyz — the PointCast Shop front.
 *
 * One place that gathers every buying guide and every priced pick across the
 * Review Lab, so a person can browse and an agent can read one JSON file.
 * Guides stay the source of truth; this module only flattens them.
 */
import aiWorkLife from '../data/ai-work-life.json';
import bags from '../data/bags-south-bay.json';
import playstation from '../data/playstation-2026.json';
import lego from '../data/lego-sets.json';
import robots from '../data/home-robots.json';
import video from '../data/ai-video.json';
import machines from '../data/machine-room.json';
import aiPlans from '../data/ai-plans.json';
import { FEEDERS, PICKS as FEEDER_PICKS, DESK_DATE as FEEDER_DATE } from './hummingbird-feeders.mjs';
import { REGISTER_STATS } from './paddle-register';

export const SHOP_FRONT_VERSION = 'shop-front-v1-2026-09-29';
export const SHOP_HOST = 'shop.pointcast.xyz';
export const SHOP_ORIGIN = `https://${SHOP_HOST}`;
export const SITE = 'https://pointcast.xyz';
export const LAUNCHED_ON = '2026-09-29';
/** Where on-site links send people. Flip to SHOP_ORIGIN once the custom domain is attached to the Pages project. */
export const SHOP_FRONT_PATH = '/shop/front';

// Optional guides that ship in their own PRs; the glob is empty until the file exists.
const modularFiles = import.meta.glob('../data/modular-carry.json', { eager: true, import: 'default' });
const modular = Object.values(modularFiles)[0] as
  | { title: string; dek: string; asOf: string; entries: { id: string; name: string; url: string; image?: string; heroProducts?: { name: string; price: string | number }[]; lesson?: string }[] }
  | undefined;

export type ShopGuide = {
  id: string;
  title: string;
  dek: string;
  href: string;
  json: string | null;
  kind: 'Buying guide' | 'Desk review' | 'Field guide' | 'Register' | 'Shelf';
  image: string;
  imageAlt: string;
  asOf: string;
  count: number;
  countLabel: string;
};

export type ShopPick = {
  id: string;
  guide: string;
  name: string;
  brand: string;
  price: number | null;
  priceText: string;
  currency: 'USD';
  url: string;
  image: string | null;
  verdict: string;
  reviewUrl: string;
};

const money = (n: number) => `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;

const bagPicks: ShopPick[] = bags.picks.map((p) => ({
  id: `bags/${p.id}`,
  guide: 'bags',
  name: p.name,
  brand: p.brand,
  price: p.price,
  priceText: money(p.price) + (p.priceNote ? '*' : ''),
  currency: 'USD',
  url: p.url,
  image: p.image,
  verdict: p.verdict,
  reviewUrl: `/reviews/bags#${p.id}`,
}));

const robotPicks: ShopPick[] = robots.picks.map((r) => ({
  id: `home-robots/${r.id}`,
  guide: 'home-robots',
  name: r.name,
  brand: r.brand,
  price: typeof r.price === 'number' ? r.price : null,
  priceText: typeof r.price === 'number' ? money(r.price) + (r.priceNote ? '*' : '') : 'Price TBD',
  currency: 'USD',
  url: r.url,
  image: r.image,
  verdict: r.verdict,
  reviewUrl: `/reviews/home-robots#${r.id}`,
}));

const legoPicks: ShopPick[] = lego.sets.map((s) => ({
  id: `lego-sets/${s.id}`,
  guide: 'lego-sets',
  name: s.name,
  brand: 'LEGO',
  price: s.price,
  priceText: money(s.price) + (s.id === 'shenron' ? '*' : ''),
  currency: 'USD',
  url: s.url,
  image: s.image,
  verdict: s.verdict,
  reviewUrl: `/reviews/lego-sets#${s.id}`,
}));

const feederPicks: ShopPick[] = FEEDER_PICKS.map((pick) => {
  const f = FEEDERS.find((x) => x.id === pick.id)!;
  return {
    id: `hummingbird-feeders/${f.id}`,
    guide: 'hummingbird-feeders',
    name: f.model,
    brand: f.maker,
    price: f.priceVerified ? f.priceHigh : null,
    priceText: f.priceText,
    currency: 'USD',
    url: f.makerPage,
    image: null,
    verdict: `${pick.label}. ${pick.why.split('. ')[0]}.`,
    reviewUrl: '/reviews/hummingbird-feeders',
  };
});

const modularPicks: ShopPick[] = modular
  ? modular.entries.flatMap((e) => {
      const hero = e.heroProducts?.[0];
      if (!hero) return [];
      const n = typeof hero.price === 'number' ? hero.price : Number(String(hero.price).replace(/[^0-9.]/g, ''));
      // A historical price (e.g. Jibbitz in 2006) is shown as text, never as today's offer.
      const historical = /\b(19|20)\d\d\b|not checked/i.test(hero.name);
      return [{
        id: `modular-carry/${e.id}`,
        guide: 'modular-carry',
        name: hero.name,
        brand: e.name,
        price: historical || !Number.isFinite(n) ? null : n,
        priceText: historical ? `${hero.price} (historical)` : String(hero.price),
        currency: 'USD' as const,
        url: e.url,
        image: e.image ?? null,
        verdict: e.lesson ?? '',
        reviewUrl: `/reviews/modular-carry#${e.id}`,
      }];
    })
  : [];

const gamePicks: ShopPick[] = playstation.games.map(g => ({id: `playstation-2026/${g.id}`, guide: 'playstation-2026', name:g.name, brand:g.brand, price:null, priceText:g.priceText, currency:'USD', url:g.url, image:g.image, verdict:g.verdict, reviewUrl:`/reviews/playstation-2026#${g.id}`}));

const machinePicks: ShopPick[] = machines.items.filter((m) => typeof m.price === 'number').map((m) => ({
  id: `machine-room/${m.id}`,
  guide: 'machine-room',
  name: m.name,
  brand: m.brand,
  price: m.price as number,
  priceText: (m as { priceText?: string }).priceText ?? money(m.price as number) + ((m as { priceNote?: string }).priceNote ? '*' : ''),
  currency: 'USD',
  url: m.url,
  image: null,
  verdict: m.verdict,
  reviewUrl: `/reviews/machine-room#${m.id}`,
}));

// Subscriptions are monthly, so they list as text, never as a one-time price.
const planPicks: ShopPick[] = aiPlans.picks.map((k) => {
  const p = aiPlans.plans.find((x) => x.id === k.plan)!;
  const price = (p as { priceText?: string }).priceText ?? (p.price === 0 ? 'Free' : `${money(p.price as number)}/mo`);
  return {
    id: `ai-plans/${p.id}`,
    guide: 'ai-plans',
    name: (p as { full: string }).full,
    brand: aiPlans.providers.find((v) => v.id === p.provider)!.name,
    price: null,
    priceText: price,
    currency: 'USD' as const,
    url: aiPlans.providers.find((v) => v.id === p.provider)!.pricingUrl,
    image: null,
    verdict: `${k.label.charAt(0) + k.label.slice(1).toLowerCase()}. ${p.verdict}`,
    reviewUrl: `/reviews/ai-plans#${p.id}`,
  };
});

// Recurring subscriptions are text prices, not one-time product Offers.
const aiPicks: ShopPick[] = aiWorkLife.plans.map(p=>({id:`ai-work-life/${p.id}`,guide:'ai-work-life',name:p.name,brand:p.name,price:null,priceText:p.priceText,currency:'USD',url:p.url,image:null,verdict:p.why,reviewUrl:`/reviews/ai-work-life#${p.id}`}));

const videoPicks: ShopPick[] = video.picks.map((v) => ({
  id: `ai-video/${v.id}`,
  guide: 'ai-video',
  name: v.name,
  brand: v.brand,
  price: typeof v.price === 'number' ? v.price : null,
  priceText: v.priceText + (v.priceNote ? '*' : ''),
  currency: 'USD',
  url: v.url,
  image: '/images/ai-video/thumb.jpg',
  verdict: v.verdict,
  reviewUrl: `/reviews/ai-video#${v.id}`,
}));

export const SHOP_PICKS: ShopPick[] = [...videoPicks, ...aiPicks, ...machinePicks, ...planPicks, ...gamePicks, ...robotPicks, ...bagPicks, ...modularPicks, ...legoPicks, ...feederPicks];

export const SHOP_GUIDES: ShopGuide[] = [
  {id:'ai-work-life',title:aiWorkLife.title,dek:aiWorkLife.dek,href:'/reviews/ai-work-life',json:'/reviews/ai-work-life.json',kind:'Buying guide',image:'/images/ai-work-life/hero.png',imageAlt:'An idea becomes a draft and a reviewed result',asOf:aiWorkLife.asOf,count:aiWorkLife.plans.length,countLabel:'AI services'},
  {
    id: 'ai-video', title: video.title, dek: video.dek, href: '/reviews/ai-video', json: '/reviews/ai-video.json',
    kind: 'Desk review', image: '/images/ai-video/thumb.jpg', imageAlt: 'Illustrated specimen sheet of video-making objects',
    asOf: video.asOf, count: video.picks.length, countLabel: 'services',
  },
  {
    id: 'machine-room', title: 'The machine room', dek: machines.dek, href: '/reviews/machine-room', json: '/reviews/machine-room.json',
    kind: 'Buying guide', image: '/images/machine-room/hero.jpg', imageAlt: 'Specimen sheet of desk hardware: computers, a drive, a macro pad, a pedal, a light and a mic',
    asOf: machines.asOf, count: machines.kits.length, countLabel: 'full desks',
  },
  {
    id: 'ai-plans', title: aiPlans.title, dek: aiPlans.dek, href: '/reviews/ai-plans', json: '/reviews/ai-plans.json',
    kind: 'Desk review', image: '/images/ai-plans/hero.jpg', imageAlt: 'Specimen sheet: membership cards, a usage gauge, coins, a robot arm, a clapperboard, a terminal and keys',
    asOf: aiPlans.asOf, count: aiPlans.plans.length, countLabel: 'plans',
  },
  {id:'playstation-2026',title:playstation.title,dek:playstation.dek,href:'/reviews/playstation-2026',json:'/reviews/playstation-2026.json',kind:'Buying guide',image:playstation.games[0].image,imageAlt:playstation.games[0].alt,asOf:playstation.asOf,count:6,countLabel:'games'},
  {
    id: 'home-robots', title: robots.title, dek: robots.dek, href: '/reviews/home-robots', json: '/reviews/home-robots.json',
    kind: 'Desk review', image: '/images/home-robots/hero.jpg', imageAlt: 'Illustrated specimen sheet of house robots',
    asOf: robots.asOf, count: robots.picks.length, countLabel: 'robots',
  },
  {
    id: 'bags', title: bags.title, dek: bags.dek, href: '/reviews/bags', json: '/reviews/bags.json',
    kind: 'Desk review', image: '/images/bags/carry-kit-thumb.jpg', imageAlt: 'Illustrated specimen sheet of bags',
    asOf: bags.asOf, count: bags.picks.length, countLabel: 'picks',
  },
  ...(modular ? [{
    id: 'modular-carry', title: modular.title, dek: modular.dek, href: '/reviews/modular-carry', json: '/reviews/modular-carry.json',
    kind: 'Field guide' as const, image: '/images/modular-carry/og.jpg', imageAlt: 'The modular carry companies',
    asOf: modular.asOf, count: modular.entries.length, countLabel: 'companies',
  }] : []),
  {
    id: 'lego-sets', title: lego.title, dek: 'A dragon, two old consoles, and a few small reasons to keep playing. Six picks by Astra Light.', href: '/reviews/lego-sets', json: '/reviews/lego-sets.json',
    kind: 'Buying guide', image: '/images/lego-sets/game-boy.jpg', imageAlt: 'LEGO Game Boy with brick cartridges',
    asOf: lego.asOf, count: lego.sets.length, countLabel: 'sets',
  },
  {
    id: 'hummingbird-feeders', title: 'Hummingbird feeders: the one you will actually clean', dek: 'Nine feeders ranked on a published rubric, plus the care guide that matters more than the brand.', href: '/reviews/hummingbird-feeders', json: '/reviews/hummingbird-feeders.json',
    kind: 'Desk review', image: '/images/hummingbird-feeders/hero.jpg', imageAlt: 'Painting of a hummingbird at a red saucer feeder',
    asOf: FEEDER_DATE, count: FEEDERS.length, countLabel: 'feeders',
  },
  {
    id: 'paddles', title: 'The Paddle Register', dek: 'Every pickleball paddle release we can source, with dates, lab links and a change log. Affiliate-free by rule.', href: '/paddles', json: '/paddles.json',
    kind: 'Register', image: '/images/paddle-study.jpg', imageAlt: 'Study of a pickleball paddle',
    asOf: String(REGISTER_STATS.asOf), count: REGISTER_STATS.paddles, countLabel: 'paddles',
  },
  {
    id: 'shelf', title: 'The Shelf: Mainichikoh incense', dek: 'Nippon Kodo’s everyday incense, box by box: which one changes a room, which one stays quiet.', href: '/shop#shelf', json: '/shop.json',
    kind: 'Shelf', image: '/images/shelf/mainichikoh-natural-bodhi-sandalwood.jpg', imageAlt: 'A box of Mainichikoh Natural Bodhi sandalwood incense',
    asOf: '2026-09-28', count: 5, countLabel: 'boxes',
  },
];

export const SHOP_LANES = [
  { id: 'catalog', label: 'The catalog', href: '/shop', note: 'Every product PointCast lists, with outbound checkout at the maker.' },
  { id: 'court', label: 'Court lane', href: '/shop/court', note: 'Paddles out now and coming soon, from the register.' },
  { id: 'good-feels', label: 'Good Feels', href: '/shop#good-feels', note: 'The house brand’s live mirror: seltzers, gummies, enhancers.' },
  { id: 'takes', label: 'Paddle takes', href: '/reviews/paddles', note: 'Reviews as takes: hours played, who paid, what we’d change.' },
  { id: 'method', label: 'How we review', href: '/reviews/paddles/method', note: 'Desk vs hands-on, dated prices, and the paid-link rule.' },
];

export const SHOP_POLICY = [
  'Desk reviews say so at the top. If nobody handled the product, there is no star rating.',
  'Every price has a date. The maker’s page is the truth; ours is a snapshot.',
  'No paid links anywhere today. If a program ever approves PointCast, each paid link will say so beside the link.',
  'Commission never changes what we rank or recommend. The paddle register stays affiliate-free by rule.',
];

export const SHOP_ENDPOINTS = [
  { href: '/shop/front.json', label: 'This page as JSON: guides, every pick, policy' },
  { href: '/shop/llms.txt', label: 'Plain-text guide for language models' },
  { href: '/shop.json', label: 'The full product catalog' },
  { href: '/reviews.json', label: 'Every Review Lab review' },
  { href: '/paddles.json', label: 'The Paddle Register' },
];

export function shopFrontJson() {
  const priced = SHOP_PICKS.filter((p) => p.price !== null);
  return {
    schema: 'pointcast.shop-front/v1',
    version: SHOP_FRONT_VERSION,
    url: `${SHOP_ORIGIN}/`,
    mirror: `${SITE}/shop/front`,
    launchedOn: LAUNCHED_ON,
    publisher: 'PointCast, El Segundo, California',
    affiliateLinks: false,
    policy: SHOP_POLICY,
    counts: { guides: SHOP_GUIDES.length, picks: SHOP_PICKS.length, priced: priced.length, paidLinks: 0 },
    guides: SHOP_GUIDES.map((g) => ({ ...g, href: SITE + g.href, json: g.json ? SITE + g.json : null, image: SITE + g.image })),
    picks: SHOP_PICKS.map((p) => ({ ...p, image: p.image ? SITE + p.image : null, reviewUrl: SITE + p.reviewUrl })),
    lanes: SHOP_LANES.map((l) => ({ ...l, href: SITE + l.href })),
    endpoints: SHOP_ENDPOINTS.map((e) => ({ ...e, href: SITE + e.href })),
  };
}
