export type TideCabinetPlate = {
  id: string;
  number: string;
  title: string;
  lane: 'LOOK' | 'WALK' | 'NIGHT + WATER' | 'RESTORE';
  image: string;
  alt: string;
  promise: string;
  build: string;
  groupMove: string;
  boundary: string;
  parts: readonly string[];
};

export const BEACH_COMMONS_V10 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-010',
  edition: 10,
  title: 'TIDE CABINET',
  subtitle: 'Beach Commons V10',
  dek: 'An eight-part field museum for borrowing attention, not nature: shells and stones return home, the walking net catches only perspective, and restoration begins with the right habitat and partners.',
  url: 'https://pointcast.xyz/beach-commons/v10',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v10.json',
  blockUrl: 'https://pointcast.xyz/b/0528',
  blockId: '0528',
  publishedAt: '2026-07-28',
  previousEdition: {
    title: 'Signal Shack — Beach Commons V9',
    url: 'https://pointcast.xyz/beach-commons/v9',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v9.json',
  },
  location: {
    name: 'Dockweiler State Beach / El Segundo coast',
    region: 'Los Angeles County, California',
    status:
      'site inspiration only; no event is announced, scheduled, permitted, sponsored, or affiliated with LA County',
    restorationContext:
      'Dockweiler already holds real dune restoration and an offshore eelgrass pilot. Olympia oyster restoration belongs in sheltered bays and estuaries with qualified partners and permits—not as a do-it-yourself exposed-surf intervention.',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating shell-and-rock walk, netting exploration, and ocean-life brief',
    },
    {
      name: 'Codex / OpenAI',
      role: 'current-rules research, ecological concept development, image generation, browser instrument, and PointCast edition',
    },
  ],
  thesis: {
    attention:
      'The most interesting collection is a temporary one. Look closely, compare, draw, photograph, and return every natural object to the exact place it was found.',
    frame:
      'A net can become a portable frame: carried above dry sand for looking, raised as a shadow grid, laid on a table as a map, or used to carry litter—never dragged, swept, seined, or used to catch wildlife.',
    restoration:
      'Restoration is not releasing purchased animals or rearranging habitat. It is protecting wrack and nesting space, learning seasonal life, supporting existing projects, and joining expert work in the habitat where it belongs.',
  },
  nonAffiliation:
    'TIDE CABINET is an independent PointCast field study. The images are speculative prototypes, not photographs of an existing installation or an invitation to collect wildlife.',
  boundary:
    'Unofficial speculative field study only. Not an announced event, permit, scientific collecting authorization, fishing instruction, habitat-restoration plan, wildlife-handling protocol, shellfish planting, beach installation, fundraiser, or invitation to gather at Dockweiler.',
} as const;

