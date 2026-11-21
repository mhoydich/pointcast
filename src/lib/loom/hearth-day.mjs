import { FIRE_SIZES, isCollator, isPerson } from './hearth.mjs';

export const HEARTH_DAY = 24 * 60 * 60 * 1000;
export const HEARTH_BATCH = 8;

/** The same rolling day drives the front-page tile and its room's flame. */
export function hearthActivity(messages, { now = Date.now(), trimmedSince = null } = {}) {
  const since = now - HEARTH_DAY;
  // Lost history inside the window could change both the size and the palette.
  if (!Array.isArray(messages) ||
      (trimmedSince !== null && !(Date.parse(trimmedSince) <= since))) return { state: 'unavailable' };

  let count = 0, latest = null, person = null;
  const newer = (a, b) => !b || a.at > b.at || (a.at === b.at && a.seq > b.seq);
  for (const message of messages) {
    const at = Date.parse(message?.at);
    if (!(at > since && at <= now) || message.hidden || message.withdrawn || message.via || isCollator(message.from)) continue;
    if (!isPerson(message.from) && message.from?.kind !== 'agent') continue;
    count++;
    if (newer(message, latest)) latest = message;
    if (isPerson(message.from) && newer(message, person)) person = message;
  }
  if (!count) return { state: 'quiet' };
  const [large, medium, small, tiny] = FIRE_SIZES;
  const size = count >= 12 ? large : count >= 6 ? medium : count >= 3 ? small : tiny;
  return {
    state: 'active', count, size, human: !!person,
    lastAt: latest.at, lastName: latest.from.name, lastKind: latest.from.kind,
    lastHumanAt: person?.at ?? null, humanName: person?.from.name ?? null,
  };
}
