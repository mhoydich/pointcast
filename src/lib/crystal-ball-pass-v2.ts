export type AfterlightStats = {
  warmth: number;
  signal: number;
  wonder: number;
};

export type AfterlightChoice = {
  label: string;
  detail: string;
  result: string;
  delta: Partial<AfterlightStats>;
  tone: number;
};

export type AfterlightScene = {
  place: string;
  time: string;
  weather: string;
  title: string;
  story: string;
  micro: string;
  hue: string;
  choices: AfterlightChoice[];
};

export type AfterlightRoute = {
  id: 'moon' | 'river' | 'weather';
  number: string;
  name: string;
  callSign: string;
  promise: string;
  kit: string;
  hue: string;
  scenes: AfterlightScene[];
};

export const AFTERLIGHT_TITLE = 'Crystal Ball Pass V2: Afterlight';

export const AFTERLIGHT_DESCRIPTION =
  'Choose one of three night routes beyond Crystal Ball Pass, tune a lost forest signal, and carry it home with Codex Micro.';

export const AFTERLIGHT_ROUTES: AfterlightRoute[] = [
  {
    id: 'moon',
    number: '01',
    name: 'Moon Relay',
    callSign: 'LUNAR / 91.7',
    promise: 'High trail. Thin air. One abandoned transmitter still speaking to the moon.',
    kit: 'silver wire · wool cap · marmalade',
    hue: '#d9c9ff',
    scenes: [
      {
        place: 'Glass Fern Basin',
        time: '9:14 P.M.',
        weather: 'CLEAR · 36°',
        title: 'Every fern is holding a small moon.',
        story: 'The trail has become a field of mirrored leaves. The relay tower blinks twice above the ridge, then waits to see if you blink back.',
        micro: 'OPTICAL GREETING DETECTED. ETIQUETTE DATABASE: INSUFFICIENT.',
        hue: '#b9d5ff',
        choices: [
          { label: 'Answer with the lantern', detail: 'A careful hello in three flashes', result: 'Three windows answer from the empty ridge.', delta: { signal: 14, wonder: 6, warmth: -3 }, tone: 523 },
          { label: 'Follow the reflected path', detail: 'Beautiful footing · dubious physics', result: 'The ferns pass your light uphill leaf by leaf.', delta: { signal: 7, wonder: 14, warmth: -7 }, tone: 659 },
        ],
      },
      {
        place: 'Cable Car Graveyard',
        time: '10:02 P.M.',
        weather: 'CROSSWIND · 31°',
        title: 'The last car is still halfway home.',
        story: 'A cedar cable car hangs above the ravine. Inside: one thermos, a coil of silver wire, and a passenger list written in constellations.',
        micro: 'STRUCTURAL CONFIDENCE: 43%. COCOA CONFIDENCE: 96%.',
        hue: '#8fb4ff',
        choices: [
          { label: 'Cross inside the car', detail: 'Warm cocoa · loud cable', result: 'The car moves one impossible span and sets you down beside the tower.', delta: { warmth: 12, signal: 9, wonder: 5 }, tone: 392 },
          { label: 'Splice the silver wire', detail: 'Restore the ridge circuit', result: 'Every dead car lights at once, a necklace across the gorge.', delta: { warmth: -8, signal: 19, wonder: 10 }, tone: 784 },
        ],
      },
      {
        place: 'Moon Relay',
        time: '11:11 P.M.',
        weather: 'STAR WIND · 28°',
        title: 'The transmitter remembers one frequency.',
        story: 'The dish turns without power. A voice made of rain numbers asks what should be carried back down the mountain.',
        micro: 'UPLINK OPEN. PLEASE AVOID SENDING THE ENTIRE INTERNET.',
        hue: '#ead8ff',
        choices: [
          { label: 'Send the sound of camp', detail: 'Fire · spoons · one sleepy laugh', result: 'The moon returns a warmer version of the same song.', delta: { warmth: 8, signal: 16, wonder: 14 }, tone: 880 },
          { label: 'Send one unanswered question', detail: 'Keep the channel open', result: 'A second question arrives before your first has left.', delta: { signal: 11, wonder: 24, warmth: -4 }, tone: 988 },
        ],
      },
    ],
  },
  {
    id: 'river',
    number: '02',
    name: 'River Radio',
    callSign: 'WATER / 62.0',
    promise: 'Low trail. Wet boots. A broadcast moving downstream faster than any station.',
    kit: 'waxed map · tuning fork · pear',
    hue: '#71f4dc',
    scenes: [
      {
        place: 'Rain Dial',
        time: '8:48 P.M.',
        weather: 'RAIN · 43°',
        title: 'The river is changing stations.',
        story: 'Every bend carries a different broadcast: weather, fiddle, a baseball game from 1977, then your own footsteps ten seconds early.',
        micro: 'TEMPORAL ECHO: FRIENDLY. SPORTS RESULT: WITHHELD.',
        hue: '#69e4d2',
        choices: [
          { label: 'Tune the brass fork', detail: 'Match the river pitch', result: 'The current settles into a low green note.', delta: { signal: 15, wonder: 7, warmth: -4 }, tone: 330 },
          { label: 'Listen for tomorrow', detail: 'Stand still in the rain', result: 'Tomorrow says to bring the pear. You already did.', delta: { signal: 8, wonder: 17, warmth: -9 }, tone: 494 },
        ],
      },
      {
        place: 'Salmon Telephone',
        time: '9:37 P.M.',
        weather: 'RIVER FOG · 41°',
        title: 'A red receiver rings beneath the bridge.',
        story: 'The cord disappears into black water. A small brass plaque reads CALLS UPSTREAM FREE AFTER DARK.',
        micro: 'NO KEYPAD. NO TERMS OF SERVICE. PROMISING.',
        hue: '#63c7ff',
        choices: [
          { label: 'Answer upstream', detail: 'Ask who is calling', result: 'A hundred salmon say your name in perfect sequence.', delta: { signal: 18, wonder: 11, warmth: -3 }, tone: 587 },
          { label: 'Leave a message for the sea', detail: 'Speak after the bubbles', result: 'The receiver grows warm. Far west, something enormous clicks save.', delta: { warmth: 6, signal: 10, wonder: 15 }, tone: 698 },
        ],
      },
      {
        place: 'River Radio',
        time: '10:26 P.M.',
        weather: 'MIST LIFTING · 45°',
        title: 'The whole watershed is on the air.',
        story: 'At the confluence, stones glow like console buttons. Codex Micro gives you the red light. This broadcast belongs to whoever arrives wet.',
        micro: 'LIVE IN THREE, TWO—ACT NATURAL NEAR THE MIRACLE.',
        hue: '#8dffd7',
        choices: [
          { label: 'Read the trail report', detail: 'Practical news for night travelers', result: 'Cabins turn their porch lights on, one valley at a time.', delta: { warmth: 12, signal: 19, wonder: 8 }, tone: 440 },
          { label: 'Play the water itself', detail: 'No words · all current', result: 'The river becomes a record and the moon finds the groove.', delta: { signal: 13, wonder: 23, warmth: 2 }, tone: 784 },
        ],
      },
    ],
  },
  {
    id: 'weather',
    number: '03',
    name: 'Weather House',
    callSign: 'HOME / 38.4',
    promise: 'Cabin trail. Indoor weather. A house with one room for every forecast.',
    kit: 'blue key · tea brick · dry socks',
    hue: '#ffb36b',
    scenes: [
      {
        place: 'Porch of Small Storms',
        time: '8:31 P.M.',
        weather: 'LOCAL THUNDER · 47°',
        title: 'It is raining on exactly one chair.',
        story: 'The Weather House leans into the cedars. On its porch, thunder fits inside a teacup and lightning keeps politely to the saucer.',
        micro: 'MICROCLIMATE HAS BECOME LITERAL. REQUESTING DRY CHAIR.',
        hue: '#ffca7d',
        choices: [
          { label: 'Drink the thunder tea', detail: 'Peppery · electrically cozy', result: 'Your gloves spark blue whenever you point north.', delta: { warmth: 13, signal: 7, wonder: 10 }, tone: 415 },
          { label: 'Move the raining chair', detail: 'Put the storm under the eaves', result: 'The rain follows, delighted to be included.', delta: { warmth: 5, signal: 12, wonder: 13 }, tone: 622 },
        ],
      },
      {
        place: 'Forecast Hall',
        time: '9:16 P.M.',
        weather: 'ALL SEASONS · INDOORS',
        title: 'Four doors, four Octobers.',
        story: 'Snow blows under one door, warm wind under another. The blue key fits a door labeled WEATHER WE MISPLACED.',
        micro: 'LOST-AND-FOUND POLICY APPEARS METEOROLOGICAL.',
        hue: '#f49cff',
        choices: [
          { label: 'Open the misplaced weather', detail: 'Return one lost afternoon', result: 'A perfect Saturday rolls out and waits in the hall.', delta: { signal: 11, wonder: 18, warmth: 4 }, tone: 740 },
          { label: 'Choose the snow room', detail: 'Cold archive · clear tracks', result: 'You find footprints belonging to next winter.', delta: { signal: 17, wonder: 10, warmth: -11 }, tone: 370 },
        ],
      },
      {
        place: 'The Forecast Kitchen',
        time: '10:04 P.M.',
        weather: 'HEARTH FRONT · 68°',
        title: 'Tomorrow is simmering on the stove.',
        story: 'Three copper pots hold sun, rain, and fog. The house asks which weather the trail needs when morning comes.',
        micro: 'FORECAST MODE: EDIBLE. CAUTION: HOT CLIMATE.',
        hue: '#ff9a69',
        choices: [
          { label: 'Serve a clear morning', detail: 'Easy miles for everyone', result: 'Sunrise pours into jars for hikers who arrive late.', delta: { warmth: 17, signal: 14, wonder: 9 }, tone: 523 },
          { label: 'Keep a little fog', detail: 'The forest likes a secret', result: 'The fog curls into your pocket and promises not to spoil anything.', delta: { warmth: 10, signal: 9, wonder: 22 }, tone: 659 },
        ],
      },
    ],
  },
];
