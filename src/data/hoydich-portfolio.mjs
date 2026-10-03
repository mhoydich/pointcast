/** Public editorial snapshot. Update deliberately after a release is verified. */
export const SNAPSHOT = {
  title: 'Hoydich / A map of the making',
  route: '/hoydich/',
  capturedAt: '2026-10-03T22:14:54Z',
  dateLabel: '03 October 2026',
  sourceRevision: 'a154574feb4fda082df8e126c9639e1f82bca492',
  note: 'An edited snapshot of public creative work and current studio plans. Updated by hand after releases; no live project sync.',
};

export const FAMILIES = [
  { id: 'all', label: 'All work' },
  { id: 'design', label: 'Design & objects' },
  { id: 'reading', label: 'Reading rooms' },
  { id: 'art', label: 'Art & image' },
  { id: 'play', label: 'Play & sound' },
  { id: 'place', label: 'Place & fieldwork' },
  { id: 'tools', label: 'Tools & systems' },
];

export const PROJECTS = [
  {
    id: 'fila', family: 'design', title: 'FILA', subtitle: 'From thread to the coast.',
    number: '01', color: '#ad392e', image: '/images/fila/court-material-study.webp',
    imageAlt: 'Original interpretive art of ivory knit forms and a red tennis-court material study.',
    imageNote: 'Original AI-generated interpretive artwork. Independent study.',
    description: 'An independent brand exhibition, a twelve-look 2027 concept collection and nine new Ocean, Works and Court concepts in El Segundo edition two.',
    kind: 'Independent design study', href: '/fila/', action: 'Enter the exhibition',
    links: [{ label: 'El Segundo / edition two', href: '/fila/el-segundo/', summary: 'Nine independent Ocean, Works and Court concepts, with an afternoon edit and original image credits.' }, { label: '2027 concept lookbook', href: '/fila/2027/', summary: 'Twelve imagined Court, Club and Coast looks, with front, back and detail studies.' }],
    milestones: ['Sourced brand exhibition published', '12 concept looks with front, back and detail views', 'El Segundo edition two: nine coastal concepts published'],
    boundary: 'No FILA affiliation. Imagined garments, not physical samples or available products.',
  },
  {
    id: 'rally', family: 'play', title: 'RALLY', subtitle: 'Leave it all on the court.',
    number: '02', color: '#1554c4', image: '/images/pickleball-home/leave-it-all.webp',
    imageAlt: 'Original RALLY campaign concept with courtside athletic styling in blue and warm sunlight.',
    imageNote: 'Generated campaign concept. Fictional setting and apparel.',
    description: 'A pickleball front door with adaptive practice plans, sourced South Bay courts and illustrated backhand and doubles guides.',
    kind: 'Play, practice & community', href: '/pickleball/home/', action: 'Open Pickleball Home',
    links: [{ label: 'RALLY sister site', href: 'https://tez-rally.pages.dev/', summary: 'The independent companion site for RALLY.' }, { label: 'Cleaner backhands', href: '/pickleball/articles/cleaner-backhands/', summary: 'Contact, soft replies and three practice rounds you can measure.' }, { label: 'Smarter mixed doubles', href: '/pickleball/articles/smarter-mixed-doubles/', summary: 'Shared coverage, the seam and a deliberate next-ball plan.' }],
    milestones: ['Shared RALLY × PointCast home published', 'Edition two: adaptive practice desk and two illustrated articles published'],
    boundary: 'Court information is dated. Apparel images are concepts; this page is not a shop or booking service.',
  },
  {
    id: 'books', family: 'reading', title: 'The reading shelf', subtitle: 'A book. Another world.',
    number: '03', color: '#176674', image: '/images/siddhartha/river-horizon.webp',
    imageAlt: 'Original cyanotype-inspired river horizon artwork for the Siddhartha reading companion.',
    imageNote: 'Original generated reader artwork, not publisher cover art.',
    description: 'Nine art-rich bookshops and reader companions, with a further company of voices in The Canterbury Tales.',
    kind: 'Literary companions', href: '/books/', action: 'Browse the shelf',
    links: [{ label: 'Siddhartha', href: '/siddhartha/', summary: 'A river-shaped reading companion and edition-aware bookshop.' }, { label: 'Den of Thieves', href: '/books/den-of-thieves/', summary: 'A companion to the book’s financial history, with reading and edition resources.' }, { label: 'Playing for Pizza', href: '/books/playing-for-pizza/', summary: 'A bookshop and reading journey through football, food and Parma.' }, { label: 'The Canterbury Tales', href: '/canterbury/', summary: 'A company of voices, a pilgrimage and a new reading room.' }, {"label": "Barbarians at the Gate", "href": "/books/barbarians-at-the-gate/", "summary": "A reported corporate drama about the contest for RJR Nabisco. Follow the people before the numbers."}, {"label": "New Rules for the New Economy", "href": "/books/new-rules-for-the-new-economy/", "summary": "Kevin Kelly’s 1998 argument about connected systems. Read its proposals in their moment, then test the questions they leave."}, {"label": "Ethan Frome", "href": "/books/ethan-frome/", "summary": "Edith Wharton’s compressed story of desire and constraint. Attend to the weather, the rooms and the distance between telling and knowing."}, {"label": "Treasure Island", "href": "/books/treasure-island/", "summary": "A voyage, a dangerous company and a young narrator learning to judge people. Follow the voices as closely as the map."}, {"label": "The Kite Runner", "href": "/books/the-kite-runner/", "summary": "Khaled Hosseini’s novel of friendship, memory and responsibility across a changing Afghanistan and a life abroad."}, {"label": "Mistborn", "href": "/books/mistborn-the-final-empire/", "summary": "Begin Sanderson’s Mistborn sequence with its first novel: a crew, a dangerous plan and a world whose rules matter."}],
    milestones: ['Nine bookshop companions and The Canterbury Tales published', 'New, used and library discovery links with edition context'],
    boundary: 'Independent companions. Original artwork is not archival evidence. No stock or availability promise.',
  },
  {
    id: 'bukowski', family: 'reading', title: 'The ordinary stays', subtitle: 'An empty room. A little light.',
    number: '04', color: '#956235', image: '/images/bukowski/room.webp',
    imageAlt: 'A fictional empty room with a typewriter, chipped cup and blank paper in amber window light.',
    imageNote: 'Original generated fictional scene. New PointCast tribute writing.',
    description: 'An independent ode to Charles Bukowski, told through four ordinary things, original poems and a sourced reading desk.',
    kind: 'Literary art & original writing', href: '/bukowski/', action: 'Enter the night', links: [],
    milestones: ['Four original tribute poems published', 'Plain-text reading edition available'],
    boundary: 'The tribute poems are new PointCast writing, not Bukowski poems or quotations.',
  },
  {
    id: 'objects', family: 'design', title: 'Object Library', subtitle: 'Borrow an idea.',
    number: '05', color: '#285b49', image: '/images/object-library/family.svg',
    imageAlt: 'Six original object characters: a coral focus dial, yellow lamp, blue companion, green shade, mint signal and pink sleeve.',
    imageNote: 'Original concept illustrations. Six proposed objects.',
    description: 'A small family of useful object ideas and a browser lending rehearsal, shaped around everyday rituals.',
    kind: 'Concept catalog & local demo', href: '/object-library/', action: 'Meet the everyday six', links: [],
    milestones: ['Six illustrated concept objects published', 'Browser demo with local notes, export and clear controls'],
    boundary: 'No physical inventory or operating lending service. Object capabilities are proposed.',
  },
  {
    id: 'weather', family: 'place', title: 'Weather & Living Atlas', subtitle: 'A year within reach.',
    number: '06', color: '#416979', image: '/images/weather-atlas/cover.svg',
    imageAlt: 'Original seasonal illustration for an El Segundo climate and living atlas.',
    imageNote: 'Original illustration. Historical climate context, not current weather.',
    description: 'A 25-mile El Segundo lens on climate, season, terrain and the small choices that make a place feel livable.',
    kind: 'Research & seasonal field guide', href: '/weather-atlas/', action: 'Open the atlas', links: [],
    milestones: ['Four NOAA station normals compared', '1991–2025 observations and reproducible research downloads published'],
    boundary: 'Historical observations and qualitative guidance. No live forecast, street-level measurements or route optimization.',
  },
  {
    id: 'other-worlds', family: 'art', title: 'Other Worlds', subtitle: 'Los Angeles, seen sideways.',
    number: '07', color: '#66427b', image: '/images/other-worlds/observatory-for-another-sun.webp',
    imageAlt: 'An imagined Los Angeles observatory beneath a luminous otherworldly sky.',
    imageNote: 'Original generated metaphysical Los Angeles artwork.',
    description: 'Nine imagined Los Angeles poster worlds: thresholds, reservoirs, orchards and light that belongs to another city.',
    kind: 'Original poster series', href: '/other-worlds/', action: 'Visit the nine worlds', links: [],
    milestones: ['Nine original poster works published', 'Artwork and provenance available on the project page'],
    boundary: 'Invented artistic scenes, not photographs of documented places or events.',
  },
  {
    id: 'keyboard', family: 'play', title: 'Keyboard Bloom', subtitle: 'A key becomes a small world.',
    number: '08', color: '#825e22', image: '/images/home-highlights/keyboard.jpg',
    imageAlt: 'The existing PointCast Keyboard Arcade project artwork.',
    imageNote: 'Existing project artwork from the PointCast homepage.',
    description: 'A collection of small keyboard instruments and playful rooms for making sound, marks and moments.',
    kind: 'Browser instruments', href: '/keyboard/', action: 'Play a little', links: [],
    milestones: ['Keyboard Bloom and its room collection available', 'Dedicated reading and sound experiments linked from the arcade'],
    boundary: 'Browser play. Audio depends on a deliberate interaction and your device settings.',
  },
];

