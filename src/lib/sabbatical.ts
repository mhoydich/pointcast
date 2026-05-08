/**
 * Sabbatical Infrastructure — UES-Federation-07.
 *
 * Spun out of /time (UES-WP-2026-16). The Time paper's seventh time
 * frame — Sabbatical Time — proposes 6-week breaks every 3-7 years
 * as normal infrastructure rather than exceptional grants. The Bath
 * Master role spec (in /bath-house) is the first concrete instance.
 * This page generalizes the Bath Master pattern into a federation-wide
 * working sabbatical infrastructure: who is eligible, when, how it
 * is funded, who covers the role during the gap, what changes when
 * the participant returns.
 *
 * The Time paper diagnoses; this page implements. The Federation
 * Council Charter (UES-Federation-05) governs.
 */

export const SABBATICAL_META = {
  title: 'Sabbatical Infrastructure',
  subtitle: 'A federation-wide working sabbatical specification · 6 weeks every 3-7 years as normal civic infrastructure · UES-Federation-07',
  thesis: 'Modern knowledge work, including civic stewardship, structurally produces burnout in the absence of multi-week recovery cycles. The federation\'s commitment is to make sabbaticals normal infrastructure rather than exceptional grants — a 6-week sabbatical at year 3 and year 5 of a 5-year role, plus a longer (8-12 week) decennial sabbatical for any participant in long-term federation stewardship. This page specifies the eligibility, funding, coverage, return protocol, and dissolution clause for federation sabbaticals. The first concrete instance ships in the Bath Master role spec (UES-WP-2026-14); this page generalizes the pattern so every Tier D principal role, every federation council delegate role, and every participating cohort steward role can use the same template.',
  paperNumber: 'UES-Federation-07',
  date: '2026-05-08',
  status: 'specification · ratifies with Federation Council Charter',
  parents: ['UES-WP-2026-16 Time', 'UES-WP-2026-14 The Bath House (the first instance)', 'UES-Federation-05 Federation Council Charter (governance)'],
};

export const PURPOSE = {
  why: 'Sabbatical exists because no participant in serious civic stewardship can sustain that work indefinitely without recovery. The Bath Master who never takes a sabbatical becomes the Bath Master whose burnout damages the Bath House. The Concert Master who works 5 years without a 6-week pause programs a 6th year that drifts from the curatorial council\'s rhythm. The federation council delegate who attends quarterly meetings without sabbatical loses the long-view perspective that delegate work requires. Sabbatical is not a luxury reward; it is structural maintenance.',
  whyNotPto: 'Standard PTO (paid time off, typically 2-4 weeks per year, used in 1-day to 1-week chunks) is structurally insufficient to enable nervous-system recovery. Recovery cycles take 4-8 weeks of continuous disconnect to deliver measurable benefit (de Bloom 2009; West 2014). PTO patches the surface; sabbatical addresses the structural layer. The federation supports both, with PTO as instance-sovereign and sabbatical as federation-coordinated.',
  whyMandatoryByDefault: 'Most professional cultures treat sabbatical as opt-in. The federation\'s working position is the inverse: sabbatical is opt-OUT. A Tier D principal who declines their year-3 sabbatical without compelling justification is flagged in the federation council\'s annual review for a renewal-of-role conversation. The framework treats forgone sabbatical as a signal that the role-occupant or the role itself may need adjustment.',
};

export type SabbaticalEligibility = {
  roleClass: string;
  triggerPattern: string;
  durationDefault: string;
  fundingSource: string;
  coverageDuringGap: string;
  returnProtocol: string;
};

