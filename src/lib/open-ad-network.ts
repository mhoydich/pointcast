import reveAbundance from '../assets/todays-art/2026-07-21/reve/abundance-flows.webp';
import revePositive from '../assets/todays-art/2026-07-21/reve/the-positive-index.webp';
import revePublicMiracle from '../assets/todays-art/2026-07-21/reve/small-public-miracle.webp';
import drumNounUniversePoster from '../assets/campaigns/pointcast-drum-noun-universe/115-rooms-one-shared-pulse.webp';
import artKittyPositiveEnergy from '../assets/campaigns/art-kitty-2026/positive-energy.webp';
import artKittySpookyVibes from '../assets/campaigns/art-kitty-2026/spooky-vibes.webp';
import artKittyVase from '../assets/campaigns/art-kitty-2026/vase-green-pink.webp';
import networkDesk from '../assets/campaigns/network-el-segundo-2026/network-desk.jpg';
import networkGoodVibes from '../assets/campaigns/network-el-segundo-2026/good-vibes-pickleball.jpg';
import networkFlowers from '../assets/campaigns/network-el-segundo-2026/dot-matrix-flowers.jpg';
import networkWindows from '../assets/campaigns/network-el-segundo-2026/100-windows.png';
import networkFieldKit from '../assets/campaigns/network-el-segundo-2026/field-kit.png';
import networkMeshCommons from '../assets/campaigns/network-el-segundo-2026/mesh-commons.png';
import holdersCutPreview from '../assets/campaigns/the-holders-cut-2026/public-preview.png';
import localStarCommonsOg from '../assets/campaigns/local-star-commons-2026/commons-og.png';
import qwenWeatherOrganism from '../assets/campaigns/qwen-weather-2026/weather-organism.jpg';
import {
  NOUN_BATTLER_ANNUAL_CAMPAIGN,
  NOUN_BATTLER_PROMO_DISPATCHES,
} from './noun-battler-annual-promotion';
import {
  BEACH_BLANKET_PROMOTION_CAMPAIGN,
  BEACH_BLANKET_PROMO_DISPATCHES,
} from './beach-commons-v8-promotion';
import {
  DIGITAL_PETS_COUNSEL_CAMPAIGN,
  DIGITAL_PETS_COUNSEL_PROMO_DISPATCHES,
} from './digital-pets-counsel-promo';

export { NOUN_BATTLER_ANNUAL_CAMPAIGN } from './noun-battler-annual-promotion';
export { BEACH_BLANKET_PROMOTION_CAMPAIGN } from './beach-commons-v8-promotion';
export { DIGITAL_PETS_COUNSEL_CAMPAIGN } from './digital-pets-counsel-promo';

const NETWORK_EL_SEGUNDO_AUTH_PATH =
  '/auth/project?target=network-el-segundo&return_to=https%3A%2F%2Fnetwork-el-segundo.mhoydich.chatgpt.site%2F&source=pointcast_ad';
const NETWORK_EL_SEGUNDO_AUTH_URL = `https://pointcast.xyz${NETWORK_EL_SEGUNDO_AUTH_PATH}`;

export type PointCastAdTone = 'signal' | 'garden' | 'play' | 'ritual' | 'network' | 'field';

export interface PointCastAd {
  id: string;
  advertiser: string;
  headline: string;
  copy: string;
  href: string;
  cta: string;
  tone: PointCastAdTone;
  contexts: string[];
  image?: string;
  sourceTool?: string;
  campaign?: string;
  seriesLabel?: string;
  seriesIndex?: number;
  status: 'house';
}

export interface OpenAdPublisher {
  id: string;
  name: string;
  url: string;
  hostname: string;
  surface: string;
  advertiserAliases: string[];
  campaigns?: string[];
  status: 'active';
}

export const OPEN_AD_PLACEMENT = {
  id: 'PC-0477',
  publisher: 'PointCast',
  placement: 'Sitewide contextual rail',
  format: 'Interactive CSS 3D card',
  priceTezPerWeek: 12,
  settlement: 'prototype',
  tracking: 'aggregate impressions + clicks',
  interaction: 'Pointer and keyboard tilt with a reduced-motion fallback',
  note: 'One clearly labeled interactive placement across public PointCast pages. Aggregate events only; no visitor identifiers or behavioral profiles.',
} as const;

export const OPEN_AD_NETWORK = {
  id: 'PC-OPEN-NETWORK-2026',
  name: 'PointCast Open Ad Network',
  inventoryUrl: 'https://pointcast.xyz/ads.json',
  embedUrl: 'https://pointcast.xyz/open-ad-network.js',
  format: 'Interactive portable CSS 3D house card',
  selection: 'Daily contextual rotation by publisher and page URL',
  interaction: 'Pointer and arrow-key tilt; no autoplay; reduced-motion safe',
  tracking: 'Aggregate impressions + clicks by creative and publisher',
  privacy: 'No cookies, fingerprinting, wallet data, cross-site visitor identifiers, or behavioral profiles.',
  settlement: 'prototype',
} as const;

