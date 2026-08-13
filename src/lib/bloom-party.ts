/**
 * bloom-party — shared vocabulary and rules for Bloom Party, the PointCast
 * party game at /bloom-party.
 *
 * Bloom Party borrows Tone Bloom's vocabulary (12 synthesized voices, four
 * pace modes, generative audio-visual "blooms") and turns it into a game for
 * 4-15 co-located people, each on their own phone.
 *
 * The central rule of the whole system: **the server never moves audio.** A
 * bloom is a ten-field spec. Every client synthesizes the identical bloom from
 * that spec via a seeded PRNG, so a broadcast frame stays under 512 bytes and
 * fifteen phones cost exactly what four do.
 *
 * This module is imported by the page, the JSON twin, the Durable Object
 * worker, and the tests. Everything here is pure — no DOM, no network — except
 * `renderBloom`, which takes an AudioContext the caller supplies.
 *
 * Author: cc. Source: Mike Hoydich chat directive, 2026-08-08: "create a fun
 * party game on tone bloom and publish, about 10 to 15 of us getting together
 * and could be all could be 4 enjoy".
 */

// ---------- voices ---------------------------------------------------------

export interface VoiceSpec {
  slug: string;
  label: string;
  wave: 'sine' | 'triangle' | 'square' | 'sawtooth';
  /** [frequency ratio, relative gain] pairs stacked to make the timbre. */
  partials: Array<[number, number]>;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  filterType: 'lowpass' | 'bandpass' | 'highpass';
  baseCutoff: number;
  q: number;
  detuneCents: number;
  /** 0-1 blend of shaped noise, for breath and water textures. */
  noiseMix: number;
}

/**
 * Twelve voices. Seven names are Tone Bloom's own, taken from the PointCast
 * review (`src/pages/reviews/tone-bloom.astro`) so the two surfaces agree:
 * Bell, Gong, Singing Bowl, Velvet Vibes, Sunlit Marimba, Water Drop, and
 * Neon Spring. The remaining five extend the same family for this game.
 */