export const ELIGIBLE_ROLES: SabbaticalEligibility[] = [
  {
    roleClass: 'Tier D principal stewardship roles',
    triggerPattern: 'Year 3 (4-6 week) and Year 5 (4-6 week) of any 5-year initial term. Year 7 (8-week) on first renewal. Year 10 (8-12 week) on second renewal.',
    durationDefault: '6 weeks (year-3 and year-5); 8 weeks (year-7); 8-12 weeks (decennial).',
    fundingSource: 'Tier D project endowment 4% annual draw covers sabbatical compensation continuity. Specifically: the role\'s base compensation is paid in full during sabbatical, and a Sub fee covering 75% of the role\'s base for the sabbatical-coverage individual.',
    coverageDuringGap: 'A pre-identified Sub from the curatorial / steward bench (e.g., the Bath Master\'s Sub is drawn from the Water Steward roster; the Concert Master\'s Sub from the curatorial council). Full-rate coverage minus operational decisions reserved for the principal.',
    returnProtocol: 'Two-week reentry period: principal returns at 50% load week 1, 75% week 2, full week 3+. No new commitments contracted during reentry.',
  },
  {
    roleClass: 'Federation council voting delegates',
    triggerPattern: 'Year 1 of any term (4 weeks). Year 2 of any term if requested (no penalty).',
    durationDefault: '4-week single sabbatical per 2-year term, or split as two 2-week sabbaticals.',
    fundingSource: 'No compensation interruption (delegate role is volunteer; sabbatical is permission to step away from quarterly meeting commitments without recall).',
    coverageDuringGap: 'Instance-sovereign: each instance designates a Sub-delegate from its stewardship circle. Sub-delegate has full voting authority during sabbatical only.',
    returnProtocol: 'Returning delegate resumes term length unchanged. No accrued backlog of correspondence; the federation library minutes are the canonical record.',
  },
  {
    roleClass: 'Cohort stewards (Marine Layer Layer, Bath Master Sub, etc.)',
    triggerPattern: 'After completing one full eight-week cycle as primary steward.',
    durationDefault: '2-week minimum disconnect after each cycle of stewardship.',
    fundingSource: 'No compensation (volunteer role); the framework requires the gap as a structural floor.',
    coverageDuringGap: 'The cohort itself; subsequent eight-week cycle waits or is led by another rotating Layer.',
    returnProtocol: 'Cohort steward returns to ordinary cohort participation; not obligated to lead next cycle.',
  },
  {
    roleClass: 'Working-Paper convener (UES-WP author / editor cycle)',
    triggerPattern: 'After every 3 Working Papers published. Or: 12 months continuous editorial work, whichever comes first.',
    durationDefault: '4-6 weeks.',
    fundingSource: 'Author fees (where applicable) cover via federation library budget; volunteer authorship has no compensation interruption since there was none to interrupt.',
    coverageDuringGap: 'Department of Local Inquiry editorial bench rotates the convener role.',
    returnProtocol: 'Returning convener proposes the next paper without obligation to author it personally.',
  },
  {
    roleClass: 'External-partner liaisons (LA28, CCC, philanthropic contacts)',
    triggerPattern: 'After every major-deliverable cycle (LOI submission, partnership negotiation completion, major-grant award).',
    durationDefault: '2-3 weeks.',
    fundingSource: 'Federation Commons general budget covers continuity if liaison is paid; volunteer liaison has no compensation.',
    coverageDuringGap: 'Federation council chair acts as backup liaison during sabbatical.',
    returnProtocol: 'External partners notified in advance; no new partnership conversations initiated during sabbatical.',
  },
];

export const FUNDING_DESIGN = {
  philosophy: 'Sabbatical funding follows the role, not the participant. A Tier D project\'s endowment funds the principal\'s sabbatical; a federation council delegate role is volunteer (sabbatical is permission, not paid time); a cohort steward is volunteer (sabbatical is a structural floor in the cycle).',
  endowmentRule: 'Every Tier D project\'s endowment is sized to fund 4% annual draw including sabbatical coverage at year-3 and year-5 of each 5-year role term. A $1.5M endowment (Bath House) funds: $60K/yr operations + sabbatical reserve. Tier D projects under $10M cap typically need $0.4-0.7M endowment for sabbatical coverage alone.',
  futureWorksFund: 'The 5% Future Works Fund contribution from each Tier D campaign overage flows to a federation-wide Sabbatical Reserve. This reserve covers sabbaticals for federation-level roles (council chair, working-paper conveners, external liaisons) where no single Tier D endowment is appropriate.',
  noProjectFundsFromOperatingRevenue: 'Sabbatical compensation does NOT flow from a Tier D project\'s operating revenue (ticket sales, member fees, etc.). Operating revenue goes to operations + maintenance + endowment-rebuilding. Sabbatical comes from endowment draw, structurally pre-funded, never reactive.',
};

