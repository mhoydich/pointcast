export type UesSeasonOneStatus = 'forming';

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
  | 'UES-208';

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
  liveStudioMinutes: number;
  asynchronousFieldworkMinutes: {
    minimum: number;
    maximum: number;
  };
  peerResponseMinutes: number;
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
  liveStudioMinutes: 75,
  asynchronousFieldworkMinutes: {
    minimum: 60,
    maximum: 90,
  },
  peerResponseMinutes: 20,
  total: 'About 2.5–3 hours each week',
};

const SHARED_ACCESS = [
  'Live captions and a transcript or equivalent access path for every studio.',
  'Low-bandwidth reading packet and downloadable assignment brief.',
  'Asynchronous equivalent for learners who cannot attend live.',
  'Private submission path when public participation would create risk or exclude the learner.',
] as const;

export const ONLINE_SEASON_ONE = {
  name: 'Online Season 1',
  theme: 'The Local Transmission',
  line: 'Eight studios turn local observation into a shared public commons.',
  status: 'forming' as const,
  durationWeeks: 6,
  learnerCapacity: 96,
  courseCount: 8,
  classSize: {
    minimum: 12,
    maximum: 18,
  },
  enrollmentModel:
    'The planning base is 96 unique learners: one home studio each, with every room opening at 12 and capped at 18. A learner may audit one elective when space allows.',
  weeklyRhythm: {
    monday: 'A faculty prompt and compact source shelf open the week.',
    midweek: 'Learners complete one 60–90 minute local field task or an equivalent remote path.',
    liveStudioMinutes: 75,
    sunday: 'Each learner leaves one peer response and one useful public or private receipt.',
  },
  staffingPerCourse: {
    faculty: 1,
    steward: 1,
  },
  completion:
    'Complete at least four of six field tasks, participate constructively in peer review, and finish the course public outcome or its private equivalent.',
  learnerPriceUsd: 0,
  fundingModel:
    'Tuition-free pilot funded through the shared UES pool. A contribution cannot purchase admission, curriculum control, or a different completion standard.',
  access: SHARED_ACCESS,
  rightsAndPublishing:
    'Learners retain copyright. Public licensing, wallet connection, and Tezos minting are optional and never required for enrollment or completion.',
} as const;

