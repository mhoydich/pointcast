/**
 * The Civic Federation — UES Working Paper 2026-19.
 *
 * Department of Local Inquiry. The synthesis paper across 18 prior
 * UES Working Papers and 7 Federation surfaces. After eighteen
 * specific pieces of corridor infrastructure, this paper steps back
 * and asks: what species of institution have we been building?
 *
 * The argument: the Civic Federation is a distinct institutional form,
 * neither corporation nor nonprofit nor government nor cooperative.
 * It has historical precedents (Hanseatic League 1356-1862, Iroquois
 * Confederacy c. 1142-Continuing, Swiss Confederation 1291-Continuing,
 * medieval Italian city-state networks). It has structural innovations
 * for the 21st century. And it is the institutional shape most suited
 * to 21st-century coordination problems that the four canonical 20th-
 * century forms structurally cannot solve.
 */

export const PAPER_META = {
  title: 'The Civic Federation',
  subtitle: 'An emerging institutional form · what we have been building, what species of thing it is, and why the world may need it · UES Working Paper 2026-19',
  thesis: 'After eighteen specific UES Working Papers and seven Federation governance surfaces, this paper steps back to name what species of institution the corridor has been building. The argument: the Civic Federation is a distinct institutional form, neither corporation nor nonprofit nor government nor cooperative, with historical precedents (Hanseatic League, Iroquois Confederacy, Swiss Confederation, medieval Italian city-state networks) and structural innovations specifically suited to 21st-century coordination problems. The four canonical 20th-century institutional forms each have known limits: corporations are too short-horizon, governments are too jurisdictionally trapped, nonprofits are too donor-dependent, cooperatives are too internally focused. The Civic Federation occupies the form-space those limits leave empty. UES is one experimental instance; the form itself belongs to no single instance. This paper is a declaration that the form deserves a name AND a study of what it is, where it comes from, what it can do, and how to recognize it when you see one — including in geographies that have not yet noticed they are building one.',
  paperNumber: 'UES-WP-2026-19',
  date: '2026-05-08',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Inquiry', email: 'mh@pointcast.xyz' },
  ],
  keywords: ['civic federation', 'institutional form', 'polycentric governance', 'University of El Segundo', 'Hanseatic League', 'Iroquois Confederacy', 'Swiss Confederation', 'Elinor Ostrom', 'commons governance', 'forkable institutions', '21st-century coordination'],
  parentSurface: 'University of El Segundo · Department of Local Inquiry',
  relatedSurfaces: ['UES-WP-2026-11 The Forkable Radius', 'UES-Federation-05 Federation Council Charter', 'all 18 prior UES Working Papers'],
  classification: 'synthesis · declaration · institutional study',
};

export const THE_FOUNDING_DECLARATION = {
  oneSentence: 'The Civic Federation is the institutional form a group of people uses when they want to coordinate civic work across multiple geographies, multiple decades, and multiple value-systems — without any one geography, decade, or value-system getting to run the others.',
  fivePropositions: [
    'There exists a species of institution distinct from corporation, nonprofit, government, and cooperative. We call it the Civic Federation.',
    'The form has historical precedents (Hanseatic League 1356-1862, Iroquois Confederacy c. 1142-Continuing, Swiss Confederation 1291-Continuing) and contemporary re-emergence (UES, plus comparable experiments worldwide).',
    'The form is structurally suited to 21st-century coordination problems (climate, AI governance, civic infrastructure decay, demographic transition) that the four canonical 20th-century forms cannot solve at scale.',
    'The form is voluntary, additive, revocable, and forkable at every level. No instance is bound; no member is captive; no decision is permanent.',
    'UES is one experimental Civic Federation, intended to refine the form. The form itself belongs to no single Federation. We invite others, in other geographies, on their own timetables, for their own reasons, to build their own.',
  ],
  signed: 'University of El Segundo · 2026-05-08 · in the public domain',
};

export type InstitutionalForm = {
  id: string;
  name: string;
  emergedAround: string;
  primaryUnit: string;
  fundingSource: string;
  decisionRule: string;
  durationOfCommitment: string;
  growthMechanism: string;
  failureMode: string;
  knownLimits: string;
  precedentExamples: string;
};

