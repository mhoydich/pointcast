export const BEACH_COMMONS_V13 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-FIELD-STUDY-013',
  edition: 13,
  title: 'THE FERMENTATION LEAGUE',
  subtitle: 'Beach Commons V13',
  dek: 'Four regions. One brewhouse. Nothing wins alone.',
  url: 'https://pointcast.xyz/beach-commons/v13',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v13.json',
  blockUrl: 'https://pointcast.xyz/b/0536',
  blockId: '0536',
  publishedAt: '2026-07-28',
  previousEdition: {
    title: 'Harbor Works — Beach Commons V12',
    url: 'https://pointcast.xyz/beach-commons/v12',
    jsonUrl: 'https://pointcast.xyz/beach-commons/v12.json',
  },
  locations: [
    {
      name: 'Licensed inland fermentation commons',
      role: 'recipe work, beer production, cellar, bread, honey, judging, and adult tasting',
      status: 'speculative; no facility, operator, producer, club, license, or event is announced',
    },
    {
      name: 'Dockweiler / El Segundo coast',
      role: 'all-ages, alcohol-free picnic and utility-games chapter only',
      status: 'site inspiration; no beach event, food service, sale, permit, or gathering is announced',
    },
  ],
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, collaborative brewery and regional competition brief, and Beach Commons series',
    },
    {
      name: 'Codex / OpenAI',
      role: 'current rules and style research, festival system, image generation, local draft board, and PointCast edition',
    },
  ],
} as const;

