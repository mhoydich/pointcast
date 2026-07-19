export type UesSeasonOneStatus = 'active';

export type UesSeasonZeroCourseCode =
  | 'UES-101'
  | 'UES-102'
  | 'UES-103'
  | 'UES-104'
  | 'UES-105'
  | 'UES-106'
  | 'UES-107'
  | 'UES-108';

export type UesSeasonOneCourseCode =
  | 'UES-201'
  | 'UES-202'
  | 'UES-203'
  | 'UES-204'
  | 'UES-205'
  | 'UES-206'
  | 'UES-207'
  | 'UES-208'
  | 'UES-209'
  | 'UES-210';

export interface UesCourseWeek {
  week: number;
  title: string;
  question: string;
  sourceShelf: readonly string[];
  studio: string;
  fieldTask: string;
  publicReceipt: string;
}

export interface UesCourseAssignment {
  title: string;
  dueWeek: number;
  brief: string;
}

export interface UesWeeklyCommitment {
  selfGuidedStudioMinutes: number;
  fieldworkMinutes: {
    minimum: number;
    maximum: number;
  };
  reflectionMinutes: number;
  total: string;
}

export interface UesSeasonOneCourse {
  code: UesSeasonOneCourseCode;
  slug: string;
  title: string;
  status: UesSeasonOneStatus;
  frame: string;
  outcome: string;
  path: string;
  jsonPath: string;
  weeklyCommitment: UesWeeklyCommitment;
  access: readonly string[];
  materials: readonly string[];
  instructorProfile: string;
  soloPath: string;
  assignments: readonly UesCourseAssignment[];
  weeks: readonly UesCourseWeek[];
  archiveWorkNumber: string;
  archiveCategory: string;
  connectsFrom: readonly UesSeasonZeroCourseCode[];
  budgetUsd: number;
  addedProductionNeed: string;
  boundary?: string;
}

export interface UesSeasonOneBudgetLine {
  label: string;
  amountUsd: number;
  purpose: string;
}

const STANDARD_WEEKLY_COMMITMENT: UesWeeklyCommitment = {
  selfGuidedStudioMinutes: 75,
  fieldworkMinutes: {
    minimum: 60,
    maximum: 90,
  },
  reflectionMinutes: 20,
  total: 'About 2.5–3 hours each week',
};

const SHARED_ACCESS = [
  'Every instruction is readable on the public course page; audio or video references require a transcript or equivalent text path.',
  'Low-bandwidth, print-friendly syllabus with no paid platform or subscription required.',
  'No live attendance, camera, account, wallet, or public posting is required.',
  'Progress stays in this browser unless the learner chooses to download a private completion receipt.',
] as const;

export const ONLINE_SEASON_ONE = {
  name: 'Online Season 1',
  theme: 'The Local Transmission',
  line: 'Ten active studios turn local observation into a shared public commons.',
  status: 'active' as const,
  deliveryMode: 'self-paced' as const,
  durationWeeks: 6,
  planningLearners: 120,
  accessCapacity: 'uncapped',
  courseCount: 10,
  optionalCohortSize: {
    minimum: 12,
    maximum: 18,
  },
  enrollmentModel:
    'Start any class immediately, without an application or account. Follow six modules at any pace, save progress locally, finish the outcome, and download a private self-issued receipt.',
  weeklyRhythm: {
    prompt: 'Read one central question and a compact source shelf.',
    fieldwork:
      'Complete one 60–90 minute local field task or its remote equivalent.',
    studioMinutes: 75,
    receipt:
      'Leave one useful private or public trace and mark the module complete.',
  },
  optionalSupportedCohort: {
    faculty: 1,
    steward: 1,
    note: 'Funding can add human review and a scheduled cohort, but it never gates the self-paced route.',
  },
  completion:
    'Complete any four of the six module receipts and the final course outcome or a private equivalent. The downloadable receipt is a self-attestation, not accreditation or a financial credential.',
  learnerPriceUsd: 0,
  fundingModel:
    'The self-paced route is active and tuition-free now. Contributions fund access, material grants, editorial maintenance, and optional supported cohorts; they cannot purchase admission or curriculum control.',
  access: SHARED_ACCESS,
  rightsAndPublishing:
    'Learners retain copyright. Public licensing, wallet connection, and Tezos minting are optional and never required for enrollment or completion.',
} as const;

