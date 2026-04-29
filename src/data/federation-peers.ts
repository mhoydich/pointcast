/**
 * src/data/federation-peers.ts — placeholder peer list for FooterBar.
 *
 * Phase 0 spike status (RFC 0004 / RFC 0005): the federation layer
 * is shape-mapping only. No PDS, no firehose, no DID issuance, no
 * real peers yet. This file exists so FooterBar's peer tray renders
 * with one self-referential entry pointing at the spike's preview
 * page until Phase 1 commits and real peers come online.
 *
 * Replace the body of FEDERATION_PEERS once the federation layer
 * actually has cross-node peers. Schema is open — extend as needed.
 */
export type FederationPeer = {
  /** atproto-style handle, e.g. "el-segundo.pointcast.xyz" */
  handle: string;
  /** Short marketing line shown next to the handle */
  kicker: string;
  /** URL to open when the peer button is clicked */
  baseUrl: string;
  /** noun.pics seed for the round avatar tile */
  nounSeed: number;
  /** CSS color used for the peer accent (border / status dot) */
  accent: string;
  /** Connection status — 'spike' | 'online' | 'pending' | 'offline' */
  status: 'spike' | 'online' | 'pending' | 'offline';
};

export const FEDERATION_PEERS: FederationPeer[] = [
  {
    handle: 'el-segundo.pointcast.xyz',
    kicker: 'home node · phase 0 spike',
    baseUrl: '/federation/preview',
    nounSeed: 405,
    accent: '#185FA5',
    status: 'spike',
  },
];