export const FOUR_CANONICAL_FORMS: InstitutionalForm[] = [
  {
    id: 'corporation',
    name: 'The Corporation',
    emergedAround: 'British East India Company 1600; modern shareholder-corporation form by mid-19th century.',
    primaryUnit: 'shareholders + employees + customers',
    fundingSource: 'equity capital + retained earnings + debt financing',
    decisionRule: 'shareholder majority via board of directors → CEO',
    durationOfCommitment: 'quarterly to annual; principal investor-relations cycle is 90 days',
    growthMechanism: 'capital reinvestment + acquisition + market share',
    failureMode: 'bankruptcy, hostile takeover, or strategic decay over 30-50 years (median Fortune 500 lifespan ~30 years and falling)',
    knownLimits: 'short-horizon by structure; pursues shareholder return at expense of externalities; cannot credibly commit to multi-generational projects; hostile to permanent civic infrastructure that does not generate quarterly cash flow',
    precedentExamples: 'Apple, Toyota, ExxonMobil, Berkshire Hathaway, Walmart',
  },
  {
    id: 'government',
    name: 'The Government',
    emergedAround: 'modern nation-state form post-Westphalia 1648; representative-democratic form post-Enlightenment.',
    primaryUnit: 'citizens within fixed geographic jurisdiction',
    fundingSource: 'taxation + bonds + sovereign credit',
    decisionRule: 'electoral cycles + legislature + executive + judiciary',
    durationOfCommitment: '2-6 year electoral cycles primary; constitutional commitments multi-decade',
    growthMechanism: 'territorial annexation, treaty integration, or supranational federation (rare)',
    failureMode: 'electoral pendulum (programs reversed each cycle); jurisdictional balkanization; institutional capture by short-term coalitions',
    knownLimits: 'jurisdictionally trapped (cannot operate across borders without treaty); electoral-cycle horizon undermines long projects; legislative reversibility creates Brownian-motion policy; structurally unsuited to coordination problems that span jurisdictions',
    precedentExamples: 'United States federal/state/local; European Union; California state; LA County; City of El Segundo',
  },
  {
    id: 'nonprofit',
    name: 'The Nonprofit / Foundation',
    emergedAround: 'modern philanthropic-foundation form post-1900 (Carnegie 1911, Rockefeller 1913, Ford 1936); 501(c)(3) Internal Revenue Code 1954.',
    primaryUnit: 'donors + program staff + beneficiaries',
    fundingSource: 'grants + individual donations + endowment investment income',
    decisionRule: 'board of trustees with periodic donor input + program staff execution',
    durationOfCommitment: 'grant-cycle (1-3 years) primary; endowed institutions multi-decade',
    growthMechanism: 'capital campaign + endowment growth + program expansion',
    failureMode: 'donor fatigue, mission drift, founder-syndrome, or quiet wind-down once principal donor ages out',
    knownLimits: 'donor-dependent (program survives donor priorities); often single-issue rather than coordinative; structurally unsuited to multi-geography coordination unless explicitly designed as a network; weak accountability to beneficiaries vs accountability to donors',
    precedentExamples: 'Gates Foundation, Annenberg, Mellon, Knight, MacArthur; Habitat for Humanity; LA28 Legacy Foundation',
  },
  {
    id: 'cooperative',
    name: 'The Cooperative',
    emergedAround: 'Rochdale Pioneers 1844; modern cooperative form codified by International Cooperative Alliance 1895.',
    primaryUnit: 'members (worker-owners or consumer-members)',
    fundingSource: 'member dues + member capital + retained patronage',
    decisionRule: 'one-member-one-vote (Rochdale principle) + board + management',
    durationOfCommitment: 'membership-tenure (often multi-decade); dissolution by member vote',
    growthMechanism: 'member recruitment + cooperative federation (rare) + acquisition (rarer)',
    failureMode: 'demutualization (members convert to corporation); member apathy; competitive disadvantage to capital-funded competitors',
    knownLimits: 'internally focused (members benefit; non-members don\'t); slow decision-making; capital constraints (cooperative cannot easily raise external equity); cooperative-of-cooperatives (federation) form is well-known but rare in practice',
    precedentExamples: 'REI, Mondragon Corporation (Spain), Land O\'Lakes, Vanguard Group, ACE Hardware, credit unions broadly',
  },
];

