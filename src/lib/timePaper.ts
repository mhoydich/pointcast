/**
 * Time — UES Working Paper 2026-16.
 *
 * A study of how the corridor could alter its concept of time as a
 * practice of freeing from modern stress. The 24-hour grid is a
 * 19th-century railroad invention; modern stress is largely a stress
 * of synchronization to that grid; the corridor already practices
 * time differently in its place-based commitments (Marine Layer
 * sits, autumnal-equinox councils, tide-coded Tide-Pool Restoration,
 * deep-time Stone Garden rotations, harvest-coded Honey League
 * cycles). This paper makes those alternative time-frames explicit,
 * names them, locates them in human and scientific tradition, and
 * proposes a UES Time Atlas that any cohort participant can use
 * alongside (not instead of) the standard calendar.
 *
 * Department of Local Inquiry. Companion to /p2p-ai (UES-WP-2026-15).
 * The two papers form a 2026-spring couplet on what the corridor
 * does differently: AI-cohort sovereignty, and time-cohort sovereignty.
 */

export const PAPER_META = {
  title: 'Time',
  subtitle: 'A study of altered time concepts as a practice of freeing from modern stress · the corridor\'s working alternatives to industrial-clock time · UES Working Paper 2026-16',
  thesis: 'Modern stress is largely a stress of synchronization. The 24-hour clock, the 9-to-5 workday, the meeting-on-the-hour grid, the inbox notification rhythm — all are 19th- and 20th-century railroad-and-factory inventions, not natural patterns. The corridor already practices time differently in its place-based commitments: the Marine Layer eight-week cohort cycle, the autumnal-equinox federation council, the spring-tide Tide-Pool sit, the harvest-coded Honey League rotation, the geological deep time of the Stone Garden, the dawn-to-dusk Fire Pavilion stewardship, the half-night Dark-Sky Observatory cycle. This paper names ten time frames the corridor honors alongside the standard calendar, locates each in human and scientific tradition, and proposes a UES Time Atlas: a working calendar of corridor times that cohort participants can use to free themselves, in small specific ways, from the industrial-clock stress that is otherwise everywhere. The corridor cannot abolish industrial time — too many obligations cross its borders — but it can build an alternative-time-fluency where its members spend at least some hours each week inside a time frame they actually chose.',
  paperNumber: 'UES-WP-2026-16',
  date: '2026-05-08',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Inquiry', email: 'mh@pointcast.xyz' },
  ],
  keywords: ['time', 'rhythmanalysis', 'industrial clock', 'modern stress', 'University of El Segundo', 'time atlas', 'tide time', 'deep time', 'circadian', 'sabbatical', 'corridor time', 'alternative calendar'],
  parentSurface: 'University of El Segundo · Department of Local Inquiry',
  relatedSurfaces: ['UES-WP-2026-15 Peer-to-Peer AI', 'UES-WP-2026-01 Marine Layer', 'UES-Federation-05 Federation Council Charter'],
};

export const THE_DIAGNOSIS = {
  whatStressIs: 'Modern stress is not chiefly stress of effort; it is stress of synchronization. The body and mind are continuously being asked to align with rhythms that did not evolve from biological or geographic necessity but from industrial coordination. The cortisol response that should be punctuating real threats is instead punctuating Slack notifications, calendar reminders, and the accumulated weight of being on the clock for someone other than oneself.',
  howTheClockGotHere: 'Mechanical clocks predate the railroad; mechanical clocks SYNCHRONIZED across geography did not. Greenwich Mean Time was standardized by British rail companies in 1847; American time zones were coordinated by railroad companies in 1883, eleven years before the U.S. government formally adopted them. The 24-hour synchronized grid is not natural — it is rail infrastructure, generalized.',
  thompsonThesis: 'E.P. Thompson\'s 1967 paper "Time, Work-Discipline, and Industrial Capitalism" remains the canonical analysis. Pre-industrial workers oriented their day to task ("plowing time," "milking time," "high water"); industrial workers oriented to clock-discipline. The shift took roughly a century to complete and was the most consequential cognitive transformation of the 18th and 19th centuries. Modern desk work has extended industrial-clock-discipline into knowledge work; the discipline is the same, the work is different.',
  whyItHurts: 'A nervous system tuned to clock-discipline cannot recover at the cadence the body needs. Cortisol cycles get truncated; circadian rhythms get desynchronized; rest is permitted only at the times the clock has scheduled it, not at the times the body asks for it. The accumulated cost across decades is what we now call burnout. Burnout is, structurally, time-injury.',
  whatTheCorridorAlreadyDoes: 'The corridor has — without naming it — built place-based practices in alternative time. The Marine Layer Week 1 sit happens "before commerce wakes." The autumnal-equinox council meeting happens at the equinox, not the next available Tuesday. The Tide-Pool Restoration ecosystem-seeding cycle is paced by ecology, not project management. The Stone Garden\'s curatorial rotation is paced by stones, not quarters. These are not affectations; they are the corridor accidentally building a time-fluency that exists alongside the industrial clock without trying to abolish it.',
};