export const FERMENTATION_PLATES = [
  {
    id: 'commons-brewhouse',
    number: '01',
    title: 'The Commons Brewhouse',
    kicker: 'shared equipment / many forms of authorship',
    thesis: 'A community brewery is not a big kettle. It is a legible chain of trust.',
    image: '/beach-commons/v13/assets/01-commons-brewhouse.png',
    alt: 'A large inland community fermentation campus combines stainless brewing equipment, bread ovens, honey worktables, four team bays, accessible paths, shade, and long communal tables.',
    program:
      'One qualified facility hosts four place-teams and makes milling, hot-side work, cellar care, laboratory checks, baking, honey provenance, hospitality, water, and cleanup equally visible.',
    boundary:
      'Commercial or public beer production belongs inside a properly qualified and licensed operation. This plate is not a brewery plan, offer, club, producer, taproom, or event.',
  },
  {
    id: 'four-waters-table',
    number: '02',
    title: 'The Four Waters Recipe Table',
    kicker: 'coast / basin / valley / foothill',
    thesis: 'Place becomes interesting when it is an argument, not a costume.',
    image: '/beach-commons/v13/assets/02-four-waters-table.png',
    alt: 'Four teams gather around an immense tiled recipe table with grain, hops, rice, rye, honey, bread, water carafes, aroma vessels, and miniature brewing equipment.',
    program:
      'Give every team the same equipment, disclosure rules, and judging frame; let water, grain, fermentation, aroma, bread structure, and hospitality express what each place values.',
    boundary:
      'No geography mechanically determines flavor. Water is measured and adjusted lawfully; ocean water is never a brewing ingredient; local and floral-source claims require evidence.',
  },
  {
    id: 'bread-honey-hall',
    number: '03',
    title: 'Bread + Honey Hall',
    kicker: 'all ages / equal billing',
    thesis: 'The public festival begins where beer stops being the only serious craft.',
    image: '/beach-commons/v13/assets/03-bread-honey-hall.png',
    alt: 'A bright permitted bakery and honey library brings bakers, beekeepers, elders, children, and wheelchair users together around ovens, cooling racks, covered samples, and honey arranged by color.',
    program:
      'Run bread crumb, crust, aroma, structure, grain, honey color, provenance, and pairing as full competitive lanes with water, tea, and alcohol-free malt drinks at the center.',
    boundary:
      'Public food service needs the applicable permits and safe facilities. Allergens travel with every entry, perishable inclusions need qualified review, and honey is never served to infants under twelve months.',
  },
  {
    id: 'fermentation-relay',
    number: '04',
    title: 'The Fermentation Relay',
    kicker: 'mill → mash → cellar → clean close',
    thesis: 'The baton is responsibility, not speed.',
    image: '/beach-commons/v13/assets/04-fermentation-relay.png',
    alt: 'A cutaway brewery shows a glowing baton moving through milling, mashing, lautering, boiling, cooling, cellaring, laboratory work, packaging, hospitality, and cleanup.',
    program:
      'Pass one batch through named adult crews for grain, hot side, cold side, lab, bread, honey, water, hospitality, records, material return, and the final clean inspection.',
    boundary:
      'Qualified supervision, sanitation, temperature control, mill-dust management, hot-liquid protection, records, fermentation time, and lawful packaging outrank spectacle or speed.',
  },
  {
    id: 'regional-cup',
    number: '05',
    title: 'Coast v Basin v Valley v Foothill',
    kicker: 'blind cup / complete systems',
    thesis: 'The strongest glass can lose to the stronger commons.',
    image: '/beach-commons/v13/assets/05-regional-cup.png',
    alt: 'A regional fermentation cup fills a licensed brewery yard with blind adult beer judging, bread tables, honey aroma work, games, abstract flags, ceramic awards, food, water, shade, and accessible seating.',
    program:
      'Score flavor and intent beside bread and honey, provenance, hospitality, access, conservation, and clean close; publish the rubric before anyone writes a recipe.',
    boundary:
      'Beer judging is controlled, anonymous, educational, small-pour, and adults-only. Public service, sale, fundraising, and homebrew competition rules depend on the actual operator and license.',
  },
  {
    id: 'two-site-circuit',
    number: '06',
    title: 'The Two-Site Festival Circuit',
    kicker: 'brew inland / play at the coast',
    thesis: 'A constraint can become the most elegant part of the festival.',
    image: '/beach-commons/v13/assets/06-two-site-circuit.png',
    alt: 'A split landscape connects a licensed inland brewhouse to an alcohol-free Dockweiler games and picnic chapter using cargo bikes, accessible cycles, and small electric vans.',
    program:
      'Keep production, cellar work, adult judging, and alcohol service at an authorized inland venue; carry flags, scorecards, bread, permitted honey service, and dry game props to an alcohol-free beach chapter.',
    boundary:
      'LA County states that no alcohol permits are issued for Dockweiler State Beach. No alcohol, brewing vessel, glass, sale, drinking, or open container belongs in the beach chapter.',
  },
  {
    id: 'local-games-field',
    number: '07',
    title: 'The Local Games Field',
    kicker: 'useful rivalry / all ages',
    thesis: 'Compete at the skills a good gathering actually needs.',
    image: '/beach-commons/v13/assets/07-local-games-field.png',
    alt: 'Four colorful teams play alcohol-free utility games on the beach with lightweight foam barrels, fabric sacks, wooden paddles, water jugs, a table-building puzzle, ceramic scores, and a cleanup sweep.',
    program:
      'Stage foam-barrel slalom, light sack carry, paddle precision, water accounting, canopy fold, accessible table assembly, aroma match, and leave-no-trace close.',
    boundary:
      'Use cleaned lightweight props and bounded courses. No full kegs, drinking games, hot liquid, glass, thrown food, gambling, unsafe lifting, surf-edge play, blocked access, or habitat intrusion.',
  },
  {
    id: 'nothing-wins-alone',
    number: '08',
    title: 'Nothing Wins Alone',
    kicker: 'distributed awards / shared table',
    thesis: 'A place can have a style. A commons needs every place.',
    image: '/beach-commons/v13/assets/08-nothing-wins-alone.png',
    alt: 'At blue hour four regional tables join into one enormous accessible table beside the licensed brewhouse as people share bread, honey, food, water, small drinks, music, tool return, washing, and a braided team standard.',
    program:
      'End with one recipe archive, a shared bread display, distributed ceramic awards, returned tools, washed service ware, counted waste, sober departures, and a clean-close baton.',
    boundary:
      'No winner-take-all podium, drinking contest, open-ended service, invented product launch, or claim that a club, brewery, nonprofit, festival, permit, or public program already exists.',
  },
] as const;

