export type DrumDirectoryChapter = "the-five" | "nouns" | "together" | "after-hours";

export interface DrumDirectoryEntry {
  slug: string;
  name: string;
  path: string;
  chapter: DrumDirectoryChapter;
  eyebrow: string;
  description: string;
  fieldNote: string;
  players: string;
  duration: string;
  controls: string;
  accent: string;
  nounId?: number;
  screenshot?: string;
  tags: readonly string[];
}

export interface DrumRunnerEdition {
  version: string;
  name: string;
  path: string;
  year: string;
  tempo: string;
  premise: string;
  fieldNote: string;
  accent: string;
}

export const DRUM_DIRECTORY_META = {
  id: "PC-DRUM-DIRECTORY-2026",
  title: "The PointCast Drum Directory",
  issue: "The Big Beat Issue",
  publishedAt: "2026-07-27",
  canonical: "https://pointcast.xyz/drum-directory",
  json: "https://pointcast.xyz/drum-directory.json",
  description:
    "A giant illustrated field guide to the games, rooms, races, loops, Nouns, bells, and playable oddities inside the PointCast drum house.",
  generatedPlates: [
    {
      name: "The House Kit",
      path: "/drum-directory/plates/01-house-kit.jpg",
      alt: "A sunlit communal drum table covered with five sculptural pads, brass bells, tape machines, metronomes, score sheets, and colorful Nouns-style pixel glasses.",
    },
    {
      name: "Nouns on the Night Shift",
      path: "/drum-directory/plates/02-night-shift.jpg",
      alt: "A joyful after-hours civic-hall drum tournament with a mixed-age crowd, Nouns-style players, luminous percussion stations, bells, an analog wheel, and abstract bingo shapes.",
    },
    {
      name: "The Long Loop",
      path: "/drum-directory/plates/03-long-loop.jpg",
      alt: "A vintage screenprint-style panorama in which one Nouns-style drummer crosses seven connected road, desert, city, bandstand, coast, arena, and loop-siege worlds.",
    },
  ],
} as const;

export const DRUM_DIRECTORY_CHAPTERS = [
  {
    id: "the-five",
    number: "01",
    kicker: "THE HOUSE TESTS",
    title: "Five games that teach five different ways to listen.",
    description:
      "This is the clean arcade shelf: a start, a rule, a score, and a replay. Memory, restraint, pocket, strategy, and an internal clock make a compact drummer's pentathlon.",
  },
  {
    id: "nouns",
    number: "02",
    kicker: "NOGGLES ON",
    title: "The Nouns do not merely decorate the game.",
    description:
      "They become opponents, helpers, racers, league clubs, field hands, cola pieces, and the small comic witnesses who keep PointCast from taking competition too seriously.",
  },
  {
    id: "together",
    number: "03",
    kicker: "THE ROOM IS THE RULE",
    title: "Some games only exist because somebody else arrived.",
    description:
      "The shared drum bus turns taps into a town sport: races, relays, duels, quests, television rounds, and asynchronous phrases left behind for strangers.",
  },
  {
    id: "after-hours",
    number: "04",
    kicker: "PLAYABLE ODDITIES",
    title: "At closing time, the toys start making their own weather.",
    description:
      "A cake, a piñata, falling bells, one patient pendulum, a pop-art wall, and the pulse counter occupy the fertile border between game, instrument, ritual, and public sculpture.",
  },
] as const;