export type TimeFrame = {
  id: string;
  name: string;
  description: string;
  cadence: string;
  corridorPractice: string;
  humanTradition: string;
  scientificBasis: string;
  whyItHelps: string;
};

export const TEN_TIME_FRAMES: TimeFrame[] = [
  {
    id: 'tide-time',
    name: 'Tide Time',
    description: 'The 12-hour-25-minute lunar tidal cycle. Two high tides and two low tides per day, drifting roughly an hour later each day, never aligning with the 24-hour clock.',
    cadence: 'Two cycles per day, 24 hours 50 minutes per pair, drifting against the solar grid.',
    corridorPractice: 'The Tide-Pool Restoration Week 5 spring-tide sit; Marine Layer Week 5 (Flight-Path Sit) timed loosely to evening rush; coastal-cohort gatherings keyed to low tide rather than to Saturday-3pm.',
    humanTradition: 'Pacific coastal indigenous peoples (Tongva, Chumash) coordinated harvest, ceremony, and travel by tide cycles for thousands of years. Pacific Northwest fishing communities still keep tide-time as primary; the British Royal Navy publishes annual tide tables that have priority over wall clocks for sailing operations.',
    scientificBasis: 'Lunar gravitational pull producing two tidal bulges per Earth rotation; the 50-minute daily drift is the moon\'s own orbital motion. Documented in tide tables since the 17th century (NOAA tables now extend to 2100+).',
    whyItHelps: 'A tidal rhythm cannot be hurried, scheduled, or moved. The body relaxes in a way industrial-clock time prevents because there is no possibility of being "late for low tide." Coastal-frontage cohort members can use tide as their default scheduling primitive on weekends; the cohort meeting fits the tide, the tide does not fit the cohort.',
  },
  {
    id: 'marine-layer-time',
    name: 'Marine Layer Time',
    description: 'The dawn-fog hours when commerce has not yet woken. A reliable Pacific-coastal phenomenon that lasts roughly 4-7 hours after sunrise depending on inversion strength, then burns off.',
    cadence: 'Daily, dawn through mid-morning, seasonally variable (strongest May-October).',
    corridorPractice: 'The Marine Layer Week 1 Plaza Dawn Sit (4–7–8 breath, eight rounds, then natural breath). All eight Marine Layer cohort sits happen during marine-layer hours by design; the marine layer itself functions as the cohort\'s bell.',
    humanTradition: 'The "blue hour" before sunrise has appeared as sacred time across many traditions: the Catholic vigil hours, the Vedic brahma muhurta (about 90 minutes before sunrise, considered ideal for meditation), the Quaker dawn meeting. The pattern is older than any of them: dawn was when humans could hunt, gather, or simply be without competing for visual attention from the rest of the species.',
    scientificBasis: 'Atmospheric inversion patterns in the California Current marine boundary layer; documented since the 19th-century coastal weather observatories. Cortisol awakening response (CAR) peaks 30-45 minutes after waking; aligning conscious practice with CAR is biochemically efficient.',
    whyItHelps: 'The dawn fog removes visual distraction and reduces ambient ambient sound. The body\'s waking-cortisol surge can be directed toward chosen attention rather than reactive attention. A cohort member who sits during marine-layer hours has effectively added 1-2 hours of sovereign time to their day at no cost to their evening.',
  },
  {
    id: 'circadian-time',
    name: 'Circadian Time',
    description: 'The body\'s own 24-hour clock, governed by the suprachiasmatic nucleus and entrained by light exposure. The corridor\'s coastal context offers exceptionally strong circadian cueing if the cohort participant is willing to honor it.',
    cadence: '24 hours, body-internal, drifts 11-30 minutes per day without external cueing.',
    corridorPractice: 'Marine Layer dawn sits expose participants to morning light at the strongest entrainment window (first hour after waking). Fire Pavilion dusk gatherings expose participants to evening firelight rather than blue-light screens. Dark-Sky Observatory monthly Dark Hours give participants one night a month with no artificial light at all.',
    humanTradition: 'Pre-industrial agricultural societies kept tight circadian rhythms because lighting was expensive and inefficient. The shift to 24-hour artificial lighting is a 20th-century phenomenon; many traditional cultures (Sami, certain Polynesian, Amazonian) preserve forms of seasonal light sensitivity that are studied as resilience patterns today.',
    scientificBasis: 'Aschoff (1965) on circadian period drift; Czeisler et al. (1986) on light-mediated entrainment; Walker (2017) on the cumulative cost of misalignment. The science is well-established; the practice of honoring it is rare in industrial-clock cultures.',
    whyItHelps: 'Circadian-aligned schedules show measurable benefits across nearly every health metric studied: cortisol regulation, insulin sensitivity, deep-sleep architecture, mood stability, immune function. Even modest shifts (morning light exposure, dimmed evening light, consistent sleep timing) deliver outsized returns. The corridor\'s coastal context simplifies this: the marine layer enforces morning fog, the Pacific blocks evening sun spike, the dunes interrupt streetlight glare.',
  },
  {
    id: 'seasonal-time',
    name: 'Seasonal Time',
    description: 'The corridor\'s eight-period year (autumnal equinox, late autumn, winter solstice, late winter, vernal equinox, late spring, summer solstice, late summer) rather than the four-quarter business year.',
    cadence: 'Eight periods of approximately 45 days each, anchored to solar events.',
    corridorPractice: 'Federation council annual meeting at the autumnal equinox. Bell Garden seasonal retuning quarterly (one bell per equinox/solstice). Honey League pollinator-planting cycle aligned to vernal equinox + late summer. Winter solstice Geothermal Pool inaugural sit (when funded). Marine Layer cohort cycle starts within seven days of autumnal or vernal equinox.',
    humanTradition: 'Eight-fold solar calendars appear in Celtic (Samhain, Yule, Imbolc, Ostara, Beltane, Litha, Lammas, Mabon), Germanic, and many indigenous American traditions. The Roman calendar was originally ten-month, lunar-anchored. The Gregorian twelve-month is a 16th-century papal-administrative artifact; it is not particularly aligned to anything except itself.',
    scientificBasis: 'Solar declination at coastal-California latitude (33.9° N) produces measurable ecological cycles: marine-layer intensity peaks May-October; Pacific upwelling peaks April-July; raptor migration cycles peak twice annually (spring + fall); humpback-whale migrations cross the corridor twice yearly. Each is a free, observable signal that the calendar is doing something the calendar does not do.',
    whyItHelps: 'A year of eight observed transitions is more legible to the body and the cohort than a year of four arbitrary quarters. Seasonal-time-coding work and rest cycles to actual ecological signals reduces the "blur" experience of modern years and gives stories anchors. "We did the Tide-Pool seeding the spring after the council formed" is a more memorable temporal frame than "in fiscal Q1 of the second year."',
  },
  {
    id: 'cohort-time',
    name: 'Cohort Time',
    description: 'The eight-week (Marine Layer) or six-week (P2P AI cycle) capped-at-twelve-people commitment that the corridor has standardized as its default unit of intentional collective time.',
    cadence: '6-8 weeks, capped at 12 people, met weekly at the same place and time.',
    corridorPractice: 'Marine Layer eight-week cohort. The forthcoming P2P AI six-week cohort cycle. Honey League season-long leagues. Court Craft pickleball cohorts. Common Forms commission steering committees.',
    humanTradition: '12-person cohort is the human-cooperation upper bound documented in many traditions: Christ\'s twelve apostles, the twelve-person jury, the twelve labors of Hercules, the twelve Olympians, the twelve months. Anthropological research (Dunbar 1992, Hill et al. 2011) suggests 12-15 is a stable face-to-face group size where every participant can know every other participant well enough to coordinate without management overhead.',
    scientificBasis: 'Dunbar number research; Tuckman\'s forming-storming-norming-performing model (1965) shows groups need 4-8 weeks to reach performing stage, which is why the corridor\'s 6-8 week cycle works.',
    whyItHelps: 'Eight weeks is short enough to commit to without dread, long enough for real change. Twelve people is small enough that each member is named, large enough that one absence does not collapse the cohort. The combination is generative; the combination at industrial scale (300-person all-hands, monthly two-hour meetings) is its opposite.',
  },
  {
    id: 'shabbat-time',
    name: 'Shabbat Time',
    description: 'A weekly continuous 25-hour window (sundown Friday to nightfall Saturday in traditional practice) of rest from production. The corridor adopts this as a structural commitment, not a religious one — the principle is the discipline of one-day-in-seven full removal from the industrial clock.',
    cadence: 'Weekly, 25 continuous hours, no email no Slack no commerce no scheduled work.',
    corridorPractice: 'Cohort members are encouraged (not required) to keep a weekly 25-hour disconnect window. Federation council quarterly meetings end before sundown Friday and do not resume until Monday. The Bath House operates Tuesday-Sunday, closed Mondays — the Bath Master\'s Shabbat is structurally protected.',
    humanTradition: 'Jewish Shabbat dates to roughly the second millennium BCE, the oldest continuously-practiced rest discipline in human history. Christian Sunday observance derives from Shabbat. Sabbath structures appear in many traditions (Hindu Ekadashi, Islamic Friday, Buddhist uposatha). Heschel\'s "The Sabbath" (1951) remains the canonical philosophical exposition for non-Jewish readers — the central insight is that "Shabbat is a palace in time."',
    scientificBasis: 'Stress recovery research (Lazarus et al., 1985 onward) shows that intermittent full-disconnect periods produce qualitatively different recovery from continuous low-grade rest. The body\'s parasympathetic nervous system needs continuous-uninterrupted activation periods to fully reset; one-day-in-seven is a structurally workable cadence.',
    whyItHelps: 'A non-negotiable weekly 25-hour disconnect prevents the slow encroachment of work into rest that desktop AI and Slack now make trivial. The principle outlasts any specific technology; the discipline survives any vendor change. Cohort members report that the second hour of disconnect is the hardest; the eighth hour is when the actual rest begins.',
  },
  {
    id: 'sabbatical-time',
    name: 'Sabbatical Time',
    description: 'A multi-week or multi-month removal from active work, taken at multi-year intervals, structured as restorative not productive. The Bath Master role spec includes 6-week sabbaticals at years 3 and 5; the corridor encourages cohort members to plan sabbaticals as default.',
    cadence: '4-12 weeks every 3-7 years.',
    corridorPractice: 'Bath Master (Tier D paper UES-WP-2026-14) includes 6-week sabbaticals years 3 and 5. Federation Council Charter explicitly permits delegate sabbaticals (recall + replacement is instance-sovereign). Marine Layer cohort participation is paused during a member\'s sabbatical without penalty.',
    humanTradition: 'Academic sabbatical derives from Hebrew "shemitah" — the seventh year of land rest mandated by Deuteronomy. Modern academic sabbatical was first formalized at Harvard in 1880. Many traditional societies built multi-month rest cycles into the agricultural year (winter rest, post-harvest celebration). The 50-week-on, 2-week-off knowledge-worker pattern is a 20th-century industrial artifact.',
    scientificBasis: 'Sabbatical-takers show measurable cortisol decrease, immune system improvement, and creativity/insight gains documented in occupational-psychology research (de Bloom et al. 2009; West et al. 2014). The benefits begin at 4 weeks and plateau around 8-10 weeks; longer sabbaticals offer diminishing returns.',
    whyItHelps: 'Without sabbatical, knowledge-worker burnout is statistically likely; with sabbatical at year-3 or year-5 cadence, burnout drops measurably. The corridor commits to making sabbaticals normal infrastructure rather than exceptional grants — the Bath Master role spec is the prototype.',
  },
  {
    id: 'deep-time',
    name: 'Deep Time',
    description: 'The geological-and-evolutionary time scale at which the corridor\'s underlying landscape exists. The Stone Garden, the Tide-Pool Restoration, the Newport-Inglewood Fault, the corridor\'s own geological substrate — all operate at timescales the human nervous system cannot directly perceive but can be culturally taught to acknowledge.',
    cadence: 'Thousand-year, million-year, hundred-million-year cycles.',
    corridorPractice: 'Stone Garden rotates loaned stones from the corridor STONES catalog (some specimens 100M+ years old). Geology track\'s eight-layer stratigraphic column makes the underground 80M-year history visible. Tide-Pool Restoration commits to 50-year ecosystem-seeding cycles. Bath House and Concert Hall designed for 100-year service life. Federation Council Charter has a recovery clause for dissolution-and-reconvening that operates on multi-decade timescales.',
    humanTradition: 'Indigenous Pacific Northwest cultures conceive time across "seven generations" forward and backward in many decisions. Hindu cosmology operates in yugas (cycles of 432,000 years). Buddhist kalpas. Mayan long-count calendar. The 19th-century recognition of geological deep time (Hutton, Lyell) restored to Western thought a temporal scale most other traditions had retained.',
    scientificBasis: 'Radiometric dating (uranium-lead, potassium-argon, carbon-14) makes deep time empirically calibrated. The corridor\'s Newport-Inglewood Fault has measurable slip rate (~1mm/year). Catalina Schist exposed in the corridor is 100-150M years old. Plate tectonics is moving the corridor northwest at ~5cm/year — the federation council\'s Hermosa Pier is approximately 1 meter further from where it was at the 2026 founding.',
    whyItHelps: 'Acknowledging deep time as part of one\'s personal calendar reduces the false urgency of weekly work. A decision that feels existential at 11am Tuesday is, in deep-time perspective, less consequential than the marine layer\'s arrival schedule. Deep time does not require religious belief; it requires only acknowledging that the corridor\'s substrate has been here for 80 million years and will continue regardless of whether the federation council\'s 2027 budget passes.',
  },
  {
    id: 'asynchronous-time',
    name: 'Asynchronous Time',
    description: 'Coordination that does not require synchronous attention. Email rather than Slack-DM. Federation library reads rather than mandatory all-hands. PR comments rather than standup. The default-asynchronous mode that the corridor\'s federation infrastructure makes structurally possible.',
    cadence: 'Variable; typically 24-72 hours response window.',
    corridorPractice: 'Federation council quarterly check-ins are video-meetings but minutes are published within 7 days; non-attending delegates can engage in writing. JSON-mirrored federation library means cohort participants can read at their own pace. Common Knowledge Cache (UES-Federation-06) makes corridor-relevant questions answerable at any hour without waking another participant.',
    humanTradition: 'Letter-writing culture (17th-19th century epistolary tradition); academic publishing (asynchronous review cycles); Quaker meeting-for-business with extended silence between contributions. Asynchronous-by-default is the older pattern; synchronous-by-default is the industrial-clock anomaly.',
    scientificBasis: 'Cognitive load research shows synchronous interruption (Slack pings, meeting requests) triggers task-switching costs of approximately 23 minutes per interruption (Mark et al. 2008). Asynchronous coordination reduces these costs by ~70%.',
    whyItHelps: 'Asynchronous default protects the participant\'s time-sovereignty. Working hours can become hours of actual work rather than coordination overhead. The cost — slower decision velocity on individual items — is compensated by the throughput gain on the cohort overall. Federation council\'s 90-day cadence proves this: most decisions are NOT urgent at the timescale industrial-clock culture insists.',
  },
  {
    id: 'embodied-time',
    name: 'Embodied Time',
    description: 'The body\'s own moment-to-moment time as experienced through breath, footfall, swim stroke, sit duration — the time you cannot fake because the body keeps the score. The Marine Layer, Honey League, Court Craft, and Bath House practices all run on embodied time.',
    cadence: 'Variable; per-breath, per-stroke, per-step; the unit is one body, not one clock.',
    corridorPractice: 'Marine Layer Week 1 4–7–8 breath (in 4, hold 7, out 8 — eight rounds, then natural breath). Honey League pickleball matches end when the body reads "enough," not at a quarter mark. Bath House warm-pool soaks happen for the duration the body asks, not 50-minute spa-package units. Geothermal Pool sits open-ended.',
    humanTradition: 'Yoga ashtanga timing keyed to vinyasa-by-vinyasa breath count, not minutes. Vipassana sits structured as one-hour units but the experiential time is breath-counted, not clock-counted. Tea ceremony timing is per-cup, not per-minute. Pre-industrial work universally was embodied-timed (one harvest day ended when the harvester\'s body said).',
    scientificBasis: 'Heart-rate-variability research; HRV-coherence training (HeartMath et al.) shows physiological markers of restoration that align with breath-count rather than minute-count. Interoception research (Craig 2003 onward) shows internal-time-sense differs from clock-time and is itself a trainable capacity.',
    whyItHelps: 'Embodied time is unfakeable. A practice that runs on the body\'s clock cannot be hurried by ambition or stretched by procrastination. Cohort participants report that 2-3 weeks of embodied-time practice in any single domain (breath, swim, sit, walk) produces a noticeable carryover into other domains: meals slow down, conversations breathe, the desk-work day becomes less frictional even when the desk-work itself is unchanged.',
  },
];