export const COVERAGE_PROTOCOL = {
  identification: 'Every Tier D principal role has an identified Sub at hire time. The Sub knows they are the Sub; the Sub trains during the principal\'s first 6 months; the Sub has shadowed at least one full operational week before the principal\'s year-3 sabbatical begins.',
  trainingObligation: 'Principal trains the Sub during years 1-3. The federation council audits Sub-readiness at the year-2 quarterly review. If Sub is not ready by year-3 sabbatical date, federation council vote determines whether sabbatical is delayed by up to 6 months OR Sub is replaced in time.',
  decisionAuthority: 'During sabbatical, the Sub holds full operational authority for routine matters (scheduling, day-to-day staffing, public-facing communications, vendor management). The Sub does NOT hold authority on: (a) hiring or firing of staff; (b) program changes affecting public reservation; (c) external-partner negotiations; (d) federation-council reportable matters. These items wait for principal return.',
  emergencyBreakIn: 'Principal may be contacted during sabbatical only for a federation-council-emergency-agenda matter (per Charter UES-Federation-05). All other matters wait. The federation council chair is the gatekeeper; only the chair can authorize a sabbatical-break-in.',
  postSabbaticalDebrief: 'Sub and principal hold a one-hour structured debrief within 7 days of return. Sub reports on: routine decisions made, issues deferred to principal, recommendations for permanent process changes. Principal acknowledges and integrates the report.',
};

export const RETURN_PROTOCOL = {
  reentryPace: 'Two-week graduated reentry. Week 1: 50% load — review-only, no new commitments; meetings as observer. Week 2: 75% load — selective new commitments, full meeting participation. Week 3+: full load.',
  noBacklogContract: 'The federation explicitly does NOT expect returning principals to "catch up" on backlogged work. Backlog that accumulated during sabbatical was either Sub-handled, federation-council-deferred, or genuinely unimportant. The returning principal\'s first task is review, not reaction.',
  oneNewCommitmentLimit: 'During the two-week reentry, the returning principal may accept at most one new external-partner commitment. The discipline matters: returning energy is finite; reentry weeks are not for additive work.',
  reflectionDocument: 'Within 30 days of return, the principal writes a 1,000-word sabbatical reflection submitted to the federation library. What changed in their thinking; what they would teach the next principal in their role; what permission boundaries they now defend differently. Reflections are public-by-default with consent-to-redact preserved.',
  promotionToTeacher: 'Principals who complete year-3 + year-5 + year-7 sabbaticals become eligible for the Sabbatical Teacher Program: peer-mentor for prospective sabbaticants in other roles. The teacher role is voluntary, compensated at federation library editorial rates.',
};

export const ANTI_PATTERNS = [
  { pattern: 'Treating sabbatical as a bonus', why: 'Sabbatical is structural maintenance, not reward. Framing it as bonus implies it is optional and earned; the federation\'s position is that it is mandatory and structural.' },
  { pattern: 'Working through sabbatical', why: 'Sabbatical that includes "checking email twice a day" or "available for emergencies" delivers approximately none of the recovery benefit. The discipline is full disconnect; partial sabbatical is not sabbatical.' },
  { pattern: 'Compressing sabbatical to fit deadlines', why: 'A 2-week sabbatical when the framework requires 6 weeks is not sabbatical with reduced benefit; it is a vacation. The biology of recovery has thresholds (4-week minimum for measurable cortisol reset). Below threshold is theater.' },
  { pattern: 'Sub-as-extension-of-principal', why: 'A Sub who texts the principal "just to confirm" on every routine decision defeats the structural purpose. The federation requires Subs who can hold authority, not Subs who execute the principal\'s will at a distance.' },
  { pattern: 'Sabbatical as exit', why: 'Sabbatical is recovery for return, not soft-exit. A principal contemplating role exit should communicate that intention rather than disappear into a "sabbatical" that becomes resignation. Clear exits preserve federation continuity; ambiguous ones damage it.' },
  { pattern: 'No reflection document', why: 'The reflection document is structural. Without it, the federation library does not retain what the sabbatical produced; the next principal in the same role starts from zero. The reflection is not optional.' },
  { pattern: 'Pre-sabbatical heroics', why: 'Some role-holders attempt to clear their entire backlog before sabbatical begins, working unsustainable hours in the final 2 weeks. This destroys the sabbatical\'s benefit. The federation\'s working position: leave reasonable backlog; the Sub is competent; the work waits.' },
];

