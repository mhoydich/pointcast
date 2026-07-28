export type ReachLinePlate = {
  id: string;
  number: string;
  title: string;
  image: string;
  alt: string;
  thesis: string;
  measure: string;
  safety: string;
};

export const BEACH_COMMONS_V11 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-011',
  edition: 11,
  title: 'THE REACH LINE',
  subtitle: 'Beach Commons V11',
  dek: 'A giant relay from the Pacific: one soft baton, an unbroken chain of custody, and a new way to measure how far a community can carry one hello.',
  url: 'https://pointcast.xyz/beach-commons/v11',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v11.json',
  blockUrl: 'https://pointcast.xyz/b/0531',
  blockId: '0531',
  publishedAt: '2026-07-28',
  previousEdition: {
    title: 'Tide Cabinet — Beach Commons V10',
    url: 'https://pointcast.xyz/beach-commons/v10',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v10.json',
  },
  location: {
    name: 'Dockweiler State Beach / El Segundo coast',
    region: 'Los Angeles County, California',
    status:
      'site inspiration only; no relay, route, gathering, permit, road closure, contribution drive, or public event is announced',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating giant-relay brief, and Beach Commons series',
    },
    {
      name: 'Codex / OpenAI',
      role: 'current-rules research, game system, image generation, browser instrument, and PointCast edition',
    },
  ],
  question: 'How far can one hello travel without becoming content?',
  answer:
    'Measure hands connected, safe ground covered, the farthest hosted station from the Pacific start, and whether custody survived every handoff.',
  custodyRule:
    'Continuous means unbroken custody, not nonstop motion. The baton may pause in a staffed cradle for crossings, weather, darkness, rest, mobility needs, or route coordination. Speed never wins.',
  finish:
    'The strongest version returns the same baton to the beach with every participant accounted for, zero custody gaps, zero traffic conflicts, zero wildlife disturbance, zero abandoned gear, and less human litter.',
  nonAffiliation:
    'THE REACH LINE is an independent PointCast field study. Its images are speculative prototypes, not photographs of an existing relay or an approved route.',
  boundary:
    'Unofficial speculative concept only. Not an announced, scheduled, permitted, ticketed, sponsored, or live-tracked event; not a record attempt, road-use approval, fundraiser, invitation to gather, or claim of affiliation with LA County, California State Parks, a city, a school, the Olympics, or an athletic body.',
} as const;

