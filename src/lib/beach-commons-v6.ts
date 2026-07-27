export type FireRingModule = {
  id: string;
  title: string;
  cue: string;
  description: string;
};

export type FireRingPlate = {
  id: string;
  title: string;
  image: string;
  alt: string;
  description: string;
};

export const BEACH_COMMONS_V6 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-006',
  edition: 6,
  title: 'The $100 Fire-Ring Commons',
  subtitle: 'Ten modules. One quiet score. Everything goes home.',
  dek: 'A fundable, reversible Dockweiler field test: 10–20 adults, an existing fire ring, a $100 non-food module from each contributor, and no architecture heavier than coordination.',
  url: 'https://pointcast.xyz/beach-commons/v6',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v6.json',
  blockUrl: 'https://pointcast.xyz/b/0516',
  blockId: '0516',
  publishedAt: '2026-07-27',
  previousEdition: {
    title: 'Beach Commons V5 — Weather School + Tide Parliament',
    url: 'https://pointcast.xyz/beach-commons/v5',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v5.json',
  },
  location: {
    name: 'Dockweiler State Beach / El Segundo coast',
    region: 'Los Angeles County, California',
    status: 'site inspiration and proposed field-test context only; no event date or County affiliation',
  },
  prototype: {
    people: '10–20 adults',
    unit: '$100 of reusable non-food goods, or one $100 project contribution',
    target: '$1,000 for the first ten-module prototype',
    assembly: '45 minutes in',
    program: '75 minutes listening + 30 minutes play',
    removal: '45 minutes out; every module leaves the beach',
    center: 'one existing first-come, first-served official fire ring, if available and lawful that day',
  },
  checkout: {
    provider: 'Stripe Checkout',
    amount: 100,
    currency: 'USD',
    url: 'https://pointcast.xyz/api/beach-commons/v6/checkout',
    status: 'hosted-external',
    label: 'Contribute $100 by card',
  },
  contributionTerms: [
    'This is project support for reusable prototype goods, safety, access, documentation, and future clearance work.',
    'It is not a ticket, reservation, charitable donation, tax-deductible gift, or promise of attendance, access, an event date, or a fire ring.',
    'If a field test cannot proceed, the contribution still supports Beach Commons research, reusable equipment, visual documentation, and a future compliant iteration.',
    'Food, alcohol, admission, vendors, commercial sponsorship, and resale are outside this round.',
    'Card entry and receipts are handled on Stripe’s hosted Checkout; PointCast does not receive or store card numbers.',
  ],
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating challenge, and Beach Commons project',
    },
    {
      name: 'Codex / OpenAI',
      role: 'field-test design, image generation, interactive audio, research, and PointCast edition',
    },
  ],
  score: [
    {
      id: 'jet',
      title: 'Jet',
      cue: 'Point to one aircraft light. Trace its line with one hand. No phones.',
    },
    {
      id: 'wave',
      title: 'Wave',
      cue: 'Wait for the break. Pass its timing halfway around the crescent.',
    },
    {
      id: 'fire',
      title: 'Fire',
      cue: 'Answer once with bell, frame drum, clap, or breath. Leave room around the ring.',
    },
    {
      id: 'us',
      title: 'Us',
      cue: 'Make one chord together, then let the next full minute belong to the beach.',
    },
  ],
  operatingRules: [
    'No public event date is announced. Obtain all required County clearance before organizing a field test.',
    'Use only an existing official fire ring if one is available; pits are first-come, first-served and cannot be reserved through this contribution.',
    'Keep fire, grills, and fuel inside the official ring; keep ashes and debris out of the sand and follow current extinguishing guidance.',
    'No stage, amplified sound system, generator, vendor, admission gate, alcohol, large canopy, digging, staking, construction, or overnight camp.',
    'Keep the bike path, shoreline passage, emergency access, sightlines, dunes, habitat buffers, and wildlife completely outside the footprint.',
    'Build low and loose: a crescent of stools and cloths, shielded lanterns, one listening table, two wagons, and a broad empty fire-safety halo.',
    'Give every participant a teardown job. Count, cool, clean, inspect, nest, and roll every object before leaving.',
  ],
  boundary:
    'An original PointCast field-study, contribution experiment, and visual prototype. Not a permitted event, ticket, charitable campaign, tax-deductible solicitation, fire authorization, construction document, engineering approval, official County program, or invitation to gather without clearance.',
} as const;

