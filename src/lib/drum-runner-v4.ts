export type PowerUpKind = 'noggles' | 'tape' | 'bass' | 'ghost';
export type MusicalPower = Exclude<PowerUpKind, 'ghost'>;
export type NounVoice = 'clave' | 'pluck' | 'bell' | 'clap';

export type PowerState = {
  musical: MusicalPower | null;
  charges: number;
  expiresAtBeat: number;
  ghostCharges: number;
};

export type AcceptedPowerResult = {
  state: PowerState;
  harmonyDouble: boolean;
  tapeRecord: boolean;
};

export const POWER_UP_SPECS = {
  noggles: { label: 'Gold Noggles', shortLabel: 'NOGGLES', color: '#ffd166', acceptedNotes: 4, beats: 0 },
  tape: { label: 'Loop Tape', shortLabel: 'TAPE', color: '#ff78c7', acceptedNotes: 4, beats: 0 },
  bass: { label: 'Bass Battery', shortLabel: 'BASS', color: '#78f0ca', acceptedNotes: 0, beats: 8 },
  ghost: { label: 'Ghost Soles', shortLabel: 'GHOST', color: '#9db8ff', acceptedNotes: 0, beats: 0 },
} as const;

export function emptyPowerState(): PowerState {
  return { musical: null, charges: 0, expiresAtBeat: 0, ghostCharges: 0 };
}

export function normalizeNounId(value: unknown, fallback = 137): number {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(1199, Math.floor(parsed)));
}

export function nounVoiceFor(nounId: number): NounVoice {
  const voices: NounVoice[] = ['clave', 'pluck', 'bell', 'clap'];
  return voices[normalizeNounId(nounId) % voices.length];
}

export function nounChoices(savedNounId: number): [number, number, number] {
  const saved = normalizeNounId(savedNounId);
  const choices = [saved, (saved + 281) % 1200, (saved + 718) % 1200];
  return choices as [number, number, number];
}

export function collectPowerUp(state: PowerState, kind: PowerUpKind, beat: number): PowerState {
  if (kind === 'ghost') return { ...state, ghostCharges: 1 };
  const spec = POWER_UP_SPECS[kind];
  return {
    ...state,
    musical: kind,
    charges: spec.acceptedNotes,
    expiresAtBeat: spec.beats > 0 ? beat + spec.beats : 0,
  };
}

export function powerStateAtBeat(state: PowerState, beat: number): PowerState {
  if (state.musical !== 'bass' || beat < state.expiresAtBeat) return state;
  return { ...state, musical: null, charges: 0, expiresAtBeat: 0 };
}

export function consumeAcceptedPower(state: PowerState, beat: number): AcceptedPowerResult {
  const current = powerStateAtBeat(state, beat);
  if (current.musical !== 'noggles' && current.musical !== 'tape') {
    return { state: current, harmonyDouble: false, tapeRecord: false };
  }
  const harmonyDouble = current.musical === 'noggles';
  const tapeRecord = current.musical === 'tape';
  const charges = Math.max(0, current.charges - 1);
  return {
    state: charges > 0 ? { ...current, charges } : { ...current, musical: null, charges: 0, expiresAtBeat: 0 },
    harmonyDouble,
    tapeRecord,
  };
}

export function consumeGhostCharge(state: PowerState): { state: PowerState; protected: boolean } {
  if (state.ghostCharges <= 0) return { state, protected: false };
  return { state: { ...state, ghostCharges: 0 }, protected: true };
}

export function powerUpDistanceFromCues(beat: number, cueBeats: number[]): number {
  if (!cueBeats.length) return Infinity;
  return Math.min(...cueBeats.map((cueBeat) => Math.abs(cueBeat - beat)));
}

export function isPowerUpPlacementSafe(beat: number, cueBeats: number[], levelBeats: number): boolean {
  return beat >= 5 && beat <= levelBeats - 2 && powerUpDistanceFromCues(beat, cueBeats) >= 1.5;
}

export function powerUpDisplayX(
  powerBeat: number,
  currentBeat: number,
  runnerX: number,
  viewportWidth: number,
  beatPixels = 150,
): number {
  const rawX = runnerX + (powerBeat - currentBeat) * beatPixels;
  return Math.min(rawX, Math.max(30, viewportWidth - 30));
}
