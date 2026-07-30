export type FairMotive =
  | 'touch'
  | 'build'
  | 'coast'
  | 'compete'
  | 'family'
  | 'beauty'
  | 'blue-hour';

export type FairDuration = '15' | '45' | '120';

export const BEACH_COMMONS_V17 = {
  schema: 'https://pointcast.xyz/schemas/field-study/v1',
  id: 'PC-BEACH-COMMONS-V17',
  edition: 17,
  fieldStudy: '017',
  title: 'Ask the Beach',
  subtitle: 'The Commons Science Fair',
  dek: 'Every booth proves one thing in public.',
  url: 'https://pointcast.xyz/beach-commons/v17',
  jsonUrl: 'https://pointcast.xyz/beach-commons/v17.json',
  blockUrl: 'https://pointcast.xyz/b/0546',
  publishedAt: '2026-07-29',
  updatedAt: '2026-07-29T23:45:00-07:00',
  status:
    'An unofficial editorial rehearsal. It announces no event, permit, school program, competition, partnership, registration, vendor activity, experiment, citizen-science project, public data collection, or physical installation.',
  creators: [
    {
      name: 'Michael Hoydich',
      role: 'direction, originating question, and Beach Commons series',
    },
    {
      name: 'Codex / OpenAI',
      role: 'research, fair system, writing, visual direction, image generation, interaction design, and implementation',
    },
  ],
} as const;

export const POPULARITY_ENGINE = [
  {
    number: '01',
    title: 'You understand it from the path',
    summary:
      'Seven colored avenues, one curiosity gate, and apparatus with visible motion give a passerby a reason to change plans before reading a word.',
    proof: 'A clear silhouette from fifty feet.',
  },
  {
    number: '02',
    title: 'Your hands enter in ninety seconds',
    summary:
      'Every booth offers one safe adjustment, comparison, observation, or vote. The first useful action arrives before the first lecture.',
    proof: 'One visitor move, no assigned role.',
  },
  {
    number: '03',
    title: 'Something changes because you came',
    summary:
      'A token, measurement, pattern, or observation joins the public result rail. Contribution is visible without requiring an account or identity.',
    proof: 'A live result that accumulates.',
  },
  {
    number: '04',
    title: 'The questions belong to the place',
    summary:
      'Shade, wind, materials, sound, observation, pack-down, and small closed wave models connect wonder to real coastal comfort and literacy.',
    proof: 'One useful local takeaway.',
  },
  {
    number: '05',
    title: 'There are many ways to be excellent',
    summary:
      'Rigorous judging can coexist with Best Failure, Most Borrowable, Best Explanation, Smallest Big Effect, and Audience Keeps.',
    proof: 'Recognition wider than one podium.',
  },
  {
    number: '06',
    title: 'Adults and children need each other',
    summary:
      'Low and standing surfaces, quiet rests, tactile controls, close looking, and short explanations create real intergenerational routes.',
    proof: 'No children’s annex; no expert annex.',
  },
  {
    number: '07',
    title: 'The day has an ending worth staying for',
    summary:
      'At blue hour the avenues converge, results become theater, failures receive applause, and the clean return becomes the last experiment.',
    proof: 'An ending, not attrition.',
  },
  {
    number: '08',
    title: 'Next season can disagree',
    summary:
      'A one-page public proof records what was tested, what changed, what failed, what remains unknown, and what another place could challenge.',
    proof: 'Memory with room for revision.',
  },
] as const;

export const BOOTH_RECIPE = [
  {
    step: 'Question',
    instruction: 'Ask one sentence that a visitor can test here.',
    example: 'Which shade shape stays coolest?',
  },
  {
    step: 'Hook',
    instruction: 'Make the phenomenon visible before explanation.',
    example: 'A moving shadow, vibrating plate, ripple, collapse, or dial.',
  },
  {
    step: 'Move',
    instruction: 'Give each visitor one safe variable to change.',
    example: 'Turn, compare, listen, observe, place, or vote.',
  },
  {
    step: 'Measure',
    instruction: 'Let evidence accumulate in public.',
    example: 'A dial, sequence, token rail, paper pattern, or repeat count.',
  },
  {
    step: 'Use',
    instruction: 'End with what the result could change locally.',
    example: 'A cooler seat, calmer model, quieter room, or better pack-down.',
  },
] as const;