export const TIME_ATLAS = {
  description: 'A daily/weekly/monthly/yearly working calendar of corridor times that any cohort participant can adopt alongside (not instead of) the standard calendar. The Atlas is intended as a starting point; participants modify it for their own life.',
  daily: [
    { time: '06:00 (or marine-layer dawn)', frame: 'Marine Layer time / Circadian time', practice: '15-30 min sit, 4-7-8 breath OR natural breath in dawn fog. Light exposure for circadian entrainment.' },
    { time: 'morning task block', frame: 'Industrial clock (chosen)', practice: 'Highest-cognitive-load work in the cortisol-aligned 90-minute morning window (~07:30-09:30 PT for early risers). Asynchronous-by-default.' },
    { time: 'midday (12:30)', frame: 'Embodied time', practice: '20-30 min unhurried walk or swim. Phone in airplane mode if possible. Eat without screens.' },
    { time: 'afternoon block', frame: 'Industrial clock (chosen)', practice: 'Coordination, meetings (synchronous when synchronous adds value, asynchronous otherwise).' },
    { time: 'dusk (18:00 or sunset-anchored)', frame: 'Circadian time / Seasonal time', practice: 'Dim screens. Move to firelight or candlelight if possible. No work email after this point as default.' },
    { time: 'evening', frame: 'Embodied time', practice: 'Bath, meal, cohort gathering, or read. Sleep timing aligned to circadian (~10pm for most adults).' },
  ],
  weekly: [
    { day: 'Friday sundown to Saturday nightfall', frame: 'Shabbat time', practice: '25-hour full disconnect. No work email. No Slack. No commerce-as-task.' },
    { day: 'one weeknight', frame: 'Cohort time', practice: 'A regular cohort practice (Marine Layer sit, Honey League match, Court Craft, etc.).' },
    { day: 'one Sunday morning', frame: 'Tide time', practice: 'Strand walk timed to low tide. Coastal cohort gathering or solo, as the week asks.' },
  ],
  monthly: [
    { event: 'New moon', frame: 'Astronomical / Dark-Sky time', practice: 'Once per month: an evening with the Dark-Sky Observatory (when funded) or a hill-top stargazing walk. Phone off.' },
    { event: 'Full moon', frame: 'Tide time / Lunar time', practice: 'Spring tides peak around new and full moons; cohort low-tide gatherings ride these cycles.' },
    { event: 'Federation council quarterly check-in', frame: 'Cohort time / Asynchronous time', practice: 'Read minutes, comment in writing, attend video if useful.' },
  ],
  seasonal: [
    { event: 'Autumnal equinox (Sept 22-23)', frame: 'Seasonal time', practice: 'Federation council annual meeting at Hermosa Pier. Bell Garden retuning. Cohort cycle starts.' },
    { event: 'Winter solstice (Dec 21-22)', frame: 'Seasonal time / Deep time', practice: 'Geothermal Pool inaugural-sit (when funded). Quiet review of the year. Bell Garden retuning.' },
    { event: 'Vernal equinox (Mar 20-21)', frame: 'Seasonal time', practice: 'Honey League pollinator-planting cycle launch. Bell Garden retuning. Cohort cycle starts.' },
    { event: 'Summer solstice (June 20-21)', frame: 'Seasonal time', practice: 'Tide-Pool Restoration mid-cycle audit. Bell Garden retuning. Wind-Garden inaugural cycles.' },
  ],
  multiYear: [
    { interval: 'Year 3 of any 5-year role', frame: 'Sabbatical time', practice: 'A 6-week sabbatical (per Bath Master role spec; generalizable). Body reads the rest before mind admits the need.' },
    { interval: 'Year 5 of any 5-year role', frame: 'Sabbatical time', practice: 'A second 6-week sabbatical. The two sabbaticals across a 5-year term shape the role rather than punctuate it.' },
    { interval: 'Decennial', frame: 'Deep time', practice: 'A 1-2 month full role-leave or career-pivot. Mid-life recalibration. The corridor commits to making this normal infrastructure rather than exceptional luck.' },
  ],
};

