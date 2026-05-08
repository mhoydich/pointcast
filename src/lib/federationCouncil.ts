/**
 * Federation Council Charter — UES-Federation-05.
 *
 * Every Tier D work specifies a "joint stewardship circle." Every fork
 * instance specifies a "federation handshake." The Strand Corridor surface
 * specifies an "annual federation council." The LA28 paper specifies a
 * "council-owned boundary." None of these work without the council itself.
 *
 * This charter is the operating document for the federation council:
 * cadence, composition, decision protocol, conflict resolution, what the
 * council can and cannot decide, and the dissolution clause that keeps the
 * council from outliving its usefulness.
 */

export const CHARTER_META = {
  title: 'Federation Council Charter',
  subtitle: 'Operating procedure for the corridor federation\'s decision-making body',
  thesis: 'The Forkable Radius framework, the four-city Strand corridor, the sixteen Tier D works, the LA28 boundary — all assume a federation council that does not yet exist. This charter is the council\'s operating manual: when it meets, who attends, how it decides, what it can decide, what it must defer to instances, how conflicts are resolved, and how it dissolves itself if it ever stops being useful. The charter ratifies on first reading by three of the five corridor instances; it is amended by the same threshold; it is revoked by unanimous instance vote.',
  paperNumber: 'UES-Federation-05',
  date: '2026-05-07',
  parents: ['UES-WP-2026-11 The Forkable Radius', 'UES-Federation-01 Strand Corridor', 'UES-Federation-02 Giant Works'],
  status: 'DRAFT — pending ratification by three-of-five corridor instances',
};

export const PURPOSE = {
  why: 'A federation of independent civic instances needs a thin coordinating body to handle the small set of decisions that cannot be made by any single instance: cross-instance giant works, federation-wide drills, shared schemas, boundary maintenance with external bodies (LA28, Coastal Commission, philanthropic circles). Without the council, each instance must individually negotiate every cross-instance decision; the federation collapses into bilateral arrangements that do not scale.',
  whyNotMore: 'A council that decides too much becomes a centralized authority — the framework\'s explicit anti-precedent. The charter\'s primary discipline is what the council DOES NOT decide. Local Land remains sovereign within its instance; the council does not touch instance-internal programming, instance-internal cohort selection, instance-internal Commons ledger composition, or instance-internal stewardship circles.',
  whatItDoes: 'The council decides only what no single instance can decide alone: federation-wide commitments, cross-instance giant-works approval, boundary positions with external partners, schema additions to the federation L1 protocol, admission of new instances, and dissolution.',
};

export const COMPOSITION = {
  delegates: 'One voting delegate per active instance. Currently, with five instance scaffolds (ES + MB + HB + RB + Torrance) and the four candidates with completed scaffolds awaiting local Land, the council seats five voting delegates when all five instances are active.',
  selection: 'Each instance selects its delegate via its own stewardship-circle process. The framework does not prescribe how — some instances may elect; some may rotate; some may appoint by consensus. The federation recognizes whoever the instance sends.',
  termLength: 'Two-year staggered terms, with no consecutive-term limit (the council prizes continuity over forced rotation). Instance may recall its delegate at any time without federation review.',
  topicCodedSpecialists: 'Up to three non-voting topic-coded specialist seats per meeting, drawn from the curatorial / engineering / public-health / coastal-commission / philanthropic-staff orbit. Specialists speak; specialists do not vote. Specialist seats rotate per meeting based on agenda.',
  observerSeats: 'Open observer seats for any corridor cohort member who wishes to attend. Observers may not speak unless invited by the chair; observers may not vote.',
  chair: 'Rotates annually among the active instance delegates by lottery. The chair runs the meeting and breaks any tied vote (which can only occur on even-numbered councils with absent delegates). The chair has no other special authority.',
};

export const CADENCE = {
  primary: 'Annual full council meeting at the autumnal equinox, hosted at Hermosa Pier (the corridor midpoint). All five voting delegates attend; topic-coded specialists attend as agenda requires; observer seats open.',
  secondary: 'Quarterly virtual check-ins (one hour, video, simple agenda) at solstice + equinox dates. Delegates may attend; non-attendance is acceptable; minutes are published to the federation library regardless.',
  emergency: 'Any voting delegate may call an emergency virtual meeting with 72 hours notice. Emergency meetings can decide only items on the explicit emergency agenda (see CONFLICT_RESOLUTION below).',
  meetingDuration: 'Annual council: half-day (4 hours), structured 60-minute boundary review + 90-minute giant-works queue review + 60-minute schema/protocol review + 30-minute admission/dissolution review. Quarterly: 1 hour. Emergency: 30 minutes.',
};