export const FIRST_THREE_INSTANCES = [
  { role: 'Bath Master (Tier D principal)', when: '2031-2032 (year-3 + year-5 of opening 2028)', notes: 'The first concrete instance. Bath Master role spec already includes 6-week sabbaticals at years 3 and 5. Sub: drawn from Water Steward roster.' },
  { role: 'Concert Master (Tier D principal)', when: '2032-2033 (year-3 + year-5 of opening 2029)', notes: 'Second concrete instance. Concert Master role spec includes 6-week sabbaticals years 3 and 5. Sub: drawn from curatorial council.' },
  { role: 'Federation Council chair (rotating annually by lottery)', when: '2027 onward', notes: 'Council chair rotates annually; no individual role serves long enough to require year-3 sabbatical. Chair-role sabbatical is not separately tracked; the rotation itself is the structural rest.' },
];

export const REFERENCES = [
  { id: 'pointcast-time', cite: 'University of El Segundo. (2026). *Time*. UES-WP-2026-16. https://pointcast.xyz/time' },
  { id: 'pointcast-bath', cite: 'University of El Segundo. (2026). *The Bath House*. UES-WP-2026-14. https://pointcast.xyz/bath-house (first concrete instance)' },
  { id: 'pointcast-concert', cite: 'University of El Segundo. (2026). *The Concert Hall*. UES-WP-2026-17. https://pointcast.xyz/concert-hall (second concrete instance)' },
  { id: 'pointcast-charter', cite: 'University of El Segundo. (2026). *Federation Council Charter*. UES-Federation-05. https://pointcast.xyz/federation-council' },
  { id: 'shemitah', cite: 'Hebrew Bible. (Continuing). *Shemitah · Seventh-year Land Rest (Deuteronomy 15)*. The agricultural origin of the sabbatical concept.' },
  { id: 'harvard-1880', cite: 'Harvard University. (1880). *First Formalized Academic Sabbatical Policy*. Historical record.' },
  { id: 'de-bloom', cite: 'de Bloom, J., Geurts, S. A. E., et al. (2009). *Do we recover from vacation? Meta-analysis of vacation effects on health and well-being*. Journal of Occupational Health, 51(1), 13-25.' },
  { id: 'west', cite: 'West, C. P., et al. (2014). *Intervention to promote physician well-being, job satisfaction, and professionalism: a randomized clinical trial*. JAMA Internal Medicine, 174(4), 527-533.' },
  { id: 'maslach', cite: 'Maslach, C., & Leiter, M. P. (2008). *Early predictors of job burnout and engagement*. Journal of Applied Psychology, 93(3), 498-512.' },
];

export const SABBATICAL_NOTES = {
  uesNote: 'This page is a federation specification, ratifies with the Federation Council Charter (UES-Federation-05). The first concrete sabbatical (Bath Master year-3 in 2031) is approximately 5 years away. The structural commitment must be made now so the endowment funding is sized correctly during 2026-2028 capital campaigns.',
  invitation: 'If you are designing a Tier D project endowment, drafting a federation-role compensation structure, or considering a federation-level role that does not yet exist (curator, archivist, librarian, etc.), email mh@pointcast.xyz with subject line "Sabbatical · {role}". Sabbatical infrastructure should be priced INTO the role at hire time, not bolted ON after burnout begins.',
};
