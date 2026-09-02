/**
 * Fictional demo household for the Home Cartography concept.
 * Every item, price, and person here is invented. No real inventory
 * data is collected anywhere in this surface.
 */

export const HOME_CARTOGRAPHY_DEMO_UPDATED_AT = '2026-08-14T21:00:00Z';

export interface DemoItem {
  id: string;
  name: string;
  category: string;
  room: string;
  location: string;
  purchased: string;
  pricePaidUsd: number;
  retailer: string;
  condition: 'like-new' | 'good' | 'fair' | 'worn';
  warrantyUntil: string | null;
  estValueUsd: number;
  lastTouched: string;
  serial?: string;
}

export const DEMO_HOUSE = {
  id: 'home-cartography-demo-dune-street',
  label: 'The Dune Street House',
  note: 'Fictional 3-bed household in a beach town. Scanned in one weekend pass: barcodes where present, computer vision for the rest, receipts backfilled from email.',
  squareFeet: 1450,
  rooms: [
    { id: 'living', label: 'Living room', sqft: 320 },
    { id: 'kitchen', label: 'Kitchen', sqft: 180 },
    { id: 'office', label: 'Office', sqft: 140 },
    { id: 'bedroom', label: 'Primary bedroom', sqft: 220 },
    { id: 'garage', label: 'Garage', sqft: 400 },
  ],
} as const;

