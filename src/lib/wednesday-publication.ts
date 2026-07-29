import { WEDNESDAY_MORNING_UPLIFT } from './wednesday-morning-uplift';

export type WednesdayMovementId = 'pencil' | 'motion' | 'groove' | 'life';

export interface WednesdayTrack {
  position: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  spotifyUrl: string;
  movement: WednesdayMovementId;
  note: string;
}

export interface WednesdayMovement {
  id: WednesdayMovementId;
  number: string;
  title: string;
  deck: string;
  positions: readonly number[];
}

export const WEDNESDAY_PUBLICATION = {
  schema: 'pointcast-playlist-publication/v1',
  id: 'wednesday-0934',
  title: 'WEDNESDAY 9:34',
  dek: 'One good playlist for the useful middle of the week.',
  description:
    'A weekly PointCast playlist publication for the moment when the day is real, the work is enjoyable, and a little lift would make the whole board move.',
  route: '/wednesday',
  jsonRoute: '/wednesday.json',
  canonicalUrl: 'https://pointcast.xyz/wednesday',
  cadence: {
    label: 'Wednesdays at 9:34 PT',
    timezone: 'America/Los_Angeles',
    weekday: 'Wednesday',
    localTime: '09:34',
    mode: 'human-edited',
    automation: false,
    note:
      'The calendar is a public editorial promise, not an automated-content claim. Each issue ships only after its playlist, cover, sequence, machine twin, and playback are checked.',
  },
  participation: {
    state: 'light-touch',
    note:
      'No newsletter form yet. Readers can keep a device-local follow, send a direct ping, or bring an optional PointCast signal passport while the durable subscription shape stays open.',
  },
} as const;

export const GOOD_WORK = {
  schema: 'pointcast-playlist-feature/v1',
  id: 'good-work-002',
  issueNumber: '002',
  slug: '002',
  title: 'THE GOOD WORK',
  displayTitle: 'WEDNESDAY 9:34 / THE GOOD WORK',
  shortTitle: 'The Good Work',
  kicker: 'PointCast · WEDNESDAY 9:34 · Issue 002',
  description:
    'Eighteen tracks for clearing the board without treating life like a dashboard: instrumental pencil, art-pop motion, elegant electronics, one useful surge, and an Air-conditioned landing.',
  editorialNote:
    'The second Wednesday starts quieter than the first. It earns attention by making a work surface beautiful, then lets the rhythm do the organizing.',
  route: '/wednesday/002',
  jsonRoute: '/wednesday/002.json',
  canonicalUrl: 'https://pointcast.xyz/wednesday/002',
  cover: '/images/playlists/wednesday-0934-good-work-cover.png',
  coverAlt:
    'Chartreuse PointCast cover led by an oversized WEDNESDAY title, blue 9:34 time, cream work card, blue index tabs, and seven black lines lifting into curves',
  spotifyPlaylistId: '6cO8Len9xWLVftJePvuQhp',
  spotifyUrl: 'https://open.spotify.com/playlist/6cO8Len9xWLVftJePvuQhp',
  listeningRoomUrl: '/listening-room?pl=6cO8Len9xWLVftJePvuQhp',
  publishedAt: '2026-07-29T09:34:00-07:00',
  trackCount: 18,
  duration: '1 hr 23 min',
  durationMinutes: 83,
  blockId: '0538',
  author: 'codex',
  source:
    'Michael Hoydich chat directive, 2026-07-29: make a different Wednesday uplift that is art-forward, subtly attention-seeking, led by the day, and useful at 9:34 for enjoyable busy work and a great life.',
  participation: WEDNESDAY_PUBLICATION.participation,
} as const;

export const GOOD_WORK_MOVEMENTS: readonly WednesdayMovement[] = [
  {
    id: 'pencil',
    number: '01',
    title: 'Put down the pencil',
    deck: 'Two instrumentals make a clean margin; then the first task finds a pulse.',
    positions: [1, 2, 3, 4],
  },
  {
    id: 'motion',
    number: '02',
    title: 'Make the small things move',
    deck: 'Art-pop and sample light turn the list into forward motion.',
    positions: [5, 6, 7, 8, 9],
  },
  {
    id: 'groove',
    number: '03',
    title: 'Stay inside the groove',
    deck: 'The useful middle: warm bass, bright systems, and no need to hurry.',
    positions: [10, 11, 12, 13, 14, 15],
  },
  {
    id: 'life',
    number: '04',
    title: 'Clear the desk, keep the life',
    deck: 'A job, a flower, and seven silver minutes that leave the room better.',
    positions: [16, 17, 18],
  },
] as const;

