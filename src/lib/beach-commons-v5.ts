export type BeachCommonsV5Plate = {
  id: string;
  title: string;
  shortTitle: string;
  image: string;
  alt: string;
  element: string;
  civicUse: string;
  description: string;
};

export const BEACH_COMMONS_V5 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-005',
  edition: 5,
  title: 'Beach Commons V5',
  subtitle: 'Weather School + Tide Parliament',
  dek: 'Weather becomes the curriculum: seven elemental classrooms, one seasonal public assembly, and a complete way back off the sand.',
  url: 'https://pointcast.xyz/beach-commons/v5',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v5.json',
  blockUrl: 'https://pointcast.xyz/b/0513',
  blockId: '0513',
  publishedAt: '2026-07-27',
  previousEdition: {
    title: 'Beach Commons V4 — Sculpture Yard + Element Maxxing',
    url: 'https://pointcast.xyz/beach-commons/v4',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v4.json',
  },
  location: {
    name: 'Dockweiler State Beach / El Segundo coast',
    region: 'Los Angeles County, California',
    status: 'site inspiration only; no event, installation, school, parliament, or municipal affiliation',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating field observation, and V5 civic-weather brief',
    },
    {
      name: 'Codex / OpenAI',
      role: 'concept development, image generation, field-study design, and PointCast edition',
    },
  ],
  thesis: {
    school:
      'Weather is not scenery. It is a shared curriculum of shadow, pressure, flow, temperature, timing, restraint, maintenance, and attention.',
    parliament:
      'Tide Parliament is a recurring public ritual for testimony, habitat reports, proposals, food, art, games, and listening—not a government, regulator, forecast service, or scientific authority.',
    commons:
      'Every class leaves behind useful public capacity: shade adjusted, water accounted for, bread shared, cloth repaired, observations exchanged, and the site fully packed away.',
  },
  elements: [
    {
      id: 'sun',
      mark: '☀',
      title: 'Sun',
      action: 'Draw the moving room',
      daily: 'Diffuse color, deep shade, charcoal traces, clay tiles, and body-scale shadow studies.',
      special: 'A solstice studio links drawing, dance, cooling, and the public clock.',
      boundary: 'No focused heat, pilot glare, electronic display, or energy fantasy.',
    },
    {
      id: 'wind',
      mark: '≈',
      title: 'Wind',
      action: 'Write what cannot hold still',
      daily: 'Ribbons, bells, drawing arms, flags, woven panels, and low-speed public music.',
      special: 'Teams turn gusts into notation, choreography, signals, and cooperative play.',
      boundary: 'Guarded motion, brakes, releases, clearances, and fold-down storm rules.',
    },
    {
      id: 'rain',
      mark: '┊',
      title: 'Rain',
      action: 'Hear the roof think',
      daily: 'Dry shelter, gutters, drainage, repair tables, and stored instruments.',
      special: 'Rare rain travels through chains, cups, chimes, drums, and safe channels.',
      boundary: 'Modest temporary storage, safe overflow, and no flood-control claim.',
    },
    {
      id: 'water',
      mark: '∿',
      title: 'Water',
      action: 'Account for every cup',
      daily: 'One recirculated volume serves washing, cooling, bread, potted plants, and play.',
      special: 'Colored floats, bells, tokens, and vessels make allocation a public game.',
      boundary: 'No ocean extraction or discharge; filter, contain, and drain fully.',
    },
    {
      id: 'moon',
      mark: '◯',
      title: 'Moon',
      action: 'Practice collective quiet',
      daily: 'A dry stone circle, low shielded light, a shallow basin, and room to listen.',
      special: 'Moonrise gathers stories, tide notes, proposals, music, and silence.',
      boundary: 'Stay inland and dark-sky; no lunar power or scientific-authority claim.',
    },
    {
      id: 'fire',
      mark: '△',
      title: 'Fire',
      action: 'Feed the long seminar',
      daily: 'Cold-season orientation around existing designated public rings.',
      special: 'A flash bakery, warmed stone, repair, shadow play, and shared night stories.',
      boundary: 'Authorized designated rings only, with buffers, water, and stewards.',
    },
    {
      id: 'stone',
      mark: '■',
      title: 'Stone',
      action: 'Give the day a table',
      daily: 'Reusable ballast, seating, worktops, thermal mass, and low sculpture trays.',
      special: 'Ceramic speaking pieces and voting tokens carry ideas into the assembly.',
      boundary: 'Removable modules only—not seawalls, habitat armoring, or beach-stone removal.',
    },
  ],
  seasons: [
    {
      id: 'morning',
      title: 'Morning / School Opens',
      elements: 'sun + wind + stone',
      cue: 'Unfold shade, inspect every joint, trace the first shadows, tune the wind hall, and keep all public routes open.',
      color: '#e8b457',
    },
    {
      id: 'afternoon',
      title: 'Afternoon / Commons Works',
      elements: 'water + bread + weaving',
      cue: 'Account for one careful water volume, bake and share the day’s bread, repair the palm shade, and play across the open court.',
      color: '#72a9a1',
    },
    {
      id: 'evening',
      title: 'Evening / Parliament Gathers',
      elements: 'tide + moon + testimony',
      cue: 'Move into accessible circles, pass the speaking piece, report what changed, make proposals, vote with ceramic tokens, and listen.',
      color: '#d86947',
    },
    {
      id: 'night',
      title: 'Night / Pack the School',
      elements: 'fire + stone + care',
      cue: 'Use only designated rings, close the water systems, fold wind works, count every part, clean the sand, and leave the habitat dark.',
      color: '#727c9d',
    },
  ],
  operatingRules: [
    'Treat every occupied classroom and artwork as engineered public equipment with bracing, access, egress, guarded motion, inspection, and trained stewardship.',
    'Keep every sun surface diffuse and ground-directed; never aim concentrated light toward people, traffic, aircraft, or wildlife.',
    'Fold or lock kinetic works before severe weather and keep public exclusion zones clear while any part moves.',
    'Collect only modest rain volumes, show overflow and drainage, and leave no standing water when class closes.',
    'Keep delivered or recirculated water separated from the ocean, dunes, habitat, wastewater, and unsafe food contact.',
    'Use fire only in designated public rings with current authorization, broad buffers, supervision, water, and extinguishers.',
    'Hold tide observation at safe inland markers; no surf-edge seats, stages, structures, or crowding.',
    'Keep protected habitat, wildlife, shoreline passage, bike travel, emergency access, sightlines, and the dark night edge outside the footprint.',
    'Close with a removal lesson: drain, fold, inspect, count, repair, pack, clean, and return the beach to public quiet.',
  ],
  realityLevels: [
    {
      id: 'one-day',
      title: 'One-day weather school',
      description:
        'Portable shade, dry instruments, drawing tables, marked seating, a small recirculated water prop, analog signals, stewards, and a same-day pack-out.',
    },
    {
      id: 'seasonal',
      title: 'Seasonal learning residency',
      description:
        'Add engineered modular frames, scheduled classes, food-service review, inspected mechanisms, accessible surfaces, habitat monitoring, weather limits, and off-beach storage.',
    },
    {
      id: 'civic',
      title: 'Inland civic hardpoint',
      description:
        'A compact approved service pad carries storage, drainage, accessible washrooms, first aid, maintenance, and utilities while every sand-facing room remains temporary.',
    },
  ],
  boundary:
    'Speculative architecture, public-art fiction, and an imagined civic curriculum only. Not a permitted installation, school, parliament, forecast, scientific instrument, construction document, engineering approval, fire authorization, water plan, coastal-development approval, habitat review, public event, or invitation to build on the beach.',
} as const;