export const REACH_LINE_PLATES: readonly ReachLinePlate[] = [
  {
    id: 'zero-mile',
    number: '01',
    title: 'Zero Mile — The Pacific Start',
    image: '/beach-commons/v11/assets/01-zero-mile.png',
    alt: 'A broad intergenerational relay arc begins on dry sand at Dockweiler with a soft orange and blue baton, removable pads, analog carts, and an open access lane.',
    thesis: 'The ocean is the origin, not the obstacle.',
    measure: 'Open the ledger at two hands, zero safe-route meters, and one staffed baton.',
    safety: 'Begin only inside an authorized footprint, landward of water and habitat, with beach and emergency access open.',
  },
  {
    id: 'one-armspan',
    number: '02',
    title: 'The One-Armspan Game',
    image: '/beach-commons/v11/assets/02-one-armspan.png',
    alt: 'A mixed-age, mixed-ability group passes a large padded baton hand to hand on soft geometric pads while a steward uses a walking wheel.',
    thesis: 'The chain bends to meet every body.',
    measure: 'Add the measured gap between one paired handoff and the next; count the new hands entering custody.',
    safety: 'Feet may stay planted. No running, throwing, tugging, loose lines, forced reach, or standard body assumption.',
  },
  {
    id: 'living-odometer',
    number: '03',
    title: 'The Living Odometer',
    image: '/beach-commons/v11/assets/03-living-odometer.png',
    alt: 'An accessible analog score station uses mechanical counters, blank color tiles, clocks, route wheels, and a padded baton cradle.',
    thesis: 'A community becomes its own measuring instrument.',
    measure: 'Mechanical counters make hands, ground, farthest station, and continuity visible without profiles or rankings.',
    safety: 'Keep the ledger anonymous and local: no names, face scans, leaderboards, live location feed, or surveillance.',
  },
  {
    id: 'handoff-house',
    number: '04',
    title: 'The Handoff House',
    image: '/beach-commons/v11/assets/04-handoff-house.png',
    alt: 'A temporary relay station beneath a sturdy coastal terrace offers water, seats, route cards, repair supplies, and a ceremonial handoff while an open aisle remains clear.',
    thesis: 'Hospitality is athletic infrastructure.',
    measure: 'One color card records arrival, pause, next legal leg, and the paired team that assumes custody.',
    safety: 'Use an authorized covered site, preserve a wide public aisle, and disclose tables, chairs, tools, audio, power, and accessibility needs.',
  },
  {
    id: 'great-pause',
    number: '05',
    title: 'The Great Pause',
    image: '/beach-commons/v11/assets/05-great-pause.png',
    alt: 'Relay participants wait well back from a red signal while the padded baton rests in a staffed sidewalk cradle and ordinary traffic continues.',
    thesis: 'The safest move is part of the game.',
    measure: 'Stop route time but preserve custody; a pause card proves the chain did not become a race.',
    safety: 'At every crossing the relay stops completely and uses existing legal controls. Volunteers never direct traffic.',
  },
  {
    id: 'twenty-two-mile-dream',
    number: '06',
    title: 'The Twenty-Two-Mile Dream',
    image: '/beach-commons/v11/assets/06-twenty-two-mile-dream.png',
    alt: 'A wide coastal panorama imagines small hosted handoff stations separated along the South Bay while walkers carry the baton on a pedestrian route and the bicycle path stays open.',
    thesis: 'Distance comes from hosts, not a mass start.',
    measure: 'Each legal station adds one safe route leg and updates the farthest hosted distance from the Pacific origin.',
    safety: 'The county beach path is not an approved relay route. Any long version needs agency and landowner coordination, route review, insurance, staffing, and separated pedestrian space.',
  },
  {
    id: 'moon-fire',
    number: '07',
    title: 'Moon + Fire-Ring Relay',
    image: '/beach-commons/v11/assets/07-moon-fire-ring.png',
    alt: 'At blue hour, participants pass the padded baton on paved space while permitted fire rings remain distant in the background and a hand bell marks the transfer.',
    thesis: 'A handoff can feel ceremonial without becoming dangerous.',
    measure: 'A quiet bell marks custody; the route clock stays secondary to people, darkness, and a clean return.',
    safety: 'Use only existing fire rings under current rules and keep the baton, gear, route, and gathering well outside fire clearance.',
  },
  {
    id: 'return-arc',
    number: '08',
    title: 'The Return Arc',
    image: '/beach-commons/v11/assets/08-return-arc.png',
    alt: 'At sunrise the same soft baton returns through a final handoff as an inclusive community forms an open arc beside tables of abstract route cards and packed carts.',
    thesis: 'The finish line is the starting place, cared for.',
    measure: 'Stop the counters only after the baton, every person, every pad, and every cart completes the return.',
    safety: 'No podium, record claim, permanent marker, discarded material, closed crowd, or victory over the beach.',
  },
] as const;

export const REACH_DIMENSIONS = [
  {
    id: 'hands',
    title: 'HANDS',
    unit: 'people in custody',
    method: 'Begin with the first paired team; add each new pair only after a complete two-person-to-two-person handoff.',
  },
  {
    id: 'ground',
    title: 'GROUND',
    unit: 'safe measured meters',
    method: 'Use a walking wheel only on approved hardscape or a known legal route; measured hand-to-hand gaps form a separate chain total.',
  },
  {
    id: 'farthest',
    title: 'FARTHEST',
    unit: 'hosted meters from the Pacific start',
    method: 'Count only a staffed, authorized station safely reached by the same baton—not a speculative map point.',
  },
  {
    id: 'continuity',
    title: 'CONTINUITY',
    unit: 'unbroken custody',
    method: 'Human hands or a staffed padded cradle remain responsible for the baton through every pause and transfer.',
  },
] as const;