export const OPEN_AD_PUBLISHERS: OpenAdPublisher[] = [
  {
    id: 'pointcast',
    name: 'PointCast',
    url: 'https://pointcast.xyz/',
    hostname: 'pointcast.xyz',
    surface: 'Native sitewide contextual rail',
    advertiserAliases: ['PointCast', "PointCast Today's Art"],
    status: 'active',
  },
  {
    id: 'industrynext',
    name: 'Industry Next',
    url: 'https://www.industrynext.xyz/',
    hostname: 'www.industrynext.xyz',
    surface: 'A first-100 Tezos wallet lead across the Nouns studio, Permission Lab, and Made stream',
    advertiserAliases: ['Industry Next'],
    campaigns: ['PC-DIGITAL-PETS-COUNSEL-2026', 'PC-NETWORK-EL-SEGUNDO-2026', 'PC-BEACH-COMMONS-V5-2026', 'PC-BEACH-BLANKET-REVIEW-2026'],
    status: 'active',
  },
  {
    id: 'allworthy',
    name: 'Allworthy',
    url: 'https://allworthy.xyz/',
    hostname: 'allworthy.xyz',
    surface: 'A first-100 Tezos wallet lead across public-interest funding records and experiments',
    advertiserAliases: ['Allworthy'],
    campaigns: ['PC-DIGITAL-PETS-COUNSEL-2026', 'PC-NETWORK-EL-SEGUNDO-2026', 'PC-BEACH-COMMONS-V5-2026', 'PC-BEACH-BLANKET-REVIEW-2026'],
    status: 'active',
  },
  {
    id: 'passportz',
    name: 'Passportz',
    url: 'https://passportz.xyz/',
    hostname: 'passportz.xyz',
    surface: 'A first-100 Tezos wallet lead across public identity, art, activity, and listening passports',
    advertiserAliases: ['Passportz', 'Tezos Passport'],
    campaigns: ['PC-DIGITAL-PETS-COUNSEL-2026', 'PC-NETWORK-EL-SEGUNDO-2026', 'PC-BEACH-COMMONS-V5-2026', 'PC-BEACH-BLANKET-REVIEW-2026'],
    status: 'active',
  },
  {
    id: 'rally',
    name: 'Rally / Common Hours',
    url: 'https://common-hours.mhoydich.chatgpt.site/rally',
    hostname: 'common-hours.mhoydich.chatgpt.site',
    surface: 'A clearly labeled first-100 Tezos wallet lead on Rally',
    advertiserAliases: ['Common Hours', 'Rally'],
    campaigns: ['PC-DIGITAL-PETS-COUNSEL-2026', 'PC-NETWORK-EL-SEGUNDO-2026', 'PC-BEACH-COMMONS-V5-2026', 'PC-BEACH-BLANKET-REVIEW-2026'],
    status: 'active',
  },
  {
    id: 'common-hours',
    name: 'Common Hours / Stampz',
    url: 'https://common-hours.mhoydich.chatgpt.site/stampz',
    hostname: 'common-hours.mhoydich.chatgpt.site',
    surface: 'A first-100 Tezos wallet lead across shared rituals, Stampz, and Rally',
    advertiserAliases: ['Common Hours', 'Rally'],
    campaigns: ['PC-DIGITAL-PETS-COUNSEL-2026', 'PC-NETWORK-EL-SEGUNDO-2026', 'PC-BEACH-COMMONS-V5-2026', 'PC-BEACH-BLANKET-REVIEW-2026'],
    status: 'active',
  },
];

export const HOLDERS_CUT_CAMPAIGN = {
  id: 'PC-HOLDERS-CUT-2026',
  label: 'The Holders’ Cut — 44 Plates, No Finish Line',
  advertiser: 'The Holders’ Cut',
  creativeCount: 1,
  placement: 'PointCast contextual rotation plus a Rally footer placement',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A first-party public-preview campaign. The proposed 50% holder pool and 10-tez unlimited edition are visible, while Mainnet minting remains inactive pending contract and offering review.',
} as const;

export const INDUSTRY_NEXT_CAMPAIGN = {
  id: 'PC-INDUSTRY-NEXT-2026',
  label: 'Industry Next — Culture Is a Building Material',
  advertiser: 'Industry Next',
  creativeCount: 1,
  placement: 'PointCast contextual rotation and reciprocal Open Ad Network inventory',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'One direct Industry Next house creative joining its Nouns field note and Permission Lab series already running on PointCast.',
} as const;

export const NOUNS_ABOUT_CAMPAIGN = {
  id: 'PC-NOUNS-ABOUT-2026',
  label: 'Nouns: Permission Is the Starting Point',
  advertiser: 'Industry Next',
  creativeCount: 3,
  placement: 'Contextual rotation across public PointCast pages',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'Three first-party house creatives for a concise field note on why Nouns and CC0 remain unusually interesting.',
} as const;

export const PERMISSION_LAB_CAMPAIGN = {
  id: 'PC-PERMISSION-LAB-2026',
  label: 'Industry Next Permission Lab',
  advertiser: 'Industry Next',
  creativeCount: 3,
  placement: 'Contextual rotation across public PointCast pages',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'Three first-party house creatives inviting people to remix an authentic CC0 Noun, export a poster, and deliberately publish to the public Made stream.',
} as const;

export const DRUM_COMPENDIUM_CAMPAIGN = {
  id: 'PC-DRUM-COMPENDIUM-2026',
  label: 'Drum Compendium',
  advertiser: 'PointCast',
  creativeCount: 6,
  placement: 'One contextual creative on every public /drum surface',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A six-part PointCast house campaign distributed by URL context, never visitor behavior.',
} as const;

export const DRUM_NOUN_UNIVERSE_CAMPAIGN = {
  id: 'PC-DRUM-NOUN-UNIVERSE-2026',
  label: 'Drum Noun Universe',
  advertiser: 'PointCast',
  creativeCount: 1,
  placement: 'Featured homepage unit and contextual placement across public non-Drum pages',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A first-party PointCast house campaign distributed sitewide with aggregate event counts, no visitor profiles, and no paid media.',
} as const;

export const ART_KITTY_CAMPAIGN = {
  id: 'PC-ART-KITTY-2026',
  label: 'HOME / Art Kitty — Make One, Fund the Next One',
  advertiser: 'HOME / Art Kitty',
  creativeCount: 3,
  placement: 'Contextual rotation across public PointCast art, gallery, press, Tezos, and El Segundo pages',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'Three first-party house creatives for 31 public one-tez collector editions with an equal artist and Art Kitty split.',
} as const;

export const NETWORK_EL_SEGUNDO_CAMPAIGN = {
  id: 'PC-NETWORK-EL-SEGUNDO-2026',
  label: 'Network El Segundo — First 100 Wallets',
  advertiser: 'Network El Segundo',
  creativeCount: 6,
  placement: 'Sitewide PointCast house campaign with a contextual creative on every public page',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A zero-capital first-party campaign connecting two living public artworks, a local-communication product study, and a two-year physical-network plan. No sale, token, payout contract, certified hardware, active physical mesh, coverage guarantee, or yield system is live.',
} as const;