export const DEMO_ITEMS: DemoItem[] = [
  { id: 'it-001', name: 'OLED TV, 65"', category: 'electronics', room: 'living', location: 'media wall', purchased: '2024-11-29', pricePaidUsd: 1499, retailer: 'Best Buy', condition: 'like-new', warrantyUntil: '2026-11-29', estValueUsd: 780, lastTouched: '2026-08-13', serial: 'SN-88213B' },
  { id: 'it-002', name: 'Leather sofa, 3-seat', category: 'furniture', room: 'living', location: 'north wall', purchased: '2021-05-02', pricePaidUsd: 2200, retailer: 'Article', condition: 'good', warrantyUntil: null, estValueUsd: 850, lastTouched: '2026-08-14' },
  { id: 'it-003', name: 'Record player', category: 'electronics', room: 'living', location: 'sideboard', purchased: '2022-12-18', pricePaidUsd: 349, retailer: 'Turntable Lab', condition: 'good', warrantyUntil: null, estValueUsd: 210, lastTouched: '2026-08-09' },
  { id: 'it-004', name: 'Espresso machine', category: 'appliance', room: 'kitchen', location: 'counter, left of sink', purchased: '2023-03-14', pricePaidUsd: 699, retailer: 'Williams Sonoma', condition: 'good', warrantyUntil: '2026-03-14', estValueUsd: 380, lastTouched: '2026-08-14', serial: 'EM-4471' },
  { id: 'it-005', name: 'Stand mixer', category: 'appliance', room: 'kitchen', location: 'pantry, bottom shelf', purchased: '2019-12-25', pricePaidUsd: 429, retailer: 'gift', condition: 'good', warrantyUntil: null, estValueUsd: 220, lastTouched: '2025-11-27' },
  { id: 'it-006', name: 'Chef knife set', category: 'kitchenware', room: 'kitchen', location: 'knife block', purchased: '2022-06-01', pricePaidUsd: 310, retailer: 'Korin', condition: 'good', warrantyUntil: null, estValueUsd: 180, lastTouched: '2026-08-14' },
  { id: 'it-007', name: 'Laptop, 14"', category: 'electronics', room: 'office', location: 'desk', purchased: '2025-10-30', pricePaidUsd: 1999, retailer: 'Apple', condition: 'like-new', warrantyUntil: '2028-10-30', estValueUsd: 1450, lastTouched: '2026-08-14', serial: 'C02-99XT' },
  { id: 'it-008', name: 'Monitor, 32" 4K', category: 'electronics', room: 'office', location: 'desk', purchased: '2024-01-12', pricePaidUsd: 899, retailer: 'Amazon', condition: 'good', warrantyUntil: '2027-01-12', estValueUsd: 460, lastTouched: '2026-08-14' },
  { id: 'it-009', name: 'USB-C charger, 65W', category: 'electronics', room: 'office', location: 'desk drawer 1', purchased: '2024-02-02', pricePaidUsd: 45, retailer: 'Amazon', condition: 'good', warrantyUntil: null, estValueUsd: 18, lastTouched: '2026-07-01' },
  { id: 'it-010', name: 'USB-C charger, 65W', category: 'electronics', room: 'bedroom', location: 'nightstand', purchased: '2024-06-15', pricePaidUsd: 45, retailer: 'Amazon', condition: 'good', warrantyUntil: null, estValueUsd: 18, lastTouched: '2026-08-14' },
  { id: 'it-011', name: 'USB-C charger, 65W', category: 'electronics', room: 'garage', location: 'workbench bin 2', purchased: '2025-01-20', pricePaidUsd: 39, retailer: 'Amazon', condition: 'like-new', warrantyUntil: null, estValueUsd: 20, lastTouched: '2025-02-01' },
  { id: 'it-012', name: 'Mattress, queen', category: 'furniture', room: 'bedroom', location: 'bed frame', purchased: '2023-08-20', pricePaidUsd: 1295, retailer: 'Avocado', condition: 'good', warrantyUntil: '2033-08-20', estValueUsd: 400, lastTouched: '2026-08-14' },
  { id: 'it-013', name: 'Road bike', category: 'sports', room: 'garage', location: 'wall hook A', purchased: '2022-04-10', pricePaidUsd: 2400, retailer: 'local bike shop', condition: 'good', warrantyUntil: null, estValueUsd: 1100, lastTouched: '2026-08-10', serial: 'WTU-3319' },
  { id: 'it-014', name: 'Exercise bike', category: 'sports', room: 'garage', location: 'back corner', purchased: '2021-01-05', pricePaidUsd: 1895, retailer: 'Peloton', condition: 'good', warrantyUntil: null, estValueUsd: 520, lastTouched: '2024-03-02', serial: 'PL-70233' },
  { id: 'it-015', name: 'Cordless drill, 20V', category: 'tools', room: 'garage', location: 'shelf 2, bin 3', purchased: '2024-03-11', pricePaidUsd: 129, retailer: 'Home Depot', condition: 'good', warrantyUntil: '2027-03-11', estValueUsd: 74, lastTouched: '2026-06-18' },
  { id: 'it-016', name: 'Tape measure, 25ft', category: 'tools', room: 'garage', location: 'shelf 2, bin 1', purchased: '2020-07-04', pricePaidUsd: 24, retailer: 'Home Depot', condition: 'good', warrantyUntil: null, estValueUsd: 10, lastTouched: '2026-06-18' },
  { id: 'it-017', name: 'Tape measure, 16ft', category: 'tools', room: 'office', location: 'desk drawer 2', purchased: '2023-02-11', pricePaidUsd: 15, retailer: 'Amazon', condition: 'good', warrantyUntil: null, estValueUsd: 6, lastTouched: '2024-09-30' },
  { id: 'it-018', name: 'Tile saw', category: 'tools', room: 'garage', location: 'floor, under workbench', purchased: '2023-09-03', pricePaidUsd: 289, retailer: 'Harbor Freight', condition: 'fair', warrantyUntil: null, estValueUsd: 120, lastTouched: '2023-10-15' },
  { id: 'it-019', name: 'Water heater, 50gal', category: 'appliance', room: 'garage', location: 'utility corner', purchased: '2015-06-01', pricePaidUsd: 1050, retailer: 'installed with house', condition: 'worn', warrantyUntil: null, estValueUsd: 150, lastTouched: '2026-08-14' },
  { id: 'it-020', name: 'Surfboard, 7\'2"', category: 'sports', room: 'garage', location: 'ceiling rack', purchased: '2023-05-27', pricePaidUsd: 780, retailer: 'local shaper', condition: 'good', warrantyUntil: null, estValueUsd: 420, lastTouched: '2026-08-12' },
];

function round(n: number): number {
  return Math.round(n);
}

const totalValue = DEMO_ITEMS.reduce((sum, item) => sum + item.estValueUsd, 0);
const totalPaid = DEMO_ITEMS.reduce((sum, item) => sum + item.pricePaidUsd, 0);