export const STUDIO_ONLY = [
  { id: 'sunday', family: 'play', title: 'One Sunday at the Vanguard', direction: 'A standalone listening world around a historical recording and a map of New York City.', status: 'building', stage: 'Listening site in progress', nextStep: 'Verify the recording history, place references and listening experience.', kind: 'Music & place' },
  { id: 'art-v2', family: 'art', title: 'Coast, Reimagined / Art v2', direction: 'A prepared gallery of fifty source artworks paired with new reinterpretations. Gallery publication remains pending.', status: 'building', stage: 'Gallery publication pending', nextStep: 'Complete gallery visual and source-label review. The separate commerce page is a disabled status preview; no gallery destination is linked here.', kind: 'Art & image' },
  { id: 'puzzles', family: 'design', title: 'Puzzle studio', direction: 'Ten jigsaw concepts, making and buying resources, and UES business and design studies.', status: 'building', stage: 'Prepared edition / publication pending', nextStep: 'Review the concepts, sources and making guidance before publication.', kind: 'Design & learning' },
];

export const RELEASED_STUDIES = [
  {
    "id": "discovery",
    "family": "tools",
    "title": "Discovery / audit dashboard",
    "href": "/discovery/",
    "summary": "A saved public discovery audit, with route findings, source evidence and a dated method.",
    "source": {
      "href": "/discovery/#method",
      "label": "Audit method & evidence"
    }
  },
  {
    "id": "saturday",
    "family": "place",
    "title": "Saturday / El Segundo",
    "href": "/meditate/2026-10-03",
    "summary": "A dated music-and-place meditation for 3 October, with local research, listening context and a quiet timer.",
    "source": {
      "href": "/meditate/2026-10-03.json",
      "label": "Meditation context & sources"
    }
  },
  {
    "id": "dispensary-atlas",
    "family": "place",
    "title": "Dispensary Market Atlas",
    "href": "/dispensary-atlas/",
    "summary": "A sourced 25-mile research atlas, with store records and California and national market context.",
    "source": {
      "href": "/dispensary-atlas/#method",
      "label": "Atlas method & source records"
    }
  },
  {
    "id": "coffee-business",
    "family": "place",
    "title": "Coffee / 25 miles",
    "href": "/ues/coffee/",
    "summary": "Selected cafés, local source notes and classroom operating scenarios in a University of El Segundo field study.",
    "source": {
      "href": "/ues/coffee/#method",
      "label": "Coffee field-study method"
    }
  },
  {
    "id": "real-estate",
    "family": "place",
    "title": "Groundwork / real estate",
    "href": "/real-estate/",
    "summary": "A dated real-estate observatory with a public source ledger and explicitly hypothetical study scenarios.",
    "source": {
      "href": "/real-estate/#sources",
      "label": "Groundwork source ledger"
    }
  },
  {
    "id": "business-signals",
    "family": "tools",
    "title": "Business Feels / rates & FX",
    "href": "/business-feels/",
    "summary": "A dated educational view of rates, foreign exchange and public business indicators, with source notes and scenarios.",
    "source": {
      "href": "/business-feels/#sources",
      "label": "Observation dates & sources"
    }
  },
  {
    "id": "chain",
    "family": "tools",
    "title": "PointCast Chain / recorded dev world",
    "href": "/chain",
    "summary": "A published replay of 422 recorded Rust-chain blocks, with a browser verifier and documented local-network limits.",
    "source": {
      "href": "/chain#status",
      "label": "Dev-chain status & boundaries"
    }
  },
  {
    "id": "prediction-markets",
    "family": "tools",
    "title": "Prediction markets / UES study",
    "href": "/ues/prediction-markets/",
    "summary": "Twelve lessons, synthetic paper labs and dated prediction-market research for classroom exploration.",
    "source": {
      "href": "/ues/prediction-markets/#sources",
      "label": "Curriculum & research sources"
    },
    "links": [
      {
        "href": "/ues/business/",
        "label": "UES business study hub",
        "summary": "The existing hub for the newly published local and business-study casebooks."
      },
      {
        "href": "/ues/",
        "label": "UES classes",
        "summary": "The published University of El Segundo class and study collection."
      }
    ]
  },
  { id: 'buildworks', family: 'design', title: 'El Segundo Buildworks', href: '/buildworks/', summary: 'Six original small-object concepts, sourcing research and a pilot workbook for exploring a possible studio. No ordering or manufactured inventory is offered.', source: { href: '/buildworks/#sources', label: 'Sourcing research & provenance' }, links: [{ href: '/buildworks/pilot-workbook.txt', label: 'Pilot workbook', summary: 'A plain-text workbook for investigating materials, suppliers and a possible first pilot.' }] },
  { id: 'art-v2-commerce', family: 'art', title: 'Art v2 / collection status', href: '/art/v2/commerce/', statusLabel: 'DISABLED PREVIEW / GALLERY PENDING', summary: 'A published collection-status preview. Purchases, minting and listings remain unavailable while the separate gallery is prepared.', source: { href: '/art/v2/commerce.json', label: 'Disabled purchase & mint status' } },
  { id: 'home-share-editions', family: 'art', title: 'PointCast / daily share editions', href: '/#home-share-title', summary: 'Six original share cards for art, music, games and making, with a daily home selection and fixed edition links.', links: [
    { href: '/share/home/2026-10-signal-atlas/', label: 'Signal Atlas', summary: 'An original PointCast share-card edition with its own fixed public link.' },
    { href: '/share/home/2026-10-listening-garden/', label: 'Listening Garden', summary: 'An original music-inspired share-card edition with its own fixed public link.' },
    { href: '/share/home/2026-10-paper-constellation/', label: 'Paper Constellation', summary: 'An original paper-world share-card edition with its own fixed public link.' },
    { href: '/share/home/2026-10-tide-observatory/', label: 'Tide Observatory', summary: 'An original coastal share-card edition with its own fixed public link.' },
    { href: '/share/home/2026-10-making-room/', label: 'Making Room', summary: 'An original making-inspired share-card edition with its own fixed public link.' },
    { href: '/share/home/2026-10-night-arcade/', label: 'Night Arcade', summary: 'An original play-inspired share-card edition with its own fixed public link.' }
  ] }
];

