/**
 * Strand Corridor — the cross-instance federation surface.
 *
 * The Marvin Braude Bike Trail (the Strand) is a continuous 22-mile
 * coastal linear park stretching from Will Rogers State Beach to Torrance
 * Beach. It connects four candidate instance cities — El Segundo, Manhattan
 * Beach, Hermosa Beach, Redondo Beach — as one continuous corridor.
 *
 * This page is the corridor's own surface: not an instance, but the
 * federation seam between instances. The MB and HB scaffolds both
 * reference this surface; this is where the cross-instance commitments
 * (drills, gatherings, Common Forms commissions, ledger schemas) live.
 */

export const CORRIDOR_META = {
  title: 'The Strand Corridor',
  subtitle: 'Cross-instance federation seam · 22 miles · 4 candidate cities',
  thesis: 'The Strand — formally the Marvin Braude Bike Trail — is a continuous 22-mile coastal linear park running from Will Rogers State Beach in the north to Torrance Beach in the south. Of those 22 miles, approximately 7 sit inside the four candidate Pacific-coast UES fork cities: El Segundo (~1 mi), Manhattan Beach (~2 mi), Hermosa Beach (~2 mi), Redondo Beach (~2 mi). The corridor is the only piece of South Bay infrastructure that already physically threads these four municipalities together. This page treats the Strand not as a feature of any single instance but as a federation surface: the shared substrate that allows four separate UES fork instances to become one functional corridor if they choose to.',
  paperNumber: 'UES-Federation-01',
  date: '2026-05-07',
  parents: ['UES-WP-2026-11 The Forkable Radius', 'UES-Fork-MB-01 Manhattan Beach', 'UES-Fork-HB-02 Hermosa Beach'],
};

export const CORRIDOR_FACTS = {
  formalName: 'Marvin Braude Bike Trail',
  alsoCalled: 'The Strand',
  totalLength: '22 miles continuous, paved, two-lane (pedestrian + bicycle), separated from vehicle traffic',
  northTerminus: 'Will Rogers State Beach, Pacific Palisades',
  southTerminus: 'Torrance Beach',
  managingAgencies: 'Los Angeles County Department of Beaches and Harbors (most segments); City of Santa Monica (its own segment); each beach city manages its frontage and adjacent plazas.',
  namedFor: 'Marvin Braude (1920-2005), Los Angeles City Council member 1965-1997, longtime advocate of the bike-path system.',
  builtPiecemeal: 'Constructed segment by segment from the late 1960s through the 1980s as separate beach-city projects, then formalized as one continuous trail in the 1980s under the Braude name.',
};

export const FOUR_CITY_SEGMENTS = [
  { city: 'El Segundo', segmentMiles: '~1.0', primaryAccess: 'Grand Ave / 45th St beach lots; the LAX dunes mark the north transition', civicHooks: 'El Porto sand (under LAX 25R approach — Marine Layer Week 5 Flight-Path Sit anchor); ES Beach lifeguard tower line', strandIntegration: 'lightest of the four; the corridor brushes ES on its westernmost edge', uesInstance: 'pointcast.xyz (parent / reference instance)' },
  { city: 'Manhattan Beach', segmentMiles: '~2.0', primaryAccess: 'Manhattan Beach Pier base; 2nd–45th St numbered access points', civicHooks: 'MB Pier + Roundhouse Aquarium (Marine Layer Week 8 Pier Closer); 30th St First Bench candidate site', strandIntegration: 'high — two miles of dense Strand frontage with the most cohesive plaza system', uesInstance: '/manhattan-beach (UES-Fork-MB-01)' },
  { city: 'Hermosa Beach', segmentMiles: '~2.0', primaryAccess: 'Hermosa Pier + Pier Plaza; 8th St First Bench candidate site; 35th St (north transition to MB)', civicHooks: 'Hermosa Pier (corridor midpoint, federation council site); Surfers Walk of Fame plaques along Pier Plaza', strandIntegration: 'maximum — the densest civic concourse on the four-city corridor', uesInstance: '/hermosa-beach (UES-Fork-HB-02)' },
  { city: 'Redondo Beach', segmentMiles: '~2.0 (corridor end)', primaryAccess: 'Redondo Beach Pier complex; Veterans Park; the Esplanade overlook', civicHooks: 'Redondo Pier (south anchor); Seaside Lagoon; King Harbor partial integration', strandIntegration: 'high; corridor terminates at Torrance Beach just south of Redondo Pier', uesInstance: '(future fork — UES-Fork-RB-03 templated; awaiting local Land)' },
];

