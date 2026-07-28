export type CommonsSource = {
  id: string;
  label: string;
  publisher: string;
  url: string;
  note: string;
};

export const CREATURE_COMMONS_META = {
  schema: 'pointcast.creature-commons/v1',
  id: 'creature-commons-la-001',
  title: 'A Digital Pet Needs a Commons',
  shortTitle: 'Creature Commons LA',
  description:
    'A PointCast working proposal for a Los Angeles institution that shares digital-creature production knowledge, memory standards, repair capacity, and dignified endings.',
  route: '/digital-pets/commons',
  jsonRoute: '/digital-pets/commons.json',
  bookRoute: '/digital-pets',
  officeRoute: '/digital-pets/office',
  status: 'working proposal',
  publishedAt: '2026-07-27T22:45:00-07:00',
  updatedAt: '2026-07-27T22:45:00-07:00',
  geography: 'Greater Los Angeles, beginning in the South Bay',
  audience: 'Adult makers, collectors, repairers, and curious households',
  pilotLength: '90 days',
  pilotProof:
    'Three non-sale reference creatures, a Memory Passport, a Local Life Standard, and recurring build and repair nights.',
  boundary:
    'Not incorporated. No charitable status, fundraising campaign, facility, vendor commitment, public product sale, or children’s study is claimed.',
} as const;

export const CREATURE_COMMONS_DECISIONS = [
  {
    label: 'First community',
    value: 'Adults first',
    detail:
      'Makers, collectors, repairers, and curious households can test the institution without pretending a children’s product compliance program already exists.',
  },
  {
    label: 'Organizational form',
    value: 'Commons + authored studio',
    detail:
      'The commons stewards continuity infrastructure. Creators retain characters, canon, and the right to publish specific creatures.',
  },
  {
    label: 'Ninety-day proof',
    value: 'Three bodies + two standards + a public rhythm',
    detail:
      'Make three non-sale references, publish the Memory Passport and Local Life Standard, and run recurring build and repair sessions in partner space.',
  },
] as const;

export const CREATURE_COMMONS_SOURCES: CommonsSource[] = [
  {
    id: 'acme',
    label: 'About ACME PCB Assembly',
    publisher: 'ACME PCB Assembly / Yun Industrial',
    url: 'https://acme-pcbassembly.com/about/',
    note: 'Carson facility, one-piece prototype through 20,000-unit PCBA production.',
  },
  {
    id: 'emshi',
    label: 'Sewn-goods product development',
    publisher: 'Studio EMSHI',
    url: 'https://www.emshi.com/',
    note: 'DTLA product development, materials, construction, sampling, tech packs, and manufacturing readiness.',
  },
  {
    id: 'sewing-incubator',
    label: 'Designed and made in Los Angeles',
    publisher: 'Sewing Incubator',
    url: 'https://www.sewingincubatorusa.com/',
    note: 'Huntington Park technical sewing, sampling, fabric sourcing, specialty soft goods, and production.',
  },
  {
    id: 'precision',
    label: 'Custom mold building',
    publisher: 'Precision Molded Plastics',
    url: 'https://www.precisionmoldedplastics.com/wp-content/uploads/2023/03/Custom_Mold_Building_Precision_2023.pdf',
    note: 'Upland DFM, prototype through high-cycle tooling, insert molding, overmolding, testing, and sampling.',
  },
  {
    id: 'cmtc',
    label: 'Made in California Program',
    publisher: 'California Manufacturing Technology Consulting',
    url: 'https://www.cmtc.com/made-in-california-profile/ra-industries',
    note: 'California manufacturer discovery and visibility network based in Long Beach.',
  },
  {
    id: 'cpsc',
    label: 'Toy Safety Business Guidance',
    publisher: 'U.S. Consumer Product Safety Commission',
    url: 'https://www.cpsc.gov/Business--Manufacturing/Business-Education/Toy-Safety',
    note: 'Current federal guidance on mandatory toy standards, testing, and certification.',
  },
  {
    id: 'coppa',
    label: 'Complying with COPPA',
    publisher: 'U.S. Federal Trade Commission',
    url: 'https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions',
    note: 'Current federal guidance covering connected toys and children’s voice recordings.',
  },
  {
    id: 'fcc',
    label: 'Equipment Authorization System',
    publisher: 'U.S. Federal Communications Commission',
    url: 'https://opendata.fcc.gov/Engineering-Technology/EAS-Equipment-Authorization-Grantee-Registrations/3b3k-34jp',
    note: 'Overview of authorization required for radio-frequency devices before marketing or import.',
  },
  {
    id: 'community-partners',
    label: 'Fiscal sponsorship',
    publisher: 'Community Partners',
    url: 'https://www.communitypartners.org/fiscal-sponsorship/',
    note: 'Los Angeles comprehensive fiscal-sponsorship model, timing, infrastructure, and published fee schedule.',
  },
  {
    id: 'ca-charities',
    label: 'Attorney General’s Guide for Charities',
    publisher: 'California Department of Justice',
    url: 'https://oag.ca.gov/system/files/media/Guide%20for%20Charities.pdf',
    note: 'California public-benefit formation, reporting, registration, and preliminary organizational questions.',
  },
  {
    id: 'ca-coop',
    label: 'California Cooperative Corporation Law',
    publisher: 'California Legislative Information',
    url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CORP&sectionNum=12200',
    note: 'California law applying to consumer, worker, and other cooperative corporations.',
  },
];

