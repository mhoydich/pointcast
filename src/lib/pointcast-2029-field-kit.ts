export type FieldKitPlateKind = 'stadium' | 'fan' | 'third-space' | 'accessory';

export interface FieldKitPlate {
  id: string;
  kind: FieldKitPlateKind;
  title: string;
  kicker: string;
  image: string;
  alt: string;
  thesis: string;
}

export const POINTCAST_2029_FIELD_KIT = {
  spec: 'pointcast.saturday-commons.field-kit/v1',
  title: 'SATURDAY COMMONS',
  subtitle: 'The PointCast 25 / 2029 Field Kit',
  publishedAt: '2026-07-27T23:51:00-07:00',
  canonical: 'https://pointcast.xyz/25/2029/field-kit',
  machineEdition: 'https://pointcast.xyz/25/2029/field-kit.json',
  parent: 'https://pointcast.xyz/25/2029',
  block: '0525',
  songYard: {
    title: 'The Song Yard',
    canonical: 'https://pointcast.xyz/25/2029/song-yard',
    machineEdition: 'https://pointcast.xyz/25/2029/song-yard.json',
    block: '0527',
    originalSongSeeds: 6,
    rehearsalParts: 4,
  },
  visualPlates: 12,
  stamps: 25,
  patternRecipes: 8,
  boundary:
    'Unofficial speculative editorial design. PointCast is not affiliated with, endorsed by, or commissioned by any school, conference, athletic program, stadium, or governing body. These original 2029 concepts are not official identities, approved plans, licensed merchandise, or products for sale.',
} as const;

export const FIELD_KIT_PLATES: FieldKitPlate[] = [
  {
    id: 'stadium-transit-porch',
    kind: 'stadium',
    title: 'The Transit Porch',
    kicker: 'Stadium view 01',
    image: '/images/pointcast-2029-field-kit/stadium-transit-porch.png',
    alt: 'An imagined 2029 civic stadium entrance built as a timber transit porch with tram, bicycle repair, rain channel, native planting, and students arriving in abstract color-block gear',
    thesis: 'The gate is a tram stop, repair stand, rain garden, and welcome desk before it is a security threshold.',
  },
  {
    id: 'stadium-student-end',
    kind: 'stadium',
    title: 'The Student End',
    kicker: 'Stadium view 02',
    image: '/images/pointcast-2029-field-kit/stadium-student-end.png',
    alt: 'An imagined rainy student section beneath a translucent weather roof with handmade abstract flags, modular seat pads, paper programs, and visible rainwater channels',
    thesis: 'The loudest end of the field also makes weather visible and gives every body a repairable place to sit.',
  },
  {
    id: 'stadium-band-terrace',
    kind: 'stadium',
    title: 'Band Terrace at Night',
    kicker: 'Stadium view 03',
    image: '/images/pointcast-2029-field-kit/stadium-band-terrace.png',
    alt: 'An imagined nighttime band terrace in a porous clay stadium with musicians, a small radio desk, ceiling fans, river views, and warm stair lights',
    thesis: 'Broadcast, rehearsal, repair, water, and the view out belong together on one inhabited edge.',
  },
  {
    id: 'stadium-monday-market',
    kind: 'stadium',
    title: 'Monday Market',
    kicker: 'Stadium view 04',
    image: '/images/pointcast-2029-field-kit/stadium-monday-market.png',
    alt: 'An imagined football concourse used on Monday as a produce market, repair clinic, study hall, childcare area, and rehearsal platform',
    thesis: 'A billion-dollar room should not sleep six days a week.',
  },
  {
    id: 'fan-arrival-relay',
    kind: 'fan',
    title: 'Arrival Relay',
    kicker: 'Fan ritual 01',
    image: '/images/pointcast-2029-field-kit/fan-arrival-relay.png',
    alt: 'Students arriving by shuttle, bicycle, walking, and marching band receive abstract paper route cards and a small communal stamp at a stadium gate',
    thesis: 'Arrival becomes a relay of care between bus stewards, cyclists, walkers, band members, and the neighborhood.',
  },
  {
    id: 'fan-section-radio',
    kind: 'fan',
    title: 'Section Radio',
    kicker: 'Fan ritual 02',
    image: '/images/pointcast-2029-field-kit/fan-section-radio.png',
    alt: 'A diverse group of fans in knitted layers share a hand-crank radio, paper field guide, stamp strip, voice recorder, and abstract enamel tokens in the stands',
    thesis: 'A tiny radio, a paper guide, and a traded token can make a section feel more alive than another app.',
  },
  {
    id: 'fan-afterglow-table',
    kind: 'fan',
    title: 'The Afterglow Table',
    kicker: 'Fan ritual 03',
    image: '/images/pointcast-2029-field-kit/fan-afterglow-table.png',
    alt: 'Fans and stadium workers share soup, bread, printed pages, reusable cups, and music at one long table beneath a rainy stadium porch after the game',
    thesis: 'The final ritual is not traffic. It is soup, print, rain, and a table shared by fans and workers.',
  },
  {
    id: 'third-space-print-hall',
    kind: 'third-space',
    title: 'The Print Hall',
    kicker: 'Third space 01',
    image: '/images/pointcast-2029-field-kit/third-space-print-hall.png',
    alt: 'A student print hall overlooking the field with risograph tables, rubber stamp drawers, patch presses, drying racks, and abstract printed matter',
    thesis: 'The weekly visual culture is produced in public, repaired in public, and allowed to change.',
  },
  {
    id: 'third-space-river-room',
    kind: 'third-space',
    title: 'The River Room',
    kicker: 'Third space 02',
    image: '/images/pointcast-2029-field-kit/third-space-river-room.png',
    alt: 'A quiet study and listening room under a stadium with cork tables, wool cushions, public radio booth, books, tea counter, rain garden, and river view',
    thesis: 'Not every stadium room needs to sell urgency; some should offer quiet, tea, radio, and water.',
  },
  {
    id: 'third-space-weather-club',
    kind: 'third-space',
    title: 'Weather Club Roof',
    kicker: 'Third space 03',
    image: '/images/pointcast-2029-field-kit/third-space-weather-club.png',
    alt: 'Students on a stadium roof use wind ribbons, rain gauges, solar panels, seed trays, and abstract migration diagrams to make a campus weather broadcast',
    thesis: 'The highest seats become a weather classroom and public forecast desk.',
  },
  {
    id: 'accessory-pocket-saturday',
    kind: 'accessory',
    title: 'Pocket Saturday',
    kicker: 'Lo-fi carry 01',
    image: '/images/pointcast-2029-field-kit/accessory-pocket-saturday.png',
    alt: 'A tabletop arrangement of a hand-crank radio, rubber stamp, red and blue ink pads, abstract paper field guide, repair tape, token, pencil, earplugs, transit tab, and wrist loop',
    thesis: 'The pocket kit runs without a login: radio, stamp, paper, repair tape, token, pencil, and ear protection.',
  },
  {
    id: 'accessory-common-carry',
    kind: 'accessory',
    title: 'The Common Carry',
    kicker: 'Lo-fi carry 02',
    image: '/images/pointcast-2029-field-kit/accessory-common-carry.png',
    alt: 'A repairable quilted blanket bag with thermos, folding seat pad, binoculars, rain shell, paper ticket roll, small wallet, and original woven patches',
    thesis: 'A blanket becomes a bag; the bag carries weather, sitting, looking, drinking, repairing, and sharing.',
  },
];

