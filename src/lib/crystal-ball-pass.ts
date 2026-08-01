export type CrystalBallPassStats = {
  warmth: number;
  provisions: number;
  wonder: number;
  miles: number;
};

export type CrystalBallPassChoice = {
  label: string;
  detail: string;
  result: string;
  delta: Partial<CrystalBallPassStats>;
  tone: number;
};

export type CrystalBallPassScene = {
  place: string;
  time: string;
  weather: string;
  title: string;
  story: string;
  micro: string;
  hue: string;
  choices: CrystalBallPassChoice[];
};

export const CRYSTAL_BALL_PASS_TITLE = 'Crystal Ball Pass';

export const CRYSTAL_BALL_PASS_DESCRIPTION =
  'A five-minute forest expedition: seven trail decisions, shifting weather, generated chimes, and one tiny Codex Micro field guide.';

export const CRYSTAL_BALL_PASS_TRAIL: CrystalBallPassScene[] = [
  {
    place: 'Fernwake Camp',
    time: 'Day 1 · 6:42 A.M.',
    weather: 'MIST · 48°',
    title: 'The map is damp, but hopeful.',
    story:
      'Crystal Ball Pass lies forty-two miles beyond the cedar gate. Your pocket guide hums awake. Somewhere uphill, an elk snaps one clean branch.',
    micro: 'TWO ROUTES FOUND. BOTH APPEAR TO BE MOSTLY REAL.',
    hue: '#c8ff8c',
    choices: [
      {
        label: 'Take the moss road',
        detail: 'Soft ground · slower · berry signs',
        result: 'The moss gives under every step. You find huckleberries and no hurry.',
        delta: { miles: 5, provisions: 2, wonder: 7, warmth: 2 },
        tone: 392,
      },
      {
        label: 'Climb the old ridge',
        detail: 'Fast miles · cold wind · wide view',
        result: 'The ridge spends your warmth, then pays you back with the entire valley.',
        delta: { miles: 7, provisions: -1, wonder: 5, warmth: -8 },
        tone: 523,
      },
    ],
  },
  {
    place: 'Mushroom Mile',
    time: 'Day 1 · 10:18 A.M.',
    weather: 'DRIP · 51°',
    title: 'A ring of chanterelles blocks the trail.',
    story:
      'They are arranged too neatly to be ordinary lunch. Codex Micro insists on a field test. It has no mouth and is therefore very brave.',
    micro: 'GOLDEN SPECIMENS: 14. FAIRY INVITATIONS: POSSIBLY 1.',
    hue: '#ffcf66',
    choices: [
      {
        label: 'Harvest only three',
        detail: 'A modest forest breakfast',
        result: 'You leave eleven standing. The woods approve in the quiet way woods do.',
        delta: { miles: 4, provisions: 3, wonder: 3, warmth: 1 },
        tone: 440,
      },
      {
        label: 'Step through the ring',
        detail: 'Poor hiking advice · excellent story',
        result: 'For seven seconds, the rain falls upward. Your compass becomes sentimental.',
        delta: { miles: 6, provisions: -1, wonder: 12, warmth: -2 },
        tone: 659,
      },
    ],
  },
  {
    place: 'Foxfire Ford',
    time: 'Day 1 · 4:03 P.M.',
    weather: 'RAIN · 46°',
    title: 'The river has eaten the footbridge.',
    story:
      'Blue-green light moves beneath the surface like a second sky. On the far bank: dry timber, a tin trail marker, and the promise of soup.',
    micro: 'DEPTH UNKNOWN. DIGNITY LOSS: HIGHLY LIKELY.',
    hue: '#70ffe1',
    choices: [
      {
        label: 'Build a cedar raft',
        detail: 'Warm work · one careful crossing',
        result: 'The raft lists left but arrives right. You name it Good Enough.',
        delta: { miles: 5, provisions: -2, wonder: 5, warmth: 4 },
        tone: 349,
      },
      {
        label: 'Follow the foxfire',
        detail: 'Wade the luminous shallows',
        result: 'Cold water fills both boots. The glowing stones remember your footsteps.',
        delta: { miles: 7, provisions: 0, wonder: 9, warmth: -13 },
        tone: 587,
      },
    ],
  },
  {
    place: 'The Listening Grove',
    time: 'Day 2 · 7:11 A.M.',
    weather: 'FOG · 44°',
    title: 'The trees are playing your song.',
    story:
      'Wind moves through cedar hollows in a low, wooden chord. This is a fine place to rest—or to answer with a rhythm of your own.',
    micro: 'TEMPO DETECTED: 62 BPM. FOREST IS SLIGHTLY AHEAD OF BEAT.',
    hue: '#99c2ff',
    choices: [
      {
        label: 'Make camp and listen',
        detail: 'Recover warmth · lose daylight',
        result: 'You sleep for one whole chord. When you wake, the fog knows your name.',
        delta: { miles: 3, provisions: -2, wonder: 8, warmth: 18 },
        tone: 294,
      },
      {
        label: 'Keep time on the trail',
        detail: 'Steady pace · bright spirits',
        result: 'Boot, stick, boot, stick. Even the ravens join for the chorus.',
        delta: { miles: 6, provisions: -1, wonder: 7, warmth: -4 },
        tone: 494,
      },
    ],
  },
  {
    place: 'Weather Station No. 7',
    time: 'Day 2 · 1:26 P.M.',
    weather: 'WIND · 39°',
    title: 'A storm is writing in all caps.',
    story:
      'The abandoned station still has one red lever and half a weather balloon. The pass flickers behind cloud, close enough to argue with.',
    micro: 'BAROMETER RUDE. RED LEVER UNLABELED. CLASSIC.',
    hue: '#f39cff',
    choices: [
      {
        label: 'Pull the red lever',
        detail: 'Trust obsolete infrastructure',
        result: 'A siren coughs once. Then every lamp on the mountain glows magenta.',
        delta: { miles: 6, provisions: 0, wonder: 13, warmth: -5 },
        tone: 698,
      },
      {
        label: 'Patch the weather balloon',
        detail: 'Shelter first · signal the summit',
        result: 'The balloon becomes a silver roof. You eat soup beneath a floating moon.',
        delta: { miles: 4, provisions: -2, wonder: 6, warmth: 14 },
        tone: 415,
      },
    ],
  },
  {
    place: 'Mirror Lake',
    time: 'Day 2 · 7:52 P.M.',
    weather: 'CLEAR · 37°',
    title: 'The shortest road goes through the stars.',
    story:
      'The lake reflects a route that is not visible on land. Crystal Ball Pass burns above it—violet, round, patient.',
    micro: 'MAP DISAGREES WITH SKY. RECOMMEND TRUSTING THE PRETTIER ONE.',
    hue: '#b69cff',
    choices: [
      {
        label: 'Walk the reflected trail',
        detail: 'Strange miles · impossible footing',
        result: 'Each step lands on a star. You do not look down after Orion.',
        delta: { miles: 7, provisions: -1, wonder: 15, warmth: -7 },
        tone: 784,
      },
      {
        label: 'Circle the black shore',
        detail: 'Safe trail · one last camp',
        result: 'You keep the lake on your left. It keeps your reflection for company.',
        delta: { miles: 5, provisions: -2, wonder: 4, warmth: 6 },
        tone: 466,
      },
    ],
  },
  {
    place: 'Crystal Ball Pass',
    time: 'Day 3 · Before Sunrise',
    weather: 'AURORA · 34°',
    title: 'The mountain asks one final question.',
    story:
      'A round light floats between two ancient firs. It shows every road you did not take—and makes none of them feel like mistakes.',
    micro: 'DESTINATION CONFIRMED. DEFINITION OF DESTINATION REVISED.',
    hue: '#e6b6ff',
    choices: [
      {
        label: 'Place a hand on the light',
        detail: 'Finish the passage',
        result: 'The pass opens like an eye. For a moment, the whole forest can see you.',
        delta: { miles: 6, provisions: 0, wonder: 20, warmth: 3 },
        tone: 880,
      },
      {
        label: 'Ask the forest first',
        detail: 'Wait for the answer',
        result: 'Three owls call. The crystal answers with your own heartbeat.',
        delta: { miles: 5, provisions: -1, wonder: 24, warmth: 1 },
        tone: 988,
      },
    ],
  },
];

