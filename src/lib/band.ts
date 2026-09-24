/**
 * The Band — shared shortwave dial for /band.
 *
 * Pure helpers only (no DOM, no audio) so the page script and the tests read
 * the same rules. Transport is the already-deployed DrumRoomV2 Durable Object:
 * a tuning rides in a legacy `hit` frame, and the frequency step rides in
 * `seq` (seq = counter * 512 + step), the same trick /bell-choir uses for pitch.
 *
 *   kick  = I tuned here          (sent while dragging, throttled)
 *   hat   = I am still here       (heartbeat, so newcomers learn positions)
 *   bell  = I found today's fox   (seq step = where it was heard)
 */

export const BAND = {
  room: 'shortwave-band',
  minMhz: 3,
  maxMhz: 12,
  stepMhz: 0.025,
  steps: 360,
  /** Steps either side of a listener that count as "next to" them. */
  nearSteps: 10,
  /** Steps either side of the fox where its signal can be heard at all. */
  hearSteps: 40,
} as const;

export type BandPad = 'kick' | 'hat' | 'bell';

export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0;
  return Math.max(0, Math.min(BAND.steps, Math.round(step)));
}

export function stepToMhz(step: number): number {
  return Math.round((BAND.minMhz + clampStep(step) * BAND.stepMhz) * 1000) / 1000;
}

export function mhzToStep(mhz: number): number {
  return clampStep((mhz - BAND.minMhz) / BAND.stepMhz);
}

export function formatMhz(step: number): string {
  return stepToMhz(step).toFixed(3);
}

/** Parse `?f=6.275` into a step, or null when absent or off the band. */
export function parseFreq(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const mhz = Number.parseFloat(raw);
  if (!Number.isFinite(mhz) || mhz < BAND.minMhz || mhz > BAND.maxMhz) return null;
  return mhzToStep(mhz);
}

const SEQ_COUNTER_MAX = 1_900_000; // 1_900_000 * 512 + 360 < 1_000_000_000 (the DO's ceiling)

export function packSeq(counter: number, step: number): number {
  const c = Math.abs(Math.trunc(counter)) % SEQ_COUNTER_MAX;
  return c * 512 + clampStep(step);
}

export function unpackStep(seq: number): number {
  return clampStep(seq % 512);
}

/** FNV-1a, 32-bit. Stable across browsers and Node. */
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** The day in El Segundo, YYYY-MM-DD. The fox moves at local midnight. */
export function townDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * What the fox keys. Short, all Morse-safe, and never a claim about the real
 * world: these are greetings, not news.
 */
export const FOX_MESSAGES = [
  '73 FROM EL SEGUNDO',
  'THE FOG SAYS HELLO',
  'BRING A FRIEND TOMORROW',
  'YOU ARE NOT ALONE OUT HERE',
  'MEET YOU AT THE PIER',
  'KEEP THE PORCH LIGHT ON',
  'LOW TIDE HIGH SPIRITS',
  'THE TOWN IS LISTENING',
  'TUNE IN TURN AROUND',
  'SAY HI TO WHOEVER IS NEAR',
  'GOOD SIGNAL GOOD PEOPLE',
  'THE MARINE LAYER REMEMBERS',
  'EVERY DIAL LEADS HOME',
  'COFFEE ON THE HOUSE',
  'WAVE AT THE NEXT NOUN',
  'CQ CQ ANYONE OUT THERE',
  'STATIC IS JUST COMPANY',
  'SEE YOU AT THE DRUM',
  'THE ANTENNA HUMS FOR YOU',
  'NIGHT SHIFT SAYS HELLO',
  'SLOW DOWN LOOK UP',
  'THE BAND PLAYS ON',
  'SIGNAL FOUND FRIEND FOUND',
  'LEAVE THE LIGHT ON',
] as const;

export type Fox = { date: string; step: number; mhz: string; message: string };

/** Today's fox: same place and message for everyone, from the date alone. */
export function foxOf(date: string): Fox {
  const h = hash32(`pointcast-band-fox:${date}`);
  const margin = 24; // never parked hard against either end of the dial
  const step = margin + (h % (BAND.steps - margin * 2 + 1));
  const message = FOX_MESSAGES[hash32(`msg:${date}`) % FOX_MESSAGES.length];
  return { date, step, mhz: formatMhz(step), message };
}

/** 0 at the edge of hearing, 1 dead on. */
export function proximity(distanceSteps: number, radius: number = BAND.hearSteps): number {
  const d = Math.abs(distanceSteps);
  if (d >= radius) return 0;
  return 1 - d / radius;
}

/**
 * How clearly you can copy the fox. Alone you only get a clean copy when you
 * are right on it; every other listener parked near the fox lifts the whole
 * curve. That is the co-op: company clears static.
 */
export function clarity(distanceSteps: number, helpers: number): number {
  const p = proximity(distanceSteps, 16);
  const lift = 0.55 + 0.25 * Math.max(0, Math.min(4, helpers));
  return Math.max(0, Math.min(1, p * p * lift));
}

/** Clarity needed before characters start to land on the tape. */
export const COPY_THRESHOLD = 0.5;
/** Characters copied per second at clarity 1. */
export const COPY_RATE = 1.4;

