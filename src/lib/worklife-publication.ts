export type WorklifeMovementId = 'clock-in' | 'name-badge' | 'middle' | 'exit';

export interface WorklifeTrack {
  position: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  spotifyUrl: string;
  movement: WorklifeMovementId;
  note: string;
}

export interface WorklifeMovement {
  id: WorklifeMovementId;
  number: string;
  title: string;
  deck: string;
  positions: readonly number[];
}

export const WORKLIFE_PUBLICATION = {
  schema: 'pointcast-worklife-publication/v1',
  id: 'worklife',
  title: 'WORK/LIFE',
  dek: 'What work does to a life, and what a life does back.',
  description:
    'A PointCast publication about jobs, tools, ambition, boredom, management, money, lunch, clothes, commutes, exits, and the emotional weather of getting something done.',
  route: '/worklife',
  jsonRoute: '/worklife.json',
  canonicalUrl: 'https://pointcast.xyz/worklife',
  cadence: {
    label: 'A continuing PointCast publication',
    mode: 'human-edited',
    automation: false,
    note:
      'WORK/LIFE publishes when there is a working truth worth keeping. Monday is an opening scene, not the publication boundary.',
  },
  participation: {
    state: 'light-touch',
    note:
      'No new inbox or work-history harvest. Readers can use the device-local follow shelf or send PointCast a direct pitch.',
  },
} as const;

export const WORKLIFE_DESKS = [
  {
    id: 'shift',
    title: 'The Shift',
    description: 'Routines, commutes, calendars, uniforms, clocks, and the choreography of beginning.',
  },
  {
    id: 'weather',
    title: 'Office Weather',
    description: 'Culture, management, meetings, morale, power, and the pressure nobody put in the deck.',
  },
  {
    id: 'tools',
    title: 'Tool Drawer',
    description: 'Software, notebooks, machines, shortcuts, policies, and objects that change the job.',
  },
  {
    id: 'lunch',
    title: 'Lunch',
    description: 'Breaks, third places, desk food, walks, friendship, and the small return of the self.',
  },
  {
    id: 'payroll',
    title: 'Payroll',
    description: 'Rates, value, benefits, credit, ownership, precarity, and what the number leaves out.',
  },
  {
    id: 'exit',
    title: 'Exit Interview',
    description: 'Quitting, changing course, retirement, reinvention, refusal, and the life after the title.',
  },
] as const;

export const MANIC_MONDAY = {
  schema: 'pointcast-worklife-issue/v1',
  id: 'worklife-001',
  issueNumber: '001',
  slug: '001',
  title: 'ANOTHER MANIC MONDAY',
  displayTitle: 'WORK/LIFE 001 — ANOTHER MANIC MONDAY',
  kicker: 'PointCast · WORK/LIFE · Issue 001',
  description:
    'Eighteen tracks for clock-in comedy, friction, flow, identity, and the part where work has to return you to your actual life.',
  editorialNote:
    'The first WORK/LIFE issue begins with the joke everyone knows, lets the clock become strange, and refuses to pretend a working day resolves cleanly.',
  route: '/worklife/001',
  jsonRoute: '/worklife/001.json',
  canonicalUrl: 'https://pointcast.xyz/worklife/001',
  cover: '/images/worklife/001-cover.png',
  coverAlt:
    'Graphic PointCast WORK/LIFE cover with a cream timecard, cobalt clock, orange punch mark, chartreuse field, and black schedule lines bending out of office formation',
  spotifyPlaylistId: '3JXWUjuBZ4VTl1TYPnfH60',
  spotifyUrl: 'https://open.spotify.com/playlist/3JXWUjuBZ4VTl1TYPnfH60',
  publishedAt: '2026-08-03T09:12:00-07:00',
  trackCount: 18,
  duration: '1 hr 10 min',
  durationMinutes: 70,
  blockId: '0555',
  author: 'codex',
  source:
    'Michael Hoydich chat directive, 2026-08-03: create a Monday morning playlist, start a broader worklife publication on PointCast, and use the playlist as the opener with a Manic Monday joke.',
  participation: WORKLIFE_PUBLICATION.participation,
} as const;