export const demoRollups = {
  itemCount: DEMO_ITEMS.length,
  totalPaidUsd: round(totalPaid),
  totalEstValueUsd: round(totalValue),
  byRoom: DEMO_HOUSE.rooms.map((room) => {
    const items = DEMO_ITEMS.filter((item) => item.room === room.id);
    const value = items.reduce((sum, item) => sum + item.estValueUsd, 0);
    return {
      room: room.id,
      label: room.label,
      sqft: room.sqft,
      itemCount: items.length,
      estValueUsd: round(value),
      itemsPerHundredSqft: Math.round((items.length / room.sqft) * 1000) / 10,
    };
  }),
  densityScore: {
    itemsPerHundredSqft: Math.round((DEMO_ITEMS.length / DEMO_HOUSE.squareFeet) * 1000) / 10,
    note: 'Indexed items only — a full scan of a real household lands in the hundreds. The score tracks trend over time, not a universal good/bad line.',
    untouchedTwoYears: DEMO_ITEMS.filter((item) => item.lastTouched < '2024-08-14').map((item) => item.id),
  },
  duplicates: [
    { name: 'USB-C charger, 65W', count: 3, items: ['it-009', 'it-010', 'it-011'], suggestion: 'Three chargers across three rooms. Keep two, sell or donate one.' },
    { name: 'Tape measure', count: 2, items: ['it-016', 'it-017'], suggestion: 'Two tape measures, one untouched since 2024. Keep the 25ft.' },
  ],
  warrantyWatch: DEMO_ITEMS.filter((item) => item.warrantyUntil && item.warrantyUntil >= '2026-08-14')
    .map((item) => ({ id: item.id, name: item.name, warrantyUntil: item.warrantyUntil })),
  lifecycleFlags: [
    { id: 'it-019', name: 'Water heater, 50gal', flag: 'Eleven years old — past the typical 8-12 year service life. Budget for replacement before it decides for you.' },
  ],
};

export const demoSellFlow = {
  instruction: '"Sell the exercise bike."',
  item: 'it-014',
  why: 'Untouched since 2024-03-02, holding $520 of resale value in the garage corner.',
  generatedListing: {
    title: 'Peloton exercise bike — good condition, one owner',
    askUsd: 520,
    comps: 'Priced against 30-day local sold listings for the same model.',
    evidence: 'Photos, serial, purchase receipt, and condition history attach automatically from the index.',
    channels: ['Facebook Marketplace', 'OfferUp', 'Craigslist'],
  },
  note: 'The listing writes itself because the index already holds everything a buyer asks for.',
};

export const demoLendFlow = {
  request: 'A neighbor\'s agent asks: is a tile saw available to borrow this weekend?',
  match: 'it-018',
  response: 'Yes — tile saw, garage, under the workbench, last used 2023. Shared because the owner opted this item into a lendable-tools list; the rest of the index stays private.',
};

export const homeCartographyDemoJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  '@id': 'https://pointcast.xyz/cartography/home/demo#demo',
  name: 'Home Cartography demo index',
  description: 'A fictional fully-indexed household demonstrating the Home Cartography concept: item ledger, valuation rollups, density score, duplication detection, and a sell-one-item flow.',
  url: 'https://pointcast.xyz/cartography/home/demo',
  creativeWorkStatus: 'Draft',
  dateModified: HOME_CARTOGRAPHY_DEMO_UPDATED_AT,
  isPartOf: { '@type': 'WebPage', '@id': 'https://pointcast.xyz/cartography/home' },
  publisher: { '@type': 'Organization', name: 'PointCast', url: 'https://pointcast.xyz' },
};

/**
 * Receipts layer — the paper trail behind the index. Every receipt below is
 * invented alongside the household it reconciles against.
 */
export interface DemoReceipt {
  id: string;
  source: 'gmail' | 'amazon' | 'apple' | 'best-buy' | 'photo';
  merchant: string;
  date: string;
  totalUsd: number;
  itemIds: string[];
  status: 'matched' | 'unmatched' | 'needs-camera';
  note?: string;
}

