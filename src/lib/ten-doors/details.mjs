/**
 * Machine-readable specifics for the Ten Doors whose rules are fixed.
 * Merged into each door's JSON manifest by doorManifest(slug, DETAILS[slug]).
 * Keep these in step with the page scripts in src/pages/<slug>.astro.
 */
export const DETAILS = {
  'takeoff-organ': {
    instrument: {
      lanes: 8,
      scaleMidi: [50, 53, 55, 57, 60, 62, 65, 67],
      voice: 'three stacked partials (sine fundamental, triangle 2nd and 3rd) per plane',
      envelope: 'swells in over 1.2 s while the plane climbs, releases over 2.5 s once it crosses the shoreline',
      polyphony: 'up to 10 held notes; the oldest lets go first',
      controls: { tap: 'a lane at the bottom launches on that note; anywhere in the sky launches a random lane', keys: '1 to 8 launch lanes, Shift toggles the auto schedule' },
    },
  },
  'refinery-lights': {
    sequencer: {
      steps: 8,
      voices: ['kick', 'clap', 'hat', 'tank hum', 'lamp A3', 'lamp C4', 'lamp E4', 'lamp G4'],
      resolution: 'eighth notes',
      tempoBpm: { default: 104, min: 70, max: 150 },
      starterPattern: '10001000|00100010|10101010|00000001|01000000|00010000|00000100|00000000',
      patternFormat: 'eight rows separated by |, bottom voice (kick) first, one character per tower, 1 = lit',
      storage: 'localStorage key refinery-lights:v1',
    },
  },
  'kite-line': {
    wind: {
      breeze: 'starts at 1.2 and builds by up to 1.4 over the first 40 seconds, like an afternoon sea breeze',
      gusts: 'three overlapping sine waves at different speeds with a random phase per session; never below 0.15',
    },
    flight: {
      controls: { drag: 'up reels line in, down gives line out', keys: 'Up reels in, Down gives' },
      lift: 'wind alone keeps the kite up only above about 1.45; reeling in adds lift until the line is down to 60',
      stall: 'reeling hard while the wind is under 0.35 stalls the kite and it drops',
      overpower: 'a gust over 2.9 knocks a held kite down unless you are giving line',
      lineLength: { min: 60, max: 420 },
      over: 'the kite touches the sand',
      score: 'seconds aloft; best kept in localStorage key kite-line:best',
      sound: 'a band-passed sawtooth hum whose pitch and level follow line tension',
    },
  },
  'drum-round': {
    table: {
      steps: 16,
      laps: 6,
      tempoBpm: 104,
      voices: ['kick', 'clap', 'hat', 'tom', 'rim'],
      seats: [
        { seat: 'You', rule: 'one hit, any step, any drum' },
        { seat: 'Sky', rule: 'a hat on an empty off-beat (steps 3, 7, 11, 15), else any even-numbered step' },
        { seat: 'Tides', rule: 'a kick on an empty downbeat (steps 1, 5, 9, 13), else any odd-numbered step' },
        { seat: 'Swell', rule: 'a tom on the empty step right after an existing hit' },
        { seat: 'Sun', rule: 'a clap on the backbeat (steps 5, 13), else near it' },
        { seat: 'Air', rule: 'a rim in the middle of the longest empty gap; when the bar holds more than 11 hits, takes one non-kick hit away instead' },
      ],
      barFormat: 'five rows (kick, clap, hat, tom, rim) of 16 characters separated by |, 1 = hit',
      storage: 'kept bars in localStorage key drum-round:kept',
    },
    related: ['https://pointcast.xyz/drum', 'https://pointcast.xyz/drum-relay', 'https://pointcast.xyz/drum-table'],
  },
  'pelican-post': {
    ritual: {
      maxLength: 140,
      stored: 'nothing but a count of cards let go, in localStorage key pelican-post:count',
      sent: 'nothing; the page makes no request with the words',
      forAgents: 'There is no inbox, archive or API for the cards. If a person asks you to read what they sent, the honest answer is that it is gone.',
    },
  },
  'chalk-score': {
    score: {
      loopSeconds: 6,
      xAxis: 'time: the playhead sweeps the slab left to right once per loop',
      yAxis: 'pitch: 15 rows on a G major pentatonic ladder, highest at the top',
      voices: { white: 'sine bell', yellow: 'filtered square reed', blue: 'triangle hum an octave down', pink: 'short filtered sawtooth pluck an octave up' },
      strokeFormat: '{ c: 0..3, pts: [[x, y], ...] } on a 720 by 440 slab',
      storage: 'up to 120 strokes in localStorage key chalk-score:v1',
    },
  },
};
