export const BEACH_COMMONS_V12 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-012',
  edition: 12,
  title: 'HARBOR WORKS',
  subtitle: 'Beach Commons V12',
  dek: 'A marina should not only store boats. It should teach a city how to keep things afloat.',
  url: 'https://pointcast.xyz/beach-commons/v12',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v12.json',
  blockUrl: 'https://pointcast.xyz/b/0532',
  blockId: '0532',
  publishedAt: '2026-07-28',
  previousEdition: {
    title: 'The Reach Line — Beach Commons V11',
    url: 'https://pointcast.xyz/beach-commons/v11',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v11.json',
  },
  location: {
    name: 'Marina del Rey',
    region: 'Los Angeles County, California',
    status:
      'site inspiration only; no vessel, parcel, lease, work yard, public program, permit, contribution drive, or event is claimed or announced',
  },
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating marina-reuse brief, and Beach Commons series',
    },
    {
      name: 'Codex / OpenAI',
      role: 'current-condition research, civic harbor system, image generation, local sorter, and PointCast edition',
    },
  ],
} as const;

export const HARBOR_PLATES = [
  {
    id: 'useful-marina',
    number: '01',
    title: 'The Useful Marina',
    kicker: 'working harbor / public atelier',
    thesis: 'Storage becomes stewardship when the work is visible.',
    image: '/beach-commons/v12/assets/01-useful-marina.png',
    alt: 'A sunset marina combines an authorized repair yard, orange gantry, sailcloth shade, small-craft launch, shared worktables, and calm public seating.',
    program:
      'Place hardstand repair, teaching, parts, launch support, clean-harbor services, art, and quiet public life in one legible working landscape.',
    boundary:
      'This is a prototype, not a site plan. Every use depends on ownership, lease, coastal planning, navigation, access, environmental, fire, building, labor, insurance, and operating review.',
  },
  {
    id: 'five-future-triage',
    number: '02',
    title: 'The Five-Future Triage Hall',
    kicker: 'sail / repair / share / parts / dismantle',
    thesis: 'No boat becomes material before it becomes a documented decision.',
    image: '/beach-commons/v12/assets/02-five-future-triage.png',
    alt: 'A bright covered boatyard hall holds small vessels on proper stands while trained workers use contained tool stations and abstract inspection tags.',
    program:
      'Give each vessel an owner-and-title check, professional condition survey, contamination screen, reuse path, cost range, and named responsible party.',
    boundary:
      'Unknown ownership stops the process. Fuel, oil, batteries, sewage, antifouling coatings, lead, asbestos, fiberglass dust, and structural instability require qualified handling.',
  },
  {
    id: 'hull-library',
    number: '03',
    title: 'The Hull Library',
    kicker: 'coastal parts counter',
    thesis: 'A cleat with provenance is inventory; a cleat without it is debris.',
    image: '/beach-commons/v12/assets/03-hull-library.png',
    alt: 'An orderly marine material library catalogs blocks, cleats, rope, lights, winches, hatches, sails, motors, tools, and plywood around communal worktables.',
    program:
      'Inspect, clean, catalog, price, lend, teach, and trace safe components by material, vessel, condition, load rating, and possible second life.',
    boundary:
      'No casual stripping, dock storage, counterfeit safety rating, uncertified load-bearing reuse, or sale of contaminated or ownership-disputed parts.',
  },
  {
    id: 'clean-bilge-lab',
    number: '04',
    title: 'The Clean Bilge Lab',
    kicker: 'no-discharge utility',
    thesis: 'The most beautiful harbor room may be the one that prevents a sheen.',
    image: '/beach-commons/v12/assets/04-clean-bilge-lab.png',
    alt: 'A clean marina service pavilion combines sealed fluid return, absorbent-pad exchange, diagnostics, handwashing, water study, rain capture, and planted filtration.',
    program:
      'Make pump-out literacy, absorbent-pad exchange, oil and battery return, bilge diagnostics, water sampling, and spill response as inviting as a great public library desk.',
    boundary:
      'Nothing is discharged to harbor water. Used absorbents and fluids follow hazardous-waste rules; soap never treats a fuel sheen.',
  },
  {
    id: 'public-launch',
    number: '05',
    title: 'The Public Launch Commons',
    kicker: 'shared small craft',
    thesis: 'A marina becomes public when the first safe boat is easy to borrow.',
    image: '/beach-commons/v12/assets/05-public-launch.png',
    alt: 'An accessible marina launch provides stable transfers, handrails, PFD fitting, shared kayaks and small sailboats, contained rinsing, tool checkout, and open paths.',
    program:
      'Build a low-cost shared fleet with adaptive transfer, mentors, PFD fitting, lockers, hand carts, route briefings, rinse containment, repair time, and an honest cancellation policy.',
    boundary:
      'Access does not mean unmanaged water entry. Weather, capacity, training, vessel condition, personal flotation, harbor rules, supervision, and rescue planning govern every launch.',
  },
  {
    id: 'workboat-cutaway',
    number: '06',
    title: 'The Workboat Cutaway',
    kicker: 'industrial archaeology / atelier',
    thesis: 'Keep one honest hull open enough to show how floating is maintained.',
    image: '/beach-commons/v12/assets/06-workboat-cutaway.png',
    alt: 'A certified former workboat rests in a steel cradle on land as a safe architectural cutaway surrounded by sailmaking, electronics, clean-material craft, and a separated promenade.',
    program:
      'After title, contamination, engineering, fire, access, and preservation review, interpret a land-based hull as a working anatomy lesson and fabrication studio.',
    boundary:
      'A decaying floating vessel is not automatically a studio, habitat, sculpture, or public room. Stabilize and decontaminate before any cut, climb, occupancy, or reuse.',
  },
  {
    id: 'harbor-radio',
    number: '07',
    title: 'Harbor Radio at Blue Hour',
    kicker: 'lofi ↔ hifi / useful signal',
    thesis: 'The night workshop listens before it transmits.',
    image: '/beach-commons/v12/assets/07-harbor-radio.png',
    alt: 'A blue-hour marine electronics workshop holds VHF training benches, navigation-light repairs, oscilloscopes, solder extraction, illuminated buoy models, and a quiet listening corner.',
    program:
      'Teach VHF procedure, weather reception, navigation-light repair, low-voltage power, contact-mic listening, buoy electronics, analog sound, and careful soldering.',
    boundary:
      'No interference, emergency-channel play, pirate transmission, exposed high voltage, unattended batteries, public surveillance, or sound spilling into working slips and habitat.',
  },
  {
    id: 'contentment-pier',
    number: '08',
    title: 'The Contentment Pier',
    kicker: 'work ends / harbor remains',
    thesis: 'Contentment is a harbor where usefulness earns the sunset.',
    image: '/beach-commons/v12/assets/08-contentment-pier.png',
    alt: 'At sunset a long accessible harbor table gathers workers, students, elders, families, sail mending, models, flowers, tea, and quiet music beside packed tool carts and calm water.',
    program:
      'End the day with mending, drawing, tea, models, stories, low-volume music, packed tools, places to be alone, and a table that does not require buying a yacht.',
    boundary:
      'Keep the promenade, emergency access, working slips, neighbors, sanitation, operating hours, food rules, alcohol rules, sound limits, and same-day close legible.',
  },
] as const;