export const REACH_LINE_ROLES = [
  { title: 'Baton Pair', move: 'Carries together and transfers only after the receiving pair has control.' },
  { title: 'Measure Keeper', move: 'Records a measured leg without inventing precision or blocking a path.' },
  { title: 'Custody Clerk', move: 'Marks each handoff, pause, and return with anonymous color cards.' },
  { title: 'Route Steward', move: 'Confirms the legal pedestrian leg and stops the relay before any conflict.' },
  { title: 'Crossing Host', move: 'Holds the pause well back from the curb; never directs vehicles or bicycles.' },
  { title: 'Water + Access Host', move: 'Adapts the chain to rest, mobility, shade, water, and caregiver needs.' },
  { title: 'Quiet Bell', move: 'Sounds one unamplified hand bell only where and when appropriate.' },
  { title: 'Pack-out', move: 'Counts every component and closes with less human litter.' },
] as const;

export const REACH_PATHS = [
  {
    id: 'armspan',
    title: 'Path A / The 100-meter hello',
    scale: 'smallest credible test',
    description:
      'Inside a confirmed authorized footprint, 20–60 people make measured stationary handoffs on removable pads. The line bends around mobility and comfort; the baton never leaves the shared chain.',
  },
  {
    id: 'beach',
    title: 'Path B / The hosted beach relay',
    scale: 'one supervised coastal zone',
    description:
      'Several staffed handoff houses divide a permitted beach activity into short walking legs, full stops, water and access stations, an anonymous ledger, and same-day return.',
  },
  {
    id: 'coast',
    title: 'Path C / The long coast dream',
    scale: 'multi-agency future',
    description:
      'Partner-hosted pedestrian stations imagine a long South Bay chain. It proceeds only after agencies and landowners approve every footprint and safe route condition; the public path remains open.',
  },
] as const;

export const REACH_LINE_SOURCES = [
  {
    title: 'LA County special-event permits',
    note: 'Organized groups planning beach activities must first obtain the applicable Special Event Use Permit.',
    url: 'https://beaches.lacounty.gov/special-event-permit/',
  },
  {
    title: 'LA County beach rules',
    note: 'Current county rules cover organized activity, groups, tents, sound, vehicles, and other beach uses.',
    url: 'https://beaches.lacounty.gov/la-county-beach-rules/',
  },
  {
    title: 'Dockweiler State Beach',
    note: 'Site details include the coastal frontage, bike path, facilities, fire rings, and snowy plover enclosure.',
    url: 'https://beaches.lacounty.gov/dockweiler-beach/',
  },
  {
    title: 'LA County beach bike path',
    note: 'The Marvin Braude path is a public 22-mile bicycle route, not an automatically approved relay course.',
    url: 'https://beaches.lacounty.gov/la-county-beach-bike-path/',
  },
  {
    title: 'LA County beach accessibility',
    note: 'Dockweiler offers access mats and beach wheelchair service under current availability and reservation guidance.',
    url: 'https://beaches.lacounty.gov/la-county-beach-ada-access/',
  },
  {
    title: 'Moving events and road use',
    note: 'LA County guidance distinguishes moving events and notes separate law-enforcement and road-permit coordination.',
    url: 'https://pw.lacounty.gov/SPATS/public/spatsfaq/forms/Road_Closure.pdf',
  },
] as const;

export const REACH_LINE_RULES = [
  'Two hands give to two hands. The baton is soft, padded, visible, and never thrown.',
  'Continuous means accountable custody, not nonstop movement. A staffed cradle is a valid pause.',
  'At crossings: full stop, existing legal signal, ordinary right of way. Volunteers never direct traffic.',
  'No participant enters a bike lane, roadway, surf, dune, habitat enclosure, fire clearance, or emergency lane.',
  'No stakes, digging, loose cords, drones, amplified sound, tents, overnight use, or permanent marker.',
  'No name list, face tracking, public location feed, live participant claim, leaderboard, or social-reach score.',
  'Every table, chair, route footprint, group activity, tool, sound, power source, vendor, and fire use follows current authorization.',
  'The baton, people, pads, carts, cards, and litter return together. The beach is not the expendable part.',
] as const;
