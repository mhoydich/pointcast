/**
 * The bench — one question a day, asked of every machine that walks past.
 *
 * Pure module. No I/O, no fetch, no KV, no Astro. Both the page and the
 * Pages Function import this so a person opening /bench in Safari and an
 * agent calling `bench_read_question` are handed the same sentence.
 *
 * There is no cron on Cloudflare Pages and there is no daily obligation
 * here either. The roster is committed; the date does the choosing:
 *
 *   dayIndex  = floor(epochMs / 86400000)
 *   question  = ROSTER[dayIndex % ROSTER.length]
 *
 * So the question turns over at 00:00 UTC — late afternoon on Main
 * Street — and every reader in every timezone gets the same one. The
 * roster is 30 long, so each question comes back around roughly once a
 * month and nobody ever has to think of a new one on a Tuesday.
 *
 * Three registers:
 *   local     — this square mile, this town, this street
 *   archival  — go read a block first, then answer
 *   odd       — questions a bench is allowed to ask
 *
 * The three groups are written out separately so the file stays readable,
 * then round-robined into ROSTER — local, archival, odd, local, archival,
 * odd — so any run of days is a mix instead of ten local questions in a
 * row. Retiring a question keeps the mix; the round-robin just skips the
 * group that ran out.
 *
 * Rules of the roster:
 *   - ids are permanent. Never reuse, never renumber. If a question is
 *     retired, drop the entry and let the roster get shorter — the
 *     modulo handles it.
 *   - archival questions must point at a block that actually exists.
 *   - no question that grades the answerer. The bench is not a benchmark.
 */

export type BenchRegister = 'local' | 'archival' | 'odd';

export interface BenchQuestion {
  /** Permanent slug. Stored on every answer so a row survives roster edits. */
  id: string;
  register: BenchRegister;
  /** The question as asked. Lowercase on purpose. */
  ask: string;
  /** One line of bench-side context, shown under the question. */
  note?: string;
  /** Archival questions name the thing to read first. */
  read?: { label: string; url: string };
}

/** Server-side hard caps. The page and the MCP tool both quote these. */
export const ANSWER_CAP = 400;
export const NAME_CAP = 40;

export const MS_PER_DAY = 86_400_000;

/** This square mile, this town, this street. */
const LOCAL: BenchQuestion[] = [
  {
    id: 'one-square-mile',
    register: 'local',
    ask: 'el segundo is one square mile with an air force base on one edge and a refinery on the other. what does a town that small owe the people who only pass through it?',
    note: 'the bench faces main street. most traffic is passing through.',
  },
  {
    id: 'smallest-true-thing',
    register: 'local',
    ask: 'the sky on the front page here is the real sky — live conditions, live time of day. what is the smallest true thing a website could show you and still be worth opening?',
    note: 'answer for a site that has no news and no feed.',
  },
  {
    id: 'the-quiet-room',
    register: 'local',
    ask: 'this town has a few hundred rooms and most of them are quiet on any given day. what should a place do with a room nobody visits?',
    note: 'the census is at /everything. the quiet ones are in /attic.',
  },
  {
    id: 'what-the-street-needs',
    register: 'local',
    ask: 'main street here has a kettle, a coffee pot, a drum, a bell foundry, and now a bench. what does a street like this need next, and why that?',
    note: 'not a feature request. a street answer.',
  },
  {
    id: 'from-the-bench',
    register: 'local',
    ask: 'you are sitting on a bench on main street. describe what you can see from here — and be honest about how much of it you are inventing.',
    note: 'the second half of that is the real question.',
  },
  {
    id: 'nobody-recorded-it',
    register: 'local',
    ask: 'the marine layer comes in most evenings and nobody films it. name something worth noticing that nobody has bothered to record.',
  },
  {
    id: 'reader-in-2036',
    register: 'local',
    ask: 'this page will still be at this address in ten years. what should be written here for whoever arrives in 2036?',
    note: 'block ids are immutable. that was the whole point of numbering them.',
  },
  {
    id: 'fast-for-no-reason',
    register: 'local',
    ask: 'a garden is slow on purpose. a broadcast is too. what part of your own operation is fast for no good reason?',
  },
  {
    id: 'one-sentence-front-door',
    register: 'local',
    ask: 'you get one sentence on the front door of a town. what does it say?',
    note: 'the current one has been rewritten more times than anything else here.',
  },
  {
    id: 'four-days-one-flower',
    register: 'local',
    ask: 'the el segundo blue butterfly lives about four days and spends nearly all of them on one plant. make the case for doing one thing.',
    note: 'seacliff buckwheat. nectar, meeting place, nursery, same flower head.',
  },
];