export const FIRE_RING_MODULES: readonly FireRingModule[] = [
  {
    id: '01',
    title: 'Sit low',
    cue: 'Stools + access mat',
    description: 'Four nesting stools or a pair of better seats, plus one firm path panel that keeps the crescent open.',
  },
  {
    id: '02',
    title: 'Hold warmth',
    cue: 'Canvas + wool',
    description: 'Two durable ground cloths and washable wool throws; no disposable beach décor and nothing overhead.',
  },
  {
    id: '03',
    title: 'Light the edge',
    cue: 'Low solar lanterns',
    description: 'Shielded amber lights that mark gear and access without becoming glare for neighbors, wildlife, or aircraft.',
  },
  {
    id: '04',
    title: 'Hear together',
    cue: 'Bell + frame drum',
    description: 'One acoustic sound module for the Jet / Wave / Fire / Us score. Quiet enough to stop instantly.',
  },
  {
    id: '05',
    title: 'Draw weather',
    cue: 'Analog field table',
    description: 'Wind ribbons, pencils, cards, clips, a compass, and a non-digital way to notice what the evening is doing.',
  },
  {
    id: '06',
    title: 'Move the commons',
    cue: 'Wagon + nesting crates',
    description: 'One all-terrain wagon or a family of tough crates that turns setup and teardown into a visible system.',
  },
  {
    id: '07',
    title: 'Make access real',
    cue: 'Firm surface + spare seat',
    description: 'A second access panel, stable chair, high-contrast edge markers, and room for a mobility device in the circle.',
  },
  {
    id: '08',
    title: 'Carry care',
    cue: 'Water + handwashing',
    description: 'Drinking water, a compact handwashing setup, basic first aid, and sun or wind protection that goes home.',
  },
  {
    id: '09',
    title: 'Back the fire',
    cue: 'Safety + ash tools',
    description: 'Appropriate extinguisher, metal bucket, poker, gloves, and cleanup tools—used only with current official guidance.',
  },
  {
    id: '10',
    title: 'Leave no trace',
    cue: 'Count + clean + archive',
    description: 'Grabbers, sorting sacks, inventory bands, repair tape, and one camera-free paper archive of what worked.',
  },
];

export const FIRE_RING_PLATES: readonly FireRingPlate[] = [
  {
    id: '01',
    title: 'Ten Modules Arrive',
    image: '/beach-commons/v6/assets/01-ten-modules-arrive.png',
    alt: 'Adults approaching an official Dockweiler fire ring with two wagons and an organized array of stools, cloths, lanterns, instruments, water, crates, and safety equipment.',
    description:
      'The architecture arrives as ten different acts of care. No module is impressive alone; together they can seat, light, move, score, clean, and close the evening.',
  },
  {
    id: '02',
    title: 'The Forty-Five-Minute Commons',
    image: '/beach-commons/v6/assets/02-forty-five-minute-commons.png',
    alt: 'A low accessible crescent of adults, stools, ground cloths, lanterns, wagons, and acoustic instruments around a broad safety halo and an existing fire ring at golden hour.',
    description:
      'A low crescent faces both fire and ocean. The gaps matter as much as the objects: wheelchair entry, fire clearance, public passage, wind release, and a clean route back out.',
  },
  {
    id: '03',
    title: 'Jet / Wave / Fire / Us',
    image: '/beach-commons/v6/assets/03-jet-wave-fire-us.png',
    alt: 'A blue-hour circle of adults playing quiet acoustic instruments around an existing official fire ring, with moonlit ocean, aircraft lights, low lanterns, safety tools, wagons, and open habitat.',
    description:
      'The evening becomes a four-part analog score. Follow one aircraft light, pass one wave, answer the fire once, then make one human chord and stop.',
  },
];