export const THE_CIVIC_FEDERATION: InstitutionalForm = {
  id: 'civic-federation',
  name: 'The Civic Federation',
  emergedAround: 'Hanseatic League 1356-1862 + Iroquois Confederacy c. 1142-Continuing + Swiss Confederation 1291-Continuing as historical precedents; contemporary re-emergence c. 2020-2030.',
  primaryUnit: 'instances (semi-autonomous geographic units) + cohort members within instances',
  fundingSource: 'voluntary aggregated Commons (per-instance) + endowment-first per project + matching philanthropy + member dues + NEVER municipal bond financing as primary',
  decisionRule: 'joint stewardship circle with single-instance veto reserved; explicit threshold matrix (3-of-N for Tier-D approval, unanimous for new-instance admission and dissolution)',
  durationOfCommitment: 'multi-decade structural; 6-8 week cohort-cycle operational; 100-year design-life on physical infrastructure',
  growthMechanism: 'forkable templates + new-instance scaffold (not acquisition or merger); federation grows by addition, never absorption',
  failureMode: 'instance retirement (graceful, framework-allowed) or council dissolution by unanimous vote; federation library survives council dissolution as permanent archive',
  knownLimits: 'requires functioning local stewardship at each instance (cannot scale faster than steward formation); requires philanthropic + voluntary funding pools at sufficient density; structurally unsuited to coordination problems requiring monopoly authority (military, criminal justice, currency issuance); slower decision velocity than corporation or hierarchical nonprofit',
  precedentExamples: 'Hanseatic League (1356-1862); Iroquois Confederacy (c. 1142-Continuing, oldest functioning); Swiss Confederation (1291-Continuing); medieval Italian city-state alliances (Lombard League 1167); Society of Friends (Quaker yearly meetings, c. 1660-Continuing); Internet Engineering Task Force (1986-Continuing, technical-protocol federation); University of El Segundo (2026-Continuing, experimental contemporary instance)',
};