export const BEACH_COMMONS_V5_PLATES: readonly BeachCommonsV5Plate[] = [
  {
    id: '01',
    title: 'The Weather School',
    shortTitle: 'School',
    image: '/beach-commons/v5/assets/01-weather-school.png',
    alt: 'Aerial view of a reversible coastal Weather School with a central circular forum, accessible paths, shade classrooms, weaving, baking, water and wind instruments, open dunes, shoreline passage, and the bike path.',
    element: 'All seven',
    civicUse: 'Learning + assembly',
    description:
      'A sturdy commons anchors a constellation of foldable classrooms. Sun, wind, rain, water, moon, fire, stone, bread, weaving, games, and stewardship all meet around one open public forum.',
  },
  {
    id: '02',
    title: 'Sun Studio',
    shortTitle: 'Sun',
    image: '/beach-commons/v5/assets/02-sun-studio.png',
    alt: 'Inclusive outdoor Sun Studio with perforated woven shade, hanging ceramic color fins, stone drawing tables, accessible seating, moving shadows, and the Pacific beyond.',
    element: 'Sun + stone',
    civicUse: 'Drawing + movement',
    description:
      'Diffuse light becomes a room-scale pencil. People trace shadow, color, heat, and time with charcoal, clay, woven cord, and movement while the structure does the daily work of shade.',
  },
  {
    id: '03',
    title: 'Wind Notation Hall',
    shortTitle: 'Wind',
    image: '/beach-commons/v5/assets/03-wind-notation-hall.png',
    alt: 'Open timber Wind Notation Hall with guarded drawing arms, a central loom, bronze bells, ribbons, windsocks, accessible workstations, palm weaving, dancers, and the ocean.',
    element: 'Wind + weaving',
    civicUse: 'Notation + cooperative play',
    description:
      'A loom, musical instrument, drawing machine, and shade-repair shop share one braced hall. Teams translate gusts into marks, signals, dance, gentle sound, and better cloth.',
  },
  {
    id: '04',
    title: 'Rain Roof Choir',
    shortTitle: 'Rain',
    image: '/beach-commons/v5/assets/04-rain-roof-choir.png',
    alt: 'People gathered under a warm timber rain pavilion where gutters, chains, bronze cups, chimes, runnels, drums, accessible gates, and obvious drainage turn a storm into a roof choir.',
    element: 'Rain + sound',
    civicUse: 'Shelter + percussion',
    description:
      'The roof teaches only when weather arrives. A modest amount of rain becomes rhythm, drawing, repair, and shared bread before obvious drains carry it safely away.',
  },
  {
    id: '05',
    title: 'Water Accounting Court',
    shortTitle: 'Water',
    image: '/beach-commons/v5/assets/05-water-accounting-court.png',
    alt: 'Sunny accessible Water Accounting Court with hand pumps, narrow stone runnels, transparent vessels, colored floats, bells, shade, washing points, shallow play, and recirculation hardware.',
    element: 'Water + care',
    civicUse: 'Allocation + cooling',
    description:
      'One finite recirculated volume must serve washing, cooling, bread, plants, and play. Transparent vessels, floats, bells, and tokens make each choice public without a screen.',
  },
  {
    id: '06',
    title: 'Moon Assembly',
    shortTitle: 'Moon',
    image: '/beach-commons/v5/assets/06-moon-assembly.png',
    alt: 'Full-moon public circle beneath pale woven sails and reversible stone arches, with accessible seating, shielded amber lights, ceramic speaking objects, a shallow reflective basin, open shoreline passage, and dark habitat.',
    element: 'Moon + tide',
    civicUse: 'Listening + testimony',
    description:
      'The quietest classroom begins at moonrise. A speaking piece travels through tide observations, proposals, music, story, and silence while the ocean and habitat remain respectfully distant.',
  },
  {
    id: '07',
    title: 'Fire + Stone Seminar',
    shortTitle: 'Fire',
    image: '/beach-commons/v5/assets/07-fire-stone-seminar.png',
    alt: 'Winter beach seminar around supervised designated fire rings with broad brick seating, a covered flash bakery, shadow theater, palm weaving, accessible routes, water, extinguishers, and dark ocean beyond.',
    element: 'Fire + stone',
    civicUse: 'Food + story + repair',
    description:
      'Flatbread, repair, low sculpture studies, shadow play, and the long story gather around existing-style designated rings. Heat is held socially, with the safety equipment in the picture.',
  },
  {
    id: '08',
    title: 'Tide Parliament',
    shortTitle: 'Parliament',
    image: '/beach-commons/v5/assets/08-tide-parliament.png',
    alt: 'Epic sunset Tide Parliament with concentric accessible seating, hundreds of participants, inland tide markers, ceramic voting tokens, bread, weaving, sculpture, music, all Weather School pavilions, open dunes, and a clear ocean horizon.',
    element: 'All seven',
    civicUse: 'Seasonal public assembly',
    description:
      'The school closes by becoming an assembly. Short testimony, habitat reports, food, art, games, music, and ceramic votes turn collective noticing into a seasonal civic ritual—then everything folds away.',
  },
];