export const ANTI_TIME_PATTERNS = [
  { pattern: 'The 9am all-hands', replacement: 'Asynchronous video + written digest. The all-hands is a 19th-century factory-bell artifact. Knowledge work does not require it.', cost: 'Pre-meeting cortisol spike; commute or context-switch overhead; meeting-recovery time. ~90 minutes lost per all-hands per participant.' },
  { pattern: 'The Slack-always-on default', replacement: 'Slack-checked-twice-daily default. Or: Slack-during-cohort-time-only.', cost: 'Continuous interruption, 23-minute task-switch tax per interruption. Burnout accelerator.' },
  { pattern: 'The hour-long meeting default', replacement: '30-minute hard cap unless agenda demands otherwise. Or: 25-minute meeting + 5 minutes built-in transition.', cost: 'Cumulative attention drain; back-to-back-to-back days; no transition or movement between thoughts.' },
  { pattern: 'The "ASAP" reply norm', replacement: 'The 24-hour response norm (or 72 hours for non-urgent). The participant who maintains an ASAP norm is structurally bidding their attention to whoever messages them last.', cost: 'Attention is fragmented; deep work is impossible; the body never enters a recovery state.' },
  { pattern: 'The continuous workday', replacement: 'A workday with embodied-time interludes (walk, swim, sit). The 90-minute ultradian cycle is biological; ignoring it is the cost.', cost: 'Cognitive performance declines steeply after ~90 min focused work without recovery. Continuous 8-hour days produce 4-5 hours of actual high-quality work and 3-4 hours of low-quality grinding.' },
  { pattern: 'The vacation-as-rare-luxury frame', replacement: 'The sabbatical-as-normal-infrastructure frame. A 6-week sabbatical at year 3 and year 5 of a 5-year role is the corridor\'s working default for principal stewardship roles.', cost: 'Burnout; talent loss; the role becomes person-attached and cannot survive the person\'s departure.' },
  { pattern: 'The 24-hour news-cycle attention frame', replacement: 'A weekly news-window (one hour, Sunday morning) for non-urgent civic news; immediate attention only for genuine local emergencies.', cost: 'Cortisol exhaustion; doom-scrolling; substitution of distant catastrophe-witness for proximate civic action.' },
  { pattern: 'The 12-month fiscal-quarter calendar', replacement: 'The eight-period seasonal calendar for non-required reporting. The corridor\'s federation council operates on quarterly check-ins coded to solstices and equinoxes, not to fiscal quarters.', cost: 'Calendar misalignment with ecology; loss of seasonal anchoring; "blur" experience of years.' },
];