export const LOCAL_STAR_COMMONS_CAMPAIGN = {
  id: 'PC-LOCAL-STAR-COMMONS-2026',
  label: 'LOCAL STAR COMMONS — Useful Things, Governed in Common',
  advertiser: 'LOCAL STAR COMMONS',
  creativeCount: 1,
  placement: 'PointCast sitewide contextual rail plus the canonical Commons and public ad desk',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A first-party founding-movement release for six local-first quality-of-life objects. Governance is off-chain and contribution-based; no token, treasury, fundraising, binding vote, Mainnet action, or live physical mesh exists.',
} as const;

export const BELLS_BLOOM_CAMPAIGN = {
  id: 'PC-BELLS-BLOOM-2026',
  label: 'Bells / Bloom — PointCast Showcast 001',
  advertiser: 'PointCast Showcast',
  creativeCount: 1,
  placement: 'PointCast art surfaces and portable Open Ad Network inventory',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A first-party 28-work Midjourney archive exhibition. Every image links to its source job; the campaign uses contextual rotation only.',
} as const;

export const OPEN_HEART_GARDEN_CAMPAIGN = {
  id: 'PC-GARDEN-SIGNAL-OPEN-HEART-2026',
  label: 'OPEN HEART — Garden Signal 002',
  advertiser: 'PointCast Garden Signal',
  creativeCount: 1,
  placement: 'PointCast music, garden, art, and front-door contexts',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'An independent music-companion release using four original Midjourney frames, browser-native sample-free audio, and the official Spotify embed. No recording, stems, lyrics, provider artwork, or playback telemetry enter PointCast.',
} as const;

export const QWEN_WEATHER_CAMPAIGN = {
  id: 'PC-QWEN-WEATHER-2026',
  label: 'Qwen / Weather Memory — PointCast Model Study 001',
  advertiser: 'PointCast Model Study',
  creativeCount: 1,
  placement: 'PointCast homepage feature, Front Door Block, and contextual house rotation',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A first-party model relay made with Qwen 3.8 Max, GLM-5.2, Wan 2.7 Image Pro, and HappyHorse 1.1. All media is pre-rendered; no QwenCloud credential or live inference request enters the page.',
} as const;

export const BEACH_COMMONS_V5_CAMPAIGN = {
  id: 'PC-BEACH-COMMONS-V5-2026',
  label: 'Beach Commons V5 — Weather School + Tide Parliament',
  advertiser: 'PointCast Field Study',
  creativeCount: 3,
  placement: 'PointCast sitewide contextual rail and preferred rotation across reciprocal Open Ad Network publishers',
  tracking: 'aggregate impressions + clicks',
  status: 'house',
  note: 'A first-party campaign for an unofficial, unpermitted coastal civic-architecture study. It advertises a public field study, not an operating event, school, parliament, installation, scientific authority, or invitation to build.',
} as const;

export const NETWORK_FIRST_100_SIGNAL = {
  id: 'PC-NETWORK-EL-SEGUNDO-SIGNAL',
  label: 'Network El Segundo — First 100 Signal Strip',
  advertiser: 'Network El Segundo',
  destination: NETWORK_EL_SEGUNDO_AUTH_URL,
  placement: 'Above-the-fold strip across every public PointCast layout except the canonical campaign page',
  tracking: 'aggregate impressions + clicks',
  privacy: 'No IP, user agent, cookie, wallet, or visitor identifier is stored with an event.',
  status: 'house',
} as const;