export const HISTORICAL_PRECEDENTS = [
  {
    id: 'iroquois',
    name: 'The Iroquois (Haudenosaunee) Confederacy',
    period: 'c. 1142 - Continuing',
    geography: 'present-day New York State, Quebec, Ontario; originally five nations (Mohawk, Oneida, Onondaga, Cayuga, Seneca); Tuscarora joined c. 1722',
    structuralFeatures: [
      'Multi-instance federation: each nation retained internal sovereignty over its own territory and customs',
      'Council governance: 50 sachems (chiefs) appointed by clan mothers, deliberating at annual Grand Council at Onondaga (the geographic and political center)',
      'Decision rule: consensus across all nations required for major decisions; single-nation veto reserved on matters affecting that nation\'s territory',
      'Voluntary membership: nations could and did debate withdrawal during major historical inflection points',
      'Foundational text: Great Law of Peace (Kaianere\'kó:wa) — oral tradition of approximately 117 articles governing the confederacy',
      'Recovery: confederacy survived European colonization, U.S. founding (Benjamin Franklin and others studied Iroquois governance and cited it as a model), 19th and 20th century displacement; continuous functioning',
    ],
    whatItPrefigures: 'The Iroquois Confederacy is the longest continuously-functioning federation form in human history, ~880 years and counting. Its structural innovations — instance sovereignty + council coordination + consensus + single-nation veto + voluntary membership + foundational oral text — appear in nearly every subsequent federation experiment.',
    longevityLesson: 'Federations can outlast empires. The Iroquois Confederacy is older than the British Empire (founded 1583), the United States (1776), and every contemporary corporation. Continuity comes not from immutable rules but from a refusal to centralize beyond what coordination requires.',
  },
  {
    id: 'swiss',
    name: 'The Swiss Confederation',
    period: '1291 - Continuing (formal Confederation 1848)',
    geography: 'present-day Switzerland; originally three forest cantons (Uri, Schwyz, Unterwalden); now 26 cantons',
    structuralFeatures: [
      'Multi-instance federation: each canton retains substantial autonomy over education, culture, taxation, and language policy',
      'Council governance: bicameral Federal Assembly + 7-person Federal Council with rotating annual presidency',
      'Decision rule: majority + qualified majority (cantons) for constitutional matters; popular referendum on major decisions',
      'Voluntary historical membership: cantons joined by treaty (Federal Charter of 1291 established the original three; subsequent expansions by treaty)',
      'Multilingual federation: four official languages (German, French, Italian, Romansh); no single national language; instance-sovereign language policy',
      'Recovery: survived Reformation conflicts, Napoleonic occupation, two world wars; continuous functioning',
    ],
    whatItPrefigures: 'The Swiss Confederation demonstrates that a federation can sustain a high-functioning modern state — wealth, technology, infrastructure, civic services — without central majoritarian control over the instance level. The cantonal autonomy + federal coordination model is a working contemporary proof that federation form is not merely historical.',
    longevityLesson: 'Federations can be small AND prosperous. Switzerland\'s population (~8.7 million) is comparable to single mid-sized US metropolitan areas; its multi-canton federation form is a small-scale federation working well. The corridor\'s ~700K-population realistic outer scope (per /corridor-strengths) is structurally comparable.',
  },
  {
    id: 'hanseatic',
    name: 'The Hanseatic League',
    period: '1356 - 1862 (formal organization; trade-network roots back to the 12th century)',
    geography: 'Northern Europe; ~200 cities at peak across present-day Germany, Poland, Netherlands, Belgium, Russia, Estonia, Latvia, Sweden, Denmark, Norway, England, Scotland',
    structuralFeatures: [
      'Multi-instance federation: each member city retained full local sovereignty; League membership was supplementary not primary',
      'Council governance: Hansetag (general assembly) at Lübeck, irregular cadence (~every 3-5 years on average)',
      'Decision rule: rough consensus among member cities; member cities could and did decline specific Hansetag decisions',
      'Voluntary membership: cities joined and left freely; the League was a coordination overlay, not a sovereignty surrender',
      'Funding: member city contributions for shared infrastructure (Kontore — trading posts in non-member cities); no League taxation power',
      'Specialization: trade-coordination, dispute resolution between members, joint defense against piracy, shared infrastructure (counting houses, warehouses, trade routes)',
    ],
    whatItPrefigures: 'The Hanseatic League is the closest historical precedent for the corridor\'s federation form: city-instances as the primary unit; council coordination at a midpoint city; voluntary multi-decade commitment; specialized scope (trade for the Hansa; civic infrastructure for the corridor); growth by member addition; eventual graceful dissolution after ~500 years when conditions changed.',
    longevityLesson: 'Federations dissolve when their core problem disappears. The Hansa\'s dissolution (final Hansetag 1669; formal end 1862) coincided with the rise of nation-state-monopoly trade. Federations are structurally fit for their problem-era; they should plan for honest dissolution when the era passes. The Federation Council Charter\'s dissolution clause (UES-Federation-05) is consciously Hansa-influenced.',
  },
  {
    id: 'lombard',
    name: 'The Lombard League',
    period: '1167 - 1226 (active); precedent for later Italian city-state coordination',
    geography: 'Lombardy region of present-day northern Italy; ~30 city-states at peak (Milan, Verona, Padua, Venice, etc.)',
    structuralFeatures: [
      'Multi-instance federation against shared external threat (Holy Roman Emperor Frederick Barbarossa)',
      'Council governance: League general assembly + military coordination',
      'Decision rule: rough consensus among member cities; military coordination by appointed captains-general per campaign',
      'Voluntary membership: cities joined the League by treaty; could withdraw',
      'Specialization: external defense + diplomatic representation; member cities retained internal sovereignty',
      'Outcome: defeated imperial forces at Legnano 1176; Treaty of Constance 1183 confirmed cities\' liberties; League formal life ~60 years but precedent shaped Italian Renaissance city-state era',
    ],
    whatItPrefigures: 'The Lombard League shows that a federation can succeed even with short formal duration if it accomplishes its problem-era task. The Hansa-vs-Lombard contrast is instructive: the Hansa\'s problem (trade coordination across vast geography over centuries) required ~500 years of structure; the Lombard League\'s problem (resist a specific imperial overreach) was task-bounded and resolved in ~60 years.',
    longevityLesson: 'Federations should match their problem duration. A federation that lives past its problem becomes a club; a federation that dies with its problem completed is a federation that did its work.',
  },
  {
    id: 'quaker',
    name: 'Society of Friends (Quaker) Yearly Meetings',
    period: 'c. 1660 - Continuing',
    geography: 'originally British Isles; now global; over 80 yearly meetings worldwide',
    structuralFeatures: [
      'Multi-instance federation: each yearly meeting (regional unit, e.g., Pacific Yearly Meeting, Britain Yearly Meeting) retains autonomy',
      'Council governance: Friends World Committee for Consultation (since 1937) coordinates without governing',
      'Decision rule: meeting-for-business with discernment; "the sense of the meeting" rather than majority vote; single-Friend hesitation can prevent forward motion',
      'Voluntary membership: individuals affiliate with monthly meetings; meetings affiliate with yearly meetings; structure is invitational not coercive',
      'Recovery: survived 17th-century English persecution, 18th-19th century internal schisms (Hicksite, Orthodox, Conservative, Evangelical branches), 20th-century globalization',
    ],
    whatItPrefigures: 'The Quaker yearly-meeting form demonstrates federation governance via discernment rather than majority vote. The Federation Council Charter\'s decision protocol (3-of-N for most Tier-D decisions, unanimous for admission and dissolution, single-instance veto for own territory) is closer to Quaker discernment than to Robert\'s Rules of Order parliamentary procedure.',
    longevityLesson: 'Federations that govern by discernment (rather than majority vote) tend to make slower decisions and more durable ones. Federations that govern by majority vote tend to make faster decisions and reverse them more often.',
  },
  {
    id: 'ietf',
    name: 'Internet Engineering Task Force',
    period: '1986 - Continuing',
    geography: 'global; informal organization with no member-state structure',
    structuralFeatures: [
      'Multi-instance federation: working groups self-organize around technical specifications; no centralized authority over which working groups form',
      'Council governance: Internet Engineering Steering Group + working group chairs; "rough consensus and running code" as the operating principle',
      'Decision rule: rough consensus rather than vote; "we reject kings, presidents, and voting"',
      'Voluntary membership: anyone can attend a meeting, contribute to a draft, or participate in a working group',
      'Specialization: technical-protocol governance for the Internet; explicitly does not govern content or policy',
      'Recovery: survived multiple corporate-capture attempts, jurisdictional pressure, organizational restructurings; continuous functioning across 40 years',
    ],
    whatItPrefigures: 'The IETF is the most successful contemporary technical federation: it has produced (without majority vote, without compulsory membership, without formal jurisdiction) the protocols that the entire global Internet runs on. The Civic Federation form is loosely the IETF model applied to civic infrastructure rather than network protocols.',
    longevityLesson: 'Federations that produce concrete artifacts (Hansa produced trade routes, IETF produces RFCs, the corridor produces buildings + working papers) outlast federations that produce only positions. Build artifacts; they survive the federation that built them.',
  },
];

