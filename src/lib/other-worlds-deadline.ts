/** Null keeps the exhibition open without an artificial closing date. */
export function formatOtherWorldsDeadline(closesAt: string | null, compact = false): string {
  if (closesAt === null) return 'No closing date';
  const date = new Date(closesAt);
  if (!Number.isFinite(date.getTime())) return 'the published closing time';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: compact ? 'short' : 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date);
}