export const DECISION_PROTOCOL = [
  { decision: 'Routine matters', threshold: 'Simple majority of voting delegates present', examples: 'Schema clarifications, calendar updates, federation library acquisitions, individual specialist invitations, observer-seat policy.' },
  { decision: 'Tier D giant-works approval', threshold: 'Three-of-five (3-of-N where N = number of active instances)', examples: 'Adopting the Bath House from prospective to active. Adopting the Tide-Pool Restoration. Approving a giant-work site change. Approving a giant-work substantial cost-band revision.' },
  { decision: 'Boundary positions with external partners', threshold: 'Three-of-five', examples: 'LA28 partnership decisions per work. CCC accelerated-review applications. Philanthropic match commitments above $1M federation share.' },
  { decision: 'Schema additions to L1 protocol', threshold: 'Three-of-five', examples: 'Adding new give-back categories. Adding new shape definitions. Adding new instance-status tiers.' },
  { decision: 'New instance admission', threshold: 'Unanimous (every existing instance must consent)', examples: 'Admitting Hawthorne, Lawndale, Palos Verdes, or any new candidate fork instance to the federation as a voting member.' },
  { decision: 'Charter amendment', threshold: 'Three-of-five and ratification by each instance\'s stewardship circle', examples: 'Changing decision thresholds. Changing chair-rotation method. Changing meeting cadence.' },
  { decision: 'Council dissolution', threshold: 'Unanimous (every existing instance must consent)', examples: 'The council determines it has ceased to be useful and dissolves itself. Each instance reverts to bilateral coordination.' },
  { decision: 'Single-instance veto reserved', threshold: '(any instance may unilaterally veto)', examples: 'Any decision affecting that instance\'s own territory, parcels, or constituent population. The council cannot site a Tier D work in El Segundo over El Segundo\'s objection. The veto cannot block work outside the vetoing instance\'s own territory.' },
];

export const SCOPE_OUT = [
  'The council DOES NOT decide instance-internal programming. Marine Layer cohort schedules, Commons ledger seed entries, individual receipt approvals, weekly sit anchor sites — all instance-sovereign.',
  'The council DOES NOT decide individual cohort membership. Each instance selects its own cohort by its own process.',
  'The council DOES NOT manage individual Commons ledgers. Federation-aggregate views may be published; per-receipt decisions stay at instance.',
  'The council DOES NOT review individual stewardship-circle composition within an instance. Each instance shapes its own stewardship.',
  'The council DOES NOT enforce timelines. Instances ship at their own pace. The council coordinates; it does not project-manage.',
  'The council DOES NOT levy fees, taxes, or assessments on instances. Federation Commons aggregation is voluntary at every step.',
  'The council DOES NOT control the brand or wordmark of any instance. Each instance is free to use, modify, or retire its own branding.',
];

export const CONFLICT_RESOLUTION = {
  betweenInstances: 'When two instances disagree on a federation-level matter (e.g., which city hosts a Tier D work, what schema field is canonical), the dispute goes to the next quarterly check-in for delegate-only deliberation. If unresolved at quarterly, escalates to the annual meeting. If unresolved at annual, the matter is tabled for one full year — federation patience over federation force.',
  betweenInstanceAndCouncil: 'When the council\'s decision affects an instance unfavorably, the instance may invoke the single-instance veto for matters within its territory. For matters outside its territory but affecting its constituents (e.g., a schema change that changes how its Commons ledger reports), the instance has standing for a 30-day reconsideration period — the council must take up the matter again at the next quarterly.',
  withExternalParty: 'When an external party (LA28, Coastal Commission, philanthropic foundation) creates a conflict with the federation, the council\'s primary instrument is patience. The federation operates on multi-decade horizons; most external parties operate on quarterly horizons; outlasting a conflict is often the simplest resolution. Where active negotiation is required, the chair represents the federation at the negotiating table; binding decisions require council vote per the threshold matrix.',
  emergencyAgenda: 'Emergency meetings may decide ONLY: (a) immediate threats to a federation Tier D work in active construction; (b) immediate philanthropic-window deadlines requiring response within the meeting cycle; (c) public-safety incidents affecting federation-shared infrastructure.',
};