export const FAIR_AVENUES = [
  {
    id: 'sun',
    number: '01',
    title: 'Sun Avenue',
    color: '#f2bd38',
    question: 'How does light make a public room more comfortable?',
    booths: [
      {
        id: 'shadow-atlas',
        title: 'Shadow Atlas',
        hook: 'A precise field of adjustable shadows.',
        move: 'Rotate one fin and mark the coolest-feeling seat.',
        measure: 'Shadow reach and visitor comfort tokens.',
        takeaway: 'Shade geometry can be tested before a structure gets larger.',
      },
      {
        id: 'thermal-blanket',
        title: 'Quietest Shade',
        hook: 'Identical surfaces under different cover shapes.',
        move: 'Compare safely enclosed analog temperature indicators.',
        measure: 'Relative surface response over equal intervals.',
        takeaway: 'Comfort is a material and geometry question, not only more fabric.',
      },
    ],
  },
  {
    id: 'wind',
    number: '02',
    title: 'Wind Avenue',
    color: '#35a79c',
    question: 'What can move beautifully without becoming loose gear?',
    booths: [
      {
        id: 'wind-fingerprints',
        title: 'Wind Fingerprints',
        hook: 'Guarded vanes move together in a small gust.',
        move: 'Change one vane shape inside a contained chamber.',
        measure: 'Stamp the resulting mechanical pattern.',
        takeaway: 'Shape changes drag; containment changes whether the idea belongs outside.',
      },
      {
        id: 'sail-bench',
        title: 'Small Sail, Clear Path',
        hook: 'Miniature sails deflect a mechanical indicator.',
        move: 'Change angle, never power.',
        measure: 'Dial response across three repeat trials.',
        takeaway: 'Wind is a design load before it is an energy fantasy.',
      },
    ],
  },
  {
    id: 'water',
    number: '03',
    title: 'Water Avenue',
    color: '#2879bd',
    question: 'What changes a wave inside a model?',
    booths: [
      {
        id: 'tabletop-tide',
        title: 'Tabletop Tide',
        hook: 'Light moves through a closed freshwater flume.',
        move: 'Turn a guarded hand crank and swap an inert model barrier.',
        measure: 'Splash reach and repeatable ripple response.',
        takeaway: 'A model can compare ideas; it cannot certify coastal engineering.',
      },
      {
        id: 'curve-wall',
        title: 'Curve / Wall / Fiber',
        hook: 'Three miniature edges meet the same ripple.',
        move: 'Predict, test, then place an evidence token.',
        measure: 'Visible turbulence in identical small trials.',
        takeaway: 'The useful question is often comparative, not absolute.',
      },
    ],
  },
  {
    id: 'sand',
    number: '04',
    title: 'Sand Avenue',
    color: '#d89045',
    question: 'When does a pile become a structure?',
    booths: [
      {
        id: 'angle-of-repose',
        title: 'Angle of Repose',
        hook: 'A contained clean-material slope fails beautifully.',
        move: 'Add one measured scoop to a clear brought-material tray.',
        measure: 'Angle and collapse sequence.',
        takeaway: 'Granular material carries load differently from a solid panel.',
      },
    ],
  },
  {
    id: 'sound',
    number: '05',
    title: 'Sound Avenue',
    color: '#be4c72',
    question: 'How can a gathering listen closely without getting louder?',
    booths: [
      {
        id: 'cup-choir',
        title: 'Cup Choir',
        hook: 'A low mechanical vibration draws a visible pattern.',
        move: 'Listen through a shared tube or gently change tension.',
        measure: 'Pattern change across matched acoustic forms.',
        takeaway: 'Good social sound can be intimate, tactile, and unamplified.',
      },
    ],
  },
  {
    id: 'life',
    number: '06',
    title: 'Life Avenue',
    color: '#5a8e63',
    question: 'How much can careful looking contribute?',
    booths: [
      {
        id: 'living-atlas',
        title: 'Living Atlas',
        hook: 'A seasonal field of observation tiles grows all day.',
        move: 'Observe open sky or public landscape from an established area.',
        measure: 'Anonymous category and time token; no location trace.',
        takeaway: 'Repeated observation can create knowledge without collecting life.',
      },
    ],
  },
  {
    id: 'materials',
    number: '07',
    title: 'Materials Avenue',
    color: '#db5b38',
    question: 'What deserves to return next season?',
    booths: [
      {
        id: 'salt-air-library',
        title: 'Salt-Air Library',
        hook: 'Pre-weathered samples reveal fasteners, finishes, fibers, and seams.',
        move: 'Compare wear and choose the most legible repair path.',
        measure: 'Repairability, separability, and useful-life tokens.',
        takeaway: 'The strongest object may be the one people can understand and mend.',
      },
      {
        id: 'pack-down-physics',
        title: 'Pack-Down Physics',
        hook: 'One small cart receives an entire booth.',
        move: 'Choose the next fold or secure point.',
        measure: 'Volume, pieces, lift count, and clear-return time.',
        takeaway: 'Departure is part of the experiment.',
      },
      {
        id: 'best-failure',
        title: 'Best Failure',
        hook: 'The broken model gets the central table.',
        move: 'Identify the first visible failure and propose one changed variable.',
        measure: 'Evidence before explanation; retest if safe.',
        takeaway: 'A fair becomes trustworthy when a failed result stays interesting.',
      },
    ],
  },
] as const;

