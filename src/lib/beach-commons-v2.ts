export type BeachCommonsV2Plate = {
  id: string;
  title: string;
  shortTitle: string;
  image: string;
  alt: string;
  mode: string;
  description: string;
  system: string;
};

export const BEACH_COMMONS_V2 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-002',
  edition: 2,
  title: 'Beach Commons V2',
  subtitle: 'Superstructures + Living Games',
  dek: 'A reversible civic megastructure for collective sport, moon rituals, useful energy, fire stewardship, wildlife intervals, repair, and the long wave final.',
  url: 'https://pointcast.xyz/beach-commons/v2',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v2.json',
  blockUrl: 'https://pointcast.xyz/b/0508',
  blockId: '0508',
  publishedAt: '2026-07-26',
  previousEdition: {
    title: 'Beach Commons — Hardpoint + Softkit',
    url: 'https://pointcast.xyz/beach-commons/v1',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v1.json',
  },
  nextEdition: {
    title: 'Beach Commons V3 — Flash Bakery + Palm Loom',
    url: 'https://pointcast.xyz/beach-commons/v3',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v3.json',
  },
  location: {
    name: 'Dockweiler State Beach / El Segundo coast',
    region: 'Los Angeles County, California',
    status: 'site inspiration only; no installation or municipal affiliation',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating field observation, and V2 brief',
    },
    {
      name: 'Codex / OpenAI',
      role: 'concept development, image generation, and PointCast edition',
    },
  ],
  thesis: {
    superstructure:
      'Three compact mineral hardpoints carry water, storage, kitchens, first aid, workshops, and thermal mass. A lightweight ring of masts, beams, decks, nets, and canvas makes the civic scale.',
    games:
      'Sport is cooperative infrastructure: play, repair, music, food, observation, and stewardship all count as meaningful positions.',
    coordination:
      'Energy becomes visible through shared timing. Wave motion, pedals, hand cranks, gravity water, solar surfaces, bells, flags, and lanterns make one legible social machine.',
  },
  rules: [
    'The superstructure must create more open public ground than it occupies.',
    'Every game offers athletic, artistic, technical, social, and accessible roles.',
    'Energy claims stay small, visible, and useful: light, water, tools, sound, and art.',
    'A tall structure needs real bracing, guardrails, egress, weather release, and a generous use at grade.',
    'The shoreline, bike path, emergency routes, and lateral public passage never close.',
    'Fire remains inside designated public fire rings with water, tools, stewards, and broad clear buffers.',
    'Wildlife is watched from a distance; dunes and shorebird zones remain outside the event footprint.',
    'The commons can become quiet: rooms fold back, lights dim, and habitat receives intervals without people.',
    'Maintenance is a public ritual rather than invisible labor.',
    'The final celebration must leave the place lighter, repaired, and ready to disappear.',
  ],
  energyLoops: [
    {
      title: 'Wave',
      input: 'Protected removable paddles and one oscillating-water chamber',
      output: 'Slow mechanical pulse for chimes, loom, water lift, and light',
    },
    {
      title: 'Human',
      input: 'Pedal benches, hand cranks, flywheels, carrying, timing, and repair',
      output: 'Pumps, tools, lantern sequences, shade movement, and system tests',
    },
    {
      title: 'Sun + mass',
      input: 'Small solar surfaces and the thermal calm of masonry',
      output: 'Safe paths, radio, water controls, and warm gathering edges',
    },
    {
      title: 'Gravity + signal',
      input: 'Raised water, counterweights, flags, bells, rhythm, and shared timing',
      output: 'Stored potential, public status, collective scores, and coordination',
    },
  ],
  realityLevels: [
    {
      id: 'one-day',
      title: 'One-day living games',
      description:
        'No masonry or ocean device. Use rented shade, mats, portable ramps, existing courts and fire rings, hand-powered instruments, and a leave-no-trace program.',
    },
    {
      id: 'seasonal',
      title: 'Seasonal civic festival',
      description:
        'An engineered removable canopy on an approved footprint with access planning, habitat monitoring, supervised fire, emergency operations, and total removal.',
    },
    {
      id: 'permanent',
      title: 'Permanent civic anchor',
      description:
        'Compact services outside sensitive habitat, joined to seasonal rooms and courts that expand only when ecology, weather, and public operations allow.',
    },
  ],
  boundary:
    'Speculative architecture only. Not a construction document, active event, energy-performance claim, wildlife plan, fire authorization, coastal-development approval, habitat review, emergency plan, or invitation to install anything on the public beach.',
  energyBoundary:
    'No grid-scale output is claimed: the imagined energy serves lights, pumps, tools, instruments, signals, and art.',
} as const;

