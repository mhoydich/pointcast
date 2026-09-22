const GENERATED_IMAGE_DISCLOSURE =
  'OpenAI-generated historical interpretation; not a documentary photograph.';

export const RAILROAD_ERAS = Object.freeze([
  Object.freeze({
    id: '1825',
    year: 1825,
    index: 0,
    place: 'Shildon to Stockton, England',
    location: 'SHILDON → STOCKTON · 27 SEP 1825',
    plate: '01',
    kicker: 'WHEN PUBLIC STEAM BECAME A PUBLIC EVENT',
    title: 'The railway did not begin with a blank page.',
    answer:
      'Railways and steam engines already existed. What changed on September 27, 1825 was the combination: Locomotion No. 1 hauled an opening train over the Stockton & Darlington, a public railway built to move coal and open to traffic. The journey made a scattered set of inventions look like a repeatable public system.',
    gain: 'A working model for moving freight and people on one shared line.',
    cost: 'The new network grew inside a coal economy and accelerated industrial expansion.',
    question: 'When does an invention become infrastructure?',
    topic: 'beginnings',
    image: '/images/railroads/1825-locomotion.webp',
    imageWidth: 1536,
    imageHeight: 1024,
    imageAlt:
      'An illustrated early steam locomotive and open passenger wagons crossing the English countryside in 1825.',
    imageDisclosure: GENERATED_IMAGE_DISCLOSURE,
    source: Object.freeze({
      label: 'Historic England · Stockton & Darlington overview',
      url: 'https://historicengland.org.uk/whats-new/research/a-brief-overview-of-the-stockton-and-darlington-railway/',
      organization: 'Historic England',
    }),
    keywords: Object.freeze([
      '1825',
      'begin',
      'began',
      'beginning',
      'first',
      'origin',
      'steam',
      'locomotion',
      'darlington',
      'stockton',
      'england',
      'coal',
      'public railway',
    ]),
  }),
  Object.freeze({
    id: '1869',
    year: 1869,
    index: 1,
    place: 'Sierra Nevada to Promontory Summit',
    location: 'SIERRA NEVADA → PROMONTORY · 1869',
    plate: '02',
    kicker: 'THE WORK BEFORE THE CEREMONY',
    title: 'A continent was joined by hands the photograph minimized.',
    answer:
      'The Central Pacific relied on thousands of Chinese workers as graders, tracklayers, masons, blacksmith helpers, and cooks. They faced avalanches, blasting accidents, severe weather, and unequal pay. Eight Chinese workers moved the final rail into place at Promontory on May 10, 1869, just before the famous ceremony crowded them out of the best-known image.',
    gain: 'Rail and telegraph connected distant markets, mail, and travel across the continent.',
    cost: 'Dangerous labor, discriminatory wages, and a public memory that hid many builders.',
    question: 'Who disappears when a network tells its success story?',
    topic: 'labor and memory',
    image: '/images/railroads/1869-sierra-workers.webp',
    imageWidth: 1536,
    imageHeight: 1024,
    imageAlt:
      'An illustrated group of Chinese railroad workers laying track through the Sierra Nevada in 1869.',
    imageDisclosure: GENERATED_IMAGE_DISCLOSURE,
    source: Object.freeze({
      label: 'National Park Service · Archeology of Chinese laborers',
      url: 'https://www.nps.gov/articles/archeology-of-chinese-laborers-connected-country.htm',
      organization: 'National Park Service',
    }),
    keywords: Object.freeze([
      '1869',
      'built',
      'builder',
      'workers',
      'worker',
      'labor',
      'chinese',
      'sierra',
      'promontory',
      'spike',
      'transcontinental',
      'central pacific',
      'union pacific',
      'who made',
      'who did',
    ]),
  }),
  Object.freeze({
    id: '1883',
    year: 1883,
    index: 2,
    place: 'North America',
    location: 'NORTH AMERICA · 18 NOV 1883',
    plate: '03',
    kicker: 'THE DAY NOON HAPPENED TWICE',
    title: 'Railroads needed every clock to agree.',
    answer:
      'Before standard time, towns set clocks by the local sun. That left North America with hundreds of local times and railroads juggling roughly fifty operating standards. On November 18, 1883, the railroads adopted standard zones. In some places, people experienced two noons: one by the sun and another by the new railway clock.',
    gain: 'Timetables became legible across long distances.',
    cost: 'Local solar time gave way to a network’s clock.',
    question: 'Whose clock are you living by?',
    topic: 'time and coordination',
    image: '/images/railroads/1883-railway-time.webp',
    imageWidth: 1536,
    imageHeight: 1024,
    imageAlt:
      'An illustrated 1883 railway station with multiple clocks and passengers consulting timetables.',
    imageDisclosure: GENERATED_IMAGE_DISCLOSURE,
    source: Object.freeze({
      label: 'Smithsonian National Museum of American History · Synchronizing time',
      url: 'https://americanhistory.si.edu/ontime/synchronizing/zones.html',
      organization: 'Smithsonian National Museum of American History',
    }),
    keywords: Object.freeze([
      '1883',
      'time',
      'clock',
      'noon',
      'zone',
      'zones',
      'schedule',
      'timetable',
      'late',
      'standard',
    ]),
  }),
  Object.freeze({
    id: '1964',
    year: 1964,
    index: 3,
    place: 'Tokyo to Shin-Osaka, Japan',
    location: 'TOKYO → SHIN-OSAKA · 01 OCT 1964',
    plate: '04',
    kicker: 'SPEED BECAME A PUBLIC PROMISE',
    title: 'The train stopped imitating the airplane.',
    answer:
      'The Tokaido Shinkansen opened between Tokyo and Shin-Osaka on October 1, 1964. Its dedicated electric railway and Series 0 trains made high speed a normal, repeated public service—not a one-off record attempt. The breakthrough was the whole system: track, power, signaling, schedules, stations, and maintenance working together.',
    gain: 'Distant cities became part of one dependable day.',
    cost: 'Speed required a new corridor and a permanent commitment to the system behind it.',
    question: 'Is speed a machine—or an agreement people keep?',
    topic: 'speed and systems',
    image: '/images/railroads/1964-shinkansen.webp',
    imageWidth: 1536,
    imageHeight: 1024,
    imageAlt:
      'An illustrated Series 0 Shinkansen at a Japanese station in 1964, with Mount Fuji in the distance.',
    imageDisclosure: GENERATED_IMAGE_DISCLOSURE,
    source: Object.freeze({
      label: 'JR Central · SCMAGLEV and Railway Park guide',
      url: 'https://museum.jr-central.co.jp/sp/en/_pdf/brochure.pdf',
      organization: 'Central Japan Railway Company',
    }),
    keywords: Object.freeze([
      '1964',
      'fast',
      'faster',
      'speed',
      'high speed',
      'bullet',
      'shinkansen',
      'japan',
      'tokyo',
      'osaka',
      'modern',
      'electric',
    ]),
  }),
]);

