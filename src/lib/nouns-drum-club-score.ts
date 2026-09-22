import { PAD_DEFINITIONS } from "./nouns-drum-club-audio.ts";

export const SCORE_STEPS = 16;
export const STEPS = SCORE_STEPS;
export const TEMPO_MIN = 60;
export const TEMPO_MAX = 180;
export const MAX_SCORE_LANES = 36;
export const MAX_ENCODED_SCORE_LENGTH = 12_000;

export type ScoreLane = { padId: string; steps: number[] };
export type DrumScore = {
  version: 1;
  name: string;
  tempo: number;
  swing: number;
  lanes: ScoreLane[];
};

export type ScheduledStep = { step: number; when: number; duration: number };
export type ScheduledHit = {
  padId: string;
  velocity: number;
  step: number;
  when: number;
};

const padIds = new Set(PAD_DEFINITIONS.map((pad) => pad.id));
const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));
const finite = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const cleanName = (value: unknown) =>
  typeof value === "string"
    ? value
        .replace(/[\u0000-\u001f\u007f]/g, "")
        .trim()
        .slice(0, 60) || "My beat"
    : "My beat";
const emptySteps = () => Array.from({ length: SCORE_STEPS }, () => 0);

export function normalizeScore(
  value: unknown,
  fallback?: DrumScore,
): DrumScore {
  const base = fallback ?? {
    version: 1 as const,
    name: "My beat",
    tempo: 108,
    swing: 0,
    lanes: [],
  };
  if (!value || typeof value !== "object" || Array.isArray(value))
    return structuredCloneScore(base);
  const source = value as Record<string, unknown>;
  const lanes: ScoreLane[] = [];
  const seen = new Set<string>();
  if (Array.isArray(source.lanes)) {
    for (const raw of source.lanes.slice(0, MAX_SCORE_LANES)) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const lane = raw as Record<string, unknown>;
      if (
        typeof lane.padId !== "string" ||
        !padIds.has(lane.padId) ||
        seen.has(lane.padId)
      )
        continue;
      seen.add(lane.padId);
      const sourceSteps = Array.isArray(lane.steps) ? lane.steps : [];
      lanes.push({
        padId: lane.padId,
        steps: Array.from({ length: SCORE_STEPS }, (_, index) =>
          clamp(finite(sourceSteps[index], 0), 0, 1),
        ),
      });
    }
  }
  return {
    version: 1,
    name: cleanName(source.name ?? base.name),
    tempo: Math.round(
      clamp(finite(source.tempo, base.tempo), TEMPO_MIN, TEMPO_MAX),
    ),
    swing: clamp(finite(source.swing, base.swing), 0, 0.5),
    lanes,
  };
}

export function createScore(initial: Partial<DrumScore> = {}): DrumScore {
  return normalizeScore({
    version: 1,
    name: "My beat",
    tempo: 108,
    swing: 0,
    lanes: [],
    ...initial,
  });
}

export function structuredCloneScore(score: DrumScore): DrumScore {
  return {
    ...score,
    lanes: score.lanes.map((lane) => ({
      padId: lane.padId,
      steps: [...lane.steps],
    })),
  };
}

export function setStep(
  score: DrumScore,
  padId: string,
  step: number,
  velocity: number,
): DrumScore {
  const next = normalizeScore(score);
  if (
    !padIds.has(padId) ||
    !Number.isInteger(step) ||
    step < 0 ||
    step >= SCORE_STEPS
  )
    return next;
  let lane = next.lanes.find((item) => item.padId === padId);
  if (!lane) {
    if (next.lanes.length >= MAX_SCORE_LANES) return next;
    lane = { padId, steps: emptySteps() };
    next.lanes.push(lane);
  }
  lane.steps[step] = clamp(finite(velocity, 0), 0, 1);
  if (lane.steps.every((value) => value === 0))
    next.lanes = next.lanes.filter((item) => item !== lane);
  return next;
}

export function toggleStep(
  score: DrumScore,
  padId: string,
  step: number,
  velocity = 0.85,
): DrumScore {
  const current =
    score.lanes.find((lane) => lane.padId === padId)?.steps[step] ?? 0;
  return setStep(score, padId, step, current > 0 ? 0 : velocity);
}

/** Duration of one sixteenth note. */
export function stepDuration(tempo: number): number {
  return 60 / clamp(finite(tempo, 108), TEMPO_MIN, TEMPO_MAX) / 4;
}

/** Absolute time of a step. Swing delays odd sixteenth notes without moving the bar line. */
export function stepTime(
  startTime: number,
  absoluteStep: number,
  tempo: number,
  swing = 0,
): number {
  const duration = stepDuration(tempo);
  const safeStep = Math.max(0, Math.floor(finite(absoluteStep, 0)));
  return (
    finite(startTime, 0) +
    safeStep * duration +
    (safeStep % 2 ? duration * clamp(finite(swing, 0), 0, 0.5) : 0)
  );
}

