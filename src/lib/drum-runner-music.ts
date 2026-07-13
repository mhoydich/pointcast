export type TimingGrade = 'perfect' | 'good' | 'offgrid';

export const PERFECT_WINDOW_MS = 65;
export const GOOD_WINDOW_MS = 145;
export const JUMP_BEATS = 2;
export const JUMP_APEX_PX = 112;

export function beatDeltaMs(deltaBeats: number, bpm: number): number {
  return Math.abs(deltaBeats) * 60_000 / bpm;
}

export function gradeBeatDelta(deltaBeats: number, bpm: number): TimingGrade {
  const milliseconds = beatDeltaMs(deltaBeats, bpm);
  if (milliseconds <= PERFECT_WINDOW_MS + 1e-6) return 'perfect';
  if (milliseconds <= GOOD_WINDOW_MS + 1e-6) return 'good';
  return 'offgrid';
}

export function jumpHeightAtBeat(currentBeat: number, jumpStartBeat: number, apex = JUMP_APEX_PX): number {
  const progress = (currentBeat - jumpStartBeat) / JUMP_BEATS;
  if (progress <= 0 || progress >= 1) return 0;
  return 4 * apex * progress * (1 - progress);
}

export function accuracyPercent(perfect: number, good: number, total: number): number {
  if (!Number.isFinite(perfect) || !Number.isFinite(good) || !Number.isFinite(total) || total <= 0) return 0;
  const percentage = Math.round(((Math.max(0, perfect) + Math.max(0, good) * 0.6) / total) * 100);
  return Math.max(0, Math.min(100, percentage));
}

export function phraseStep(beat: number, phraseBeats = 16, subdivision = 2): number {
  const steps = phraseBeats * subdivision;
  return ((Math.round(beat * subdivision) % steps) + steps) % steps;
}

export function jumpClearsObstacle(
  bpm: number,
  obstacleHeight: number,
  obstacleWidth: number,
  runnerWidth = 50,
  beatPixels = 150,
): boolean {
  const halfCollisionBeats = ((runnerWidth + obstacleWidth) / 2) / beatPixels;
  const windowBeats = GOOD_WINDOW_MS * bpm / 60_000;
  const earliest = 1 - halfCollisionBeats - windowBeats;
  const latest = 1 + halfCollisionBeats + windowBeats;
  return jumpHeightAtBeat(earliest, 0) >= obstacleHeight - 5
    && jumpHeightAtBeat(latest, 0) >= obstacleHeight - 5;
}