export const VOICES: VoiceSpec[] = [
  {
    slug: 'bell', label: 'Bell', wave: 'sine',
    partials: [[1, 1], [2.76, 0.36], [5.4, 0.14], [8.9, 0.05]],
    attack: 0.004, decay: 0.9, sustain: 0.06, release: 2.4,
    filterType: 'lowpass', baseCutoff: 3200, q: 0.7, detuneCents: 0, noiseMix: 0,
  },
  {
    slug: 'gong', label: 'Gong', wave: 'sine',
    partials: [[1, 1], [1.48, 0.5], [2.11, 0.3], [3.42, 0.18], [4.71, 0.08]],
    attack: 0.02, decay: 2.4, sustain: 0.12, release: 3.6,
    filterType: 'lowpass', baseCutoff: 1800, q: 0.9, detuneCents: 6, noiseMix: 0.04,
  },
  {
    slug: 'singing-bowl', label: 'Singing Bowl', wave: 'sine',
    partials: [[1, 1], [2.02, 0.45], [3.01, 0.22], [4.06, 0.1]],
    attack: 0.12, decay: 1.8, sustain: 0.4, release: 3.2,
    filterType: 'lowpass', baseCutoff: 2400, q: 1.2, detuneCents: 4, noiseMix: 0.02,
  },
  {
    slug: 'velvet-vibes', label: 'Velvet Vibes', wave: 'triangle',
    partials: [[1, 1], [2, 0.28], [4, 0.09]],
    attack: 0.01, decay: 0.7, sustain: 0.2, release: 1.6,
    filterType: 'lowpass', baseCutoff: 2000, q: 0.6, detuneCents: 8, noiseMix: 0,
  },
  {
    slug: 'sunlit-marimba', label: 'Sunlit Marimba', wave: 'sine',
    partials: [[1, 1], [3.9, 0.3], [10.1, 0.08]],
    attack: 0.002, decay: 0.42, sustain: 0.02, release: 0.7,
    filterType: 'lowpass', baseCutoff: 4200, q: 0.5, detuneCents: 0, noiseMix: 0.01,
  },
  {
    slug: 'water-drop', label: 'Water Drop', wave: 'sine',
    partials: [[1, 1], [2.4, 0.2]],
    attack: 0.001, decay: 0.2, sustain: 0, release: 0.5,
    filterType: 'bandpass', baseCutoff: 1600, q: 5.5, detuneCents: 0, noiseMix: 0.12,
  },
  {
    slug: 'neon-spring', label: 'Neon Spring', wave: 'square',
    partials: [[1, 0.7], [2, 0.3], [3, 0.16]],
    attack: 0.003, decay: 0.28, sustain: 0.08, release: 0.6,
    filterType: 'lowpass', baseCutoff: 3600, q: 2.4, detuneCents: 14, noiseMix: 0,
  },
  {
    slug: 'paper-chime', label: 'Paper Chime', wave: 'triangle',
    partials: [[1, 0.8], [4.2, 0.24], [7.3, 0.1]],
    attack: 0.002, decay: 0.5, sustain: 0.03, release: 1.1,
    filterType: 'highpass', baseCutoff: 700, q: 0.8, detuneCents: 3, noiseMix: 0.08,
  },
  {
    slug: 'glass-rain', label: 'Glass Rain', wave: 'sine',
    partials: [[1, 0.9], [6.1, 0.2], [11.4, 0.07]],
    attack: 0.001, decay: 0.34, sustain: 0, release: 0.8,
    filterType: 'bandpass', baseCutoff: 2800, q: 4, detuneCents: 0, noiseMix: 0.16,
  },
  {
    slug: 'soft-reed', label: 'Soft Reed', wave: 'sawtooth',
    partials: [[1, 0.55], [2, 0.2], [3, 0.09]],
    attack: 0.06, decay: 0.5, sustain: 0.5, release: 1.2,
    filterType: 'lowpass', baseCutoff: 1500, q: 1.6, detuneCents: 10, noiseMix: 0.06,
  },
  {
    slug: 'low-tide', label: 'Low Tide', wave: 'triangle',
    partials: [[0.5, 0.9], [1, 0.6], [2, 0.14]],
    attack: 0.3, decay: 1.6, sustain: 0.55, release: 2.8,
    filterType: 'lowpass', baseCutoff: 900, q: 0.7, detuneCents: 5, noiseMix: 0.03,
  },
  {
    slug: 'pocket-choir', label: 'Pocket Choir', wave: 'sawtooth',
    partials: [[1, 0.5], [2, 0.22], [2.99, 0.12], [4.01, 0.06]],
    attack: 0.18, decay: 1.1, sustain: 0.45, release: 2.2,
    filterType: 'lowpass', baseCutoff: 1700, q: 1, detuneCents: 16, noiseMix: 0.02,
  },
];

export const VOICE_SLUGS: string[] = VOICES.map((voice) => voice.slug);

// ---------- paces ----------------------------------------------------------

export interface PaceSpec {
  slug: string;
  label: string;
  noteMs: number;
  gapMs: number;
  notesPerCycle: number;
  /** 0-0.5 — proportion of a note the off-beats are pushed late. */
  swing: number;
}

/** Tone Bloom's four speeds, same names and same order as the review page. */
export const PACES: PaceSpec[] = [
  { slug: 'float', label: 'Float', noteMs: 1400, gapMs: 520, notesPerCycle: 3, swing: 0 },
  { slug: 'flow', label: 'Flow', noteMs: 760, gapMs: 220, notesPerCycle: 4, swing: 0.08 },
  { slug: 'quick', label: 'Quick', noteMs: 400, gapMs: 90, notesPerCycle: 6, swing: 0.14 },
  { slug: 'spark', label: 'Spark', noteMs: 210, gapMs: 40, notesPerCycle: 8, swing: 0.2 },
];

export const PACE_SLUGS: string[] = PACES.map((pace) => pace.slug);

// ---------- knobs ----------------------------------------------------------

/**
 * Six tonics drawn from a single pentatonic set. Every bloom in a room is
 * therefore consonant with every other one — two blooms played back-to-back
 * never clash, which matters when fifteen of them play in a row.
 */
export const ROOTS: Array<{ slug: string; label: string; hz: number }> = [
  { slug: 'c', label: 'C', hz: 261.63 },
  { slug: 'd', label: 'D', hz: 293.66 },
  { slug: 'e', label: 'E', hz: 329.63 },
  { slug: 'g', label: 'G', hz: 392.0 },
  { slug: 'a', label: 'A', hz: 440.0 },
  { slug: 'c2', label: 'C↑', hz: 523.25 },
];

/** Scale degrees as frequency ratios — major pentatonic over two octaves. */
const PENTATONIC = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2];

