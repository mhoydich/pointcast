export type BeachCommonsPrototype = {
  id: string;
  title: string;
  shortTitle: string;
  image: string;
  alt: string;
  mode: string;
  description: string;
};

export const BEACH_COMMONS = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-001',
  title: 'Dockweiler Beach Commons',
  subtitle: 'Hardpoint + Softkit',
  dek: 'A storm-tough mineral center and a kit of rooms that ten people can carry, repair, rearrange, and share.',
  url: 'https://pointcast.xyz/beach-commons/v1',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v1.json',
  blockUrl: 'https://pointcast.xyz/b/0506',
  blockId: '0506',
  publishedAt: '2026-07-26',
  location: {
    name: 'Dockweiler State Beach / El Segundo coast',
    region: 'Los Angeles County, California',
    status: 'site inspiration only; no installation or municipal affiliation',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction and originating field observation',
    },
    {
      name: 'Codex / OpenAI',
      role: 'concept development, image generation, and PointCast edition',
    },
  ],
  thesis: {
    hardpoint:
      'A compact mineral core holds water, washing, cooking, first aid, storage, thermal mass, and the social hearth.',
    softkit:
      'Human-carryable floor cassettes, wind panels, canvas roofs, aluminum frames, rope, clips, curtains, sleeping pods, and art tools make the outer rooms.',
    edge:
      'The parts facing salt, sand, wind, and changing social needs are replaceable, reversible, and designed to be repaired.',
  },
  rules: [
    'The first room built is shared, not private.',
    'Every wall performs at least two jobs.',
    'The ocean side stays open and public passage stays clear.',
    'Everyone gets a quiet sleeping threshold; no one gets an isolated cabin.',
    'Going upward requires engineered structure, guardrails, egress, and an accessible room at grade.',
    'Solar power is reserved for light, water, radio, and tools; communication stays mostly analog.',
    'Anything near wet sand is seasonal, ecologically reviewed, and removable before extreme weather.',
    'The best wave machine makes culture before it makes electricity.',
  ],
  realityLevels: [
    {
      id: 'one-day',
      title: 'One-day exploration',
      description:
        'No masonry. Use a mineral-looking brought-in ballast table, wind screens, mats, rope, and small art instruments.',
    },
    {
      id: 'seasonal',
      title: 'Seasonal public pilot',
      description:
        'An engineered removable frame, accessible deck, supervised program, ecological review, and total removal.',
    },
    {
      id: 'civic',
      title: 'Permanent civic version',
      description:
        'A genuinely engineered service core outside sensitive habitat, with replaceable rooms that change by season.',
    },
  ],
  boundary:
    'Speculative architecture only. Not a construction document, active beach camp, permitted installation, coastal-development approval, habitat review, emergency structure, or invitation to build on the public beach.',
} as const;

export const BEACH_COMMONS_PROTOTYPES: readonly BeachCommonsPrototype[] = [
  {
    id: '01',
    title: 'The Hardpoint + Softkit',
    shortTitle: 'The kit',
    image: '/beach-commons/assets/01-hardpoint-softkit.png',
    alt: 'Exploded architectural view of a brick-and-stone beach service core surrounded by removable decks, aluminum frames, canvas rooms, tools, and people assembling the parts on sand.',
    mode: 'Exploded axonometric',
    description:
      'A few durable heavy pieces protect water, heat, storage, and shared services. Everything around them is light enough to carry, inspect, repair, and reconfigure.',
  },
  {
    id: '02',
    title: 'Ten People, One Courtyard',
    shortTitle: 'The courtyard',
    image: '/beach-commons/assets/02-ten-people-one-courtyard.png',
    alt: 'Ten people cooking, repairing, resting, making art, and talking in a wind-sheltered modular courtyard around a large brick-and-stone hearth beside the ocean.',
    mode: 'Occupied ground study',
    description:
      'A C-shaped windbreak makes one common room before it makes ten private ones. Cooking, repair, art, rest, and conversation remain visible to one another.',
  },
  {
    id: '03',
    title: 'The Vertical Nest',
    shortTitle: 'The nest',
    image: '/beach-commons/assets/03-vertical-nest.png',
    alt: 'Night cutaway through a two-level beach habitat with a braced aluminum frame, warm brick hearth, ground-level accessible berth, upper sleeping nets, stairs, and a small lookout.',
    mode: 'Sectional perspective',
    description:
      'A compact engineered exoskeleton adds lofts, a lookout, and a wind scoop without turning the commons into a tower. One generous sleep room stays accessible at grade.',
  },
  {
    id: '04',
    title: 'The Tide Room',
    shortTitle: 'The tide room',
    image: '/beach-commons/assets/04-tide-room.png',
    alt: 'Oblique dawn view from the ocean toward a brick beach commons on dry sand and a narrow removable boardwalk leading to a tiny open tide-observation room at the wet-sand edge.',
    mode: 'Shoreline relationship',
    description:
      'The heavy commons stays back. A tiny removable listening room approaches the water without walling it off, leaving a clear lateral path along the shore.',
  },
  {
    id: '05',
    title: 'Wave Foundry',
    shortTitle: 'The foundry',
    image: '/beach-commons/assets/05-wave-foundry.png',
    alt: 'Cutaway of a removable beach workshop where gentle wave motion travels through lines and pulleys to operate a loom, ceramic chimes, a sand-drawing arm, and a small light.',
    mode: 'Art and engineering study',
    description:
      'Small paddles and a protected water chamber send slow mechanical motion to a loom, chimes, a sand-drawing arm, and one light. The output is shared culture, not an energy claim.',
  },
  {
    id: '06',
    title: 'The Long Night Commons',
    shortTitle: 'The long night',
    image: '/beach-commons/assets/06-long-night-commons.png',
    alt: 'Wide nighttime beach commons with a shared meal, fire ring, acoustic music, shadow theater, paper messages, colored lanterns, sleeping rooms, the ocean, and distant aircraft lights.',
    mode: 'Celebration scenario',
    description:
      'A shared meal, bells, acoustic music, shadow theater, lantern language, paper messages, and quiet sleeping pods make a night that is connected without demanding screens.',
  },
];