export const FERMENTATION_TEAMS = [
  {
    id: 'coast',
    mark: '01',
    title: 'Coast',
    color: '#245fa8',
    beer: 'Hop-bright West Coast-style pilsener',
    bread: 'Airy olive-oil slab',
    honey: 'Citrus-blossom flight, only with traceable provenance',
    game: 'Water-accounting relay',
    argument:
      'Brightness, dryness, aroma, open structure, and a clean finish. The coast team never uses seawater; it earns place through intention and restraint.',
  },
  {
    id: 'basin',
    mark: '02',
    title: 'Basin',
    color: '#637b45',
    beer: 'Rice lager',
    bread: 'Toasted-grain pull-apart loaf',
    honey: 'Multifloral amber comparison',
    game: 'Accessible table assembly',
    argument:
      'Light body, grain clarity, high collaboration, and the industrial intelligence of many systems sharing one floor.',
  },
  {
    id: 'valley',
    mark: '03',
    title: 'Valley',
    color: '#d45f37',
    beer: 'Dry honey saison',
    bread: 'Seeded orchard miche',
    honey: 'Single-source aroma spectrum',
    game: 'Blind aroma match',
    argument:
      'Fermentation can carry honey aroma without staying sweet. The team foregrounds source, timing, seeds, fruit-adjacent aroma, and patient change.',
  },
  {
    id: 'foothill',
    mark: '04',
    title: 'Foothill',
    color: '#c49a32',
    beer: 'Rye beer',
    bread: 'Dark seeded rye',
    honey: 'Wildflower color-and-aroma flight',
    game: 'Canopy fold and clean close',
    argument:
      'Spice, crust, texture, cool-cellar depth, shade, and durability. Weight comes from grain and care rather than strength for its own sake.',
  },
] as const;

export const FESTIVAL_SCORE = [
  { id: 'flavor', label: 'Flavor + stated intent', points: 25 },
  { id: 'bread-honey', label: 'Bread + honey craft', points: 15 },
  { id: 'traceability', label: 'Ingredient traceability', points: 15 },
  { id: 'hospitality', label: 'Hospitality + access', points: 15 },
  { id: 'conservation', label: 'Water + material care', points: 15 },
  { id: 'close', label: 'Clean close + return', points: 15 },
] as const;

export const FESTIVAL_PHASES = [
  {
    step: '01',
    title: 'Write the common rules',
    copy: 'Publish the facility, team size, base constraints, judging rubric, evidence standard, alcohol-free lane, access plan, and stop rules before recipes begin.',
  },
  {
    step: '02',
    title: 'Make through licensed partners',
    copy: 'The responsible brewery owns production and records. Permitted bakers and food operators own their lanes. Team members contribute inside the operator’s lawful workflow.',
  },
  {
    step: '03',
    title: 'Judge the complete system',
    copy: 'Blind beer judging is one controlled adult room. Bread, honey, alcohol-free drinks, design, hospitality, conservation, and cleanup remain visible to everyone.',
  },
  {
    step: '04',
    title: 'Carry only the games to the beach',
    copy: 'A separately permitted, alcohol-free chapter uses lightweight props, sealed permitted food service, open access, shade, water, habitat buffers, and same-day pack-down.',
  },
  {
    step: '05',
    title: 'Return to one table',
    copy: 'Publish scores and lessons, distribute awards across roles, archive recipes with consent, return tools, count waste, close tabs, and decide whether a second season is warranted.',
  },
] as const;

