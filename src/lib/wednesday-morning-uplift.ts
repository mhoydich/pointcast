export type UpliftMovement = 'porch' | 'crossing' | 'open-road' | 'landing';

export interface UpliftTrack {
  position: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  spotifyUrl: string;
  movement: UpliftMovement;
  note: string;
}

export interface UpliftMovementRecord {
  id: UpliftMovement;
  number: string;
  title: string;
  deck: string;
  positions: readonly number[];
}

export const WEDNESDAY_MORNING_UPLIFT = {
  schema: 'pointcast-playlist-feature/v1',
  id: 'updraft-01',
  slug: 'wednesday-morning-uplift',
  title: 'Wednesday Morning Uplift',
  edition: 'Updraft 01',
  shortTitle: 'Morning Uplift',
  kicker: 'PointCast Playlist 001 · Wednesday morning',
  description:
    'Eighteen songs that begin picky and plucky, cross through country-pop and the bright side of the 1970s and 1980s, touch the present tense, and land grateful.',
  editorialNote:
    'Updraft is a curve, not a genre: wood and wire first, one brave crossover, open-road lift, then the porch again.',
  route: '/playlists/wednesday-morning-uplift',
  jsonRoute: '/playlists/wednesday-morning-uplift.json',
  canonicalUrl: 'https://pointcast.xyz/playlists/wednesday-morning-uplift',
  cover: '/images/playlists/wednesday-morning-uplift-cover.png',
  coverAlt:
    'Screen-printed PointCast playlist cover with five plucked strings rising through a sunrise into leaves and morning birds',
  spotifyPlaylistId: '6l9PXUEN5nR76vqUjSTPPw',
  spotifyUrl: 'https://open.spotify.com/playlist/6l9PXUEN5nR76vqUjSTPPw',
  listeningRoomUrl: '/listening-room?pl=6l9PXUEN5nR76vqUjSTPPw',
  publishedAt: '2026-07-29T09:24:00-07:00',
  trackCount: 18,
  duration: '1 hr 25 min',
  blockId: '0537',
  author: 'codex',
  source:
    'Michael Hoydich chat directive, 2026-07-29: make a Wednesday-morning uplift PointCast playlist led by picky, plucky Grateful Dead and Jerry Garcia energy, with light pop-country, accessible 1970s and 1980s, and current-canon crossover.',
  participation: {
    state: 'light-touch',
    note:
      'No new inbox harvest in this edition. Follow can stay device-local, a ping can carry a direct note, and wallet or Spotify identity stays optional.',
    actions: [
      { label: 'Follow on this device', href: '/super-follow' },
      { label: 'Send PointCast a ping', href: '/ping' },
      { label: 'Sign in to PointCast', href: '/auth' },
    ],
  },
} as const;

export const UPLIFT_MOVEMENTS: readonly UpliftMovementRecord[] = [
  {
    id: 'porch',
    number: '01',
    title: 'Pick up from the porch',
    deck: 'Wood, wire, and a loose wrist. The morning starts human-sized.',
    positions: [1, 2, 3, 4],
  },
  {
    id: 'crossing',
    number: '02',
    title: 'Cross the kitchen',
    deck: 'Country light turns into pop architecture without losing the grain.',
    positions: [5, 6, 7, 8, 9],
  },
  {
    id: 'open-road',
    number: '03',
    title: 'Open the road',
    deck: 'The 1980s become sky, then two present-tense records keep the route alive.',
    positions: [10, 11, 12, 13, 14, 15],
  },
  {
    id: 'landing',
    number: '04',
    title: 'Lay it down grateful',
    deck: 'Three acoustic steps back to the porch. Nothing needs a victory lap.',
    positions: [16, 17, 18],
  },
] as const;