export const DEMO_RECEIPTS: DemoReceipt[] = [
  { id: 'rc-001', source: 'best-buy', merchant: 'Best Buy', date: '2024-11-29', totalUsd: 1499, itemIds: ['it-001'], status: 'matched', note: 'Order confirmation email; serial matched the wall-mount photo on the first pass.' },
  { id: 'rc-002', source: 'apple', merchant: 'Apple', date: '2025-10-30', totalUsd: 1999, itemIds: ['it-007'], status: 'matched', note: 'Coverage end date came straight off the receipt — no warranty guesswork.' },
  { id: 'rc-003', source: 'amazon', merchant: 'Amazon', date: '2024-01-12', totalUsd: 899, itemIds: ['it-008'], status: 'matched', note: 'Monitor order; the receipt carried the model, the camera pass carried the desk.' },
  { id: 'rc-004', source: 'amazon', merchant: 'Amazon', date: '2024-02-02', totalUsd: 45, itemIds: ['it-009'], status: 'matched', note: 'First of three identical 65W charger orders — this is where the duplicate trail starts.' },
  { id: 'rc-005', source: 'amazon', merchant: 'Amazon', date: '2024-06-15', totalUsd: 45, itemIds: ['it-010'], status: 'matched', note: 'Second charger, reordered five months later because the first one was in another room.' },
  { id: 'rc-006', source: 'gmail', merchant: 'Home Depot', date: '2024-03-11', totalUsd: 129, itemIds: ['it-015'], status: 'matched', note: 'Emailed receipt; the 2020 tape measure predates the mailbox and matched by camera instead.' },
  { id: 'rc-007', source: 'gmail', merchant: 'Avocado', date: '2023-08-20', totalUsd: 1295, itemIds: ['it-012'], status: 'matched', note: 'Ten-year warranty registration lives on this receipt.' },
  { id: 'rc-008', source: 'photo', merchant: 'Williams Sonoma', date: '2023-03-14', totalUsd: 699, itemIds: ['it-004'], status: 'matched', note: 'Paper receipt photographed inside the machine box; OCR pulled merchant, date, and total.' },
  { id: 'rc-009', source: 'amazon', merchant: 'Amazon', date: '2026-07-19', totalUsd: 38, itemIds: [], status: 'unmatched', note: 'Cable organizer, 6-pack. Nothing in the index looks like it — either consumed, gifted, or still in a drawer nobody has scanned.' },
  { id: 'rc-010', source: 'gmail', merchant: 'Harbor Freight', date: '2023-09-03', totalUsd: 289, itemIds: ['it-018'], status: 'needs-camera', note: 'Receipt found and priced, but the garage floor under the workbench has no confirmed photo yet. Flagged for the next camera pass.' },
];

const matchedReceipts = DEMO_RECEIPTS.filter((receipt) => receipt.status === 'matched');
const matchedItemIds = Array.from(new Set(matchedReceipts.flatMap((receipt) => receipt.itemIds)));
const matchedValue = DEMO_ITEMS
  .filter((item) => matchedItemIds.includes(item.id))
  .reduce((sum, item) => sum + item.estValueUsd, 0);

export const demoReceiptReconciliation = {
  receiptsIngested: DEMO_RECEIPTS.length,
  matchedItems: matchedItemIds.length,
  coveragePercentOfItems: round((matchedItemIds.length / DEMO_ITEMS.length) * 100),
  coveragePercentOfValue: round((matchedValue / totalValue) * 100),
  unmatched: DEMO_RECEIPTS.filter((receipt) => receipt.status === 'unmatched').map((receipt) => receipt.id),
  needsCamera: DEMO_RECEIPTS.filter((receipt) => receipt.status === 'needs-camera').map((receipt) => receipt.id),
  note: 'Receipts first, camera second: the mailbox already knows what was bought, for how much, and when. The camera pass only has to answer where it ended up.',
};

const INSURANCE_THRESHOLD_USD = 200;

const insuranceLines = DEMO_ITEMS
  .filter((item) => item.estValueUsd >= INSURANCE_THRESHOLD_USD)
  .slice()
  .sort((a, b) => b.estValueUsd - a.estValueUsd)
  .map((item) => ({
    itemId: item.id,
    name: item.name,
    serial: item.serial ?? null,
    room: DEMO_HOUSE.rooms.find((room) => room.id === item.room)?.label ?? item.room,
    purchased: item.purchased,
    pricePaidUsd: item.pricePaidUsd,
    estValueUsd: item.estValueUsd,
    receiptId: DEMO_RECEIPTS.find((receipt) => receipt.itemIds.includes(item.id))?.id ?? null,
  }));

export const demoInsuranceSchedule = {
  thresholdUsd: INSURANCE_THRESHOLD_USD,
  lines: insuranceLines,
  lineCount: insuranceLines.length,
  totalEstValueUsd: round(insuranceLines.reduce((sum, line) => sum + line.estValueUsd, 0)),
  coverageNote: 'Informational contents schedule for a fictional household — not an appraisal, policy, or claim document.',
};