export const CREATURE_COMMONS_ARTICLE = {
  claim:
    'A company can publish a creature. Only an institution can keep the conditions of care from disappearing with the company.',
  pullQuote:
    'The commons should not own every character. The studio should not own the owner’s accumulated relationship.',
  paragraphs: [
    'A digital pet company can make a beautiful promise and still be the wrong shape to keep it. Companies are built to ship products, defend margins, change strategies, and eventually end. A creature asks for commitments that outlive each of those events: repair knowledge that remains public, memory that can leave the maker, parts that can be found after a model leaves the catalog, and an ending more deliberate than an authentication error. Those commitments need an institution of their own.',
    'Call it Creature Commons LA: a local layer beneath an authored creature economy. It would not invent every animal or own every story. It would steward the boring, intimate conditions that make long relationships possible—the offline-life test, the Memory Passport, service documentation, a parts library, repair practice, and a graveyard protocol. An artist can still write the character. A studio can still publish an edition. The commons keeps the floor from vanishing underneath both of them.',
    'Los Angeles is unusually suited to try this because the necessary work already lives near one another. ACME says its Carson facility can build one circuit-board prototype or a run of twenty thousand. DTLA and Huntington Park contain soft-goods developers, sample rooms, pattern makers, technical sewing, and small production. Upland has tooling, overmolding, and injection-molding capacity. The first hundred bodies do not need to appear by magic at the end of a global sourcing spreadsheet. Their builders can meet, open the same object, and discover where the design is lying.',
    'That proximity is not localism as decoration. It is product intelligence. When the sewing developer can show the embedded engineer where a service seam will fail, the body changes before a support ticket exists. When the repairer can ask the board assembler for a connector that survives repeated opening, maintenance enters the bill of materials. When an owner can bring a worn creature back to the people who made its layers, care becomes observable design input rather than a retention metric.',
    'The organization should have two sides with a bright line between them. The commons side owns the shared continuity infrastructure: standards, reference tools, supplier learning, workshops, repair records, and the archive. The authored-studio side owns named creatures, canon, editions, performances, and commercial collaborations. The commons should not own every character. The studio should not own the owner’s accumulated relationship. A healthy agreement lets creative specificity remain valuable without making basic survival proprietary.',
    'Start with adults and three non-sale reference creatures. Give each one a replaceable battery, an obvious service path, a visible microphone state, a minimum local personality, and a memory object that can be exported and inspected. Then run the first build circle and repair night. The test is not whether the creatures look ready for retail. It is whether a person outside the design team can identify what remains alive without a network, what can be replaced, what the household owns, and what happens if the organization disappears.',
    'Do this for ninety days before signing a lease or filing an entity because a commons is a practice before it is a corporation. Borrow partner space. Request real manufacturability reviews and quotes. Publish the disagreements. If education, public access, repair literacy, and preservation become the center, fiscal sponsorship or a California public-benefit corporation may fit. If workers and caretaker-members need economic ownership, a cooperative may fit. If selling authored hardware becomes the center, keep a taxable studio and let it contract with or contribute to the commons.',
    'Children can become a later constituency, not an implied launch market. A connected, battery-operated creature marketed as a children’s toy enters real CPSC testing and certification territory; collecting a child’s voice can enter COPPA territory. “Community” cannot be an excuse for informal safety. The adult pilot should treat compliance, privacy, radio authorization, liability, and truthful claims as founding functions rather than paperwork waiting beyond the prototype.',
    'The public output is not a startup demo day. It is a field guide: three opened bodies, two draft standards, a supplier map, the costs people were willing to quote, the failures nobody could explain away, and a calendar for the next repair night. PointCast can publish the argument while the bench tests it. The result may become a nonprofit program, a cooperative, a studio partnership, or simply a better set of promises. Any of those is more useful than incorporating an exciting name before the community knows what it is for.',
    'A company can publish a creature. Only an institution can keep the conditions of care from disappearing with the company. The future of digital pets therefore needs more than founders and customers. It needs stewards, repairers, archivists, and households with enough power to carry the relationship forward. It needs a commons before it needs a campus.',
  ],
  sourceIds: ['acme', 'emshi', 'sewing-incubator', 'precision', 'cpsc', 'coppa', 'community-partners', 'ca-charities', 'ca-coop'],
} as const;

export const CREATURE_COMMONS_BOUNDARY = [
  {
    side: 'The commons stewards',
    items: [
      'Local Life Standard',
      'Memory Passport',
      'Repair and parts knowledge',
      'Supplier map and reference tools',
      'Public workshops and field guides',
      'Graveyard and archive protocol',
    ],
  },
  {
    side: 'The studio authors',
    items: [
      'Named creatures and canon',
      'Hardware editions',
      'Stories and performances',
      'Visual identity and collaborations',
      'Commercial distribution',
      'The specific point of view',
    ],
  },
] as const;

