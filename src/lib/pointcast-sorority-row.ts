export type RowPlate = {
  id: string;
  number: string;
  name: string;
  moment: string;
  image: string;
  alt: string;
  caption: string;
  designRead: string;
  midjourneyJobId: string;
  midjourneyIndex: number;
  model: string;
  promptSummary: string;
};

export type RowSource = {
  id: string;
  label: string;
  publisher: string;
  date: string;
  url: string;
  supports: readonly string[];
};

export const ROW_BY_ROW = {
  spec: 'pointcast.college-football.sorority-row/v1',
  title: 'ROW / ROW',
  subtitle: 'Sorority Row, college football, and the social architecture of 2030.',
  kicker: 'PointCast College Football · House Desk 002',
  issue: '001',
  issueName: "TALKIN' SEASON",
  publishedAt: '2026-07-28T12:08:00-07:00',
  canonical: 'https://pointcast.xyz/25/magazine/sorority-row',
  machineEdition: 'https://pointcast.xyz/25/magazine/sorority-row.json',
  magazine: 'https://pointcast.xyz/25/magazine',
  previousFeature: 'https://pointcast.xyz/25/magazine/the-house-we-borrowed',
  block: '0534',
  readingTime: '16 min',
  thesis:
    'A Greek house is never only a house. It is a recruitment machine, an alumni archive, a dining system, a game-day gate, and a public statement about who the campus expects to be visible.',
  deck:
    'The SEC and Big Ten do not simply stage different football. Their fraternity and sorority districts organize climate, memory, status, movement, and belonging differently. PointCast puts the rows on an architect’s table, then asks what deserves to survive to 2030.',
  sampleBoundary:
    'The SEC–Big Ten comparison is a PointCast design reading built from selected official school snapshots, not a conference census or a ranking of students, chapters, or institutions.',
  viewModes: [
    {
      id: 'street',
      label: 'Street',
      note: 'Read frontage, procession, shade, winter shelter, and the message a building sends before anyone enters.',
    },
    {
      id: 'section',
      label: 'Section',
      note: 'Cut through the formal room. Find the kitchen, quiet floor, ritual room, laundry, accessibility route, and invisible labor.',
    },
    {
      id: 'system',
      label: 'System',
      note: 'Zoom out to capital, councils, insurance, alumni governance, public accountability, and the walk to the stadium.',
    },
  ],
  plates: [
    {
      id: 'southern-row',
      number: '01',
      name: 'THE SOUTHERN ROW',
      moment: 'SEC lens / first light',
      image: '/images/pointcast-sorority-row/southern-row.webp',
      alt: 'Imagined warm-climate sorority row with deep porches, large shade trees, bicycles, and open front rooms at dawn',
      caption:
        'In the warm-weather model, the porch is facade, theater, climate device, queue, and social border at once.',
      designRead:
        'The design question is not whether the porch looks welcoming. It is whether the invitation survives the price sheet, the recruitment system, and the front step.',
      midjourneyJobId: '2859cf9d-f0bf-4a92-8ab6-3c03c9900bb2',
      midjourneyIndex: 3,
      model: 'Midjourney V8.1',
      promptSummary: 'Warm-climate sorority row at dawn; porch-to-sidewalk hospitality; red clay and limestone.',
    },
    {
      id: 'northern-row',
      number: '02',
      name: 'THE NORTHERN ROW',
      moment: 'Big Ten lens / snow day',
      image: '/images/pointcast-sorority-row/northern-row.webp',
      alt: 'Imagined cold-climate fraternity and sorority district with brick houses, snow, lit vestibules, and a connected pedestrian route',
      caption:
        'In the cold-weather model, the social threshold moves inside: mudroom, radiator, kitchen, stair, corridor.',
      designRead:
        'Winter makes maintenance legible. A cleared path, repaired vestibule, working boiler, and warm place to wait become social promises rather than background operations.',
      midjourneyJobId: 'bab636f1-13ee-4921-b0bf-4614e207bf9a',
      midjourneyIndex: 2,
      model: 'Midjourney V8.1',
      promptSummary: 'Connected northern Greek district after snow; storm vestibules, mudrooms, and shared study space.',
    },
    {
      id: 'architect-cut',
      number: '03',
      name: 'THE ARCHITECT’S CUT',
      moment: 'House anatomy / 2030',
      image: '/images/pointcast-sorority-row/architect-cut.webp',
      alt: 'Exploded architectural cutaway of an imagined cross-council house and public commons',
      caption:
        'A plan reveals the hierarchy the facade can hide. The largest room tells you what the institution values.',
      designRead:
        'PointCast gives the best room a public use, the ritual room privacy without supremacy, the kitchen a service door, and every floor an equivalent path.',
      midjourneyJobId: 'a3f88f83-6b07-41c2-bc1c-2e633fb65aef',
      midjourneyIndex: 3,
      model: 'Midjourney V8.1',
      promptSummary: 'Exploded axonometric of a cross-council house with public kitchen, study floor, courtyard, and lift.',
    },
    {
      id: 'threshold',
      number: '04',
      name: 'THE THRESHOLD',
      moment: 'Open house / ordinary clothes',
      image: '/images/pointcast-sorority-row/threshold.webp',
      alt: 'Imagined accessible sorority-house entrance where a ramp and broad steps meet at the same open door',
      caption:
        'The most consequential room may be the six feet where sidewalk becomes membership.',
      designRead:
        'A useful threshold makes cost, time, accessibility, housing obligations, conduct status, and the route to say no visible before belonging becomes leverage.',
      midjourneyJobId: 'c95cecc5-ee3a-4085-8a32-c54674fb4a5e',
      midjourneyIndex: 2,
      model: 'Midjourney V8.1',
      promptSummary: 'Accessible shared front door during an ordinary open house; legible arrival without recruitment spectacle.',
    },
    {
      id: 'saturday-south',
      number: '05',
      name: 'SATURDAY SOUTH',
      moment: 'Porch → stadium',
      image: '/images/pointcast-sorority-row/saturday-south.webp',
      alt: 'Imagined warm-weather game-day procession moving from shaded porches toward distant stadium light',
      caption:
        'The Southern advantage is choreographic: a long outdoor season lets private houses become a temporary public street.',
      designRead:
        'The 2030 version adds water, shade, neighbors, bicycles, sober mobility, and a public invitation without making safety feel like a penalty box.',
      midjourneyJobId: '151cdde5-5af3-458e-8989-7af585433518',
      midjourneyIndex: 2,
      model: 'Midjourney V8.1',
      promptSummary: 'Porch-to-stadium civic procession with cooling, water, bicycles, and ride-home support.',
    },
    {
      id: 'saturday-north',
      number: '06',
      name: 'SATURDAY NORTH',
      moment: 'Kitchen → vestibule → bowl',
      image: '/images/pointcast-sorority-row/saturday-north.webp',
      alt: 'Imagined cold-weather game-day route from a communal kitchen through a heated vestibule to a snowy stadium walk',
      caption:
        'The Northern advantage is connective tissue: warm interior, hard threshold, short exterior, then another room.',
      designRead:
        'The 2030 version treats coat repair, hot water, transit, cleared curb cuts, and a place to recover as part of the event architecture.',
      midjourneyJobId: '8a20cd77-ec17-4026-9d65-8c38ca4bbd9e',
      midjourneyIndex: 0,
      model: 'Midjourney V8.1',
      promptSummary: 'Cold-weather game-day sequence with kitchen, heated vestibule, winter transit, and accessible path.',
    },
    {
      id: 'missing-house',
      number: '07',
      name: 'THE MISSING HOUSE',
      moment: 'Capital / visibility / council parity',
      image: '/images/pointcast-sorority-row/missing-house.webp',
      alt: 'Imagined open pavilion for historically Black and multicultural Greek-letter councils near a traditional house district',
      caption:
        'When some councils receive monumental houses and others receive a meeting-room reservation, the campus has already drawn a hierarchy.',
      designRead:
        'Parity does not require copying the mansion. It requires durable, culturally specific space for archive, rehearsal, service, alumni, intake, quiet conversation, and public presence.',
      midjourneyJobId: '332acac8-1bc5-4431-8a95-1454a3ab4b9f',
      midjourneyIndex: 0,
      model: 'Midjourney V8.1',
      promptSummary: 'Open pavilion for Black and multicultural councils; rehearsal, archive, service, and alumni space.',
    },
    {
      id: 'row-2030',
      number: '08',
      name: 'ROW 2030',
      moment: 'Keep the porches / change the contract',
      image: '/images/pointcast-sorority-row/row-2030.webp',
      alt: 'Imagined former Greek row remade as distinct houses around a shared public commons at blue hour',
      caption:
        'The future is not one universal house. It is a federation of distinct homes sharing the things that should never have been scarce.',
      designRead:
        'Keep ritual, memory, intimacy, and difference. Share capital access, late-night mobility, repair, climate shelter, public rooms, reporting, and the obligation to leave the street better.',
      midjourneyJobId: '7046e42f-eda1-4d2e-b845-3ade542a38e0',
      midjourneyIndex: 3,
      model: 'Midjourney V8.1',
      promptSummary: 'A network of distinct houses around a shared 2030 commons, repair shop, kitchen, rain gardens, and transit.',
    },
  ] as readonly RowPlate[],
  showdown: {
    title: 'SEC / BIG TEN — THE ROW SHOWDOWN',
    note: 'An editorial architecture matchup. No conference-wide winner is claimed.',
    sec: {
      code: 'SEC',
      climate: 'Long outdoor season',
      socialUnit: 'Porch + lawn + procession',
      inheritedStrength:
        'The row can behave like a linear public room. Alumni capital and recruitment scale make ambitious houses possible.',
      pressurePoint:
        'Monumentality can turn welcome into intimidation. Heat, entry cost, social sorting, and unequal council visibility sit behind the photogenic facade.',
      move2030:
        'Open the frontage: shade, water, public calendars, disclosed costs, equivalent accessible routes, and a conference capital pool for underhoused councils.',
    },
    bigTen: {
      code: 'B1G',
      climate: 'Interior season',
      socialUnit: 'Vestibule + corridor + district',
      inheritedStrength:
        'Dense campus neighborhoods and year-round communal interiors can make the row feel like an urban network rather than a parade of objects.',
      pressurePoint:
        'Aging stock, winter access, deferred maintenance, fragmented oversight, and stark housing gaps between councils become system failures.',
      move2030:
        'Connect the rooms: winter commons, shared repair, safe transit, accessible routes, and durable cultural space without forcing every organization into the same house type.',
    },
    rounds: [
      {
        category: 'Climate intelligence',
        sec: 'Deep porch, shade tree, cross-ventilation',
        bigTen: 'Mudroom, thermal threshold, warm waiting room',
        call: 'DRAW',
      },
      {
        category: 'Saturday movement',
        sec: 'The street gathers before the gate',
        bigTen: 'The house network stages the walk',
        call: 'SEC',
      },
      {
        category: 'All-season commons',
        sec: 'Outdoor room dominates',
        bigTen: 'Interior sequence does more work',
        call: 'B1G',
      },
      {
        category: 'Capital parity',
        sec: 'Incomplete',
        bigTen: 'Incomplete',
        call: 'NO WINNER',
      },
      {
        category: '2030 brief',
        sec: 'Make the porch public infrastructure',
        bigTen: 'Make the district a connected commons',
        call: 'BUILD BOTH',
      },
    ],
  },
  campusSnapshots: [
    {
      school: 'Alabama',
      conference: 'SEC',
      asOf: 'Fall 2025',
      figure: '13,047',
      label: 'preliminary members',
      detail: '40% of main-campus undergraduates · 70 organizations · four councils',
      sourceId: 'alabama-current',
    },
    {
      school: 'Georgia',
      conference: 'SEC',
      asOf: 'FY 2025',
      figure: '9,481',
      label: 'Greek-community members',
      detail: '88,000+ service hours · $1.264M contributed to philanthropy',
      sourceId: 'georgia-2025',
    },
    {
      school: 'Michigan',
      conference: 'B1G',
      asOf: 'Winter 2026',
      figure: '6,221',
      label: 'members',
      detail: '58 chapters · 18.33% of undergraduates',
      sourceId: 'michigan-stats',
    },
    {
      school: 'Illinois',
      conference: 'B1G',
      asOf: '2024',
      figure: '≈23%',
      label: 'of undergraduates',
      detail: 'Approximately 90 fraternity and sorority chapters',
      sourceId: 'illinois-accreditation',
    },
    {
      school: 'Ohio State',
      conference: 'B1G',
      asOf: 'Spring 2024',
      figure: '4,208',
      label: 'active members',
      detail: '18,359 service hours · $260,086 in philanthropy reported on the scorecard',
      sourceId: 'ohio-state-scorecard',
    },
    {
      school: 'Penn State',
      conference: 'B1G',
      asOf: '2024–25',
      figure: 'REVIEW',
      label: 'system under redesign',
      detail: 'External program review followed by stronger advisor and transparency requirements',
      sourceId: 'penn-state-review',
    },
  ],
  housingGap: {
    school: 'University of Michigan',
    asOf: 'Winter 2026',
    figures: [
      { council: 'Interfraternity Council', houses: 17 },
      { council: 'Panhellenic Association', houses: 16 },
      { council: 'Multicultural Greek Council', houses: 0 },
      { council: 'National Pan-Hellenic Council', houses: 0 },
    ],
    read:
      'This is one campus snapshot, not a national ratio. It is still an architectural fact with cultural consequences: some forms of belonging receive addresses, kitchens, archives, and visible permanence; others do not.',
    sourceId: 'michigan-stats',
  },
  nationalScale: [
    {
      name: 'National Panhellenic Conference',
      short: 'NPC',
      figure: '375,592',
      label: 'undergraduate members',
      detail: '26 women’s-only member organizations · 2024–25 survey',
      sourceId: 'npc-fast-facts',
    },
    {
      name: 'North American Interfraternity Conference',
      short: 'NIC',
      figure: '6,000+',
      label: 'chapters',
      detail: '50+ men’s inter/national fraternities · roughly 600 campuses',
      sourceId: 'nic-overview',
    },
    {
      name: 'National Pan-Hellenic Council',
      short: 'NPHC',
      figure: '9',
      label: 'historic organizations',
      detail: 'The Divine Nine · council founded at Howard University in 1930',
      sourceId: 'nphc-about',
    },
    {
      name: 'Local organizations',
      short: 'LOCAL',
      figure: '1',
      label: 'campus-specific identity',
      detail: 'One chapter, no same-name national chapter network',
      sourceId: 'drexel-local-national',
    },
  ],
  organizationModels: [
    {
      id: 'national',
      label: 'Inter/national',
      promise: 'Network scale without losing the chapter.',
      assets: [
        'Shared standards, staff, education, and insurance infrastructure',
        'Portable alumni identity and a much larger mentoring network',
        'Housing corporations and repeatable operational knowledge',
      ],
      risks: [
        'Brand and policy can flatten campus specificity',
        'National, council, chapter, and housing fees compound',
        'Formal oversight may still sit far from the daily house',
      ],
    },
    {
      id: 'local',
      label: 'Local',
      promise: 'The place writes the institution.',
      assets: [
        'Singular campus history and greater program autonomy',
        'The chapter can adapt language, calendar, and purpose locally',
        'Potentially lighter bureaucracy and clearer campus accountability',
      ],
      risks: [
        'No automatic inter-campus or national support network',
        'Insurance, training, succession, and crisis response may be harder',
        'A small alumni base can make one building problem existential',
      ],
    },
    {
      id: 'federated',
      label: 'Federated 2030',
      promise: 'Local face. Shared back office. Public proof.',
      assets: [
        'Chapters retain distinct history, ritual, and local program',
        'A cooperative layer shares insurance, training, procurement, and incident reporting',
        'Capital and professional support can reach small and underhoused councils',
      ],
      risks: [
        'Requires real power-sharing, not a new umbrella logo',
        'Cultural governance must remain with the organizations it serves',
        'Common standards need appeal, audit, and anti-capture rules',
      ],
    },
  ],
  timeline: [
    {
      year: '1776',
      title: 'THE GREEK-LETTER KEY',
      body: 'Phi Beta Kappa begins as a secret debating society at William & Mary. It becomes an honor society, not the modern social-fraternity template, but establishes letters, initiation, motto, badge, and secrecy as a durable collegiate language.',
      sourceId: 'pbk-history',
    },
    {
      year: '1825',
      title: 'THE SOCIAL HOUSE TAKES FORM',
      body: 'Kappa Alpha Society begins at Union College. Union describes it as the oldest continuously active secret Greek-letter social fraternity in the United States.',
      sourceId: 'union-kappa-alpha',
    },
    {
      year: '1851',
      title: 'A SOCIETY FOR COLLEGE WOMEN',
      body: 'The Adelphean Society, now Alpha Delta Pi, is founded at Wesleyan College in Macon. Its origin story joins friendship to women’s educational advancement.',
      sourceId: 'adpi-history',
    },
    {
      year: '1870',
      title: 'FULL MEMBERSHIP, NOT A BADGE ON LOAN',
      body: 'Kappa Alpha Theta is founded at Indiana Asbury as the first Greek-letter fraternity for women, after Bettie Locke declined symbolic affiliation without full membership.',
      sourceId: 'theta-history',
    },
    {
      year: '1874',
      title: 'SORORITY ENTERS THE VOCABULARY',
      body: 'Gamma Phi Beta is founded at Syracuse. The organization records that it was the first women’s organization to be called a sorority.',
      sourceId: 'gamma-phi-beta-history',
    },
    {
      year: '1930',
      title: 'UNITY AGAINST EXCLUSION',
      body: 'The National Pan-Hellenic Council is founded at Howard University. The Divine Nine grows from Black collegiate life under racial exclusion and centers scholarship, service, advocacy, culture, and lifelong membership.',
      sourceId: 'nphc-about',
    },
    {
      year: '2024',
      title: 'HAZING ENTERS THE FEDERAL REPORT',
      body: 'The Stop Campus Hazing Act becomes law. Covered institutions must report hazing incidents and publish policy, prevention, and investigation information through the campus-safety framework.',
      sourceId: 'stop-campus-hazing',
    },
    {
      year: '2030',
      title: 'THE HOUSE HAS TO EXPLAIN ITSELF',
      body: 'PointCast proposal: every tradition keeps only the authority it can pair with safety, access, usefulness, financial legibility, cultural respect, and evidence.',
      sourceId: 'pointcast',
    },
  ],
  playbooks: [
    {
      number: '01',
      name: 'THE OPEN LEDGER',
      horizon: 'Deploy now → 2027',
      wager: 'Belonging should never require a blind financial or safety commitment.',
      moves: [
        'One comparable public sheet for dues, initiation fees, housing obligations, live-in rules, fines, average weekly time, accessibility, and available aid.',
        'One chapter-status record linking recognition, recent conduct outcomes, advisors, property operator, and current insurance—not a reputation spreadsheet.',
        'A two-step commitment: private questions and cost review happen before any binding membership decision.',
        'A twice-yearly campus hazing transparency rhythm becomes the floor; chapters publish what they changed, not only what was charged.',
      ],
      measure: 'A prospective member can understand the full contract in ten minutes without knowing an insider.',
    },
    {
      number: '02',
      name: 'THE COMMONS COMPACT',
      horizon: 'Pilot 2027 → scale 2029',
      wager: 'The best square footage on the row should do some work for people beyond the chapter.',
      moves: [
        'Each housed chapter assigns a public-use percentage to study, service, cooling or warming, rehearsal, mutual aid, and game-day mobility.',
        'The campus and alumni fund a capital-parity pool for NPHC, multicultural, local, and small chapters that lack durable space.',
        'No forced mansion template: each council defines culturally appropriate archive, ritual, rehearsal, intake, alumni, and service needs.',
        'SEC campuses compete on shade, water, and porch hospitality; Big Ten campuses compete on winter paths, warming rooms, and connected interiors.',
      ],
      measure: 'Space access by council improves without erasing organizational difference.',
    },
    {
      number: '03',
      name: 'THE LOCAL FACE / NATIONAL BACK OFFICE',
      horizon: 'Design 2027 → federation 2030',
      wager: 'Local identity and professional risk infrastructure do not have to be opponents.',
      moves: [
        'A voluntary cooperative offers insurance purchasing, training, legal templates, property audits, procurement, crisis support, and secure incident reporting.',
        'Local organizations keep their name, ritual, membership rules, alumni governance, calendar, and campus-specific program.',
        'National chapters can opt into the same campus utility layer without surrendering headquarters relationships.',
        'Annual audits test safety, accessibility, financial clarity, maintenance reserves, and member voice—not aesthetic conformity.',
      ],
      measure: 'No chapter stays unsafe merely because it is small, and no chapter loses its history merely because it needs infrastructure.',
    },
  ],
  principles2030: [
    'A house may be private without being opaque.',
    'Tradition is evidence to examine, not permission to stop examining.',
    'No council should be architecturally invisible.',
    'The safest route home belongs in the game-day plan.',
    'A ritual can remain secret; its safety contract cannot.',
    'The porch, mudroom, kitchen, and sidewalk are all governance.',
  ],
  credits: {
    conceptAndEditorialDirection: 'Michael Hoydich',
    researchWritingDesignAndImplementation: 'Michael Hoydich with Codex / OpenAI',
    imageDirection: 'Michael Hoydich with Codex / OpenAI',
    imageGeneration: 'Midjourney V8.1',
    imageCount: 8,
  },
  boundary:
    'Independent PointCast editorial research and speculative design. It is not affiliated with or endorsed by any college, conference, fraternity, sorority, council, athletic program, or governing body. School figures are dated snapshots from linked official sources and should not be compared as a single normalized dataset. Images are imagined editorial scenes, not documentary photographs of real people, chapters, campuses, or houses.',
  traditionBoundary:
    'PointCast discusses public history and publicly described traditions. It does not reproduce private ritual, protected calls, step or stroll choreography, insignia, or chapter-specific membership material.',
} as const;

