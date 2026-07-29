import { WEDNESDAY_MORNING_UPLIFT } from './wednesday-morning-uplift';
import { GOOD_WORK, WEDNESDAY_PUBLICATION } from './wednesday-publication';

export type WednesdayPinKind =
  | 'playlist'
  | 'openai-image'
  | 'midjourney-archive'
  | 'outside-door';

export interface WednesdayPin {
  id: string;
  kind: WednesdayPinKind;
  title: string;
  description: string;
  href: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  credit: string;
  sourceUrl?: string;
  accent: 'sun' | 'sky' | 'leaf' | 'coral' | 'acid' | 'blue' | 'lavender' | 'red';
}

export interface WednesdayPinboard {
  schema: 'pointcast-visual-pinboard/v1';
  id: string;
  issueNumber: '001' | '002';
  title: string;
  subtitle: string;
  description: string;
  editorialNote: string;
  route: string;
  jsonRoute: string;
  canonicalUrl: string;
  issueRoute: string;
  issueJsonRoute: string;
  playlistUrl: string;
  cover: string;
  coverAlt: string;
  theme: 'porch-to-sky' | 'beautifully-lit-desk';
  pinterestBoardUrl: string | null;
  pins: readonly WednesdayPin[];
}

export const UPDRAFT_PINBOARD: WednesdayPinboard = {
  schema: 'pointcast-visual-pinboard/v1',
  id: 'wednesday-001-updraft-pinboard',
  issueNumber: '001',
  title: 'PORCH → SKY',
  subtitle: 'The visual pinboard for Updraft 01',
  description:
    'Wood, wire, open windows, bright old cars, a useful road, and the kind of morning that remembers to come home.',
  editorialNote:
    'This is not playlist moodboarding by color alone. The board follows the same arc as the compile: intimate strings, accessible crossover, open-road lift, present-tense air, and a grateful landing.',
  route: '/wednesday/001/board',
  jsonRoute: '/wednesday/001/board.json',
  canonicalUrl: 'https://pointcast.xyz/wednesday/001/board',
  issueRoute: WEDNESDAY_MORNING_UPLIFT.route,
  issueJsonRoute: WEDNESDAY_MORNING_UPLIFT.jsonRoute,
  playlistUrl: WEDNESDAY_MORNING_UPLIFT.spotifyUrl,
  cover: WEDNESDAY_MORNING_UPLIFT.cover,
  coverAlt: WEDNESDAY_MORNING_UPLIFT.coverAlt,
  theme: 'porch-to-sky',
  pinterestBoardUrl: 'https://www.pinterest.com/hoydich/wednesday-934-updraft-01/',
  pins: [
    {
      id: 'updraft-cover',
      kind: 'playlist',
      title: 'Updraft 01',
      description: 'The public Spotify playlist and the square that starts the whole Wednesday.',
      href: WEDNESDAY_MORNING_UPLIFT.spotifyUrl,
      image: WEDNESDAY_MORNING_UPLIFT.cover,
      imageAlt: WEDNESDAY_MORNING_UPLIFT.coverAlt,
      imageWidth: 1536,
      imageHeight: 1536,
      credit: 'PointCast · OpenAI image generation · poster-image-engine',
      accent: 'sun',
    },
    {
      id: 'porch-strings',
      kind: 'openai-image',
      title: 'Porch Strings, 9:34',
      description:
        'A new companion print: the kitchen is open, the road is visible, and the strings have already become weather.',
      href: WEDNESDAY_MORNING_UPLIFT.route,
      image: '/images/wednesday/001/porch-strings-0934.jpg',
      imageAlt:
        'Screenprint-like California porch with a wooden chair, kitchen window, open road, birds, leaves, and acoustic strings passing through the foreground',
      imageWidth: 1200,
      imageHeight: 1500,
      credit: 'PointCast · OpenAI image generation · poster-image-engine',
      accent: 'sky',
    },
    {
      id: 'open-road-first-light',
      kind: 'midjourney-archive',
      title: 'First Light',
      description: 'A yellow-and-white old car gives the crossover section somewhere cheerful to go.',
      href: '/open-road-v2',
      image: '/images/wednesday/001/open-road-first-light.webp',
      imageAlt:
        'Graphic painting of a yellow and white classic car beside a color-block building under a bright blue sky',
      imageWidth: 1600,
      imageHeight: 1600,
      credit: 'Michael Hoydich · Midjourney archive · Open Road II',
      sourceUrl: 'https://pointcast.xyz/open-road-v2',
      accent: 'sun',
    },
    {
      id: 'open-road-green-shade',
      kind: 'midjourney-archive',
      title: 'Green Shade',
      description: 'The middle of the road trip keeps one foot in shadow and one in the warm sky.',
      href: '/open-road-v2',
      image: '/images/wednesday/001/open-road-green-shade.webp',
      imageAlt:
        'Graphic painting of a red and black classic car beneath a dark tree with mountains and a golden sky',
      imageWidth: 1600,
      imageHeight: 1600,
      credit: 'Michael Hoydich · Midjourney archive · Open Road II',
      sourceUrl: 'https://pointcast.xyz/open-road-v2',
      accent: 'leaf',
    },
    {
      id: 'open-road-garden-road',
      kind: 'midjourney-archive',
      title: 'Garden Road',
      description: 'Turquoise, yellow, pink: the accessible-pop turn without sanding off the strange.',
      href: '/open-road-v2',
      image: '/images/wednesday/001/open-road-garden-road.webp',
      imageAlt:
        'Graphic painting of a turquoise and yellow classic car against an exuberant pink, yellow, and green field',
      imageWidth: 1600,
      imageHeight: 1600,
      credit: 'Michael Hoydich · Midjourney archive · Open Road II',
      sourceUrl: 'https://pointcast.xyz/open-road-v2',
      accent: 'coral',
    },
    {
      id: 'ripple-story',
      kind: 'outside-door',
      title: 'How “Ripple” got here',
      description:
        'The Grateful Dead’s official archive opens a lyric-and-history door onto the song that closes the issue.',
      href: 'https://www.dead.net/features/greatest-stories-ever-told/greatest-stories-ever-told-ripple',
      credit: 'Outside door · Grateful Dead official archive',
      accent: 'sky',
    },
    {
      id: 'shady-grove',
      kind: 'outside-door',
      title: 'Shady Grove',
      description:
        'The official Jerry Garcia archive for the Garcia–Grisman record at the root of this picked-string direction.',
      href: 'https://jerrygarcia.com/album/shady-grove/',
      credit: 'Outside door · Jerry Garcia official archive',
      accent: 'leaf',
    },
    {
      id: 'pizza-tapes',
      kind: 'outside-door',
      title: 'The Pizza Tapes',
      description:
        'Garcia, Grisman, and Tony Rice: another official doorway into wood, wire, room, and ensemble time.',
      href: 'https://jerrygarcia.com/album/the-pizza-tapes/',
      credit: 'Outside door · Jerry Garcia official archive',
      accent: 'coral',
    },
  ],
};

