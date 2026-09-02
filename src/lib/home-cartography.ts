export const HOME_CARTOGRAPHY_UPDATED_AT = '2026-08-04T06:00:00Z';

export const HOME_CARTOGRAPHY = {
  id: 'pointcast-home-cartography-2026',
  version: 'home-cartography-concept-v0-2026-08-04',
  title: 'Home Cartography',
  status: 'concept',
  updatedAt: HOME_CARTOGRAPHY_UPDATED_AT,
  homepage: 'https://pointcast.xyz/cartography/home',
  json: 'https://pointcast.xyz/cartography/home.json',
  parent: 'https://pointcast.xyz/cartography',
  parentJson: 'https://pointcast.xyz/cartography.json',
  sourceDoc: 'https://github.com/mhoydich/pointcast/blob/main/docs/prd/2026-08-04-home-cartography-device-concept.md',
  credit: 'A Mike Hoydich production',
  summary:
    'Buy a device, walk your home, and index everything you own - barcodes, QR codes, computer vision - into a private, user-owned inventory that becomes your personal data API and MCP server. Your house gets a map, your stuff gets a ledger, and AI gets permissioned access to both.',
  siblingNote:
    'Sibling to Digital Identity Cartography: identity maps who you are, Home Cartography maps what you have.',
  device: {
    posture: 'Purpose-built home scanner, or phone-first app with an optional dedicated device. The device is the wedge; the index is the product.',
    capabilities: [
      { id: 'barcode-qr', label: 'Barcode and QR scanning', detail: 'Packaged goods, electronics, books, media.' },
      { id: 'vision', label: 'Computer vision', detail: 'Everything without a code: furniture, art, tools, clothing, plants.' },
      { id: 'spatial', label: 'Spatial awareness', detail: 'Room-by-room mapping so every item has a location, not just an identity. "The drill" becomes "the drill, garage, second shelf."' },
      { id: 'receipts', label: 'Receipt and email ingestion', detail: 'Fills in what the camera cannot: price paid, purchase date, warranty start.' },
    ],
  },
  indexFields: [
    { id: 'identity', label: 'Identity', detail: 'Product, model, serial number where scannable.' },
    { id: 'location', label: 'Location', detail: 'Room, container, shelf - the coordinates of your stuff.' },
    { id: 'provenance', label: 'Provenance', detail: 'Purchase date, price, retailer, linked receipt.' },
    { id: 'condition', label: 'Condition', detail: 'Photos and state over time.' },
    { id: 'documents', label: 'Documents', detail: 'Manuals, warranties, insurance riders.' },
    { id: 'valuation', label: 'Valuation', detail: 'Live estimated value, refreshed against market comps.' },
  ],
  unlock:
    'The index is exposed as your own API and MCP server, with access granted per-agent, per-scope. Once your home is machine-readable, any AI you trust can act on it.',
  enables: {
    utility: [
      { id: 'valuation', label: 'Valuation', detail: 'Per item, per room, whole home. Insurance-claim-ready export after a fire, flood, or theft.' },
      { id: 'warranty', label: 'Warranty and lifecycle', detail: 'Automatic warranty tracking, recall alerts, "your water heater is 11 years old" nudges.' },
      { id: 'insurance', label: 'Insurance', detail: 'A verified inventory is the best contents-coverage documentation ever. Carriers should discount for it.' },
      { id: 'find', label: 'Find my anything', detail: '"Where are the passports" is a query, not a scavenger hunt.' },
    ],
    interactionModels: [
      { id: 'easy-sell', label: 'Things are easier to sell', detail: 'Every item already has photos, model number, condition history, and comps. "Sell the Peloton" is a one-line instruction - the listing writes itself.' },
      { id: 'availability', label: 'I will go see if the XYZ is available', detail: 'Agents check your inventory before you buy, lend against it with permission, or shop only for what is genuinely missing.' },
      { id: 'handoffs', label: 'Household handoffs', detail: 'Moving, estate planning, and splits become data operations instead of archaeology.' },
    ],
    scoring: [
      { id: 'density', label: 'Stuff-per-square-foot score', detail: 'An honest density metric. Too much stuff for your footage? The system says so, kindly, and lists the items you have not touched in two years.' },
      { id: 'duplication', label: 'Duplication detection', detail: 'Four phone chargers, three tape measures. Sell, donate, or stop buying.' },
      { id: 'replacement', label: 'Replacement intelligence', detail: '"Most likely to fail next year" and "the newer model uses 60% less energy."' },
      { id: 'room-grades', label: 'Room grades', detail: 'Utilization, value concentration, clutter trend over time.' },
    ],
    games: [
      { id: 'scavenger', label: 'Scavenger hunts', detail: 'Generated from your actual inventory - kids, parties, or agents playing each other.' },
      { id: 'collections', label: 'Collection meta-games', detail: 'Completion tracking for books, vinyl, LEGO; trade matching with friends\' permissioned indexes.' },
      { id: 'roadshow', label: 'Antiques Roadshow mode', detail: 'Point at the weird thing from grandma; get provenance research and a valuation narrative.' },
      { id: 'time-capsule', label: 'Time capsule', detail: 'Your home index as a longitudinal artifact - what did the living room look like in 2026?' },
    ],
  },
  whyNow: [
    'Vision models can finally identify arbitrary household objects without a barcode.',
    'MCP makes "your data as a server" a real, standard interface instead of a CSV export.',
    'Agents are becoming the buyer, seller, and scheduler of record - they need a ground-truth model of your household to act well.',
    'Insurance, resale, and estate workflows still run on shoeboxes of receipts.',
  ],
  businessSketch: [
    { id: 'device-sale', label: 'Device sale', detail: 'One-time revenue; the acquisition wedge.' },
    { id: 'index-subscription', label: 'Index subscription', detail: 'Storage, valuation refreshes, warranty and recall monitoring, MCP hosting.' },
    { id: 'transaction-take', label: 'Transaction take', detail: 'Resale listings, insurance referrals, buy-back and trade-in flows.' },
    { id: 'partner-api', label: 'Partner API', detail: 'Insurers, movers, estate services pay for user-approved, scoped access.' },
  ],
  guardrails: [
    'The index is user-owned. Export everything, delete everything, always.',
    'No selling inventory data. Partner access is per-request, user-approved, scoped, and logged.',
    'No public inventory by default; sharing is opt-in per item or collection.',
    'Valuations are informational, never financial advice.',
    'Sensitive zones - kids\' rooms, safes - can be excluded from scanning entirely.',
  ],
  openQuestions: [
    'Dedicated hardware, or phone-first with a hardware upsell?',
    'MCP server local (privacy-max), hosted (convenience-max), or both?',
    'Cold start: what is the minimum viable scan - one room? 50 items? - that delivers a "wow" before fatigue sets in?',
  ],
} as const;

export const homeCartographyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  '@id': 'https://pointcast.xyz/cartography/home#concept',
  name: HOME_CARTOGRAPHY.title,
  description: HOME_CARTOGRAPHY.summary,
  url: HOME_CARTOGRAPHY.homepage,
  creativeWorkStatus: 'Draft',
  dateModified: HOME_CARTOGRAPHY_UPDATED_AT,
  creator: {
    '@type': 'Person',
    name: 'Mike Hoydich',
  },
  publisher: {
    '@type': 'Organization',
    name: 'PointCast',
    url: 'https://pointcast.xyz',
  },
  isPartOf: {
    '@type': 'WebPage',
    '@id': 'https://pointcast.xyz/cartography',
  },
};