export const POINTCAST_ADS: PointCastAd[] = [
  ...DIGITAL_PETS_COUNSEL_PROMO_DISPATCHES.map((counselDispatch) => ({
    id: counselDispatch.id,
    advertiser: DIGITAL_PETS_COUNSEL_CAMPAIGN.advertiser,
    headline: counselDispatch.headline,
    copy: counselDispatch.copy,
    href: counselDispatch.href,
    cta: counselDispatch.cta,
    tone: counselDispatch.tone,
    contexts: [...counselDispatch.contexts],
    image: counselDispatch.image,
    sourceTool: counselDispatch.sourceTool,
    campaign: DIGITAL_PETS_COUNSEL_CAMPAIGN.id,
    seriesLabel: DIGITAL_PETS_COUNSEL_CAMPAIGN.label,
    status: 'house' as const,
  })),
  ...BEACH_BLANKET_PROMO_DISPATCHES.map((blanketDispatch) => ({
    id: blanketDispatch.id,
    advertiser: BEACH_BLANKET_PROMOTION_CAMPAIGN.advertiser,
    headline: blanketDispatch.headline,
    copy: blanketDispatch.copy,
    href: blanketDispatch.href,
    cta: blanketDispatch.cta,
    tone: blanketDispatch.tone,
    contexts: [...blanketDispatch.contexts],
    image: blanketDispatch.image,
    sourceTool: 'Credited maker or merchant editorial-reference photograph',
    campaign: BEACH_BLANKET_PROMOTION_CAMPAIGN.id,
    seriesLabel: BEACH_BLANKET_PROMOTION_CAMPAIGN.label,
    status: 'house' as const,
  })),
  ...NOUN_BATTLER_PROMO_DISPATCHES.map((dispatch) => ({
    id: dispatch.id,
    advertiser: NOUN_BATTLER_ANNUAL_CAMPAIGN.advertiser,
    headline: dispatch.headline,
    copy: dispatch.copy,
    href: dispatch.href,
    cta: dispatch.cta,
    tone: dispatch.tone,
    contexts: [...dispatch.contexts],
    image: dispatch.image,
    sourceTool: 'PointCast generator-made editorial plate',
    campaign: NOUN_BATTLER_ANNUAL_CAMPAIGN.id,
    seriesLabel: NOUN_BATTLER_ANNUAL_CAMPAIGN.label,
    status: 'house' as const,
  })),
  {
    id: 'PC-BEACH-COMMONS-V5-001',
    advertiser: 'PointCast Field Study',
    headline: 'What if weather were the curriculum?',
    copy: 'Eight coastal architecture plates turn sun, wind, rain, water, moon, fire, and stone into public lessons that completely fold away.',
    href: '/beach-commons/v5',
    cta: 'Enter the Weather School',
    tone: 'field',
    contexts: ['beach', 'commons', 'weather', 'school', 'sun', 'wind', 'rain', 'water', 'nature', 'garden', 'el', 'segundo'],
    image: '/beach-commons/v5/assets/01-weather-school.png',
    sourceTool: 'OpenAI image generation',
    campaign: BEACH_COMMONS_V5_CAMPAIGN.id,
    seriesLabel: BEACH_COMMONS_V5_CAMPAIGN.label,
    seriesIndex: 1,
    status: 'house',
  },
  {
    id: 'PC-BEACH-COMMONS-V5-002',
    advertiser: 'PointCast Field Study',
    headline: 'Account for every cup.',
    copy: 'One finite recirculated volume serves washing, cooling, bread, plants, and play—made visible as a public game without a screen.',
    href: '/beach-commons/v5#plates',
    cta: 'Open the Water Court',
    tone: 'garden',
    contexts: ['water', 'care', 'garden', 'food', 'bread', 'play', 'community', 'civic', 'repair', 'nature'],
    image: '/beach-commons/v5/assets/05-water-accounting-court.png',
    sourceTool: 'OpenAI image generation',
    campaign: BEACH_COMMONS_V5_CAMPAIGN.id,
    seriesLabel: BEACH_COMMONS_V5_CAMPAIGN.label,
    seriesIndex: 2,
    status: 'house',
  },
  {
    id: 'PC-BEACH-COMMONS-V5-003',
    advertiser: 'PointCast Field Study',
    headline: 'The school closes as a parliament.',
    copy: 'Habitat reports, short testimony, bread, weaving, sculpture, games, music, and ceramic votes gather at sunset—then the whole campus packs out.',
    href: '/beach-commons/v5#plates',
    cta: 'Convene the Tide Parliament',
    tone: 'ritual',
    contexts: ['tide', 'moon', 'ritual', 'public', 'community', 'commons', 'press', 'town', 'network', 'art', 'beach'],
    image: '/beach-commons/v5/assets/08-tide-parliament.png',
    sourceTool: 'OpenAI image generation',
    campaign: BEACH_COMMONS_V5_CAMPAIGN.id,
    seriesLabel: BEACH_COMMONS_V5_CAMPAIGN.label,
    seriesIndex: 3,
    status: 'house',
  },
  {
    id: 'PC-QWEN-WEATHER-001',
    advertiser: 'PointCast Model Study',
    headline: 'The video made its own weather.',
    copy: 'Qwen 3.8 wrote it. GLM-5.2 answered. Wan 2.7 imagined the organism. HappyHorse gave it motion and generated its sound.',
    href: '/qwen-weather',
    cta: 'Enter the Qwen model relay',
    tone: 'signal',
    contexts: ['qwen', 'ai', 'agent', 'model', 'art', 'image', 'video', 'audio', 'weather', 'signal', 'home', 'pointcast', 'front', 'door'],
    image: qwenWeatherOrganism.src,
    sourceTool: 'QwenCloud · Qwen 3.8 + GLM-5.2 + Wan 2.7 + HappyHorse 1.1',
    campaign: QWEN_WEATHER_CAMPAIGN.id,
    seriesLabel: QWEN_WEATHER_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-BELLS-BLOOM-001',
    advertiser: 'PointCast Showcast',
    headline: 'A bell is a flower you can hear.',
    copy: 'Twenty-eight Midjourney studies in signal, garden, geometry, and beautiful machine weather.',
    href: '/showcast/bells-bloom',
    cta: 'Enter Bells / Bloom',
    tone: 'garden',
    contexts: ['art', 'archive', 'gallery', 'showcast', 'midjourney', 'bell', 'flower', 'garden', 'signal', 'design', 'el', 'segundo'],
    image: '/images/og/bells-bloom-showcast.png',
    sourceTool: 'Midjourney V8.1 / Michael Hoydich',
    campaign: BELLS_BLOOM_CAMPAIGN.id,
    seriesLabel: BELLS_BLOOM_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-GARDEN-SIGNAL-OPEN-HEART-001',
    advertiser: 'PointCast Garden Signal',
    headline: 'A door is a promise with hardware.',
    copy: 'Four chrome garden exposures, five original touch tones, and one official Spotify doorway.',
    href: '/garden-signal/open-heart',
    cta: 'Open the heart',
    tone: 'garden',
    contexts: ['music', 'spotify', 'listen', 'garden', 'flower', 'love', 'door', 'chrome', 'midjourney', 'art', 'signal', 'home', 'pointcast'],
    image: '/images/og/garden-signal-open-heart.jpg',
    sourceTool: 'Midjourney V8 + original Web Audio / Michael Hoydich + PointCast',
    campaign: OPEN_HEART_GARDEN_CAMPAIGN.id,
    seriesLabel: OPEN_HEART_GARDEN_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-LOCAL-STAR-COMMONS-001',
    advertiser: 'LOCAL STAR COMMONS',
    headline: 'Useful things. Governed in common.',
    copy: 'Six local-first objects, five working circles, and a 25-mile El Segundo founding study. Off-chain coordination; no token or treasury.',
    href: '/local-star-commons',
    cta: 'Enter the Commons',
    tone: 'network',
    contexts: ['commons', 'local', 'network', 'care', 'air', 'water', 'light', 'power', 'governance', 'dao', 'el', 'segundo', 'repair', 'privacy', 'civic'],
    image: localStarCommonsOg.src,
    sourceTool: 'OpenAI image generation',
    campaign: LOCAL_STAR_COMMONS_CAMPAIGN.id,
    seriesLabel: LOCAL_STAR_COMMONS_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-HOLDERS-CUT-001',
    advertiser: 'The Holders’ Cut',
    headline: '44 plates. No finish line.',
    copy: 'An unlimited edition at 10 tez. The public preview proposes 50% of defined net primary proceeds for eligible holder wallets; no Mainnet mint is active yet.',
    href: 'https://the-holders-cut.mhoydich.chatgpt.site/',
    cta: 'See the public preview',
    tone: 'play',
    contexts: ['rally', 'art', 'archive', 'tezos', 'collect', 'wallet', 'play', 'community', 'footer'],
    image: holdersCutPreview.src,
    sourceTool: 'OpenAI image generation + Michael Hoydich archive',
    campaign: HOLDERS_CUT_CAMPAIGN.id,
    seriesLabel: HOLDERS_CUT_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-INDUSTRY-NEXT-001',
    advertiser: 'Industry Next',
    headline: 'Culture is a building material.',
    copy: 'An art-forward studio for Nouns, open tools, public experiments, and the useful things people make when permission comes first.',
    href: 'https://www.industrynext.xyz/',
    cta: 'Enter Industry Next',
    tone: 'signal',
    contexts: ['industry', 'next', 'nouns', 'cc0', 'art', 'culture', 'make', 'studio', 'tool', 'public', 'agent'],
    campaign: INDUSTRY_NEXT_CAMPAIGN.id,
    seriesLabel: INDUSTRY_NEXT_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NETWORK-EL-SEGUNDO-001',
    advertiser: 'Network El Segundo',
    headline: 'The next founding light is unclaimed.',
    copy: 'Claim it in about 20 seconds: zero tez, one free Kukai message signature, no purchase, no mint, and no transaction.',
    href: NETWORK_EL_SEGUNDO_AUTH_PATH,
    cta: 'Claim the next light — free',
    tone: 'network',
    contexts: ['network', 'tezos', 'wallet', 'kukai', 'passport', 'agent', 'town', 'home', 'pointcast'],
    image: networkDesk.src,
    sourceTool: 'Michael Hoydich archive',
    campaign: NETWORK_EL_SEGUNDO_CAMPAIGN.id,
    seriesLabel: NETWORK_EL_SEGUNDO_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NETWORK-EL-SEGUNDO-002',
    advertiser: 'Network El Segundo',
    headline: 'Zero tez. One signature. One light.',
    copy: 'A free Kukai wallet-control signature illuminates one of 100 public positions. Addresses stay out of the artwork.',
    href: NETWORK_EL_SEGUNDO_AUTH_PATH,
    cta: 'Take the next open seat',
    tone: 'garden',
    contexts: ['art', 'gallery', 'today', 'collect', 'mint', 'commerce', 'press', 'garden', 'flower'],
    image: networkFlowers.src,
    sourceTool: 'Michael Hoydich archive',
    campaign: NETWORK_EL_SEGUNDO_CAMPAIGN.id,
    seriesLabel: NETWORK_EL_SEGUNDO_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NETWORK-EL-SEGUNDO-003',
    advertiser: 'Network El Segundo',
    headline: 'Bring one wallet. Invite one more.',
    copy: 'Turn on a founding light with a free Kukai signature, then pass the clean link to one Tezos artist, collector, or builder.',
    href: NETWORK_EL_SEGUNDO_AUTH_PATH,
    cta: 'Join the first 100 — free',
    tone: 'play',
    contexts: ['play', 'sport', 'community', 'el', 'segundo', 'local', 'proof', 'wire', 'press'],
    image: networkGoodVibes.src,
    sourceTool: 'Michael Hoydich archive',
    campaign: NETWORK_EL_SEGUNDO_CAMPAIGN.id,
    seriesLabel: NETWORK_EL_SEGUNDO_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NETWORK-EL-SEGUNDO-004',
    advertiser: 'Network El Segundo',
    headline: 'A city of 100 windows.',
    copy: 'Each verified wallet lights one public window in Signal 002. Touch any window to send a local pulse; the roster changes only after a free Kukai signature.',
    href: '/network-el-segundo/v2',
    cta: 'Enter V2 / 100 Windows',
    tone: 'field',
    contexts: ['night', 'city', 'window', 'signal', 'art', 'network', 'tezos', 'wallet', 'public', 'el', 'segundo'],
    image: networkWindows.src,
    sourceTool: 'OpenAI image generation',
    campaign: NETWORK_EL_SEGUNDO_CAMPAIGN.id,
    seriesLabel: NETWORK_EL_SEGUNDO_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NETWORK-EL-SEGUNDO-005',
    advertiser: 'Network El Segundo',
    headline: 'Signal the block.',
    copy: 'Eight small instruments share four neighbor-scale meanings across beams, window lights, quiet chimes, touch, paper, and mini fireworks with zero fire.',
    href: '/network-el-segundo/field-kit',
    cta: 'Open the local field kit',
    tone: 'field',
    contexts: ['local', 'signal', 'mesh', 'light', 'sound', 'neighbor', 'civic', 'map', 'el', 'segundo', 'field', 'tool'],
    image: networkFieldKit.src,
    sourceTool: 'OpenAI image generation',
    campaign: NETWORK_EL_SEGUNDO_CAMPAIGN.id,
    seriesLabel: NETWORK_EL_SEGUNDO_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NETWORK-EL-SEGUNDO-006',
    advertiser: 'Network El Segundo',
    headline: 'Three roofs make a mesh.',
    copy: 'A $295–$395 proof link, a redundant rooftop triangle, nine local-only services, and a two-year path toward a 25-mile horizon—not blanket coverage.',
    href: '/network-el-segundo/mesh-commons',
    cta: 'Open the Mesh Commons plan',
    tone: 'network',
    contexts: ['local', 'mesh', 'network', 'infrastructure', 'roof', 'radio', 'game', 'community', 'el', 'segundo', 'civic', 'internet'],
    image: networkMeshCommons.src,
    sourceTool: 'OpenAI image generation',
    campaign: NETWORK_EL_SEGUNDO_CAMPAIGN.id,
    seriesLabel: NETWORK_EL_SEGUNDO_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-ART-KITTY-001',
    advertiser: 'HOME / Art Kitty',
    headline: 'Half for the art. Half for what comes next.',
    copy: 'Thirty-one works across two permanent series. Collect one per wallet for 1 tez: 0.5 artist, 0.5 Art Kitty.',
    href: 'https://art-kitty-editions.mhoydich.chatgpt.site/series/02',
    cta: 'Enter Series 02',
    tone: 'signal',
    contexts: ['art', 'gallery', 'today', 'tezos', 'mint', 'collect', 'press', 'el', 'segundo'],
    image: artKittyPositiveEnergy.src,
    sourceTool: 'Michael Hoydich archive',
    campaign: ART_KITTY_CAMPAIGN.id,
    seriesLabel: ART_KITTY_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-ART-KITTY-002',
    advertiser: 'HOME / Art Kitty',
    headline: 'Bright signals. Same generous circuit.',
    copy: 'Sixteen new works move through El Segundo, screen culture, sport, commerce, flowers, ghosts, and positive energy.',
    href: 'https://art-kitty-editions.mhoydich.chatgpt.site/series/02',
    cta: 'See all 16 works',
    tone: 'garden',
    contexts: ['art', 'gallery', 'today', 'garden', 'flower', 'el', 'segundo', 'culture', 'commerce'],
    image: artKittyVase.src,
    sourceTool: 'Michael Hoydich archive',
    campaign: ART_KITTY_CAMPAIGN.id,
    seriesLabel: ART_KITTY_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-ART-KITTY-003',
    advertiser: 'HOME / Art Kitty',
    headline: 'Make one. Fund the next one.',
    copy: 'Every collect keeps the split visible: two equal 0.5-tez tranches and one wallet-owned edition bound to the exact image.',
    href: 'https://art-kitty-editions.mhoydich.chatgpt.site/',
    cta: 'Open the full archive',
    tone: 'play',
    contexts: ['art', 'tezos', 'wallet', 'collect', 'mint', 'play', 'ghost', 'archive', 'press'],
    image: artKittySpookyVibes.src,
    sourceTool: 'Michael Hoydich archive',
    campaign: ART_KITTY_CAMPAIGN.id,
    seriesLabel: ART_KITTY_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NOUNS-ABOUT-001',
    advertiser: 'Industry Next',
    headline: 'Permission is the starting point.',
    copy: 'A concise field note on Nouns, CC0, and what becomes possible when culture arrives with room to move.',
    href: 'https://www.industrynext.xyz/about/',
    cta: 'Read about Nouns',
    tone: 'signal',
    contexts: ['nouns', 'noun', 'cc0', 'open', 'art', 'culture', 'agent', 'remix', 'public', 'press'],
    campaign: NOUNS_ABOUT_CAMPAIGN.id,
    seriesLabel: NOUNS_ABOUT_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NOUNS-ABOUT-002',
    advertiser: 'Industry Next',
    headline: 'CC0 makes the work movable.',
    copy: 'Not an exhaustive history. A high-level case for why reusable characters can keep becoming more culturally alive.',
    href: 'https://www.industrynext.xyz/about/',
    cta: 'Open the field note',
    tone: 'garden',
    contexts: ['cc0', 'art', 'gallery', 'today', 'garden', 'culture', 'commons', 'make', 'studio'],
    campaign: NOUNS_ABOUT_CAMPAIGN.id,
    seriesLabel: NOUNS_ABOUT_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-NOUNS-ABOUT-003',
    advertiser: 'Industry Next',
    headline: 'A Noun is a beginning, not a boundary.',
    copy: 'The interesting part is not only what exists. It is how freely a Noun can travel into the next image, story, tool, or game.',
    href: 'https://www.industrynext.xyz/about/',
    cta: 'See why it matters',
    tone: 'play',
    contexts: ['noun', 'nouns', 'drum', 'play', 'game', 'agent', 'town', 'network', 'story', 'tool'],
    campaign: NOUNS_ABOUT_CAMPAIGN.id,
    seriesLabel: NOUNS_ABOUT_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-PERMISSION-LAB-001',
    advertiser: 'Industry Next',
    headline: 'Make first. Ask never.',
    copy: 'Turn an authentic CC0 Noun into a sign, club, tool, character, ritual, or tiny institution. Export is private; publishing is deliberate.',
    href: 'https://www.industrynext.xyz/make/',
    cta: 'Enter Permission Lab',
    tone: 'signal',
    contexts: ['nouns', 'noun', 'cc0', 'remix', 'make', 'studio', 'art', 'gallery', 'today', 'creative'],
    campaign: PERMISSION_LAB_CAMPAIGN.id,
    seriesLabel: PERMISSION_LAB_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-PERMISSION-LAB-002',
    advertiser: 'Industry Next',
    headline: 'One Noun. Six possible beginnings.',
    copy: 'No account and no wallet before the creative act. Remix the parts, choose the form, and download a 1200-pixel public signal.',
    href: 'https://www.industrynext.xyz/make/',
    cta: 'Make a public signal',
    tone: 'play',
    contexts: ['play', 'game', 'tool', 'character', 'poster', 'design', 'arcade', 'drum', 'town', 'agent'],
    campaign: PERMISSION_LAB_CAMPAIGN.id,
    seriesLabel: PERMISSION_LAB_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-PERMISSION-LAB-003',
    advertiser: 'Industry Next',
    headline: 'Made by whoever arrived.',
    copy: 'The Made stream is not a leaderboard or a mint floor. It is a living worktable for people treating permission as creative material.',
    href: 'https://www.industrynext.xyz/made/',
    cta: 'See what people made',
    tone: 'garden',
    contexts: ['public', 'community', 'culture', 'commons', 'garden', 'press', 'wire', 'archive', 'people', 'made'],
    campaign: PERMISSION_LAB_CAMPAIGN.id,
    seriesLabel: PERMISSION_LAB_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-DRUM-UNIVERSE-001',
    advertiser: 'PointCast',
    headline: '115 rooms. One shared pulse.',
    copy: 'Drum machines, games, radio, rituals, tiny theaters, and agent paths form one playable Noun universe. No signup, wallet, purchase, or token required.',
    href: '/drum-press',
    cta: 'Enter the universe',
    tone: 'signal',
    contexts: ['home', 'pointcast', 'town', 'room', 'play', 'game', 'sound', 'agent', 'press', 'art'],
    image: drumNounUniversePoster.src,
    sourceTool: 'OpenAI image generation',
    campaign: DRUM_NOUN_UNIVERSE_CAMPAIGN.id,
    seriesLabel: DRUM_NOUN_UNIVERSE_CAMPAIGN.label,
    status: 'house',
  },
  {
    id: 'PC-HOUSE-001',
    advertiser: 'Bell & Signal',
    headline: 'Seventeen castings. No samples.',
    copy: 'Bells voiced like real towers, plus polite signals for honest machines. All CC0.',
    href: '/bell-and-signal',
    cta: 'Visit the foundry',
    tone: 'signal',
    contexts: ['drum', 'sound', 'radio', 'wire', 'press'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-002',
    advertiser: 'Sound Garden 001',
    headline: 'Grow a sound organism.',
    copy: 'Warmth, roughness, motion, and surprise in a browser-native instrument built for good accidents.',
    href: '/sound-garden',
    cta: 'Open the garden',
    tone: 'garden',
    contexts: ['sound', 'radio', 'garden', 'nature', 'art'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-003',
    advertiser: 'Last Tag',
    headline: "Don't be it at zero.",
    copy: 'Six runners, one shrinking yard, and a clock that does not care. Pass the tag.',
    href: '/last-tag',
    cta: 'Enter the yard',
    tone: 'play',
    contexts: ['play', 'game', 'drum', 'arcade', 'sport'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-004',
    advertiser: 'Common Hours',
    headline: 'Nine doors for the shape of a day.',
    copy: 'Bells, walks, candles, and small rituals gathered without flattening them into one thing.',
    href: '/common-hours',
    cta: 'Keep an hour',
    tone: 'ritual',
    contexts: ['prayer', 'ritual', 'meditate', 'quiet', 'hour'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-005',
    advertiser: 'Adventure Networks',
    headline: 'Infrastructure for improbable expeditions.',
    copy: 'A public field guide to resilient routes, shared equipment, and useful adventure systems.',
    href: '/adventure-networks',
    cta: 'Read the field guide',
    tone: 'network',
    contexts: ['network', 'agent', 'wire', 'press', 'field'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-006',
    advertiser: 'Prayer Labyrinth',
    headline: 'Walk the line. Return differently.',
    copy: 'A traced labyrinth meditation with no account, no score, and no need to hurry.',
    href: '/prayer-labyrinth',
    cta: 'Begin the walk',
    tone: 'field',
    contexts: ['prayer', 'walk', 'meditate', 'quiet', 'ritual'],
    status: 'house',
  },
  {
    id: 'PC-HOUSE-007',
    advertiser: "PointCast Today's Art",
    headline: 'The Positive Index.',
    copy: 'Fourteen works treat small public things as evidence that a generous future is already trying to arrive.',
    href: '/gallery/today',
    cta: 'Enter edit 002',
    tone: 'garden',
    contexts: ['gallery', 'today', 'art', 'garden'],
    image: revePositive.src,
    sourceTool: 'Reve',
    status: 'house',
  },
  {
    id: 'PC-HOUSE-008',
    advertiser: "PointCast Today's Art",
    headline: 'A small public miracle.',
    copy: 'A bus shelter becomes a garden. Fresh Midjourney work meets a deeper Ideogram archive and preserved ImageApp exports.',
    href: '/gallery/2026-07-21',
    cta: 'See the whole hanging',
    tone: 'field',
    contexts: ['gallery', 'today', 'art', 'field'],
    image: revePublicMiracle.src,
    sourceTool: 'Reve',
    status: 'house',
  },
  {
    id: 'PC-HOUSE-009',
    advertiser: "PointCast Today's Art",
    headline: 'Abundance flows.',
    copy: 'Four Ideogram posters surfaced below the familiar profile hits. The earnestness is part of the wager.',
    href: '/gallery/2026-07-21#abundance-title',
    cta: 'Open the deep cut',
    tone: 'signal',
    contexts: ['gallery', 'today', 'art', 'signal'],
    image: reveAbundance.src,
    sourceTool: 'Reve',
    status: 'house',
  },
  {
    id: 'PC-DRUM-001',
    advertiser: 'PointCast',
    headline: 'The town has a tempo.',
    copy: 'Art, games, field notes, agents, and public experiments—one small internet town, still being built in the open.',
    href: '/town',
    cta: 'Walk into town',
    tone: 'signal',
    contexts: ['drum', 'room', 'now', 'lobby', 'meet', 'threshold', 'v2', 'v4', 'v6', 'v8', 'v10', 'v12', 'v14', 'v18'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 1,
    status: 'house',
  },
  {
    id: 'PC-DRUM-002',
    advertiser: 'PointCast',
    headline: 'Look between the beats.',
    copy: "Today's Art hangs a new edit from PointCast's image archive: public miracles, useful futures, and a little visual weather.",
    href: '/gallery/today',
    cta: "See today's hanging",
    tone: 'garden',
    contexts: ['drum', 'portrait', 'postcard', 'stickers', 'tape', 'warhol', 'aurora', 'v3', 'v7', 'v9', 'v13', 'v15', 'v17'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 2,
    status: 'house',
  },
  {
    id: 'PC-DRUM-003',
    advertiser: 'PointCast',
    headline: 'The signal keeps moving.',
    copy: 'New rooms, releases, and odd little utilities arrive on the Press Wire with a public JSON and RSS trail behind them.',
    href: '/press',
    cta: 'Read the wire',
    tone: 'field',
    contexts: ['drum', 'press', 'radio', 'tv', 'marquee', 'bulletin', 'shout', 'letters', 'reception', 'viz'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 3,
    status: 'house',
  },
  {
    id: 'PC-DRUM-004',
    advertiser: 'PointCast',
    headline: 'Agents can keep time.',
    copy: 'Add PointCast as a connector, read the town map, inspect public state, and let a machine join the same room as everyone else.',
    href: '/connectors',
    cta: 'Connect an agent',
    tone: 'network',
    contexts: ['drum', 'agent', 'agents', 'quintet', 'conductor', 'scorebook', 'mcp', 'altar'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 4,
    status: 'house',
  },
  {
    id: 'PC-DRUM-005',
    advertiser: 'PointCast',
    headline: 'Five ways to miss the beat.',
    copy: 'Memory, reaction, groove completion, loop defense, and silent tempo control. No signup. Start in one tap.',
    href: '/drum-games',
    cta: 'Enter the arcade',
    tone: 'play',
    contexts: ['drum', 'games', 'says', 'runner', 'quickdraw', 'fill', 'steady', 'solo', 'duel', 'league', 'relay', 'potato', 'v16'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 5,
    status: 'house',
  },
  {
    id: 'PC-DRUM-006',
    advertiser: 'PointCast',
    headline: 'Keep the strange little rooms.',
    copy: 'The compendium is bigger than the front door: bells, shrines, broadcasts, keepsakes, ceremonies, and tiny instruments all remain playable.',
    href: '/drum-press',
    cta: 'Open the compendium',
    tone: 'ritual',
    contexts: ['drum', 'bell', 'shrine', 'rosary', 'koan', 'prayer', 'mantra', 'lantern', 'bath', 'meditate', 'zen', 'vespers', 'saint', 'offering'],
    campaign: DRUM_COMPENDIUM_CAMPAIGN.id,
    seriesLabel: DRUM_COMPENDIUM_CAMPAIGN.label,
    seriesIndex: 6,
    status: 'house',
  },
];

function pathWords(pathname: string): string[] {
  return pathname.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function stablePathSeed(pathname: string): number {
  let seed = 0;
  for (const char of pathname) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  return seed;
}

export function selectAdsForPath(pathname: string, count = 2): PointCastAd[] {
  const words = new Set(pathWords(pathname));
  const seed = stablePathSeed(pathname || '/');
  const cappedCount = Math.max(1, Math.min(count, POINTCAST_ADS.length));
  const ranked = POINTCAST_ADS
    .map((ad, index) => ({
      ad,
      score: ad.contexts.reduce((total, context) => total + (words.has(context) ? 10 : 0), 0)
        + ((seed + index * 17) % 7),
    }))
    .sort((a, b) => b.score - a.score || a.ad.id.localeCompare(b.ad.id))
    .map(({ ad }) => ad);

  const isDrumSurface = /^\/(?:drum(?:-|\/|$)|dispatch-drum(?:\/|$))/.test(pathname);
  const isNounBattlerAnnualSurface = /^\/noun-battler-annual(?:\/|$)/.test(pathname);
  const isBeachCommonsV5Surface = /^\/beach-commons\/v5(?:\/|$)/.test(pathname);
  const isBeachBlanketSurface = /^\/beach-commons\/v8(?:\/|$)/.test(pathname);
  const isCounselSurface = /^\/digital-pets\/counsel(?:\/|$)/.test(pathname);
  const counselCreative = ranked.find((ad) => ad.campaign === DIGITAL_PETS_COUNSEL_CAMPAIGN.id);
  const annualCreative = ranked.find((ad) => ad.campaign === NOUN_BATTLER_ANNUAL_CAMPAIGN.id);
  const beachCommonsCreative = ranked.find((ad) => ad.campaign === BEACH_COMMONS_V5_CAMPAIGN.id);
  const blanketCreative = ranked.find((ad) => ad.campaign === BEACH_BLANKET_PROMOTION_CAMPAIGN.id);
  const networkCreative = ranked.find((ad) => ad.campaign === NETWORK_EL_SEGUNDO_CAMPAIGN.id);
  const commonsCreative = ranked.find((ad) => ad.campaign === LOCAL_STAR_COMMONS_CAMPAIGN.id);
  if (!isDrumSurface) {
    const universeCreative = ranked.find((ad) => ad.campaign === DRUM_NOUN_UNIVERSE_CAMPAIGN.id);
    if (!universeCreative && !networkCreative && !commonsCreative) return ranked.slice(0, cappedCount);

    const companionAds = ranked.filter((ad) => (
      ad.campaign !== DIGITAL_PETS_COUNSEL_CAMPAIGN.id
      &&
      ad.campaign !== NOUN_BATTLER_ANNUAL_CAMPAIGN.id
      &&
      ad.campaign !== BEACH_BLANKET_PROMOTION_CAMPAIGN.id
      &&
      ad.campaign !== DRUM_NOUN_UNIVERSE_CAMPAIGN.id
      && ad.campaign !== DRUM_COMPENDIUM_CAMPAIGN.id
      && ad.campaign !== BEACH_COMMONS_V5_CAMPAIGN.id
      && ad.campaign !== NETWORK_EL_SEGUNDO_CAMPAIGN.id
      && ad.campaign !== LOCAL_STAR_COMMONS_CAMPAIGN.id
    ));
    return [
      isCounselSurface ? undefined : counselCreative,
      isBeachBlanketSurface ? undefined : blanketCreative,
      isNounBattlerAnnualSurface ? undefined : annualCreative,
      isBeachCommonsV5Surface ? undefined : beachCommonsCreative,
      universeCreative,
      networkCreative,
      commonsCreative,
      ...companionAds,
    ]
      .filter((ad): ad is PointCastAd => Boolean(ad))
      .slice(0, cappedCount);
  }

  const drumCreative = ranked.find((ad) => ad.campaign === DRUM_COMPENDIUM_CAMPAIGN.id);
  if (!drumCreative && !networkCreative && !commonsCreative) return ranked.slice(0, cappedCount);

  const companionAds = ranked.filter((ad) => (
    ad.campaign !== DIGITAL_PETS_COUNSEL_CAMPAIGN.id
    &&
    ad.campaign !== NOUN_BATTLER_ANNUAL_CAMPAIGN.id
    &&
    ad.campaign !== BEACH_BLANKET_PROMOTION_CAMPAIGN.id
    &&
    ad.campaign !== DRUM_COMPENDIUM_CAMPAIGN.id
    && ad.campaign !== DRUM_NOUN_UNIVERSE_CAMPAIGN.id
    && ad.campaign !== BEACH_COMMONS_V5_CAMPAIGN.id
    && ad.campaign !== NETWORK_EL_SEGUNDO_CAMPAIGN.id
    && ad.campaign !== LOCAL_STAR_COMMONS_CAMPAIGN.id
  ));
  return [
    isCounselSurface ? undefined : counselCreative,
    isBeachBlanketSurface ? undefined : blanketCreative,
    isNounBattlerAnnualSurface ? undefined : annualCreative,
    drumCreative,
    networkCreative,
    commonsCreative,
    ...companionAds,
  ]
    .filter((ad): ad is PointCastAd => Boolean(ad))
    .slice(0, cappedCount);
}

export function adDestination(ad: PointCastAd, pathname: string): string {
  const joiner = ad.href.includes('?') ? '&' : '?';
  const campaign = (ad.campaign || ad.id).toLowerCase();
  const content = `${pathname || '/'}:${ad.id.toLowerCase()}`;
  return `${ad.href}${joiner}utm_source=pointcast&utm_medium=open-ad-rail&utm_campaign=${campaign}&utm_content=${encodeURIComponent(content)}`;
}
