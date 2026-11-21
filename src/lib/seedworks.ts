/**
 * Seedworks — PointCast's room for generative art written in code.
 *
 * Each piece is one self-contained HTML file under public/art/seedworks/<slug>/
 * that draws from a seed. Same seed, same picture; new seed, new iteration.
 * The files follow the seedworks runtime (see SEEDWORKS_SPEC below), which is
 * also compatible with fxhash's $fx snippet, so a piece can be zipped and
 * tested in fxhash's sandbox later without a rewrite.
 *
 * Shared by /seedworks, /seedworks/[slug] and /seedworks.json.
 * Nothing here mints, signs or spends. Minting is a later step that needs Mike.
 */

export interface SeedworksParam {
  name: string;
  values: string;
  note: string;
}

export interface SeedworksPiece {
  slug: string;
  title: string;
  dek: string;
  world: string;
  body: string[];
  params: SeedworksParam[];
  features: string[];
  interactive?: string;
  exampleSeeds: string[];
}

export const SEEDWORKS_UPDATED = '2026-11-09';
export const SEEDWORKS_CANONICAL = 'https://pointcast.xyz/seedworks';
export const SEEDWORKS_MACHINE = 'https://pointcast.xyz/seedworks.json';

export const pieceSrc = (slug: string) => `/art/seedworks/${slug}/`;
export const piecePage = (slug: string) => `/seedworks/${slug}`;

export const SEEDWORKS_PIECES: SeedworksPiece[] = [
  {
    slug: 'nouns-note',
    title: 'Nouns Note',
    dek: 'A banknote from the Nouns Money press. Every seed prints a different note.',
    world: 'Nouns Money',
    body: [
      'The seed sets the ink, the denomination, the serial number, the rosette and the face in the portrait oval. The border and rosette are guilloche: hundreds of overlapping waves, the way bank engravers made notes hard to copy.',
      'Every note wears the noggles. The motto line is picked from a short list the press keeps.',
    ],
    params: [
      { name: 'Ink', values: 'Reserve Green, Oxblood, Cobalt, Violet Press, Brass, Ink Black', note: 'Sets the ink, paper and tint colours.' },
      { name: 'Denomination', values: '1, 2, 5, 10, 20, 25, 50, 100', note: 'Weighted toward the small notes.' },
      { name: 'Petals', values: '5 to 13', note: 'Lobes on the rosette.' },
      { name: 'Rings', values: '5 to 11', note: 'Guilloche rings in the rosette.' },
      { name: 'Serial', values: 'Two letters, eight digits, one letter', note: 'Drawn from the seed, so it matches the seed forever.' },
    ],
    features: ['Denomination', 'Ink', 'Petals', 'Rings', 'Motto'],
    exampleSeeds: ['sw-note-001', 'sw-note-042', 'sw-note-100'],
  },
  {
    slug: 'tide-and-sun',
    title: 'Tide and Sun',
    dek: 'A made-up day on the El Segundo shore: the hour, the tide and the light all come from the seed.',
    world: 'El Segundo tides and sun',
    body: [
      'The seed picks a day of the year and an hour, then mixes two tide waves to get a tide curve for that day. The waterline climbs the sand at high tide and drops at low. The tide chart across the top shows the whole day with a dot at the hour.',
      'The sky follows a rough sun for that season, from night through dawn, day, golden hour and dusk. Planes climb out over the water, and two stacks stand on the shore. This is a picture, not a tide table.',
    ],
    params: [
      { name: 'Hour', values: 'Any minute of the day, leaning toward daylight', note: 'Sets the light and where the sun or moon sits.' },
      { name: 'Day of year', values: '1 to 365', note: 'Sets the day length, so winter evenings come early.' },
      { name: 'Tide', values: 'Two waves of about 12 hours, seeded phase and height', note: 'Named High, Low, Rising or Falling.' },
      { name: 'Swell', values: '0.3 to 1', note: 'How lively the wave lines are.' },
      { name: 'Planes', values: '0 to 4', note: 'Departures crossing the sky.' },
    ],
    features: ['Hour', 'Tide', 'Light', 'Planes', 'Season'],
    exampleSeeds: ['sw-tide-dawn', 'sw-tide-0612', 'sw-tide-gold'],
  },
  {
    slug: 'drum-rings',
    title: 'Drum Rings',
    dek: 'A seeded drum pattern drawn as rings. Tap it to hear it.',
    world: 'Drum rhythms',
    body: [
      'Each ring is one voice: kick, snare, hat, tom, clap or bell. The seed gives each voice a number of steps and a number of hits, and the hits spread out as evenly as they can, the way many traditional rhythms do. Rings with different step counts drift against each other and line up again after the cycle shown in the corner.',
      'Tap or click the piece, or press space, to play it with sounds made in the browser. Nothing plays until you tap.',
    ],
    params: [
      { name: 'Voices', values: '3 to 6', note: 'How many rings.' },
      { name: 'Steps per voice', values: '5, 7, 8, 9, 10, 12 or 16', note: 'Mostly 16.' },
      { name: 'Hits per voice', values: '1 to about two thirds of the steps', note: 'Spread evenly, then rotated.' },
      { name: 'Tempo', values: '84 to 132 BPM', note: 'Shown in the centre.' },
      { name: 'Palette', values: 'Chalk, Night Room, Beach Towel', note: '' },
    ],
    features: ['Voices', 'Tempo', 'Cycle', 'Density', 'Palette'],
    interactive: 'Tap, click or press space to play and stop.',
    exampleSeeds: ['sw-drum-001', 'sw-drum-fourfloor', 'sw-drum-late'],
  },
  {
    slug: 'town-grid',
    title: 'Town Grid',
    dek: 'A small beach town drawn as a survey map, with ocean to the west and runways to the north.',
    world: 'The town map',
    body: [
      'The seed lays out the grid: how many blocks, how wide each one is, where Main Street runs and what each block holds. Shops gather along Main, parks are scattered, tanks fill the south edge and one to three runways sit north of town.',
      'Street names come from a list of the town\'s own avenues, shuffled by the seed. Each sheet is numbered with the start of its seed.',
    ],
    params: [
      { name: 'Grid', values: '7 to 12 columns, 8 to 13 rows', note: 'Block widths vary a little.' },
      { name: 'Main Street', values: 'Somewhere in the middle third', note: 'Drawn bold.' },
      { name: 'Block use', values: 'Homes, shops, parks, tanks', note: 'Shops near Main, tanks to the south.' },
      { name: 'Runways', values: '1 to 3', note: '' },
      { name: 'Ink', values: 'Survey, Blueprint, Sunbleached', note: '' },
    ],
    features: ['Blocks', 'Parks', 'Runways', 'Ink', 'Main Street'],
    exampleSeeds: ['sw-town-001', 'sw-town-harbor', 'sw-town-1911'],
  },
];

