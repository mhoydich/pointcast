/**
 * The Hour — what it chooses from.
 *
 * Images are Michael Hoydich's own Midjourney work already in the repo
 * (Saturday Worlds, 2026-10-24, and Los Angeles / Other Worlds), picked for
 * places rather than people. Lines are written by Claude Code (author cc),
 * not in Mike's voice. Rooms are live PointCast routes.
 */
import journey from '../../data/saturday-worlds-journey.json' with { type: 'json' };
import otherWorlds from '../../data/other-worlds.json' with { type: 'json' };

const JOURNEY_BANDS = {
  'c01-v1': ['dawn'],
  's01-v1': ['dawn', 'day'],
  's03-v1': ['dawn'],
  's04-v4': ['day'],
  'c16-v1': ['day'],
  'c17-v3': ['day'],
  'c18-v3': ['dawn', 'day'],
  'c19-v4': ['dawn'],
  's09-v3': ['day'],
  'a10-v2': ['day'],
  'a21-v2': ['day'],
  'c12-v3': ['day'],
  'c13-v1': ['dawn', 'day'],
  's21-v2': ['day'],
  'a40-v4': ['day', 'dusk'],
  's18-v2': ['dawn', 'dusk'],
  'a07-v4': ['dusk', 'night'],
};

const OTHER_WORLD_BANDS = {
  'pacific-threshold': ['dusk', 'night', 'halloween'],
  'the-reservoir-above': ['day', 'dusk'],
  'river-of-returning-light': ['dusk'],
  'observatory-for-another-sun': ['night', 'halloween'],
  'arroyo-portal': ['dusk', 'halloween'],
  'night-orchard': ['night', 'halloween'],
  'the-interchange-dream': ['day', 'night'],
  'violet-arcade': ['night', 'halloween'],
  'last-light-at-the-edge': ['dusk', 'night'],
};

function journeyImages() {
  const out = [];
  for (const chapter of journey.chapters) {
    for (const img of chapter.images) {
      const bands = JOURNEY_BANDS[img.id];
      if (!bands) continue;
      out.push({
        src: `/images/saturday-worlds/2026-10-24/${img.id}.webp`,
        title: img.title,
        alt: img.alt,
        series: 'Saturday Worlds',
        bands,
      });
    }
  }
  return out;
}

function otherWorldImages() {
  return otherWorlds.artworks
    .filter((a) => OTHER_WORLD_BANDS[a.slug])
    .map((a) => ({
      src: a.preview,
      title: a.title,
      alt: a.alt,
      series: 'Los Angeles / Other Worlds',
      bands: OTHER_WORLD_BANDS[a.slug],
    }));
}

export function imagePools() {
  const all = [...journeyImages(), ...otherWorldImages()];
  const pools = { dawn: [], day: [], dusk: [], night: [], halloween: [] };
  for (const img of all) {
    for (const band of img.bands) pools[band].push({ src: img.src, title: img.title, alt: img.alt, series: img.series });
  }
  return pools;
}

export const LINES = {
  dawn: [
    'The coffee is not ready. The light already is.',
    'Nobody has asked for anything yet. Enjoy that.',
    'First ferry of the day, and every seat is a window seat.',
    'The marine layer is still deciding.',
    'One bell for the morning. Take your time with the second.',
    'Open a window before you open a tab.',
    'The garden got watered by the fog again.',
    'Early is its own neighborhood.',
  ],
  day: [
    'Something useful is being built two blocks from here.',
    'The workbench is clear. Put one thing on it.',
    'Noon, more or less. The shadows are short and so is the to-do list.',
    'A good tool is one you forget you are holding.',
    'Somebody is fixing a radio instead of buying a new one.',
    'The court is open. Bring a paddle or bring a friend.',
    'Make the small version first.',
    'The delivery trike is faster than it looks.',
  ],
  dusk: [
    'The sky is doing the thing again.',
    'Last light is the best light. Everyone knows it and still stops.',
    'Close one tab for every color in the sky.',
    'The pool keeps the day a little longer than the street does.',
    'Golden hour, lasting about forty minutes.',
    'Walk west until the sun is in your pocket.',
    'Somebody down the hall is tuning up.',
    'The day is done arguing.',
  ],
  night: [
    'The rooms are lit. Pick one.',
    'Somewhere a drum is keeping time for nobody in particular.',
    'Quiet hours. Play softly or play loud and own it.',
    'The orchard only glows when no one is looking at it directly.',
    'Late enough for the good songs.',
    'The town is asleep except for the parts that are not.',
    'Leave a beat for whoever comes next.',
    'Night shift: one lamp, one key, one idea.',
  ],
  halloween: [
    'Something is drumming in the empty room. It keeps good time.',
    'The porch light is on. Knock with a rhythm.',
    'Every tap you leave tonight plays back for the next visitor.',
    'The candy is gone. The ghosts stayed for the music.',
    'Mind the cold spot by the door. It is just the bass.',
    'Somebody carved a pumpkin into a kick drum.',
    'Tonight the hallway is a little longer than usual.',
    'The fog came in early and brought friends.',
    'Play the beat back. The house is listening.',
    'Midnight is a downbeat.',
  ],
};

/** Rooms the hour can light. Every href is a live PointCast route. */
export const ROOMS = {
  dawn: [
    { name: 'Keyboard Garden', href: '/keyboard/garden', note: 'write a few words, hear them' },
    { name: 'Meditate', href: '/meditate', note: 'a slow start' },
    { name: 'Tide Pool keys', href: '/keyboard/tidepool', note: 'soft notes by the water' },
  ],
  day: [
    { name: 'Keyboard Bloom', href: '/keyboard', note: 'the whole keyboard is an instrument' },
    { name: 'Brick Choir', href: '/brick-choir', note: 'the arcade, all music' },
    { name: 'Breakwater', href: '/breakwater', note: 'a breakout for the 8-bit heart' },
  ],
  dusk: [
    { name: 'Bell Choir', href: '/bell-choir', note: 'shared bells, any number of hands' },
    { name: 'The Hallway', href: '/hallway', note: 'walk past the rooms and listen' },
    { name: 'Station', href: '/station', note: 'the radio is on' },
  ],
  night: [
    { name: 'Drum Room', href: '/drum-room', note: 'loud, shared, late' },
    { name: 'The Hallway', href: '/hallway', note: 'every door is playing something' },
    { name: 'Fireflies keys', href: '/keyboard/fireflies', note: 'small lights, small notes' },
  ],
  halloween: [
    { name: 'The Haunted Drum Room', href: '/haunted-drum', note: 'everyone on one beat, the ghosts too' },
  ],
};
