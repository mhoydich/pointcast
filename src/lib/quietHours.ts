export type QuietHourRoomId = 'tower' | 'library' | 'conservatory' | 'study' | 'hearth';

export type QuietHourAccent = Record<string, string>;

export type QuietHourRoom = {
  id: QuietHourRoomId;
  slug: QuietHourRoomId;
  name: string;
  subtitle: string;
  romanNumeral: string;
  postureVerb: 'stand' | 'walk' | 'watch' | 'write' | 'rest';
  practice: string;
  image: string;
  hourBand: string;
  startHour: number;
  endHour: number;
  lead: string;
  prompts: string[];
  audioProfile: string;
  crossLink: {
    href: string;
    label: string;
  };
  accent: QuietHourAccent;
};

export const QUIET_HOURS_RELEASE = {
  id: 'quiet-hours-v1',
  name: 'Quiet Hours',
  label: 'V1 - Five painted rooms across the day',
  human: 'https://pointcast.xyz/quiet-hours',
  json: 'https://pointcast.xyz/quiet-hours.json',
  journalKey: 'pointcast.quiet-hours.journal.v1',
  visitedKey: 'pointcast.quiet-hours.visited.v1',
  version: 1,
};

export const QUIET_HOUR_ROOMS: QuietHourRoom[] = [
  {
    id: 'tower',
    slug: 'tower',
    name: 'Tower Alcove',
    subtitle: 'Morning',
    romanNumeral: 'I',
    postureVerb: 'stand',
    practice: 'name the day before naming yourself in it',
    image: '/quiet-hours/01-tower.png',
    hourBand: '5:00 AM – 9:00 AM',
    startHour: 5,
    endHour: 9,
    lead: 'The first hour belongs to the watch. From the alcove the town reads like a map you can still change. Light has not yet found its long opinions; the air keeps its options open. This is the room for looking ahead without flinching, for naming the day before naming yourself in it. Stand near the window. Let one quiet plan come and go without arguing back.',
    prompts: [
      'Name one thing the day will be about, then let it be small.',
      'Notice what the air is doing before you tell it what to do.',
      'Whose plan is the loudest in your head? Set it on the sill.',
      'Look at the rooftops once. Name the first three colors.',
      "What's the smallest version of today that still counts?",
    ],
    audioProfile: 'wind on stone (subtle, low, rare gusts — 600-1500 Hz bandpass noise)',
    crossLink: {
      href: '/goal',
      label: 'look ahead at one declared goal',
    },
    accent: {
      stoneGrey: '#b9c0c8',
      leafGreen: '#9ddc67',
      terracotta: '#d7a777',
      dawnCream: '#fff5e1',
    },
  },
  {
    id: 'library',
    slug: 'library',
    name: 'Library Passage',
    subtitle: 'Day',
    romanNumeral: 'II',
    postureVerb: 'walk',
    practice: "read three pages of something you didn't open looking for",
    image: '/quiet-hours/02-library.png',
    hourBand: '9:00 AM – 3:00 PM',
    startHour: 9,
    endHour: 15,
    lead: "The middle hours pass through the library, between rooms with no need to settle in either. Books on both sides; a long carpet that asks for footsteps. This is the room of going-between — neither the morning's high watch nor the evening's gather. Read three pages of something you didn't open looking for. Note one sentence. Move on. The passage is the practice.",
    prompts: [
      'Pick the wrong book on purpose. Read three pages.',
      "Pass through. Don't shelve yet.",
      'Note one sentence that argues with you.',
      "Walk the corridor. Don't stop at the first invitation.",
      "What did the morning's plan forget?",
    ],
    audioProfile: 'page rustle (rare, soft — gentle paper-scuff via filtered noise bursts at 1-3s intervals)',
    crossLink: {
      href: '/me',
      label: 'between-place check-in',
    },
    accent: {
      oxblood: '#6d2d1f',
      brass: '#c89455',
      parchment: '#f1e3b6',
      lampWarm: '#ffb14a',
    },
  },
  {
    id: 'conservatory',
    slug: 'conservatory',
    name: 'Conservatory',
    subtitle: 'Twilight',
    romanNumeral: 'III',
    postureVerb: 'watch',
    practice: 'notice the difference between dusk-as-event and dusk-as-mood',
    image: '/quiet-hours/03-conservatory.png',
    hourBand: '3:00 PM – 7:00 PM',
    startHour: 15,
    endHour: 19,
    lead: 'At the seam of the day the conservatory holds the light a moment longer. Glass on three sides, plants gone deeper green, the sky doing its honest fifteen-minute work. This is the room for marking the change. Watch the color leave one leaf. Do not narrate it. Notice the difference between dusk-as-event and dusk-as-mood and choose which one you are tonight.',
    prompts: [
      'Watch the color leave one leaf.',
      'Are you dusk-as-event or dusk-as-mood tonight?',
      "Don't narrate the change.",
      'Tell the day what it was without making it a story yet.',
      'The seam holds. Stand inside the seam.',
    ],
    audioProfile: 'cicada-into-evening (a slow, sparse high-frequency chitter that thins as the hour ages — very subtle)',
    crossLink: {
      // /tonight doesn't exist on prod yet; route Conservatory's seam-of-day
      // link to /window (the live El Segundo sky/weather surface) for now.
      href: '/window',
      label: 'the El Segundo sky right now',
    },
    accent: {
      violetNight: '#6b558e',
      lampOrange: '#ff9a3c',
      leafDeep: '#3a8a5a',
      glassGrey: '#a4b1bf',
    },
  },
  {
    id: 'study',
    slug: 'study',
    name: 'Study',
    subtitle: 'Dusk',
    romanNumeral: 'IV',
    postureVerb: 'write',
    practice: 'one small honesty on the page',
    image: '/quiet-hours/04-study.png',
    hourBand: '7:00 PM – 10:00 PM',
    startHour: 19,
    endHour: 22,
    lead: "After supper the study lights its lamp and asks for one small honesty. A page; a word; a list of three things that mattered. The room is small on purpose. Don't write the whole day down — write the part you'd be embarrassed to have someone find five years from now if they only got to read this. Then close the book and leave the lamp on for the next person.",
    prompts: [
      "Write the part you'd be embarrassed for someone to find.",
      'Three things that mattered. Not the whole day.',
      'Leave the lamp on for the next person.',
      'Name one truth the day taught you against your will.',
      'Close the book before it gets clever.',
    ],
    audioProfile: 'pen-scratch (a sparse, gentle scrape — comb-filtered noise at irregular 2-5s intervals)',
    crossLink: {
      href: '/goal',
      label: "mark today's daily action",
    },
    accent: {
      ink: '#1a1108',
      lampGold: '#f1c060',
      paper: '#f1e3b6',
      rust: '#a0552a',
    },
  },
  {
    id: 'hearth',
    slug: 'hearth',
    name: 'Hearth Room',
    subtitle: 'Night',
    romanNumeral: 'V',
    postureVerb: 'rest',
    practice: "disassemble the day; don't summarize it",
    image: '/quiet-hours/05-hearth.png',
    hourBand: '10:00 PM – 5:00 AM',
    startHour: 22,
    endHour: 5,
    lead: "The hearth room is for after writing. The fire is banked, not stoked; the room is warm, not bright. This is the hour for the practice you don't call a practice — the slow disassembly of the day, the staring at a coal until it teaches you to stop staring. Sit on the floor if the chair feels formal. Don't sleep here. Let the fire teach you the difference between rest and surrender.",
    prompts: [
      "The fire is banked. Don't stoke.",
      'Stare at a coal until it teaches you to stop staring.',
      "Don't sleep here.",
      'What was rest for, today?',
      "Disassemble. Don't summarize.",
    ],
    audioProfile: "low banked-fire (sparse warm low-frequency crackles, fewer than V9's hearth)",
    crossLink: {
      href: '/gandalf',
      label: 'V10 Atelier hearth fires',
    },
    accent: {
      ember: '#ffb14a',
      mahogany: '#6d2d1f',
      char: '#1f160c',
      cream: '#faefc7',
    },
  },
];