export const UES_SEASON_ONE_COURSES: readonly UesSeasonOneCourse[] = [
  {
    code: 'UES-201',
    slug: 'marine-layer-weather-light-daily-seeing',
    title: 'Marine Layer: Weather, Light & Daily Seeing',
    status: 'active',
    frame:
      'Study weather as visual material and public experience: observe one place closely enough to see air, light, sound, and daily change become a local language.',
    outcome:
      'An accessible six-panel micro-atlas showing one place through changing weather, light, color, and sound.',
    path: '/ues/marine-layer-weather-light-daily-seeing',
    jsonPath: '/ues/marine-layer-weather-light-daily-seeing.json',
    weeklyCommitment: STANDARD_WEEKLY_COMMITMENT,
    access: [
      ...SHARED_ACCESS,
      'Webcam, public-weather-data, and memory-based observation paths when outdoor fieldwork is unavailable.',
    ],
    materials: [
      'Phone camera, camera, or sketchbook',
      'Notebook or notes app',
      'Basic image, audio, or layout tool of the learner’s choice',
      'Access to public weather observations; no paid weather service required',
    ],
    instructorProfile:
      'A photographer, visual artist, or field naturalist with atmospheric or coastal literacy, source discipline, and an accessible critique practice.',
    soloPath:
      'Use one repeatable viewpoint and compare your own observations across time. Any critique prompt becomes a timed self-edit using the course checklist.',
    assignments: [
      {
        title: 'Seven-day sky log',
        dueWeek: 2,
        brief:
          'Observe one place at a consistent time for seven days using image, color, sound, text, or a combination.',
      },
      {
        title: 'Weather card',
        dueWeek: 4,
        brief:
          'Translate one observed condition into a concise visual card with a source note and meaningful alt text.',
      },
      {
        title: 'Micro-atlas plate',
        dueWeek: 6,
        brief:
          'Edit six observations into one coherent, accessible micro-atlas plate. Keep it private by default; adding it to a collective atlas is optional and the private plate counts equally.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Notice Before Naming',
        question:
          'What becomes visible when we stay with one patch of air before deciding what it means?',
        sourceShelf: [
          'UES Marine Layer field-note practice',
          'National Weather Service observation vocabulary',
          'Artist weather diaries and serial landscape studies',
        ],
        studio:
          'Build a personal working vocabulary of haze, cloud edge, glare, wind, temperature, distance, and uncertainty; optionally compare it with the course vocabulary.',
        fieldTask:
          'Choose one repeatable viewpoint and make three observations at different times of day.',
        publicReceipt:
          'A first-view card naming the place, time, conditions, and one unresolved question.',
      },
      {
        week: 2,
        title: 'Weather Has Sources',
        question:
          'How can lived observation and public data correct, deepen, or complicate each other?',
        sourceShelf: [
          'NOAA and National Weather Service observation products',
          'Tide, wind, visibility, and air-quality public-data conventions',
          'Source-note and uncertainty examples from PointCast',
        ],
        studio:
          'Read a forecast discussion, compare it with the sky log, and distinguish observation from inference.',
        fieldTask:
          'Complete the seven-day sky log and pair two entries with time-matched public observations.',
        publicReceipt:
          'One sourced comparison between what the learner saw and what a public instrument recorded.',
      },
      {
        week: 3,
        title: 'Light, Color, Sound',
        question:
          'What visual or sonic system can hold a condition without flattening it?',
        sourceShelf: [
          'Color notation and environmental sound-score examples',
          'Accessible color-contrast and audio-description practices',
          'The El Segundo School archive: weather, horizon, and botanical works',
        ],
        studio:
          'Test three translations of one condition through palette, mark, typography, sequence, or sound.',
        fieldTask:
          'Record one changing condition in two different media and compare what each medium loses.',
        publicReceipt:
          'A two-medium study with a plain-language description of the editorial choice.',
      },
      {
        week: 4,
        title: 'Weather in Public',
        question:
          'Who experiences the same weather differently, and how does the built environment change it?',
        sourceShelf: [
          'Heat, shade, wind, and shelter observation prompts',
          'Public-space accessibility field-audit examples',
          'Local accounts of marine layer, airport edge, beach, and street conditions',
        ],
        studio:
          'Self-check the weather card for legibility, source clarity, access, and lived specificity using the supplied rubric; optional outside critique can supplement the same check.',
        fieldTask:
          'Compare two nearby public places for shade, glare, wind, shelter, and ease of waiting.',
        publicReceipt:
          'The finished weather card plus an access note and alt text.',
      },
      {
        week: 5,
        title: 'A System for Daily Change',
        question:
          'How can many distinct observations belong together without becoming identical?',
        sourceShelf: [
          'Grid, sequence, legend, and small-multiple design references',
          'Collective authorship and crediting patterns',
          'Open image, text, and audio licensing choices',
        ],
        studio:
          'Edit the studies into a consistent personal atlas grammar; optionally compare it with a shared atlas grammar without changing the completion standard.',
        fieldTask:
          'Produce a six-panel draft and run the structured accessibility and editorial self-check. An optional peer edit may be added, but the self-check counts equally.',
        publicReceipt:
          'A before-and-after edit note showing what changed and why.',
      },
      {
        week: 6,
        title: 'Open the Atlas',
        question:
          'What should the next observer be able to notice, reuse, or question?',
        sourceShelf: [
          'Public exhibition checklist',
          'Portable archive and metadata checklist',
          'Optional Tezos publication boundary from UES-107',
        ],
        studio:
          'Sequence the personal atlas and conduct a final source-and-access self-review. A collective sequence or public showing is optional, and a private review counts equally.',
        fieldTask:
          'Finish the micro-atlas plate and prepare one sentence of context for a future observer.',
        publicReceipt:
          'A private-by-default atlas plate with credits, source note, alt text, and optional process audio; publishing or exhibiting it is optional.',
      },
    ],
    archiveWorkNumber: '017',
    archiveCategory: 'WEATHER + LIGHT',
    connectsFrom: ['UES-103', 'UES-105', 'UES-106'],
    budgetUsd: 3_350,
    addedProductionNeed:
      'Weather-and-art guest honorarium beyond the standard course plan.',
  },
  {
    code: 'UES-202',
    slug: 'the-25-mile-atlas',
    title: 'The 25-Mile Atlas: Mapping a Living Radius',
    status: 'active',
    frame:
      'Map a place through useful rooms, missing connections, access barriers, lived stories, and the relationships that make a radius more than a circle.',
    outcome:
      'A private-by-default map of useful places, missing connections, lived stories, access barriers, and one achievable local repair, with optional public sharing.',
    path: '/ues/the-25-mile-atlas',
    jsonPath: '/ues/the-25-mile-atlas.json',
    weeklyCommitment: STANDARD_WEEKLY_COMMITMENT,
    access: [
      ...SHARED_ACCESS,
      'Remote public-record, self-authored memory, and archival mapping paths when a field walk or interview is unavailable.',
    ],
    materials: [
      'Browser and free web-mapping tool',
      'Phone camera or notebook',
      'Printed neighborhood map option',
      'No GIS experience or paid software required',
    ],
    instructorProfile:
      'A community cartographer, urban designer, geographer, or organizer able to teach evidence, uncertainty, participatory mapping, and responsible location privacy.',
    soloPath:
      'Map your own radius with public sources, direct observation, and memory. Interviews and contributed place stories are optional; a clearly labeled evidence gap counts.',
    assignments: [
      {
        title: 'Personal radius map',
        dueWeek: 2,
        brief:
          'Draw the practical radius of one daily need and explain which boundaries are geographic, social, or infrastructural.',
      },
      {
        title: 'Three verified field records',
        dueWeek: 4,
        brief:
          'Make three useful, sourced, access-aware records in a private working atlas using the course field protocol; contributing them to a shared atlas is optional.',
      },
      {
        title: 'One repair route',
        dueWeek: 6,
        brief:
          'Create an illustrated path from a documented local gap to one realistic first repair. A private export counts equally; publication is optional.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Who Draws the Boundary?',
        question:
          'When does a radius describe belonging, and when does it conceal difference?',
        sourceShelf: [
          'UES 25-mile participation rule',
          'Participatory mapping and counter-mapping examples',
          'Local transit, neighborhood, and watershed boundary references',
        ],
        studio:
          'Compare administrative, ecological, emotional, and practical boundaries around El Segundo and each learner’s place.',
        fieldTask:
          'Draw four boundaries around one daily need and annotate who each boundary includes or excludes.',
        publicReceipt: 'A personal radius map with a short boundary statement.',
      },
      {
        week: 2,
        title: 'Base Maps and Honest Legends',
        question: 'What does a map claim before any learner adds a mark?',
        sourceShelf: [
          'OpenStreetMap attribution and editing basics',
          'City and county public map layers',
          'Map legends, uncertainty marks, and source dates',
        ],
        studio:
          'Read competing base maps, design a legend, and distinguish verified fact from local report.',
        fieldTask:
          'Audit one map against lived experience and document one omission, error, or stale record.',
        publicReceipt:
          'A sourced correction card or clearly labeled open question.',
      },
      {
        week: 3,
        title: 'Run a Transect',
        question:
          'What can a short, repeatable route reveal that a distant overview cannot?',
        sourceShelf: [
          'Walking-transect field protocols',
          'Universal-design and curb-to-door access prompts',
          'Responsible street photography and location privacy',
        ],
        studio:
          'Practice a compact field protocol for route, threshold, asset, barrier, sound, sign, and unanswered question.',
        fieldTask:
          'Walk, roll, ride, or remotely reconstruct one transect and record five evidence-based observations.',
        publicReceipt:
          'One transect strip with route, time, mode, and access conditions.',
      },
      {
        week: 4,
        title: 'Story and Memory Layers',
        question:
          'How can a map hold testimony without turning a person into data?',
        sourceShelf: [
          'Consent-based community storytelling prompts',
          'Oral-history excerpt and attribution practices',
          'Location fuzzing and sensitive-place redaction patterns',
        ],
        studio:
          'Add narrative layers while preserving context, consent, and the right not to be mapped.',
        fieldTask:
          'Create a self-authored memory layer. Optionally invite another person to contribute a consented place memory; the self-authored route counts equally.',
        publicReceipt:
          'A private-by-default self-authored memory layer, consented story pin, approximate-area note, or intentionally blank protected place.',
      },
      {
        week: 5,
        title: 'Power, Access, Gaps',
        question: 'Which missing connection would matter most, and to whom?',
        sourceShelf: [
          'UES-102 local systems-map method',
          'Public meeting, service-request, and department-route examples',
          'Small civic repair and tactical-improvement case studies',
        ],
        studio:
          'Cluster the atlas into assets, barriers, decision paths, and candidate repairs.',
        fieldTask:
          'Verify one gap with two sources and identify the people or offices already closest to it.',
        publicReceipt: 'A one-page evidence card for a candidate repair.',
      },
      {
        week: 6,
        title: 'Publish the Living Atlas',
        question:
          'How will this map stay useful, correctable, and locally accountable?',
        sourceShelf: [
          'Public map moderation and correction policies',
          'Portable data and export checklist',
          'UES season-receipt and local stewardship rules',
        ],
        studio:
          'Self-review evidence, access, privacy, moderation, and maintenance before saving the atlas; opening it to others is optional.',
        fieldTask:
          'Finish one repair route and write a simulated next-action handoff. Sending it to a local steward is optional and the simulation counts equally.',
        publicReceipt:
          'A private-by-default map layer, repair route, sources, correction path, and stewardship note; publication is optional.',
      },
    ],
    archiveWorkNumber: '141',
    archiveCategory: 'MAPS + CIVIC',
    connectsFrom: ['UES-101', 'UES-102', 'UES-108'],
    budgetUsd: 3_300,
    addedProductionNeed:
      'Mapping tools, data preparation, and accessible export support.',
  },
  {
    code: 'UES-203',
    slug: 'public-image-office',
    title: 'Public Image Office: Posters, Signs & Civic Invitations',
    status: 'active',
    frame:
      'Treat public graphics as working civic material: images that help a real person find, understand, join, question, or remember something local.',
    outcome:
      'A private-by-default visual campaign for a real or self-defined local gathering or public-use project: poster, mobile card, printable sign, and editable source package.',
    path: '/ues/public-image-office',
    jsonPath: '/ues/public-image-office.json',
    weeklyCommitment: STANDARD_WEEKLY_COMMITMENT,
    access: [
      ...SHARED_ACCESS,
      'Template-based and analog collage paths for learners without professional design software.',
    ],
    materials: [
      'Phone camera or sketchbook',
      'Paper, marker, scissors, tape, or equivalent digital tools',
      'Browser-based layout tool or preferred design software',
      'Access to a basic home, library, or partner printer for one scale test when possible',
    ],
    instructorProfile:
      'A graphic designer or art director fluent in typography, print, web production, accessibility, and generous collaborative critique.',
    soloPath:
      'Choose one real or self-defined invitation, make every format yourself, and replace interviews or group critique with the supplied audience simulation, legibility, access, and cold-read checks. Private files count equally.',
    assignments: [
      {
        title: 'Ten-sign field audit',
        dueWeek: 2,
        brief:
          'Document ten public signs and assess voice, audience, location, access, usefulness, and unintended message.',
      },
      {
        title: 'Twelve-variation image sheet',
        dueWeek: 4,
        brief:
          'Push one invitation through twelve materially different type-and-image arrangements before selecting a system.',
      },
      {
        title: 'Three-format campaign kit',
        dueWeek: 6,
        brief:
          'Finish a poster, mobile card, printable sign, editable source, credits, alt text, and compact use guide. Keep the kit private by default; deployment or sharing is optional.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Read the Street',
        question:
          'What are local signs asking people to do, and who can actually understand or act?',
        sourceShelf: [
          'UES-105 public-sign walk method',
          'Municipal, handmade, commercial, protest, and wayfinding sign examples',
          'Plain-language and visual-access prompts',
        ],
        studio:
          'Read signs as voice, hierarchy, placement, material, instruction, and social relationship.',
        fieldTask:
          'Document ten signs from one route or accessible digital streetscape.',
        publicReceipt:
          'An annotated sign audit naming one strong invitation and one exclusion.',
      },
      {
        week: 2,
        title: 'Message, Audience, Invitation',
        question:
          'What must a person know, feel, and do in the five seconds after seeing this?',
        sourceShelf: [
          'Audience-and-action brief template',
          'Plain-language editing checklist',
          'Examples of welcoming and coercive public language',
        ],
        studio:
          'Turn a real or self-defined local need into a one-page campaign brief and test the verb at its center with the supplied audience-simulation checklist.',
        fieldTask:
          'Run the intended-participant simulation and revise the invitation from the checklist. An optional interview or message exchange may add evidence, but the simulation counts equally.',
        publicReceipt:
          'A private-by-default brief containing audience, action, context, constraints, and access promise.',
      },
      {
        week: 3,
        title: 'Type and Image Material',
        question:
          'How can found, made, archival, and generated material acquire a distinct public voice?',
        sourceShelf: [
          'The El Segundo School type and collage archive',
          'Image provenance and crediting patterns',
          'Analog and digital composition demonstrations',
        ],
        studio:
          'Make rapid systems from type, field photography, collage, drawing, archive material, and disclosed AI use.',
        fieldTask:
          'Create twelve materially varied compositions without polishing a final answer.',
        publicReceipt:
          'The complete variation sheet plus one sentence about the selected direction.',
      },
      {
        week: 4,
        title: 'One Idea, Many Surfaces',
        question:
          'What makes a visual system recognizable without making every output identical?',
        sourceShelf: [
          'Responsive identity and campaign-system references',
          'Poster, phone, social, sign, and photocopy format constraints',
          'Open source-package organization examples',
        ],
        studio:
          'Build rules for scale, crop, color, hierarchy, image treatment, and self-editing; optional partner editing may supplement the same rules.',
        fieldTask:
          'Translate the selected direction into poster, phone, and one-color printable formats.',
        publicReceipt:
          'A three-format proof with the system rules visible beside it.',
      },
      {
        week: 5,
        title: 'Access Is a Design Material',
        question:
          'Does the campaign survive distance, glare, small screens, grayscale, screen readers, and ordinary printers?',
        sourceShelf: [
          'WCAG text contrast and non-text alternative guidance',
          'Large-print, plain-language, and screen-reader checks',
          'Low-cost print-production test methods',
        ],
        studio:
          'Run distance, scale, contrast, grayscale, alt-text, reading-order, and office-printer tests.',
        fieldTask:
          'Run two distinct simulated-use tests with the supplied distance, device, and access profiles and document one change from each. Tests with other people are optional and count the same.',
        publicReceipt:
          'An access-and-production test sheet showing failures, revisions, and remaining limits.',
      },
      {
        week: 6,
        title: 'Release the Public Kit',
        question:
          'Can another local person deploy, adapt, credit, and maintain this work?',
        sourceShelf: [
          'Public campaign release checklist',
          'Open licensing and editable-source guidance',
          'UES public receipt and handoff format',
        ],
        studio:
          'Run the final self-critique against the brief and rehearse a five-minute simulated handoff. Outside critique, release, and a real handoff are optional.',
        fieldTask:
          'Package final outputs, fonts or substitutions, image credits, alt text, and a one-page use guide.',
        publicReceipt:
          'A private-by-default three-format campaign kit, editable source, license choice, credits, and deployment mockup; real deployment or public sharing is optional.',
      },
    ],
    archiveWorkNumber: '065',
    archiveCategory: 'TYPE + PUBLIC IMAGE',
    connectsFrom: ['UES-105', 'UES-106', 'UES-108'],
    budgetUsd: 3_400,
    addedProductionNeed:
      'Print proofs, format testing, and accessibility-production review.',
  },
  {
    code: 'UES-204',
    slug: 'living-archive',
    title: 'Living Archive: Oral History, Image & Sound',
    status: 'active',
    frame:
      'Practice keeping as a relationship: listen carefully, request consent, preserve enough context, and make a record another person can understand without claiming ownership of their life.',
    outcome:
      'One consented oral-history or object-story record containing edited audio or transcript, an image, metadata, and a clear rights statement.',
    path: '/ues/living-archive',
    jsonPath: '/ues/living-archive.json',
    weeklyCommitment: STANDARD_WEEKLY_COMMITMENT,
    access: [
      ...SHARED_ACCESS,
      'A self-authored memory or public-domain object-study path when interviewing another person is inappropriate or unavailable.',
    ],
    materials: [
      'Phone, recorder, or text-only interview method',
      'Scanner, phone camera, or descriptive object-record option',
      'Headphones when available',
      'Secure temporary storage for consented working files',
    ],
    instructorProfile:
      'An oral historian, librarian, community archivist, or audio producer experienced in consent, rights-aware publication, listening, and humane editing.',
    soloPath:
      'Document a self-owned object, personal memory, or public-domain record and make the same consent and rights decisions explicit. Interviewing another person is optional and never changes the completion standard.',
    assignments: [
      {
        title: 'Consent and interview plan',
        dueWeek: 2,
        brief:
          'Write the purpose, invitation or self-owned-object boundary, recording choice, withdrawal path, access limits, and intended afterlife before collecting material.',
      },
      {
        title: 'Ten-minute interview or object scan',
        dueWeek: 4,
        brief:
          'Collect one bounded, consented story or document one self-owned or public-domain object with context.',
      },
      {
        title: 'Living archive record',
        dueWeek: 6,
        brief:
          'Publish or privately deposit an edited record with image, transcript or audio, metadata, rights, credits, and preservation copy.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Consent, Care, and the Ethics of Keeping',
        question:
          'What right do we have to keep, edit, or publish another person’s story?',
        sourceShelf: [
          'Oral History Association ethics and consent principles',
          'Community archive consent and withdrawal examples',
          'UES-107 public-memory boundary',
        ],
        studio:
          'Separate permission to listen, record, edit, preserve, publish, identify, and mint.',
        fieldTask:
          'Write a purpose statement and run the consent-map self-check. Optional peer feedback may precede an optional interview, but the self-check and object-story route count equally.',
        publicReceipt:
          'A reusable plain-language consent map with distinct yes, no, later, and withdraw choices.',
      },
      {
        week: 2,
        title: 'Listening and Interviewing',
        question: 'How can a small question open a story without steering it?',
        sourceShelf: [
          'Open-ended interview question patterns',
          'Active listening and silence exercises',
          'Trauma-aware boundary and referral prompts',
        ],
        studio:
          'Practice opening, follow-up, silence, correction, scope, and a respectful ending through a scripted solo rehearsal; optional paired practice counts the same.',
        fieldTask:
          'Complete a short unrecorded solo listening rehearsal using a self-owned memory or object and revise the plan. Rehearsing with another person is optional.',
        publicReceipt:
          'The final interview or object-story plan without private participant information.',
      },
      {
        week: 3,
        title: 'Record, Scan, Describe',
        question:
          'What technical choices preserve meaning without creating unnecessary risk?',
        sourceShelf: [
          'Basic audio recording and room-tone guidance',
          'Library scanning and descriptive metadata basics',
          'Secure file naming, storage, and backup checklist',
        ],
        studio:
          'Run simple phone recording, scanning, photography, transcription, and description demonstrations.',
        fieldTask:
          'Record the bounded interview or document the selected object using the agreed consent path.',
        publicReceipt:
          'A redacted technical log naming format, duration, backup, and any access restrictions.',
      },
      {
        week: 4,
        title: 'Edit Without Rewriting a Life',
        question: 'What can be shortened, reordered, clarified, or left alone?',
        sourceShelf: [
          'Oral-history transcript editing conventions',
          'Audio edit, ellipsis, correction, and review practices',
          'Examples of participant review before release',
        ],
        studio:
          'Edit a short excerpt, mark every intervention, and test the difference between clarity and distortion.',
        fieldTask:
          'Prepare the draft record and run the editorial-integrity self-check. For an optional interview, return it to the participant for correction or reaffirmed consent; the self-owned-object path needs no outside approval.',
        publicReceipt:
          'An editorial decision log that does not expose restricted content.',
      },
      {
        week: 5,
        title: 'Metadata, Rights, Context, Omission',
        question: 'What must travel with the record, and what must not?',
        sourceShelf: [
          'Dublin Core-inspired descriptive fields in plain language',
          'Copyright, license, traditional-knowledge, and privacy distinctions',
          'Portable archive and checksum checklist',
        ],
        studio:
          'Build a compact record with title, creator, contributor, date, place, description, rights, access, format, and source.',
        fieldTask:
          'Complete metadata, rights statement, accessibility assets, preservation copy, and deletion/withdrawal instructions.',
        publicReceipt:
          'A metadata card with restricted fields visibly withheld rather than silently missing.',
      },
      {
        week: 6,
        title: 'Open a Listening Room',
        question:
          'How can an archive invite attention without turning a person into content?',
        sourceShelf: [
          'Small listening-room and community exhibition formats',
          'Content note, transcript, image-description, and quiet-access examples',
          'Archive stewardship and correction policy templates',
        ],
        studio:
          'Conduct a final rights, context, access, and preservation self-review. Participant review applies only to an optional interview, and a listening room is optional.',
        fieldTask:
          'Finish the living archive record and choose public, limited, delayed, or private deposit.',
        publicReceipt:
          'A private-by-default record or, optionally, a public catalog stub describing why the record remains limited or private; either counts equally.',
      },
    ],
    archiveWorkNumber: '165',
    archiveCategory: 'ARCHIVE + MEMORY',
    connectsFrom: ['UES-102', 'UES-107'],
    budgetUsd: 3_700,
    addedProductionNeed:
      'Archive storage, rights support, and a specialist guest honorarium.',
  },
  {
    code: 'UES-205',
    slug: 'collective-intelligence-studio',
    title:
      'Collective Intelligence Studio: Humans, Agents & Editorial Judgment',
    status: 'active',
    frame:
      'Build human-agent workflows in which tools expand the field of possibility while people remain accountable for sources, decisions, omissions, and the finished public claim.',
    outcome:
      'A sourced research dossier or creative work accompanied by a legible process ledger showing what the learner, tools, and sources each contributed.',
    path: '/ues/collective-intelligence-studio',
    jsonPath: '/ues/collective-intelligence-studio.json',
    weeklyCommitment: STANDARD_WEEKLY_COMMITMENT,
    access: [
      ...SHARED_ACCESS,
      'Shared class tool access or a no-paid-model path so personal AI subscriptions are not required.',
    ],
    materials: [
      'Browser and text editor',
      'Shared source notebook template',
      'Access to at least one class-provided language or image model',
      'No coding experience required',
    ],
    instructorProfile:
      'An editor or creative technologist with strong source verification, authorship, privacy, model-literacy, and collaborative production practices.',
    soloPath:
      'Run researcher, tool operator, and editor as distinct passes. Keep the process ledger honest about each role; no team or paid model subscription is required.',
    assignments: [
      {
        title: 'Prompt and source notebook',
        dueWeek: 2,
        brief:
          'Keep claims, sources, prompts, model outputs, human edits, uncertainties, and discarded paths in distinct fields.',
      },
      {
        title: 'Human-agent process map',
        dueWeek: 4,
        brief:
          'Diagram which human pass or tool proposes, checks, decides, edits, attributes, and signs off at each stage of a one-person workflow; collaboration is optional.',
      },
      {
        title: 'Dossier and process ledger',
        dueWeek: 6,
        brief:
          'Package the finished work privately with sources, limitations, authorship statement, material model use, and the learner’s final sign-off. Publication is optional.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Define the Roles',
        question:
          'Which work can a tool propose, and which decisions must a named person own?',
        sourceShelf: [
          'UES-106 authorship and disclosure principles',
          'Examples of editor, researcher, generator, critic, verifier, and approver roles',
          'PointCast human-AI collaboration ledger patterns',
        ],
        studio:
          'Decompose a small project into proposing, retrieving, checking, deciding, making, editing, and approving.',
        fieldTask:
          'Observe one existing workflow and mark where automation helps, obscures, or falsely appears authoritative.',
        publicReceipt:
          'A first human-agent responsibility map naming the learner’s final editorial decision point; optional collaborators may be added.',
      },
      {
        week: 2,
        title: 'Build a Trustworthy Source Trail',
        question:
          'Can every important public claim travel back to evidence a person can inspect?',
        sourceShelf: [
          'Primary-source hierarchy and lateral-reading prompts',
          'Citation, quotation, paraphrase, and uncertainty examples',
          'Model hallucination and retrieval-failure cases',
        ],
        studio:
          'Trace claims through search, retrieval, model summaries, and human verification without treating fluency as evidence.',
        fieldTask:
          'Build a five-source shelf around the research question and independently verify one model-generated claim from primary evidence.',
        publicReceipt:
          'A source notebook excerpt showing one confirmed, one corrected, and one unresolved claim.',
      },
      {
        week: 3,
        title: 'Prompts Are Sketches',
        question:
          'How can prompting widen a search without quietly deciding the answer?',
        sourceShelf: [
          'Prompt variation and comparative-output exercises',
          'Creative constraint and editorial brief examples',
          'Image, text, and code provenance prompts',
        ],
        studio:
          'Run divergent prompts, compare outputs, annotate assumptions, and write an editorial brief before selecting material.',
        fieldTask:
          'Generate three meaningfully different approaches and document why the learner’s editorial pass rejects at least one.',
        publicReceipt:
          'A prompt triptych with output differences, editorial notes, and material model disclosure.',
      },
      {
        week: 4,
        title: 'Design the Handoffs',
        question:
          'Where does information get lost when a project moves between people and agents?',
        sourceShelf: [
          'Editorial checklist and stage-gate examples',
          'Structured brief, schema, and handoff patterns',
          'Version, source, and approval ledger examples',
        ],
        studio:
          'Turn an improvised one-person process into explicit inputs, outputs, checks, stop conditions, and self-attested decision gates; optional team handoffs may be mapped too.',
        fieldTask:
          'Run one simulated self-handoff between two named passes and record ambiguity, duplication, and failure points. An optional collaborator handoff uses the same standard and counts equally.',
        publicReceipt:
          'The revised human-agent process map and one concrete rule added after the test.',
      },
      {
        week: 5,
        title: 'Red-Team the Work',
        question:
          'What would make this work misleading, harmful, derivative, private, or wrong?',
        sourceShelf: [
          'Bias, privacy, fabrication, and sensitive-data review prompts',
          'Copyright, style imitation, and synthetic-media disclosure cases',
          'Adversarial fact-check and counterexample methods',
        ],
        studio:
          'Run the supplied adversarial self-review: try to disprove major claims, test rights and privacy, and identify missing affected perspectives. An exchanged dossier is optional.',
        fieldTask:
          'Resolve or explicitly label every high-risk issue in the self-generated red-team report. Optional peer findings use the same standard.',
        publicReceipt:
          'A red-team disposition list: fixed, disclosed, removed, or unresolved.',
      },
      {
        week: 6,
        title: 'Publish the Ledger',
        question:
          'Can another person understand how the work was made and where judgment entered?',
        sourceShelf: [
          'Public process-ledger examples',
          'Model and dataset disclosure fields',
          'UES portable archive and correction-path checklist',
        ],
        studio:
          'Complete editorial review, source audit, authorship statement, limitation note, and correction route.',
        fieldTask:
          'Package the final dossier with its process ledger and record the learner’s final self-attestation. If optional collaborators are named, their approval is needed only for their contributions.',
        publicReceipt:
          'A private-by-default work package with inspectable sources, process ledger, limitations, credits, and correction note; publication is optional.',
      },
    ],
    archiveWorkNumber: '253',
    archiveCategory: 'AI + COLLECTIVE',
    connectsFrom: ['UES-106', 'UES-107', 'UES-108'],
    budgetUsd: 3_300,
    addedProductionNeed:
      'Shared model and API credits so participation does not depend on personal subscriptions.',
    boundary:
      'No sensitive personal data, deceptive synthetic media, unlicensed imitation, or unsupported factual publication.',
  },
  {
    code: 'UES-206',
    slug: 'common-table',
    title: 'Common Table: Hospitality as Civic Infrastructure',
    status: 'active',
    frame:
      'Practice invitation, access, facilitation, food or object prompts, conflict care, and follow-through as the working infrastructure of a good collective room.',
    outcome:
      'An accessible 45-minute gathering or one-person hospitality rehearsal with an invitation, run-of-show, micro-budget, access notes, and aftercare receipt.',
    path: '/ues/common-table',
    jsonPath: '/ues/common-table.json',
    weeklyCommitment: STANDARD_WEEKLY_COMMITMENT,
    access: [
      ...SHARED_ACCESS,
      'Online-only gathering format and non-food participation path; no learner must host in a private home.',
    ],
    materials: [
      'Tabletop, phone timer, video room, phone bridge, or accessible gathering space',
      'Shared run-of-show and budget templates',
      'Optional food, flower, image, object, or music prompt',
      'Four optional project microgrants of $100 are included in the course budget',
    ],
    instructorProfile:
      'A community producer, hospitality worker, facilitator, or cultural organizer with practical accessibility, conflict-care, budget, and follow-through experience.',
    soloPath:
      'Rehearse the gathering alone, with a household member, or as a tabletop walkthrough. Evaluate the invitation, timing, access, budget, and aftercare without requiring guests.',
    assignments: [
      {
        title: 'Invitation test',
        dueWeek: 2,
        brief:
          'Write and revise an invitation with the supplied participant-scenario self-check. Sending it to a real person is optional and the simulation counts equally.',
      },
      {
        title: 'Accessibility walkthrough',
        dueWeek: 4,
        brief:
          'Rehearse the entire arrival-to-exit experience and document barriers, contingency paths, and named host responsibilities.',
      },
      {
        title: 'Micro-table rehearsal',
        dueWeek: 6,
        brief:
          'Complete a 45-minute tabletop or solo rehearsal and keep the invitation, run-of-show, micro-budget, access notes, and aftercare receipt private by default. Hosting or publishing is optional.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Why Should This Room Exist?',
        question:
          'What can happen together that should not be another feed, meeting, or performance?',
        sourceShelf: [
          'UES-108 gathering-purpose and public-receipt practice',
          'Examples of salons, teach-ins, kitchen tables, listening rooms, and online circles',
          'Participation, extraction, and host-accountability prompts',
        ],
        studio:
          'Distinguish audience, participants, guests, collaborators, hosts, and people affected but absent.',
        fieldTask:
          'Use two supplied participant scenarios to compare a gathering someone might join with one they might avoid. An optional interview may replace or supplement the simulation.',
        publicReceipt:
          'A one-paragraph purpose, non-purpose, and promise to participants.',
      },
      {
        week: 2,
        title: 'Invitation, Welcome, Access',
        question:
          'What must someone know before saying yes, and what should never surprise them on arrival?',
        sourceShelf: [
          'Plain-language invitation and access-note examples',
          'RSVP privacy and minimal-data patterns',
          'Online, sensory, mobility, language, food, and care access prompts',
        ],
        studio:
          'Write invitations that name purpose, timing, cost, format, access, privacy, recording, and a real contact.',
        fieldTask:
          'Run the invitation through the supplied question-and-access self-check and revise it. Sending it to an intended participant is optional and counts the same.',
        publicReceipt: 'The tested invitation and a short revision log.',
      },
      {
        week: 3,
        title: 'Shape the Rhythm',
        question: 'How should attention move through forty-five minutes?',
        sourceShelf: [
          'Run-of-show and facilitation-score examples',
          'Arrival, threshold, small-group, pause, and closing patterns',
          'Timekeeping and online-room production basics',
        ],
        studio:
          'Build a minute-by-minute gathering score with a purpose for every transition.',
        fieldTask:
          'Time a fifteen-minute tabletop fragment using the supplied participation scenarios and record where energy, clarity, or access drops. Rehearsing with peers is optional.',
        publicReceipt:
          'Run-of-show version one with host roles and contingency branches.',
      },
      {
        week: 4,
        title: 'Host and Facilitate',
        question:
          'How does a host share attention without abandoning responsibility?',
        sourceShelf: [
          'Opening agreements and participatory facilitation prompts',
          'Turn-taking, chat, silence, and small-group methods',
          'Food, object, image, and music prompt examples',
        ],
        studio:
          'Role-play arrival, uneven participation, technical failure, dominant voices, silence, and a late guest.',
        fieldTask:
          'Complete the accessibility walkthrough from invitation through follow-up using the supplied barrier scenarios. An optional outside tester may supplement the same check.',
        publicReceipt:
          'An access-and-hosting checklist naming the person responsible for each promise.',
      },
      {
        week: 5,
        title: 'Conflict, Care, and Graceful Endings',
        question:
          'What can the room hold, and when must the host pause, redirect, or stop?',
        sourceShelf: [
          'Scope, community agreement, and escalation examples',
          'De-escalation, repair, removal, and referral prompts',
          'Aftercare, follow-up, and data-deletion checklist',
        ],
        studio:
          'Practice boundary statements, interruptions, repair invitations, endings, and post-event care without pretending hosts are clinicians.',
        fieldTask:
          'Write a proportionate response path for three plausible gathering failures.',
        publicReceipt: 'A one-page host care and escalation plan.',
      },
      {
        week: 6,
        title: 'Complete the Table, Keep the Receipt',
        question:
          'What should a future participant, funder, or host be able to understand afterward?',
        sourceShelf: [
          'UES transparent micro-budget template',
          'Participant feedback and privacy-minimal evaluation prompts',
          'Reusable host-kit and season-receipt examples',
        ],
        studio:
          'Run one full solo or tabletop rehearsal, self-debrief from host and participant viewpoints, and separate private care notes from any optionally shared learning.',
        fieldTask:
          'Complete a simulated closeout: reconcile the micro-budget, delete any practice data, and finish the host kit. Real follow-up or reimbursements apply only if the learner optionally hosted guests.',
        publicReceipt:
          'A private-by-default invitation, run-of-show, micro-budget, access notes, learning receipt, and reusable source files; hosting or sharing is optional.',
      },
    ],
    archiveWorkNumber: '205',
    archiveCategory: 'HOSPITALITY + COMMONS',
    connectsFrom: ['UES-102', 'UES-108'],
    budgetUsd: 3_500,
    addedProductionNeed:
      'Four $100 optional project grants for access, food, materials, or room costs.',
  },
  {
    code: 'UES-207',
    slug: 'plant-portraits',
    title: 'Plant Portraits: Form, Lineage & Cultural Memory',
    status: 'active',
    frame:
      'Join botanical looking, introductory lineage study, cultural history, image making, and typography without reducing a living plant to decoration or commodity.',
    outcome:
      'A sourced four-page illustrated plant portrait plus one private lineage panel, with optional contribution to a shared visual lineage wall.',
    path: '/ues/plant-portraits',
    jsonPath: '/ues/plant-portraits.json',
    weeklyCommitment: STANDARD_WEEKLY_COMMITMENT,
    access: [
      ...SHARED_ACCESS,
      'Online-herbarium, grocery, houseplant, and instructor-provided image paths when outdoor plant access is unavailable.',
    ],
    materials: [
      'Sketchbook, phone camera, or accessible descriptive-notes method',
      'One legal, safely observable plant or public herbarium record',
      'Basic image and layout tool',
      'No plant purchase, consumption, or cultivation activity required',
    ],
    instructorProfile:
      'A botanical artist or naturalist able to teach close looking and cultural context, joined by a botanist, geneticist, cultural historian, or experienced legal grower as guest faculty.',
    soloPath:
      'Use a houseplant, grocery specimen, legal public garden, or online herbarium. Observation, sourcing, illustration, and lineage work can all be completed privately.',
    assignments: [
      {
        title: 'Non-destructive plant observation',
        dueWeek: 2,
        brief:
          'Study one safely and legally observable plant through form, change, uncertainty, and at least two modes of description.',
      },
      {
        title: 'Lineage diagram',
        dueWeek: 4,
        brief:
          'Make a careful visual diagram distinguishing documented lineage, taxonomic relationship, cultural naming, and unresolved claims.',
      },
      {
        title: 'Illustrated plant portrait',
        dueWeek: 6,
        brief:
          'Complete a private-by-default four-page portrait joining form, lineage, cultural memory, sources, credits, and meaningful image description. Publication is optional.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Close Looking and Uncertain Naming',
        question:
          'What can we honestly say about a plant before attaching a confident name?',
        sourceShelf: [
          'UES-103 Flower Commons observation practice',
          'Botanical illustration and herbarium-sheet examples',
          'Citizen-science identification and uncertainty labels',
        ],
        studio:
          'Observe silhouette, node, vein, surface, rhythm, color, scale, and change without rushing to identification.',
        fieldTask:
          'Study one legal plant through image, drawing, sound, touch-safe description, or written visual description.',
        publicReceipt:
          'A first plant plate separating observed features from proposed names.',
      },
      {
        week: 2,
        title: 'Anatomy, Architecture, Season',
        question: 'How does plant form record growth, environment, and time?',
        sourceShelf: [
          'Introductory plant morphology diagrams',
          'Seasonal growth and phenology observation guides',
          'Architectural drawing and visual-analysis references',
        ],
        studio:
          'Read roots, stems, nodes, leaves, flowers, fruit, branching, and seasonal state as a living structure.',
        fieldTask:
          'Make three scaled studies of the plant at whole, branch, and detail levels.',
        publicReceipt:
          'An annotated morphology sheet with accessible description.',
      },
      {
        week: 3,
        title: 'Reproduction, Lineage, Genetics',
        question:
          'What is inherited, selected, cloned, crossed, named, marketed, or merely claimed?',
        sourceShelf: [
          'Introductory inheritance, variation, and reproduction concepts',
          'Cultivar, variety, hybrid, clone, landrace, and strain terminology',
          'UES-104 sourced cannabis glossary boundary',
        ],
        studio:
          'Distinguish taxonomic relationship, documented breeding, commercial naming, cultural lineage, and uncertainty.',
        fieldTask:
          'Trace one plant name through three sources and mark agreement, conflict, missing evidence, and marketing language.',
        publicReceipt:
          'A draft lineage diagram with confidence labels and citations.',
      },
      {
        week: 4,
        title: 'People, Symbols, Trade, Law',
        question:
          'Whose labor, knowledge, ritual, restrictions, and stories travel with this plant?',
        sourceShelf: [
          'Ethnobotanical and cultural-history source prompts',
          'Trade, naming, appropriation, prohibition, and stewardship case studies',
          'Local-law and age-boundary source checklist',
        ],
        studio:
          'Place the plant inside human systems without making cultural or medical claims the sources cannot support.',
        fieldTask:
          'Add one sourced cultural-memory panel and one explicit boundary or omission to the portrait.',
        publicReceipt:
          'A private-by-default lineage panel with scientific, commercial, and cultural claims visibly distinguished; adding it to a shared wall is optional.',
      },
      {
        week: 5,
        title: 'Translate Knowledge into Image and Type',
        question: 'What visual form honors both beauty and evidence?',
        sourceShelf: [
          'Botanical plate, field-guide, poster, seed-catalog, and protest-image examples',
          'UES-105 type-system and source-credit practice',
          'Image provenance and meaningful alt-text guidance',
        ],
        studio:
          'Combine observation, diagram, archive, text, color, and type into a coherent four-page portrait.',
        fieldTask:
          'Make the complete portrait draft and run the supplied botany, culture, source, and access self-check. An optional exchanged critique may supplement it and counts the same.',
        publicReceipt:
          'A review ledger showing one self-checked correction in each of the four dimensions.',
      },
      {
        week: 6,
        title: 'Open the Plant Portraits',
        question:
          'How can the exhibition remain beautiful, careful, correctable, and alive?',
        sourceShelf: [
          'Collective botanical exhibition formats',
          'Correction, update, and seasonal-revisit patterns',
          'UES portable archive and optional minting boundary',
        ],
        studio:
          'Sequence the personal lineage panel and portrait, then run the final source-and-boundary self-audit. Joining a shared wall or public reading is optional.',
        fieldTask:
          'Finish the portrait, source list, credits, access assets, and one future seasonal observation prompt.',
        publicReceipt:
          'A private-by-default plant portrait and lineage panel with a correction note and next-observation date; publishing is optional.',
      },
    ],
    archiveWorkNumber: '005',
    archiveCategory: 'BOTANY + LINEAGE',
    connectsFrom: ['UES-103', 'UES-104', 'UES-105'],
    budgetUsd: 3_600,
    addedProductionNeed:
      'Botanical guest faculty and accessible observation kits.',
    boundary:
      'Legal specimens and public information only. Cannabis examples remain 21+, educational, and non-medical, with no consumption or unlawful cultivation instruction.',
  },
  {
    code: 'UES-208',
    slug: 'local-broadcast',
    title: 'Local Broadcast: Publish a Place',
    status: 'active',
    frame:
      'Build a small, accountable local publication from field reporting, visual language, sound, metadata, community editing, and a clear promise to the place it serves.',
    outcome:
      'One accessible six-item issue containing a dispatch, portrait, map, resource, image or audio card, and editor’s note, plus a reusable publishing kit.',
    path: '/ues/local-broadcast',
    jsonPath: '/ues/local-broadcast.json',
    weeklyCommitment: STANDARD_WEEKLY_COMMITMENT,
    access: [
      ...SHARED_ACCESS,
      'Remote archival, phone-reporting, and public-data beats when local field reporting is unavailable.',
    ],
    materials: [
      'Browser and text editor',
      'Phone camera, audio recorder, sketchbook, or text-only reporting path',
      'Course publishing templates and personal or shared file space',
      'No coding, domain purchase, or personal hosting account required',
    ],
    instructorProfile:
      'A local editor, independent publisher, radio producer, or web producer able to teach reporting judgment, visual and audio editing, lightweight distribution, and accountable corrections.',
    soloPath:
      'Act as a one-person newsroom in distinct reporting, editing, access, and production passes. Subject interviews are optional; public sources and self-authored field notes are sufficient.',
    assignments: [
      {
        title: 'Field dispatch',
        dueWeek: 2,
        brief:
          'Report and verify a 250-word local note with clear attribution, source links, location care, and one unresolved question.',
      },
      {
        title: 'Accessible media card',
        dueWeek: 4,
        brief:
          'Produce one image or audio card with caption, alt text or transcript, credits, rights, and compact metadata.',
      },
      {
        title: 'Local issue and publishing kit',
        dueWeek: 6,
        brief:
          'Complete the six-item issue through defined one-person production passes and leave a reusable workflow, template, feed mockup, correction path, and simulated handoff. Publication is optional.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Write the Editorial Promise',
        question:
          'What does this publication owe the place and people it names?',
        sourceShelf: [
          'PointCast local publishing and public-receipt patterns',
          'Independent neighborhood publication examples',
          'Editorial mission, scope, corrections, and conflicts templates',
        ],
        studio:
          'Define place, audience, beats, exclusions, evidence, voice, corrections, and the conditions under which the learner would not publish. A private issue remains fully complete.',
        fieldTask:
          'Run the supplied intended-reader scenario and note what feels useful, missing, extractive, or repetitive. An optional reader interview may supplement the simulation.',
        publicReceipt: 'A one-page editorial promise and corrections contact.',
      },
      {
        week: 2,
        title: 'Report, Listen, Verify',
        question:
          'What makes a small local note trustworthy enough to pass along?',
        sourceShelf: [
          'Primary-source and on-the-record reporting prompts',
          'Public records, local calendars, direct observation, and attribution basics',
          'Location privacy and vulnerable-source boundaries',
        ],
        studio:
          'Turn observation, document, public data, and an optional interview into a concise sourced dispatch without manufacturing certainty.',
        fieldTask:
          'Report a 250-word local dispatch and verify every name, date, location, quote, and public claim.',
        publicReceipt:
          'The finished dispatch, sources, attribution, and one clearly labeled unresolved question.',
      },
      {
        week: 3,
        title: 'Make with Text, Image, and Sound',
        question:
          'Which medium lets this local subject become more legible rather than merely more decorative?',
        sourceShelf: [
          'Photo essay, audio postcard, illustrated note, and data-card examples',
          'The El Segundo School public-image archive',
          'Consent, credit, caption, transcript, and alt-text practices',
        ],
        studio:
          'Build parallel versions of one local story as image, sound, and text, then choose the form that carries evidence best.',
        fieldTask:
          'Make a self-authored or public-domain media element and preserve its original, rights, source, and context. A consented contribution from another person is optional.',
        publicReceipt:
          'A media study showing the chosen and rejected format with editorial reasoning.',
      },
      {
        week: 4,
        title: 'Structure the Issue',
        question:
          'How can one issue remain useful on a phone, in print, in a feed, and after the platform changes?',
        sourceShelf: [
          'Semantic web page, RSS, JSON Feed, and printable digest basics',
          'Metadata, stable URL, credit, and archive checklist',
          'Low-bandwidth and assistive-technology reading order',
        ],
        studio:
          'Arrange dispatch, portrait, map, resource, media card, and editor’s note into one accessible issue system.',
        fieldTask:
          'Finish the accessible media card and test its small-screen, transcript or alt-text, credit, and rights fields.',
        publicReceipt: 'The media card plus a compact metadata record.',
      },
      {
        week: 5,
        title: 'Run the Community Edit',
        question:
          'What review should this receive before any optional publication, and what power should outside responses carry?',
        sourceShelf: [
          'Fact, source, sensitivity, copy, art, and access edit passes',
          'Subject review versus editorial independence examples',
          'Corrections, takedown, update, and version-note policies',
        ],
        studio:
          'Run distinct fact, source, sensitivity, copy, art, and access self-edit passes and log material changes. Optional editors may supplement these passes without becoming a completion requirement.',
        fieldTask:
          'Complete the one-person production passes and respond to the full self-edit ledger. An optional community edit uses the same checklist and counts equally.',
        publicReceipt:
          'A redacted edit ledger showing checked, changed, disclosed, withheld, and unresolved items.',
      },
      {
        week: 6,
        title: 'Publish, Distribute, Hand Off',
        question:
          'Can the issue travel, be corrected, and be reproduced by another local team?',
        sourceShelf: [
          'PointCast page, feed, social-card, email, and print distribution patterns',
          'Portable archive, backup, and source-package checklist',
          'UES satellite 70/20/10 curriculum rule and local stewardship model',
        ],
        studio:
          'Test the issue locally in every route and format and rehearse a simulated handoff. Publication, distribution, and a real future-city handoff are optional.',
        fieldTask:
          'Finish every defined one-person production pass, create the reusable publishing kit, and name the next local reporting question.',
        publicReceipt:
          'A private-by-default six-item issue, feed mockup or portable export, credits, corrections path, source package, and simulated steward handoff; going live is optional.',
      },
    ],
    archiveWorkNumber: '373',
    archiveCategory: 'BROADCAST + PLACE',
    connectsFrom: ['UES-105', 'UES-106', 'UES-107', 'UES-108'],
    budgetUsd: 3_400,
    addedProductionNeed:
      'Hosting, feed, archive, and lightweight publishing utilities.',
  },
  {
    code: 'UES-209',
    slug: 'repair-manual-care-maintenance-everyday',
    title: 'Repair Manual: Care, Maintenance & the Everyday',
    status: 'active',
    frame:
      'Treat maintenance as local knowledge: read wear, diagnose carefully, decide when not to intervene, and explain one safe care practice so another person can use it.',
    outcome:
      'An accessible illustrated care manual for one ordinary object or shared-place condition, including a diagnostic tree, safety boundary, materials and cost notes, maintenance interval, and handoff.',
    path: '/ues/repair-manual-care-maintenance-everyday',
    jsonPath: '/ues/repair-manual-care-maintenance-everyday.json',
    weeklyCommitment: {
      selfGuidedStudioMinutes: 45,
      fieldworkMinutes: { minimum: 90, maximum: 120 },
      reflectionMinutes: 15,
      total: 'About 2.5–3 self-paced hours each week',
    },
    access: [
      ...SHARED_ACCESS,
      'A paper-and-pencil path is available for every digital diagram or photo task.',
      'Documenting a condition and writing a safe escalation plan meets the standard; attempting a repair never does.',
      'Every assignment has a no-tool, no-purchase path.',
    ],
    materials: [
      'One ordinary low-risk object, maintenance question, or shared-place condition',
      'Notebook or notes app',
      'Phone camera or sketchbook',
      'Optional basic hand tools; no specialized equipment required',
    ],
    instructorProfile:
      'A repair educator, industrial designer, maintenance professional, or community maker able to teach diagnosis, safe stopping points, plain-language diagrams, and material care.',
    soloPath:
      'Work with one low-risk object you already control. Observation, a diagnostic plan, and a qualified-help handoff fully satisfy the course; no repair attempt or second person is required.',
    assignments: [
      {
        title: 'Care and wear audit',
        dueWeek: 2,
        brief:
          'Document one object or condition, its history, visible wear, current function, sources, safety limits, and whether care, repair, referral, or replacement is responsible.',
      },
      {
        title: 'Diagnostic decision tree',
        dueWeek: 4,
        brief:
          'Turn observations into a decision tree that separates evidence from guesses and includes stop-work, escalation, materials, cost, and waste considerations.',
      },
      {
        title: 'Illustrated care manual',
        dueWeek: 6,
        brief:
          'Produce a usable manual with ordered steps, diagrams or descriptions, safety boundary, sources, maintenance schedule, accessibility assets, revision date, and correction path.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Read the Wear',
        question:
          'What can an ordinary object tell us before we decide it is broken?',
        sourceShelf: [
          'Repair Café observation and repairability checklists',
          'Manufacturer care labels and maintenance schedules',
          'UES-101 systems-and-repair field prompts',
        ],
        studio:
          'Follow a guided visual audit that distinguishes dirt, wear, looseness, damage, missing information, and normal aging.',
        fieldTask:
          'Choose one low-risk object or shared-place condition and record five observations without taking it apart.',
        publicReceipt:
          'A private or shareable condition card with image or sketch, object history, five observations, and one unanswered question.',
      },
      {
        week: 2,
        title: 'Know When Not to Touch',
        question:
          'When is maintenance appropriate, and when should a learner stop, refer, or replace?',
        sourceShelf: [
          'Product safety labels, warranties, and service manuals',
          'Right-to-repair and local disposal guidance',
          'Stop-work, escalation, and hazard-identification checklists',
        ],
        studio:
          'Use a risk matrix to classify a task as observe, maintain, attempt, seek qualified help, or retire responsibly.',
        fieldTask:
          'Complete the care and wear audit, locate two reliable sources, and write a stop-work boundary before considering any intervention.',
        publicReceipt:
          'A decision note naming the responsible next step, supporting evidence, sources, and safety boundary.',
      },
      {
        week: 3,
        title: 'Diagnose Before Buying',
        question:
          'What small test can distinguish a likely cause from an attractive guess?',
        sourceShelf: [
          'Failure-mode and fault-tree examples',
          'Before-and-after documentation conventions',
          'Reuse, replacement, and total-cost comparisons',
        ],
        studio:
          'Build a hypothesis table linking each observed symptom to a possible cause, safe test, result, and next decision.',
        fieldTask:
          'Run only reversible, low-risk checks or document the checks a qualified person would need to perform.',
        publicReceipt:
          'A diagnostic table showing observation, hypothesis, test or referral, result, uncertainty, and next action.',
      },
      {
        week: 4,
        title: 'Make the Instructions Legible',
        question:
          'Can another person understand the care sequence without borrowing the author’s assumptions?',
        sourceShelf: [
          'Exploded diagrams, parts lists, and step-sequence examples',
          'Plain-language and accessible-instruction guidelines',
          'Photo, caption, and alt-text practices',
        ],
        studio:
          'Translate the diagnostic process into an ordered decision tree using verbs, checkpoints, diagrams or descriptions, and stopping conditions.',
        fieldTask:
          'Finish the diagnostic decision tree and create one visual version plus a complete text-only equivalent.',
        publicReceipt:
          'The decision tree with estimated time, materials, costs, access notes, and stop-work points.',
      },
      {
        week: 5,
        title: 'Test the Manual',
        question:
          'Where does an instruction fail when its author is no longer there to explain it?',
        sourceShelf: [
          'Cold-read testing and usability checklists',
          'Version notes and correction logs',
          'Maintenance intervals and spare-parts records',
        ],
        studio:
          'Set the draft aside, then conduct a supplied cold-read test; another tester is welcome but never required.',
        fieldTask:
          'Run every safe step or simulate it on paper, mark ambiguity and missing prerequisites, and revise at least three points.',
        publicReceipt:
          'A private or shared test log showing what confused the reader, what changed, and what still requires qualified help.',
      },
      {
        week: 6,
        title: 'Leave a Care Trail',
        question:
          'What would help the next keeper maintain this object or condition instead of beginning again?',
        sourceShelf: [
          'Open repair-manual and portable archive patterns',
          'Attribution, licensing, and source-note checklist',
          'Local library, tool-lending, and repair-café directory examples',
        ],
        studio:
          'Assemble the manual, run final safety and accessibility checks, and create a maintenance date and correction path.',
        fieldTask:
          'Finish the illustrated care manual and save a portable source package that another learner could revise.',
        publicReceipt:
          'Completed manual or private equivalent with credits, sources, revision date, maintenance interval, and handoff note.',
      },
    ],
    archiveWorkNumber: '649',
    archiveCategory: 'CARE + MAINTENANCE',
    connectsFrom: ['UES-101', 'UES-102', 'UES-105', 'UES-108'],
    budgetUsd: 3_450,
    addedProductionNeed:
      'Safety review, accessible diagram templates, and optional low-risk repair micro-kits.',
    boundary:
      'Low-risk observation and care only. No electrical, gas, structural, medical, vehicle-safety, hazardous-material, weapon, or unlawful work; stop and seek qualified help whenever a source, label, or checklist requires it.',
  },
  {
    code: 'UES-210',
    slug: 'listening-post-soundwalks-acoustic-commons',
    title: 'Listening Post: Soundwalks & the Acoustic Commons',
    status: 'active',
    frame:
      'Hear one place as a layered public system: notice rhythm, refuge, noise, voice, weather, machines, and other species, then shape those observations into an ethical and accessible listening route.',
    outcome:
      'A five-minute listening route or stationary sonic atlas with field recording or non-audio score, map, transcript or description, context, consent notes, and a reusable observation prompt.',
    path: '/ues/listening-post-soundwalks-acoustic-commons',
    jsonPath: '/ues/listening-post-soundwalks-acoustic-commons.json',
    weeklyCommitment: {
      selfGuidedStudioMinutes: 45,
      fieldworkMinutes: { minimum: 90, maximum: 120 },
      reflectionMinutes: 15,
      total: 'About 2.5–3 self-paced hours each week',
    },
    access: [
      ...SHARED_ACCESS,
      'A notebook-based sound score fully replaces recording equipment, headphones, or hearing-dependent tasks.',
      'Every route can be completed from one safe indoor location, through memory, or with public archival audio.',
      'A text-score path completes the whole course without an audio editor.',
    ],
    materials: [
      'Notebook or notes app',
      'Phone recorder or any audio recorder, optional',
      'Headphones, optional and never required outdoors',
      'Simple map, hand-drawn route, or stationary observation grid',
    ],
    instructorProfile:
      'A sound artist, radio producer, acoustic ecologist, musician, or field recordist able to teach close listening, recording ethics, accessible audio, and restrained editing.',
    soloPath:
      'Listen from one safe place using sound, written notation, drawing, vibration, memory, or public archival audio. Travel, recording equipment, hearing-dependent work, and another person are never required.',
    assignments: [
      {
        title: 'Repeated sound inventory',
        dueWeek: 2,
        brief:
          'Observe the same place three times and document foreground, middle distance, background, rhythm, interruption, refuge, weather, time, and uncertainty through audio or notation.',
      },
      {
        title: 'Ethical sonic map',
        dueWeek: 4,
        brief:
          'Map a short route or stationary listening field with four stops, access and safety alternatives, privacy decisions, consent notes, and one non-audio reading path.',
      },
      {
        title: 'Listening post',
        dueWeek: 6,
        brief:
          'Edit the observations into a five-minute route or atlas with recording or score, transcript or equivalent description, credits, metadata, source files, and a future listening prompt.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Hear the Layers',
        question:
          'What enters attention when we listen for distance, rhythm, masking, and change before naming sounds?',
        sourceShelf: [
          'National Park Service soundscape listening prompts',
          'Acoustic ecology and soundwalk score examples',
          'UES local observation and field-note practice',
        ],
        studio:
          'Follow a guided three-minute listen, first marking distance and rhythm, then naming possible sources and uncertainty.',
        fieldTask:
          'Make three short listening studies from one safe place using audio, written notation, drawing, vibration, or remembered sound.',
        publicReceipt:
          'A private or shareable layered listening card with time, place, conditions, method, and three unresolved sounds.',
      },
      {
        week: 2,
        title: 'Return at Another Hour',
        question:
          'How does one place change when time, weather, traffic, work, or other species change?',
        sourceShelf: [
          'One-minute field-recording and written sound-score examples',
          'Time, weather, distance, direction, and device metadata',
          'Headphone safety and hearing-access alternatives',
        ],
        studio:
          'Compare two observations without treating volume, device measurements, or memory as perfect evidence.',
        fieldTask:
          'Complete the repeated sound inventory across three times, or use three time-stamped public recordings when returning is unavailable.',
        publicReceipt:
          'A three-column comparison naming stable sounds, changes, missing information, and one possible cause labeled as inference.',
      },
      {
        week: 3,
        title: 'Listen Without Taking',
        question:
          'When does recording a place become an intrusion into people, habitat, work, or refuge?',
        sourceShelf: [
          'Consent and incidental-conversation recording guidance',
          'Wildlife-safe observation and sensitive-location practices',
          'Transcript, caption, and audio-description conventions',
        ],
        studio:
          'Apply a record, relocate, wait, describe-only, or do-not-document decision to six field scenarios.',
        fieldTask:
          'Write a recording boundary, avoid intelligible private conversation, and make one consented, public, environmental, archival, or notation-only study.',
        publicReceipt:
          'An ethics note documenting what was recorded, omitted, moved, disguised, described instead, or left private—and why.',
      },
      {
        week: 4,
        title: 'Map the Acoustic Commons',
        question:
          'Where do people encounter sound, quiet, warning, masking, invitation, and exclusion along one route?',
        sourceShelf: [
          'Sonic map, route score, and accessibility-audit examples',
          'Public right-of-way and daytime-route safety prompts',
          'Noise, refuge, masking, rhythm, and threshold vocabulary',
        ],
        studio:
          'Turn observations into four ordered stops with duration, direction, access alternative, safety note, and listening instruction.',
        fieldTask:
          'Complete the ethical sonic map as a short route or stationary four-zone field; travel is never required.',
        publicReceipt:
          'The map with four listening prompts, access and safety alternatives, privacy decisions, and a text-only version.',
      },
      {
        week: 5,
        title: 'Edit Without Erasing Place',
        question:
          'How much shaping helps attention, and when does cleanup manufacture a place that was never heard?',
        sourceShelf: [
          'Basic edit, level, fade, and file-export guidance',
          'Non-audio equivalents: notation, text score, and spectrogram description',
          'Credit, rights, provenance, and correction metadata',
        ],
        studio:
          'Build one lightly edited audio sequence or text score, retaining original files and documenting each material transformation.',
        fieldTask:
          'Create a five-minute draft, write its transcript or equivalent description, and check it without relying on sound alone.',
        publicReceipt:
          'A draft sequence plus an edit ledger naming cuts, fades, level changes, omissions, sources, and uncertainties.',
      },
      {
        week: 6,
        title: 'Open the Listening Post',
        question:
          'What can a future listener revisit, correct, or hear differently?',
        sourceShelf: [
          'Accessible web-audio and downloadable archive checklist',
          'Portable metadata and stable-file naming practices',
          'Community listening and optional Tezos publication boundary',
        ],
        studio:
          'Assemble the route or atlas, run privacy, access, credit, file, and route checks, and write a repeatable listening prompt.',
        fieldTask:
          'Finish the listening post and preserve its source recording or score, map, transcript, metadata, and private/public choice.',
        publicReceipt:
          'Completed listening post or private equivalent with map, access assets, ethics note, credits, correction path, and next-listen date.',
      },
    ],
    archiveWorkNumber: '509',
    archiveCategory: 'SOUND + PLACE',
    connectsFrom: ['UES-103', 'UES-105', 'UES-107', 'UES-108'],
    budgetUsd: 3_500,
    addedProductionNeed:
      'Guided listening assets, accessible audio hosting, transcript templates, and downloadable non-audio scores.',
    boundary:
      'No intelligible private conversations, covert recording, trespass, unsafe routes, or disturbance of wildlife or sensitive sites. A stationary, archival, memory-based, or notation-only path always counts equally.',
  },
];