export const LOCAL_GAMES = [
  'Foam-barrel slalom',
  'Light grain-sack carry',
  'Mash-paddle precision',
  'Water-accounting jug relay',
  'Canopy fold',
  'Accessible table assembly',
  'Blind aroma match',
  'Leave-no-trace close',
] as const;

export const FERMENTATION_RULES = [
  'No beer is produced for public or commercial use outside a properly qualified and licensed operation.',
  'No alcohol, brewing, open container, sale, glass, or drinking game appears in the Dockweiler chapter.',
  'Public bread, honey, beverages, and other food service use the applicable permitted facility or temporary food operation.',
  'Beer judging is adults-only, small-pour, blind, educational, and overseen under the actual venue and event license conditions.',
  'Home-produced beer is never represented as generally saleable or freely serviceable to the public; organizer, participant, premises, nonprofit, and competition rules matter.',
  'Water source, grain, rice, rye, hops, yeast, honey, floral source, allergens, processing, and recipe authorship remain traceable.',
  'Honey is not served to infants under twelve months; non-drinkers and alcohol-free work remain central to every public program.',
  'No announced brewery, club, nonprofit, partner, producer, recipe, batch, festival, competition, product, sale, fundraiser, permit, or invitation is created by this field study.',
] as const;

export const FERMENTATION_SOURCES = [
  {
    label: 'TTB — Beer FAQs',
    url: 'https://www.ttb.gov/regulated-commodities/beverage-alcohol/beer/beer-faqs',
    note: 'Federal brew-on-premises, collaboration, personal-use, competition, sale, and qualified-brewery boundaries.',
  },
  {
    label: 'California ABC — License Types',
    url: 'https://www.abc.ca.gov/licensing/license-types/',
    note: 'Current beer manufacturer, small beer manufacturer, daily license, and event authorization summaries.',
  },
  {
    label: 'California ABC — Daily Licenses',
    url: 'https://www.abc.ca.gov/licensing/license-forms/form-abc-221-instructions/',
    note: 'Qualified organization, owner authorization, outdoor diagram, timing, law-enforcement, and RBS requirements.',
  },
  {
    label: 'LA County Beaches & Harbors — Special Event Permit Addendum',
    url: 'https://file.lacounty.gov/dbh/docs/cms1_150461.pdf',
    note: 'County form states that no alcohol permits are issued for Dockweiler State Beach.',
  },
  {
    label: 'LA County Public Health — Community Events',
    url: 'https://publichealth.lacounty.gov/eh/business/community-events.htm',
    note: 'Event organizer and temporary food facility permit context for public festivals that serve or give away food.',
  },
  {
    label: 'Brewers Association — 2026 Beer Style Guidelines',
    url: 'https://www.brewersassociation.org/edu/brewers-association-beer-style-guidelines/',
    note: 'Current style reference, including Rice Lager, Honey Beer, West Coast-style pilsener, and rye categories. Brewers Association 2026 Beer Style Guidelines published by the Brewers Association.',
  },
  {
    label: 'AHA / BJCP — Sanctioned Competitions',
    url: 'https://www.homebrewersassociation.org/aha-events/aha-bjcp-sanctioned-competition/',
    note: 'Competition registration, standards, judging, and organizer resources.',
  },
  {
    label: 'National Honey Board — Beer Research',
    url: 'https://honey.com/images/files/nhb-beer-research.pdf',
    note: 'Honey is highly fermentable; sweetness and aroma depend on beer, quantity, honey type, processing, and addition stage.',
  },
  {
    label: 'California Department of Public Health — Cottage Food Operations',
    url: 'https://www.cdph.ca.gov/Programs/CEH/DFDCS/Pages/FDBPrograms/FoodSafetyProgram/CottageFoodOperations.aspx',
    note: 'Approved-food, training, sanitation, labeling, and local registration or permit context.',
  },
  {
    label: 'CDC — Honey before twelve months',
    url: 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/foods-and-drinks-to-avoid-or-limit.html',
    note: 'Honey should not be given to children younger than twelve months because of botulism risk.',
  },
] as const;
