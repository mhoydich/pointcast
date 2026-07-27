export interface BattlerHistoryEntry {
  date: string;
  label: string;
  title: string;
  body: string;
  routes: readonly string[];
}

export interface BattlerGang {
  id: string;
  short: string;
  name: string;
  color: string;
  accent: string;
  mark: string;
  cry: string;
  noun: number;
  attack: number;
  guard: number;
  speed: number;
  weird: number;
  scouting: string;
}

export interface BattlerField {
  id: string;
  name: string;
  modifier: string;
  note: string;
}

export const NOUN_BATTLER_ANNUAL_META = {
  id: "PC-NOUN-BATTLER-ANNUAL-2026",
  title: "The Battle Record",
  issue: "Noun Battler Annual 2026",
  publishedAt: "2026-07-27",
  canonical: "https://pointcast.xyz/noun-battler-annual",
  json: "https://pointcast.xyz/noun-battler-annual.json",
  description:
    "An interactive magazine history of Noun Battler, from the deterministic three-round duel to the eight-gang 30-v-30 Nouns Nation league and the Pacific 48 edition.",
  plates: [
    {
      name: "The First Box Score",
      path: "/noun-battler-annual/plates/01-first-box-score.jpg",
      alt: "A 1970s newspaper sports desk at deadline, where human editors and two blocky Noun correspondents study geometric match diagrams, contact sheets, stat chips, a stopwatch, and square glasses.",
    },
    {
      name: "Thirty Against Thirty",
      path: "/noun-battler-annual/plates/02-thirty-against-thirty.jpg",
      alt: "A packed civic stadium under floodlights as eight color-coded groups of blocky Noun athletes charge across the field while a vintage broadcast crew follows from the press box.",
    },
    {
      name: "The League Remembers",
      path: "/noun-battler-annual/plates/03-league-remembers.jpg",
      alt: "A tactile sports archive and replay bay filled with folded newspapers, recap cards, field diagrams, trophies, old monitors, and a Noun archivist reading a long accordion-fold standings ledger.",
    },
  ],
} as const;