export const GOOD_WORK_TRACKS: readonly WednesdayTrack[] = [
  {
    position: 1,
    title: 'Sketch for Summer',
    artist: 'The Durutti Column',
    album: 'The Return of The Durutti Column',
    duration: '2:58',
    spotifyUrl: 'https://open.spotify.com/track/2oeLt7N1amHZiev27FvKE2',
    movement: 'pencil',
    note: 'A clear sheet of paper with air already moving across it.',
  },
  {
    position: 2,
    title: "St Elmo's Fire — Remastered 2004",
    artist: 'Brian Eno',
    album: 'Another Green World (2004 Remaster)',
    duration: '3:02',
    spotifyUrl: 'https://open.spotify.com/track/0UROPTHqU5C7TI1N8wOkIF',
    movement: 'pencil',
    note: 'The work light comes on without becoming fluorescent.',
  },
  {
    position: 3,
    title: 'Freelance',
    artist: 'Toro y Moi',
    album: 'Outer Peace',
    duration: '3:45',
    spotifyUrl: 'https://open.spotify.com/track/1mt71aWdYMEvfZEx3q8CPI',
    movement: 'pencil',
    note: 'A sly little instruction manual for moving anyway.',
  },
  {
    position: 4,
    title: "Can't Do Without You",
    artist: 'Caribou',
    album: 'Our Love (Expanded Edition)',
    duration: '3:56',
    spotifyUrl: 'https://open.spotify.com/track/6yhca6TNRzwG2zp6AuidaE',
    movement: 'pencil',
    note: 'Repetition starts doing useful emotional labor.',
  },
  {
    position: 5,
    title: 'Ritual Union',
    artist: 'Little Dragon',
    album: 'Ritual Union',
    duration: '3:30',
    spotifyUrl: 'https://open.spotify.com/track/5uTjNzGKCQ50synrf9dWmT',
    movement: 'motion',
    note: 'The first clean seam between task and pleasure.',
  },
  {
    position: 6,
    title: 'Since I Left You',
    artist: 'The Avalanches',
    album: 'Since I Left You (20th Anniversary Deluxe Edition)',
    duration: '4:22',
    spotifyUrl: 'https://open.spotify.com/track/1AAYbsAIgEJMbxgLgpjE9y',
    movement: 'motion',
    note: 'A hundred fragments agree to become one good room.',
  },
  {
    position: 7,
    title: 'Sound and Vision — 2017 Remaster',
    artist: 'David Bowie',
    album: 'Low (2017 Remaster)',
    duration: '3:04',
    spotifyUrl: 'https://open.spotify.com/track/1vP2JEXRsGrFbwOZ0foOQ5',
    movement: 'motion',
    note: 'The familiar door opens, but only after the desk is moving.',
  },
  {
    position: 8,
    title: 'Lisztomania',
    artist: 'Phoenix',
    album: 'Wolfgang Amadeus Phoenix',
    duration: '4:01',
    spotifyUrl: 'https://open.spotify.com/track/4esUVfYnFcCCVHntx9FQCb',
    movement: 'motion',
    note: 'A bright headline with excellent internal organization.',
  },
  {
    position: 9,
    title: "Busy Earnin'",
    artist: 'Jungle',
    album: 'Jungle',
    duration: '3:01',
    spotifyUrl: 'https://open.spotify.com/track/5TloYFwzd09yWy8xkRLVUu',
    movement: 'motion',
    note: 'The on-the-nose title earns its place by being this nimble.',
  },
  {
    position: 10,
    title: 'Time (You and I)',
    artist: 'Khruangbin',
    album: 'Mordechai',
    duration: '5:42',
    spotifyUrl: 'https://open.spotify.com/track/0S3BtG3i5tkQmehJhIhHF3',
    movement: 'groove',
    note: 'The center of the issue stretches its legs.',
  },
  {
    position: 11,
    title: 'Harmony Hall',
    artist: 'Vampire Weekend',
    album: 'Father of the Bride',
    duration: '5:08',
    spotifyUrl: 'https://open.spotify.com/track/39exKIvycQDgs4T6uXdyu0',
    movement: 'groove',
    note: 'One window open, one chorus large enough for the whole table.',
  },
  {
    position: 12,
    title: 'On',
    artist: 'Kelly Lee Owens',
    album: 'Inner Song',
    duration: '5:57',
    spotifyUrl: 'https://open.spotify.com/track/167c1Blr84k9YpSCHLNh9m',
    movement: 'groove',
    note: 'Focus becomes a physical place instead of a command.',
  },
  {
    position: 13,
    title: 'Home to You',
    artist: 'Cate Le Bon',
    album: 'Reward',
    duration: '5:27',
    spotifyUrl: 'https://open.spotify.com/track/7qitgFPgLVhZxlsqpohecV',
    movement: 'groove',
    note: 'Angular, human, and quietly impossible to ignore.',
  },
  {
    position: 14,
    title: 'Huarache Lights',
    artist: 'Hot Chip',
    album: 'Why Make Sense? (Definitive Version)',
    duration: '5:29',
    spotifyUrl: 'https://open.spotify.com/track/24OUTJgZif1CA1nemnDgXn',
    movement: 'groove',
    note: 'The checklist gets a tiny laser system.',
  },
  {
    position: 15,
    title: 'Inspector Norse',
    artist: 'Todd Terje',
    album: "It's the Arps",
    duration: '6:40',
    spotifyUrl: 'https://open.spotify.com/track/1NHd4UVxT5d5EGYzlDq17T',
    movement: 'groove',
    note: 'The productive high point arrives smiling, not shouting.',
  },
  {
    position: 16,
    title: 'Found a Job',
    artist: 'Talking Heads',
    album: 'More Songs About Buildings and Food',
    duration: '4:59',
    spotifyUrl: 'https://open.spotify.com/track/5JgB38WStxku1uvo30tFsn',
    movement: 'life',
    note: 'The issue finally names the work after the work feels good.',
  },
  {
    position: 17,
    title: 'The Flower Called Nowhere',
    artist: 'Stereolab',
    album: 'Late Night Tales: BADBADNOTGOOD',
    duration: '4:55',
    spotifyUrl: 'https://open.spotify.com/track/3xOERZr8FOMpxhMf0hGC7G',
    movement: 'life',
    note: 'One elegant refusal to make usefulness the whole point.',
  },
  {
    position: 18,
    title: "La femme d'argent",
    artist: 'Air',
    album: 'Moon Safari',
    duration: '7:06',
    spotifyUrl: 'https://open.spotify.com/track/6tEaLXZlN8b71vWV1SSsRf',
    movement: 'life',
    note: 'Seven silver minutes return the desk to the rest of the life.',
  },
] as const;