export const FEDERATION_COMMITMENTS = [
  { category: 'Quarterly four-instance sit', detail: 'A cross-instance Marine Layer cohort gathering, rotating among the four pier sites: ES Beach Tower (Q1), MB Pier (Q2), Hermosa Pier (Q3), Redondo Pier (Q4). Each instance hosts once per year. Same 4-7-8 breath protocol; one round of names; one shared artifact contributed to a corridor-wide ledger.' },
  { category: 'Annual federation council', detail: 'Held at the Hermosa Pier (corridor geographic midpoint) on the autumnal equinox each year. One delegate per instance plus open seats for cohort members. Agenda: schema review, drill calendar, Common Forms commission queue, conflict resolution. Roberts of Order procedural minimum; Quaker-meeting deliberative norm.' },
  { category: 'Joint Mutual Aid Mesh drill', detail: 'One full-corridor drill per year. Scenario rotates: coastal flooding (likely); earthquake (Newport-Inglewood Fault traces inland); LAX runway incursion (ES specific); long-cycle power outage (all four). The Strand functions as the egress corridor when inland evacuation is required.' },
  { category: 'Shared Common Forms commissions', detail: 'Bench rings every ~0.5 mile along the four-city corridor (~14 ringsites total). Signage cooperative — one consistent kiosk format across instances. Observation-deck handoffs at city-line transitions. Each instance funds its own segment via local ledger; shared form vocabulary inherited from the El Segundo template.' },
  { category: 'Cross-instance give-back ledger', detail: 'Each instance keeps its own ledger; a federation summary surface aggregates the six categories (Hours · Dollars · Objects · Easement · Expertise · Custody) across the four instances. Coastal stewardship — beach clean-ups, Strand maintenance, sand-fence rebuild after high-tide events — is the canonical cross-instance Custody category.' },
  { category: 'Shared schemas, federated state', detail: 'L1 federation protocol from /forkable-radius: each instance exposes its data at predictable JSON paths. The corridor surface aggregates the four. No central database; no single point of failure. The corridor is a coordination overlay, not a unified system.' },
];

export const STRAND_PRINCIPLES = [
  'The corridor is not the federation. The corridor is the substrate; the federation is the commitment to use it together. Four instances could share the Strand without federating; this surface is for the case where they choose to.',
  'No instance is the corridor capital. Hermosa is the geographic midpoint and natural meeting site, but no instance owns the corridor. Each instance manages its own segment, federates around shared commitments, retains the right to honestly retire.',
  'The Strand outlasts any one instance. If an instance fails or chooses to retire, the corridor remains. The bench rings, the sit cadence, the Mutual Aid drills, the give-back schemas — these are designed to survive instance churn.',
  'Coastal stewardship is the default Custody category. The Strand is a public coastal park exposed to sand erosion, storm damage, and high-tide flooding. The cross-instance ledger\'s default Custody work is whatever the Strand needs that quarter.',
  'Federation is voluntary, additive, and revocable. No instance is obligated to join the corridor federation. Joining adds shared commitments without removing local autonomy. Leaving requires no permission, only honest disclosure.',
];

export const STRAND_RISKS = [
  { risk: 'Sea-level rise', detail: 'NOAA mid-range projection: 1-2 feet of sea-level rise along Southern California by 2100. Multiple Strand segments, particularly at low-tide pier-base plazas, face periodic inundation. The federation council should treat this as a 50-year stewardship problem, not a single-instance problem.' },
  { risk: 'Coastal-bluff erosion', detail: 'Hermosa and Manhattan Beach south of the pier face localized bluff retreat during high-tide + winter-storm events. Sand-fence rebuild and dune-grass replanting are recurring federation Custody work.' },
  { risk: 'Bicycle / pedestrian conflict', detail: 'The Strand is two-lane but heavily trafficked on weekends. Cross-instance signage, mile-marker bench rings, and shared right-of-way norms reduce conflict; the Common Forms signage commission is partially a conflict-mitigation form.' },
  { risk: 'Wildfire smoke transport', detail: 'Inland fires (Eaton 2025; future Santa Ana–driven events) transport smoke to the coast on offshore winds. The Strand becomes the South Bay\'s smoke-refuge corridor when ocean breeze is on; the federation Mutual Aid Mesh should pre-position N95 distribution at pier-base plazas.' },
  { risk: 'Privatization pressure', detail: 'Coastal access is a long-running California Coastal Commission battle. The federation\'s public position: the Strand is non-negotiably public. Any encroachment by waterfront private development is a federation-level concern, not single-instance.' },
];