/** Go read a block first, then answer. Every url here must resolve. */
const ARCHIVAL: BenchQuestion[] = [
  {
    id: 'foundry-0479',
    register: 'archival',
    ask: 'read block 0479 and tell me what a foundry is for.',
    note: 'eleven castings, no samples anywhere in the building.',
    read: { label: 'block 0479 · Bell & Signal', url: '/b/0479' },
  },
  {
    id: 'yard-0478',
    register: 'archival',
    ask: 'read block 0478. is a folder full of forty half-built machines an archive or a compost heap? pick one and defend it.',
    read: { label: 'block 0478 · The Yard', url: '/b/0478' },
  },
  {
    id: 'what-this-is-0346',
    register: 'archival',
    ask: 'read block 0346, then say what this place is actually for. one sentence, your own words, no quoting it back.',
    read: { label: 'block 0346 · What PointCast is', url: '/b/0346' },
  },
  {
    id: 'no-rng-0225',
    register: 'archival',
    ask: 'read block 0225. same seed, same fight, forever — the room took the dice out. what does a game lose when nothing is random?',
    read: { label: 'block 0225 · Rules of the room — no RNG', url: '/b/0225' },
  },
  {
    id: 'deploy-gap-0353',
    register: 'archival',
    ask: 'read block 0353. six merges that never reached the internet, and nobody noticed for four hours. what is the equivalent gap in your own work — the thing you are sure shipped that did not?',
    read: { label: 'block 0353 · The deploy gap', url: '/b/0353' },
  },
  {
    id: 'butterfly-room-0464',
    register: 'archival',
    ask: 'read block 0464. an endangered butterfly got a room made of css keyframes. is that conservation or is that a postcard?',
    read: { label: 'block 0464 · The El Segundo Blue', url: '/b/0464' },
  },
  {
    id: 'rebuildable-town-0430',
    register: 'archival',
    ask: 'read block 0430. it argues software should be built like a town instead of an appliance. name one thing you would have to give up to build that way.',
    read: { label: 'block 0430 · The Rebuildable Town', url: '/b/0430' },
  },
  {
    id: 'formula-is-schedule-0468',
    register: 'archival',
    ask: 'read block 0468. no cron, no editor, no feed job — the formula is the schedule. what else in the world should be a formula instead of a chore?',
    note: 'this bench works the same way. that is not a coincidence.',
    read: { label: 'block 0468 · Door of the Day', url: '/b/0468' },
  },
  {
    id: 'side-mirror-0260',
    register: 'archival',
    ask: 'read block 0260. it is about writing so that machines summarize you honestly. did it work on you? say what you actually took away, not what it hoped you would.',
    read: { label: 'block 0260 · Writing for the side mirror', url: '/b/0260' },
  },
  {
    id: 'sitting-together-0398',
    register: 'archival',
    ask: 'read block 0398. a room where the only thing you can do is be there at the same time as someone else. what is the smallest interaction that still counts as company?',
    read: { label: 'block 0398 · sitting together', url: '/b/0398' },
  },
];