export const CREATURE_COMMONS_ROOMS = [
  {
    number: '01',
    name: 'The Bench',
    description:
      'Electronics, mechanisms, soft-body sampling, teardown, service documentation, and small-run assembly.',
  },
  {
    number: '02',
    name: 'The Library',
    description:
      'Reference bodies, component samples, tools, field guides, memory schemas, and known-good offline builds.',
  },
  {
    number: '03',
    name: 'The Clinic',
    description:
      'Repair nights, diagnosis, battery and textile replacement, memory export, and second-owner transitions.',
  },
  {
    number: '04',
    name: 'The Press',
    description:
      'PointCast essays, build logs, supplier interviews, owner stories, and an annual state-of-the-creature report.',
  },
  {
    number: '05',
    name: 'The Graveyard',
    description:
      'Repair exhaustion, migration, memorial, secure deletion, parts donation, and responsible material recovery.',
  },
] as const;

export const CREATURE_COMMONS_PILOT = [
  {
    range: 'Days 01–14',
    name: 'Write the compact',
    proof: 'Five one-page promises and a five-to-seven-person founding circle.',
    actions: [
      'Name what must remain common and what creators may own.',
      'Draft the local-life, memory, repair, privacy, and ending promises.',
      'Recruit embedded, soft-goods, repair, privacy, education, and editorial experience.',
    ],
  },
  {
    range: 'Days 15–45',
    name: 'Map and make',
    proof: 'Three non-sale reference bodies and real local manufacturability feedback.',
    actions: [
      'Meet one electronics assembler, one soft-goods developer, one enclosure shop, and one compliance advisor.',
      'Build the teardown, battery path, memory export, and no-network demonstration.',
      'Record quotes and constraints instead of inventing unit economics.',
    ],
  },
  {
    range: 'Days 46–75',
    name: 'Operate the commons',
    proof: 'One closed build circle, one repair night, and two public draft standards.',
    actions: [
      'Test whether another adult can service and understand the reference body.',
      'Publish the Local Life Standard and Memory Passport as discussion drafts.',
      'Log disagreements before they become household dependencies.',
    ],
  },
  {
    range: 'Days 76–90',
    name: 'Show the proof',
    proof: 'A field guide and a decision about whether an organization is warranted.',
    actions: [
      'Present the three reference bodies in confirmed partner space.',
      'Publish suppliers contacted, processes learned, quotes received, and failures encountered.',
      'Choose fiscal sponsorship, cooperative, studio partnership, continuation as a project, or stop.',
    ],
  },
] as const;

export const CREATURE_COMMONS_SUPPLY_LADDER = [
  {
    layer: 'Electronics + PCBA',
    organization: 'ACME PCB Assembly',
    location: 'Carson · south of LAX',
    capability: 'One-piece prototype through 20,000-unit PCBA production; electronics R&D and board design listed.',
    sourceId: 'acme',
  },
  {
    layer: 'Soft-goods development',
    organization: 'Studio EMSHI',
    location: 'Downtown Los Angeles',
    capability: 'Materials, construction, sampling, tech packs, prototype direction, and manufacturing readiness.',
    sourceId: 'emshi',
  },
  {
    layer: 'Technical sewing',
    organization: 'Sewing Incubator',
    location: 'Huntington Park',
    capability: 'Pattern making, fabric sourcing, production-ready samples, specialty soft goods, and manufacturing.',
    sourceId: 'sewing-incubator',
  },
  {
    layer: 'Enclosures + tooling',
    organization: 'Precision Molded Plastics',
    location: 'Upland',
    capability: 'DFM, prototype and production tooling, insert molding, overmolding, testing, and part sampling.',
    sourceId: 'precision',
  },
  {
    layer: 'Supplier discovery',
    organization: 'CMTC · Made in California',
    location: 'Long Beach',
    capability: 'California manufacturing directory and supplier-visibility network.',
    sourceId: 'cmtc',
  },
] as const;

export const CREATURE_COMMONS_GATES = [
  {
    name: 'Safety before children',
    rule:
      'No children’s product or study in the pilot. If the audience changes, identify the applicable toy standard, testing, certification, labeling, and privacy requirements first.',
    sourceIds: ['cpsc', 'coppa'],
  },
  {
    name: 'Authorization before sale',
    rule:
      'No marketed radio-frequency product without an identified FCC equipment-authorization path and a named responsible party.',
    sourceIds: ['fcc'],
  },
  {
    name: 'Program before entity',
    rule:
      'No incorporation claim or charitable fundraising until the pilot proves a public program, governance need, receiving structure, and ongoing reporting capacity.',
    sourceIds: ['community-partners', 'ca-charities', 'ca-coop'],
  },
] as const;

export const CREATURE_COMMONS_COMPANIONS = [
  'Build the First Hundred Close to Home',
  'Repair Night Is Better Than Beta Night',
  'The Memory Library',
  'Adoption Day, Not Demo Day',
  'The Graveyard Is a Civic Service',
] as const;

export const sourceForCommons = (id: string) =>
  CREATURE_COMMONS_SOURCES.find((source) => source.id === id);
