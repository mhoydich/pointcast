/**
 * Sparrow lane lookup — maps a Sparrow pathname to the agentic-web "lane"
 * the surface belongs to. Used by SparrowLayout's HUD sub-line so the
 * wordmark answers "what is this surface for?" without a hard-coded label.
 *
 * Lanes come from the 2027 browser plan
 * (docs/plans/2026-04-24-sparrow-2026-2027-browser.md) — Reading,
 * Federation, Capability, Session, Artifact. Routes that don't map yet
 * fall back to the "reader" lane.
 *
 * v0.37 (2026-04-28) — see docs/plans/2026-04-28-sparrow-hud.md.
 */

export type SparrowLane =
  | 'reading'      // catalogue, individual blocks, channel views
  | 'federation'   // friends, signals, federation.json starters
  | 'session'      // tv ambient surfaces, future watchparty
  | 'artifact'     // saved list, exports, OPML
  | 'capability'   // future agent/tool surfaces
  | 'meta';        // about, deck, manifest, connect

export interface LaneInfo {
  lane: SparrowLane;
  /** Short label for the HUD sub-line (lowercased). */
  label: string;
}

const LANES: Record<SparrowLane, string> = {
  reading: 'reading',
  federation: 'federation',
  session: 'session',
  artifact: 'artifact',
  capability: 'capability',
  meta: 'meta',
};

/**
 * Resolve a Sparrow pathname to a lane label. Pure, deterministic,
 * no side effects — safe to call during Astro SSG render.
 */
export function laneFor(pathname: string): LaneInfo {
  const p = (pathname || '/').replace(/\/+$/, '') || '/';

  // /sparrow root + /sparrow/c/<slug> + /sparrow/b/<id> = reading
  if (p === '/sparrow') return { lane: 'reading', label: LANES.reading };
  if (p.startsWith('/sparrow/b/')) return { lane: 'reading', label: LANES.reading };
  if (p.startsWith('/sparrow/c/')) return { lane: 'reading', label: LANES.reading };
  if (p.startsWith('/sparrow/ch/')) return { lane: 'reading', label: LANES.reading };

  // saved + opml + exports = artifact
  if (p === '/sparrow/saved') return { lane: 'artifact', label: LANES.artifact };
  if (p.startsWith('/sparrow/saved/')) return { lane: 'artifact', label: LANES.artifact };

  // friends, signals, federation seed = federation
  if (p.startsWith('/sparrow/friends')) return { lane: 'federation', label: LANES.federation };
  if (p === '/sparrow/signals') return { lane: 'federation', label: LANES.federation };
  if (p === '/sparrow/federation.json') return { lane: 'federation', label: LANES.federation };

  // tv = session (ambient)
  if (p === '/sparrow/tv') return { lane: 'session', label: 'broadcast' };
  if (p.startsWith('/sparrow/tv/')) return { lane: 'session', label: 'broadcast' };

  // about, deck, connect, manifest = meta
  if (p === '/sparrow/about') return { lane: 'meta', label: 'about' };
  if (p === '/sparrow/deck') return { lane: 'meta', label: 'memo' };
  if (p === '/sparrow/connect') return { lane: 'meta', label: 'connect' };
  if (p === '/sparrow/digest') return { lane: 'meta', label: 'digest' };

  return { lane: 'reading', label: LANES.reading };
}

/**
 * Sparrow's protocol-level version stamp. Single source of truth so the
 * HUD sub-line can render `{lane} · v{n}` without drifting from
 * sparrow.json. Bumped each sprint by hand.
 */
export const SPARROW_VERSION = '0.37';