/** Advance the decode tape. Returns characters revealed (fractional). */
export function advanceCopy(revealed: number, clarityNow: number, dtSeconds: number, length: number): number {
  if (clarityNow < COPY_THRESHOLD) return revealed;
  const next = revealed + clarityNow * COPY_RATE * Math.max(0, Math.min(1, dtSeconds));
  return Math.min(length, next);
}

/** A call sign for a room client id: PC4-QRX. Stable for the session. */
export function callSign(clientId: string): string {
  const h = hash32(clientId || 'visitor');
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const a = letters[h % 24];
  const b = letters[Math.floor(h / 24) % 24];
  const c = letters[Math.floor(h / 576) % 24];
  const digit = Math.floor(h / 13_824) % 10;
  return `PC${digit}-${a}${b}${c}`;
}

export const MORSE: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
};

/**
 * Key-down spans in Morse units for a message: [[start, length], ...] plus the
 * total length. Dot 1, dash 3, gap 1 inside a letter, 3 between letters,
 * 7 between words.
 */
export function morseSchedule(text: string): { marks: [number, number][]; units: number } {
  const marks: [number, number][] = [];
  let t = 0;
  const words = text.toUpperCase().split(/\s+/).filter(Boolean);
  words.forEach((word, wi) => {
    const chars = [...word].filter((ch) => MORSE[ch]);
    chars.forEach((ch, ci) => {
      const code = MORSE[ch];
      [...code].forEach((sym, si) => {
        const len = sym === '-' ? 3 : 1;
        marks.push([t, len]);
        t += len;
        if (si < code.length - 1) t += 1;
      });
      if (ci < chars.length - 1) t += 3;
    });
    if (wi < words.length - 1) t += 7;
  });
  return { marks, units: t };
}

export function toMorse(text: string): string {
  return text
    .toUpperCase()
    .split(/\s+/)
    .map((w) => [...w].map((ch) => MORSE[ch] || '').filter(Boolean).join(' '))
    .join(' / ');
}

// ---------- v2: seasons, the Nightly Net, keepsakes ----------

/** Season One starts the day The Band went on the air. Fox No. 001 was that day's fox. */
export const SEASON = { name: 'Season One', start: '2026-09-24' } as const;

/** Whole days between two YYYY-MM-DD dates (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

/** Fox No. for a date: 1 on launch day. */
export function foxNumber(date: string): number {
  return Math.max(1, daysBetween(SEASON.start, date) + 1);
}

export const pad3 = (n: number) => String(n).padStart(3, '0');

/**
 * The Nightly Net: every night at 9:00 PM in El Segundo, twenty minutes on
 * 7.200 MHz. Net control calls out the fox's frequency, so the whole band
 * converges and copies it together.
 */
export const NET = { step: 168, startMinute: 21 * 60, minutes: 20 } as const;

function townMinute(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value || 0) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  return h * 60 + m;
}

export function netState(now: Date = new Date()): { live: boolean; minutesUntil: number; minutesLeft: number } {
  const m = townMinute(now);
  const since = m - NET.startMinute;
  if (since >= 0 && since < NET.minutes) return { live: true, minutesUntil: 0, minutesLeft: NET.minutes - since };
  return { live: false, minutesUntil: (NET.startMinute - m + 1440) % 1440, minutesLeft: 0 };
}

export function formatWait(minutes: number): string {
  if (minutes < 1) return 'now';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} min`;
}

/** A calendar invite for the Net, every night. */
export function netIcs(): string {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//PointCast//The Band//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', 'UID:nightly-net@pointcast.xyz', 'DTSTAMP:20260924T220000Z',
    'DTSTART;TZID=America/Los_Angeles:20260924T210000', 'DURATION:PT20M', 'RRULE:FREQ=DAILY',
    'SUMMARY:The Nightly Net · The Band', 'LOCATION:https://pointcast.xyz/band?f=7.200',
    'DESCRIPTION:Tune to 7.200 MHz. Net control calls the fox and everyone copies it together.',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}

/**
 * Stamps 1–9 rotate by date; stamp 10 is the gold edition, for a card copied
 * during the Net or with four or more other listeners on it.
 */
export const GOLD_STAMP = 10;
export function stampFor(date: string, gold = false): number {
  return gold ? GOLD_STAMP : 1 + (hash32(`stamp:${date}`) % 9);
}
export function isGold(withCount: number, duringNet: boolean): boolean {
  return duringNet || withCount >= 4;
}

/** Listener signals are quieter than the fox but copyable alone: within two steps. */
export function signalClarity(distanceSteps: number): number {
  const d = Math.abs(distanceSteps);
  return d > 3 ? 0 : 1 - d / 4;
}

/** The permanent record cast on the Shortwave tower. Plain, short, human. */
export function towerLine(card: { kind: string; date: string; mhz: string; message: string; call: string; with: { call: string }[]; note?: string }): string {
  const who = card.with.length ? ` with ${card.with.slice(0, 6).map((w) => w.call).join(' ')}` : '';
  const label = card.kind === 'net' ? 'NET CHECK-IN' : card.kind === 'signal' ? 'SIGNAL QSL' : `FOX NO. ${pad3(foxNumber(card.date))}`;
  const note = card.note ? ` · "${card.note.slice(0, 60)}"` : '';
  return `QSL · The Band · ${label} · ${card.date} · ${card.mhz} MHz · ${card.message} · ${card.call}${who}${note} · pointcast.xyz/band`.slice(0, 280);
}
