export type BeachCommonsV4Plate = {
  id: string;
  title: string;
  shortTitle: string;
  image: string;
  alt: string;
  element: string;
  civicUse: string;
  description: string;
};

export const BEACH_COMMONS_V4 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-004',
  edition: 4,
  title: 'Beach Commons V4',
  subtitle: 'Sculpture Yard + Element Maxxing',
  dek: 'Seven elements become one public instrument: shade moves, wind plays, rain composes, water cools, moon gathers, fire warms, and stone remembers.',
  url: 'https://pointcast.xyz/beach-commons/v4',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v4.json',
  blockUrl: 'https://pointcast.xyz/b/0511',
  blockId: '0511',
  publishedAt: '2026-07-27',
  previousEdition: {
    title: 'Beach Commons V3 — Flash Bakery + Palm Loom',
    url: 'https://pointcast.xyz/beach-commons/v3',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v3.json',
  },
  nextEdition: {
    title: 'Beach Commons V5 — Weather School + Tide Parliament',
    url: 'https://pointcast.xyz/beach-commons/v5',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v5.json',
  },
  location: {
    name: 'Dockweiler State Beach / El Segundo coast',
    region: 'Los Angeles County, California',
    status: 'site inspiration only; no event, installation, or municipal affiliation',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating field observation, and V4 elemental brief',
    },
    {
      name: 'Codex / OpenAI',
      role: 'concept development, image generation, field-study design, and PointCast edition',
    },
  ],
  thesis: {
    amplification:
      'Element maxxing means increasing attention, participation, shade, color, cooling, sound, rhythm, and seasonal awareness—not controlling weather or inventing unlimited energy.',
    doubleLife:
      'Every sculpture has a daily civic life and a special-event life: shade becomes a clock, drainage becomes music, a basin becomes a moon room, and ballast becomes warm social seating.',
    commons:
      'The artwork is not an object to stand back from. It is public equipment that needs stewards, access, clear operating limits, repair, and a complete way back off the sand.',
  },
  elements: [
    {
      id: 'sun',
      mark: '☀',
      title: 'Sun',
      action: 'Paint moving rooms',
      daily: 'Diffuse ground-directed color, deep shade, and a slow public clock.',
      special: 'Solstice shadow games and a sunset color procession.',
      boundary: 'No focused beams, hot spots, pilot glare, or grid-scale claim.',
    },
    {
      id: 'moon',
      mark: '◯',
      title: 'Moon',
      action: 'Gather time',
      daily: 'A shallow reflective basin, quiet seating, and dark-sky wayfinding.',
      special: 'Moonrise walks, tide listening, poetry, and collective silence.',
      boundary: 'Reflection and ritual only—no lunar-energy machinery.',
    },
    {
      id: 'wind',
      mark: '≈',
      title: 'Wind',
      action: 'Play the structure',
      daily: 'Low-speed fins, woven ribbons, gentle tones, and visible direction.',
      special: 'A cooperative wind score tuned by accessible cloth gates.',
      boundary: 'Guarded motion, brakes, releases, and fold-down storm rules.',
    },
    {
      id: 'rain',
      mark: '┊',
      title: 'Rain',
      action: 'Compose the roof',
      daily: 'Dry shelter, gutters, drainage, and stored repair equipment.',
      special: 'Rain chains, ceramic cups, drums, and safe redirectable channels.',
      boundary: 'Modest temporary storage, obvious overflow, no flood-control claim.',
    },
    {
      id: 'water',
      mark: '∿',
      title: 'Water',
      action: 'Cool the court',
      daily: 'A small recirculated ribbon for washing, cooling, and tactile play.',
      special: 'Gravity relays move one visible volume through public uses.',
      boundary: 'No ocean extraction or discharge; drain fully after use.',
    },
    {
      id: 'fire',
      mark: '△',
      title: 'Fire',
      action: 'Hold the long night',
      daily: 'Cold-season orientation around existing designated public rings.',
      special: 'Story, food, acoustic music, shadow play, and warmed stone seats.',
      boundary: 'Broad buffers, stewards, water, and no improvised beach fire.',
    },
    {
      id: 'stone',
      mark: '■',
      title: 'Stone',
      action: 'Remember the day',
      daily: 'Reusable ballast, seating, thermal mass, edges, and accessible worktops.',
      special: 'The stable ground for every temporary seasonal score.',
      boundary: 'Compact removable modules—not seawalls or habitat armoring.',
    },
  ],
  seasons: [
    {
      id: 'spring',
      title: 'Spring / First Rain',
      elements: 'rain + wind + water',
      cue: 'Close the roof, open the cups, route the overflow, and let the whole pavilion become an instrument.',
      color: '#78a6b1',
    },
    {
      id: 'summer',
      title: 'Summer / High Sun',
      elements: 'sun + water + stone',
      cue: 'Max useful shade, move one careful ribbon of water, and follow the color clock toward evening.',
      color: '#f0a528',
    },
    {
      id: 'autumn',
      title: 'Autumn / Long Wind',
      elements: 'wind + sun + stone',
      cue: 'Tune the cloth gates, play the low-speed loom, repair the weave, and fold it before hard weather.',
      color: '#d45c3f',
    },
    {
      id: 'winter',
      title: 'Winter / Long Night',
      elements: 'moon + fire + stone',
      cue: 'Darken the habitat edge, gather at the basin, light only designated rings, and carry warmth through story.',
      color: '#7d88ad',
    },
  ],
  operatingRules: [
    'Treat every occupied sculpture as engineered public equipment with bracing, access, egress, guarded motion, inspection, and trained stewardship.',
    'Keep diffuse reflectors ground-directed and glare-controlled; never aim concentrated sunlight toward people, traffic, aircraft, or wildlife.',
    'Fold or lock kinetic works before severe weather and keep public exclusion zones clear while parts move.',
    'Collect only modest rain volumes, show overflow and drainage, and leave no standing water after the commons closes.',
    'Recirculated or delivered water stays separated from the ocean, dunes, habitat, wastewater, and food systems.',
    'Use fire only in designated public rings with buffers, supervision, water, extinguishers, and current authorization.',
    'Keep protected habitat, wildlife, shoreline passage, bike travel, emergency access, sightlines, and the dark night edge outside the footprint.',
    'Close with a removal score: drain, fold, inspect, count, repair, pack, clean, and return the beach to public quiet.',
  ],
  realityLevels: [
    {
      id: 'one-day',
      title: 'One-day sculpture score',
      description:
        'Portable shade, low kinetic pieces, dry basins, marked seating, small recirculated water props, analog signals, stewards, and a complete same-day pack-out.',
    },
    {
      id: 'seasonal',
      title: 'Seasonal civic residency',
      description:
        'Add engineered modular frames, scheduled public programming, inspected mechanisms, accessible surfaces, habitat monitoring, weather limits, and secured off-beach storage.',
    },
    {
      id: 'civic',
      title: 'Inland sculpture hardpoint',
      description:
        'A compact approved service pad carries storage, drainage, accessible washrooms, first aid, maintenance, and utility connections while the beach-facing works remain temporary.',
    },
  ],
  boundary:
    'Speculative architecture and public-art fiction only. Not a permitted installation, construction document, engineering approval, fire authorization, water plan, coastal-development approval, habitat review, public event, or invitation to build on the beach.',
} as const;