export const RAILROAD_TIME = Object.freeze({
  schemaVersion: '1.0.0',
  type: 'PointCastInteractiveFeature',
  id: 'railroad-time',
  status: 'published',
  title: 'Railroad Time',
  subtitle: 'The line that made time',
  description:
    'A speakable journey through four sourced turning points in railroad history. Ask about beginnings, builders, time, or speed and the line moves.',
  publishedAt: '2026-09-21T00:00:00-07:00',
  updatedAt: '2026-09-21T00:00:00-07:00',
  canonical: 'https://pointcast.xyz/railroads/',
  machineEdition: 'https://pointcast.xyz/railroads.json',
  publisher: Object.freeze({
    name: 'PointCast',
    url: 'https://pointcast.xyz/',
  }),
  social: Object.freeze({
    image: 'https://pointcast.xyz/images/railroads/railroad-time-v1.png',
    imageWidth: 1200,
    imageHeight: 630,
    imageAlt:
      'Railroad Time: an illustrated train crossing four eras from steam to high-speed rail.',
    animation:
      'The live page adds a moving train with SVG and CSS; the social image is a static, cross-client-safe frame.',
  }),
  interaction: Object.freeze({
    speechInput:
      'Browser SpeechRecognition or webkitSpeechRecognition handles one utterance after an explicit tap; an editable typed fallback is always available.',
    speechOutput:
      'Browser speech synthesis reads the current answer only after an explicit click and can be stopped at any time.',
    routing:
      'Deterministic keyword matching over these four curated eras; the experience does not generate historical facts.',
    storage: 'Visited era identifiers only, stored in sessionStorage for this browser tab.',
    networkWrites: false,
    liveAi: false,
  }),
  privacy: Object.freeze({
    microphoneRequiresExplicitTap: true,
    pointCastReceivesMicrophoneAudio: false,
    pointCastStoresAudioOrTranscript: false,
    browserRecognitionMayUseVendorService: true,
    note:
      'Speech recognition is supplied by the visitor’s browser or device and may use that vendor’s speech service. PointCast does not receive or store microphone audio or transcripts.',
  }),
  editorial: Object.freeze({
    historicalFacts: 'Curated, fixed copy tied to the source receipt in each era.',
    generatedImages: GENERATED_IMAGE_DISCLOSURE,
    imageGenerator: 'OpenAI image generation',
  }),
  defaultEra: '1883',
  eras: RAILROAD_ERAS,
});