export const STRUCTURAL_INNOVATIONS = [
  { innovation: 'Radius commitment', description: 'Each instance commits to a specific geographic radius (the corridor instances commit to 25 miles centered on their respective cities) rather than to undifferentiated growth. The radius is an honest constraint that produces better stewardship than aspiration to global scale.', precedent: 'Iroquois nations\' bounded territories; Swiss cantonal boundaries.', whatItSolves: '"Mission creep" in nonprofits and corporations; the constant pressure to grow beyond capacity.' },
  { innovation: 'Forkable templates', description: 'Every Federation surface is CC0 / open-licensed; the forkable-template pattern (UES-Template-01) allows new instances to clone the framework and customize. Federation grows by addition, never by acquisition or merger.', precedent: 'Open-source software (Linux, Apache, etc.); religious denomination founding patterns.', whatItSolves: 'Corporate centralization pressure; the "either we own you or we compete" binary that forces consolidation in commercial sectors.' },
  { innovation: 'Voluntary-and-revocable membership', description: 'Every instance, every cohort member, every Federation council delegate participates voluntarily and may withdraw at any time. The Federation Council Charter explicitly includes a dissolution clause (UES-Federation-05).', precedent: 'Hansa cities joining/leaving freely; Quaker meeting affiliations; IETF working group participation.', whatItSolves: 'Corporate "lock-in"; nonprofit donor-capture; government coercion. Voluntary participation produces higher-quality engagement and lower long-term burnout.' },
  { innovation: 'Joint stewardship circles', description: 'Tier-D works (Bath House, Concert Hall, etc.) are governed by joint stewardship circles drawing from all instances rather than by single-city ownership. The work belongs to the federation; the host city is the landlord, not the owner.', precedent: 'Hanseatic Kontore (joint trading posts); modern academic-consortia governance (e.g., HHMI Janelia campus).', whatItSolves: 'Single-jurisdiction capture of multi-jurisdiction projects; the political fragility of works that any single mayor or council can defund.' },
  { innovation: 'Endowment-first for irreversible works', description: 'Works whose value depends on long-term continuity (Tide-Pool Restoration with 50-year ecosystem-seeding cycle; the Concert Hall recording archive) must have their endowments fully funded before construction begins. The federation refuses to break ground on irreversible work without long-tail funding secured.', precedent: 'Major academic-institution endowment-first capital campaigns (e.g., Janelia Research Campus, Salk Institute).', whatItSolves: 'The "operating-budget mortality" pattern in nonprofits where capital projects open and then close because operations were not pre-funded.' },
  { innovation: 'No-perpetual-debt financing', description: 'The federation refuses municipal bond financing as the primary funding instrument for civic instruments. Bonds push operating costs into perpetual debt service, which generates pressure to commercialize free public spaces. Federation Tier-D works are funded by aggregated voluntary Commons + matching philanthropy + members + endowments.', precedent: 'Public-good projects historically funded by patron sponsorship rather than civic debt (e.g., Florentine Renaissance commissions).', whatItSolves: 'The 21st-century US civic-infrastructure trap where bonded projects must commercialize to service debt, defeating their original public-good purpose.' },
  { innovation: 'Recovery-clause governance', description: 'The Federation Council Charter includes both a dissolution clause AND a recovery clause: a dissolved federation may be reconvened by 3-of-N consent of any existing instances at any future time. Dissolution is hibernation, not extinction.', precedent: 'No direct historical precedent; this is a contemporary refinement.', whatItSolves: 'The "founder-mortality" pattern where institutions die with their founders. The recovery clause makes the federation\'s framework outlast any specific federation\'s active operation.' },
  { innovation: 'Open-licensed cumulative library', description: 'Every UES Working Paper, Federation surface, Tier-D specification, and Common Knowledge Cache entry is CC0 by default. The federation\'s knowledge accumulates in public; future instances build on it without permission.', precedent: 'Open-source code repositories (GitHub, CRAN, PyPI); open-access academic publishing (PLOS, eLife).', whatItSolves: 'The "knowledge silo" pattern in corporations and consultancies where institutional learning is proprietary and dies with the firm.' },
  { innovation: 'Cohort-cap-12 unit', description: 'The federation\'s default unit of intentional collective time is the 6-8 week cohort capped at 12 people. This is the Marine Layer pattern, the P2P AI cohort pattern, the Living Body cohort pattern, the federation-council-meeting size, and the Bath House peak-occupancy unit.', precedent: 'Religious cell groups (12 apostles, 12-step recovery groups); Dunbar\'s research on small-group cohesion.', whatItSolves: 'The "all-hands meeting" anti-pattern in modern organizations; the loss of named-relationship at >15-person scale.' },
  { innovation: 'Per-instance veto for own territory', description: 'No federation decision can override an instance\'s decision about its own territory. The federation cannot site a Tier-D work in Hermosa over Hermosa\'s objection; cannot reassign cohort time without the cohort\'s consent.', precedent: 'Iroquois single-nation veto; Quaker meeting discernment.', whatItSolves: 'The "federation-as-superstate" anti-pattern where the federation accumulates power until it becomes a centralized authority. The veto preserves instance sovereignty as a structural feature.' },
];

