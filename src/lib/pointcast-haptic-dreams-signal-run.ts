import type { HapticDreamsPlay } from './pointcast-haptic-dreams';

/**
 * The archival score is never an input to this model. This is deliberately a
 * player-performance layer: it grades a gesture against a frozen play type.
 */
export type SignalAction = 'advance' | 'arc' | 'reverse' | 'chorus' | 'settle';

export interface SignalChallenge {
  action: SignalAction;
  label: string;
  instruction: string;
  key: string;
  /** The player gets this much time to answer; the whole run is about 3 min. */
  windowMs: number;
}

export interface SignalResult {
  correct: boolean;
  points: number;
  label: 'CLEAR' | 'STATIC';
}

export const SIGNAL_RUN_DURATION_SECONDS = 180;
export const SIGNAL_RUN_STORAGE_KEY = 'pc:haptic-dreams:signal-run:best';

const CHALLENGES: Record<string, SignalChallenge> = {
  kickoff: { action: 'advance', label: 'OPEN THE FIELD', instruction: 'Swipe toward the receiving kingdom.', key: 'R', windowMs: 10000 },
  punt: { action: 'reverse', label: 'FLIP THE FIELD', instruction: 'Swipe back across the field.', key: 'X', windowMs: 10000 },
  longRun: { action: 'advance', label: 'CLIMB THE DRIVE', instruction: 'Swipe with the runner.', key: 'R', windowMs: 10000 },
  longPass: { action: 'arc', label: 'CAST THE ARC', instruction: 'Hold, then release toward the far side.', key: 'P', windowMs: 10000 },
  turnover: { action: 'reverse', label: 'REVERSE THE WAVE', instruction: 'Swipe against the expected direction.', key: 'X', windowMs: 10000 },
  goalLineTurnover: { action: 'reverse', label: 'HOLD THE LINE', instruction: 'Swipe back before the gate breaks.', key: 'X', windowMs: 10000 },
  fieldGoal: { action: 'arc', label: 'RING THE THREE', instruction: 'Hold, then release into an arc.', key: 'P', windowMs: 10000 },
  fieldGoalLong: { action: 'arc', label: 'CAST FROM DISTANCE', instruction: 'Hold, then release into an arc.', key: 'P', windowMs: 10000 },
  touchdown: { action: 'chorus', label: 'ANSWER IN CHORUS', instruction: 'Tap twice to light the whole field.', key: 'T', windowMs: 10000 },
  miss: { action: 'settle', label: 'LET THE ARC DISSOLVE', instruction: 'Hold still, then release.', key: 'M', windowMs: 10000 },
  final: { action: 'settle', label: 'LAND TOGETHER', instruction: 'Hold still, then release.', key: 'F', windowMs: 10000 },
};

export const signalChallengeFor = (play: Pick<HapticDreamsPlay, 'haptic'>): SignalChallenge =>
  CHALLENGES[play.haptic] ?? CHALLENGES.kickoff;

export const evaluateSignal = (play: Pick<HapticDreamsPlay, 'haptic'>, action: SignalAction | null): SignalResult => {
  const correct = action === signalChallengeFor(play).action;
  return { correct, points: correct ? 100 : 0, label: correct ? 'CLEAR' : 'STATIC' };
};

export const signalGrade = (points: number, eventCount: number) => {
  const percent = eventCount ? Math.round((points / (eventCount * 100)) * 100) : 0;
  if (percent === 100) return 'KINGDOM KEEPER';
  if (percent >= 70) return 'CLEAR SIGNAL';
  return 'RECOVERED';
};

export const signalActionLabel: Record<SignalAction, string> = {
  advance: 'SWIPE / R',
  arc: 'HOLD + RELEASE / P',
  reverse: 'REVERSE SWIPE / X',
  chorus: 'DOUBLE TAP / T',
  settle: 'HOLD + RELEASE / M',
};