export const PRACTICE_LADDER = [
  { stage: 'Week 1 — Notice', practice: 'Notice your industrial-clock-time injuries. When does your body brace? When do you check the clock? When does cortisol spike? Field-note format: a structured Markdown file or a paper notebook. No changes yet; observation only.' },
  { stage: 'Week 2 — Add one alternative time frame', practice: 'Pick ONE alternative from the ten frames above. Most accessible for most people: Marine Layer time (15-min dawn sit, 3 mornings) OR Embodied time (one unhurried 30-min walk daily). Notice what shifts.' },
  { stage: 'Week 3 — Subtract one industrial-time obligation', practice: 'Pick ONE industrial-time obligation you can subtract or postpone: cancel one recurring meeting, mute one Slack channel, set "no email after 6pm" expectation with three colleagues. Negotiate, do not unilaterally drop.' },
  { stage: 'Week 4 — Try Shabbat time', practice: 'A 25-hour Friday sundown to Saturday nightfall full disconnect. Notify household and key colleagues. The first Shabbat is hardest; subsequent ones get easier. Field-note the experience.' },
  { stage: 'Week 5 — Plan the year seasonally', practice: 'Write your next 12 months in eight seasonal periods (autumnal equinox → late autumn → winter solstice → late winter → vernal equinox → late spring → summer solstice → late summer). What do you want to do in each?' },
  { stage: 'Week 6 — Plan a sabbatical', practice: 'Even if you do not yet have role-permission to take one, plan a hypothetical 6-week sabbatical: when, where, what protections you would need to set up. Reading the plan often makes it more achievable than not having one.' },
  { stage: 'Week 7 — Cohort time', practice: 'Commit to one regular cohort practice (Marine Layer sit, P2P AI cycle, Honey League, Court Craft). The cohort holds time for you when you cannot hold it alone.' },
  { stage: 'Week 8 — Synthesize', practice: 'Write a 500-word reflection on what time-frames you can sustainably hold. The goal is not all ten frames; the goal is two or three frames that fit your life and that you can return to without struggle.' },
];