/** Returns all sequencer ticks in [fromTime, toTime), ready for look-ahead scheduling. */
export function scheduleWindow(
  startTime: number,
  fromTime: number,
  toTime: number,
  tempo: number,
  swing = 0,
): ScheduledStep[] {
  const duration = stepDuration(tempo);
  if (
    ![startTime, fromTime, toTime].every(Number.isFinite) ||
    toTime <= fromTime
  )
    return [];
  const first = Math.max(0, Math.floor((fromTime - startTime) / duration) - 1);
  const last = Math.min(
    first + 1024,
    Math.ceil((toTime - startTime) / duration) + 1,
  );
  const ticks: ScheduledStep[] = [];
  for (let absolute = first; absolute <= last; absolute++) {
    const when = stepTime(startTime, absolute, tempo, swing);
    if (when >= fromTime && when < toTime)
      ticks.push({ step: absolute % SCORE_STEPS, when, duration });
  }
  return ticks;
}

const pulse = (indices: number[], velocity = 0.82) => {
  const steps = emptySteps();
  for (const index of indices) steps[index] = velocity;
  return steps;
};

export const SCORE_PRESETS: Readonly<Record<string, DrumScore>> = Object.freeze(
  {
    clubhouse: createScore({
      name: "Clubhouse Bounce",
      tempo: 108,
      swing: 0.12,
      lanes: [
        { padId: "kick", steps: pulse([0, 6, 8, 11]) },
        { padId: "clap", steps: pulse([4, 12], 0.9) },
        {
          padId: "hat-closed",
          steps: pulse([0, 2, 4, 6, 8, 10, 12, 14], 0.52),
        },
        { padId: "bass-c", steps: pulse([0, 7, 10], 0.72) },
        { padId: "mallet-g", steps: pulse([3, 11], 0.58) },
      ],
    }),
    parade: createScore({
      name: "Noun Parade",
      tempo: 124,
      swing: 0.04,
      lanes: [
        { padId: "kick", steps: pulse([0, 4, 8, 12], 0.9) },
        { padId: "snare", steps: pulse([4, 12], 0.84) },
        { padId: "tambourine", steps: pulse([2, 6, 10, 14], 0.42) },
        { padId: "chord-c", steps: pulse([0, 8], 0.58) },
        { padId: "chord-f", steps: pulse([4], 0.58) },
        { padId: "chord-g", steps: pulse([12], 0.58) },
      ],
    }),
    moonwalk: createScore({
      name: "Moonwalk",
      tempo: 92,
      swing: 0.2,
      lanes: [
        { padId: "kick", steps: pulse([0, 7, 10], 0.72) },
        { padId: "rim", steps: pulse([4, 12], 0.68) },
        { padId: "shaker", steps: pulse([1, 3, 5, 7, 9, 11, 13, 15], 0.36) },
        { padId: "bass-a", steps: pulse([0, 6, 10], 0.68) },
        { padId: "sparkle", steps: pulse([14], 0.46) },
      ],
    }),
  },
);

export const SCORE_PRESET_OPTIONS = Object.freeze(
  Object.entries(SCORE_PRESETS).map(([id, score]) =>
    Object.freeze({ id, name: score.name }),
  ),
);

/** Expands sequencer ticks into playable pad hits for a scheduler look-ahead window. */
export function scheduleScore(
  score: DrumScore,
  ticks: readonly ScheduledStep[],
): ScheduledHit[] {
  const normalized = normalizeScore(score);
  const hits: ScheduledHit[] = [];
  for (const tick of ticks) {
    if (
      !Number.isInteger(tick.step) ||
      tick.step < 0 ||
      tick.step >= SCORE_STEPS ||
      !Number.isFinite(tick.when)
    )
      continue;
    const step = tick.step;
    for (const lane of normalized.lanes) {
      const velocity = lane.steps[step];
      if (velocity > 0)
        hits.push({ padId: lane.padId, velocity, step, when: tick.when });
    }
  }
  return hits;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value))
    throw new Error("Invalid score encoding");
  const padded =
    value.replace(/-/g, "+").replace(/_/g, "/") +
    "=".repeat((4 - (value.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

export function encodeScore(score: DrumScore): string {
  const normalized = normalizeScore(score);
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(normalized)));
}

export function decodeScore(
  encoded: unknown,
  fallback: DrumScore = SCORE_PRESETS.clubhouse,
): DrumScore {
  const safeFallback = normalizeScore(fallback);
  if (
    typeof encoded !== "string" ||
    encoded.length === 0 ||
    encoded.length > MAX_ENCODED_SCORE_LENGTH
  )
    return safeFallback;
  try {
    const bytes = base64UrlToBytes(encoded);
    if (bytes.byteLength > 9_000) return safeFallback;
    const parsed: unknown = JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(bytes),
    );
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      (parsed as { version?: unknown }).version !== 1
    )
      return safeFallback;
    return normalizeScore(parsed, safeFallback);
  } catch {
    return safeFallback;
  }
}

export function scoreFromSearch(
  search: string | URLSearchParams,
  fallback?: DrumScore,
): DrumScore {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;
  return decodeScore(params.get("beat"), fallback);
}

export function scoreToSearch(score: DrumScore): string {
  const params = new URLSearchParams();
  params.set("beat", encodeScore(score));
  return `?${params.toString()}`;
}
