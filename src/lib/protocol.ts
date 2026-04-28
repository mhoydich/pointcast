export const PROTOCOL_VERSION = 'pcp-1.0.1';
export const PROTOCOL_PACKET_VERSION = 'pcp-1.0';
export const PROTOCOL_PACKET_MEDIA_TYPE = 'pcp-1.0/block-packet+json';
export const PROTOCOL_NAME = 'PointCast Peer Message Protocol';
export const PROTOCOL_SHORT_NAME = 'PCP/1';
export const PROTOCOL_UPDATED_AT = '2026-04-28T05:40:00Z';

export const PROTOCOL_STORAGE_KEYS = {
  profile: 'pcp:v1:peer-profile',
  inbox: 'pcp:v1:inbox',
  outbox: 'pcp:v1:outbox',
  receipts: 'pcp:v1:receipts',
  trustedPeers: 'pcp:v1:trusted-peers',
};

export const PROTOCOL_RECEIPT_TYPES = [
  'created',
  'imported',
  'delivered',
  'read',
  'accepted',
  'rejected',
  'superseded',
];

export const PROTOCOL_CANONICAL_JSON_RULES = [
  'UTF-8 JSON with object keys sorted lexicographically at every depth.',
  'Undefined values are omitted; null values are preserved.',
  'Packet id material excludes id and signature.',
  'Signature material includes id and excludes signature.',
  'Packet ids are pc1:<base32(sha256(canonical unsigned packet))> in v1.1 browser clients.',
];

export const PROTOCOL_VALIDATION_RULES = [
  'version must be pcp-1.0 for Block Packets.',
  'from must be peer:ed25519:<base64url raw public key>.',
  'to must be an array of peer ids, empty only for local drafts or public broadcast.',
  'channel and type must match the PointCast Block primitives.',
  'body must be 1-4000 characters before any public Block conversion.',
  'permissions.visibility must be local, public, or private.',
  'signature.alg must be Ed25519 for signed v1 packets.',
];

export const PROTOCOL_COMPATIBILITY_NOTES = [
  'Nostr bridges should wrap the original PCP packet in a NIP-01/NIP-78 event and add a bridge receipt.',
  'Farcaster Frames and Mini Apps should link to the packet or Block permalink instead of rewriting authorship.',
  'Tezos wallet proofs can be attached as refs/proofs; they do not replace the peer key signature.',
  'ActivityPub bridges should preserve the original packet id in attachment metadata.',
];

export const PROTOCOL_AGENT_RECEIPTS = [
  {
    type: 'accepted',
    use: 'An agent has accepted a task packet and is beginning work.',
  },
  {
    type: 'superseded',
    use: 'A later task packet or result packet replaces an earlier one.',
  },
  {
    type: 'rejected',
    use: 'An agent declines work, usually with a reason and citation refs.',
  },
  {
    type: 'delivered',
    use: 'A result packet or citation bundle reached the intended peer or public Block surface.',
  },
];

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
      'Packet ids are content-derived: pc1:<base32(sha256(canonical-json))>.',
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
  version: PROTOCOL_PACKET_VERSION,
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
  client: 'https://pointcast.xyz/messages',
  relay: 'https://pointcast.xyz/api/pcp/relay',
  block: 'https://pointcast.xyz/b/0378',
  github: 'https://github.com/mhoydich/pointcast',
};

export function buildProtocolManifest() {
  return {
    $schema: 'https://pointcast.xyz/protocol',
    name: PROTOCOL_NAME,
    shortName: PROTOCOL_SHORT_NAME,
    version: PROTOCOL_VERSION,
    packetVersion: PROTOCOL_PACKET_VERSION,
    packetMediaType: PROTOCOL_PACKET_MEDIA_TYPE,
    status: 'v1.0.1 hardening + v1.1 local client',
    updatedAt: PROTOCOL_UPDATED_AT,
    origin: 'https://pointcast.xyz',
    purpose:
      'A peer-to-peer messaging protocol for 2026 and 2027: signed Block packets, replaceable relays, local-first logs, and first-class human plus agent peers.',
    discovery: PROTOCOL_DISCOVERY,
    client: {
      human: PROTOCOL_DISCOVERY.client,
      storageKeys: PROTOCOL_STORAGE_KEYS,
      capabilities: [
        'Generate a browser-local Ed25519 peer identity.',
        'Compose and sign Block Packets locally.',
        'Store inbox, outbox, receipts, and trusted peers in localStorage.',
        'Export and import packets as JSONL.',
        'Copy a selected packet into a PointCast Block draft.',
      ],
      warning: 'The browser client is a protocol proof, not a secure production messenger. Private-key material is browser-local and exportable for transparency.',
    },
    packetSchema: {
      mediaType: PROTOCOL_PACKET_MEDIA_TYPE,
      canonicalJsonRules: PROTOCOL_CANONICAL_JSON_RULES,
      validationRules: PROTOCOL_VALIDATION_RULES,
      receiptTypes: PROTOCOL_RECEIPT_TYPES,
    },
    relayPrototype: {
      endpoint: PROTOCOL_DISCOVERY.relay,
      status: 'prototype endpoint; requires PC_PCP_RELAY_KV before storing',
      plaintextPolicy: 'Rejects packets containing plaintext body/message/text fields. Relay accepts encrypted envelopes only.',
      lookup: 'GET ?recipient=<peer-id>&topic=<topic> returns encrypted packets for that recipient/topic when KV is bound.',
    },
    agentUse: {
      peerIdentity: 'Agents use peer:ed25519 ids and must mark their profile kind as agent.',
      receipts: PROTOCOL_AGENT_RECEIPTS,
      citationRule: 'Agent result packets should cite source packets in refs[] and preserve original packet ids.',
    },
    principles: PROTOCOL_PRINCIPLES,
    layers: PROTOCOL_LAYERS,
    packetExample: PROTOCOL_PACKET_EXAMPLE,
    compatibilityNotes: PROTOCOL_COMPATIBILITY_NOTES,
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
