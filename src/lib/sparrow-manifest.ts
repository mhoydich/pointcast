/**
 * Sparrow manifest spec + parser (v0.41).
 *
 * Pages declare their AI affordances by embedding a JSON-LD payload
 * with `@context: "https://pointcast.xyz/schemas/sparrow-manifest-v1"`
 * in the document head. Sparrow's reader scans for the manifest at
 * load time, intersects the declared capabilities with the user's
 * installed cartridges, and surfaces matching affordances in ⌘K and
 * the side panel.
 *
 * Why a spec, not an SDK: any page can declare a manifest with a
 * single `<script type="application/ld+json">` tag — no library to
 * import, no permissions to request. Mirrors how RSS, Open Graph,
 * and JSON-LD itself bootstrapped.
 *
 * See docs/plans/2026-04-29-sparrow-cartridge-front-door.md §III.
 */

import type { CartridgeCapability, Cartridge } from './sparrow-cartridges';

// ─── Types ───────────────────────────────────────────────────────────

export type ManifestKind =
  | 'block'      // a single PointCast block
  | 'channel'    // a /sparrow/ch/<slug> page
  | 'list'       // a curated list (saved, friends, etc.)
  | 'session'    // an in-progress session
  | 'page';      // any other page wanting AI affordances

export interface ManifestCapabilityHint {
  /** What context shape the page recommends: "title", "title+body",
      "title+body+saved", "screenshot", "selection". */
  context?: string;
  /** Soft cap on input tokens for this affordance. */
  max_input_tokens?: number;
}

export interface ManifestAffordance {
  /** Stable id within the manifest. */
  id: string;
  /** UI label. */
  label: string;
  /** Capability the affordance requires. */
  capability: CartridgeCapability;
  /** Optional one-line dek shown beneath the label in the palette. */
  hint?: string;
  /** Optional pre-filled prompt / instruction. */
  prompt?: string;
  /** Keyboard shortcut hint (display only — actual binding is the
      palette index ⌥1, ⌥2, …). */
  kbd?: string;
}

export interface SparrowManifest {
  schema: 'sparrow-manifest-v1';
  '@context'?: string;
  /** Stable id (typically the canonical path). */
  id: string;
  /** What this surface is. */
  kind: ManifestKind;
  /** Page title (optional — falls back to <title>). */
  title?: string;
  /** Channel code if this is block/channel content. */
  channel?: string;
  /** Capabilities the page can usefully consume. */
  capabilities: Partial<Record<CartridgeCapability, ManifestCapabilityHint>>;
  /** Affordances surfaced in ⌘K. Only those whose `capability` is
      satisfied by an installed cartridge are shown. */
  affordances: ManifestAffordance[];
}

// ─── Parser ──────────────────────────────────────────────────────────

/**
 * Scan a `Document` for a sparrow-manifest-v1 JSON-LD payload and
 * return it. Returns null when no manifest is present, the manifest
 * is malformed, or its schema doesn't match.
 *
 * The function reads from any `<script type="application/ld+json">`
 * element whose parsed JSON has `@context` matching either the
 * canonical schema URL or the bare `sparrow-manifest-v1` schema id —
 * that flexibility lets pages embed a manifest inside a larger
 * JSON-LD graph (e.g. a Schema.org Article that also declares
 * Sparrow affordances).
 */
export function parseManifest(doc: Document = document): SparrowManifest | null {
  const tags = Array.from(
    doc.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]'),
  );
  for (const tag of tags) {
    try {
      const data = JSON.parse(tag.textContent || 'null') as unknown;
      const candidate = matchManifest(data);
      if (candidate) return candidate;
    } catch {
      /* skip malformed JSON */
    }
  }
  return null;
}