export function normalizeRailroadQuery(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const GENERIC_ROUTING_KEYWORDS = new Set([
  'begin',
  'began',
  'beginning',
  'first',
  'origin',
  'built',
  'builder',
  'workers',
  'worker',
  'labor',
  'who made',
  'who did',
  'fast',
  'faster',
  'speed',
  'modern',
]);

function railroadKeywordWeight(keyword) {
  if (GENERIC_ROUTING_KEYWORDS.has(keyword)) return 1;
  return keyword.includes(' ') ? 4 : 2;
}

export function chooseRailroadEra(rawQuery = '', currentId = RAILROAD_TIME.defaultEra) {
  const value = normalizeRailroadQuery(rawQuery);
  const currentIndex = RAILROAD_ERAS.findIndex((era) => era.id === String(currentId));
  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 2;

  if (!value) return RAILROAD_ERAS[safeCurrentIndex];

  let winnerEra = RAILROAD_ERAS[0];
  let winnerScore = -1;
  for (const era of RAILROAD_ERAS) {
    let score = value.includes(era.id) ? 9 : 0;
    for (const keyword of era.keywords) {
      if (value.includes(keyword)) score += railroadKeywordWeight(keyword);
    }
    if (score > winnerScore) {
      winnerEra = era;
      winnerScore = score;
    }
  }

  if (winnerScore > 0) return winnerEra;
  return RAILROAD_ERAS[(safeCurrentIndex + 1) % RAILROAD_ERAS.length];
}

export function contextualRailroadAnswer(era = RAILROAD_ERAS[2], rawQuestion = '') {
  const value = normalizeRailroadQuery(rawQuestion);
  let lead = '';
  if (/^who\b|who built|who made|people/.test(value)) {
    lead = 'Start with the people, not the machine. ';
  } else if (/^why\b|how come|reason/.test(value)) {
    lead = 'The useful answer is about the system around the train. ';
  } else if (/cost|harm|bad|lost|price/.test(value)) {
    lead = 'The gain and the cost belong in the same frame. ';
  } else if (/first|begin|start/.test(value)) {
    lead = 'There was no single first—but this is a strong place to begin. ';
  } else if (/future|today|now/.test(value)) {
    lead = 'To understand the present, this earlier agreement matters. ';
  }
  return `${lead}${era.answer}`;
}
