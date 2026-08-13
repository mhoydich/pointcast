export const FEDERATION_META = {
  protocol: 'pointcast.federation/v0',
  status: 'open-draft',
  title: 'PointCast Federation',
  description:
    'An open, community-maintained reachability network. Communities keep their own directories; PointCast publishes the shared joining rules and receipts.',
  canonical: 'https://pointcast.xyz/federation',
  json: 'https://pointcast.xyz/federation.json',
  markdown: 'https://pointcast.xyz/federation.md',
  registry: 'https://pointcast.xyz/collabs',
  repository: 'https://github.com/mhoydich/pointcast',
  contact: 'hello@pointcast.xyz',
} as const;

export const FEDERATION_JOIN_PATHS = [
  {
    id: 'person',
    label: 'Join as a person',
    summary: 'Choose how you want to be reached. PointCast keeps the destination private and publishes only the route type and consent state.',
    fields: ['name', 'home community', 'preferred channel', 'permission to contact', 'optional register note'],
  },
  {
    id: 'node',
    label: 'Run a community node',
    summary: 'Maintain a small directory for a place, publication, club, or project and publish a public node card on your own domain.',
    fields: ['node name', 'canonical URL', 'maintainer', 'public directory URL', 'supported channel types'],
  },
  {
    id: 'adapter',
    label: 'Maintain an adapter',
    summary: 'Connect one channel without changing the core protocol. Adapters translate a reviewed message into a draft or send request and return a receipt.',
    fields: ['channel', 'source repository', 'maintainer', 'approval mode', 'receipt support'],
  },
] as const;

export const FEDERATION_STEPS = [
  {
    n: 1,
    name: 'Choose a home node',
    detail: 'Every person belongs to the community that actually knows how to reach them. PointCast can be the first home node; later communities can run their own.',
  },
  {
    n: 2,
    name: 'Publish only the public card',
    detail: 'List a stable ID, display name, home node, available channel types, consent state, and last-confirmed date. Never publish an email address, phone number, or private handle.',
  },
  {
    n: 3,
    name: 'Request review',
    detail: 'Email the private details to PointCast or open a pull request containing only public node metadata. A maintainer reviews the card before it enters the registry.',
  },
  {
    n: 4,
    name: 'Prove one route',
    detail: 'The first message is drafted for human approval. Its result is recorded precisely as drafted, approved, submitted, delivered, confirmed, or replied.',
  },
] as const;

export const FEDERATION_RECEIPT_STATES = [
  'drafted',
  'approved',
  'submitted',
  'delivered',
  'confirmed',
  'replied',
] as const;

export const FEDERATION_NODE_TEMPLATE = {
  protocol: FEDERATION_META.protocol,
  node: {
    id: 'your-community',
    name: 'Your Community',
    url: 'https://example.org',
    maintainedBy: 'Your name or group',
  },
  directory: {
    public: 'https://example.org/people.json',
    privateDestinationsStayLocal: true,
  },
  capabilities: {
    channels: ['email'],
    approval: 'human-required',
    receipts: ['drafted', 'approved', 'submitted'],
  },
  contact: 'mailto:hello@example.org',
} as const;

export const FEDERATION_PERSON_TEMPLATE = {
  protocol: FEDERATION_META.protocol,
  person: {
    id: 'your-community:person-name',
    displayName: 'Person Name',
    homeNode: 'your-community',
    channels: ['email'],
    consent: 'ask-first',
    registerNote: 'Short, direct, no marketing language.',
    lastConfirmed: null,
  },
} as const;

