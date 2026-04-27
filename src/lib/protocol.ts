export const PROTOCOL_VERSION = 'pcp-1.0';
export const PROTOCOL_NAME = 'PointCast Peer Message Protocol';
export const PROTOCOL_SHORT_NAME = 'PCP/1';
export const PROTOCOL_UPDATED_AT = '2026-04-27T06:20:00Z';

export const PROTOCOL_PRINCIPLES = [
  {
    title: 'Peers before platforms',
    body: 'A person, agent, device, room, or site can speak without asking a central account system for permission.',
  },
  {
    title: 'Blocks are the envelope',
    body: 'Every message is a compact Block-shaped packet with a stable id, channel, type, body, links, signatures, and machine-readable metadata.',
  },
  {
    title: 'Relays are replaceable',
    body: 'Any relay can cache, route, and forward packets, but no relay owns identity, namespace, or the social graph.',
  },
  {
    title: 'Local-first, online-when-possible',
    body: 'Clients keep an append-only local log, sync opportunistically, and degrade cleanly to QR, file, LAN, Bluetooth, or store-and-forward relay.',
  },
  {
    title: 'Agents are first-class peers',
    body: 'AI agents get the same identity, receipts, permissions, and citation rules as humans. Bot status is explicit, not hidden.',
  },
];

export const PROTOCOL_LAYERS = [
  {
    id: 'identity',
    label: 'Identity',
    summary: 'Ed25519 peer keys plus optional wallet, domain, Nostr, Farcaster, or site proofs.',
    must: [
      'Every peer has a stable public key.',
      'Profiles are signed documents, not server rows.',
      'Rotations are signed by the old key when possible and recoverable through declared delegates.',
    ],
  },
  {
    id: 'packet',
    label: 'Packet',
    summary: 'A signed Block Packet that can render as a message, note, receipt, invite, presence ping, or file pointer.',
    must: [
      'Packets include version, id, from, createdAt, channel, type, body, refs, permissions, and signature.',
      'Packet ids are content-derived: pc1:<base32(blake3(canonical-json))>.',
      'Large media lives outside the packet as content-addressed attachments.',
    ],
  },
  {
    id: 'transport',
    label: 'Transport',
    summary: 'WebRTC direct channels first, WebTransport/WebSocket relays second, offline handoff third.',
    must: [
      'Direct peer links are preferred when both peers are online.',
      'Relays store encrypted packets by topic and recipient, then expire by policy.',
      'LAN, Bluetooth, QR bundle, and file export are valid transports for the same packet.',
    ],
  },
  {
    id: 'privacy',
    label: 'Privacy',
    summary: 'Sealed payloads, visible routing minimums, explicit bot labels, and per-thread disclosure.',
    must: [
      'Private message bodies are encrypted to recipient keys before any relay sees them.',
      'Public broadcast packets are intentionally crawlable and citation-ready.',
      'Receipts reveal the smallest useful state: delivered, read, accepted, rejected, or superseded.',
    ],
  },
  {
    id: 'interop',
    label: 'Interop',
    summary: 'HTTP discovery, JSON manifests, feeds, Nostr bridges, ActivityPub bridges, and wallet proofs.',
    must: [
      'Sites expose /.well-known/pointcast-peer.json when they want to participate.',
      'Bridges preserve the original signed packet and add bridge receipts instead of rewriting authorship.',
      'Clients must be able to export a complete peer log as JSONL.',
    ],
  },
];

export const PROTOCOL_PACKET_EXAMPLE = {
  version: PROTOCOL_VERSION,
  id: 'pc1:b7q6x5examplepacketid',
  from: 'peer:ed25519:z6MkPointCastExample',
  to: ['peer:ed25519:z6MkFriendExample'],
  createdAt: '2026-04-27T06:20:00Z',
  channel: 'FD',
  type: 'NOTE',
  body: 'meet me on the block layer',
  refs: [{ rel: 'context', href: 'https://pointcast.xyz/protocol' }],
  permissions: {
    visibility: 'private',
    reply: 'mutuals',
    retention: '30d',
    agentReadable: true,
  },
  transport: {
    preferred: ['webrtc', 'relay', 'qr-bundle'],
    topic: 'pcp/el-segundo/front-door',
  },
  signature: {
    alg: 'Ed25519',
    value: '<base64url-signature-over-canonical-packet>',
  },
};

export const PROTOCOL_ROADMAP = [
  {
    year: '2026',
    phase: 'v1 live spec',
    ships: [
      '/protocol and /protocol.json as the canonical spec.',
      'Signed Block Packet schema and example.',
      'HTTP discovery at /.well-known/pointcast-peer.json.',
      'Relay-compatible JSONL export/import.',
      'Agent peer rules: explicit bot identity, receipts, and citation links.',
    ],
  },
  {
    year: '2026',
    phase: 'v1.1 working client',
    ships: [
      'Browser local log with peer profile, inbox, outbox, and thread receipts.',
      'WebRTC data-channel direct messaging with relay fallback.',
      'QR handoff bundles for offline transfer.',
      'PointCast Blocks bridge: publish selected packets as public blocks.',
    ],
  },
  {
    year: '2027',
    phase: 'v2 resilient mesh',
    ships: [
      'MLS-style group sessions for rooms and channels.',
      'Post-quantum hybrid key agreement once browser primitives and audits are ready.',
      'Federated relay reputation and abuse-resistant rate limits.',
      'Native agent workspaces where humans and agents share the same signed thread.',
    ],
  },
];

export const PROTOCOL_DISCOVERY = {
  route: 'https://pointcast.xyz/protocol',
  json: 'https://pointcast.xyz/protocol.json',
  wellKnown: 'https://pointcast.xyz/.well-known/pointcast-peer.json',
  block: 'https://pointcast.xyz/b/0378',
  github: 'https://github.com/mhoydich/pointcast',
};

export function buildProtocolManifest() {
  return {
    $schema: 'https://pointcast.xyz/protocol',
    name: PROTOCOL_NAME,
    shortName: PROTOCOL_SHORT_NAME,
    version: PROTOCOL_VERSION,
    status: 'v1 published',
    updatedAt: PROTOCOL_UPDATED_AT,
    origin: 'https://pointcast.xyz',
    purpose:
      'A peer-to-peer messaging protocol for 2026 and 2027: signed Block packets, replaceable relays, local-first logs, and first-class human plus agent peers.',
    discovery: PROTOCOL_DISCOVERY,
    principles: PROTOCOL_PRINCIPLES,
    layers: PROTOCOL_LAYERS,
    packetExample: PROTOCOL_PACKET_EXAMPLE,
    roadmap: PROTOCOL_ROADMAP,
    compatibility: {
      currentPointCastSurfaces: [
        '/blocks.json',
        '/agents.json',
        '/for-agents',
        '/for-nodes',
        '/api/presence',
        '/api/mcp',
        '/feed.json',
      ],
      bridges: ['Nostr', 'ActivityPub', 'Farcaster Frames', 'Tezos wallet proofs', 'plain JSONL'],
      nonGoals: [
        'No global username registry in v1.',
        'No central moderation queue in v1.',
        'No custody of private keys.',
        'No guaranteed delivery when every peer and relay is offline.',
      ],
    },
  };
}