export const TIDE_CABINET_PLATES: readonly TideCabinetPlate[] = [
  {
    id: 'tide-cabinet',
    number: '01',
    title: 'The Tide Cabinet',
    lane: 'LOOK',
    image: '/beach-commons/v10/assets/01-tide-cabinet.png',
    alt: 'A crescent of rolling field cabinets, shallow study trays, stools, magnifiers, and people examining beach findings on a paved coastal overlook.',
    promise: 'A museum that closes every evening with an empty collection.',
    build:
      'Roll eight shallow cabinets to a legal paved or indoor footprint. Each drawer holds only viewing tools, return cards, blank labels, and litter bags.',
    groupMove:
      'One person remembers the find spot, one describes, one sketches or measures, and one completes the return before another object enters the tray.',
    boundary:
      'The cabinets are temporary furniture, not beach storage. No natural object becomes inventory; all gear and anthropogenic litter leave the same day.',
    parts: ['shallow trays', 'hand lenses', 'paper scales', 'return cards'],
  },
  {
    id: 'borrowing-library',
    number: '02',
    title: 'Shell + Stone Borrowing Library',
    lane: 'LOOK',
    image: '/beach-commons/v10/assets/02-shell-stone-borrowing-library.png',
    alt: 'Children, adults, and elders compare shells and stones in divided trays using hand lenses, paper scales, drawing cards, and a map of find spots.',
    promise: 'Borrow the encounter, not the object.',
    build:
      'Use one-object trays and a simple provenance card: exact find spot, tide relationship, color, texture, likely story, time borrowed, time returned.',
    groupMove:
      'Make a family without ownership: find three objects that rhyme by curve, color, weathering, or weight, then return them one by one.',
    boundary:
      'California State Parks generally prohibits removing natural resources. Even empty shells can be habitat or future sand. Observe in place whenever possible; never take living, attached, occupied, protected, or culturally sensitive material.',
    parts: ['one-object trays', 'wax pencils', 'field cards', 'return map'],
  },
  {
    id: 'net-walk',
    number: '03',
    title: 'The Net Walk',
    lane: 'WALK',
    image: '/beach-commons/v10/assets/03-net-walk.png',
    alt: 'A mixed-age walking group carries colorful open mesh frames above dry sand like handheld viewfinders while keeping a generous distance from birds and the waterline.',
    promise: 'Carry a net that catches only attention.',
    build:
      'Stretch soft, large-grid cord across light handheld frames. Hold them high, turn them toward horizon and sand, or cast a temporary shadow grid for counting color and movement.',
    groupMove:
      'Pairs take turns framing a ten-second scene and describing what crossed the grid: foam, kelp fly, bird shadow, bottle cap, cloud, nothing.',
    boundary:
      'No sweeping, dragging, digging, seining, trapping, entangling, chasing, or water entry. Ocean take is regulated by species, season, place, license, and authorized gear; this tool is not fishing gear.',
    parts: ['soft cord grid', 'light frame', 'wrist tether', 'litter pouch'],
  },
  {
    id: 'wrack-reading-room',
    number: '04',
    title: 'Wrack Line Reading Room',
    lane: 'WALK',
    image: '/beach-commons/v10/assets/04-wrack-line-reading-room.png',
    alt: 'People sit on low stools at a respectful distance from a natural wrack line, reading field cards and observing insects, birds, kelp, and human litter.',
    promise: 'Read the beach’s delivered newspaper before tidying the page.',
    build:
      'Set stools landward of the newest wrack, mark a no-step buffer, and separate natural beach-cast kelp from human-made litter without raking or rearranging.',
    groupMove:
      'Call a quiet inventory: seed, feather, kelp holdfast, fly, track, shell fragment, plastic fragment. Only the last category enters the litter bag.',
    boundary:
      'Wrack is food-web material and helps build dunes. Leave kelp, driftwood, shells, plants, and animal remains where they are; avoid protected plover habitat and give birds escape space.',
    parts: ['low stools', 'distance flags', 'field guide', 'litter tongs'],
  },
  {
    id: 'grunion-moon-watch',
    number: '05',
    title: 'Grunion Moon Watch',
    lane: 'NIGHT + WATER',
    image: '/beach-commons/v10/assets/05-grunion-moon-watch.png',
    alt: 'A quiet moonlit group watches grunion at the waterline from a distance using low red lights, with no nets, buckets, holes, or chasing.',
    promise: 'Make the rare night bigger by touching it less.',
    build:
      'Use the official forecast as a possibility, arrive quietly, stay back until fish establish a run, keep light low, and turn observation into a collective lunar score.',
    groupMove:
      'One person watches the tide, one logs first fish, one counts waves, one protects the dark, and everyone listens before speaking.',
    boundary:
      'Closed season is April through June. During open season current limits, license rules, marine-area rules, and hand-only take apply—but the Tide Cabinet’s choice is observation, never pursuit or take.',
    parts: ['red task light', 'moon card', 'tide clock', 'quiet log'],
  },
  {
    id: 'eelgrass-window',
    number: '06',
    title: 'Eelgrass Window',
    lane: 'NIGHT + WATER',
    image: '/beach-commons/v10/assets/06-eelgrass-window.png',
    alt: 'A split above-and-below-water field visualization shows a shore team comparing observations with a healthy eelgrass meadow full of small fish and invertebrates offshore.',
    promise: 'The most advanced beach structure may be a living one underwater.',
    build:
      'Create a dry-land interpretation table for the existing Dockweiler offshore eelgrass pilot: scale ribbons, fish silhouettes, sediment jars, current arrows, and partner monitoring updates.',
    groupMove:
      'Build one shared food-web map from blades to epiphytes to invertebrates to fish, then add the human job that keeps monitoring possible.',
    boundary:
      'No DIY transplanting, anchoring, diving, harvesting, marker placement, or claims about project results. Support and learn from the permitted living-shoreline partners already doing the work.',
    parts: ['scale ribbons', 'species cards', 'current arrows', 'partner updates'],
  },
  {
    id: 'oyster-relay',
    number: '07',
    title: 'The Oyster Relay — Not Here',
    lane: 'RESTORE',
    image: '/beach-commons/v10/assets/07-oyster-relay.png',
    alt: 'Scientists, community partners, and volunteers work from an authorized platform in a calm Southern California estuary with native oyster habitat modules and eelgrass nearby.',
    promise: 'Move the idea to the habitat instead of forcing the habitat into the idea.',
    build:
      'A Dockweiler learning table hands off to a qualified bay or estuary partner: native-oyster history, screened cultch, conservation aquaculture, monitoring, permits, and long-term stewardship.',
    groupMove:
      'Sponsor or join one partner-defined job—mapping, monitoring, shell preparation, nursery support, access, or interpretation—only after the project names the need.',
    boundary:
      'Olympia oysters are bay and estuary restoration organisms, not an exposed Dockweiler surf release. Never plant store-bought oysters, shells, reefs, cages, or animals; restoration take and placement require qualified partners and authorization.',
    parts: ['partner brief', 'permit map', 'cultch sample', 'monitoring card'],
  },
  {
    id: 'life-returns',
    number: '08',
    title: 'Life Returns by Season',
    lane: 'RESTORE',
    image: '/beach-commons/v10/assets/08-life-returns-by-season.png',
    alt: 'A seasonal coastal panorama connects dunes, wrack, shorebirds, a moonlit grunion watch, offshore eelgrass, a calm-estuary oyster project, and a community study table.',
    promise: 'Build a calendar of attention long enough to notice life returning.',
    build:
      'Link four seasonal windows: dune and plover space, wrack pulses, grunion nights, and partner updates from eelgrass or native-oyster projects.',
    groupMove:
      'Each gathering inherits the last group’s question and leaves the next group one observation, one stewardship action, and one unanswered mystery.',
    boundary:
      'No single beach day proves ecological recovery. Publish uncertainty, partner definitions, and monitoring timeframes; do not substitute spectacle, stocking, feeding, or touching for restoration.',
    parts: ['season wheel', 'habitat map', 'question ledger', 'stewardship log'],
  },
] as const;