export const ROADMAP = [
  { title: 'Publishing & discovery', lanes: ['PointCast platform & publishing', 'Hoydich Advertising / Brand Studio', 'Community collectibles & editions'], note: 'Rooms, useful interfaces and a public creative archive.' },
  { title: 'Learning & cultural worlds', lanes: ['University El Segundo', 'Internship Program Archive — closed / historical', 'Industry Next / Nouns Studio'], note: 'Study, original creative work and the record of earlier programs.' },
  { title: 'Objects & the place around us', lanes: ['EVERYDAY WORKS / Local Object Factory', 'Hoydich Mobility & Manufacturing Atlas'], note: 'Proposed objects, design fiction and research about making.' },
  { title: 'Play & personal tools', lanes: ['Micro Club / Dojo / Play Factory', 'Good Fortune / Personal Tools', 'Agent product concepts & demos'], note: 'Small instruments, browser experiments and products still being imagined.' },
];

export const NATIVE = [{
  id: 'good-fortune-horizon', family: 'tools', title: 'Good Fortune Horizon',
  subtitle: 'Fortune Terminal / 2027–2028', status: 'delivered-native',
  description: 'A delivered native creative terminal: six original pixel-art families, seeded collectibles, appreciation and enjoyment generators, a searchable cabinet, favorites and text / PNG export.',
  boundary: 'Delivered as a native app. No public browser edition or download is linked from this map.',
}];