export const BOAT_FUTURES = [
  {
    id: 'sail',
    title: 'Keep Sailing',
    mark: '01',
    color: '#f4efe4',
    when: 'Documented ownership, cleared hazards, sound structure, and a serviceable operating system.',
    next: 'Survey, repair list, safe operating budget, insurance, and return-to-service sign-off.',
  },
  {
    id: 'repair',
    title: 'Repair + Train',
    mark: '02',
    color: '#ff6b3d',
    when: 'Documented ownership, cleared hazards, and repairable structure with enough learning value to justify the work.',
    next: 'Qualified lead, contained hardstand bay, curriculum, cost ceiling, stop rules, and post-repair survey.',
  },
  {
    id: 'share',
    title: 'Donate to the Shared Fleet',
    mark: '03',
    color: '#2b65d9',
    when: 'A sound, supportable small craft has a lawful transfer, practical public use, and a durable operating sponsor.',
    next: 'Title transfer, fleet standard, accessibility plan, storage, maintenance reserve, training, and scheduling.',
  },
  {
    id: 'parts',
    title: 'Harvest Safe Parts',
    mark: '04',
    color: '#1d7a63',
    when: 'The complete vessel is not viable, but cleared, owned, inspectable components can safely re-enter service.',
    next: 'Licensed yard plan, material inventory, component tests, provenance tags, waste streams, and no-water dismantling.',
  },
  {
    id: 'dismantle',
    title: 'Licensed Dismantling',
    mark: '05',
    color: '#d2493f',
    when: 'Structure, contamination, cost, or safety defeats reuse after ownership and professional assessment are resolved.',
    next: 'Remove fluids and hazards, document materials, recover eligible components, contain dust, and send remaining streams to lawful facilities.',
  },
] as const;