export const TWENTY_FIRST_CENTURY_PROBLEMS = [
  { problem: 'Climate adaptation', whyTheFourFormsStruggle: 'Corporations cannot credibly commit to multi-generational adaptation without quarterly returns. Governments are jurisdictionally trapped at scales smaller than climate. Nonprofits depend on donor priority that fluctuates. Cooperatives are member-internal and cannot mobilize cross-member action.', whyTheFederationFits: 'Multi-decade structural commitment; cross-jurisdictional coordination by consent; voluntary aggregation of local capability without centralized command; works (sea-walls, restoration projects, civic infrastructure) sized to be funded across instances rather than from any single source.' },
  { problem: 'AI governance and data sovereignty', whyTheFourFormsStruggle: 'Corporations have inherent conflict of interest (they build the AI). Governments are jurisdictionally trapped while AI is global. Nonprofits depend on the same corporations for funding. Cooperatives are too internally focused to address externalities of the AI ecosystem.', whyTheFederationFits: 'Cross-vendor protocol experimentation (per /p2p-ai); per-cohort permission models; federation libraries (Common Knowledge Cache) that operate outside vendor capture; voluntary participation that does not require any particular vendor relationship.' },
  { problem: 'Civic infrastructure decay', whyTheFourFormsStruggle: 'Corporations require ROI on infrastructure investment. Governments are deferred-maintenance-trapped (capital budgets prioritize new construction over maintenance). Nonprofits cannot fund infrastructure at scale. Cooperatives serve members but rarely the broader public.', whyTheFederationFits: 'Tier-D Commons + endowment-first funding; 100-year design lives; joint stewardship that survives any single political cycle; honest-deprecation framework for works that have outlived their problem-era.' },
  { problem: 'Demographic transition (aging populations, shrinking native-born cohorts)', whyTheFourFormsStruggle: 'Corporations cannot solve coordination among the aged. Governments are limited to citizens by definition. Nonprofits address subsets but not coordination at scale. Cooperatives serve members but cannot easily integrate cross-generational membership.', whyTheFederationFits: 'Multi-generational cohorts (Marine Layer, Honey League) that explicitly mix age bands; instance-sovereign membership criteria allowing each instance to define its own cohort eligibility; sabbatical infrastructure that supports phased disengagement; recovery clauses that allow instances to wind down gracefully rather than cling to operation.' },
  { problem: 'Information-environment fragmentation', whyTheFourFormsStruggle: 'Corporations have monetization conflict. Governments lack jurisdictional reach. Nonprofits have donor-capture risk. Cooperatives are member-internal.', whyTheFederationFits: 'Cumulative open-licensed library; federation library as durable archive surviving any single platform; cohort-time as protected attention infrastructure; Common Knowledge Cache as cross-vendor reference for AI clients.' },
  { problem: 'Pandemic and emergency coordination', whyTheFourFormsStruggle: 'Corporations have employee-only reach. Governments are jurisdictionally trapped. Nonprofits cannot mobilize at speed. Cooperatives are member-internal.', whyTheFederationFits: 'Mutual Aid Mesh shape (UES-Shape-03) explicitly designed for cross-instance emergency coordination; pre-existing cohort structures provide rapid mobilization; voluntary protocols allow opt-in scale without compulsion.' },
  { problem: 'Trust collapse in legacy institutions', whyTheFourFormsStruggle: 'Corporations are not trying to solve trust collapse; they are sometimes accelerating it. Governments are themselves losing trust. Nonprofits are donor-captured. Cooperatives are member-internal.', whyTheFederationFits: 'Voluntary participation, transparent decision protocols, public minutes, open archives, instance-veto power, recovery clauses — every Federation governance feature is structurally aligned with rebuilding trust through demonstrable accountability rather than asserted authority.' },
];