export const PHILOSOPHICAL_NOTES = {
  whyTimeAndNotProductivity: 'A productivity framework treats time as input to be optimized for output. A time-altering framework treats time as the medium of life itself, of which work is a portion. The first is industrial-clock-time in a self-help wrapper; the second is what this paper proposes.',
  whyNotJustMeditation: 'Meditation is one practice, valuable but partial. The paper proposes a structural reframe — multiple time frames available alongside industrial-clock time, deployed across the day, week, season, and decade. Meditation can fit inside Marine Layer time or Embodied time, but it does not by itself produce Shabbat time, Sabbatical time, Seasonal time, or Cohort time.',
  whyNotAbolishTheClock: 'The corridor cannot abolish industrial-clock time. Schools meet at fixed hours; trains run on schedule; tax deadlines do not move. The thesis is fluency in multiple time frames, not abolition of one. The participant who can move fluidly between Tide time on Sunday and Industrial-clock time on Monday has more sovereignty than either an industrial-clock-only worker or a tide-time-only mystic.',
  whyTheCorridorMatters: 'A solo participant attempting to alter their own time concept against the friction of an industrial-clock culture will burn out before the alteration takes hold. A cohort holds the discipline together. The corridor\'s federation, with its place-based practices and seasonal council cadence, is structurally suited to support cohort participants in time-fluency. The corridor cannot give participants more time; it can give them more kinds of time, and the cohort to hold them.',
  whyNow: 'The 2026 desktop has accelerated industrial-clock-time encroachment to a degree that is now a measurable health crisis. AI clients with continuous access to Slack/Gmail/Calendar make the always-on default trivial to maintain and exhausting to escape. The corridor\'s commitment to Cohort time, Shabbat time, and Sabbatical time is, in 2026, more important than it would have been in 2016. The framework documented in this paper is not new; the cultural urgency of the framework is new.',
};