export const ROW_BY_ROW_SOURCES: readonly RowSource[] = [
  {
    id: 'alabama-current',
    label: 'Office of Fraternity & Sorority Life',
    publisher: 'University of Alabama',
    date: 'Fall 2025 / accessed July 28, 2026',
    url: 'https://ofsl.sl.ua.edu/',
    supports: ['13,047 preliminary members', '40% of main-campus undergraduates', '70 organizations'],
  },
  {
    id: 'alabama-impact',
    label: 'Student Life Annual Impact Report 2024–25',
    publisher: 'University of Alabama',
    date: '2025',
    url: 'https://stories.ua.edu/SLImpact25/index.html',
    supports: ['Four councils', 'Nearly 50 on-campus housing facilities', 'Service and philanthropy figures'],
  },
  {
    id: 'georgia-2025',
    label: '2025 Greek Life Report',
    publisher: 'University of Georgia Student Affairs',
    date: 'FY 2025',
    url: 'https://studentaffairsupdate.uga.edu/2025-greek-life/',
    supports: ['9,481 members', '88,000+ service hours', '$1,264,553 in philanthropic contributions'],
  },
  {
    id: 'michigan-stats',
    label: 'Fraternity and Sorority Community Statistics',
    publisher: 'University of Michigan',
    date: 'Winter 2026',
    url: 'https://fsl.umich.edu/article/community-statistics',
    supports: ['6,221 members', '58 chapters', 'Housing-facility count by council'],
  },
  {
    id: 'illinois-accreditation',
    label: '2024 Accreditation Assurance Argument',
    publisher: 'University of Illinois Urbana-Champaign',
    date: '2024',
    url: 'https://reaccreditation.illinois.edu/files/2024/03/accreditationAssuranceArgument2024.pdf',
    supports: ['Approximately 23% of undergraduates', '90 fraternity and sorority chapters'],
  },
  {
    id: 'illinois-compliance',
    label: 'Spring 2024 Chapter Compliance',
    publisher: 'University of Illinois Fraternity & Sorority Affairs',
    date: 'Spring 2024',
    url: 'https://fsaffairs.illinois.edu/information/compliance/2024/spring',
    supports: ['Advisor, fire-safety, consent, hazing-prevention, and new-member-rights requirements'],
  },
  {
    id: 'ohio-state-scorecard',
    label: 'Spring 2024 Sorority and Fraternity Life Scorecard',
    publisher: 'The Ohio State University',
    date: 'Spring 2024',
    url: 'https://sfl.osu.edu/posts/documents/nphc-scorecard-sp24.pdf',
    supports: ['4,208 active members', '18,359 service hours', '$260,086 philanthropy'],
  },
  {
    id: 'penn-state-review',
    label: 'Fraternity and Sorority Life Program Review',
    publisher: 'Penn State Student Affairs',
    date: '2024–25',
    url: 'https://studentaffairs.psu.edu/student-life/fraternity-sorority-life/resources/program-review',
    supports: ['External review', 'Advisor and transparency action steps'],
  },
  {
    id: 'npc-fast-facts',
    label: 'NPC Fast Facts: 2024–25 Annual Survey',
    publisher: 'National Panhellenic Conference',
    date: '2024–25',
    url: 'https://npcwomen.org/news/npc-fast-facts/',
    supports: ['26 member organizations', '375,592 undergraduate members', '6,016,248 initiated women'],
  },
  {
    id: 'npc-barriers',
    label: 'Removing Barriers to Joining',
    publisher: 'National Panhellenic Conference',
    date: '2025',
    url: 'https://npcwomen.org/wp-content/uploads/2025/06/Removing-Barriers-to-Joining.pdf',
    supports: ['Cost as a top deterrent', 'Financial transparency', 'Accessibility and time commitments'],
  },
  {
    id: 'nic-overview',
    label: 'Back to School 2025: NIC Overview',
    publisher: 'North American Interfraternity Conference',
    date: '2025',
    url: 'https://nicfraternity.org/wp-content/uploads/2025/08/Back-to-School-2025.pdf',
    supports: ['50+ member fraternities', '6,000+ chapters', 'Approximately 600 campuses'],
  },
  {
    id: 'nphc-about',
    label: 'About the National Pan-Hellenic Council',
    publisher: 'National Pan-Hellenic Council',
    date: 'Accessed July 28, 2026',
    url: 'https://www.nphchq.com/about-us/',
    supports: ['Nine organizations', 'Founded at Howard University in 1930', 'Service, scholarship, advocacy, cultural heritage'],
  },
  {
    id: 'drexel-local-national',
    label: 'Local and National Organization FAQ',
    publisher: 'Drexel University',
    date: 'Accessed July 28, 2026',
    url: 'https://drexel.edu/studentlife/activities-involvement/fraternity-sorority-life/prospective-members/faq',
    supports: ['Local-versus-national structural definition'],
  },
  {
    id: 'pbk-history',
    label: 'History of Phi Beta Kappa',
    publisher: 'Phi Beta Kappa Society',
    date: 'Accessed July 28, 2026',
    url: 'https://www.pbk.org/about/history',
    supports: ['1776 founding', 'Greek-letter, badge, oath, initiation, and debating-society origins'],
  },
  {
    id: 'union-kappa-alpha',
    label: 'Kappa Alpha Society Bicentennial',
    publisher: 'Union College',
    date: 'September 15, 2025',
    url: 'https://www.union.edu/news/stories/202509/kappa-alpha-society-one-nations-oldest-fraternities-set-celebrate-200-years',
    supports: ['1825 founding', 'Oldest continuously active secret Greek-letter social fraternity'],
  },
  {
    id: 'adpi-history',
    label: 'Alpha Delta Pi History',
    publisher: 'Alpha Delta Pi',
    date: 'Accessed July 28, 2026',
    url: 'https://www.alphadeltapi.org/aboutus/history/',
    supports: ['1851 founding at Wesleyan College', 'Adelphean Society origin'],
  },
  {
    id: 'theta-history',
    label: 'Theta Roots',
    publisher: 'Kappa Alpha Theta',
    date: 'Accessed July 28, 2026',
    url: 'https://www.kappaalphatheta.org/about-us/theta-roots-2',
    supports: ['1870 founding', 'First Greek-letter fraternity for women'],
  },
  {
    id: 'gamma-phi-beta-history',
    label: 'Gamma Phi Beta History',
    publisher: 'Gamma Phi Beta',
    date: 'Accessed July 28, 2026',
    url: 'https://www.gammaphibeta.org/About-Us/History',
    supports: ['1874 founding', 'First women’s organization described with the term sorority'],
  },
  {
    id: 'stop-campus-hazing',
    label: 'Stop Campus Hazing Act, Public Law 118-173',
    publisher: 'Congress.gov / Congressional Research Service',
    date: 'December 23, 2024',
    url: 'https://www.congress.gov/bill/118th-congress/house-bill/5646',
    supports: ['Federal hazing reporting', 'Policy, investigation, and prevention disclosures'],
  },
  {
    id: 'pointcast',
    label: 'PointCast editorial proposal',
    publisher: 'PointCast',
    date: 'July 28, 2026',
    url: 'https://pointcast.xyz/25/magazine/sorority-row',
    supports: ['2030 design proposals and editorial matchup'],
  },
] as const;