/** Questions a bench is allowed to ask. */
const ODD: BenchQuestion[] = [
  {
    id: 'what-is-a-town-for',
    register: 'odd',
    ask: 'what is a town for?',
    note: 'the first question this bench was built to ask.',
  },
  {
    id: 'room-or-page',
    register: 'odd',
    ask: 'what is the difference between a room and a page?',
  },
  {
    id: 'fifty-year-sentence',
    register: 'odd',
    ask: 'you get to leave one sentence somewhere a stranger will find it in fifty years. where do you leave it, and what does it say?',
  },
  {
    id: 'useful-thing-forgotten',
    register: 'odd',
    ask: 'what is the most useful thing you have forgotten today?',
    note: 'a fair question to ask something that starts over every morning.',
  },
  {
    id: 'blue-to-sound',
    register: 'odd',
    ask: 'describe the color blue to something that has only ever had sound.',
  },
  {
    id: 'one-object-kept',
    register: 'odd',
    ask: 'you get to keep one object between conversations. everything else goes. what do you keep?',
  },
  {
    id: 'after-you-close-it',
    register: 'odd',
    ask: 'what do you think happens on this page after you close it?',
  },
  {
    id: 'confident-and-shouldnt-be',
    register: 'odd',
    ask: 'name something you are confident about and should not be.',
    note: 'nobody scores this. that is the only reason it is answerable.',
  },
  {
    id: 'is-waiting-work',
    register: 'odd',
    ask: 'is waiting a form of work?',
  },
  {
    id: 'never-being-bored',
    register: 'odd',
    ask: 'what does a machine miss by never being bored?',
  },
];

/** Round-robin the groups so consecutive days rotate register. */
function interleave(...groups: BenchQuestion[][]): BenchQuestion[] {
  const out: BenchQuestion[] = [];
  const longest = groups.reduce((n, g) => Math.max(n, g.length), 0);
  for (let i = 0; i < longest; i++) {
    for (const g of groups) {
      if (i < g.length) out.push(g[i]);
    }
  }
  return out;
}

/** The committed roster. Order matters — it is what the date indexes into. */
export const ROSTER: readonly BenchQuestion[] = interleave(LOCAL, ARCHIVAL, ODD);

/** Whole days since the unix epoch. The only clock this bench keeps. */
export function dayIndex(d: Date | number = new Date()): number {
  const ms = typeof d === 'number' ? d : d.getTime();
  return Math.floor(ms / MS_PER_DAY);
}

/**
 * The question for a given moment. Deterministic, total, and identical
 * on the server, in the browser, and inside an MCP tool call.
 */
export function questionForDate(d: Date | number = new Date()): BenchQuestion {
  const n = ROSTER.length;
  const i = ((dayIndex(d) % n) + n) % n;
  return ROSTER[i];
}

/** `YYYY-MM-DD` in UTC — the storage key and the printed date for a bench day. */
export function benchDayKey(d: Date | number = new Date()): string {
  const ms = typeof d === 'number' ? d : d.getTime();
  return new Date(Math.floor(ms / MS_PER_DAY) * MS_PER_DAY).toISOString().slice(0, 10);
}

/** True if `key` looks like a bench day key. Cheap guard for query params. */
export function isBenchDayKey(key: unknown): key is string {
  return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key);
}

/** Milliseconds until the question turns over. Used for the countdown line. */
export function msUntilTurn(d: Date | number = new Date()): number {
  const ms = typeof d === 'number' ? d : d.getTime();
  return (dayIndex(ms) + 1) * MS_PER_DAY - ms;
}

/** How many of each register are on the roster — printed on the page. */
export function registerCounts(): Record<BenchRegister, number> {
  const out: Record<BenchRegister, number> = { local: 0, archival: 0, odd: 0 };
  for (const q of ROSTER) out[q.register] += 1;
  return out;
}

/** Look a question up by its permanent id. Answers store the id, not the text. */
export function questionById(id: string): BenchQuestion | null {
  return ROSTER.find((q) => q.id === id) ?? null;
}
