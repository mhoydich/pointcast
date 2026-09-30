/**
 * Shortwave's KV feed has no authoritative deletion/moderation visibility
 * lookup, and chain casts have no site visibility service either. Existence
 * in either source is therefore not permission to republish a saved excerpt.
 * Until that service exists, post keeps remain private even in old snapshots.
 * Link destinations are validated separately by publicUrl before publication.
 */
export function canPublishSavedSource(keep: unknown): boolean {
  return Boolean(
    keep &&
      typeof keep === 'object' &&
      !Array.isArray(keep) &&
      (keep as { kind?: unknown }).kind === 'link',
  );
}