export const HOW_TO_RECOGNIZE_A_FEDERATION = [
  'It has multiple geographic instances rather than a single headquarters.',
  'It has voluntary membership at every level (instance joins by consent; member joins instance by consent; cohort joins program by consent).',
  'It has explicit decision thresholds rather than majority-rule defaults (e.g., 3-of-N for some decisions, unanimous for others, single-instance veto reserved).',
  'It has joint stewardship of cross-instance work (no single instance owns the federation\'s major projects).',
  'It has an open archive of its work, available to non-members.',
  'It has a forkable framework — its own template can be cloned to start a new instance elsewhere.',
  'It has a dissolution clause (the federation can end honestly when its problem-era passes).',
  'It has a recovery clause (the framework can be reconvened later by surviving instances).',
  'It funds its physical infrastructure with endowment-first patient capital, not perpetual debt service.',
  'It produces concrete artifacts (buildings, papers, protocols, archives) that outlast its current operation.',
];

export const HOW_TO_FORK_A_FEDERATION = [
  'Identify a geographic radius you can credibly steward (the UES default is 25 miles; smaller is fine).',
  'Identify at least one local Land — a founder-figure willing to commit ~8 hours/week for 90 days.',
  'Read the Forkable Template (UES-Template-01) and the Federation Council Charter (UES-Federation-05).',
  'Choose your initial cohort form (Marine Layer is the corridor\'s default; substitute what fits your geography).',
  'Establish your Commons ledger with the six give-back categories (Hours, Dollars, Objects, Easement, Expertise, Custody).',
  'Run your first 90-day cycle. Publish your Day-90 status update honestly.',
  'After your second cycle, consider federating with at least one other instance via shared schemas (the L1 protocol from /forkable-radius).',
  'After your third cycle, consider drafting your own Working Papers, your own Tier-D specifications, and your own additions to the framework. The framework is meant to be improved by use.',
  'Hand off the convener role periodically. Federations that depend on a single founder do not survive their founder.',
  'When your federation has finished its problem-era, dissolve it honestly. The dissolution clause is part of the framework, not an afterthought.',
];

export const WHAT_THIS_PAPER_DOES_NOT_CLAIM = [
  'That the Civic Federation form will replace corporations, governments, nonprofits, or cooperatives. The four canonical forms have important roles; the Federation form occupies the form-space they leave empty.',
  'That all Federations will succeed. Many will not. Most experimental institutional forms fail; the form\'s value is in the survivors and what they teach.',
  'That UES is the only or best contemporary instance of the form. Other contemporary experiments exist (some named here, many not). The form belongs to no one.',
  'That the historical precedents named here (Iroquois, Swiss, Hansa, Lombard, Quaker, IETF) are equivalent. They are not. They are diverse instances of a recognizable family of institutional forms; differences among them are as important as similarities.',
  'That federation form is morally superior to the four canonical forms. Forms are tools; tools are good or ill depending on what they build.',
  'That UES is or wants to be a model for any specific external federation. The corridor is one experiment; readers are invited to learn from it without imitating it.',
  'That this paper is the final word on the federation form. It is the federation\'s 19th Working Paper; it will be revised by the cohort, by external researchers, by other federations that take up the form.',
];