export const TIDE_CABINET_ZONES = [
  {
    id: 'look',
    title: 'LOOK',
    color: '#ef6a3a',
    thesis: 'Attention before possession.',
    benchIds: ['tide-cabinet', 'borrowing-library'],
  },
  {
    id: 'walk',
    title: 'WALK',
    color: '#24796f',
    thesis: 'A net can frame, not catch.',
    benchIds: ['net-walk', 'wrack-reading-room'],
  },
  {
    id: 'night-water',
    title: 'NIGHT + WATER',
    color: '#315f9d',
    thesis: 'Observe the living cycles.',
    benchIds: ['grunion-moon-watch', 'eelgrass-window'],
  },
  {
    id: 'restore',
    title: 'RESTORE',
    color: '#a64d67',
    thesis: 'Right habitat. Right partners.',
    benchIds: ['oyster-relay', 'life-returns'],
  },
] as const;

export const TIDE_CABINET_ROLES = [
  { id: 'returner', title: 'Returner', move: 'Remember the exact find spot and close every borrowing loop.' },
  { id: 'net-keeper', title: 'Net Keeper', move: 'Keep the frame high, soft, dry, visible, and empty.' },
  { id: 'wrack-reader', title: 'Wrack Reader', move: 'Name the natural deliveries without rearranging them.' },
  { id: 'night-steward', title: 'Night Steward', move: 'Protect darkness, distance, and the quiet of the run.' },
  { id: 'litter-lift', title: 'Litter Lift', move: 'Remove only the clearly human-made objects you can carry safely.' },
  { id: 'species-witness', title: 'Species Witness', move: 'Describe what you see without touching or pretending certainty.' },
  { id: 'partner-liaison', title: 'Partner Liaison', move: 'Ask the restoration team what help is actually useful.' },
  { id: 'pack-out', title: 'Pack-out', move: 'Count every tool and leave the beach with less human litter.' },
] as const;

