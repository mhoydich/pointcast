export type HomeCasting = {
  id: string;
  name: string;
  note: string;
  durationMs: number;
  wet: boolean;
};

export type HomeSignalStation = {
  id: 'front' | 'field' | 'wire' | 'commons' | 'archive';
  label: string;
  note: string;
  tone: 'amber' | 'blue' | 'green' | 'violet' | 'ink';
  castings: HomeCasting[];
};

/**
 * Catalog No. 2: fifteen PointCast homepage castings.
 *
 * These are metadata, not samples. The matching Web Audio recipes live in
 * bell-signal-home-audio.ts and are generated from oscillators and pink noise
 * on every strike.
 */
export const HOME_SIGNAL_STATIONS: HomeSignalStation[] = [
  {
    id: 'front',
    label: 'Front desk',
    note: 'Three small sounds for arriving.',
    tone: 'amber',
    castings: [
      { id: 'BEL-05', name: 'Beacon', note: 'A bright D5 arrival bell.', durationMs: 2600, wet: true },
      { id: 'SIG-05', name: 'Wayfinder', note: 'Three dry pips point forward.', durationMs: 820, wet: false },
      { id: 'SIG-06', name: 'Press stamp', note: 'Paper, platen, done.', durationMs: 360, wet: false },
    ],
  },
  {
    id: 'field',
    label: 'Field desk',
    note: 'Weather, light, and the turning page.',
    tone: 'green',
    castings: [
      { id: 'BRE-03', name: 'Salt air', note: 'A short pink offshore breath.', durationMs: 2600, wet: true },
      { id: 'BLM-03', name: 'Lantern', note: 'D-major light opening upward.', durationMs: 2100, wet: true },
      { id: 'SIG-07', name: 'Page turn', note: 'Fiber, flick, and a quiet stop.', durationMs: 560, wet: false },
    ],
  },
  {
    id: 'wire',
    label: 'Wire room',
    note: 'Send, receive, return kindly.',
    tone: 'blue',
    castings: [
      { id: 'SIG-08', name: 'Wire ready', note: 'The line opens on a fifth.', durationMs: 700, wet: false },
      { id: 'BEL-06', name: 'Harbor', note: 'A low A3 buoy through the room.', durationMs: 3900, wet: true },
      { id: 'SIG-09', name: 'Soft return', note: 'A gentle falling third.', durationMs: 760, wet: false },
    ],
  },
  {
    id: 'commons',
    label: 'Common room',
    note: 'A threshold, a win, a distant desk.',
    tone: 'violet',
    castings: [
      { id: 'BEL-07', name: 'Threshold', note: 'A narrow glass-and-brass bell.', durationMs: 2800, wet: true },
      { id: 'BLM-04', name: 'Small victory', note: 'A restrained pentatonic bloom.', durationMs: 1700, wet: true },
      { id: 'SIG-10', name: 'Night desk', note: 'One far signal after hours.', durationMs: 2300, wet: true },
    ],
  },
  {
    id: 'archive',
    label: 'Archive floor',
    note: 'Time, ground, and three bells before the blocks.',
    tone: 'ink',
    castings: [
      { id: 'TIK-02', name: 'Relay clock', note: 'Two ticks pass the minute on.', durationMs: 880, wet: false },
      { id: 'DRN-02', name: 'Floor tone', note: 'D2 and A2 hold for one breath.', durationMs: 3200, wet: true },
      { id: 'RIT-03', name: 'Threefold', note: 'Three measured bells, then rest.', durationMs: 4600, wet: true },
    ],
  },
];

export const HOME_CASTINGS = HOME_SIGNAL_STATIONS.flatMap((station) => station.castings);

export function getHomeSignalStation(id: HomeSignalStation['id']) {
  return HOME_SIGNAL_STATIONS.find((station) => station.id === id);
}

