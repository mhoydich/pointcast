/**
 * PointCast Commons — common-spaces registry, wishlist, give-back ledger
 * for the 25-mile participation radius.
 *
 * First principles: access first, ownership last. Receipts over promises.
 * Buy land last; map it, befriend it, steward it, then own only what
 * stewardship requires. The smallest useful unit is a bench.
 */

export type CommonSpace = {
  slug: string; name: string;
  kind: 'library' | 'park' | 'beach' | 'court' | 'plaza' | 'overlook' | 'civic';
  city: string; access: string; hours: string; pointcastNote: string;
};

export const CURRENT_COMMONS: CommonSpace[] = [
  { slug: 'es-public-library', name: 'El Segundo Public Library', kind: 'library', city: 'El Segundo', access: 'Free, no card required to sit and read.', hours: 'Tue–Sat, posted at the door', pointcastNote: 'Marine Layer Week 04 sits in the second-floor reading room.' },
  { slug: 'es-recreation-park', name: 'Recreation Park', kind: 'park', city: 'El Segundo', access: 'Open, free; pickleball courts first-come, first-served.', hours: 'Dawn to 10 PM', pointcastNote: 'Court Craft and Marine Layer Week 07 use the courts here.' },
  { slug: 'es-library-park', name: 'Library Park', kind: 'park', city: 'El Segundo', access: 'Open, free; benches and lawn under the pines.', hours: 'Dawn to dusk', pointcastNote: 'Quiet spillover for Library Quiet Hour.' },
  { slug: 'imperial-overlook', name: 'Imperial Avenue Dunes Overlook', kind: 'overlook', city: 'El Segundo', access: 'Open, free; bring a layer.', hours: 'Always', pointcastNote: 'Marine Layer Week 03 — Imperial Blue Hour.' },
  { slug: 'el-porto', name: 'El Porto Beach', kind: 'beach', city: 'Manhattan Beach', access: 'Public beach; metered street parking.', hours: 'Always', pointcastNote: 'Marine Layer Week 05 — directly under the LAX 25R approach.' },
  { slug: 'plaza-el-segundo', name: 'Plaza El Segundo', kind: 'plaza', city: 'El Segundo', access: 'Privately-owned plaza, publicly walkable; benches at the north fountain.', hours: 'Dawn to late', pointcastNote: 'First Sit lives at the north fountain bench before commerce wakes.' },
  { slug: 'mb-pier', name: 'Manhattan Beach Pier', kind: 'overlook', city: 'Manhattan Beach', access: 'Open, free; walk to the end and back.', hours: 'Always', pointcastNote: 'Marine Layer Week 08 — Pier Closer; the radius edge.' },
  { slug: 'mb-library', name: 'Manhattan Beach Library', kind: 'library', city: 'Manhattan Beach', access: 'Free; quiet rooms bookable by request.', hours: 'Posted at the door', pointcastNote: 'Backup quiet room for Pier Table Build Night.' },
  { slug: 'hilltop-park', name: 'Hilltop Park', kind: 'park', city: 'El Segundo', access: 'Open, free; the highest sit in town.', hours: 'Dawn to dusk', pointcastNote: 'First Bench pilot site — west-facing bench at the SW corner.' },
  { slug: 'powerline-easement', name: 'Powerline Easement Walk', kind: 'overlook', city: 'El Segundo', access: 'Public right-of-way along the easement; walk west.', hours: 'First light to dusk', pointcastNote: 'Marine Layer Week 02 — Powerline Walk toward Chevron.' },
];

export type CommonsWishlistItem = {
  slug: string; name: string;
  kind: 'parcel' | 'easement' | 'storefront' | 'bench' | 'court' | 'garden';
  whyItMatters: string; approxCost: string; triggersAcquisition: string;
};

export const COMMONS_WISHLIST: CommonsWishlistItem[] = [
  { slug: 'free-pavilion-corner', name: 'A corner lot for a permanent free pavilion', kind: 'parcel', whyItMatters: 'A roofed gathering place with no rental fee, ever. Counters the slow privatization of meeting space inside the radius.', approxCost: 'Under $400k for an in-town corner; pavilion build separate.', triggersAcquisition: 'After 100 logged give-backs and a willing seller within walking distance of a UES session.' },
  { slug: 'beach-access-easement', name: 'A beach-access easement to keep public passage open', kind: 'easement', whyItMatters: 'Coastal Act protects vertical access in theory; private property quietly closes it in practice.', approxCost: 'Variable; sometimes donated by friendly owners.', triggersAcquisition: 'When a real path is identified as actively closing.' },
  { slug: 'main-street-meeting-room', name: 'A Main Street storefront for a free meeting room', kind: 'storefront', whyItMatters: 'A permanent UES home: a door anyone can walk into for a session, a sit, a build night.', approxCost: 'Lease first ($3–6k/mo), buy later.', triggersAcquisition: 'After one full UES year and a stewardship circle willing to keep hours.' },
  { slug: 'tool-library-space', name: 'A tool library extension of Hands & Trades', kind: 'storefront', whyItMatters: 'Most repairs fail for lack of one tool. A shelf, a clipboard, a return tag.', approxCost: 'Sub-lease in a friendly garage to start.', triggersAcquisition: 'After 25 logged tool donations.' },
  { slug: 'pollinator-garden-parcel', name: 'A pollinator garden parcel for the Honey & Garden track', kind: 'garden', whyItMatters: 'A native-planting demo plot inside the radius; ties to local honey and the Honey League season.', approxCost: 'Often a parks partnership, not a purchase.', triggersAcquisition: 'After one season of Honey League and a parks-department conversation.' },
  { slug: 'one-more-court', name: 'One more pickleball court inside the radius', kind: 'court', whyItMatters: 'Demand outpaces supply at Recreation Park. One more court is the difference between a five-minute wait and a one-hour wait.', approxCost: 'Either a parks partnership or a private slab; $40–80k built.', triggersAcquisition: 'When Paddle Tide profiles cross 100 and Court Craft can show usage data.' },
  { slug: 'dawn-sit-benches', name: 'A small ring of dawn-sit benches at hilltop locations', kind: 'bench', whyItMatters: 'The smallest useful unit. A bench at Hilltop, the Imperial overlook, and one quiet plaza is a Marine Layer infrastructure for the cost of a paddle.', approxCost: '$1–3k per bench, with parks permission.', triggersAcquisition: 'After three months of Marine Layer attendance and a parks-department signoff.' },
];

