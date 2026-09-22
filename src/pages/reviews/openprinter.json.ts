import type { APIRoute } from 'astro';
import { reviewsBySlug } from '../../data/reviews';

const base = reviewsBySlug.get('openprinter')!;

const review = {
  schema: 'pointcast.review/v1',
  ...base,
  url: 'https://pointcast.xyz/reviews/openprinter',
  method: 'public-spec field review: opentools.studio, the Crowd Supply project page and both project updates (2026-06-29, 2026-09-17) as of 2026-09-21. No unit tested.',
  product: {
    name: 'Openprinter',
    maker: 'Open Tools, Paris',
    team: ['Nicolas Schurando', 'Léonard Hartmann', 'Laurent Berthuel'],
    status: 'Crowd Supply campaign "coming soon", autumn 2026; pricing announced at launch',
    url: 'https://www.crowdsupply.com/open-tools/open-printer',
    site: 'https://www.opentools.studio/',
    license: 'CC BY-NC-SA 4.0 (files released after the final version); patent and design registration filed',
  },
  rating: { value: base.rating, outOf: 5, provisional: true },
  scores: { idea: 9.4, repairability: 9.0, opennessToday: 6.2, evidence: 7.4, value: null },
  specs: {
    resolutionDpi: { black: 600, color: 1200 },
    speed: 'TBD',
    cartridges: ['HP 63 / 63XL (US)', 'HP 302 / 302XL (EU)', 'HP 803 / 803XL (Asia)'],
    cartridgeModes: ['black only', 'color only', 'black + color'],
    ink: '100 ml refill bottles (K, C, M, Y) via the Inkit',
    paper: { sheets: ['A4', 'A3', 'Letter', 'Tabloid'], roll: '297 mm / 11 in wide, 18 m or 37.5 m, integrated cutter' },
    mainBoard: 'Raspberry Pi Zero W',
    cartridgeBoard: 'STM32',
    printServer: 'CUPS (AirPrint)',
    connectivity: ['USB-C', 'USB-A host', 'Wi-Fi (site says 802.11ac; Pi Zero W is b/g/n)', 'Bluetooth 4.1'],
    display: '1.47 in TFT 172x320 + jog wheel',
    power: '24 V DC, 2.1 mm jack',
    dimensionsMm: [497, 233, 111],
    dimensionsNote: 'Crowd Supply lists 50 x 10 x 11 cm without the roll',
    mounting: ['desk', 'wall kit'],
    colorways: ['classic', 'chalky blue', 'marble grey', 'clockwork orange', 'pistachio', 'terracotta'],
  },
  pros: [
    'Paper roll with an integrated cutter: banners, strips, receipts, any length',
    'Prints with one cartridge; an empty color never blocks black',
    'Printhead-in-cartridge HP family, refillable, no DRM handshake',
    'CUPS print server: no vendor driver on Windows, macOS, Linux, iOS or Android',
    'Folded metal, standard motors and rods, 3D-printable plastics, kit or assembled',
    'Real prototype printing black and color; beta testers; Bpifrance, SATT Lutech, ENSCI behind it',
  ],
  cons: [
    'Price and print speed unannounced after two updates',
    'CC BY-NC-SA plus a filed patent is not open source; files withheld until after launch',
    'Spec lists 802.11ac on a Pi Zero W (b/g/n only); Ethernet promised in June is gone',
    'Whole design depends on HP continuing the 63/302/803 cartridge family; integrated heads survive limited refills',
    'No scanner (the answer is your phone)',
    'First hardware product from a three-person team, building an inkjet from scratch',
  ],
  pointcastPosition: 'We support the direction and will say so when the campaign opens. We hold the words "open source" until the files are public, and we want a price and a pages-per-minute before anyone here backs it.',
  sources: [
    'https://www.opentools.studio/',
    'https://www.crowdsupply.com/open-tools/open-printer',
    'https://www.crowdsupply.com/open-tools/openprinter/updates/on-the-road-to-launch',
    'https://www.crowdsupply.com/open-tools/open-printer/updates/progress-update-and-details-about-our-nomination-for-a-french-design-award',
  ],
  photoCredit: 'Photographs © Open Tools, reproduced from opentools.studio and Crowd Supply for review.',
  links: {
    campaign: 'https://www.crowdsupply.com/open-tools/open-printer',
    maker: 'https://www.opentools.studio/',
    reviewsDesk: 'https://pointcast.xyz/reviews',
    pointcastBlock: 'https://pointcast.xyz/b/0599',
  },
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(review, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