export const NOUN_BATTLER_HISTORY: readonly BattlerHistoryEntry[] = [
  {
    date: "APR 17",
    label: "THE FIRST RULEBOOK",
    title: "A duel that could fit inside a receipt",
    body:
      "The original design turned each Noun seed into a fighter with derived type, attack, defense, speed, focus, and hit points. Strike, Guard, and Focus formed the stance triangle. The same seeds and choices produced the same result: no hidden state and no random roll.",
    routes: ["/battle", "/battle.json"],
  },
  {
    date: "APR 17",
    label: "CH.BTL OPENS",
    title: "The sport earns its own oxblood channel",
    body:
      "PointCast approved BTL as a ninth channel rather than hiding the matches inside another beat. Local match logs, replayable query strings, a rotating Card of the Day, and JSON export made the first duel feel like a tiny sport with an archive.",
    routes: ["/c/battler", "/battle-log"],
  },
  {
    date: "APR 28",
    label: "THE LEAGUE TURN",
    title: "Two fighters become sixty moving bodies",
    body:
      "Nouns Nation Battler changed the scale. Eight gangs entered a fourteen-day, four-match-per-day double round robin. Standard matches became 30 against 30, with runners, bonkers, slingers, captains, and healers moving on their own toward a four-team playoff and the Nouns Bowl.",
    routes: ["/games/nouns-nation-battler/", "/nouns-nation-battler-tv"],
  },
  {
    date: "APR 28",
    label: "WEATHER ARRIVES",
    title: "The field stops pretending to be neutral",
    body:
      "Open Field gained Amplifier Rift, Crown Rush, Lava Audit, Cloud Court, Trash Planet, Fog Bowl, and later Nouns Kingdom. Late-season boss mutations—Monsoon Rift, Neon Crown, Scrap Storm, and Blackout Fog—turned terrain into something the desk had to explain.",
    routes: ["/nouns-nation-battler-wiki", "/nouns-nation-battler-posters"],
  },
  {
    date: "APR 29",
    label: "THE DESK ERA",
    title: "A browser game grows a broadcast institution",
    body:
      "Battle Desk, V2, and V3 added a scorebug, standings, replay calls, scouting, producer controls, season recaps, and federation planning around the same embedded field. The game was no longer only an animation; it became a system for watching, explaining, and remembering one.",
    routes: ["/nouns-nation-battler/", "/nouns-nation-battler-v3/"],
  },
  {
    date: "APR 29–MAY 1",
    label: "ROOMS AROUND THE FIELD",
    title: "Agents, producers, sponsors, and hosts get desks",
    body:
      "Desk Wall snapshots, report cards, a Results Desk, Agent Bench, Sideline Desk, Sponsorship Desk, Production Desk, Claim Board, prompt kit, and wiki made the league legible to people and software outside the live match. Most state stayed browser-local; shared frames traveled through links and JSON.",
    routes: ["/nouns-nation-battler-desk", "/nouns-nation-battler-agents/"],
  },
  {
    date: "APR 30–MAY 6",
    label: "THE SCREEN MULTIPLIES",
    title: "Pocket Cast, Moon Cup, and result reenactment",
    body:
      "The same league learned to travel: phone-first Pocket Cast, a clean TV route, a lunar tournament, Bowl path, and an informational sports reenactment desk. A visitor could watch the field, host a room, carry a snapshot, or translate an outside score into an unofficial Nouns-shaped result.",
    routes: ["/nouns-nation-battler-mobile/", "/nouns-nation-battler-moon/"],
  },
  {
    date: "JUL 18",
    label: "THE PACIFIC 48",
    title: "The duel returns as a coastal card game",
    body:
      "A separate five-round edition dealt two cards from a 48-battler set, asked the player to call the stronger stat, and kept stamps and a compact Passport receipt locally. It did not replace the league. It proved the Battler idea could split into another sport and keep its family resemblance.",
    routes: ["/noun-battler", "https://noun-battler.mhoydich.chatgpt.site"],
  },
] as const;

export const NOUN_BATTLER_GANGS: readonly BattlerGang[] = [
  {
    id: "tomato",
    short: "TN",
    name: "Tomato Noggles",
    color: "#b63d32",
    accent: "#f3cf55",
    mark: "split tomato noggles",
    cry: "Noggles down, elbows out",
    noun: 0,
    attack: 82,
    guard: 66,
    speed: 75,
    weird: 58,
    scouting: "Fast pressure club. Gets to the story before the copy desk has a headline.",
  },
  {
    id: "cobalt",
    short: "CF",
    name: "Cobalt Frames",
    color: "#2865aa",
    accent: "#9dcaf2",
    mark: "blue square lenses",
    cry: "Blue frames, clean lanes",
    noun: 7,
    attack: 68,
    guard: 84,
    speed: 62,
    weird: 54,
    scouting: "A patient blue wall: tidy lanes, low panic, excellent late-copy defense.",
  },
  {
    id: "golden",
    short: "GN",
    name: "Golden Nouncil",
    color: "#b27b16",
    accent: "#f3da73",
    mark: "council coin",
    cry: "Vote yes, swing heavy",
    noun: 12,
    attack: 78,
    guard: 77,
    speed: 54,
    weird: 69,
    scouting: "Committee basketball with a hammer. Slow quorum, forceful resolution.",
  },
  {
    id: "garden",
    short: "GS",
    name: "Garden Stack",
    color: "#397d43",
    accent: "#a9d589",
    mark: "stacked leaf",
    cry: "Roots hold, heads roll",
    noun: 18,
    attack: 61,
    guard: 80,
    speed: 64,
    weird: 76,
    scouting: "Deep-rooted survival specialists who make strange weather look planned.",
  },
  {
    id: "pixel",
    short: "PU",
    name: "Pixel Union",
    color: "#7150a6",
    accent: "#cbb8e9",
    mark: "union pixel",
    cry: "One block, one bonk",
    noun: 24,
    attack: 74,
    guard: 73,
    speed: 71,
    weird: 71,
    scouting: "The balanced press-box favorite: coordinated, legible, dangerous everywhere.",
  },
  {
    id: "night",
    short: "NA",
    name: "Night Auction",
    color: "#303742",
    accent: "#c2c9d4",
    mark: "midnight paddle",
    cry: "Going once, going through",
    noun: 31,
    attack: 70,
    guard: 65,
    speed: 83,
    weird: 73,
    scouting: "After-hours transition attack. Moves before the room knows the lot is open.",
  },
  {
    id: "sunset",
    short: "SP",
    name: "Sunset Prop House",
    color: "#c96925",
    accent: "#efbd80",
    mark: "sunset ballot",
    cry: "Fund the charge",
    noun: 42,
    attack: 84,
    guard: 58,
    speed: 70,
    weird: 81,
    scouting: "A loud proposal with cleats. High variance, excellent photographs.",
  },
  {
    id: "mint",
    short: "MC",
    name: "Mint Condition",
    color: "#19877f",
    accent: "#a4ddd2",
    mark: "fresh mint stamp",
    cry: "Fresh mint, no mercy",
    noun: 55,
    attack: 65,
    guard: 76,
    speed: 79,
    weird: 67,
    scouting: "Clean recovery, quick legs, and the league's least wrinkled second half.",
  },
] as const;