export const FIELD_KIT_PATTERN_RECIPES = [
  { id: 'procession', name: 'Procession', note: 'Even ranks march; odd ranks answer.' },
  { id: 'terrace', name: 'Terrace', note: 'A stepped field built like democratic seating.' },
  { id: 'rain', name: 'Rain Register', note: 'Long drops, short marks, visible drift.' },
  { id: 'orbit', name: 'Orbit', note: 'One signal circulates around a civic center.' },
  { id: 'ticker', name: 'Paper Ticker', note: 'A small repeated receipt for Saturday.' },
  { id: 'quilt', name: 'Common Quilt', note: 'Alternating fields for cloth and web.' },
  { id: 'broadcast', name: 'Broadcast', note: 'A radial call with room for an answer.' },
  { id: 'afterglow', name: 'Afterglow', note: 'Large quiet color and a final small stamp.' },
] as const;

export const FIELD_KIT_ACCESSORIES = [
  'Hand-crank section radio',
  'Palm-size rubber identity stamp',
  'Two-color washable ink kit',
  'Folded paper field guide',
  'Repair tape and patch wallet',
  'Reusable earplug case',
  'Analog section dial',
  'Blank transit tab',
  'Blanket-to-sling carry',
  'Pocket score receipt roll',
] as const;

export const FIELD_KIT_TEXT_PARTS = {
  openings: [
    'MEET ME',
    'SAVE A PLACE',
    'BRING THE RADIO',
    'LEAVE THE CAR',
    'MAKE A FLAG',
    'STAY A LITTLE',
    'TAKE THE LONG WAY',
    'COME BEFORE THE NOISE',
  ],
  places: [
    'UNDER THE RAIN ROOF',
    'AT THE TRANSIT PORCH',
    'BY THE BAND TERRACE',
    'INSIDE THE PRINT HALL',
    'DOWN IN THE RIVER ROOM',
    'AT THE AFTERGLOW TABLE',
    'ON THE WEATHER CLUB ROOF',
    'WHERE THE LIGHT HITS THE FIELD',
  ],
  endings: [
    'STAY FOR SOUP.',
    'TRADE ONE STAMP.',
    'BRING SOMETHING TO REPAIR.',
    'LISTEN TO THE WHOLE SECTION.',
    'THE FIELD WORKS ALL WEEK.',
    'PAPER SURVIVES THE APP.',
    'EVERY SEAT IS A THIRD SPACE.',
    'SATURDAY BELONGS TO THE WALK HOME.',
  ],
} as const;
