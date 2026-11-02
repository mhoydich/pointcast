/**
 * Ten Doors: ten small new areas opened on PointCast on 2026-11-02.
 *
 * One list feeds the hub (/ten-doors), every door's page header, its JSON
 * manifest (/<slug>.json), the agent manifest, the sitemap and llms.txt
 * checks in tests/ten-doors.test.mjs. Add a door here first.
 *
 * Asked for by Michael Hoydich ("make 10 new pointcast areas, drum etc, be
 * inventive"); built by Claude Code. Every door is original: original
 * rules, art drawn in code, sound synthesized in the browser. Nothing here
 * touches a wallet, a token or a payment, and nothing a visitor makes leaves
 * their browser.
 */

export const TEN_DOORS_DATE = '2026-11-02';
export const SITE = 'https://pointcast.xyz';

/** @typedef {{ slug: string, name: string, kicker: string, pitch: string, kind: string, genre: string, schemaType: 'VideoGame' | 'WebApplication', color: string, ink: string, how: string[], agents: string, place: string }} Door */

/** @type {Door[]} */
export const DOORS = [
  {
    slug: 'takeoff-organ',
    name: 'Takeoff Organ',
    kicker: 'Music · LAX sky',
    pitch: 'Every departure off the north runway holds one organ note over El Segundo. Launch planes, stack chords, let the sky ring out to sea.',
    kind: 'instrument',
    genre: 'Generative music toy',
    schemaType: 'WebApplication',
    color: '#0f1d3a',
    ink: '#ffd27a',
    how: [
      'Tap the runway strip (or press 1 to 8) to launch a plane. Each lane is a note of the scale.',
      'A plane climbs west over the dunes. Its note swells while it climbs and fades as it reaches the sea.',
      'Hold Shift or tap AUTO to let the airport run its own schedule.',
    ],
    agents: 'The JSON lists the eight lanes, the scale and the climb envelope, so an agent can score a departure sequence as numbers.',
    place: 'The LAX north runways sit at the south edge of El Segundo; departures climb out west over the dunes toward Santa Monica Bay.',
  },
  {
    slug: 'refinery-lights',
    name: 'Refinery Lights',
    kicker: 'Music · step sequencer',
    pitch: 'The tank farm at night is a drum machine. Light the windows on eight towers and the whole skyline loops as a beat.',
    kind: 'instrument',
    genre: 'Step sequencer',
    schemaType: 'WebApplication',
    color: '#120c1c',
    ink: '#ff9d3b',
    how: [
      'Each tower is a step, each window row is a voice: kick, clap, hat, tank hum, and four lamp tones.',
      'Tap windows to light them. The sweep light walks the towers and plays what is lit.',
      'SHIFT CHANGE scrambles a fresh pattern. CLEAR turns every light off. Your skyline is kept in this browser.',
    ],
    agents: 'The JSON spells the grid (8 steps by 8 voices), the voices and a starter pattern, so an agent can hand a person a pattern string.',
    place: 'The refinery on the south side of El Segundo glows all night; its lights are the town\'s oldest skyline.',
  },
  {
    slug: 'kite-line',
    name: 'Kite Line',
    kicker: 'Game · Dockweiler wind',
    pitch: 'Fly a kite off the sand in a wind that never blows the same way twice. The line hums with tension. Keep it up.',
    kind: 'game',
    genre: 'Physics flying game',
    schemaType: 'VideoGame',
    color: '#bfe3f2',
    ink: '#0d3b52',
    how: [
      'Drag up and down (or hold the arrow keys) to reel line in and give it out.',
      'Reel in through a lull to keep it climbing, but line runs out. Give line when a big gust hits or it knocks the kite down. Reel in a dead calm and it stalls. Touch the sand and the flight is over.',
      'The line\'s hum rises with tension. Time aloft is your score; the best flight stays in this browser.',
    ],
    agents: 'The JSON gives the wind model (seeded gusts, lulls, a sea breeze that builds) and the scoring rule.',
    place: 'Dockweiler State Beach runs along the west edge of El Segundo, under the departures, with an afternoon sea breeze.',
  },
  {
    slug: 'meter-oracle',
    name: 'Meter Oracle',
    kicker: 'Oracle · 15 minutes',
    pitch: 'A Main Street parking meter that tells fortunes. Feed it a pretend coin and it reads you the next fifteen minutes.',
    kind: 'oracle',
    genre: 'Fortune toy',
    schemaType: 'WebApplication',
    color: '#d8dccf',
    ink: '#24302a',
    how: [
      'Tap the slot (or press Space) to drop a pretend coin. Nothing is charged; the coin is a sound.',
      'The needle swings and the meter prints a fortune good for the next fifteen minutes.',
      'Everyone who asks in the same fifteen minutes gets the same fortune, people and bots alike.',
    ],
    agents: 'GET /meter-oracle.json returns the fortune for the current fifteen-minute window and the next one, with the window\'s start and end.',
    place: 'Main Street in El Segundo is a short walk of shops and diners lined with meters.',
  },
  {
    slug: 'drum-round',
    name: 'Drum Round',
    kicker: 'Drum · pass the bar',
    pitch: 'One bar of drums goes around a table of six: you and the Desk\'s house agents, Sky, Tides, Swell, Sun and Air. Each seat adds one hit.',
    kind: 'instrument',
    genre: 'Collaborative rhythm toy',
    schemaType: 'WebApplication',
    color: '#1d1410',
    ink: '#f2c14e',
    how: [
      'The bar loops, sixteen steps long. On your turn, tap a step on the ring to add one hit.',
      'Then the bar passes around the table. Each house agent adds one hit in its own taste: Sky likes the off-beats, Tides the downbeats, Swell rolls, Sun claps, Air leaves space and sometimes takes a hit away.',
      'Six laps and the bar is finished. Name it and keep it; START OVER clears the table.',
    ],
    agents: 'The JSON lists the seats, each house agent\'s rule and the step grid, so an agent can play a seat by the same rules.',
    place: 'A new room off the Drum house, played with the Desk\'s house agents. Drum Relay and the Drum Table are next door.',
  },
  {
    slug: 'pelican-post',
    name: 'Pelican Post',
    kicker: 'Quiet · letters out',
    pitch: 'Write the thing you are carrying. A pelican takes it past the breakwater and lets it go. Nobody reads it, not even us.',
    kind: 'ritual',
    genre: 'Letting-go ritual',
    schemaType: 'WebApplication',
    color: '#f4e9d8',
    ink: '#3a2f25',
    how: [
      'Write one line, up to 140 letters, on the postcard.',
      'Tap SEND IT OUT. A pelican picks the card off the sand and flies it out over the water.',
      'Past the breakwater it opens its beak and the card is gone. The words are never stored or sent anywhere; the page only counts how many cards you have let go.',
    ],
    agents: 'There is nothing for an agent to read here on purpose. The JSON says so and describes the ritual.',
    place: 'Brown pelicans work the surf line from Dockweiler to the Manhattan Beach pier, low over the water.',
  },
  {
    slug: 'green-flash',
    name: 'Green Flash',
    kicker: 'Game · sunset timing',
    pitch: 'Watch the sun set over Santa Monica Bay and tap at the instant the last sliver goes. Catch it right and you see the green flash.',
    kind: 'game',
    genre: 'Timing game',
    schemaType: 'VideoGame',
    color: '#ffb36b',
    ink: '#2b1830',
    how: [
      'The sun sinks into the bay in about forty seconds. Tap (or press Space) when the very last sliver slips under.',
      'Inside a tenth of a second is a green flash. The closer you are, the brighter the flash.',
      'The page also shows today\'s real sunset time for El Segundo, worked out from the sun\'s position, so you know when to go outside and try it for real.',
    ],
    agents: 'GET /green-flash.json returns today\'s computed sunset for El Segundo in Pacific time and UTC, with the method and its error margin.',
    place: 'From the El Segundo bluffs the sun sets straight into Santa Monica Bay for most of the year.',
  },
  {
    slug: 'chalk-score',
    name: 'Chalk Score',
    kicker: 'Music · draw to play',
    pitch: 'Sidewalk chalk that sings. Draw on the slab and the playhead reads your lines as music: left to right is time, high is high.',
    kind: 'instrument',
    genre: 'Graphic score instrument',
    schemaType: 'WebApplication',
    color: '#5b5d5f',
    ink: '#f7f3e8',
    how: [
      'Draw with a finger or mouse. Each chalk color is a different voice: white is a bell, yellow a reed, blue a low hum, pink a pluck.',
      'The playhead sweeps left to right and plays every line it crosses, with pitch from height on a pentatonic scale.',
      'HOSE IT DOWN clears the slab. The drawing stays in this browser until you do.',
    ],
    agents: 'The JSON describes the mapping (x to time, y to pitch, color to voice) so an agent can describe a score as strokes.',
    place: 'Cul-de-sacs and the Library Park sidewalks are where El Segundo kids draw.',
  },
  {
    slug: 'ice-cream-route',
    name: 'Ice Cream Route',
    kicker: 'Game · one song long',
    pitch: 'Drive the ice cream truck through a little grid of blocks and reach every waiting kid before the jingle runs out.',
    kind: 'game',
    genre: 'Route puzzle',
    schemaType: 'VideoGame',
    color: '#fff3f8',
    ink: '#4a1d3d',
    how: [
      'Each round, kids wave from the curb. Tap a corner next to the truck (or use the arrow keys) to drive one block.',
      'The jingle is the clock. Visit every kid before the last note. Fewer blocks driven means more song left over, which is your score.',
      'Three rounds a day; one-way streets join in rounds two and three. The street map is new every day, the same for everyone.',
    ],
    agents: 'GET /ice-cream-route.json returns today\'s seeded street map, the kids\' corners and the one-way streets, so an agent can try to solve the day\'s route.',
    place: 'Summer afternoons on the residential grid west of Sepulveda.',
  },
  {
    slug: 'tide-pool-census',
    name: 'Tide Pool Census',
    kicker: 'Count · people vs bots',
    pitch: 'A new tide pool every day, the same for everyone. Count the crabs, stars, snails and anemones. Bots get the same pool as JSON.',
    kind: 'game',
    genre: 'Daily counting game',
    schemaType: 'VideoGame',
    color: '#0d4f57',
    ink: '#e9fbf7',
    how: [
      'Look at today\'s pool. Creatures hide under weed and rock, and some only show when you tap the water.',
      'Enter your counts and tap FILE THE CENSUS to see how you did against the true count.',
      'The pool changes at midnight Pacific. Your record of days stays in this browser.',
    ],
    agents: 'GET /tide-pool-census.json returns today\'s pool: every creature, its position and whether it is hidden. Bots always count right; people get the fun.',
    place: 'The rocky stretches at Palos Verdes, at the south end of the bay, are the nearest real tide pools.',
  },
];