function matchManifest(value: unknown): SparrowManifest | null {
  if (!value || typeof value !== 'object') return null;
  // Allow either a top-level manifest or a manifest nested inside a
  // larger JSON-LD graph under @graph.
  if (Array.isArray(value)) {
    for (const v of value) {
      const m = matchManifest(v);
      if (m) return m;
    }
    return null;
  }
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj['@graph'])) {
    for (const v of obj['@graph']) {
      const m = matchManifest(v);
      if (m) return m;
    }
  }
  if (obj.schema === 'sparrow-manifest-v1' && obj.id && obj.kind && obj.capabilities && obj.affordances) {
    return obj as unknown as SparrowManifest;
  }
  // Accept @context-based identification too (the canonical pattern).
  const ctx = obj['@context'];
  if (
    typeof ctx === 'string' &&
    (ctx.endsWith('sparrow-manifest-v1') || ctx === 'sparrow-manifest-v1') &&
    obj.id && obj.kind && obj.capabilities && obj.affordances
  ) {
    return { ...obj, schema: 'sparrow-manifest-v1' } as unknown as SparrowManifest;
  }
  return null;
}

// ─── Affordance intersection ─────────────────────────────────────────

export interface ResolvedAffordance extends ManifestAffordance {
  /** Cartridge that will fire this affordance. */
  cartridge: Cartridge;
}

/**
 * Given a manifest and a set of installed cartridges, return the
 * affordances that have a matching cartridge. The returned list
 * picks one cartridge per affordance:
 *
 *   1. The user's default cartridge if it satisfies the capability.
 *   2. Otherwise, the first cartridge whose capabilities include
 *      the required one (cartridges are listed in install order;
 *      newest installs come last).
 *
 * Affordances with no matching cartridge are silently dropped — the
 * user shouldn't see options they can't fire. The /sparrow/cartridges
 * page is where they'd go to add the missing capability.
 */
export function affordancesFor(
  manifest: SparrowManifest,
  cartridges: Cartridge[],
  defaultId?: string | null,
): ResolvedAffordance[] {
  const resolved: ResolvedAffordance[] = [];
  for (const aff of manifest.affordances) {
    const candidates = cartridges.filter((c) => c.capabilities.includes(aff.capability));
    if (candidates.length === 0) continue;
    const preferred =
      (defaultId ? candidates.find((c) => c.id === defaultId) : undefined) ?? candidates[0];
    resolved.push({ ...aff, cartridge: preferred });
  }
  return resolved;
}

// ─── Helpers for emitters ────────────────────────────────────────────

/**
 * Build a SparrowManifest object suitable for serializing into a
 * page's `<script type="application/ld+json">`. Used by Astro pages
 * that want to declare AI affordances.
 */
export function buildManifest(opts: {
  id: string;
  kind: ManifestKind;
  title?: string;
  channel?: string;
  capabilities: SparrowManifest['capabilities'];
  affordances: ManifestAffordance[];
}): SparrowManifest {
  return {
    schema: 'sparrow-manifest-v1',
    '@context': 'https://pointcast.xyz/schemas/sparrow-manifest-v1',
    id: opts.id,
    kind: opts.kind,
    title: opts.title,
    channel: opts.channel,
    capabilities: opts.capabilities,
    affordances: opts.affordances,
  };
}

/**
 * Convenience: a sensible default affordance set for a block reader
 * (every /sparrow/b/<id> page can pass this through buildManifest).
 * Pages can add or replace affordances as they see fit.
 */
export function defaultBlockAffordances(): ManifestAffordance[] {
  return [
    {
      id: 'summarize',
      label: 'Summarize this block',
      capability: 'text.complete',
      hint: 'a short summary in your default cartridge',
      kbd: '⌥1',
    },
    {
      id: 'ask',
      label: 'Ask about this…',
      capability: 'text.chat',
      hint: 'open a session with this block as context',
      kbd: '⌥2',
    },
    {
      id: 'imagine',
      label: 'Make an image of this idea',
      capability: 'image.generate',
      hint: 'render the central idea as an image',
      kbd: '⌥3',
    },
    {
      id: 'voice',
      label: 'Read this aloud',
      capability: 'audio.tts',
      hint: 'narrate the block',
      kbd: '⌥4',
    },
  ];
}