export const UES_SEASON_ONE_COURSES: readonly UesSeasonOneCourse[] = [
  {
    code: 'UES-201',
    slug: 'marine-layer-weather-light-daily-seeing',
    title: 'Marine Layer: Weather, Light & Daily Seeing',
    status: 'forming',
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
    assignments: [
      {
        title: 'Seven-day sky log',
        dueWeek: 2,
        brief: 'Observe one place at a consistent time for seven days using image, color, sound, text, or a combination.',
      },
      {
        title: 'Weather card',
        dueWeek: 4,
        brief: 'Translate one observed condition into a concise visual card with a source note and meaningful alt text.',
      },
      {
        title: 'Micro-atlas plate',
        dueWeek: 6,
        brief: 'Edit six observations into one coherent, accessible contribution to the collective Marine Layer atlas.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Notice Before Naming',
        question: 'What becomes visible when we stay with one patch of air before deciding what it means?',
        sourceShelf: [
          'UES Marine Layer field-note practice',
          'National Weather Service observation vocabulary',
          'Artist weather diaries and serial landscape studies',
        ],
        studio: 'Build a shared vocabulary of haze, cloud edge, glare, wind, temperature, distance, and uncertainty.',
        fieldTask: 'Choose one repeatable viewpoint and make three observations at different times of day.',
        publicReceipt: 'A first-view card naming the place, time, conditions, and one unresolved question.',
      },
      {
        week: 2,
        title: 'Weather Has Sources',
        question: 'How can lived observation and public data correct, deepen, or complicate each other?',
        sourceShelf: [
          'NOAA and National Weather Service observation products',
          'Tide, wind, visibility, and air-quality public-data conventions',
          'Source-note and uncertainty examples from PointCast',
        ],
        studio: 'Read a forecast discussion, compare it with the sky log, and distinguish observation from inference.',
        fieldTask: 'Complete the seven-day sky log and pair two entries with time-matched public observations.',
        publicReceipt: 'One sourced comparison between what the learner saw and what a public instrument recorded.',
      },
      {
        week: 3,
        title: 'Light, Color, Sound',
        question: 'What visual or sonic system can hold a condition without flattening it?',
        sourceShelf: [
          'Color notation and environmental sound-score examples',
          'Accessible color-contrast and audio-description practices',
          'The El Segundo School archive: weather, horizon, and botanical works',
        ],
        studio: 'Test three translations of one condition through palette, mark, typography, sequence, or sound.',
        fieldTask: 'Record one changing condition in two different media and compare what each medium loses.',
        publicReceipt: 'A two-medium study with a plain-language description of the editorial choice.',
      },
      {
        week: 4,
        title: 'Weather in Public',
        question: 'Who experiences the same weather differently, and how does the built environment change it?',
        sourceShelf: [
          'Heat, shade, wind, and shelter observation prompts',
          'Public-space accessibility field-audit examples',
          'Local accounts of marine layer, airport edge, beach, and street conditions',
        ],
        studio: 'Critique weather cards for legibility, source clarity, access, and lived specificity.',
        fieldTask: 'Compare two nearby public places for shade, glare, wind, shelter, and ease of waiting.',
        publicReceipt: 'The finished weather card plus an access note and alt text.',
      },
      {
        week: 5,
        title: 'A System for Daily Change',
        question: 'How can many distinct observations belong together without becoming identical?',
        sourceShelf: [
          'Grid, sequence, legend, and small-multiple design references',
          'Collective authorship and crediting patterns',
          'Open image, text, and audio licensing choices',
        ],
        studio: 'Edit individual studies into a shared atlas grammar while preserving each learner’s voice.',
        fieldTask: 'Produce a six-panel draft, run an accessibility check, and exchange one structured peer edit.',
        publicReceipt: 'A before-and-after edit note showing what changed and why.',
      },
      {
        week: 6,
        title: 'Open the Atlas',
        question: 'What should the next observer be able to notice, reuse, or question?',
        sourceShelf: [
          'Public exhibition checklist',
          'Portable archive and metadata checklist',
          'Optional Tezos publication boundary from UES-107',
        ],
        studio: 'Sequence the collective atlas, conduct a final source-and-access review, and host a public showing.',
        fieldTask: 'Finish the micro-atlas plate and prepare one sentence of context for a future observer.',
        publicReceipt: 'Published atlas plate, credits, source note, alt text, and optional process audio.',
      },
    ],
    archiveWorkNumber: '017',
    archiveCategory: 'WEATHER + LIGHT',
    connectsFrom: ['UES-103', 'UES-105', 'UES-106'],
    budgetUsd: 3_350,
    addedProductionNeed: 'Weather-and-art guest honorarium beyond the standard course plan.',
  },
  {
    code: 'UES-202',
    slug: 'the-25-mile-atlas',
    title: 'The 25-Mile Atlas: Mapping a Living Radius',
    status: 'forming',
    frame:
      'Map a place through useful rooms, missing connections, access barriers, lived stories, and the relationships that make a radius more than a circle.',
    outcome:
      'A public map of useful places, missing connections, lived stories, access barriers, and one achievable local repair.',
    path: '/ues/the-25-mile-atlas',
    jsonPath: '/ues/the-25-mile-atlas.json',
    weeklyCommitment: STANDARD_WEEKLY_COMMITMENT,
    access: [
      ...SHARED_ACCESS,
      'Remote public-record, phone-interview, and archival mapping paths when a field walk is unavailable.',
    ],
    materials: [
      'Browser and free web-mapping tool',
      'Phone camera or notebook',
      'Printed neighborhood map option',
      'No GIS experience or paid software required',
    ],
    instructorProfile:
      'A community cartographer, urban designer, geographer, or organizer able to teach evidence, uncertainty, participatory mapping, and responsible location privacy.',
    assignments: [
      {
        title: 'Personal radius map',
        dueWeek: 2,
        brief: 'Draw the practical radius of one daily need and explain which boundaries are geographic, social, or infrastructural.',
      },
      {
        title: 'Three verified field records',
        dueWeek: 4,
        brief: 'Add three useful, sourced, access-aware records to the shared atlas using the class field protocol.',
      },
      {
        title: 'One repair route',
        dueWeek: 6,
        brief: 'Publish an illustrated path from a documented local gap to one realistic first repair.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Who Draws the Boundary?',
        question: 'When does a radius describe belonging, and when does it conceal difference?',
        sourceShelf: [
          'UES 25-mile participation rule',
          'Participatory mapping and counter-mapping examples',
          'Local transit, neighborhood, and watershed boundary references',
        ],
        studio: 'Compare administrative, ecological, emotional, and practical boundaries around El Segundo and each learner’s place.',
        fieldTask: 'Draw four boundaries around one daily need and annotate who each boundary includes or excludes.',
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
        studio: 'Read competing base maps, design a legend, and distinguish verified fact from local report.',
        fieldTask: 'Audit one map against lived experience and document one omission, error, or stale record.',
        publicReceipt: 'A sourced correction card or clearly labeled open question.',
      },
      {
        week: 3,
        title: 'Run a Transect',
        question: 'What can a short, repeatable route reveal that a distant overview cannot?',
        sourceShelf: [
          'Walking-transect field protocols',
          'Universal-design and curb-to-door access prompts',
          'Responsible street photography and location privacy',
        ],
        studio: 'Practice a compact field protocol for route, threshold, asset, barrier, sound, sign, and unanswered question.',
        fieldTask: 'Walk, roll, ride, or remotely reconstruct one transect and record five evidence-based observations.',
        publicReceipt: 'One transect strip with route, time, mode, and access conditions.',
      },
      {
        week: 4,
        title: 'Story and Memory Layers',
        question: 'How can a map hold testimony without turning a person into data?',
        sourceShelf: [
          'Consent-based community storytelling prompts',
          'Oral-history excerpt and attribution practices',
          'Location fuzzing and sensitive-place redaction patterns',
        ],
        studio: 'Add narrative layers while preserving context, consent, and the right not to be mapped.',
        fieldTask: 'Invite one person to contribute a place memory or create a self-authored memory layer.',
        publicReceipt: 'One consented story pin, approximate-area note, or intentionally blank protected place.',
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
        studio: 'Cluster the atlas into assets, barriers, decision paths, and candidate repairs.',
        fieldTask: 'Verify one gap with two sources and identify the people or offices already closest to it.',
        publicReceipt: 'A one-page evidence card for a candidate repair.',
      },
      {
        week: 6,
        title: 'Publish the Living Atlas',
        question: 'How will this map stay useful, correctable, and locally accountable?',
        sourceShelf: [
          'Public map moderation and correction policies',
          'Portable data and export checklist',
          'UES season-receipt and local stewardship rules',
        ],
        studio: 'Review evidence, access, privacy, moderation, and maintenance before opening the atlas.',
        fieldTask: 'Finish one repair route and write a next-action handoff for a local steward.',
        publicReceipt: 'Published map layer, repair route, sources, correction path, and stewardship note.',
      },
    ],
    archiveWorkNumber: '141',
    archiveCategory: 'MAPS + CIVIC',
    connectsFrom: ['UES-101', 'UES-102', 'UES-108'],
    budgetUsd: 3_300,
    addedProductionNeed: 'Mapping tools, data preparation, and accessible export support.',
  },
  {
    code: 'UES-203',
    slug: 'public-image-office',
    title: 'Public Image Office: Posters, Signs & Civic Invitations',
    status: 'forming',
    frame:
      'Treat public graphics as working civic material: images that help a real person find, understand, join, question, or remember something local.',
    outcome:
      'A deployable visual campaign for a real local gathering or public-use project: poster, mobile card, printable sign, and editable source package.',
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
    assignments: [
      {
        title: 'Ten-sign field audit',
        dueWeek: 2,
        brief: 'Document ten public signs and assess voice, audience, location, access, usefulness, and unintended message.',
      },
      {
        title: 'Twelve-variation image sheet',
        dueWeek: 4,
        brief: 'Push one invitation through twelve materially different type-and-image arrangements before selecting a system.',
      },
      {
        title: 'Three-format campaign kit',
        dueWeek: 6,
        brief: 'Deliver a poster, mobile card, printable sign, editable source, credits, alt text, and a compact use guide.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Read the Street',
        question: 'What are local signs asking people to do, and who can actually understand or act?',
        sourceShelf: [
          'UES-105 public-sign walk method',
          'Municipal, handmade, commercial, protest, and wayfinding sign examples',
          'Plain-language and visual-access prompts',
        ],
        studio: 'Read signs as voice, hierarchy, placement, material, instruction, and social relationship.',
        fieldTask: 'Document ten signs from one route or accessible digital streetscape.',
        publicReceipt: 'An annotated sign audit naming one strong invitation and one exclusion.',
      },
      {
        week: 2,
        title: 'Message, Audience, Invitation',
        question: 'What must a person know, feel, and do in the five seconds after seeing this?',
        sourceShelf: [
          'Audience-and-action brief template',
          'Plain-language editing checklist',
          'Examples of welcoming and coercive public language',
        ],
        studio: 'Turn a real partner need into a one-page campaign brief and test the verb at its center.',
        fieldTask: 'Interview or exchange messages with one intended participant and revise the invitation from their response.',
        publicReceipt: 'A public brief containing audience, action, context, constraints, and access promise.',
      },
      {
        week: 3,
        title: 'Type and Image Material',
        question: 'How can found, made, archival, and generated material acquire a distinct public voice?',
        sourceShelf: [
          'The El Segundo School type and collage archive',
          'Image provenance and crediting patterns',
          'Analog and digital composition demonstrations',
        ],
        studio: 'Make rapid systems from type, field photography, collage, drawing, archive material, and disclosed AI use.',
        fieldTask: 'Create twelve materially varied compositions without polishing a final answer.',
        publicReceipt: 'The complete variation sheet plus one sentence about the selected direction.',
      },
      {
        week: 4,
        title: 'One Idea, Many Surfaces',
        question: 'What makes a visual system recognizable without making every output identical?',
        sourceShelf: [
          'Responsive identity and campaign-system references',
          'Poster, phone, social, sign, and photocopy format constraints',
          'Open source-package organization examples',
        ],
        studio: 'Build rules for scale, crop, color, hierarchy, image treatment, and partner editing.',
        fieldTask: 'Translate the selected direction into poster, phone, and one-color printable formats.',
        publicReceipt: 'A three-format proof with the system rules visible beside it.',
      },
      {
        week: 5,
        title: 'Access Is a Design Material',
        question: 'Does the campaign survive distance, glare, small screens, grayscale, screen readers, and ordinary printers?',
        sourceShelf: [
          'WCAG text contrast and non-text alternative guidance',
          'Large-print, plain-language, and screen-reader checks',
          'Low-cost print-production test methods',
        ],
        studio: 'Run distance, scale, contrast, grayscale, alt-text, reading-order, and office-printer tests.',
        fieldTask: 'Test the campaign with two people and document one change prompted by each test.',
        publicReceipt: 'An access-and-production test sheet showing failures, revisions, and remaining limits.',
      },
      {
        week: 6,
        title: 'Release the Public Kit',
        question: 'Can another local person deploy, adapt, credit, and maintain this work?',
        sourceShelf: [
          'Public campaign release checklist',
          'Open licensing and editable-source guidance',
          'UES public receipt and handoff format',
        ],
        studio: 'Final critique with the partner brief, release the kit, and practice a five-minute handoff.',
        fieldTask: 'Package final outputs, fonts or substitutions, image credits, alt text, and a one-page use guide.',
        publicReceipt: 'The three-format campaign kit, editable source, license choice, credits, and deployment photo or mockup.',
      },
    ],
    archiveWorkNumber: '065',
    archiveCategory: 'TYPE + PUBLIC IMAGE',
    connectsFrom: ['UES-105', 'UES-106', 'UES-108'],
    budgetUsd: 3_400,
    addedProductionNeed: 'Print proofs, format testing, and accessibility-production review.',
  },
  {
    code: 'UES-204',
    slug: 'living-archive',
    title: 'Living Archive: Oral History, Image & Sound',
    status: 'forming',
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
    assignments: [
      {
        title: 'Consent and interview plan',
        dueWeek: 2,
        brief: 'Write the purpose, invitation, recording choice, withdrawal path, access limits, and intended afterlife before collecting material.',
      },
      {
        title: 'Ten-minute interview or object scan',
        dueWeek: 4,
        brief: 'Collect one bounded, consented story or document one self-owned or public-domain object with context.',
      },
      {
        title: 'Living archive record',
        dueWeek: 6,
        brief: 'Publish or privately deposit an edited record with image, transcript or audio, metadata, rights, credits, and preservation copy.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Consent, Care, and the Ethics of Keeping',
        question: 'What right do we have to keep, edit, or publish another person’s story?',
        sourceShelf: [
          'Oral History Association ethics and consent principles',
          'Community archive consent and withdrawal examples',
          'UES-107 public-memory boundary',
        ],
        studio: 'Separate permission to listen, record, edit, preserve, publish, identify, and mint.',
        fieldTask: 'Write a purpose statement and test the invitation with a peer before approaching a participant.',
        publicReceipt: 'A reusable plain-language consent map with distinct yes, no, later, and withdraw choices.',
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
        studio: 'Practice opening, follow-up, silence, correction, scope, and a respectful ending in pairs.',
        fieldTask: 'Complete a short unrecorded listening rehearsal and revise the interview plan.',
        publicReceipt: 'The final interview or object-story plan without private participant information.',
      },
      {
        week: 3,
        title: 'Record, Scan, Describe',
        question: 'What technical choices preserve meaning without creating unnecessary risk?',
        sourceShelf: [
          'Basic audio recording and room-tone guidance',
          'Library scanning and descriptive metadata basics',
          'Secure file naming, storage, and backup checklist',
        ],
        studio: 'Run simple phone recording, scanning, photography, transcription, and description demonstrations.',
        fieldTask: 'Record the bounded interview or document the selected object using the agreed consent path.',
        publicReceipt: 'A redacted technical log naming format, duration, backup, and any access restrictions.',
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
        studio: 'Edit a short excerpt, mark every intervention, and test the difference between clarity and distortion.',
        fieldTask: 'Prepare the draft record and return it to the participant for correction or reaffirmed consent when applicable.',
        publicReceipt: 'An editorial decision log that does not expose restricted content.',
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
        studio: 'Build a compact record with title, creator, contributor, date, place, description, rights, access, format, and source.',
        fieldTask: 'Complete metadata, rights statement, accessibility assets, preservation copy, and deletion/withdrawal instructions.',
        publicReceipt: 'A metadata card with restricted fields visibly withheld rather than silently missing.',
      },
      {
        week: 6,
        title: 'Open a Listening Room',
        question: 'How can an archive invite attention without turning a person into content?',
        sourceShelf: [
          'Small listening-room and community exhibition formats',
          'Content note, transcript, image-description, and quiet-access examples',
          'Archive stewardship and correction policy templates',
        ],
        studio: 'Conduct final participant, rights, context, access, and preservation review before a bounded listening room.',
        fieldTask: 'Finish the living archive record and choose public, limited, delayed, or private deposit.',
        publicReceipt: 'The consented record or a public catalog stub describing why the record remains limited or private.',
      },
    ],
    archiveWorkNumber: '165',
    archiveCategory: 'ARCHIVE + MEMORY',
    connectsFrom: ['UES-102', 'UES-107'],
    budgetUsd: 3_700,
    addedProductionNeed: 'Archive storage, rights support, and a specialist guest honorarium.',
  },
  {
    code: 'UES-205',
    slug: 'collective-intelligence-studio',
    title: 'Collective Intelligence Studio: Humans, Agents & Editorial Judgment',
    status: 'forming',
    frame:
      'Build human-agent workflows in which tools expand the field of possibility while people remain accountable for sources, decisions, omissions, and the finished public claim.',
    outcome:
      'A three-person team publishes a sourced research dossier or creative work alongside a legible “who did what” process ledger.',
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
    assignments: [
      {
        title: 'Prompt and source notebook',
        dueWeek: 2,
        brief: 'Keep claims, sources, prompts, model outputs, human edits, uncertainties, and discarded paths in distinct fields.',
      },
      {
        title: 'Human-agent process map',
        dueWeek: 4,
        brief: 'Diagram who or what proposes, checks, decides, edits, attributes, and approves each stage of the team workflow.',
      },
      {
        title: 'Dossier and process ledger',
        dueWeek: 6,
        brief: 'Publish the finished work with sources, limitations, authorship statement, material model use, and final human approvals.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Define the Roles',
        question: 'Which work can a tool propose, and which decisions must a named person own?',
        sourceShelf: [
          'UES-106 authorship and disclosure principles',
          'Examples of editor, researcher, generator, critic, verifier, and approver roles',
          'PointCast human-AI collaboration ledger patterns',
        ],
        studio: 'Decompose a small project into proposing, retrieving, checking, deciding, making, editing, and approving.',
        fieldTask: 'Observe one existing workflow and mark where automation helps, obscures, or falsely appears authoritative.',
        publicReceipt: 'A first human-agent responsibility map with one clearly named final approver.',
      },
      {
        week: 2,
        title: 'Build a Trustworthy Source Trail',
        question: 'Can every important public claim travel back to evidence a person can inspect?',
        sourceShelf: [
          'Primary-source hierarchy and lateral-reading prompts',
          'Citation, quotation, paraphrase, and uncertainty examples',
          'Model hallucination and retrieval-failure cases',
        ],
        studio: 'Trace claims through search, retrieval, model summaries, and human verification without treating fluency as evidence.',
        fieldTask: 'Build a five-source shelf around the team question and verify one model-generated claim from primary evidence.',
        publicReceipt: 'A source notebook excerpt showing one confirmed, one corrected, and one unresolved claim.',
      },
      {
        week: 3,
        title: 'Prompts Are Sketches',
        question: 'How can prompting widen a search without quietly deciding the answer?',
        sourceShelf: [
          'Prompt variation and comparative-output exercises',
          'Creative constraint and editorial brief examples',
          'Image, text, and code provenance prompts',
        ],
        studio: 'Run divergent prompts, compare outputs, annotate assumptions, and write an editorial brief before selecting material.',
        fieldTask: 'Generate three meaningfully different approaches and document why the human team rejects at least one.',
        publicReceipt: 'A prompt triptych with output differences, editorial notes, and material model disclosure.',
      },
      {
        week: 4,
        title: 'Design the Handoffs',
        question: 'Where does information get lost when a project moves between people and agents?',
        sourceShelf: [
          'Editorial checklist and stage-gate examples',
          'Structured brief, schema, and handoff patterns',
          'Version, source, and approval ledger examples',
        ],
        studio: 'Turn an improvised team process into explicit inputs, outputs, checks, stop conditions, and named approvals.',
        fieldTask: 'Run one complete handoff cycle and record the ambiguity, duplication, and failure points.',
        publicReceipt: 'The revised human-agent process map and one concrete rule added after the test.',
      },
      {
        week: 5,
        title: 'Red-Team the Work',
        question: 'What would make this work misleading, harmful, derivative, private, or wrong?',
        sourceShelf: [
          'Bias, privacy, fabrication, and sensitive-data review prompts',
          'Copyright, style imitation, and synthetic-media disclosure cases',
          'Adversarial fact-check and counterexample methods',
        ],
        studio: 'Exchange dossiers, try to disprove major claims, test rights and privacy, and identify missing affected perspectives.',
        fieldTask: 'Resolve or explicitly label every high-risk issue in the peer red-team report.',
        publicReceipt: 'A red-team disposition list: fixed, disclosed, removed, or unresolved.',
      },
      {
        week: 6,
        title: 'Publish the Ledger',
        question: 'Can another person understand how the work was made and where judgment entered?',
        sourceShelf: [
          'Public process-ledger examples',
          'Model and dataset disclosure fields',
          'UES portable archive and correction-path checklist',
        ],
        studio: 'Complete editorial review, source audit, authorship statement, limitation note, and correction route.',
        fieldTask: 'Package the final dossier with its process ledger and obtain explicit approval from every named team member.',
        publicReceipt: 'Published work, inspectable sources, process ledger, limitations, credits, and correction contact.',
      },
    ],
    archiveWorkNumber: '253',
    archiveCategory: 'AI + COLLECTIVE',
    connectsFrom: ['UES-106', 'UES-107', 'UES-108'],
    budgetUsd: 3_300,
    addedProductionNeed: 'Shared model and API credits so participation does not depend on personal subscriptions.',
    boundary:
      'No sensitive personal data, deceptive synthetic media, unlicensed imitation, or unsupported factual publication.',
  },
  {
    code: 'UES-206',
    slug: 'common-table',
    title: 'Common Table: Hospitality as Civic Infrastructure',
    status: 'forming',
    frame:
      'Practice invitation, access, facilitation, food or object prompts, conflict care, and follow-through as the working infrastructure of a good collective room.',
    outcome:
      'Each team hosts an accessible 45-minute gathering and publishes its invitation, run-of-show, micro-budget, access notes, and aftercare receipt.',
    path: '/ues/common-table',
    jsonPath: '/ues/common-table.json',
    weeklyCommitment: STANDARD_WEEKLY_COMMITMENT,
    access: [
      ...SHARED_ACCESS,
      'Online-only gathering format and non-food participation path; no learner must host in a private home.',
    ],
    materials: [
      'Video room, phone bridge, or accessible partner space',
      'Shared run-of-show and budget templates',
      'Optional food, flower, image, object, or music prompt',
      'Four team microgrants of $100 are included in the course budget',
    ],
    instructorProfile:
      'A community producer, hospitality worker, facilitator, or cultural organizer with practical accessibility, conflict-care, budget, and follow-through experience.',
    assignments: [
      {
        title: 'Invitation test',
        dueWeek: 2,
        brief: 'Write, send, and revise a real invitation after learning what one intended participant needs in order to join.',
      },
      {
        title: 'Accessibility walkthrough',
        dueWeek: 4,
        brief: 'Rehearse the entire arrival-to-exit experience and document barriers, contingency paths, and named host responsibilities.',
      },
      {
        title: 'Team-hosted micro-table',
        dueWeek: 6,
        brief: 'Host a 45-minute gathering and publish the invitation, run-of-show, micro-budget, access notes, and aftercare receipt.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Why Should This Room Exist?',
        question: 'What can happen together that should not be another feed, meeting, or performance?',
        sourceShelf: [
          'UES-108 gathering-purpose and public-receipt practice',
          'Examples of salons, teach-ins, kitchen tables, listening rooms, and online circles',
          'Participation, extraction, and host-accountability prompts',
        ],
        studio: 'Distinguish audience, participants, guests, collaborators, hosts, and people affected but absent.',
        fieldTask: 'Interview one possible participant about a gathering they would make time for and one they would avoid.',
        publicReceipt: 'A one-paragraph purpose, non-purpose, and promise to participants.',
      },
      {
        week: 2,
        title: 'Invitation, Welcome, Access',
        question: 'What must someone know before saying yes, and what should never surprise them on arrival?',
        sourceShelf: [
          'Plain-language invitation and access-note examples',
          'RSVP privacy and minimal-data patterns',
          'Online, sensory, mobility, language, food, and care access prompts',
        ],
        studio: 'Write invitations that name purpose, timing, cost, format, access, privacy, recording, and a real contact.',
        fieldTask: 'Send a draft invitation to one intended participant and revise it from their questions.',
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
        studio: 'Build a minute-by-minute gathering score with a purpose for every transition.',
        fieldTask: 'Run a fifteen-minute fragment with peers and record where energy, clarity, or access drops.',
        publicReceipt: 'Run-of-show version one with host roles and contingency branches.',
      },
      {
        week: 4,
        title: 'Host and Facilitate',
        question: 'How does a host share attention without abandoning responsibility?',
        sourceShelf: [
          'Opening agreements and participatory facilitation prompts',
          'Turn-taking, chat, silence, and small-group methods',
          'Food, object, image, and music prompt examples',
        ],
        studio: 'Role-play arrival, uneven participation, technical failure, dominant voices, silence, and a late guest.',
        fieldTask: 'Complete the accessibility walkthrough from invitation through follow-up with someone outside the team.',
        publicReceipt: 'An access-and-hosting checklist naming the person responsible for each promise.',
      },
      {
        week: 5,
        title: 'Conflict, Care, and Graceful Endings',
        question: 'What can the room hold, and when must the host pause, redirect, or stop?',
        sourceShelf: [
          'Scope, community agreement, and escalation examples',
          'De-escalation, repair, removal, and referral prompts',
          'Aftercare, follow-up, and data-deletion checklist',
        ],
        studio: 'Practice boundary statements, interruptions, repair invitations, endings, and post-event care without pretending hosts are clinicians.',
        fieldTask: 'Write a proportionate response path for three plausible gathering failures.',
        publicReceipt: 'A one-page host care and escalation plan.',
      },
      {
        week: 6,
        title: 'Host the Table, Publish the Receipt',
        question: 'What should participants, funders, and the next host be able to see afterward?',
        sourceShelf: [
          'UES transparent micro-budget template',
          'Participant feedback and privacy-minimal evaluation prompts',
          'Reusable host-kit and season-receipt examples',
        ],
        studio: 'Run the four team gatherings, debrief as hosts and participants, and separate private care notes from public learning.',
        fieldTask: 'Close follow-up, pay or reimburse agreed costs, delete unneeded participant data, and finish the host kit.',
        publicReceipt: 'Invitation, run-of-show, micro-budget, access notes, learning receipt, and reusable source files.',
      },
    ],
    archiveWorkNumber: '205',
    archiveCategory: 'HOSPITALITY + COMMONS',
    connectsFrom: ['UES-102', 'UES-108'],
    budgetUsd: 3_500,
    addedProductionNeed: 'Four $100 team-hosting grants for access, food, materials, or room costs.',
  },
  {
    code: 'UES-207',
    slug: 'plant-portraits',
    title: 'Plant Portraits: Form, Lineage & Cultural Memory',
    status: 'forming',
    frame:
      'Join botanical looking, introductory lineage study, cultural history, image making, and typography without reducing a living plant to decoration or commodity.',
    outcome:
      'A sourced four-page illustrated plant portrait plus one contribution to a shared visual lineage wall.',
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
    assignments: [
      {
        title: 'Non-destructive plant observation',
        dueWeek: 2,
        brief: 'Study one safely and legally observable plant through form, change, uncertainty, and at least two modes of description.',
      },
      {
        title: 'Lineage diagram',
        dueWeek: 4,
        brief: 'Make a careful visual diagram distinguishing documented lineage, taxonomic relationship, cultural naming, and unresolved claims.',
      },
      {
        title: 'Illustrated plant portrait',
        dueWeek: 6,
        brief: 'Publish a four-page portrait joining form, lineage, cultural memory, sources, credits, and meaningful image description.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Close Looking and Uncertain Naming',
        question: 'What can we honestly say about a plant before attaching a confident name?',
        sourceShelf: [
          'UES-103 Flower Commons observation practice',
          'Botanical illustration and herbarium-sheet examples',
          'Citizen-science identification and uncertainty labels',
        ],
        studio: 'Observe silhouette, node, vein, surface, rhythm, color, scale, and change without rushing to identification.',
        fieldTask: 'Study one legal plant through image, drawing, sound, touch-safe description, or written visual description.',
        publicReceipt: 'A first plant plate separating observed features from proposed names.',
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
        studio: 'Read roots, stems, nodes, leaves, flowers, fruit, branching, and seasonal state as a living structure.',
        fieldTask: 'Make three scaled studies of the plant at whole, branch, and detail levels.',
        publicReceipt: 'An annotated morphology sheet with accessible description.',
      },
      {
        week: 3,
        title: 'Reproduction, Lineage, Genetics',
        question: 'What is inherited, selected, cloned, crossed, named, marketed, or merely claimed?',
        sourceShelf: [
          'Introductory inheritance, variation, and reproduction concepts',
          'Cultivar, variety, hybrid, clone, landrace, and strain terminology',
          'UES-104 sourced cannabis glossary boundary',
        ],
        studio: 'Distinguish taxonomic relationship, documented breeding, commercial naming, cultural lineage, and uncertainty.',
        fieldTask: 'Trace one plant name through three sources and mark agreement, conflict, missing evidence, and marketing language.',
        publicReceipt: 'A draft lineage diagram with confidence labels and citations.',
      },
      {
        week: 4,
        title: 'People, Symbols, Trade, Law',
        question: 'Whose labor, knowledge, ritual, restrictions, and stories travel with this plant?',
        sourceShelf: [
          'Ethnobotanical and cultural-history source prompts',
          'Trade, naming, appropriation, prohibition, and stewardship case studies',
          'Local-law and age-boundary source checklist',
        ],
        studio: 'Place the plant inside human systems without making cultural or medical claims the sources cannot support.',
        fieldTask: 'Add one sourced cultural-memory panel and one explicit boundary or omission to the portrait.',
        publicReceipt: 'The revised lineage wall contribution with scientific, commercial, and cultural claims visibly distinguished.',
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
        studio: 'Combine observation, diagram, archive, text, color, and type into a coherent four-page portrait.',
        fieldTask: 'Make the complete portrait draft and exchange a botany, culture, source, and access critique.',
        publicReceipt: 'A critique ledger showing one correction in each of the four review dimensions.',
      },
      {
        week: 6,
        title: 'Open the Plant Portraits',
        question: 'How can the exhibition remain beautiful, careful, correctable, and alive?',
        sourceShelf: [
          'Collective botanical exhibition formats',
          'Correction, update, and seasonal-revisit patterns',
          'UES portable archive and optional minting boundary',
        ],
        studio: 'Sequence the lineage wall and portraits, run a final source and boundary audit, and host a public reading.',
        fieldTask: 'Finish the portrait, source list, credits, access assets, and one future seasonal observation prompt.',
        publicReceipt: 'Published plant portrait and lineage contribution with corrections contact and next-observation date.',
      },
    ],
    archiveWorkNumber: '005',
    archiveCategory: 'BOTANY + LINEAGE',
    connectsFrom: ['UES-103', 'UES-104', 'UES-105'],
    budgetUsd: 3_600,
    addedProductionNeed: 'Botanical guest faculty and accessible observation kits.',
    boundary:
      'Legal specimens and public information only. Cannabis examples remain 21+, educational, and non-medical, with no consumption or unlawful cultivation instruction.',
  },
  {
    code: 'UES-208',
    slug: 'local-broadcast',
    title: 'Local Broadcast: Publish a Place',
    status: 'forming',
    frame:
      'Build a small, accountable local publication from field reporting, visual language, sound, metadata, community editing, and a clear promise to the place it serves.',
    outcome:
      'Each studio produces one accessible six-item issue containing a dispatch, portrait, map, resource, image or audio card, and editor’s note, then leaves behind a reusable publishing kit.',
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
      'Class publishing templates and shared file space',
      'No coding, domain purchase, or personal hosting account required',
    ],
    instructorProfile:
      'A local editor, independent publisher, radio producer, or web producer able to teach reporting judgment, visual and audio editing, lightweight distribution, and accountable corrections.',
    assignments: [
      {
        title: 'Field dispatch',
        dueWeek: 2,
        brief: 'Report and verify a 250-word local note with clear attribution, source links, location care, and one unresolved question.',
      },
      {
        title: 'Accessible media card',
        dueWeek: 4,
        brief: 'Produce one image or audio card with caption, alt text or transcript, credits, rights, and compact metadata.',
      },
      {
        title: 'Local issue and publishing kit',
        dueWeek: 6,
        brief: 'Own one defined production role in the six-item issue and leave a reusable workflow, template, feed, correction path, and handoff.',
      },
    ],
    weeks: [
      {
        week: 1,
        title: 'Write the Editorial Promise',
        question: 'What does this publication owe the place and people it names?',
        sourceShelf: [
          'PointCast local publishing and public-receipt patterns',
          'Independent neighborhood publication examples',
          'Editorial mission, scope, corrections, and conflicts templates',
        ],
        studio: 'Define place, audience, beats, exclusions, evidence, voice, corrections, and the conditions under which the team will not publish.',
        fieldTask: 'Interview one intended reader about what local information feels useful, missing, extractive, or repetitive.',
        publicReceipt: 'A one-page editorial promise and corrections contact.',
      },
      {
        week: 2,
        title: 'Report, Listen, Verify',
        question: 'What makes a small local note trustworthy enough to pass along?',
        sourceShelf: [
          'Primary-source and on-the-record reporting prompts',
          'Public records, local calendars, direct observation, and attribution basics',
          'Location privacy and vulnerable-source boundaries',
        ],
        studio: 'Turn observation, interview, document, and data into a concise sourced dispatch without manufacturing certainty.',
        fieldTask: 'Report a 250-word local dispatch and verify every name, date, location, quote, and public claim.',
        publicReceipt: 'The finished dispatch, sources, attribution, and one clearly labeled unresolved question.',
      },
      {
        week: 3,
        title: 'Make with Text, Image, and Sound',
        question: 'Which medium lets this local subject become more legible rather than merely more decorative?',
        sourceShelf: [
          'Photo essay, audio postcard, illustrated note, and data-card examples',
          'The El Segundo School public-image archive',
          'Consent, credit, caption, transcript, and alt-text practices',
        ],
        studio: 'Build parallel versions of one local story as image, sound, and text, then choose the form that carries evidence best.',
        fieldTask: 'Collect or make one consented media element and preserve its original, rights, source, and context.',
        publicReceipt: 'A media study showing the chosen and rejected format with editorial reasoning.',
      },
      {
        week: 4,
        title: 'Structure the Issue',
        question: 'How can one issue remain useful on a phone, in print, in a feed, and after the platform changes?',
        sourceShelf: [
          'Semantic web page, RSS, JSON Feed, and printable digest basics',
          'Metadata, stable URL, credit, and archive checklist',
          'Low-bandwidth and assistive-technology reading order',
        ],
        studio: 'Arrange dispatch, portrait, map, resource, media card, and editor’s note into one accessible issue system.',
        fieldTask: 'Finish the accessible media card and test its small-screen, transcript or alt-text, credit, and rights fields.',
        publicReceipt: 'The media card plus a compact metadata record.',
      },
      {
        week: 5,
        title: 'Run the Community Edit',
        question: 'Who should see this before publication, and what kind of power should their response carry?',
        sourceShelf: [
          'Fact, source, sensitivity, copy, art, and access edit passes',
          'Subject review versus editorial independence examples',
          'Corrections, takedown, update, and version-note policies',
        ],
        studio: 'Assign editors, run distinct review passes, resolve conflicts, and log material changes without turning consensus into the only standard.',
        fieldTask: 'Complete one production role and respond to the full issue edit ledger.',
        publicReceipt: 'A redacted edit ledger showing checked, changed, disclosed, withheld, and unresolved items.',
      },
      {
        week: 6,
        title: 'Publish, Distribute, Hand Off',
        question: 'Can the issue travel, be corrected, and be reproduced by another local team?',
        sourceShelf: [
          'PointCast page, feed, social-card, email, and print distribution patterns',
          'Portable archive, backup, and source-package checklist',
          'UES satellite 70/20/10 curriculum rule and local stewardship model',
        ],
        studio: 'Publish the issue, test every route and format, distribute it deliberately, and rehearse a handoff to a future city cohort.',
        fieldTask: 'Finish assigned production work, create the reusable publishing kit, and name the next local reporting question.',
        publicReceipt: 'Live six-item issue, feed or portable export, credits, corrections path, source package, and steward handoff.',
      },
    ],
    archiveWorkNumber: '373',
    archiveCategory: 'BROADCAST + PLACE',
    connectsFrom: ['UES-105', 'UES-106', 'UES-107', 'UES-108'],
    budgetUsd: 3_400,
    addedProductionNeed: 'Hosting, feed, archive, and lightweight publishing utilities.',
  },
];