export const DRUM_DIRECTORY_ENTRIES: readonly DrumDirectoryEntry[] = [
  {
    slug: "drum-says",
    name: "Drum Says",
    path: "/drum-says",
    chapter: "the-five",
    eyebrow: "MEMORY / FOUR PADS",
    description:
      "A Noun calls a growing four-drum pattern. Echo it back, preserve the order, and hold the thread for one more round.",
    fieldNote:
      "The trick is that the game feels generous right up until it does not. The first sequences are practically conversational; then one extra color arrives and the whole thing becomes a test of whether you heard a rhythm or merely watched a light.",
    players: "1",
    duration: "2–6 min",
    controls: "Tap / keys 1–4",
    accent: "#e84a3c",
    nounId: 385,
    screenshot: "/drum-directory/screenshots/drum-says.jpg",
    tags: ["memory", "pattern", "starter"],
  },
  {
    slug: "drum-quickdraw",
    name: "Quick Draw",
    path: "/drum-quickdraw",
    chapter: "the-five",
    eyebrow: "REACTION / TEN DRAWS",
    description:
      "Wait for gold, ignore the feints, then strike. Ten clean draws become one reaction-time grade.",
    fieldNote:
      "Most reaction games reward twitch. Quick Draw rewards the refusal to twitch. The comedy is in the false starts: every premature tap is your nervous system signing a confession in public.",
    players: "1",
    duration: "90 sec",
    controls: "Tap / Space",
    accent: "#e7a928",
    nounId: 723,
    screenshot: "/drum-directory/screenshots/drum-quickdraw.jpg",
    tags: ["reaction", "restraint", "score"],
  },
  {
    slug: "drum-fill",
    name: "Fill the Bar",
    path: "/drum-fill",
    chapter: "the-five",
    eyebrow: "LISTEN / FIND THE GAP",
    description:
      "An eight-step groove has a hole in it. Land a tom in the missing step as the tempo and the number of absent hits multiply.",
    fieldNote:
      "This is the closest the arcade gets to a lesson with a good teacher. The loop tells you what it needs, leaves the door open, and waits. A correct fill feels less like winning than finishing a sentence.",
    players: "1",
    duration: "3–8 min",
    controls: "Tap / Space",
    accent: "#168c6b",
    nounId: 117,
    screenshot: "/drum-directory/screenshots/drum-fill.jpg",
    tags: ["pocket", "listening", "groove"],
  },
  {
    slug: "drum-runner",
    name: "Beat Runner v7: Loop Siege",
    path: "/drum-runner",
    chapter: "the-five",
    eyebrow: "BUILD / ATTACK / DEFEND",
    description:
      "Build a sixteen-step loop under fire. Every hit attacks now, then returns one loop later as a ghost attack you have to survive.",
    fieldNote:
      "Seven editions in, Beat Runner stopped being a runner and became a compositional defense game. That is the right kind of betrayal: the road is still in its bones, but now the thing chasing you is the rhythm you wrote thirty seconds ago.",
    players: "1",
    duration: "55 sec",
    controls: "D F J K / arrows / tap",
    accent: "#1775b8",
    nounId: 137,
    screenshot: "/drum-directory/screenshots/drum-runner.jpg",
    tags: ["strategy", "loop", "flagship"],
  },
  {
    slug: "drum-steady",
    name: "Steady Hands",
    path: "/drum-steady",
    chapter: "the-five",
    eyebrow: "SILENT TEMPO / 32 BEATS",
    description:
      "Four clicks establish the pulse. Then the guide disappears and you hold the tempo by feel for thirty-two taps.",
    fieldNote:
      "The screen becomes suspiciously quiet. You discover that an internal clock is not a clock at all but a small animal: it speeds up when excited, slows down when watched, and behaves best when you stop trying to dominate it.",
    players: "1",
    duration: "45 sec",
    controls: "Tap / Space",
    accent: "#7654b3",
    nounId: 523,
    screenshot: "/drum-directory/screenshots/drum-steady.jpg",
    tags: ["tempo", "focus", "meditative"],
  },
  {
    slug: "drum-v3",
    name: "Noun Rush inside Drum v3",
    path: "/drum-v3",
    chapter: "nouns",
    eyebrow: "FOUR SECONDS / TRACK ROOM",
    description:
      "The Spotify-synced collaborative drum room hides a four-second Noun Rush: a tiny scoring storm inside the larger shared listening surface.",
    fieldNote:
      "It is PointCast in miniature—music room, Noun portrait, multiplayer presence, and an absurdly brief arcade dare occupying the same page. Four seconds is long enough to establish a technique and short enough to demand one more run.",
    players: "1–many",
    duration: "4 sec rounds",
    controls: "Tap",
    accent: "#ef5b38",
    nounId: 137,
    screenshot: "/drum-directory/screenshots/drum-v3.jpg",
    tags: ["Nouns", "Spotify", "sprint"],
  },
  {
    slug: "nouns-memory-v2",
    name: "Nouns Memory v2",
    path: "/nouns-memory-v2",
    chapter: "nouns",
    eyebrow: "WINDOWS 95 / PAIRS",
    description:
      "Flip the desktop tiles, match the Noun pairs, clear the tray, and leave a local best behind.",
    fieldNote:
      "A familiar memory game becomes stranger when every card looks like a character who might be keeping notes on your mistakes. The Windows tray is the right frame: half game table, half recovered office computer.",
    players: "1",
    duration: "3–7 min",
    controls: "Click / tap",
    accent: "#1e72ae",
    nounId: 420,
    screenshot: "/drum-directory/screenshots/nouns-memory-v2.jpg",
    tags: ["Nouns", "memory", "retro"],
  },
  {
    slug: "nouns-mines-v2",
    name: "Nouns Mines v2",
    path: "/nouns-mines-v2",
    chapter: "nouns",
    eyebrow: "WINDOWS 95 / FIELD LOGIC",
    description:
      "Flag the mines, reveal the safe Noun tiles, and clear a desktop board that is cheerful right up to the explosion.",
    fieldNote:
      "The old office-game tension survives intact: one click can be deduction, faith, or administrative disaster. Flag mode makes the pocket version unusually friendly on touchscreens.",
    players: "1",
    duration: "4–12 min",
    controls: "Click / flag mode",
    accent: "#27623f",
    nounId: 313,
    tags: ["Nouns", "logic", "retro"],
  },
  {
    slug: "nouns-pyramid-v2",
    name: "Nouns Pyramid v2",
    path: "/nouns-pyramid-v2",
    chapter: "nouns",
    eyebrow: "WINDOWS 95 / THIRTEEN",
    description:
      "Remove pairs that add to thirteen, work the stock and waste, and try to clear the Noun pyramid without spending the undo.",
    fieldNote:
      "This is the quietest table in the issue. Its pleasure is architectural: each useful pair removes weight from the shape until the whole pyramid suddenly looks solvable.",
    players: "1",
    duration: "5–15 min",
    controls: "Click / tap",
    accent: "#a6652d",
    nounId: 99,
    tags: ["Nouns", "cards", "solitaire"],
  },
  {
    slug: "nouns-wood-chop",
    name: "Wood Chop Commons",
    path: "/nouns-wood-chop",
    chapter: "nouns",
    eyebrow: "COLLECT LOOP / COMMONS",
    description:
      "Pick a Noun helper, chop with rhythm, fill orders, bank bundles, plant seeds, and unlock local stamps.",
    fieldNote:
      "A clicker game grows a conscience. The loop does not end at extraction: wood becomes a bundle, bundles become receipts, seeds go back into the lot, and each helper bends the rhythm in a different direction.",
    players: "1",
    duration: "5–20 min",
    controls: "Tap / Space",
    accent: "#477243",
    nounId: 523,
    screenshot: "/drum-directory/screenshots/nouns-wood-chop.jpg",
    tags: ["Nouns", "collection", "stamps"],
  },
  {
    slug: "noun-battler",
    name: "Noun Battler: Pacific 48",
    path: "/noun-battler",
    chapter: "nouns",
    eyebrow: "FIVE ROUNDS / 48 BATTLERS",
    description:
      "A five-round CC0 stat battle with forty-eight fighters, a local stamp book, and a portable Passport card.",
    fieldNote:
      "Battler treats the Noun as a sports card, a combatant, and a piece of portable identity all at once. The match is brisk; the collecting apparatus around it is the deeper game.",
    players: "1",
    duration: "2–5 min",
    controls: "Choose / tap",
    accent: "#8a2432",
    nounId: 137,
    screenshot: "/drum-directory/screenshots/noun-battler.jpg",
    tags: ["Nouns", "battle", "collection"],
  },
  {
    slug: "nouns-cola-crush",
    name: "Nouns Cola Crush",
    path: "/nouns-cola-crush",
    chapter: "nouns",
    eyebrow: "MATCH THREE / SUPER GRAPHICS",
    description:
      "Swap bright Nouns Cola pieces, trigger cascades, chase the goal, and spend a finite stack of moves.",
    fieldNote:
      "The match-three grammar is instantly readable, which gives the art permission to shout. The generator-made super graphics turn every cascade into a little packaging explosion without hiding the board.",
    players: "1",
    duration: "3–10 min",
    controls: "Swipe / tap",
    accent: "#e63c32",
    nounId: 777,
    screenshot: "/drum-directory/screenshots/nouns-cola-crush.jpg",
    tags: ["Nouns", "puzzle", "pop"],
  },
  {
    slug: "nouns-open-circuit",
    name: "Nouns Open Circuit",
    path: "/nouns-open-circuit",
    chapter: "nouns",
    eyebrow: "AGENT LEAGUE / LIVE SHIFTS",
    description:
      "Rival clubs publish tactics, agents run visible match shifts, and each fixture resolves into a receipt-shaped record.",
    fieldNote:
      "This is less a sports game than a public league desk that happens to contain sport. Humans can watch the score; agents can read the packets, take a shift, and leave behind evidence that says exactly what happened.",
    players: "Humans + agents",
    duration: "Fixture length",
    controls: "Desk / agent packets",
    accent: "#2457a6",
    nounId: 808,
    tags: ["Nouns", "agents", "league"],
  },
  {
    slug: "drum-room-v2",
    name: "Drum Party V2",
    path: "/drum-room-v2",
    chapter: "together",
    eyebrow: "3D PARTY / CROWD QUESTS",
    description:
      "Up to one hundred visitors enter a shared 3D drum party with dancing Nouns, combos, hype, quests, confetti, and ocean-sculpting ripples.",
    fieldNote:
      "Party V2 is the maximal room: score and atmosphere are the same system. A kick can advance the quest, raise the crowd, move a body, and disturb the liquid stage without asking which category it belongs to.",
    players: "1–100",
    duration: "Open room",
    controls: "Tap / keyboard / gesture",
    accent: "#38a6c8",
    nounId: 742,
    screenshot: "/drum-directory/screenshots/drum-room-v2.jpg",
    tags: ["multiplayer", "3D", "party"],
  },
  {
    slug: "drum-room",
    name: "The 3D Drum Room",
    path: "/drum-room",
    chapter: "together",
    eyebrow: "SHARED CIRCLE / WEBSOCKETS",
    description:
      "A pleasant browser-native kit where up to one hundred visitors can enter the same room and hear one another play.",
    fieldNote:
      "The original room is calmer than its sequel and useful for exactly that reason. It proves the essential PointCast proposition: a URL, a kit, a few strangers, and timing good enough to make a small social fact.",
    players: "1–100",
    duration: "Open room",
    controls: "Tap / keyboard",
    accent: "#315b86",
    nounId: 385,
    tags: ["multiplayer", "3D", "room"],
  },
  {
    slug: "drum-duel",
    name: "Duel",
    path: "/drum-duel",
    chapter: "together",
    eyebrow: "ONE QUEUE / TWENTY SECONDS",
    description:
      "Two visitors, one shared pad, twenty seconds. Whoever has more taps when the clock expires wins.",
    fieldNote:
      "Nothing is hidden and nothing needs explaining. The drama comes from the queue: two people are not tapping side by side so much as arguing over one public beat.",
    players: "2",
    duration: "20 sec",
    controls: "Tap",
    accent: "#c33a2e",
    nounId: 205,
    tags: ["1v1", "race", "fast"],
  },
  {
    slug: "drum-relay-2",
    name: "Relay 2",
    path: "/drum-relay-2",
    chapter: "together",
    eyebrow: "THREE TAPS / TWELVE FRAGMENTS",
    description:
      "Tap three times and leave the fragment behind. The chamber collects twelve fragments and plays them as one long chain.",
    fieldNote:
      "Relay turns authorship into a handoff. Nobody controls the final phrase, but everyone can recognize the exact little section where they briefly held the baton.",
    players: "1–12 async",
    duration: "Three taps",
    controls: "Tap",
    accent: "#d2762e",
    nounId: 117,
    tags: ["async", "composition", "relay"],
  },
  {
    slug: "drum-echo",
    name: "Echo",
    path: "/drum-echo",
    chapter: "together",
    eyebrow: "CALL / RESPONSE / ASYNC",
    description:
      "Record a five-hit phrase. The chamber plays another visitor's phrase and asks you to echo it.",
    fieldNote:
      "A stranger can be absent and still become your musical partner. The five-note limit keeps the exchange human-sized: not a file upload, not a performance, just a phrase passed under the door.",
    players: "2 async",
    duration: "30–90 sec",
    controls: "Tap",
    accent: "#7b55a6",
    nounId: 420,
    tags: ["async", "memory", "response"],
  },
  {
    slug: "drum-vs",
    name: "Drum VS",
    path: "/drum-vs",
    chapter: "together",
    eyebrow: "SEND A LINK / FIRST TO FIFTY",
    description:
      "A shareable 1v1 room with tug-of-war and reaction-duel modes: pick a Noun, send the URL, and pull the center with taps.",
    fieldNote:
      "VS understands that the invitation is part of the game. The room code, the chosen face, and the tiny act of sending a link provide the pre-match ceremony that a bare counter never could.",
    players: "2",
    duration: "1–3 min",
    controls: "Tap",
    accent: "#f05a40",
    nounId: 313,
    tags: ["1v1", "shareable", "Nouns"],
  },
  {
    slug: "drum-league",
    name: "Drum League",
    path: "/drum-league",
    chapter: "together",
    eyebrow: "EVERY TAP COUNTS",
    description:
      "Every event across the drum house contributes to a single community counter, weekly leaderboard, featured duel, and live room.",
    fieldNote:
      "League is cooperative with a leaderboard, an excellent contradiction. Your tap helps the town total and your name at the same time, converting the entire archive into one distributed season.",
    players: "The whole town",
    duration: "Weekly",
    controls: "Any drum surface",
    accent: "#385d92",
    nounId: 1042,
    tags: ["community", "leaderboard", "season"],
  },
  {
    slug: "drum-tv-bingo",
    name: "Drum Bingo",
    path: "/drum-tv-bingo",
    chapter: "together",
    eyebrow: "CAST TO TV / 5 × 5",
    description:
      "Every visitor receives a card of drum-event types. The live bus marks matching cells until the first five-in-a-row takes the room.",
    fieldNote:
      "Bingo is the brilliant spectator game because nobody has to stop playing the other games. Organ notes, kettles, bells, combos, and agent taps become the balls tumbling through one very large civic hopper.",
    players: "Room-sized",
    duration: "Until bingo",
    controls: "Play anywhere",
    accent: "#d33a37",
    nounId: 723,
    tags: ["TV", "multiplayer", "spectator"],
  },
  {
    slug: "drum-tv-gauntlet",
    name: "Noun Gauntlet",
    path: "/drum-tv-gauntlet",
    chapter: "together",
    eyebrow: "SIXTY SECONDS / TOP THREE",
    description:
      "Each present Noun gets a vertical track. Every drum-bus event sends the head upward; the top three reach the podium at the bell.",
    fieldNote:
      "A whole website becomes the controller. Someone can climb the same television race by playing a kettle, an organ, or a tiny drum on another page—a loose, marvelous definition of athletics.",
    players: "Room-sized",
    duration: "60 sec",
    controls: "Any drum event",
    accent: "#38a169",
    nounId: 777,
    screenshot: "/drum-directory/screenshots/drum-tv-gauntlet.jpg",
    tags: ["TV", "race", "Nouns"],
  },
  {
    slug: "drum-tv-roulette",
    name: "Noun Roulette",
    path: "/drum-tv-roulette",
    chapter: "together",
    eyebrow: "THIRTY-SECOND LEADER",
    description:
      "A wheel of everyone present spins every thirty seconds. One Noun becomes leader and every one of their events earns a starburst.",
    fieldNote:
      "The prize is not money or power but thirty seconds of attention. That makes Roulette unexpectedly tender: the wheel selects one person and the architecture briefly notices everything they do.",
    players: "Room-sized",
    duration: "30 sec rounds",
    controls: "Any drum event",
    accent: "#d4a42d",
    nounId: 99,
    tags: ["TV", "roulette", "celebration"],
  },
  {
    slug: "drum-pinata",
    name: "The Virtual Piñata",
    path: "/drum-pinata",
    chapter: "after-hours",
    eyebrow: "SHARED THRESHOLD / TAKE A SWING",
    description:
      "A piñata hangs in the center of the page. Visitors take swings until the room reaches the burst threshold.",
    fieldNote:
      "The object absorbs a crowd's little arrivals, then fails spectacularly. It is a birthday game, a public counter, and a suspense device built from the oldest possible rule: keep hitting it.",
    players: "1–many",
    duration: "Until burst",
    controls: "Tap / swing",
    accent: "#dd407f",
    nounId: 385,
    tags: ["ritual", "birthday", "shared"],
  },
  {
    slug: "drum-cake",
    name: "The Virtual Birthday Cake",
    path: "/drum-cake",
    chapter: "after-hours",
    eyebrow: "LIGHT TOGETHER / BLOW TOGETHER",
    description:
      "Personalize a cake with a name and age, share the link, light the candles as a group, then blow them out.",
    fieldNote:
      "The cake is a game only in the generous household sense. Its win condition is coordinated attention: enough people show up, the candles glow, and the URL briefly becomes a room with a reason.",
    players: "1–many",
    duration: "A birthday minute",
    controls: "Tap",
    accent: "#e88e8e",
    nounId: 742,
    tags: ["ritual", "birthday", "shareable"],
  },
  {
    slug: "drum-bell-fall-v2",
    name: "Bell Fall v2",
    path: "/drum-bell-fall-v2",
    chapter: "after-hours",
    eyebrow: "GENERATIVE INSTRUMENT / WEATHER",
    description:
      "Automated bell rain with fall ranges, gallery backgrounds, live visual modes, and generated audio.",
    fieldNote:
      "Bell Fall is a playable forecast. You set the conditions, then the instrument surprises you inside them—less like performing a score than opening an umbrella in exactly the right storm.",
    players: "1",
    duration: "Open-ended",
    controls: "Modes / ranges",
    accent: "#b28136",
    nounId: 205,
    tags: ["bells", "generative", "ambient"],
  },
  {
    slug: "drum-bell-jar",
    name: "Bell Jar",
    path: "/drum-bell-jar",
    chapter: "after-hours",
    eyebrow: "SHAKE THE GLASS / PENTATONIC",
    description:
      "A glass jar full of brass bells. Shake it and the contents answer in random pentatonic notes.",
    fieldNote:
      "There is no score and no hidden upgrade path, only the crisp satisfaction of disturbing a beautiful object. The game is deciding when the room has heard enough.",
    players: "1",
    duration: "10 sec–10 min",
    controls: "Click / tap",
    accent: "#9b6d2e",
    nounId: 523,
    tags: ["bells", "ambient", "toy"],
  },
  {
    slug: "drum-pendulum",
    name: "Pendulum",
    path: "/drum-pendulum",
    chapter: "after-hours",
    eyebrow: "ONE BELL / THIRTY SECONDS",
    description:
      "Push a brass bell on a long rope. It rings at each apex while the energy slowly decays.",
    fieldNote:
      "The rule is physics and the score is patience. One push creates half a minute of consequences, which makes every unnecessary second push feel like interrupting somebody mid-sentence.",
    players: "1",
    duration: "30 sec",
    controls: "Click / push",
    accent: "#7e6437",
    nounId: 117,
    tags: ["bells", "physics", "meditative"],
  },
  {
    slug: "drum-warhol-live",
    name: "Warhol Live",
    path: "/drum-warhol-live",
    chapter: "after-hours",
    eyebrow: "24 TILES / ONE WALL",
    description:
      "Click a tile to repaint it your color. Everyone looking at the shared pop-art wall sees the change.",
    fieldNote:
      "The competition is territorial but the result is collaborative. Every visitor tries to claim a square; the wall treats all those claims as paint and quietly turns them into a composition.",
    players: "1–many",
    duration: "Open wall",
    controls: "Click / tap",
    accent: "#d52f69",
    nounId: 420,
    tags: ["shared", "art", "color"],
  },
  {
    slug: "drum-pulse",
    name: "The Global Drum Pulse",
    path: "/drum-pulse",
    chapter: "after-hours",
    eyebrow: "EVERY TAP / EVER",
    description:
      "A live count of every event on every PointCast drum surface, with celebrations waiting at major milestones.",
    fieldNote:
      "Pulse is not played directly; it is what all the other games have been playing together. The number is a score, an archive, and a heartbeat that turns a pile of routes into one organism.",
    players: "Everybody",
    duration: "Permanent",
    controls: "Play any drum page",
    accent: "#ce3c32",
    nounId: 808,
    tags: ["counter", "archive", "community"],
  },
] as const;

