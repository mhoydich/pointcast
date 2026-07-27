export type NoticingAltitude = 'body' | 'home' | 'town' | 'network' | 'world';

export interface NoticingStory {
  id: string;
  sequence: number;
  targetDate: string;
  dateLabel: string;
  desk: 'Ritual' | 'Coordination' | 'Study Of' | 'Utility' | 'Place' | 'Case Study';
  format: 'Essay' | 'Major Study' | 'Digital Anthropology' | 'Field Guide' | 'Revisit' | 'Case Study';
  title: string;
  dek: string;
  altitudes: NoticingAltitude[];
  status: 'on-desk' | 'fieldwork' | 'next';
  visual: 'library' | 'lacroix' | 'crossing' | 'calendar' | 'places' | 'mesh';
  relatedUrl?: string;
  relatedLabel?: string;
}

export const NOTICING_ALTITUDES: Array<{
  id: NoticingAltitude;
  label: string;
  note: string;
}> = [
  { id: 'body', label: 'Body', note: 'attention, appetite, motion' },
  { id: 'home', label: 'Home', note: 'ritual, care, useful objects' },
  { id: 'town', label: 'Town', note: 'memory, government, belonging' },
  { id: 'network', label: 'Network', note: 'platforms, protocols, coordination' },
  { id: 'world', label: 'World', note: 'systems, exchange, possible futures' },
];

export const NOTICING_DESKS = [
  {
    name: 'Ritual',
    note: 'The body as the first system we coordinate.',
    examples: 'coffee · walks · movement · food · changing the channel',
  },
  {
    name: 'Coordination',
    note: 'How people make shared things work.',
    examples: 'government · libraries · currencies · organizations',
  },
  {
    name: 'Study Of',
    note: 'Entertainment and platforms read as social machinery.',
    examples: 'games · TikTok · Tumblr · Spotify · computer language',
  },
  {
    name: 'Utility',
    note: 'Useful knowledge with a point of view.',
    examples: 'code · prompting · calendars · automation · design',
  },
  {
    name: 'Place',
    note: 'Regional intelligence, revisits, and accountable recommendations.',
    examples: 'El Segundo · field notes · places worth returning to',
  },
] as const;

export const NOTICING_STORIES: NoticingStory[] = [
  {
    id: 'future-library',
    sequence: 1,
    targetDate: '2026-08-07T08:08:00-07:00',
    dateLabel: 'Fri · Aug 07',
    desk: 'Coordination',
    format: 'Major Study',
    title: 'The future of the library',
    dek: 'A library is a town coordinating with its own memory. What happens when the shelves become protocols, studios, tools, and rooms for making?',
    altitudes: ['home', 'town', 'network', 'world'],
    status: 'next',
    visual: 'library',
  },
  {
    id: 'why-lacroix',
    sequence: 2,
    targetDate: '2026-08-11T08:08:00-07:00',
    dateLabel: 'Tue · Aug 11',
    desk: 'Ritual',
    format: 'Essay',
    title: 'Why LaCroix',
    dek: 'Bubbles, cans, office refrigerators, and the peculiar warmth of choosing a flavor that barely exists.',
    altitudes: ['body', 'home', 'network'],
    status: 'on-desk',
    visual: 'lacroix',
  },
  {
    id: 'animal-crossing',
    sequence: 3,
    targetDate: '2026-08-14T08:08:00-07:00',
    dateLabel: 'Fri · Aug 14',
    desk: 'Study Of',
    format: 'Digital Anthropology',
    title: 'Animal Crossing is a gift economy',
    dek: 'Care, debt, decoration, visiting hours, and why the nicest town square you know may be commercial software.',
    altitudes: ['home', 'town', 'network'],
    status: 'on-desk',
    visual: 'crossing',
  },
  {
    id: 'calendar-a-life',
    sequence: 4,
    targetDate: '2026-08-21T08:08:00-07:00',
    dateLabel: 'Fri · Aug 21',
    desk: 'Utility',
    format: 'Field Guide',
    title: 'How to calendar a life',
    dek: 'The calendar as a humane agreement with your future attention—not a warehouse for other people’s urgency.',
    altitudes: ['body', 'home', 'network'],
    status: 'on-desk',
    visual: 'calendar',
  },
  {
    id: 'places-2023',
    sequence: 5,
    targetDate: '2026-08-25T08:08:00-07:00',
    dateLabel: 'Tue · Aug 25',
    desk: 'Place',
    format: 'Revisit',
    title: 'Places we said to visit in 2023',
    dek: 'Three years later: what endured, what disappeared, what became too popular, and where we would still send a friend.',
    altitudes: ['body', 'town', 'world'],
    status: 'fieldwork',
    visual: 'places',
  },
  {
    id: 'town-mesh',
    sequence: 6,
    targetDate: '2026-08-28T08:08:00-07:00',
    dateLabel: 'Fri · Aug 28',
    desk: 'Case Study',
    format: 'Case Study',
    title: 'How a town builds its own wireless network',
    dek: 'Three rooftops, one useful local service, no magical coverage claims: the practical opening move for a neighborhood utility.',
    altitudes: ['town', 'network', 'world'],
    status: 'fieldwork',
    visual: 'mesh',
    relatedUrl: '/network-el-segundo/mesh-commons',
    relatedLabel: 'Open the working field study',
  },
];

export const NOTICING = {
  schema: 'pointcast.editorial-desk/v1',
  id: 'what-i-keep-noticing-00',
  title: 'What I keep noticing',
  issue: '00',
  season: 'How we live together',
  url: 'https://pointcast.xyz/noticing',
  jsonUrl: 'https://pointcast.xyz/noticing.json',
  blockUrl: 'https://pointcast.xyz/b/0512',
  publishedAt: '2026-07-27T11:42:31-07:00',
  status: 'editorial-calendar',
  cadence: {
    promise: 'New Friday. Field notes arrive between.',
    monthlyTarget: 6,
    flagship: 'One substantial coordination piece each month',
  },
  thesis:
    'We live in a moment of functionally infinite resources and painfully finite coordination. The tools are everywhere; the agreements are scarce.',
  question:
    'How do ordinary people remain capable, curious, and connected inside systems they did not design?',
  editorialModel: {
    privatePlanning: 'Five recurring desks keep the calendar balanced.',
    publicNavigation: 'Five altitudes show how every story connects.',
    majorStudy: 'A season of field notes, interviews, diagrams, tools, and smaller dispatches—not one enormous article.',
  },
  credits: {
    director: 'Michael Hoydich',
    editorialRoom: ['Fable 5 low', 'Claude', 'Codex'],
    source:
      'Mike Hoydich chat directive, 2026-07-27; selected manifesto supplied by Mike from Fable 5 low; pillar notes supplied by Mike from Claude; PointCast structure and publication design by Codex.',
  },
} as const;