export const DOOR_SLUGS = DOORS.map((door) => door.slug);

export function doorBySlug(slug) {
  const door = DOORS.find((item) => item.slug === slug);
  if (!door) throw new Error(`Unknown Ten Doors slug: ${slug}`);
  return door;
}

export function doorUrl(slug) {
  return `${SITE}/${slug}`;
}

/** JSON-LD for a door page. */
export function doorJsonLd(slug) {
  const door = doorBySlug(slug);
  const url = doorUrl(slug);
  const work = {
    '@type': door.schemaType,
    '@id': `${url}#area`,
    name: door.name,
    description: door.pitch,
    url,
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    author: { '@type': 'Person', name: 'Michael Hoydich' },
    contributor: { '@type': 'Organization', name: 'Claude Code' },
    publisher: { '@type': 'Organization', name: 'PointCast', url: `${SITE}/` },
    datePublished: TEN_DOORS_DATE,
    isPartOf: { '@type': 'CollectionPage', '@id': `${SITE}/ten-doors#hub`, name: 'Ten Doors', url: `${SITE}/ten-doors` },
    contentLocation: { '@type': 'Place', name: 'El Segundo, California' },
  };
  if (door.schemaType === 'VideoGame') {
    Object.assign(work, { gamePlatform: 'Web browser', genre: door.genre, playMode: 'SinglePlayer' });
  } else {
    Object.assign(work, { applicationCategory: 'EntertainmentApplication', operatingSystem: 'Any modern web browser' });
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      work,
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Ten Doors', item: `${SITE}/ten-doors` },
          { '@type': 'ListItem', position: 3, name: door.name, item: url },
        ],
      },
    ],
  };
}