export const HARBOR_PATHS = [
  {
    scale: 'smallest credible test',
    title: 'Path A / One useful Saturday',
    copy:
      'At an existing authorized landside facility: a repair café, parts-identification table, absorbent-pad exchange, one adaptive small-craft demo, and a quiet sunset table. No boat acquisition, dismantling, slip work, or water event.',
  },
  {
    scale: 'one operating year',
    title: 'Path B / The Harbor Works residency',
    copy:
      'A yard, school, marina operator, environmental partner, artists, and trades run recurring repair teaching, clean-harbor services, a small shared fleet, a parts library, and one professionally cleared cutaway exhibit.',
  },
  {
    scale: 'long civic horizon',
    title: 'Path C / The working public harbor',
    copy:
      'Coastal planning, lease and capital work connect public access, skilled maritime employment, vessel lifecycle management, water quality, adaptive launch, industrial heritage, art, and quiet everyday use.',
  },
] as const;

export const HARBOR_RULES = [
  'Resolve title, ownership, liens, authorization, and responsible party before touching or moving a vessel.',
  'Survey structure and hazards before repair, occupancy, donation, parts recovery, art use, or dismantling.',
  'Keep major repair, fabrication, grinding, painting, fluid removal, and dismantling in authorized contained landside facilities.',
  'Preserve the harbor’s no-discharge rule, navigation, five-knot limit, working slips, public paths, emergency access, and habitat.',
  'Use qualified people and lawful streams for fuel, oil, batteries, sewage, refrigerants, lead, asbestos, antifouling coatings, fiberglass dust, and contaminated absorbents.',
  'Do not treat a boat, slip, parcel, building, lease, or waste stream as abandoned, available, safe, or public without current evidence and authority.',
  'No live project, acquisition drive, salvage call, contribution request, public launch, lease claim, permit, or event is announced by this study.',
] as const;

export const HARBOR_SOURCES = [
  {
    label: 'LA County Beaches & Harbors — anchorages and boat slips',
    url: 'https://beaches.lacounty.gov/anchorages-and-boat-slips/',
    note: 'County operational context and the current statement that Marina del Rey has more than 4,600 slips across 23 marinas.',
  },
  {
    label: 'LA County Beaches & Harbors — Marina del Rey development',
    url: 'https://beaches.lacounty.gov/marina-del-rey-development/',
    note: 'Active and upcoming capital, public-realm, accessibility, and climate-ready project context.',
  },
  {
    label: 'LA County — navigation and regulations',
    url: 'https://beaches.lacounty.gov/marina-del-rey-navigation-and-regulations/',
    note: 'Eight basins, five-knot/no-wake maximum, no-discharge, anchoring, dock-storage, and repair boundaries.',
  },
  {
    label: 'LA County — supplies and services for boaters',
    url: 'https://beaches.lacounty.gov/marina-del-rey-supplies-and-services-for-boaters/',
    note: 'Pump-out and used-oil service context for a no-discharge harbor.',
  },
  {
    label: 'LA County — absorbent pad exchange',
    url: 'https://beaches.lacounty.gov/absorbent-pad-exchange/',
    note: 'Free clean-pad exchange, used-pad hazardous-waste handling, and the prohibition on using soap on a sheen.',
  },
  {
    label: 'LA County Planning — coastal planning',
    url: 'https://planning.lacounty.gov/coastal-planning/',
    note: 'Certified Local Coastal Program context for access, habitat, visitor uses, visual resources, fisheries, and water quality.',
  },
  {
    label: 'LA County — former California Yacht Club / Tony P’s update',
    url: 'https://content.govdelivery.com/accounts/CALACOUNTY/bulletins/3fbd173',
    note: 'County’s November 2025 update on the fire-damaged former clubhouse and adjacent site licensing.',
  },
  {
    label: 'Originating X post / provocation',
    url: 'https://x.com/dickclucas/status/2082077580967207156',
    note: 'The prompt that triggered this study; its broad diagnosis is not adopted as verified fact.',
  },
] as const;