export const TIDE_CABINET_CYCLE = [
  { minute: '00', title: 'Find without taking', detail: 'Observe in place first; record the precise relationship to tide and wrack.' },
  { minute: '08', title: 'Borrow one view', detail: 'If lawful and clearly nonliving, use one shallow tray for a brief close look.' },
  { minute: '16', title: 'Compare together', detail: 'Measure, sketch, photograph, describe, and admit what nobody knows.' },
  { minute: '24', title: 'Return exactly', detail: 'Close the loop before another object enters the temporary cabinet.' },
  { minute: '30', title: 'Lift only litter', detail: 'Pack every tool and safely remove only human-made debris.' },
] as const;

export const TIDE_CABINET_ECOLOGY = [
  {
    title: 'Wrack builds more than a line',
    now: 'The Bay Foundation describes wrack as a natural beach process that helps build dunes and supports wildlife and the coastal food web.',
    use: 'Treat the wrack line as a reading room: observe, map, and protect it while lifting only anthropogenic litter.',
    source: 'https://www.santamonicabay.org/what-we-do/projects/los-angeles-living-shoreline-project/',
    sourceLabel: 'The Bay Foundation living shoreline',
  },
  {
    title: 'Dockweiler has a living shoreline',
    now: 'The Los Angeles Living Shoreline Project includes about four acres of dune habitat and a one-acre offshore eelgrass pilot at Dockweiler.',
    use: 'Make the local project legible from dry land and direct volunteer energy toward its real partners and monitoring needs.',
    source: 'https://www.santamonicabay.org/what-we-do/projects/los-angeles-living-shoreline-project/',
    sourceLabel: 'Dockweiler project overview',
  },
  {
    title: 'Grunion follow moon and tide',
    now: 'CDFW manages a closed season, current open-season rules, and observation guidance for California grunion runs.',
    use: 'Stage a no-take moon watch built around darkness, distance, patience, tide timing, and the possibility that no fish arrive.',
    source: 'https://wildlife.ca.gov/Fishing/Ocean/Grunion',
    sourceLabel: 'CDFW grunion guidance',
  },
  {
    title: 'Native oysters need an estuary',
    now: 'Olympia oysters historically formed habitat in Southern California bays and estuaries; current restoration uses expert planning, prepared cultch, monitoring, and permits.',
    use: 'Connect beach curiosity to qualified bay and estuary partners instead of attempting a release at Dockweiler.',
    source: 'https://wildlife.ca.gov/Conservation/Laboratories/Shellfish-Health/Restoration',
    sourceLabel: 'CDFW native oyster restoration',
  },
] as const;