export const FAIR_SCORE = [
  { label: 'Question', points: 15, test: 'Clear, local, testable, and honestly bounded.' },
  { label: 'Method', points: 20, test: 'Variables, comparisons, controls, and repeats make sense.' },
  { label: 'Evidence', points: 25, test: 'The result is systematic, legible, and does not outrun the data.' },
  { label: 'Imagination', points: 20, test: 'The project opens a possibility or changes the frame.' },
  { label: 'Public explanation', points: 20, test: 'A visitor can understand, question, and try the core idea.' },
] as const;

export const FAIR_AWARDS = [
  {
    title: 'Best Explanation',
    icon: 'open hand',
    note: 'The visitor leaves able to retell the idea accurately.',
  },
  {
    title: 'Most Borrowable',
    icon: 'folding hinge',
    note: 'Another block, school, library, or town could reproduce the method.',
  },
  {
    title: 'Best Failure',
    icon: 'beautiful crack',
    note: 'A wrong result produced the day’s best next question.',
  },
  {
    title: 'Smallest Big Effect',
    icon: 'tiny lever',
    note: 'One modest change made the clearest difference.',
  },
  {
    title: 'Most Useful',
    icon: 'small bridge',
    note: 'The evidence could improve comfort, access, care, or return.',
  },
  {
    title: 'Audience Keeps',
    icon: 'prism',
    note: 'The public chooses one idea to challenge again next season.',
  },
] as const;

export const FAIR_DAY = [
  {
    time: '9:00',
    title: 'Curiosity gate',
    note: 'Choose a motive, take a colored token, and enter the first ninety-second hook.',
  },
  {
    time: '10:00',
    title: 'Public test I',
    note: 'Booths run matched trials. Visitors add the first results to the long rail.',
  },
  {
    time: '12:30',
    title: 'Method swap',
    note: 'A booth borrows one variable, display move, or explanation from another avenue.',
  },
  {
    time: '3:00',
    title: 'Public test II',
    note: 'Retest the strongest result and the most informative failure.',
  },
  {
    time: '5:30',
    title: 'The proof walk',
    note: 'Judges and visitors inspect questions, methods, evidence, unknowns, and clean-return plans.',
  },
  {
    time: 'Blue hour',
    title: 'Results theater',
    note: 'Six kinds of excellence, one public proof, then every booth packs completely home.',
  },
] as const;

