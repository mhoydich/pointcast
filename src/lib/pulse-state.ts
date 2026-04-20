export interface PulseTap { clientId: string; at: number; }

export interface PulseState {
  roomId: string;
  startedAt: number;
  taps: PulseTap[];
  playerIds: string[];
}

export interface PulseAggregate {
  bpm: number;
  taps: number;
  players: number;
  lastAt: number;
}

const MAX_TAPS = 100;
const BPM_TAP_WINDOW = 16;
const MIN_BPM_TAPS = 4;

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export function createState(roomId: string): PulseState {
  return { roomId, startedAt: Date.now(), taps: [], playerIds: [] };
}

export function addTap(state: PulseState, clientId: string, at = Date.now()): PulseState {
  const taps = [...state.taps, { clientId, at }].slice(-MAX_TAPS);
  return { ...state, taps };
}

export function addPlayer(state: PulseState, clientId: string): PulseState {
  if (state.playerIds.includes(clientId)) return state;
  return { ...state, playerIds: [...state.playerIds, clientId] };
}

export function removePlayer(state: PulseState, clientId: string): PulseState {
  return { ...state, playerIds: state.playerIds.filter((id) => id !== clientId) };
}

export function aggregate(state: PulseState, now = Date.now()): PulseAggregate {
  const recent = state.taps.slice(-BPM_TAP_WINDOW);
  const lastAt = recent.length ? recent[recent.length - 1].at : state.startedAt;
  if (recent.length < MIN_BPM_TAPS) {
    return { bpm: 0, taps: state.taps.length, players: state.playerIds.length, lastAt };
  }
  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i += 1) {
    const delta = recent[i].at - recent[i - 1].at;
    if (delta > 0 && recent[i].at <= now) intervals.push(delta);
  }
  const bpm = intervals.length ? Math.round(60000 / median(intervals)) : 0;
  return { bpm, taps: state.taps.length, players: state.playerIds.length, lastAt };
}