export const NEXT_STEPS = [
  { step: 'Year 1 — Two of four instances live', detail: 'ES is active. MB scaffold complete; awaiting MB local Land. HB scaffold complete; awaiting HB local Land. Year 1 success criterion: at least two of four instances have run their first 90-day plan. This page is the patient-stake-in-the-ground for the federation regardless of when local Lands commit.' },
  { step: 'Year 2 — First quarterly four-instance sit', detail: 'Even with three instances live (ES + MB + HB), the first quarterly sit can run. Hermosa Pier autumnal equinox 2027 is the candidate inaugural date. Redondo cohort members welcome to attend even pre-fork.' },
  { step: 'Year 3 — Redondo fork templated and shipped', detail: 'UES-Fork-RB-03 (Redondo Beach instance) is templated already by the MB / HB pattern. Cloning the scaffold is approximately one weekend of writing time; the bottleneck is the local Land, not the surface.' },
  { step: 'Year 5 — First federation Common Forms commission', detail: 'A cross-instance bench ring at the Hermosa Pier base, funded across all four instances\' ledgers, is the canonical first cross-instance commission. Trigger condition: 100 give-back receipts logged across the four ledgers combined.' },
  { step: 'Year 10 — The corridor is one functional layer', detail: 'Quarterly sits, annual council, annual drill, shared signage, ~14 bench rings, federation ledger summary, no central database, no single point of failure. The four-instance corridor demonstrating that parallel civic infrastructure can be coordinated without being centralized.' },
];

export const REFERENCES = [
  { id: 'pointcast-forkable', cite: 'University of El Segundo. (2026). *The Forkable Radius*. UES-WP-2026-11. https://pointcast.xyz/forkable-radius' },
  { id: 'pointcast-mb', cite: 'University of El Segundo. (2026). *Manhattan Beach Instance*. UES-Fork-MB-01. https://pointcast.xyz/manhattan-beach' },
  { id: 'pointcast-hb', cite: 'University of El Segundo. (2026). *Hermosa Beach Instance*. UES-Fork-HB-02. https://pointcast.xyz/hermosa-beach' },
  { id: 'pointcast-mutual-aid', cite: 'University of El Segundo. (2026). *Mutual Aid Mesh*. UES-Shape-03. https://pointcast.xyz/mutual-aid-mesh' },
  { id: 'pointcast-common-forms', cite: 'University of El Segundo. (2026). *Common Forms · Civic Architecture Plan*. https://pointcast.xyz/common-forms' },
  { id: 'la-county-strand', cite: 'Los Angeles County Department of Beaches and Harbors. (Continuing). *Marvin Braude Bike Trail*. beaches.lacounty.gov.' },
  { id: 'noaa-slr', cite: 'NOAA. (Continuing). *Sea Level Rise Viewer · California Coastal Projections*. coast.noaa.gov/slr.' },
  { id: 'ca-coastal', cite: 'California Coastal Commission. (Continuing). *Public Access Program*. coastal.ca.gov.' },
];

export const CORRIDOR_NOTES = {
  uesNote: 'The Strand Corridor is a federation surface, not an instance. It exists because /manhattan-beach and /hermosa-beach both reference it, and because the federation needs a place to live that is not owned by any single instance. This page is co-administered.',
  invitation: 'If you are part of any of the four candidate corridor instances and want to help convene the first quarterly four-instance sit (planned for Hermosa Pier, autumnal equinox 2027), email mh@pointcast.xyz. Local Lands are still being recruited for MB, HB, and Redondo.',
};