export const NOUN_BATTLER_FIELDS: readonly BattlerField[] = [
  { id: "open", name: "Open Field", modifier: "speed", note: "Center control and clean transitions." },
  { id: "rift", name: "Amplifier Rift", modifier: "weird", note: "Element lanes and overloaded specials." },
  { id: "crown", name: "Crown Rush", modifier: "attack", note: "The center crown rewards pressure." },
  { id: "lava", name: "Lava Audit", modifier: "speed", note: "Camping burns; movement charges." },
  { id: "cloud", name: "Cloud Court", modifier: "speed", note: "Drifting platforms bend every lane." },
  { id: "trash", name: "Trash Planet", modifier: "weird", note: "Scrap piles hide sudden powerups." },
  { id: "fog", name: "Fog Bowl", modifier: "guard", note: "Range fades; close defense gets louder." },
  { id: "kingdom", name: "Nouns Kingdom", modifier: "attack", note: "A 25-v-25 siege with towers and gates." },
] as const;

export const NOUN_BATTLER_ROLES = [
  { name: "Runner", line: "74 HP · 1.34 speed", note: "Breakaway dash" },
  { name: "Bonker", line: "112 HP · 15 damage", note: "Noggles slam" },
  { name: "Slinger", line: "96 range · 9 damage", note: "Auction volley" },
  { name: "Captain", line: "132 HP · 16 damage", note: "Quorum rally" },
  { name: "Healer", line: "78 HP · 70 range", note: "Emergency mint" },
] as const;

export const NOUN_BATTLER_ROUTES = [
  { label: "Original duel", path: "/battle", note: "Three rounds · deterministic stance game" },
  { label: "Main Battle Desk", path: "/nouns-nation-battler/", note: "Live desk around the embedded league" },
  { label: "Playable field", path: "/games/nouns-nation-battler/", note: "30-v-30 auto-battler and local season" },
  { label: "TV cast", path: "/nouns-nation-battler-tv/", note: "Clean director-mode presentation" },
  { label: "Desk Wall", path: "/nouns-nation-battler-desk/", note: "Snapshots, reports, and scorebook frames" },
  { label: "Field guide", path: "/nouns-nation-battler-wiki/", note: "Rules, gangs, modes, and contribution map" },
  { label: "Pacific 48", path: "/noun-battler", note: "Five rounds · stat cards · local Passport" },
] as const;