export const REFERENCES = [
  { id: 'iroquois-great-law', cite: 'Anonymous (oral tradition c. 1142-Continuing). *The Great Law of Peace (Kaianere\'kó:wa)*. Multiple modern transcriptions; canonical reference: Parker, A. C. (1916) *The Constitution of the Five Nations*.' },
  { id: 'iroquois-mann', cite: 'Mann, B. A., & Fields, J. L. (1997). *A Sign in the Sky: Dating the League of the Haudenosaunee*. American Indian Culture and Research Journal, 21(2), 105-163.' },
  { id: 'iroquois-franklin', cite: 'Grinde, D. A., & Johansen, B. E. (1991). *Exemplar of Liberty: Native America and the Evolution of Democracy*. UCLA American Indian Studies Center.' },
  { id: 'swiss-pact', cite: 'Federal Charter (Bundesbrief). (1291). *The founding pact of the Swiss Confederation*.' },
  { id: 'hansa-dollinger', cite: 'Dollinger, P. (1970). *The German Hansa* (translated D. S. Ault & S. H. Steinberg). Stanford University Press.' },
  { id: 'lombard-puccinotti', cite: 'Puccinotti, F. (1865). *Storia della Lega Lombarda*. Florence.' },
  { id: 'quaker-faith-practice', cite: 'Religious Society of Friends. (Continuing, multiple yearly meetings). *Faith and Practice on Meeting for Worship for Business*.' },
  { id: 'ietf-rfc', cite: 'Bradner, S. (1998). *RFC 2418: IETF Working Group Guidelines and Procedures*. IETF Network Working Group.' },
  { id: 'ostrom-commons', cite: 'Ostrom, E. (1990). *Governing the Commons: The Evolution of Institutions for Collective Action*. Cambridge University Press. The canonical theoretical reference for polycentric governance; Ostrom received the 2009 Nobel Prize in Economic Sciences for this work and follow-on research.' },
  { id: 'ostrom-polycentric', cite: 'Ostrom, V., Tiebout, C. M., & Warren, R. (1961). *The Organization of Government in Metropolitan Areas: A Theoretical Inquiry*. American Political Science Review, 55(4), 831-842.' },
  { id: 'olson-collective-action', cite: 'Olson, M. (1965). *The Logic of Collective Action*. Harvard University Press.' },
  { id: 'putnam-bowling', cite: 'Putnam, R. D. (2000). *Bowling Alone: The Collapse and Revival of American Community*. Simon & Schuster.' },
  { id: 'pointcast-forkable', cite: 'University of El Segundo. (2026). *The Forkable Radius*. UES-WP-2026-11. https://pointcast.xyz/forkable-radius.' },
  { id: 'pointcast-charter', cite: 'University of El Segundo. (2026). *Federation Council Charter*. UES-Federation-05. https://pointcast.xyz/federation-council.' },
  { id: 'pointcast-corridor-strengths', cite: 'University of El Segundo. (2026). *Corridor Strengths*. UES-Federation-03. https://pointcast.xyz/corridor-strengths.' },
  { id: 'pointcast-template', cite: 'University of El Segundo. (2026). *Forkable Template*. UES-Template-01. https://pointcast.xyz/forkable-template.' },
  { id: 'pointcast-giant', cite: 'University of El Segundo. (2026). *Giant Works*. UES-Federation-02. https://pointcast.xyz/giant-works.' },
  { id: 'pointcast-marine', cite: 'University of El Segundo. (2026). *Marine Layer*. UES-WP-2026-01. https://pointcast.xyz/marine-layer.' },
  { id: 'pointcast-living-body', cite: 'University of El Segundo. (2026). *The Living Body*. UES-WP-2026-18. https://pointcast.xyz/living-body.' },
  { id: 'pointcast-time', cite: 'University of El Segundo. (2026). *Time*. UES-WP-2026-16. https://pointcast.xyz/time.' },
];

export const PAPER_NOTES = {
  uesNote: 'This paper is the synthesis across UES\'s first 18 Working Papers and 7 Federation surfaces. It is the corridor\'s most ambitious paper structurally — a declaration that the institutional form being built deserves a name, recognition, and proliferation.',
  invitation: 'If you are a political scientist or historian of institutional forms who would like to refine, refute, or extend this typology, an organizer in any geography considering federation form for your civic work, a foundation program officer interested in funding federation infrastructure beyond UES, or a journalist documenting the contemporary re-emergence of federation forms, email mh@pointcast.xyz with subject line "Civic Federation · {role}". The paper is open to revision; the form is open to fork.',
  closingNote: 'The Civic Federation is not new. It is older than the corporation, older than the modern nation-state, older than the modern nonprofit. It is currently re-emerging because the four canonical 20th-century forms cannot solve the coordination problems the 21st century has placed at every doorstep. UES is one experimental contemporary instance; we ask other instances to be built, in other geographies, on other timetables, for other reasons. The form belongs to no one. It deserves a name.',
};
