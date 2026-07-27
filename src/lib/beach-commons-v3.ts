export type BeachCommonsV3Plate = {
  id: string;
  title: string;
  shortTitle: string;
  image: string;
  alt: string;
  mode: string;
  system: string;
  description: string;
};

export const BEACH_COMMONS_V3 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-003',
  edition: 3,
  title: 'Beach Commons V3',
  subtitle: 'Flash Bakery + Palm Loom',
  magazineTitle: 'The Maximum Beach',
  dek: 'Bake breakfast at sunrise, weave the roof by noon, play through every useful job, feed one long table, and leave the beach open by moonrise.',
  url: 'https://pointcast.xyz/beach-commons/v3',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v3.json',
  reviewUrl: 'https://pointcast.xyz/reviews/beach-commons-v3',
  reviewJsonUrl: 'https://pointcast.xyz/reviews/beach-commons-v3.json',
  blockUrl: 'https://pointcast.xyz/b/0509',
  blockId: '0509',
  publishedAt: '2026-07-27',
  previousEdition: {
    title: 'Beach Commons V2 — Superstructures + Living Games',
    url: 'https://pointcast.xyz/beach-commons/v2',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v2.json',
  },
  location: {
    name: 'Dockweiler State Beach / El Segundo coast',
    region: 'Los Angeles County, California',
    status: 'site inspiration only; no event, installation, food operation, or municipal affiliation',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating field observation, and V3 brief',
    },
    {
      name: 'Codex / OpenAI',
      role: 'concept development, image generation, editorial feature, and PointCast edition',
    },
  ],
  thesis: {
    tempo:
      'A flash commons is fast because its kit, ingredients, safety roles, and choreography arrive prepared—not because fermentation, sanitation, weather, or physics are skipped.',
    metabolism:
      'Grain becomes bread; clean pruning material becomes shade and useful objects; heat becomes warm seats; labor becomes games; cleanup becomes the final public ritual.',
    hospitality:
      'The structure earns its footprint by producing breakfast, shade, skills, delight, and one table where athletic, artistic, technical, culinary, and quiet roles matter equally.',
  },
  rules: [
    'Bring clean palm material from a documented pruning or waste stream; never harvest living beach, dune, or park vegetation.',
    'Real food service needs permits, professional operators, sanitation, allergen controls, cold storage, and an approved operating surface.',
    'Ovens and hot equipment stay on approved inland hardscape with guarded surfaces, water, extinguishers, supervision, and fire-rated clearances.',
    'Open beach fire remains inside designated public rings and stays separate from food production, canvas, habitat, and crowds.',
    'Every game offers athletic, seated, sensory, technical, teaching, cooking, repair, and cleanup roles.',
    'Energy claims remain small and visible: proofing heat, wash water, mixers, mills, lights, tools, bells, and music.',
    'Food, scraps, wastewater, and loose material never enter habitat or reach wildlife.',
    'The shoreline, bike path, emergency routes, sightlines, and lateral public passage remain open.',
    'Moving shades need real bracing, exclusion zones, wind releases, accessible controls, and trained supervision.',
    'The closing score is an empty clean footprint, repaired kit, accounted material, and a beach returned to quiet.',
  ],
  loops: [
    {
      title: 'Flour loop',
      input: 'Prepared dough, modest hand-milled grain, water, time, skilled hands',
      output: 'Bread, breakfast, teaching, sensory play, and one shared table',
    },
    {
      title: 'Palm loop',
      input: 'Clean documented pruning material, fiber cord, looms, repair tools',
      output: 'Shade, baskets, fans, mats, flags, sculptures, and reusable parts',
    },
    {
      title: 'Heat loop',
      input: 'Small solar thermal surfaces, approved ovens, insulated masonry',
      output: 'Proofing warmth, hot water, baking, safe paths, and warm gathering edges',
    },
    {
      title: 'Care loop',
      input: 'Wash stations, cold storage, sealed bins, stewardship, shared timing',
      output: 'Clean food zones, protected habitat, accounted material, and full removal',
    },
  ],
  games: [
    {
      title: 'The Dough Relay',
      score: 'Breakfast reaches the table safely, together, and on time.',
    },
    {
      title: 'Palm Loom Court',
      score: 'Every panel is useful, repairable, beautiful, and made without harvesting.',
    },
    {
      title: 'Shade Raising',
      score: 'Maximum comfortable public shade with minimum material and safe movement.',
    },
    {
      title: 'Clean Sweep',
      score: 'Nothing loose, edible, sharp, hot, or unaccounted remains at closing.',
    },
  ],
  realityLevels: [
    {
      id: 'one-day',
      title: 'One-day flash bakery',
      description:
        'Use an approved mobile bakery on hardscape, prepared dough, rented shade, portable accessible tables, documented craft material, sanitation, permits, and a complete pack-out.',
    },
    {
      id: 'seasonal',
      title: 'Seasonal craft + food court',
      description:
        'Add engineered removable frames, scheduled public workshops, habitat monitoring, professional food operations, wind rules, and verified material recovery.',
    },
    {
      id: 'civic',
      title: 'Permanent service hardpoint',
      description:
        'A compact inland kitchen, washroom, storage, first-aid, and workshop anchor supports temporary courts only when weather, ecology, access, and public operations allow.',
    },
  ],
  boundary:
    'Speculative architecture and editorial fiction only. Not a permitted event, food-service plan, public-health approval, construction document, fire authorization, coastal-development approval, habitat review, operating manual, or invitation to install equipment or serve food on the beach.',
  magazineBoundary:
    'The companion PointCast Reviews feature is an unofficial editorial concept inspired by the confidence and food, travel, gear, and sport register of glossy lifestyle magazines. It was not commissioned, reviewed, sponsored, or endorsed by Maxim or its owners.',
} as const;