export const ROUTE_MOTIVES: readonly {
  id: FairMotive;
  title: string;
  note: string;
}[] = [
  { id: 'touch', title: 'Touch it', note: 'Controls, materials, and tactile evidence.' },
  { id: 'build', title: 'Build it', note: 'Structures, folds, failures, and repair.' },
  { id: 'coast', title: 'Help the coast', note: 'Local literacy without habitat intervention.' },
  { id: 'compete', title: 'Compete', note: 'Repeatable tests, public proof, and many awards.' },
  { id: 'family', title: 'Bring everyone', note: 'Short actions, many heights, quiet pauses.' },
  { id: 'beauty', title: 'Find beauty', note: 'Light, motion, water, sound, and materials.' },
  { id: 'blue-hour', title: 'Stay late', note: 'The proof walk and blue-hour results theater.' },
] as const;

export const ROUTE_OPTIONS: Record<
  FairMotive,
  Record<FairDuration, { title: string; stops: readonly string[]; finish: string }>
> = {
  touch: {
    '15': {
      title: 'The three-move dash',
      stops: ['Wind Fingerprints', 'Cup Choir', 'Salt-Air Library'],
      finish: 'Place one evidence token, then leave with clean hands and a good question.',
    },
    '45': {
      title: 'The tactile loop',
      stops: ['Curiosity Gate', 'Shadow Atlas', 'Tabletop Tide', 'Cup Choir', 'Pack-Down Physics'],
      finish: 'Compare five different ways a small physical move becomes public evidence.',
    },
    '120': {
      title: 'Hands-on grand tour',
      stops: ['Shadow Atlas', 'Wind Fingerprints', 'Tabletop Tide', 'Angle of Repose', 'Cup Choir', 'Salt-Air Library', 'Best Failure'],
      finish: 'Return for Public Test II and see which result survives a repeat.',
    },
  },
  build: {
    '15': {
      title: 'Build / fail / fold',
      stops: ['Angle of Repose', 'Best Failure', 'Pack-Down Physics'],
      finish: 'Pick the changed variable you would test next.',
    },
    '45': {
      title: 'The reversible builder',
      stops: ['Shadow Atlas', 'Small Sail, Clear Path', 'Angle of Repose', 'Salt-Air Library', 'Pack-Down Physics'],
      finish: 'Score one idea for assembly, repair, weather, and clean return.',
    },
    '120': {
      title: 'Commons chassis route',
      stops: ['Curiosity Gate', 'Shadow Atlas', 'Tabletop Tide', 'Angle of Repose', 'Salt-Air Library', 'Best Failure', 'Pack-Down Physics'],
      finish: 'Join the method swap and lend one good construction idea to another avenue.',
    },
  },
  coast: {
    '15': {
      title: 'Look, model, leave',
      stops: ['Tabletop Tide', 'Living Atlas', 'Pack-Down Physics'],
      finish: 'Take only the question; the coast remains untouched.',
    },
    '45': {
      title: 'Coastal literacy loop',
      stops: ['Shadow Atlas', 'Wind Fingerprints', 'Tabletop Tide', 'Living Atlas', 'Salt-Air Library'],
      finish: 'Separate one useful observation from one claim that still needs experts.',
    },
    '120': {
      title: 'The place-question route',
      stops: ['Shadow Atlas', 'Quietest Shade', 'Wind Fingerprints', 'Tabletop Tide', 'Angle of Repose', 'Living Atlas', 'Salt-Air Library'],
      finish: 'Help write the public proof: observed, modeled, unknown, and outside our authority.',
    },
  },
  compete: {
    '15': {
      title: 'Three honest scores',
      stops: ['Tabletop Tide', 'Best Failure', 'Public Result Rail'],
      finish: 'Vote for evidence, not showmanship.',
    },
    '45': {
      title: 'The judging sampler',
      stops: ['Shadow Atlas', 'Wind Fingerprints', 'Tabletop Tide', 'Best Failure', 'Proof Walk'],
      finish: 'Award Best Explanation and Best Failure to different projects.',
    },
    '120': {
      title: 'Full league route',
      stops: ['Curiosity Gate', 'Public Test I', 'Method Swap', 'Public Test II', 'Proof Walk', 'Results Theater'],
      finish: 'Stay long enough to see whether a retest changes the winner.',
    },
  },
  family: {
    '15': {
      title: 'Small-person spectacular',
      stops: ['Curiosity Gate', 'Shadow Atlas', 'Cup Choir'],
      finish: 'Choose the one thing everyone can explain on the way home.',
    },
    '45': {
      title: 'Many heights, one route',
      stops: ['Curiosity Gate', 'Wind Fingerprints', 'Tabletop Tide', 'Quiet Rest', 'Living Atlas'],
      finish: 'End with outward observation, not a gift-shop exit.',
    },
    '120': {
      title: 'The intergenerational day',
      stops: ['Curiosity Gate', 'Shadow Atlas', 'Tabletop Tide', 'Angle of Repose', 'Quiet Rest', 'Living Atlas', 'Best Failure'],
      finish: 'Let the youngest visitor choose the next question and the oldest choose the cleanest method.',
    },
  },
  beauty: {
    '15': {
      title: 'Light / motion / water',
      stops: ['Shadow Atlas', 'Wind Fingerprints', 'Tabletop Tide'],
      finish: 'Notice which beautiful effect also explains itself.',
    },
    '45': {
      title: 'The apparatus promenade',
      stops: ['Curiosity Gate', 'Shadow Atlas', 'Wind Fingerprints', 'Tabletop Tide', 'Cup Choir', 'Salt-Air Library'],
      finish: 'Give Audience Keeps to beauty that carries evidence.',
    },
    '120': {
      title: 'Golden-hour field edit',
      stops: ['Shadow Atlas', 'Wind Fingerprints', 'Tabletop Tide', 'Angle of Repose', 'Cup Choir', 'Living Atlas', 'Blue-Hour Proof'],
      finish: 'Watch the separate colors become one results theater.',
    },
  },
  'blue-hour': {
    '15': {
      title: 'The final proof',
      stops: ['Public Result Rail', 'Award Objects', 'Clean Return'],
      finish: 'See the beach become visually empty again.',
    },
    '45': {
      title: 'Proof walk to moonrise',
      stops: ['Best Failure', 'Living Atlas', 'Proof Walk', 'Results Theater', 'Clean Return'],
      finish: 'Applaud the unknowns as loudly as the answers.',
    },
    '120': {
      title: 'The long ending',
      stops: ['Public Test II', 'Living Atlas', 'Proof Walk', 'Results Theater', 'Public Proof', 'Clean Return'],
      finish: 'Carry one repeatable question into next season.',
    },
  },
};

