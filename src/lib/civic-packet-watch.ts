import data from '../data/civic-packet-watch.json';

export type CivicSignal = (typeof data.signals)[number];
export type CivicSource = (typeof data.sources)[number];

export const CIVIC_PACKET_WATCH = data;

export const meetingSignals = data.signals.filter((signal) => signal.kind === 'meeting');
export const opportunitySignals = data.signals.filter((signal) => signal.kind === 'opportunity');
export const conflictSignals = data.signals.filter(
  (signal) => 'details' in signal && signal.details?.deadlineConflict,
);

export const civicStats = {
  signals: data.signals.length,
  meetings: meetingSignals.length,
  opportunities: opportunitySignals.length,
  conflicts: conflictSignals.length,
  packetsAvailable: data.signals.filter((signal) => signal.documentState === 'available').length,
};

export function sourceFor(signal: CivicSignal) {
  return data.sources.find((source) => source.id === signal.sourceId);
}

export function dateLabel(value: string, includeTime = true) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: data.timezone,
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
    timeZoneName: includeTime ? 'short' : undefined,
  }).format(new Date(value));
}