export const BEACH_COMMONS_V3_PLATES: readonly BeachCommonsV3Plate[] = [
  {
    id: '01',
    title: 'The Flash Bakery',
    shortTitle: 'Bakery',
    image: '/beach-commons/v3/assets/01-flash-bakery.png',
    alt: 'Sunrise aerial view of a temporary coastal bakery commons with three brick service anchors, sweeping woven shade, communal preparation tables, mobile bakery equipment, accessible paths, and the open Pacific shoreline.',
    mode: 'One-day civic metabolism',
    system: 'Bakery + public ground',
    description:
      'Three compact service anchors and one woven ribbon turn a prepared kit into breakfast, shade, teaching, games, and gathering while keeping the coast visibly open.',
  },
  {
    id: '02',
    title: 'Palm Loom Court',
    shortTitle: 'Loom',
    image: '/beach-commons/v3/assets/02-palm-loom-court.png',
    alt: 'Mixed-age community weaving clean pre-collected palm material into shade, baskets, fans, mats, and sculptural panels at accessible looms beneath an aluminum frame.',
    mode: 'Craft as public sport',
    system: 'Material + skill',
    description:
      'Documented pruning material arrives as a civic resource. Accessible looms make teaching, trimming, weaving, sorting, repair, and shade-making equally visible positions.',
  },
  {
    id: '03',
    title: 'The Dough Relay',
    shortTitle: 'Relay',
    image: '/beach-commons/v3/assets/03-dough-relay.png',
    alt: 'Inclusive cooperative bakery relay with handwashing, dough shaping, guarded pedal mixers, accessible worktables, ceramic timing bells, and the beach beyond.',
    mode: 'Useful collective game',
    system: 'Food + timing',
    description:
      'The opponent is the breakfast clock. Washing, measuring, mixing, resting, shaping, loading, setting, tasting, and cleanup become one generous team sport.',
  },
  {
    id: '04',
    title: 'Sun, Flour, Water',
    shortTitle: 'Energy',
    image: '/beach-commons/v3/assets/04-sun-flour-water.png',
    alt: 'Architectural cutaway of a compact coastal bakery with solar-warmed proofing cabinets, pedal mixers, hand mills, a gravity water tank, woven shade, guarded heat, and drainage.',
    mode: 'Readable energy section',
    system: 'Sun + body + gravity',
    description:
      'Solar warmth, pedals, hand mills, gravity water, and retained masonry heat serve proofing, washing, mixing, baking, shade, signals, and music—never the grid.',
  },
  {
    id: '05',
    title: 'Shade Raising Games',
    shortTitle: 'Shade',
    image: '/beach-commons/v3/assets/05-shade-raising-games.png',
    alt: 'Teams safely raising and tensioning a large woven palm shade with ropes, guarded counterweights, braced masts, accessible controls, exclusion zones, and the ocean beyond.',
    mode: 'Moving-roof tournament',
    system: 'Shade + coordination',
    description:
      'The public score is comfort: raise the most useful shade with the least material, the clearest choreography, and nobody beneath a moving panel.',
  },
  {
    id: '06',
    title: 'Oven Hour',
    shortTitle: 'Oven',
    image: '/beach-commons/v3/assets/06-oven-hour.png',
    alt: 'Late-afternoon mobile bakery on inland hardscape with compact deck ovens, cooling racks, bread, trained operators, extinguishers, woven shade, a communal table, and distant designated fire rings.',
    mode: 'Food + gear editorial',
    system: 'Heat + hospitality',
    description:
      'Steel, brick, flour, bread, linen, and palm weave carry the glamour. The actual luxury is a safe hot loaf moving directly into a public meal.',
  },
  {
    id: '07',
    title: 'Breakfast for the Birds, Without Feeding Them',
    shortTitle: 'Interval',
    image: '/beach-commons/v3/assets/07-wildlife-breakfast.png',
    alt: 'Quiet dawn beach with food activity and sealed bins far inland, a wide empty habitat buffer, distant shorebirds, pelicans overhead, dolphins offshore, and people observing from an accessible platform.',
    mode: 'Ecological restraint',
    system: 'Cleanup + distance',
    description:
      'A clean table is not an invitation to wildlife. Food stays inland, waste stays sealed, habitat stays empty, and the public watches from a respectful distance.',
  },
  {
    id: '08',
    title: 'The Maximum Beach',
    shortTitle: 'Final',
    image: '/beach-commons/v3/assets/08-maximum-beach.png',
    alt: 'Moonlit communal feast beneath a monumental woven crescent canopy with bread, fruit, baskets, lanterns, percussion, dancing, accessible seating, a distant bakery, dark dunes, and the Pacific beyond.',
    mode: 'Glossy collective finale',
    system: 'Meal + moonlight',
    description:
      'The day resolves into one immense table beneath the roof the crowd made. Bread, shade, rhythm, repair, and moonlight become a lifestyle worth sharing rather than buying.',
  },
];
