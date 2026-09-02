/**
 * Home Cartography field kit — a phone-usable protocol for indexing one
 * real room today, without a device or an app. Pure data; no PointCast
 * upload path. Copy the templates, fill them in locally, keep the file.
 */

export const HOME_FIELD_KIT_UPDATED_AT = '2026-09-02T00:00:00Z';

export interface FieldKitStep {
  step: number;
  label: string;
  detail: string;
}

export const HOME_FIELD_KIT = {
  id: 'home-cartography-field-kit',
  title: 'Home Cartography field kit',
  updatedAt: HOME_FIELD_KIT_UPDATED_AT,
  purpose:
    'A phone-usable protocol for indexing one real room in about 20 minutes, before any device or camera-scanning product exists. Receipts-first ingestion (see the receipt-ingestion spec) covers the paper trail; this covers everything a phone camera and a search bar can do right now.',
  protocol: [
    {
      step: 1,
      label: 'Pick the room',
      detail: 'Start with the room that has the most high-value or hardest-to-remember items — usually garage, office, or kitchen. One room, one pass. Do not try to do the whole house in one session.',
    },
    {
      step: 2,
      label: 'Photograph the room from the doorway',
      detail: 'One wide shot from the entrance before touching anything. This is your before-state and your map reference for "location" notes later.',
    },
    {
      step: 3,
      label: 'Sweep clockwise',
      detail: 'Starting at the wall to your left of the doorway, work clockwise around the room, surface by surface, shelf by shelf, drawer by drawer. Clockwise is arbitrary but consistent — it stops you from doubling back and missing corners.',
    },
    {
      step: 4,
      label: 'For each item worth indexing: barcode if any, else photo',
      detail: 'If it has a barcode/serial label, photograph that label close-up (readable, in focus). If not, one clear photo of the item itself is enough. Do not stage or clean anything — index it where it lives.',
    },
    {
      step: 5,
      label: 'Record location as room · surface/container · slot',
      detail: 'Use the three-part location format from the demo index, e.g. "Garage · shelf 2 · bin 3" or "Kitchen · pantry · bottom shelf". This is what makes the index findable later — precision here is worth more than precision on price.',
    },
    {
      step: 6,
      label: 'Note condition',
      detail: 'One word from the condition scale below (like-new / good / fair / worn). Be honest — the index is only useful as an honest mirror, not a resale listing.',
    },
    {
      step: 7,
      label: 'Search email for the receipt',
      detail: 'Quick search of your inbox for the merchant or item name while it is fresh in mind. If you find the order confirmation, pull date, price, and order id straight from it. If not, mark it provenance-unknown and move on — do not stall the sweep chasing one receipt.',
    },
    {
      step: 8,
      label: "Skip anything you'd rather not index",
      detail: 'Sensitive zones are excluded by design — medicine cabinets, personal documents, anything you would not want summarized by an agent later. This kit indexes stuff, not your life. When in doubt, skip it.',
    },
  ] as FieldKitStep[],
  itemTemplate: {
    id: 'it-XXX',
    name: 'Cordless drill, 20V',
    category: 'tools',
    room: 'garage',
    location: 'Garage · shelf 2 · bin 3',
    purchased: '2024-03-11',
    pricePaidUsd: 129,
    retailer: 'Home Depot',
    condition: 'good',
    warrantyUntil: '2027-03-11',
    estValueUsd: 74,
    lastTouched: '2026-09-02',
    serial: 'SN-88213B',
  },
  roomTemplate: {
    id: 'garage',
    label: 'Garage',
    sqft: 400,
    itemCount: 0,
    notes: 'Wide doorway photo taken; swept clockwise from the entrance.',
  },
  categories: [
    'electronics',
    'appliance',
    'furniture',
    'kitchenware',
    'tools',
    'sports',
    'clothing',
    'decor',
    'documents',
    'misc',
  ],
  conditionScale: [
    { level: 'like-new', definition: 'No visible wear; would pass as unopened or barely used.' },
    { level: 'good', definition: 'Normal wear from regular use; fully functional, nothing to flag.' },
    { level: 'fair', definition: 'Visible wear or a known minor issue; still usable as intended.' },
    { level: 'worn', definition: 'Heavy wear, age, or a known functional problem; on the way out.' },
  ],
  whatToDoWithTheFile: [
    'Keep it local. It is your data — save it wherever you keep personal files, not in a shared or hosted location unless you choose to.',
    'Paste the filled-in JSON into any agent alongside the /cartography/home/demo.json shape to get the same summaries: valuation rollups, density score, duplicate detection, sell/lend drafts.',
    'Nothing is uploaded to PointCast. This page collects nothing — there is no submit button and no server-side storage of what you record.',
  ],
  guardrails: [
    'Sensitive zones are excluded by design — you decide what counts as sensitive, the kit never asks for it.',
    'No photo, barcode scan, or note leaves your device through this page. It is a protocol and a template, not a collection tool.',
    'Skip is always a valid answer. An incomplete room index is still useful; a room you refused to touch stays untouched.',
    'Prices and values you record are estimates for your own reference, not appraisals.',
  ],
} as const;

export function homeFieldKitJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: HOME_FIELD_KIT.title,
    description: HOME_FIELD_KIT.purpose,
    step: HOME_FIELD_KIT.protocol.map((s) => ({
      '@type': 'HowToStep',
      position: s.step,
      name: s.label,
      text: s.detail,
    })),
  };
}