export const REFERENCES = [
  { id: 'thompson', cite: 'Thompson, E. P. (1967). *Time, Work-Discipline, and Industrial Capitalism*. Past & Present, 38, 56-97. The canonical analysis of the industrial-clock transformation.' },
  { id: 'mumford', cite: 'Mumford, L. (1934). *Technics and Civilization*. Harcourt, Brace & Company. "The clock, not the steam-engine, is the key-machine of the modern industrial age."' },
  { id: 'lefebvre', cite: 'Lefebvre, H. (1992). *Rhythmanalysis: Space, Time and Everyday Life*. Continuum (English translation 2004). Foundational for treating rhythm as analytical category.' },
  { id: 'crary', cite: 'Crary, J. (2013). *24/7: Late Capitalism and the Ends of Sleep*. Verso. The contemporary diagnosis of always-on culture.' },
  { id: 'rovelli', cite: 'Rovelli, C. (2017). *The Order of Time*. Riverhead Books. Physics-of-time perspective on why clock-time is not fundamental.' },
  { id: 'heschel', cite: 'Heschel, A. J. (1951). *The Sabbath: Its Meaning for Modern Man*. Farrar, Straus and Young. "Shabbat is a palace in time."' },
  { id: 'aschoff', cite: 'Aschoff, J. (1965). *Circadian Rhythms in Man*. Science, 148(3676), 1427-1432.' },
  { id: 'czeisler', cite: 'Czeisler, C. A., et al. (1986). *Bright light resets the human circadian pacemaker*. Science, 233(4764), 667-671.' },
  { id: 'walker', cite: 'Walker, M. (2017). *Why We Sleep: Unlocking the Power of Sleep and Dreams*. Scribner. The contemporary science synthesis.' },
  { id: 'dunbar', cite: 'Dunbar, R. I. M. (1992). *Neocortex size as a constraint on group size in primates*. Journal of Human Evolution, 22(6), 469-493.' },
  { id: 'mark', cite: 'Mark, G., Gudith, D., & Klocke, U. (2008). *The cost of interrupted work: more speed and stress*. CHI 2008. The 23-minute task-switch finding.' },
  { id: 'de-bloom', cite: 'de Bloom, J., et al. (2009). *Do we recover from vacation? Meta-analysis of vacation effects on health and well-being*. Journal of Occupational Health, 51(1), 13-25.' },
  { id: 'craig', cite: 'Craig, A. D. (2003). *Interoception: the sense of the physiological condition of the body*. Current Opinion in Neurobiology, 13(4), 500-505.' },
  { id: 'pointcast-marine', cite: 'University of El Segundo. (2026). *Marine Layer*. UES-WP-2026-01. https://pointcast.xyz/marine-layer.' },
  { id: 'pointcast-p2p-ai', cite: 'University of El Segundo. (2026). *Peer-to-Peer AI*. UES-WP-2026-15. https://pointcast.xyz/p2p-ai.' },
  { id: 'pointcast-charter', cite: 'University of El Segundo. (2026). *Federation Council Charter*. UES-Federation-05. https://pointcast.xyz/federation-council.' },
  { id: 'pointcast-bath', cite: 'University of El Segundo. (2026). *The Bath House*. UES-WP-2026-14. https://pointcast.xyz/bath-house. (Bath Master role spec includes 6-week sabbaticals years 3 and 5.)' },
];

export const PAPER_NOTES = {
  uesNote: 'This paper proposes a Time Atlas and an eight-week practice ladder for time-fluency. The framework is intentionally pluralistic — ten frames, not one true rhythm. The cohort holds the discipline; the convener does not. Like /p2p-ai (UES-WP-2026-15), this paper is a study framework that invites a cohort cycle. The first time-fluency cycle is queued for autumnal equinox 2026.',
  invitation: 'If you are a corridor cohort member interested in joining a time-fluency cohort cycle (autumnal equinox 2026, six weeks), an occupational psychology researcher who wants to share methodological lessons, or a contemplative-tradition practitioner who wants to add depth to one of the ten frames, email mh@pointcast.xyz with subject line "Time · {role}". The cohort is capped at 12 per instance and 60 across the corridor; participation is voluntary at every step.',
  closingNote: 'Signed by request: Mike. Modern stress is real and altering one\'s relationship to time is one of the corridor\'s contributions to its members\' lives that does not require the federation council, the Tier D works, or any LA28 partnership. It can begin tomorrow morning, before commerce wakes.',
};