export const UES_SEASON_ONE_BUDGET = {
  name: 'Online Season 1 — The Local Transmission',
  totalUsd: 46_600,
  coursePoolUsd: 34_500,
  sharedPoolUsd: 12_100,
  courseLines: UES_SEASON_ONE_COURSES.map((course) => ({
    code: course.code,
    title: course.title,
    amountUsd: course.budgetUsd,
    addedProductionNeed: course.addedProductionNeed,
  })),
  baseCourseAssumption: {
    totalUsd: 3_100,
    lines: [
      {
        label: 'Course editor and optional faculty',
        amountUsd: 1_800,
        purpose:
          'Maintain examples and instructions, review access, and offer optional supported sessions without gating the self-paced route.',
      },
      {
        label: 'Course steward',
        amountUsd: 750,
        purpose:
          'Access support, learner questions, optional cohort care, and documentation maintenance.',
      },
      {
        label: 'Accessible course materials',
        amountUsd: 300,
        purpose:
          'Transcripts, text equivalents, print paths, and accessibility review.',
      },
      {
        label: 'Artifact materials or microgrants',
        amountUsd: 250,
        purpose:
          'Remove small production barriers for the shared course outcome.',
      },
    ] satisfies readonly UesSeasonOneBudgetLine[],
  },
  sharedLines: [
    {
      label: 'Learner access grants',
      amountUsd: 4_000,
      purpose:
        'Connectivity, care, equipment, translation, and other participation barriers.',
    },
    {
      label: 'Platform and public archive',
      amountUsd: 2_100,
      purpose:
        'Course pages, streaming, shared storage, feeds, archive, and production utilities.',
    },
    {
      label: 'Legal, insurance, and administration',
      amountUsd: 2_500,
      purpose:
        'Qualified review, participant agreements, bookkeeping, insurance, and program administration.',
    },
    {
      label: 'Contingency',
      amountUsd: 3_500,
      purpose:
        'Protect paid teaching, access, and the public outcomes from ordinary pilot surprises.',
    },
  ] satisfies readonly UesSeasonOneBudgetLine[],
  perPlanningLearnerUsd: Math.round(
    46_600 / ONLINE_SEASON_ONE.planningLearners,
  ),
  planningNote:
    'Every self-paced course is active at $0. The planning target supports ongoing maintenance, access grants, material grants, and optional human review for 120 learners without capping public access.',
} as const;