export const BEACH_COMMONS_V4_PLATES: readonly BeachCommonsV4Plate[] = [
  {
    id: '01',
    title: 'The Element Yard',
    shortTitle: 'Yard',
    image: '/beach-commons/v4/assets/01-element-yard.png',
    alt: 'Aerial view of a reversible public sculpture yard beside the Pacific, with shade, wind structures, a shallow basin, water court, circular seating, accessible routes, open dunes, and the bike path.',
    element: 'All seven',
    civicUse: 'Assembly + orientation',
    description:
      'A constellation rather than a megastructure. Compact anchors frame an open sand arena, and each artwork doubles as shade, sound, seating, cooling, play, repair, or wayfinding.',
  },
  {
    id: '02',
    title: 'Sun Crown',
    shortTitle: 'Sun',
    image: '/beach-commons/v4/assets/02-sun-crown.png',
    alt: 'Circular woven sun sculpture casting warm patterned color and deep shade across an accessible public dance court with stone and brick seating.',
    element: 'Sun',
    civicUse: 'Shade + public clock',
    description:
      'A perforated crown makes useful shade and moves diffuse color across the ground. The day becomes a room-scale clock people can dance through without a screen.',
  },
  {
    id: '03',
    title: 'Moon Basin',
    shortTitle: 'Moon',
    image: '/beach-commons/v4/assets/03-moon-basin.png',
    alt: 'Blue-hour moon gathering around a shallow circular reflective basin with concentric accessible stone seating, shielded lanterns, pale sails, and the dark Pacific beyond.',
    element: 'Moon + water',
    civicUse: 'Quiet gathering + timing',
    description:
      'A shallow reflective ribbon turns moonrise into shared time. The score is deliberately quiet: tide attention, poetry, small music, dark habitat, and room for silence.',
  },
  {
    id: '04',
    title: 'Wind Loom',
    shortTitle: 'Wind',
    image: '/beach-commons/v4/assets/04-wind-loom.png',
    alt: 'Tall braced coastal wind loom with woven ribbons, low-speed fins, bronze bells, accessible rope controls, wheelchair users, musicians, and public seating.',
    element: 'Wind',
    civicUse: 'Music + motion',
    description:
      'Woven gates, ceramic whistles, ribbons, and bronze tones translate breeze into a gentle public score. Brakes, releases, and fold-down cassettes are part of the sculpture.',
  },
  {
    id: '05',
    title: 'Rain Organ',
    shortTitle: 'Rain',
    image: '/beach-commons/v4/assets/05-rain-organ.png',
    alt: 'People sheltering beneath a folded metal rain pavilion where gutters, rain chains, ceramic cups, chimes, drums, channels, and safe drainage turn rainfall into music.',
    element: 'Rain',
    civicUse: 'Shelter + drainage',
    description:
      'The roof earns its drama on the rare wet day. It keeps people dry while chains, cups, drums, and channels reveal the modest volume moving safely back out.',
  },
  {
    id: '06',
    title: 'Water Court',
    shortTitle: 'Water',
    image: '/beach-commons/v4/assets/06-water-court.png',
    alt: 'Sunny inclusive water court with a narrow recirculated channel, accessible hand pumps, shallow play tables, porous ceramic vessels, shade sails, drainage, and potted plants.',
    element: 'Water + stone',
    civicUse: 'Cooling + cooperative play',
    description:
      'One small stored volume travels through hand pumps, runnels, porous ceramics, wash points, and cooling seats. Abundance comes from repeated use, not waste.',
  },
  {
    id: '07',
    title: 'Fire, Stone, Long Night',
    shortTitle: 'Fire',
    image: '/beach-commons/v4/assets/07-fire-stone-long-night.png',
    alt: 'Winter night commons with supervised designated fire rings, broad stone seating, acoustic music, storytelling, shadow puppets, wheelchair access, wind sculptures, and a full moon.',
    element: 'Fire + stone',
    civicUse: 'Warmth + story',
    description:
      'Designated rings hold a long-night commons of food, story, music, and shadow play. Reusable stone seating gathers warmth while textiles and habitat stay well away.',
  },
  {
    id: '08',
    title: 'The Seasonal Score',
    shortTitle: 'Season',
    image: '/beach-commons/v4/assets/08-seasonal-score.png',
    alt: 'Epic sunset panorama of a public sculpture commons where sun, wind, rain, water, fire, and stone installations host dancing, drumming, cooling play, shared food, and protected open dunes.',
    element: 'All seven',
    civicUse: 'Collective seasonal ritual',
    description:
      'The elements overlap without becoming spectacle for its own sake. Shade, sound, water, warmth, dance, food, quiet, and habitat attention form one coordinated public season.',
  },
];