export const PUBLIC_RECORD = {
  minutes: 'Every council meeting publishes minutes within 7 days. Minutes go to the federation library at /federation-council/minutes/{date}, JSON-mirrored.',
  votes: 'Per-delegate votes on every decision are published with minutes. Anonymous voting is not permitted; the federation operates on transparent record.',
  observerNotes: 'Observers may publish their own notes; the federation library accepts observer notes as a parallel-record stream, distinct from official minutes.',
  publicAccess: 'Annual meeting at Hermosa Pier is open to any corridor cohort member. Quarterly meetings are video-streamed publicly. Emergency meetings are video-recorded for retrospective public access.',
};

export const RATIFICATION = {
  threshold: 'Three-of-five corridor instances must ratify this charter through their own stewardship-circle process. With four scaffolded instances (MB, HB, RB, Torrance) currently awaiting local Land, ratification waits on at least three Lands committing.',
  firstCouncilTriggered: 'When three Lands commit and ratify, the first council meeting is convened at the next autumnal equinox. The framework defaults to the autumnal equinox following ratification, not the next-available equinox — the federation prefers patience.',
  draftAmendmentWindow: 'Until first ratification, this charter is amendable by single-Land proposal + cc convener consideration. Post-ratification, charter amendment follows the formal three-of-five threshold.',
};

export const DISSOLUTION = {
  why: 'The council exists to coordinate; if it ceases to coordinate (because instances drift apart, because no work requires federation-scale decisions, because the corridor identity itself dissolves), the council should dissolve too. Continuity for its own sake is not a federation value.',
  threshold: 'Unanimous instance vote. Every active instance must consent to council dissolution.',
  whatHappensAfter: 'Each instance reverts to bilateral coordination as needed. The federation library remains as a permanent public archive (a federation L0 commitment that survives council). Existing Tier D works mid-construction transition to single-instance custody (the host city). Endowed works continue to operate per their original endowment terms.',
  recoveryClause: 'A dissolved council may be reconvened by three-of-N consent of any existing instances at any future time. Dissolution is not extinction; it is hibernation.',
};

export const REFERENCES = [
  { id: 'pointcast-forkable', cite: 'University of El Segundo. (2026). *The Forkable Radius*. UES-WP-2026-11. https://pointcast.xyz/forkable-radius' },
  { id: 'pointcast-strand', cite: 'University of El Segundo. (2026). *The Strand Corridor*. UES-Federation-01. https://pointcast.xyz/strand-corridor' },
  { id: 'pointcast-giant', cite: 'University of El Segundo. (2026). *Giant Works*. UES-Federation-02. https://pointcast.xyz/giant-works' },
  { id: 'pointcast-cs', cite: 'University of El Segundo. (2026). *Corridor Strengths*. UES-Federation-03. https://pointcast.xyz/corridor-strengths' },
  { id: 'pointcast-giant-art', cite: 'University of El Segundo. (2026). *Giant Works · Art*. UES-Federation-04. https://pointcast.xyz/giant-works-art' },
  { id: 'pointcast-la28', cite: 'University of El Segundo. (2026). *LA28 Forcing Function*. UES-WP-2026-13. https://pointcast.xyz/la28-ready' },
  { id: 'roberts', cite: 'Robert, H. M. (Continuing). *Robert\'s Rules of Order, 12th Edition*. Public Affairs.' },
  { id: 'quaker', cite: 'Religious Society of Friends. (Continuing). *Faith and Practice on Meeting for Worship for Business*. Multiple yearly meetings.' },
  { id: 'ostrom', cite: 'Ostrom, E. (1990). *Governing the Commons: The Evolution of Institutions for Collective Action*. Cambridge University Press. The canonical theoretical reference for the federation\'s scale-and-discipline model.' },
];

export const CHARTER_NOTES = {
  uesNote: 'This charter is a draft pending ratification. Three corridor instances must ratify through their own stewardship-circle process before the council convenes for its first meeting. The charter is intentionally short (operating procedure should fit on one page in the worst case; this is roughly that length).',
  invitation: 'If you are a prospective local Land for any of the four scaffolded instances (MB, HB, RB, Torrance), or you have already committed and want to begin the ratification conversation, email mh@pointcast.xyz with subject line "Federation Council Charter · {your-instance}". The first three Lands to ratify trigger the first council meeting at the autumnal equinox following ratification.',
};
