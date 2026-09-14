/** Explicit Pacific date/time so the closing instant is unambiguous after rescheduling. */
export function formatOtherWorldsDeadline(closesAt: string, compact = false): string {
  const date = new Date(closesAt);
  if (!Number.isFinite(date.getTime())) return 'the published closing time';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: compact ? 'short' : 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date);
}