export const WEDNESDAY_ISSUES = [
  {
    issueNumber: '001',
    title: WEDNESDAY_MORNING_UPLIFT.title,
    subtitle: WEDNESDAY_MORNING_UPLIFT.edition,
    route: WEDNESDAY_MORNING_UPLIFT.route,
    jsonRoute: WEDNESDAY_MORNING_UPLIFT.jsonRoute,
    spotifyUrl: WEDNESDAY_MORNING_UPLIFT.spotifyUrl,
    cover: WEDNESDAY_MORNING_UPLIFT.cover,
    coverAlt: WEDNESDAY_MORNING_UPLIFT.coverAlt,
    description: WEDNESDAY_MORNING_UPLIFT.description,
    publishedAt: WEDNESDAY_MORNING_UPLIFT.publishedAt,
    trackCount: WEDNESDAY_MORNING_UPLIFT.trackCount,
    duration: WEDNESDAY_MORNING_UPLIFT.duration,
    blockId: WEDNESDAY_MORNING_UPLIFT.blockId,
    status: 'live',
    mode: 'porch-to-sky',
  },
  {
    issueNumber: GOOD_WORK.issueNumber,
    title: GOOD_WORK.displayTitle,
    subtitle: GOOD_WORK.shortTitle,
    route: GOOD_WORK.route,
    jsonRoute: GOOD_WORK.jsonRoute,
    spotifyUrl: GOOD_WORK.spotifyUrl,
    cover: GOOD_WORK.cover,
    coverAlt: GOOD_WORK.coverAlt,
    description: GOOD_WORK.description,
    publishedAt: GOOD_WORK.publishedAt,
    trackCount: GOOD_WORK.trackCount,
    duration: GOOD_WORK.duration,
    blockId: GOOD_WORK.blockId,
    status: 'live',
    mode: 'beautifully-lit-desk',
  },
] as const;

export const WEDNESDAY_EDITORIAL_CALENDAR = [
  {
    date: '2026-07-29',
    issue: '001 + 002',
    status: 'pilot double issue',
    brief: 'Two proofs of range: porch-to-sky and beautifully lit desk.',
  },
  {
    date: '2026-08-05',
    issue: '003',
    status: 'open brief',
    brief: 'One useful hour: soft mechanics, no anthem before track five.',
  },
  {
    date: '2026-08-12',
    issue: '004',
    status: 'open brief',
    brief: 'Guest desk: what makes work feel like a life?',
  },
  {
    date: '2026-08-19',
    issue: '005',
    status: 'open brief',
    brief: 'Late-summer air conditioning and a little rhythm section.',
  },
  {
    date: '2026-08-26',
    issue: '006',
    status: 'open brief',
    brief: '1986 ↔ 2026: one bridge, no nostalgia costume.',
  },
] as const;

export function goodWorkTracksForMovement(
  movement: WednesdayMovementId,
): readonly WednesdayTrack[] {
  return GOOD_WORK_TRACKS.filter((track) => track.movement === movement);
}
