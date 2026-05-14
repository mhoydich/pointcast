/**
 * Nodes registry — curated list of known PointCast nodes.
 *
 * Sprint 10 of the live-artifacts arc · Distribution #4.
 *
 * The webring directory. Anyone running a PointCast node can open a
 * PR adding their node here; the /rooms index will surface them with
 * attribution. /nodes.json mirrors this in machine-readable form for
 * federated subscribers.
 *
 * Distinct from src/pages/node.json.ts — that file is THIS node's
 * advertisement. This file is the directory of OTHER nodes worth
 * subscribing to.
 */

export interface KnownNode {
  /** Stable node id; matches NodeSpec.id. */
  id: string;
  /** Display name. */
  name: string;
  /** One-line description. */
  description: string;
  /** Canonical home URL. */
  home: string;
  /** Federation advertisement URL (where /node.json lives). */
  nodeJsonUrl: string;
  /** Lifecycle status. */
  status: 'live' | 'beta' | 'incubating';
  /** Optional geographic anchor for the broadcast. */
  location?: string;
  /** Optional handle of the operator. */
  operator?: string;
}

/**
 * The current registry. Add your node by opening a PR appending to
 * this array. PointCast itself is always entry #1 — the root node.
 */
export function knownNodes(): KnownNode[] {
  return [
    {
      id: 'pointcast',
      name: 'PointCast',
      description: 'An agent-native broadcast from El Segundo, California. The root node.',
      home: 'https://pointcast.xyz',
      nodeJsonUrl: 'https://pointcast.xyz/node.json',
      status: 'live',
      location: 'El Segundo, California',
      operator: 'mh',
    },
    // Add your node here. Example:
    // {
    //   id: 'house-of-still-hours',
    //   name: 'House of Still Hours',
    //   description: 'A slow-broadcast from somewhere quieter.',
    //   home: 'https://stillhours.example',
    //   nodeJsonUrl: 'https://stillhours.example/node.json',
    //   status: 'beta',
    //   location: 'somewhere quiet',
    //   operator: 'you',
    // },
  ];
}