export const pieceBySlug = (slug: string) => SEEDWORKS_PIECES.find((p) => p.slug === slug);

/** The open spec for a Seedworks piece, for people and agents who want to add one. */
export const SEEDWORKS_SPEC = {
  version: 'seedworks-runtime v1',
  rules: [
    'One self-contained index.html under public/art/seedworks/<slug>/. No network requests, no CDNs, no remote fonts or images.',
    'Read the seed through the runtime: $fx.hash when fxhash is present, else ?seed= in the URL, else a fresh random seed.',
    'Use only $sw.rand (or $sw.range, $sw.int, $sw.pick, $sw.chance) for randomness, so the same seed always draws the same thing. Math.random is off limits in the drawing.',
    'Draw in a fixed 1000 by 1000 space scaled to the window, and redraw on resize without drawing new random numbers.',
    'Call $sw.done(features) once the first frame is drawn. It reports features to fxhash ($fx.features, then $fx.preview) and to the PointCast page around it.',
    'Sound or motion waits for a tap. Nothing autoplays.',
  ],
  seedParam: 'seed',
  message: { type: 'seedworks:done', fields: ['seed', 'features'] },
};

/** How a piece could mint on Tezos later. A plan only: nothing is deployed or minted. */
export const SEEDWORKS_MINT_PATHS = [
  {
    name: 'fxhash',
    summary: 'Publish a piece as a generative token on fxhash. The runtime already reads $fx.hash and $fx.rand and calls $fx.features and $fx.preview, so the file can go up as it is.',
    steps: [
      'Zip the piece folder with index.html at the root.',
      'Test it in the fxhash sandbox, which runs it with random hashes and checks it works offline.',
      'Mike sets edition size, price in tez and royalties, then publishes from his own wallet. Each collector\'s mint hash becomes the seed.',
    ],
    tradeoff: 'Fastest, and it lands where Tezos generative collectors already look. fxhash takes a platform fee and the page lives on their site.',
  },
  {
    name: 'PointCast FA2',
    summary: 'Mint iterations from a PointCast FA2 contract, following the FA2 contracts already in contracts/.',
    steps: [
      'Pin each piece\'s index.html to IPFS once, so the code is frozen.',
      'A mint_iteration entrypoint takes payment, derives the seed from the operation and token id, and stores it on chain.',
      'Token metadata points artifactUri at the pinned file with ?seed= set, and lists the features as attributes.',
      'Contract deploy needs Codex review and Mike\'s approval, the same as every PointCast contract.',
    ],
    tradeoff: 'Keeps collectors and the gallery on pointcast.xyz, with no platform fee. More work, and a new contract to audit.',
  },
];