export const PUBLIC_PROOF = [
  'The exact question we tested',
  'The method and comparison we used',
  'What changed across repeated trials',
  'What failed or contradicted the expectation',
  'What remains unknown or outside this model',
  'What could be safely repeated elsewhere',
  'What packed out, and what trace remained',
] as const;

export const VISUAL_PLATES = [
  {
    id: '01',
    title: 'The Curiosity Gate',
    src: '/beach-commons/v17/assets/poster-01.png',
    alt: 'An intergenerational science fair enters seven colorful avenues through a reversible curiosity gate beside the beach.',
    caption: 'Popular reason no. 1: the invitation is legible before the explanation.',
  },
  {
    id: '02',
    title: 'The Shadow Atlas',
    src: '/beach-commons/v17/assets/poster-02.png',
    alt: 'Families compare shadow, color, shade, and thermal apparatus along a broad accessible public route.',
    caption: 'Spectacle earns its place by answering a comfort question.',
  },
  {
    id: '03',
    title: 'Wind Fingerprints',
    src: '/beach-commons/v17/assets/poster-03.png',
    alt: 'Visitors use contained wind vanes, mechanical dials, small sail forms, and pattern stamps.',
    caption: 'Movement becomes a comparison, then a record.',
  },
  {
    id: '04',
    title: 'The Tabletop Tide',
    src: '/beach-commons/v17/assets/poster-04.png',
    alt: 'Children and adults operate closed freshwater wave models on stable tables while the distant ocean remains untouched.',
    caption: 'A model can compare ideas without pretending to certify a coast.',
  },
  {
    id: '05',
    title: 'Sand, Materials, Failure',
    src: '/beach-commons/v17/assets/poster-05.png',
    alt: 'A mixed-age group examines a collapsed miniature structure beside contained material trays and a repair library.',
    caption: 'The broken model gets the busiest table.',
  },
  {
    id: '06',
    title: 'The Cup Choir',
    src: '/beach-commons/v17/assets/poster-06.png',
    alt: 'Visitors listen through tactile acoustic tubes and low-volume resonant instruments near a quiet rest area.',
    caption: 'The quietest avenue creates the closest conversations.',
  },
  {
    id: '07',
    title: 'The Living Atlas',
    src: '/beach-commons/v17/assets/poster-07.png',
    alt: 'Visitors use fixed viewing scopes and an analog seasonal atlas to observe the sky and public landscape without collecting nature.',
    caption: 'Careful looking is a contribution. Taking nothing is a method.',
  },
  {
    id: '08',
    title: 'Blue-Hour Proof',
    src: '/beach-commons/v17/assets/poster-08.png',
    alt: 'A large intergenerational crowd gathers around a warm low results theater under the moon as carts prepare to pack out.',
    caption: 'The results become theater; clean return becomes the final experiment.',
  },
] as const;