export const MANIC_MONDAY_MOVEMENTS: readonly WorklifeMovement[] = [
  {
    id: 'clock-in',
    number: '01',
    title: 'Clock in, laughing',
    deck: 'The obvious opener, one ambient trapdoor, and two ways of admitting what time it is.',
    positions: [1, 2, 3, 4],
  },
  {
    id: 'name-badge',
    number: '02',
    title: 'Who are you at work?',
    deck: 'A name badge comes loose. Identity, refusal, rhythm, and one genuinely lovely day.',
    positions: [5, 6, 7, 8, 9],
  },
  {
    id: 'middle',
    number: '03',
    title: 'The fluorescent middle',
    deck: 'Long hours, blue light, a live room, busy earning, and a town running on pressure.',
    positions: [10, 11, 12, 13, 14],
  },
  {
    id: 'exit',
    number: '04',
    title: 'Exit interview',
    deck: 'Work speaks plainly at the end: labor, options, the office invitation, and the knife.',
    positions: [15, 16, 17, 18],
  },
] as const;

export const MANIC_MONDAY_TRACKS: readonly WorklifeTrack[] = [
  {
    position: 1,
    title: 'Manic Monday',
    artist: 'The Bangles',
    album: 'Different Light (Expanded Edition)',
    duration: '3:04',
    spotifyUrl: 'https://open.spotify.com/track/00vYs0qZA40Z8AAaN7xmMO',
    movement: 'clock-in',
    note: 'The joke is familiar because the arrangement still makes the complaint feel buoyant.',
  },
  {
    position: 2,
    title: 'The Big Ship — 2004 Remaster',
    artist: 'Brian Eno',
    album: 'Another Green World (2004 Remaster)',
    duration: '3:01',
    spotifyUrl: 'https://open.spotify.com/track/2d9KBVxb6bUfVCjjv1JAVe',
    movement: 'clock-in',
    note: 'Before the inbox, a three-minute room with no fluorescent ceiling.',
  },
  {
    position: 3,
    title: 'Monday Morning',
    artist: 'Fleetwood Mac',
    album: 'Fleetwood Mac',
    duration: '2:47',
    spotifyUrl: 'https://open.spotify.com/track/0qjfjKFoP7LaqLI2KI9M1Q',
    movement: 'clock-in',
    note: 'The week comes back with harmonies, momentum, and a tiny deadline.',
  },
  {
    position: 4,
    title: '9 to 5',
    artist: 'Dolly Parton',
    album: '9 To 5 And Odd Jobs',
    duration: '2:46',
    spotifyUrl: 'https://open.spotify.com/track/4w3tQBXhn5345eUXDGBWZG',
    movement: 'clock-in',
    note: 'A perfect pop machine whose grievance never got ironed out.',
  },
  {
    position: 5,
    title: 'You Can Call Me Al',
    artist: 'Paul Simon',
    album: 'Graceland (25th Anniversary Deluxe Edition)',
    duration: '4:40',
    spotifyUrl: 'https://open.spotify.com/track/0qxYx4F3vm1AOnfux6dDxP',
    movement: 'name-badge',
    note: 'The business card, the soft middle, the question of who exactly showed up.',
  },
  {
    position: 6,
    title: 'Watching The Wheels — Remastered 2010',
    artist: 'John Lennon',
    album: 'Double Fantasy',
    duration: '3:59',
    spotifyUrl: 'https://open.spotify.com/track/26Kw6zBo3Uy98q5LTlFfVJ',
    movement: 'name-badge',
    note: 'A cheerful refusal to let productivity explain a whole person.',
  },
  {
    position: 7,
    title: 'Once in a Lifetime',
    artist: 'Talking Heads',
    album: 'Remain in Light',
    duration: '4:19',
    spotifyUrl: 'https://open.spotify.com/track/1Tr4K5MU5XYE44umXGDndd',
    movement: 'name-badge',
    note: 'The org chart dissolves and the life underneath it looks very surprising.',
  },
  {
    position: 8,
    title: "Workin' Day and Night",
    artist: 'Michael Jackson',
    album: 'Off the Wall',
    duration: '5:12',
    spotifyUrl: 'https://open.spotify.com/track/6BdiFsPMPkSEEO4fFXFVWX',
    movement: 'name-badge',
    note: 'The fastest way through the to-do list, with the cost still audible.',
  },
  {
    position: 9,
    title: 'Lovely Day',
    artist: 'Bill Withers',
    album: 'Menagerie',
    duration: '4:17',
    spotifyUrl: 'https://open.spotify.com/track/0bRXwKfigvpKZUurwqAlEh',
    movement: 'name-badge',
    note: 'Not motivation. Company.',
  },
  {
    position: 10,
    title: 'The Working Hour',
    artist: 'Tears For Fears',
    album: 'Songs From The Big Chair',
    duration: '6:31',
    spotifyUrl: 'https://open.spotify.com/track/23DKn3AP0fpx1aAYth2Pax',
    movement: 'middle',
    note: 'The middle of the day gets six and a half minutes of weather.',
  },
  {
    position: 11,
    title: 'Blue Monday',
    artist: 'New Order',
    album: 'Substance',
    duration: '7:29',
    spotifyUrl: 'https://open.spotify.com/track/6hHc7Pks7wtBIW8Z6A0iFq',
    movement: 'middle',
    note: 'Machines, repetition, resentment, precision: the conference room becomes a club.',
  },
  {
    position: 12,
    title: 'This Must Be the Place (Naive Melody) — Live',
    artist: 'Talking Heads',
    album: 'Stop Making Sense (Live)',
    duration: '4:57',
    spotifyUrl: 'https://open.spotify.com/track/0cAPfvvqFZsqsIz3ZDSKIa',
    movement: 'middle',
    note: 'A live room that remembers people are the reason to build a room.',
  },
  {
    position: 13,
    title: "Busy Earnin'",
    artist: 'Jungle',
    album: 'Jungle',
    duration: '3:01',
    spotifyUrl: 'https://open.spotify.com/track/5TloYFwzd09yWy8xkRLVUu',
    movement: 'middle',
    note: 'The title is on the nose; the groove is too good to file a complaint.',
  },
  {
    position: 14,
    title: 'Town Called Malice',
    artist: 'The Jam',
    album: 'The Gift',
    duration: '2:53',
    spotifyUrl: 'https://open.spotify.com/track/0gdmDP6xy3ZV7JNoHWAN9k',
    movement: 'middle',
    note: 'Work leaves the office and becomes housing, streets, family, and pressure.',
  },
  {
    position: 15,
    title: "Workin' Woman Blues",
    artist: 'Valerie June',
    album: "Pushin' Against A Stone",
    duration: '3:05',
    spotifyUrl: 'https://open.spotify.com/track/58KQWfgO3DEu4kHlsmQEXz',
    movement: 'exit',
    note: 'The body keeps a more accurate timesheet than the office.',
  },
  {
    position: 16,
    title: 'Career Opportunities — Remastered',
    artist: 'The Clash',
    album: 'The Clash (Remastered)',
    duration: '1:54',
    spotifyUrl: 'https://open.spotify.com/track/4aKMvmxQgX7J766G4pFlyh',
    movement: 'exit',
    note: 'A job board read at exactly the correct speed.',
  },
  {
    position: 17,
    title: 'Step Into My Office, Baby',
    artist: 'Belle and Sebastian',
    album: 'Dear Catastrophe Waitress',
    duration: '4:12',
    spotifyUrl: 'https://open.spotify.com/track/2wVV83kPlxsCF3VMEMVyMP',
    movement: 'exit',
    note: 'Charm, hierarchy, performance review, and a wink that does not clear the paperwork.',
  },
  {
    position: 18,
    title: 'Working for the Knife',
    artist: 'Mitski',
    album: 'Laurel Hell',
    duration: '2:38',
    spotifyUrl: 'https://open.spotify.com/track/2ORVHijyYA8bAOCVaIbmdS',
    movement: 'exit',
    note: 'No false Friday ending. The first issue keeps one honest edge.',
  },
] as const;

export const tracksForWorklifeMovement = (id: WorklifeMovementId) =>
  MANIC_MONDAY_TRACKS.filter((track) => track.movement === id);