export const GOOD_WORK_PINBOARD: WednesdayPinboard = {
  schema: 'pointcast-visual-pinboard/v1',
  id: 'wednesday-002-good-work-pinboard',
  issueNumber: '002',
  title: 'THE BEAUTIFULLY LIT DESK',
  subtitle: 'The visual pinboard for The Good Work',
  description:
    'Blank margins, useful systems, small radios, flowers, blue index cards, and enough color to make the little things move.',
  editorialNote:
    'The board mirrors the compile: clear the surface, add art-pop motion, stay inside the groove, and let the work return to the life around it.',
  route: '/wednesday/002/board',
  jsonRoute: '/wednesday/002/board.json',
  canonicalUrl: 'https://pointcast.xyz/wednesday/002/board',
  issueRoute: GOOD_WORK.route,
  issueJsonRoute: GOOD_WORK.jsonRoute,
  playlistUrl: GOOD_WORK.spotifyUrl,
  cover: GOOD_WORK.cover,
  coverAlt: GOOD_WORK.coverAlt,
  theme: 'beautifully-lit-desk',
  pinterestBoardUrl: 'https://www.pinterest.com/hoydich/wednesday-934-the-good-work/',
  pins: [
    {
      id: 'good-work-cover',
      kind: 'playlist',
      title: 'The Good Work',
      description: 'The public Spotify sequence and its fluorescent work-card cover.',
      href: GOOD_WORK.spotifyUrl,
      image: GOOD_WORK.cover,
      imageAlt: GOOD_WORK.coverAlt,
      imageWidth: 1536,
      imageHeight: 1536,
      credit: 'PointCast · OpenAI image generation · poster-image-engine',
      accent: 'acid',
    },
    {
      id: 'beautifully-lit-desk',
      kind: 'openai-image',
      title: 'The Beautifully Lit Desk',
      description:
        'A new companion still life: blank cards, colored paths, one flower, and a radio that makes the list feel less like a list.',
      href: GOOD_WORK.route,
      image: '/images/wednesday/002/beautifully-lit-desk.jpg',
      imageAlt:
        'Art-pop still life with a sculptural radio, red flower in a glass, pencil, blank colored cards, and curved lines across a sunny desk',
      imageWidth: 1200,
      imageHeight: 1500,
      credit: 'PointCast · OpenAI image generation · poster-image-engine',
      accent: 'blue',
    },
    {
      id: 'dial-tone-garden',
      kind: 'midjourney-archive',
      title: 'Dial Tone Garden',
      description: 'A bell, a signal, and a field of dots: enough system to hold a little improvisation.',
      href: '/showcast/bells-bloom/',
      image: '/showcast/bells-bloom/assets/07-dial-tone-garden.jpg',
      imageAlt:
        'Blue green and orange bell-like object made from dots and clean geometric shapes on white',
      imageWidth: 1024,
      imageHeight: 1024,
      credit: 'Michael Hoydich · Midjourney archive · Bells / Bloom',
      sourceUrl: 'https://pointcast.xyz/showcast/bells-bloom/',
      accent: 'blue',
    },
    {
      id: 'bell-black-base',
      kind: 'midjourney-archive',
      title: 'Bell, Black Base',
      description: 'Chartreuse and lavender machinery with flowers refusing to become decoration.',
      href: '/showcast/bells-bloom/',
      image: '/showcast/bells-bloom/assets/08-bell-black-base.jpg',
      imageAlt:
        'Geometric turquoise chartreuse and purple bell-like sculpture with flowers on a dark base',
      imageWidth: 1024,
      imageHeight: 1024,
      credit: 'Michael Hoydich · Midjourney archive · Bells / Bloom',
      sourceUrl: 'https://pointcast.xyz/showcast/bells-bloom/',
      accent: 'lavender',
    },
    {
      id: 'bell-labs-cutaway',
      kind: 'midjourney-archive',
      title: 'Bell Labs Cutaway',
      description: 'The landing: one calm blue-lavender work surface where utility and still life agree.',
      href: '/showcast/bells-bloom/',
      image: '/showcast/bells-bloom/assets/27-bell-labs-cutaway.jpg',
      imageAlt:
        'Cyan and lavender editorial still life of vases, a bell-like object, and cutaway geometric forms',
      imageWidth: 1024,
      imageHeight: 1024,
      credit: 'Michael Hoydich · Midjourney archive · Bells / Bloom',
      sourceUrl: 'https://pointcast.xyz/showcast/bells-bloom/',
      accent: 'lavender',
    },
    {
      id: 'eno-about',
      kind: 'outside-door',
      title: 'Brian Eno, in his own frame',
      description:
        'The official biography of the artist whose “St Elmo’s Fire” supplies the issue’s first work light.',
      href: 'https://www.brian-eno.net/about/',
      credit: 'Outside door · Brian Eno official site',
      accent: 'acid',
    },
    {
      id: 'eno-moma',
      kind: 'outside-door',
      title: 'Eno at MoMA',
      description:
        'A museum collection door: the playlist’s system-thinking has a visual-art history too.',
      href: 'https://www.moma.org/artists/38770-brian-eno',
      credit: 'Outside door · Museum of Modern Art',
      accent: 'blue',
    },
    {
      id: 'making-music-modern',
      kind: 'outside-door',
      title: 'Making Music Modern',
      description:
        'MoMA’s exhibition playlist is a useful neighboring object: music sequencing as design history.',
      href: 'https://www.moma.org/momaorg/shared/pdfs/docs/calendar/MakingMusicModern_playlist.pdf',
      credit: 'Outside door · Museum of Modern Art · PDF',
      accent: 'red',
    },
  ],
};

export const WEDNESDAY_PINBOARDS = [UPDRAFT_PINBOARD, GOOD_WORK_PINBOARD] as const;

export function absoluteWednesdayPinboard(board: WednesdayPinboard) {
  return {
    ...board,
    human: board.canonicalUrl,
    json: `https://pointcast.xyz${board.jsonRoute}`,
    publication: WEDNESDAY_PUBLICATION.canonicalUrl,
    issue: `https://pointcast.xyz${board.issueRoute}`,
    issueJson: `https://pointcast.xyz${board.issueJsonRoute}`,
    cover: `https://pointcast.xyz${board.cover}`,
    pins: board.pins.map((pin) => ({
      ...pin,
      href: pin.href.startsWith('/') ? `https://pointcast.xyz${pin.href}` : pin.href,
      image: pin.image
        ? pin.image.startsWith('/')
          ? `https://pointcast.xyz${pin.image}`
          : pin.image
        : undefined,
    })),
    provenanceBoundary:
      'OpenAI-generated and Michael Hoydich Midjourney-archive images are labeled on every card. Outside-door cards link to their original publishers and do not copy their artwork into PointCast.',
  };
}