export function isHourInRoom(hour: number, room: QuietHourRoom): boolean {
  const normalized = ((Math.floor(hour) % 24) + 24) % 24;
  if (room.startHour < room.endHour) {
    return normalized >= room.startHour && normalized < room.endHour;
  }
  return normalized >= room.startHour || normalized < room.endHour;
}

export function pickRoomForHour(hour: number): QuietHourRoom {
  return QUIET_HOUR_ROOMS.find((room) => isHourInRoom(hour, room)) ?? QUIET_HOUR_ROOMS[0];
}

export function pickRoomFor(date: Date = new Date()): QuietHourRoom {
  return pickRoomForHour(date.getHours());
}

export function roomOfNowFor(utcHour: number): QuietHourRoomId {
  return pickRoomForHour(utcHour).id;
}

export function roomUtcHourMap(): Record<string, QuietHourRoomId> {
  return Object.fromEntries(
    Array.from({ length: 24 }, (_, hour) => [String(hour).padStart(2, '0'), roomOfNowFor(hour)]),
  ) as Record<string, QuietHourRoomId>;
}

export function dateHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function promptIndexForDate(roomId: QuietHourRoomId, date: Date = new Date()): number {
  const dayKey = localDateKey(date);
  return dateHash(`${dayKey}:${roomId}`) % 5;
}

export function pickPromptForDate(room: QuietHourRoom, date: Date = new Date()): string {
  return room.prompts[promptIndexForDate(room.id, date)];
}