export const STUDIO = [
  ...PROJECTS.filter(project => project.next).map(project => ({ ...project.next, id: `${project.id}-next`, family: project.family, currentId: project.id, currentHref: project.href, kind: project.kind })),
  ...STUDIO_ONLY,
];

const PUBLIC_SOURCES = {
  fila: { href: '/fila/#sources', label: 'Sources & image credits' },
  books: { href: '/books.json', label: 'Shelf data & reading resources' },
  rally: { href: '/pickleball/home.json', label: 'Data & sources' },
  bukowski: { href: '/bukowski/#sources', label: 'Sources & reading notes' },
  objects: { href: '/object-library/#product-notebook', label: 'Product notes & provenance' },
  weather: { href: '/weather-atlas/#sources', label: 'Sources & research' },
  'other-worlds': { href: '/collectibles/other-worlds/manifest.json', label: 'Metadata & provenance' },
};

export const LATEST_LINKS = [...PROJECTS.map(project => ({
  id: project.id, title: project.title, href: project.href,
  summary: project.description, links: project.links, ...(PUBLIC_SOURCES[project.id] ? { source: PUBLIC_SOURCES[project.id] } : {}),
})), ...RELEASED_STUDIES.map(project => ({ ...project, links: project.links ?? [] }))];

export const MILESTONES = [
  { date: '03 OCT 2026', isoDate: '2026-10-03', title: 'Small ideas get a workbook.', description: 'Buildworks opened six object concepts, sourcing research and a pilot workbook. The website offers studies, not ordering or manufactured inventory.', href: '/buildworks/', source: 'a154574f' },
  { date: '03 OCT 2026', isoDate: '2026-10-03', title: 'A picture to pass along.', description: 'Six original share-card editions joined the PointCast homepage with fixed edition links.', href: '/#home-share-title', source: 'a154574f' },
  { date: '03 OCT 2026', isoDate: '2026-10-03', title: 'More rooms opened.', description: 'FILA El Segundo edition two, six reading companions and the new public research studies were verified as published pages.', href: '/hoydich/#latest-links', source: '765c912e' },
  { date: '03 OCT 2026', isoDate: '2026-10-03', title: 'A dev world can be replayed.', description: 'PointCast Chain published its recorded browser replay and explicit local-network status.', href: '/chain', source: 'aa286992' },
  { date: '03 OCT 2026', isoDate: '2026-10-03', title: 'The next practice takes shape.', description: 'Pickleball Home’s second edition added adaptive practice planning and illustrated backhand and mixed-doubles articles.', href: '/pickleball/home/', source: '3a290ef5' },
  { date: '03 OCT 2026', isoDate: '2026-10-03', title: 'A company of voices gathers.', description: 'The Canterbury Tales opened as a new reading room on PointCast.', href: '/canterbury/', source: '2a3e3532' },
  { date: '02 OCT 2026', title: 'Three books, three companions.', description: 'Siddhartha, Den of Thieves and Playing for Pizza joined one art-rich reading shelf.', href: '/books/', source: 'f95e945c' },
  { date: '02 OCT 2026', title: 'A brand study opens onto the coast.', description: 'The FILA exhibition and independent 2027 concept lookbook were published together.', href: '/fila/', source: '929ede2b' },
  { date: '02 OCT 2026', title: 'The court gets a front door.', description: 'RALLY × PointCast brought the learning guide, practice and sourced court directory into one home.', href: '/pickleball/home/', source: '49a28c86' },
  { date: '02 OCT 2026', title: 'Objects meet the year outside.', description: 'Object Library and Weather & Living Atlas connected everyday rituals with historical local climate.', href: '/object-library/', source: '551bd6e6' },
];

export function portfolioPayload() {
  return { ...SNAPSHOT, families: FAMILIES, projects: PROJECTS, native: NATIVE, studio: STUDIO, latestLinks: LATEST_LINKS, roadmap: ROADMAP, milestones: MILESTONES, statusDefinitions: { 'delivered-native': 'A native edition has been delivered; this map provides no public download or browser edition.', open: 'A published public page is available; its project may still be a concept or demo.', building: 'Work in progress; unpublished destinations are not linked.', redesign: 'An existing page is public and a revised edition is in progress.' }, comparisons: [], comparisonNote: 'No verified before/after pair is available in this snapshot. Current artwork is not a screenshot of an unpublished redesign.' };
}