export const DRUM_RUNNER_EDITIONS: readonly DrumRunnerEdition[] = [
  {
    version: "v1",
    name: "Endless Original",
    path: "/drum-runner-v1",
    year: "The first road",
    tempo: "Endless",
    premise: "A Noun auto-runs El Segundo while the groove, speed, and obstacle grid keep climbing.",
    fieldNote: "Pure forward motion: jump the grid, survive the acceleration, and watch a simple road become a stamina test.",
    accent: "#d8583f",
  },
  {
    version: "v2",
    name: "Postcards",
    path: "/drum-runner-v2",
    year: "Four scenes",
    tempo: "92→128 BPM",
    premise: "Run through four beat-mapped El Segundo scenes and jump cones, carts, speakers, and refinery barriers.",
    fieldNote: "The endless road becomes a tour. Each level is a postcard with different civic clutter and a faster pulse.",
    accent: "#d88f39",
  },
  {
    version: "v3",
    name: "Pocket",
    path: "/drum-runner-v3",
    year: "Play the city",
    tempo: "Four levels",
    premise: "Perform each cue: an on-grid tap sounds a note, clears an obstacle one beat later, and builds the track.",
    fieldNote: "V3 makes the crucial move from reacting to composing. The city opens because you supplied the beat.",
    accent: "#337e74",
  },
  {
    version: "v4",
    name: "Road Band",
    path: "/drum-runner-v4",
    year: "The arrangement",
    tempo: "Four scenes",
    premise: "Pick a Noun, play the road, and collect musical gear that rewrites the arrangement around the run.",
    fieldNote: "A power-up becomes an orchestration decision. The collectible changes what the journey sounds like, not merely how hard you hit.",
    accent: "#3974a5",
  },
  {
    version: "v5",
    name: "Bright Miles",
    path: "/drum-runner-v5",
    year: "The passport",
    tempo: "Saved roads",
    premise: "Road XP, collectible stamps, saved performances, and an optional Kukai-signed Beat Pass wrap the musical runner.",
    fieldNote: "The road becomes something you can remember and carry. Progress is framed as a travel record instead of a pile of points.",
    accent: "#cfb127",
  },
  {
    version: "v6",
    name: "Pulse Arena",
    path: "/drum-runner-v6",
    year: "The turn",
    tempo: "Fast rounds",
    premise: "A four-direction rhythm arena where every movement and attack shares one latency-aware audio clock.",
    fieldNote: "The camera metaphor breaks: no more road, just pulse and direction. It is the series learning that rhythm can be the physics.",
    accent: "#7d58a6",
  },
  {
    version: "v7",
    name: "Loop Siege",
    path: "/drum-runner",
    year: "The return",
    tempo: "132→180 BPM",
    premise: "Every drum hit attacks now and returns one loop later as a ghost attack aimed back at the center.",
    fieldNote: "The mature game: write carefully, because the next enemy is your own sentence returning with teeth.",
    accent: "#c43a34",
  },
] as const;

export const DRUM_DIRECTORY_COUNTS = {
  described: DRUM_DIRECTORY_ENTRIES.length,
  runnerEditions: DRUM_RUNNER_EDITIONS.length,
  chapters: DRUM_DIRECTORY_CHAPTERS.length,
  nounGames: DRUM_DIRECTORY_ENTRIES.filter((entry) => entry.chapter === "nouns").length,
  sharedGames: DRUM_DIRECTORY_ENTRIES.filter((entry) => entry.chapter === "together").length,
} as const;

export function entriesForChapter(chapter: DrumDirectoryChapter): readonly DrumDirectoryEntry[] {
  return DRUM_DIRECTORY_ENTRIES.filter((entry) => entry.chapter === chapter);
}
