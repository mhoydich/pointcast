/**
 * OFF-61 temporary containment: metadata/preflight stay available; inference stays off.
 * No environment variable, key, AI binding or fallback can enable a provider here.
 * Restoring inference requires reviewed atomic budget enforcement, not a flag change.
 */
import { handleDeskmate } from '../../src/lib/deskmate/service.mjs';

export const onRequest: PagesFunction = async ({ request }) => handleDeskmate(request, {
  callModel: null,
  // Unreachable while contained. Keep the dependency fail-closed if service changes.
  limit: async () => ({ allowed: false, retryAfter: 60 }),
});