export const UES_SEASON_ONE_BUDGET = {
  name: 'Online Season 1 — The Local Transmission',
  totalUsd: 39_650,
  coursePoolUsd: 27_550,
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
        label: 'Faculty',
        amountUsd: 1_800,
        purpose: 'Six live studios at $200 each plus $600 for preparation and review.',
      },
      {
        label: 'Course steward',
        amountUsd: 750,
        purpose: 'Access, attendance, documentation, learner follow-up, and public receipts.',
      },
      {
        label: 'Captions and transcripts',
        amountUsd: 300,
        purpose: 'Live captioning, transcript cleanup, or an equivalent access path.',
      },
      {
        label: 'Artifact materials or microgrants',
        amountUsd: 250,
        purpose: 'Remove small production barriers for the shared course outcome.',
      },
    ] satisfies readonly UesSeasonOneBudgetLine[],
  },
  sharedLines: [
    {
      label: 'Learner access grants',
      amountUsd: 4_000,
      purpose: 'Connectivity, care, equipment, translation, and other participation barriers.',
    },
    {
      label: 'Platform and public archive',
      amountUsd: 2_100,
      purpose: 'Course pages, streaming, shared storage, feeds, archive, and production utilities.',
    },
    {
      label: 'Legal, insurance, and administration',
      amountUsd: 2_500,
      purpose: 'Qualified review, participant agreements, bookkeeping, insurance, and program administration.',
    },
    {
      label: 'Contingency',
      amountUsd: 3_500,
      purpose: 'Protect paid teaching, access, and the public outcomes from ordinary pilot surprises.',
    },
  ] satisfies readonly UesSeasonOneBudgetLine[],
  perUniqueLearnerUsd: Math.round(39_650 / ONLINE_SEASON_ONE.learnerCapacity),
  planningNote:
    'The increase over Season 0 primarily pays faculty for preparation and review instead of relying on donated labor.',
} as const;