export const TIDE_CABINET_REALITY_PATHS = [
  {
    id: 'walk',
    title: 'Path A / One quiet walk',
    status: 'Start next week',
    description:
      'Four friends carry field cards, hand lenses, a dry walking frame, and one litter pouch. Observe natural objects in place, keep clear of wildlife and protected areas, take photographs rather than specimens, and pack out every tool.',
  },
  {
    id: 'table',
    title: 'Path B / The empty museum',
    status: 'A credible public prototype',
    description:
      'Ask LA County about the appropriate authorization and site for one supervised viewing table on pavement or indoors. The museum opens empty, receives only brief lawful observations, publishes no sensitive locations, and closes empty.',
  },
  {
    id: 'partner',
    title: 'Path C / The habitat relay',
    status: 'Real restoration',
    description:
      'Invite the Dockweiler living-shoreline team, a grunion educator, or a native-oyster restoration partner to define one useful community role. Follow their habitat, season, access, monitoring, and permit framework.',
  },
] as const;

export const TIDE_CABINET_RULES = [
  {
    title: 'Leave the natural collection',
    detail:
      'California State Parks says removing natural resources is generally prohibited. Shells, rocks, plants, driftwood, and animal remains are part of the place; use photographs, rubbings without contact, sketches, and written descriptions as the permanent collection.',
    source: 'https://www.parks.ca.gov/?page_id=937',
    sourceLabel: 'California State Parks FAQs',
  },
  {
    title: 'The net never catches',
    detail:
      'Ocean take is regulated by species, season, place, license, and gear. At Dockweiler, the Tide Cabinet net is a dry-land visual frame and litter carrier only—never a sweep net, seine, trap, or wildlife tool.',
    source: 'https://wildlife.ca.gov/Fishing/Ocean/Regulations/Sport-Fishing/General-Ocean-Fishing-Regs',
    sourceLabel: 'CDFW ocean fishing regulations',
  },
  {
    title: 'Give living things an exit',
    detail:
      'Do not touch, turn over, move, corner, feed, bucket, bait, release, or crowd wildlife. Keep out of the western snowy plover enclosure and increase distance whenever a bird changes behavior because of you.',
    source: 'https://beaches.lacounty.gov/dockweiler-beach/',
    sourceLabel: 'LA County Dockweiler visitor page',
  },
  {
    title: 'Grunion are a watch, not a chase',
    detail:
      'CDFW closes April through June and maintains current rules for open months. The project goes further: no take, holes, handling, bright light, or pursuit; let fish establish the run and accept a night with none.',
    source: 'https://wildlife.ca.gov/Fishing/Ocean/Grunion',
    sourceLabel: 'CDFW grunion guidance',
  },
  {
    title: 'Restoration has a permit path',
    detail:
      'Planting shellfish, placing habitat, transplanting vegetation, or taking organisms for science is not casual stewardship. Work through qualified project leads and applicable restoration or scientific-collecting authorization.',
    source: 'https://wildlife.ca.gov/Conservation/Cutting-Green-Tape/RMP',
    sourceLabel: 'CDFW Restoration Management Permit',
  },
  {
    title: 'Check the day, place, and group',
    detail:
      'Beach access, wildlife protections, fishing regulations, tides, fire rules, and event requirements change. Recheck official sources before each walk; organized activities or larger gatherings may require LA County authorization.',
    source: 'https://beaches.lacounty.gov/la-county-beach-rules-faq/',
    sourceLabel: 'LA County beach rules FAQ',
  },
] as const;

export const TIDE_SCORE_VOICES = [
  { id: 'shell', label: 'Shell bell', color: '#f1b24a', hint: 'a borrowed glint' },
  { id: 'stone', label: 'Stone knock', color: '#de7043', hint: 'weather held' },
  { id: 'wrack', label: 'Wrack hush', color: '#6ba987', hint: 'the delivered line' },
  { id: 'moon', label: 'Moon pulse', color: '#90b8c7', hint: 'wait for the run' },
  { id: 'grass', label: 'Eelgrass sway', color: '#6d8f64', hint: 'life underneath' },
  { id: 'oyster', label: 'Oyster chord', color: '#d9869f', hint: 'the estuary relay' },
] as const;