export const FAIR_SOURCES = [
  {
    title: 'Grand Award Judging Criteria',
    organization: 'Society for Science',
    url: 'https://www.societyforscience.org/isef/grand-award/criteria/',
    use: 'Question, method, execution, creativity, impact, and presentation informed the serious score.',
  },
  {
    title: 'Judging at Your Fair',
    organization: 'Society for Science',
    url: 'https://www.societyforscience.org/isef/affiliated-fair-network/judging-at-your-fair/',
    use: 'A fair should be educational and motivating as well as competitive.',
  },
  {
    title: 'A Guide for Creating Museum-Style Exhibits in Community Spaces',
    organization: 'Exploratorium',
    url: 'https://www.exploratorium.edu/sites/default/files/2025-01/Exhiblets_Creating_Museum-Style_Exhibits.pdf',
    use: 'The ninety-second hook and visitor move borrow from hands-on exhibit practice.',
  },
  {
    title: 'GLOBE Observer for Informal Educators',
    organization: 'The GLOBE Program',
    url: 'https://observer.globe.gov/toolkit',
    use: 'Legible public contribution, teams, challenges, and shared results informed the participation layer.',
  },
  {
    title: 'Special Event Permit',
    organization: 'Los Angeles County Beaches & Harbors',
    url: 'https://beaches.lacounty.gov/special-event-permit/',
    use: 'Any actual organized beach visit or setup must begin with current County requirements.',
  },
  {
    title: 'LA County Beach Rules FAQ',
    organization: 'Los Angeles County Beaches & Harbors',
    url: 'https://beaches.lacounty.gov/la-county-beach-rules-faq/',
    use: 'Current ordinary-use and Dockweiler fire-ring boundaries remain distinct from this imagined event.',
  },
] as const;
