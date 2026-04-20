/**
 * visitor — identity helpers for every visitor (human, agent, bot).
 *
 * Mike 2026-04-19 20:30 PT: "profiles for any visitor, even the ai,
 * bots, scrapers spiders and yah when they are around, neat, want to
 * represent that, how this is a place to congregate, a schelling
 * point of its own."
 *
 * The primitive: every visitor gets a deterministic Noun ID (0-1199)
 * derived from their session ID (or wallet address, or UA string for
 * agents). Stored client-side on first visit; surfaced as the avatar
 * that represents them everywhere — PresenceBar, future /profile,
 * future /here congregation page, future /tv presence constellation.
 *
 * Deterministic = same session → same noun forever. Cross-device =
 * different nouns unless wallet connects and migrates. That's a
 * feature for v0: "this browser is noun 421" is a real identity
 * statement.
 */

/**
 * Cheap string-hash → positive integer. DJB2-esque, not cryptographic.
 * Stable across runs. Used to derive noun id from any identity string.
 */
export function cheapHash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;  // force unsigned
}

/**
 * Given an identity string (session id, wallet address, or UA), return
 * a Noun ID in the range 0-1199 (matches the Visit Nouns FA2 supply).
 */
export function getVisitorNounId(identity: string): number {
  return cheapHash(identity) % 1200;
}

/**
 * Build the noun avatar URL for a visitor.
 */
export function getVisitorNounUrl(identity: string): string {
  return `https://noun.pics/${getVisitorNounId(identity)}.svg`;
}

/**
 * Returns a short display name for a visitor. Preference order:
 *   1. If a `display` override is given (future: user-set handle), use it.
 *   2. If a Tezos wallet is connected, return short form like "tz2FJJ…xDFW".
 *   3. If a UA contains a known agent name, return that (e.g. "GPTBot").
 *   4. Otherwise fall back to "noun-{id}".
 *
 * Pure function; caller provides the inputs.
 */
export function getVisitorDisplayName(opts: {
  display?: string | null;
  wallet?: string | null;
  ua?: string | null;
  sessionId?: string | null;
}): string {
  const { display, wallet, ua, sessionId } = opts;
  if (display && display.trim()) return display.trim();
  if (wallet && wallet.startsWith('tz')) {
    return wallet.slice(0, 6) + '…' + wallet.slice(-4);
  }
  const agents = [
    'GPTBot', 'ClaudeBot', 'PerplexityBot', 'OAI-SearchBot', 'Atlas',
    'Google-Extended', 'Googlebot', 'Bingbot', 'anthropic-ai', 'Claude-User',
  ];
  if (ua) {
    for (const a of agents) {
      if (ua.toLowerCase().includes(a.toLowerCase())) return a;
    }
  }
  if (sessionId) {
    return 'noun-' + (getVisitorNounId(sessionId).toString().padStart(3, '0'));
  }
  return 'visitor';
}

/**
 * Classify a visitor kind from available hints. Used to pick glyph/color.
 *   - wallet: Tezos wallet connected → "wallet"
 *   - agent:  UA matches a known crawler → "agent"
 *   - human:  otherwise → "human"
 */
export function getVisitorKind(opts: { wallet?: string | null; ua?: string | null }): 'wallet' | 'agent' | 'human' {
  if (opts.wallet && opts.wallet.startsWith('tz')) return 'wallet';
  if (opts.ua) {
    const agentPattern = /gptbot|claudebot|claude-user|anthropic-ai|perplexitybot|oai-searchbot|atlas|google-extended|googlebot|bingbot/i;
    if (agentPattern.test(opts.ua)) return 'agent';
  }
  return 'human';
}

/** localStorage keys the client uses to track visitor identity. */
export const VISITOR_LS_KEYS = {
  /** Existing `pc:session` key from PresenceBar — reuse don't conflict. */
  sessionId: 'pc:session',
  /** Cached visitor noun id (integer as string). */
  nounId: 'pc:visitor:noun',
  /** ISO string of the first visit — "here since {date}". */
  firstSeenAt: 'pc:visitor:firstSeenAt',
  /** Optional display-name override. */
  display: 'pc:visitor:display',
} as const;