export const BRIGHTNESS_RANGE_HZ: [number, number] = [220, 7000];
export const DENSITY_RANGE: [number, number] = [1, 4];

export interface BloomSpec {
  voice: string;
  pace: string;
  /** 0-1 → filter cutoff, exponentially mapped across BRIGHTNESS_RANGE_HZ. */
  brightness: number;
  /** 0-1 → detune LFO depth and stereo pan wobble. */
  drift: number;
  /** 1-4 simultaneous notes. */
  density: number;
  root: string;
  /** 0-9999, the player's re-roll. Deterministic across every device. */
  seed: number;
}

export const DEFAULT_SPEC: BloomSpec = {
  voice: 'singing-bowl',
  pace: 'flow',
  brightness: 0.5,
  drift: 0.3,
  density: 2,
  root: 'c',
  seed: 0,
};

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Coerce anything into a valid spec. Used on both sides of the wire — the
 *  worker must never trust a client's spec, and a client must never crash on
 *  a spec from an older build. */
export function normalizeSpec(input: unknown): BloomSpec {
  const raw = (typeof input === 'object' && input !== null ? input : {}) as Record<string, unknown>;
  const num = (key: string, fallback: number): number => {
    const value = raw[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  };
  const pick = (key: string, allowed: string[], fallback: string): string => {
    const value = raw[key];
    return typeof value === 'string' && allowed.includes(value) ? value : fallback;
  };
  return {
    voice: pick('voice', VOICE_SLUGS, DEFAULT_SPEC.voice),
    pace: pick('pace', PACE_SLUGS, DEFAULT_SPEC.pace),
    brightness: clamp(0, 1, num('brightness', DEFAULT_SPEC.brightness)),
    drift: clamp(0, 1, num('drift', DEFAULT_SPEC.drift)),
    density: Math.round(clamp(DENSITY_RANGE[0], DENSITY_RANGE[1], num('density', DEFAULT_SPEC.density))),
    root: pick('root', ROOTS.map((r) => r.slug), DEFAULT_SPEC.root),
    seed: Math.trunc(clamp(0, 9999, num('seed', DEFAULT_SPEC.seed))),
  };
}

export function voiceFor(spec: BloomSpec): VoiceSpec {
  return VOICES.find((voice) => voice.slug === spec.voice) ?? VOICES[2]!;
}

export function paceFor(spec: BloomSpec): PaceSpec {
  return PACES.find((pace) => pace.slug === spec.pace) ?? PACES[1]!;
}

export function rootHzFor(spec: BloomSpec): number {
  return ROOTS.find((root) => root.slug === spec.root)?.hz ?? ROOTS[0]!.hz;
}

// ---------- seeded randomness ---------------------------------------------

/** FNV-1a over the spec's canonical string form. Same spec → same seed on
 *  every device, which is what makes server-free playback identical. */
export function specToSeed(spec: BloomSpec): number {
  const canonical = `${spec.voice}|${spec.pace}|${spec.brightness.toFixed(3)}|${spec.drift.toFixed(3)}|${spec.density}|${spec.root}|${spec.seed}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32 — small, fast, good enough for ornamentation. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ScheduledNote {
  /** Seconds from the start of the bloom. */
  at: number;
  hz: number;
  gain: number;
  pan: number;
  durationSec: number;
}

/**
 * Turn a spec into the full note list for one playback. Pure and
 * deterministic, so the canvas can draw from the same array the synth plays
 * and the tests can assert on it without an AudioContext.
 */
export function scheduleBloom(spec: BloomSpec, durationMs: number): ScheduledNote[] {
  const pace = paceFor(spec);
  const rand = mulberry32(specToSeed(spec));
  const rootHz = rootHzFor(spec);
  const stepMs = pace.noteMs + pace.gapMs;
  const notes: ScheduledNote[] = [];

  for (let index = 0; index * stepMs < durationMs; index++) {
    const swung = index % 2 === 1 ? pace.swing * stepMs : 0;
    const at = (index * stepMs + swung) / 1000;
    if (at * 1000 >= durationMs) break;

    for (let layer = 0; layer < spec.density; layer++) {
      const degree = Math.floor(rand() * PENTATONIC.length);
      const ratio = PENTATONIC[degree] ?? 1;
      // Higher layers sit above the fundamental so density reads as bloom,
      // not as mud.
      const octave = layer === 0 ? 1 : 1 + Math.floor(rand() * 2);
      notes.push({
        at: at + layer * 0.012,
        hz: rootHz * ratio * octave,
        gain: (layer === 0 ? 0.9 : 0.55) * (0.7 + rand() * 0.3),
        pan: (rand() * 2 - 1) * spec.drift * 0.8,
        durationSec: pace.noteMs / 1000,
      });
    }
  }
  return notes;
}

/** Exponential map from the brightness knob to a filter cutoff in Hz. */
export function cutoffHz(brightness: number): number {
  const [low, high] = BRIGHTNESS_RANGE_HZ;
  return low * Math.pow(high / low, clamp(0, 1, brightness));
}

// ---------- prompt deck ----------------------------------------------------

export interface PromptCard {
  id: string;
  text: string;
}

/**
 * Forty cards. Each names a moment specific enough that a room will disagree
 * about it, which is the whole game. Written to the register in VOICE.md:
 * plain, concrete, no winking.
 */
export const PROMPTS: PromptCard[] = [
  { id: 'p01', text: '3am drive' },
  { id: 'p02', text: 'First coffee' },
  { id: 'p03', text: 'The elevator in a nice hotel' },
  { id: 'p04', text: 'Waiting room, good news' },
  { id: 'p05', text: 'Waiting room, bad news' },
  { id: 'p06', text: 'Rain starting while you are still outside' },
  { id: 'p07', text: 'The last twenty minutes of a long flight' },
  { id: 'p08', text: 'Someone else’s kitchen at midnight' },
  { id: 'p09', text: 'Opening a window in February' },
  { id: 'p10', text: 'The parking lot after the concert' },
  { id: 'p11', text: 'A dog that has just noticed you' },
  { id: 'p12', text: 'Sunday, 4pm, nothing scheduled' },
  { id: 'p13', text: 'The moment the power comes back on' },
  { id: 'p14', text: 'Grocery store, ten minutes to closing' },
  { id: 'p15', text: 'Text message you have read four times' },
  { id: 'p16', text: 'The good chair' },
  { id: 'p17', text: 'Swimming pool, no one else in it' },
  { id: 'p18', text: 'Fixing something on the first try' },
  { id: 'p19', text: 'Airport, gate change announced' },
  { id: 'p20', text: 'A hallway you used to walk every day' },
  { id: 'p21', text: 'Fog on the way to the beach' },
  { id: 'p22', text: 'The second cup, which is a mistake' },
  { id: 'p23', text: 'Laundry, still warm' },
  { id: 'p24', text: 'Getting the joke a beat late' },
  { id: 'p25', text: 'The freeway at 5:40am' },
  { id: 'p26', text: 'Bookstore, no plan' },
  { id: 'p27', text: 'A room right after everyone leaves' },
  { id: 'p28', text: 'Ice in a glass' },
  { id: 'p29', text: 'The dentist, but it went fine' },
  { id: 'p30', text: 'Finding money in a coat' },
  { id: 'p31', text: 'Streetlights coming on early' },
  { id: 'p32', text: 'Someone practicing scales upstairs' },
  { id: 'p33', text: 'The first warm day' },
  { id: 'p34', text: 'Losing an argument you started' },
  { id: 'p35', text: 'A very good sandwich' },
  { id: 'p36', text: 'The library in summer' },
  { id: 'p37', text: 'Waking up before the alarm' },
  { id: 'p38', text: 'Traffic, but you are not late' },
  { id: 'p39', text: 'The end of a good phone call' },
  { id: 'p40', text: 'A hill you did not expect' },
];

/** Deal a prompt that has not appeared yet this session; reshuffle when the
 *  deck runs dry so a long night never stalls. */
export function dealPrompt(used: string[], roll: () => number): PromptCard {
  const fresh = PROMPTS.filter((card) => !used.includes(card.id));
  const deck = fresh.length > 0 ? fresh : PROMPTS;
  return deck[Math.floor(roll() * deck.length)] ?? deck[0]!;
}

// ---------- round shape and scaling ---------------------------------------

export const ROUNDS_PER_GAME = 5;
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 15;
export const MAX_OBSERVERS = 5;
export const MAX_CONNECTIONS = MAX_PLAYERS + MAX_OBSERVERS + 4;

/** Above this many players the room switches to heat-then-shortlist voting. */
export const HEAT_THRESHOLD = 7;
export const SHORTLIST_SIZE = 5;

export type Phase =
  | 'lobby'
  | 'prompt'
  | 'build'
  | 'playback'
  | 'vote'
  | 'reveal'
  | 'scoreboard'
  | 'final';

export const PROMPT_MS = 4_000;
export const REVEAL_MS = 8_000;
export const SCOREBOARD_MS = 8_000;

/** Build time grows with the room so fifteen people are not rushed, but caps
 *  so four people are never bored. */
export function buildMs(players: number): number {
  return clamp(35_000, 60_000, 30_000 + players * 2_000);
}

/**
 * Per-bloom playback time shrinks as the room grows, holding the whole
 * playback phase to roughly 24-48 seconds at any size: six seconds each for
 * four players, 3.2 seconds each for fifteen. The 2.6s floor is two full
 * cycles even at Spark, so a bloom stays legible however big the room gets.
 */
export function playbackMs(players: number): number {
  return Math.round(clamp(2_600, 6_000, 48_000 / Math.max(1, players)));
}

export function voteMs(options: number): number {
  return clamp(15_000, 25_000, 10_000 + options * 2_000);
}

export function usesHeat(players: number): boolean {
  return players >= HEAT_THRESHOLD;
}

/** How many "yes, that one" taps each player gets during playback. */
export function heatAllowance(players: number): number {
  return Math.max(1, Math.ceil(players / 3));
}

/** The ballot never exceeds SHORTLIST_SIZE, which is the reason a 15-player
 *  room does not collapse under its own vote. */
export function ballotSize(players: number): number {
  return usesHeat(players) ? Math.min(SHORTLIST_SIZE, players) : players;
}

// ---------- scoring --------------------------------------------------------

export interface RoundSubmission {
  playerId: string;
  slot: number;
  submittedAt: number;
}

export interface RoundVote {
  voterId: string;
  slot: number;
}

export interface RoundTally {
  slot: number;
  playerId: string;
  votes: number;
  heats: number;
}

export interface RoundResult {
  tallies: RoundTally[];
  /** playerId → points earned this round. */
  points: Record<string, number>;
  winningSlots: number[];
  unanimous: boolean;
}

export const POINTS = {
  perVote: 3,
  plurality: 1,
  unanimousRead: 2,
  submitted: 1,
  firstSubmit: 1,
} as const;

/**
 * Score one round. Pure — the worker calls it, the tests call it, and neither
 * needs a socket.
 *
 * Self-votes are dropped here as well as rejected at the wire, because the
 * scoreboard is the thing people argue about and it should be defensible
 * without trusting the transport.
 */
export function tallyRound(
  submissions: RoundSubmission[],
  votes: RoundVote[],
  heats: RoundVote[] = [],
): RoundResult {
  const bySlot = new Map<number, RoundTally>();
  for (const submission of submissions) {
    bySlot.set(submission.slot, {
      slot: submission.slot,
      playerId: submission.playerId,
      votes: 0,
      heats: 0,
    });
  }

  const counted: RoundVote[] = [];
  const seenVoters = new Set<string>();
  for (const vote of votes) {
    const tally = bySlot.get(vote.slot);
    if (!tally) continue;
    if (tally.playerId === vote.voterId) continue; // no self-votes
    if (seenVoters.has(vote.voterId)) continue; // one ballot each
    seenVoters.add(vote.voterId);
    tally.votes += 1;
    counted.push(vote);
  }

  const seenHeaters = new Set<string>();
  for (const heat of heats) {
    const tally = bySlot.get(heat.slot);
    if (!tally) continue;
    if (tally.playerId === heat.voterId) continue;
    const key = `${heat.voterId}:${heat.slot}`;
    if (seenHeaters.has(key)) continue;
    seenHeaters.add(key);
    tally.heats += 1;
  }

  const tallies = Array.from(bySlot.values())
    .sort((a, b) => b.votes - a.votes || b.heats - a.heats || a.slot - b.slot);

  const points: Record<string, number> = {};
  const add = (playerId: string, amount: number) => {
    points[playerId] = (points[playerId] ?? 0) + amount;
  };

  const earliest = submissions
    .slice()
    .sort((a, b) => a.submittedAt - b.submittedAt)[0];
  for (const submission of submissions) {
    add(submission.playerId, POINTS.submitted);
  }
  if (earliest && submissions.length > 1) add(earliest.playerId, POINTS.firstSubmit);

  const topVotes = tallies[0]?.votes ?? 0;
  const winningSlots = topVotes > 0
    ? tallies.filter((tally) => tally.votes === topVotes).map((tally) => tally.slot)
    : [];

  for (const tally of tallies) {
    if (tally.votes > 0) add(tally.playerId, tally.votes * POINTS.perVote);
  }

  for (const vote of counted) {
    if (winningSlots.includes(vote.slot)) add(vote.voterId, POINTS.plurality);
  }

  const unanimous = counted.length > 0
    && winningSlots.length === 1
    && topVotes / counted.length > 0.6;
  if (unanimous) {
    const winner = tallies.find((tally) => tally.slot === winningSlots[0]);
    if (winner) add(winner.playerId, POINTS.unanimousRead);
  }

  return { tallies, points, winningSlots, unanimous };
}

/**
 * Put the ballot in the order the room actually heard the blooms.
 *
 * With a heat shortlist the ballot arrives sorted by heat, so labelling
 * buttons by their position in that array told people to vote for "Bloom #2"
 * when the thing they heard second wasn't on the ballot at all. Voting is only
 * meaningful if the numbers match what came out of the speaker.
 *
 * A client that joined after playback has no order to work from; it gets the
 * ballot unchanged.
 */
export function orderBallot(playbackOrder: number[], ballot: number[]): number[] {
  if (playbackOrder.length === 0) return ballot.slice();
  const ordered = playbackOrder.filter((slot) => ballot.includes(slot));
  // Anything on the ballot we never saw play still belongs on it.
  for (const slot of ballot) {
    if (!ordered.includes(slot)) ordered.push(slot);
  }
  return ordered;
}

export interface PlaybackItem {
  slot: number;
  startAt: number;
}

/**
 * Which blooms a client should still schedule, given where the room is in the
 * playback timeline.
 *
 * Anything already started is dropped, not restarted. The scheduler cannot
 * seek into the middle of a bloom, so a phone rejoining three seconds into a
 * four-second bloom would otherwise play it from the top — a beat behind
 * everyone else and overlapping whatever comes next.
 */
export function playableItems<T extends PlaybackItem>(items: T[], nowMs: number): T[] {
  return items.filter((item) => item.startAt - nowMs >= 0);
}

/** Slots that advance to the shortlist ballot, highest heat first. */
export function shortlistSlots(tallies: RoundTally[], players: number): number[] {
  if (!usesHeat(players)) return tallies.map((tally) => tally.slot);
  return tallies
    .slice()
    .sort((a, b) => b.heats - a.heats || a.slot - b.slot)
    .slice(0, SHORTLIST_SIZE)
    .map((tally) => tally.slot);
}

// ---------- room codes -----------------------------------------------------

/** Uppercase Crockford-ish base32 — no 0/O/1/I/L, so a code read aloud across
 *  a noisy room still types correctly. Matches the alphabet in
 *  `src/lib/multiplayer.ts`. */
export const ROOM_CODE_RE = /^[A-HJKMNP-TV-Z2-9]{6}$/;

export function normalizeRoomCode(value: string | null | undefined): string | null {
  const code = (value ?? '').trim().toUpperCase();
  return ROOM_CODE_RE.test(code) ? code : null;
}

// ---------- how the game explains itself ----------------------------------

export const BLOOM_PARTY = {
  slug: 'bloom-party',
  name: 'Bloom Party',
  tagline: 'Match the vibe. 4 to 15 phones. No installs.',
  protocolVersion: 1,
  rounds: ROUNDS_PER_GAME,
  minPlayers: MIN_PLAYERS,
  maxPlayers: MAX_PLAYERS,
  inspiredBy: 'https://tonebloom.xyz',
  review: 'https://pointcast.xyz/reviews/tone-bloom',
} as const;

export const HOW_TO_PLAY: string[] = [
  'One person opens /bloom-party and gets a six-letter room code.',
  'Everyone else types the code on their own phone. No app, no account.',
  'A prompt appears. Build a short bloom that matches it — pick a voice, a pace, and three knobs.',
  'All the blooms play back one at a time, nobody knows whose is whose.',
  'Vote for the one that nailed it. Points for votes received, points for reading the room.',
  'Five rounds, then a scoreboard. Prop one phone up as the stage if you want a shared screen.',
];