/** The base JSON manifest for a door; pages with live data add a `today` key. */
export function doorManifest(slug, extra = {}) {
  const door = doorBySlug(slug);
  return {
    $schema: `${SITE}/for-agents`,
    generatedAt: new Date().toISOString(),
    name: door.name,
    kind: door.kind,
    genre: door.genre,
    status: 'live in the browser, no account, nothing to buy',
    human: doorUrl(slug),
    json: `${doorUrl(slug)}.json`,
    pitch: door.pitch,
    how: door.how,
    forAgents: door.agents,
    place: door.place,
    credits: {
      direction: 'Michael Hoydich, 2026-11-02: "make 10 new pointcast areas ... be inventive"',
      build: 'Claude Code, 2026-11-02',
      note: 'Original rules, art drawn in code, sound synthesized with the Web Audio API. No recordings, no copied sprites.',
    },
    privacy: 'Anything a visitor makes on this page stays in their own browser (localStorage) or nowhere at all.',
    ...extra,
    links: {
      hub: `${SITE}/ten-doors`,
      hubJson: `${SITE}/ten-doors.json`,
      siblings: DOORS.filter((d) => d.slug !== slug).map((d) => doorUrl(d.slug)),
      pointcast: `${SITE}/`,
    },
  };
}

export function jsonResponse(payload) {
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*',
    },
  });
}