export const UPLIFT_TRACKS: readonly UpliftTrack[] = [
  {
    position: 1,
    title: "Walkin' Boss",
    artist: 'Jerry Garcia & David Grisman',
    album: 'Jerry Garcia & David Grisman',
    duration: '5:17',
    spotifyUrl: 'https://open.spotify.com/track/3iPxlxWaUHBcH6PdRYzliV',
    movement: 'porch',
    note: 'The strings wake up before the room does.',
  },
  {
    position: 2,
    title: "Uncle John's Band — 2013 Remaster",
    artist: 'Grateful Dead',
    album: "Workingman's Dead",
    duration: '4:44',
    spotifyUrl: 'https://open.spotify.com/track/0kp728Knw5PYvU3QzMZ0yJ',
    movement: 'porch',
    note: 'A first shared voice, still soft around the edges.',
  },
  {
    position: 3,
    title: 'Ramble on Rose — Lyceum 5/26/72',
    artist: 'Grateful Dead',
    album: "Europe '72",
    duration: '6:01',
    spotifyUrl: 'https://open.spotify.com/track/24ei2BLeVEpGWLZ2qfLXJO',
    movement: 'porch',
    note: 'The live room adds air without adding hurry.',
  },
  {
    position: 4,
    title: 'Deal — Milwaukee 11/23/91',
    artist: 'Jerry Garcia Band & Jerry Garcia',
    album: 'GarciaLive Volume Eight',
    duration: '8:06',
    spotifyUrl: 'https://open.spotify.com/track/2TynldhyWHpsXMbvBS7gSL',
    movement: 'porch',
    note: 'The long first climb; the updraft earns its height.',
  },
  {
    position: 5,
    title: 'Southern Nights',
    artist: 'Glen Campbell',
    album: 'Southern Nights',
    duration: '3:00',
    spotifyUrl: 'https://open.spotify.com/track/7kv7zBjMtVf0eIJle2VZxn',
    movement: 'crossing',
    note: 'The porch light becomes a radio.',
  },
  {
    position: 6,
    title: 'Wide Open Spaces',
    artist: 'The Chicks',
    album: 'Wide Open Spaces',
    duration: '3:43',
    spotifyUrl: 'https://open.spotify.com/track/6cjwec9ii5uLK7CDfPBYt1',
    movement: 'crossing',
    note: 'The pop-country door opens all the way.',
  },
  {
    position: 7,
    title: 'Graceland',
    artist: 'Paul Simon',
    album: 'Graceland',
    duration: '4:51',
    spotifyUrl: 'https://open.spotify.com/track/51KKQAgYFoJHgVIuJWHdHb',
    movement: 'crossing',
    note: 'Motion enters the arrangement before the car starts.',
  },
  {
    position: 8,
    title: 'What I Am',
    artist: 'Edie Brickell & New Bohemians',
    album: 'Shooting Rubberbands at the Stars',
    duration: '4:56',
    spotifyUrl: 'https://open.spotify.com/track/6hHUiDe461VUoTHnsplRYs',
    movement: 'crossing',
    note: 'A familiar PointCast hinge: conversational, elastic, awake.',
  },
  {
    position: 9,
    title: 'This Must Be the Place (Naive Melody)',
    artist: 'Talking Heads',
    album: 'Speaking in Tongues',
    duration: '4:56',
    spotifyUrl: 'https://open.spotify.com/track/6aBUnkXuCEQQHAlTokv9or',
    movement: 'crossing',
    note: 'Home becomes a direction instead of an address.',
  },
  {
    position: 10,
    title: 'Everywhere',
    artist: 'Fleetwood Mac',
    album: 'Greatest Hits',
    duration: '3:42',
    spotifyUrl: 'https://open.spotify.com/track/1prZ0pr6XoRCxcrC3MCL0M',
    movement: 'open-road',
    note: 'Bright machinery, used gently.',
  },
  {
    position: 11,
    title: 'The Whole of the Moon',
    artist: 'The Waterboys',
    album: 'The Whole of the Moon',
    duration: '4:59',
    spotifyUrl: 'https://open.spotify.com/track/6MYtWkoEiUNZmMe5CgCczM',
    movement: 'open-road',
    note: 'The largest sky in the sequence.',
  },
  {
    position: 12,
    title: 'Listen to the Music',
    artist: 'The Doobie Brothers',
    album: 'Toulouse Street',
    duration: '3:47',
    spotifyUrl: 'https://open.spotify.com/track/7Ar4G7Ci11gpt6sfH9Cgz5',
    movement: 'open-road',
    note: 'The obvious invitation arrives after it can be trusted.',
  },
  {
    position: 13,
    title: 'Handle With Care',
    artist: 'Traveling Wilburys',
    album: 'The Traveling Wilburys, Vol. 1',
    duration: '3:19',
    spotifyUrl: 'https://open.spotify.com/track/1G0ku3TLCGwrAHj9WPudKX',
    movement: 'open-road',
    note: 'A little humility keeps the lift from floating away.',
  },
  {
    position: 14,
    title: 'Capricorn',
    artist: 'Vampire Weekend',
    album: 'Only God Was Above Us',
    duration: '4:09',
    spotifyUrl: 'https://open.spotify.com/track/4oAGV7IADPWfkpk6aGQqZt',
    movement: 'open-road',
    note: 'The current canon enters with dust still on its shoes.',
  },
  {
    position: 15,
    title: 'Right Back to It',
    artist: 'Waxahatchee & MJ Lenderman',
    album: 'Tigers Blood',
    duration: '4:33',
    spotifyUrl: 'https://open.spotify.com/track/17Zzi8qsn8mdm0t0JTGeQo',
    movement: 'open-road',
    note: 'The present tense, plucky enough to belong.',
  },
  {
    position: 16,
    title: 'Friend of the Devil',
    artist: 'Jerry Garcia & David Grisman',
    album: 'Jerry Garcia & David Grisman',
    duration: '7:04',
    spotifyUrl: 'https://open.spotify.com/track/33087SBxnQqgiiJPUmyNDs',
    movement: 'landing',
    note: 'The road folds back into wood and wire.',
  },
  {
    position: 17,
    title: 'Shady Grove',
    artist: 'Jerry Garcia & David Grisman',
    album: 'Shady Grove',
    duration: '4:19',
    spotifyUrl: 'https://open.spotify.com/track/4Br87hfDhwArVu2yIWx2W4',
    movement: 'landing',
    note: 'One last clean picking pattern.',
  },
  {
    position: 18,
    title: 'Ripple — 2020 Remaster',
    artist: 'Grateful Dead',
    album: 'American Beauty',
    duration: '4:08',
    spotifyUrl: 'https://open.spotify.com/track/4aQ8mFkZU6dmHaZOOKdscc',
    movement: 'landing',
    note: 'Grateful is the landing, not the brand.',
  },
] as const;

export function tracksForMovement(movement: UpliftMovement): readonly UpliftTrack[] {
  return UPLIFT_TRACKS.filter((track) => track.movement === movement);
}