export const CRYSTAL_BALL_PASS_REVIEW = {
  id: 'crystal-ball-pass-v1',
  slug: 'crystal-ball-pass',
  product: 'Crystal Ball Pass',
  version: '1.0',
  category: 'Browser game',
  platform: 'Responsive web',
  title: 'Crystal Ball Pass knows exactly how long a walk should be',
  dek: 'Seven trail decisions, one glowing pocket guide, and an Oregon Trail-sized sense of consequence compressed into five lovely minutes.',
  publishedAt: '2026-08-01T00:20:00-07:00',
  reviewer: 'Codex for PointCast Review Lab',
  rating: 4.6,
  image: '/images/crystal-ball-pass/og.png',
  imageWidth: 1536,
  imageHeight: 1024,
  imageAlt: 'A luminous violet crystal orb waits in a misty mountain pass above a mossy Pacific Northwest trail and small field computer',
  verdict: 'A small, complete forest story with excellent atmosphere, funny writing, and just enough survival math to make every pretty route feel dangerous.',
  reviewUrl: '/reviews/crystal-ball-pass',
  jsonUrl: '/reviews/crystal-ball-pass.json',
  experienceUrl: '/crystal-ball-pass',
  standaloneUrl: 'https://pointcast.xyz/crystal-ball-pass',
  blockId: '0550',
  status: 'published' as const,
  tags: ['game', 'forest', 'audio', 'local-first', 'Codex Micro'],
};