export const BEACH_COMMONS_V2_PLATES: readonly BeachCommonsV2Plate[] = [
  {
    id: '01',
    title: 'The Great Canopy Loop',
    shortTitle: 'Canopy',
    image: '/beach-commons/v2/assets/01-great-canopy-loop.png',
    alt: 'Aerial architectural view of three brick beach hardpoints connected by a vast oval of light masts, suspended canvas, public terraces, ramps, courts, workshops, and shared tables.',
    mode: 'Civic superstructure',
    system: 'Structure + gathering',
    description:
      'Three heavy service towers support one light civic loop. It makes shade, courts, workshops, overlooks, meals, and many public thresholds while keeping the center and shoreline open.',
  },
  {
    id: '02',
    title: 'Commons Field Games',
    shortTitle: 'Games',
    image: '/beach-commons/v2/assets/02-commons-field-games.png',
    alt: 'Inclusive cooperative beach games beneath a large tensile canopy with sand courts, rolling lanes, rope play, shaded spectators, drinking water, and people of many ages and abilities.',
    mode: 'Occupied games field',
    system: 'Play + access',
    description:
      'Circular sandball, low-net rhythm games, rolling lanes, and rope courses give every body a position. Shade, water, rest, first aid, and conversation are part of the sporting architecture.',
  },
  {
    id: '03',
    title: 'Moon Court',
    shortTitle: 'Moon',
    image: '/beach-commons/v2/assets/03-moon-court.png',
    alt: 'Full-moon gathering in a circular coastal court with silver canvas reflectors, low brick rooms, colorful lanterns, accessible paths, quiet alcoves, and ocean beyond.',
    mode: 'Lunar collective ritual',
    system: 'Moon + signal',
    description:
      'A slow night game passes light, rhythm, and movement around a circular court. The moon is the spectacle; lanterns, bells, flags, and shadow make an analog public score.',
  },
  {
    id: '04',
    title: 'Wave Relay',
    shortTitle: 'Energy',
    image: '/beach-commons/v2/assets/04-wave-relay.png',
    alt: 'Architectural cutaway of removable wave paddles and a transparent water chamber connected to a beach energy hall where people pedal, crank a flywheel, lift water, ring bells, and weave fabric.',
    mode: 'Energy section',
    system: 'Wave + human power',
    description:
      'Slow wave motion meets pedals, cranks, a guarded flywheel, and gravity water. The modest outputs—pumps, path lights, chimes, loom, and public sculpture—stay visible and honest.',
  },
  {
    id: '05',
    title: 'Fire Commons Constellation',
    shortTitle: 'Fire',
    image: '/beach-commons/v2/assets/05-fire-commons-constellation.png',
    alt: 'Twilight civic feast around multiple designated concrete beach fire rings with wide sand buffers, water barrels, stewards, tools, dining terraces, music, and shadow theater.',
    mode: 'Elemental stewardship',
    system: 'Fire + care',
    description:
      'Existing-style public fire rings become a supervised constellation. The canopy bends away; broad buffers, water, lids, tools, circulation, and stewards make care as visible as flame.',
  },
  {
    id: '06',
    title: 'Wildlife Interval',
    shortTitle: 'Wildlife',
    image: '/beach-commons/v2/assets/06-wildlife-interval.png',
    alt: 'Quiet dawn beach with the commons folded into compact dark brick storage, protected dunes, distant shorebirds, pelicans overhead, dolphins offshore, and a few people observing from an accessible listening platform.',
    mode: 'Ecological pause',
    system: 'Habitat + restraint',
    description:
      'The commons proves it can become quiet. Rooms fold away, a protected habitat buffer stays empty, and people observe birds and offshore life from a distance without feeding, touching, or crowding.',
  },
  {
    id: '07',
    title: 'The Repair Tournament',
    shortTitle: 'Repair',
    image: '/beach-commons/v2/assets/07-repair-tournament.png',
    alt: 'Large mixed-age community safely repairing a modular beach superstructure by tensioning ropes, patching canvas, testing pumps, tuning bells, moving deck cassettes, sorting parts, and sharing food.',
    mode: 'Maintenance as sport',
    system: 'Repair + coordination',
    description:
      'Teams test pumps, tune chimes, patch canvas, move decks, and inspect tension. The score is a healthy shared place; flags, counterweights, and bells make system status public without screens.',
  },
  {
    id: '08',
    title: 'The Long Wave Final',
    shortTitle: 'Final',
    image: '/beach-commons/v2/assets/08-long-wave-final.png',
    alt: 'Moonlit coastal superstructure opened into a vast crescent amphitheater with collective games, dance, percussion, lantern processions, shadow theater, a communal meal, safe distant fire, and dark protected dunes.',
    mode: 'Collective finale',
    system: 'Festival + release',
    description:
      'The final game opens into dance, percussion, shadow theater, lantern waves, and one immense meal. Fire stays buffered, habitat stays dark, quiet rooms remain available, and the commons ends repaired.',
  },
];