export type GiveBackKind = { kind: string; unit: string; example: string; ledgerWeight: number };

export const GIVE_BACK_LEDGER_KINDS: GiveBackKind[] = [
  { kind: 'Hours', unit: 'one volunteer hour at a public space', example: 'Two hours weeding at Library Park.', ledgerWeight: 1 },
  { kind: 'Dollars', unit: 'one dollar to the commons fund', example: '$25 toward the next bench.', ledgerWeight: 1 },
  { kind: 'Objects', unit: 'one durable object donated to a public shelf', example: 'A loaner paddle to the library shelf.', ledgerWeight: 2 },
  { kind: 'Easement', unit: 'one signed grant of public passage', example: 'A neighbor signs a perpetual easement across their side yard to a beach path.', ledgerWeight: 25 },
  { kind: 'Expertise', unit: 'one hour of pro bono real-estate, legal, or design work', example: 'A title search done for free.', ledgerWeight: 3 },
  { kind: 'Custody', unit: 'one month stewarding a space’s calendar or upkeep', example: 'Owning the Hilltop Park bench wipe-down for August.', ledgerWeight: 4 },
];

export const COMMONS_PRINCIPLES = [
  'Access is the goal. Acquisition is one tool among many — usually the last one.',
  'A common space is one nobody has to pay a gatekeeper to use. If it requires a key, it is not yet common.',
  'Receipts over promises. Every give-back is logged before it is celebrated, with a name, a date, and a unit.',
  'Twenty-five miles is the boundary because trust needs proximity. The fund does not buy what stewards cannot walk to.',
  'Map it, befriend it, steward it, then own only what stewardship requires. We do not buy what a relationship can hold.',
  'Permanent affordability beats one-time generosity. When we own land, we hold it in a community land trust shell so it stays common past us.',
  'The smallest useful unit is a bench. Start there. A bench precedes a pavilion; a pavilion precedes a parcel.',
];

export type FirstBenchPilot = {
  name: string; location: string; why: string; cost: string;
  ledgerThreshold: number; steward: string;
  status: 'concept' | 'committed' | 'placed' | 'open';
};

export const FIRST_BENCH = {
  name: 'First Bench',
  location: 'Hilltop Park, southwest corner — facing the marine layer',
  why: 'The highest sit in town has no west-facing bench. A single bench turns a parking lot view into a Marine Layer anchor and proves the give-back loop works at the smallest possible unit.',
  cost: '$1,800 (bench + parks-department permit + plaque)',
  ledgerThreshold: 25,
  steward: 'Marine Layer cohort',
  status: 'concept',
} as const satisfies FirstBenchPilot;

export type LedgerEntry = {
  date: string; giver: string; kind: string; unit: string;
  weight: number; note: string; toward: string;
};

export const LEDGER_SEED: LedgerEntry[] = [
  { date: '2026-04-21', giver: 'Mike H.', kind: 'Hours', unit: '2 hours mapping', weight: 2, note: 'Walked the radius and posted the first ten common spaces.', toward: 'Phase 0 · Map' },
  { date: '2026-04-25', giver: 'Anonymous', kind: 'Dollars', unit: '$50', weight: 50, note: 'First donation; held against First Bench at Hilltop Park.', toward: 'First Bench' },
  { date: '2026-04-27', giver: 'B. (Library Quiet Hour)', kind: 'Custody', unit: '1 month', weight: 4, note: 'Stewarding the library quiet-hour calendar through May.', toward: 'Phase 1 · Steward' },
  { date: '2026-04-29', giver: 'J. (Court Craft)', kind: 'Objects', unit: '1 paddle', weight: 2, note: 'Donated a Sea Glass Control loaner to the library shelf.', toward: 'Phase 1 · Steward' },
  { date: '2026-05-01', giver: 'Marine Layer cohort', kind: 'Hours', unit: '6 sit-hours', weight: 6, note: 'First Sit attendance receipts, week of 4/27.', toward: 'First Bench' },
];

export const COMMONS_ACQUISITION_THESIS = [
  { phase: 'Phase 0 · Map', threshold: 'months 0–6', detail: 'Public registry of existing commons inside the radius. No fundraising. No acquisition. Build the give-back ledger.' },
  { phase: 'Phase 1 · Steward', threshold: 'after 50 logged give-backs', detail: 'Name a stewardship circle (5–9 people). Pursue three wishlist items without buying. Begin parks-department conversations.' },
  { phase: 'Phase 2 · Vehicle', threshold: 'after 100 give-backs and one offered easement', detail: 'Open a community land trust (CLT) shell entity. Publish governance. Accept first easement gift.' },
  { phase: 'Phase 3 · First parcel', threshold: 'after 12 months of prior stewardship of the target space', detail: 'Acquire one parcel under $400k, walking distance from a UES session, with public-passage potential. Land in the CLT, improvements rented at cost.' },
  { phase: 'Phase 4 · Open hours', threshold: 'after one parcel is held for one year', detail: 'No new acquisitions until the first parcel has documented public open hours. The stewardship circle holds the keys; the door holds the test.' },
];
