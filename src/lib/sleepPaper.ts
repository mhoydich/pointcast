/**
 * Sleep — UES Working Paper 2026-23.
 *
 * The ninth paper in the Department of Local Inquiry body-practice
 * arc, after /marine-layer, /bath-house, /time, /p2p-ai, /living-body,
 * /civic-federation, /practice, /plant, /food. Sleep is the most-
 * validated single health intervention in modern research (Walker
 * 2017; Stanford Sleep Medicine Center 60+ years of work) and the
 * body practice nearly everyone underdoes. This paper documents the
 * corridor's working sleep framework: architecture, circadian
 * alignment, environment, ritual, common disruptors, 90-day protocol,
 * cohort offerings, honest cautions.
 *
 * Companion to /time (circadian time is the foundation), /marine-
 * layer (the dawn sit depends on the prior night's sleep), /food
 * (timing + composition of evening meal matters), /plant (some
 * adaptogens documented for sleep support).
 */

export const PAPER_META = {
  title: 'Sleep',
  subtitle: 'The body practice nearly everyone underdoes · the most-validated single health intervention in modern research · in the Walker / Stanford / traditional-rest lineage · UES Working Paper 2026-23',
  thesis: 'Sleep is the foundational body practice — the eight-hour daily window during which memory consolidates, the glymphatic system clears the brain, growth hormone repairs tissue, immune function calibrates, emotional processing happens. Yet roughly one-third of American adults sleep less than seven hours per night, and the cumulative cost across decades is measurable across nearly every chronic-disease outcome studied. This paper documents the corridor\'s working sleep framework — architecture (4 NREM stages + REM), circadian alignment, environment, ritual, 7 most-common disruptors honestly named, a 90-day protocol of one shift per fortnight, expanded cohort offerings, and honest cautions about when underlying sleep disorders warrant clinical evaluation. The framing rejects two contemporary defaults — the productivity-cult sleep-debt-as-virtue position and the optimization-tracker quantified-sleep extreme — and adopts the slower position: prioritize sleep as the foundation, build the environment that makes it possible, hold the cohort that supports it. The corridor\'s contribution is not new sleep science; it is the cohort that makes prioritizing sleep durable against a culture that treats sleep as the variable that yields to everything else.',
  paperNumber: 'UES-WP-2026-23',
  date: '2026-05-10',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Inquiry', email: 'mh@pointcast.xyz' },
  ],
  keywords: ['sleep', 'circadian rhythm', 'Matthew Walker', 'sleep architecture', 'CBT-I', 'sleep hygiene', 'University of El Segundo', 'rest practice', 'glymphatic system'],
  parentSurface: 'University of El Segundo · Department of Local Inquiry',
  relatedSurfaces: ['UES-WP-2026-16 Time', 'UES-WP-2026-01 Marine Layer', 'UES-WP-2026-22 Food', 'UES-WP-2026-21 Plant'],
};

export const FRAMING_POSITION = {
  oneSentence: 'Sleep is the foundation. Build the environment that makes 7-9 hours possible, hold the ritual that gets you there, and let the cohort hold you accountable to the practice.',
  whyNotProductivityCult: 'A significant strand of contemporary professional culture treats sleep as the variable that yields — "I\'ll sleep when I\'m dead," "5 hours is enough for high performers," "sleep is for the weak." This is incorrect at every level of analysis: cognitive, physiological, economic, ethical. Walker (2017) synthesized the evidence: persistent short sleep is causally implicated in nearly every chronic disease studied. Yielding sleep to work is yielding the foundation to the building.',
  whyNotOptimizationTracker: 'The opposite extreme — Oura ring, Whoop band, eight-channel polysomnogram-at-home, daily REM-percentage scoring — produces orthosomnia (anxiety about sleep metrics that itself causes worse sleep). The federation\'s position: trackers are useful for short diagnostic windows, harmful as daily anxiety amplifiers. Most people benefit from one 2-4 week tracker window to establish baseline, then no tracking.',
  whyTheBoringConsensus: 'Sleep science\'s boring consensus is reliable and consistent across thirty years of research: 7-9 hours nightly for most adults, consistent bed and wake times, dark cool room, no screens in the final hour before bed, no caffeine after noon, modest alcohol, regular exercise (not late), regular meals (not late), morning sunlight, manage stress. None of this is novel; all of it works. The corridor\'s task is not to invent new sleep advice; it is to make the existing advice livable.',
  whyCohort: 'Individuals trying to improve sleep against a 24/7-on culture, late-meeting work norms, partner-and-family schedules, and the ambient pressure of unlimited screen access mostly fail. The corridor\'s cohort form supports the change. A Sleep Cohort that commits to lights-out by 10pm weeknights, no-screens-after-9pm protocol, and weekly check-in is doing collectively what most cannot do alone.',
  whyTheCorridor: 'Coastal-California latitude (33.9° N), the marine layer\'s reliable morning fog, year-round mild temperatures, dark-sky friendliness in parts of the corridor (Palos Verdes, when the corridor honors light reduction) — all of these are corridor-specific sleep affordances. The corridor lives in a geography that supports sleep better than most US geographies; the work is to use that affordance rather than ignore it.',
};

export const SLEEP_ARCHITECTURE = {
  description: 'A typical adult sleep night cycles through approximately 4-6 ninety-minute cycles. Each cycle moves through stages with different physiological purposes. Understanding the architecture clarifies why "8 hours" is not arbitrary — it covers approximately five full cycles, which is what the brain and body need to complete all four restorative processes.',
  stages: [
    { stage: 'N1 (NREM stage 1) — transition', durationPerCycle: '1-7 minutes', percentOfNight: '~5%', whatHappens: 'Light sleep, easy to wake. Theta brain waves. Muscle activity decreases. Body temperature begins to fall. Hypnic jerks (the falling sensation) sometimes occur here.', whyItMatters: 'The threshold. If repeatedly interrupted at N1, you never enter deeper restorative stages.' },
    { stage: 'N2 (NREM stage 2) — light sleep', durationPerCycle: '10-25 minutes (longer in later cycles)', percentOfNight: '~45-50%', whatHappens: 'Sleep spindles (brief bursts of brain activity) and K-complexes appear on EEG. Heart rate slows, body temperature drops further. Memory consolidation begins.', whyItMatters: 'The bulk of total sleep time. Memory consolidation of motor learning is particularly active here.' },
    { stage: 'N3 (NREM stage 3) — slow-wave / deep sleep', durationPerCycle: '20-40 minutes in first cycles, decreasing later', percentOfNight: '~20-25% (concentrated in first half of night)', whatHappens: 'Delta brain waves. Hardest stage to wake from. Growth hormone release peaks. Glymphatic system (the brain\'s waste-clearance pathway) most active — clears amyloid-beta and tau (implicated in Alzheimer\'s) and other metabolic waste. Immune function calibrates.', whyItMatters: 'The physical-repair stage. Persistent short sleep especially cuts N3, which is why short sleep correlates with weakened immunity, slower wound healing, accelerated cognitive aging. Critical to protect by getting to bed early enough.' },
    { stage: 'REM (Rapid Eye Movement) — paradoxical sleep', durationPerCycle: '10 minutes in first cycle; 30-60 minutes in last cycles', percentOfNight: '~20-25% (concentrated in second half of night)', whatHappens: 'Brain activity nearly identical to wakefulness; body essentially paralyzed (REM atonia) to prevent acting out dreams. Emotional memory processing. Creative connection-forming. Vivid dreams.', whyItMatters: 'Emotional regulation and creative problem-solving. Persistent short sleep especially cuts REM (because REM is concentrated in last cycles), which is why short sleep correlates with mood disturbance, anxiety, difficulty regulating emotional reactions. Why cutting "just an hour" actually cuts more like 25% of REM.' },
  ],
  cycleSummary: 'A complete 8-hour night runs ~5 cycles. First cycles emphasize N3 (deep sleep, physical repair). Last cycles emphasize REM (emotional processing). Sleep deprivation costs both, with last-cycle REM cut disproportionately. Why 8 hours of sleep matters more than the linear extrapolation from 7 suggests — you lose the cycles where the most distinctive processing happens.',
};

export const SEVEN_SLEEP_PRINCIPLES = [
  { principle: '7-9 hours nightly is the baseline', detail: 'Roughly 7-9 hours for most healthy adults; 8-10 for teenagers; 6-7 for older adults (60+) is acceptable; under 6 is uniformly harmful in cumulative analysis. The 5-hour-sleeper "high performer" is approximately 1% of the population; the other 99% claiming this category are sleep-deprived and underperforming relative to their own rested baseline. Honesty about your own number matters more than aspiring to short sleep.' },
  { principle: 'Consistent bed time and wake time', detail: 'Going to bed and waking at the same time daily (including weekends) is among the highest-leverage sleep interventions. The body\'s circadian system entrains to consistency; chaotic schedules force the body to constantly re-set. Weekend "catch-up sleep" partially recovers debt but does not replace circadian entrainment. Same time within 30 minutes daily is the corridor target.' },
  { principle: 'Cool, dark, quiet room', detail: 'Optimal sleep temperature is 60-68°F. The body must lower core temperature to enter and stay in deep sleep; warm rooms prevent this. Dark: no light. Blackout curtains or eye mask. Even small amounts of ambient light (smoke detector LED, charger glow) measurably affect sleep architecture. Quiet: earplugs or white noise as needed. Coastal corridor: marine-layer-cooled nights make 60-68°F achievable without AC for most of the year.' },
  { principle: 'No screens in the last hour before bed', detail: 'Blue light suppresses melatonin (the sleep hormone) — this is well-documented. More importantly, content stimulation (work email, social media, news, video) keeps the cognitive system active when it should be winding down. Replace the last hour with: reading paper books, conversation, light stretching, bath, walk. The last hour is the practice.' },
  { principle: 'No caffeine after noon', detail: 'Caffeine has a 5-7 hour half-life and a 12-hour quarter-life. Coffee at 2pm leaves significant caffeine in the system at 10pm bedtime even for people who feel fine. Reduce or eliminate caffeine after noon as a default. Genetic variation in caffeine metabolism is real; some people tolerate later caffeine, most do not realize they don\'t.' },
  { principle: 'Honest about alcohol', detail: 'Alcohol is a sedative that fragments sleep architecture. It speeds onset (so people think it helps) but suppresses REM and increases wake-after-sleep-onset (so the night quality is worse). One drink a few hours before bed has small effect; two or more drinks within three hours of bed substantially degrades sleep. The federation does not advocate prohibition; it does advocate honesty about the trade-off.' },
  { principle: 'Morning light, evening dim', detail: 'Bright outdoor light in the first hour after waking sets the circadian clock more powerfully than anything else. 15-30 minutes of outdoor light (overcast counts) in the morning. Dim, warm-color indoor lighting after sunset (lamps not overheads, candles when reasonable). The corridor\'s marine-layer dawns are circadian-perfect; the practice is to walk in them.' },
];

export const COMMON_DISRUPTORS = [
  { disruptor: 'Caffeine timing', mechanism: 'Adenosine-receptor blockade with 5-7 hour half-life. Late caffeine prevents N3 deep sleep onset and reduces total sleep time.', fix: 'No caffeine after noon. If anxious about energy crash, shift to morning-only coffee + green tea / matcha (lower caffeine + L-theanine balance).' },
  { disruptor: 'Evening alcohol', mechanism: 'Sedates onset, fragments architecture, suppresses REM, increases wake-after-sleep-onset. Aldehyde dehydrogenase metabolism produces sleep-disruptive byproducts.', fix: 'Last drink at least 3 hours before bed. Limit to 1 drink within the 6-hour pre-sleep window. Or honest periodic abstinence to evaluate impact on your specific sleep.' },
  { disruptor: 'Screens + content stimulation', mechanism: 'Blue light suppresses melatonin (modest effect). Content stimulation (work, social media, news) elevates cortisol + arousal (large effect). Both compound.', fix: 'Hard cut-off 60-90 minutes before bed. Phone outside the bedroom. Charger somewhere else. Replace the screen hour with paper book + conversation + stretching + bath.' },
  { disruptor: 'Late or large meals', mechanism: 'Digestion is energy-intensive; eating within 2-3 hours of bed forces the body to digest rather than enter deep sleep. Large meals especially. Spicy or fatty foods exacerbate.', fix: 'Last meal 3 hours before bed minimum. If hungry close to bed, small carb snack (toast, banana) rather than full meal.' },
  { disruptor: 'Warm bedroom', mechanism: 'Core body temperature must drop to enter and maintain N3 deep sleep. Bedrooms above 68°F prevent this.', fix: 'Thermostat at 60-67°F. Lighter bedding if you run warm. Cool shower 1 hour before bed paradoxically promotes the temperature drop. Marine-layer-cooled bedroom is the coastal-corridor default.' },
  { disruptor: 'Ambient light', mechanism: 'Even small amounts of light (smoke detector LED, streetlight through window, charger glow) suppress melatonin and affect architecture. Light through closed eyelids registers in the suprachiasmatic nucleus.', fix: 'Blackout curtains or eye mask. Cover or remove LEDs in the bedroom. Dim everything to true dark.' },
  { disruptor: 'Inconsistent schedule', mechanism: 'Circadian system cannot entrain to chaotic timing. Weekend shifts of 2+ hours produce "social jet lag" — a real measurable phenomenon comparable to time-zone travel.', fix: 'Same bed and wake time within 30 minutes daily, including weekends. The most boring intervention; one of the most effective.' },
  { disruptor: 'Unmanaged stress', mechanism: 'Elevated evening cortisol prevents sleep onset and increases wake-after-sleep-onset. Rumination cycles in bed amplify the problem. Sympathetic nervous system activation is incompatible with sleep.', fix: 'Pre-sleep practice — body scan, 4-7-8 breath (per /practice), 5 min journaling to externalize tomorrow\'s tasks. If lying awake 20+ minutes, get up briefly. Persistent insomnia warrants CBT-I (cognitive behavioral therapy for insomnia, the gold-standard treatment).' },
  { disruptor: 'Late or intense exercise', mechanism: 'Exercise elevates body temperature + cortisol + sympathetic tone. Intense exercise within 3 hours of bed delays sleep onset for most people.', fix: 'Heavy exercise before 6pm. Light evening movement (walk, gentle stretching, slow yoga) is fine and often beneficial.' },
];

export const ENVIRONMENT_AND_RITUAL = {
  bedroomEnvironment: [
    { element: 'Mattress', recommendation: 'Replace every 8-10 years. Medium-firm typically supports most spine types. Test in store for 15+ minutes before buying. Avoid ultra-cheap mattresses; this is an 8-hour-per-day surface for a decade.' },
    { element: 'Bedding', recommendation: 'Natural fibers (cotton, linen, wool) breathe better than synthetics. Layers for adjustability. Cool to the touch. Wash weekly.' },
    { element: 'Pillows', recommendation: 'Replace every 1-2 years. Height + firmness depend on sleep position (side sleepers higher and firmer, back sleepers medium, stomach sleepers thinner; though stomach sleeping is the worst position for the spine and worth re-training away from).' },
    { element: 'Temperature', recommendation: '60-67°F bedroom. Cooler if anything; the body warms up with bedding. Ceiling fan or open window for air circulation. AC if needed (most corridor bedrooms do not need it most of the year).' },
    { element: 'Light', recommendation: 'Blackout curtains or eye mask. Cover or remove every LED. The bedroom should be true dark when lights are off.' },
    { element: 'Sound', recommendation: 'Quiet preferred. White noise machine acceptable if quiet impossible. Earplugs for partners with different sound tolerances.' },
    { element: 'Phone location', recommendation: 'Outside the bedroom. Use a separate alarm clock. The federation\'s strong recommendation: phone in another room overnight. Most people resist this; most who try it for 2 weeks find their sleep noticeably improves.' },
    { element: 'Clutter', recommendation: 'The bedroom is for sleep + intimacy + reading. Not for work, not for clutter. A tidy bedroom signals "sleep here" to the nervous system in a way a cluttered bedroom does not.' },
  ],
  preSleepRitual: [
    { time: '90 min before bed', practice: 'Last screen of the day (work email finalization, last text reply, etc.). After this, no screens.' },
    { time: '60 min before bed', practice: 'Dim lights. Move from overhead lights to lamps. Lower bedroom temperature if not already. Light activity: take out trash, fold laundry, prepare tomorrow\'s clothes. These low-cognitive-load tasks signal wind-down to the body.' },
    { time: '45 min before bed', practice: 'Bath or shower (if part of your routine). Warm bath is paradoxically sleep-promoting (the post-bath temperature drop accelerates the body\'s sleep-onset temperature shift). Brush teeth, wash face.' },
    { time: '30 min before bed', practice: 'Read a paper book. Fiction or essay or anything not work-coded. Reading by lamp light is the corridor\'s recommended pre-sleep activity. Avoid news or stimulating content.' },
    { time: '15 min before bed', practice: 'Light pranayama OR body scan (per /practice). 4-7-8 breath ×4 rounds OR 5-minute body scan. Sets the parasympathetic state.' },
    { time: 'Lights out', practice: 'Same time within 30 minutes daily. The discipline is the time, not the feeling. Even on nights you feel awake, lie down at lights-out time. The body learns the cadence.' },
  ],
};

export const NINETY_DAY_PROTOCOL = {
  description: 'A 90-day gradual-shift sleep protocol — one change per fortnight rather than total overhaul. Designed for sustainability over speed. The corridor\'s default for someone whose sleep is currently dysregulated.',
  fortnightShifts: [
    { fortnight: 1, weeks: 'Weeks 1-2', shift: 'Establish a consistent wake time. Pick a wake time (typically 6-7am). Wake at this time every day for 14 days including weekends. Do not yet try to fix bedtime; just anchor the wake. The wake-time anchor is the most-leveraged intervention.' },
    { fortnight: 2, weeks: 'Weeks 3-4', shift: 'Add morning light. Within 30 minutes of waking, get 15-30 minutes of outdoor light. Marine-layer fog counts (overcast outdoor is dramatically brighter than indoor lighting). A morning walk before commerce wakes is the corridor practice (also overlaps with /marine-layer).' },
    { fortnight: 3, weeks: 'Weeks 5-6', shift: 'Eliminate caffeine after noon. Hard cut. If energy crash, supplement with morning green tea or matcha + brief midday walk. Most people\'s afternoon energy improves rather than worsens once afternoon caffeine is eliminated, because they\'re no longer fighting fragmented sleep.' },
    { fortnight: 4, weeks: 'Weeks 7-8', shift: 'Hard cut on screens 60 minutes before bed. Phone outside the bedroom. Replace the screen hour with reading + light activity + ritual. This is the hardest fortnight for most people; the cohort matters most here.' },
    { fortnight: 5, weeks: 'Weeks 9-10', shift: 'Establish the bedroom environment: 60-67°F, blackout curtains or eye mask, eliminate all LEDs, phone-out, declutter, fresh bedding. One-time investment + ongoing maintenance.' },
    { fortnight: 6, weeks: 'Weeks 11-12', shift: 'Add the pre-sleep ritual: 30-minute reading + 15-minute body scan or 4-7-8 breath + lights-out at consistent time. The ritual is the practice; it signals to the body that sleep is coming.' },
    { fortnight: 7, weeks: 'Week 13', shift: 'Synthesize. Write a 200-word reflection: what shifts held, what slipped, what cohort support you commit to next quarter. By week 13, total sleep time should have increased ~30-60 minutes nightly and quality should be subjectively better. If not, escalate to clinical evaluation.' },
  ],
};

export const COHORT_OFFERINGS = [
  { offering: 'Sleep Cohort (8-week)', format: 'Weekly 75-min meetings, alternating Mondays and Tuesdays 6:30pm (early enough to honor lights-out). Cap 12. Federation rate $80 per 8-week cycle. Members commit to 10pm lights-out weeknights and the 90-day protocol.', whoLeads: 'Vetted CBT-I-trained practitioner or sleep-coach (corridor practitioner network).' },
  { offering: '10pm Lights-Out Pledge (rolling)', format: 'A standing corridor commitment: 10pm lights-out weeknights, with a daily check-in via shared cohort log. Free. No formal meetings; the accountability is the practice.', whoLeads: 'Self-organizing cohort members.' },
  { offering: 'Morning Light Walk (daily)', format: 'Per /practice Daily Walking Cohort. Tu/Th/Sa 6:30am marine-layer walks; the morning light exposure that anchors circadian timing for the whole cohort.', whoLeads: 'Rotating cohort members.' },
  { offering: 'Pre-Sleep Practice Cohort (4-week)', format: 'Wednesdays 9pm, 4 weeks. Group body scan + 4-7-8 breath + brief reading aloud. Cap 8. Done in person (cohort host\'s living room with cushions) OR via audio call for participants at home. Federation rate $40 per 4-week cycle.', whoLeads: 'Vetted meditation or yoga-nidra teacher.' },
  { offering: 'Insomnia Group (referral)', format: 'Federation does NOT run this directly. The federation\'s referral partner is a CBT-I-trained clinician network. Insomnia warrants clinical CBT-I, the gold-standard treatment, not corridor-cohort substitution. We refer.', whoLeads: 'Vetted CBT-I clinicians.' },
  { offering: 'Sleep Sabbath (monthly)', format: 'Last Saturday of each month: a 25-hour rest window with explicit no-work-no-screens commitment, paired with afternoon nap permission, slow meal, early bedtime. Per /sabbatical extended to monthly sleep-focused window.', whoLeads: 'Self-organizing cohort members.' },
];

export const HONEST_CAUTIONS = {
  whenToSeeAClinican: 'Persistent insomnia (3+ months, 3+ nights/week despite good sleep hygiene), loud snoring with witnessed pauses in breathing (sleep apnea screening warranted), excessive daytime sleepiness despite adequate sleep duration (narcolepsy, idiopathic hypersomnia screening warranted), restless legs symptoms, sleep paralysis, frequent vivid nightmares, sleepwalking, or any sleep complaint that persists despite the 90-day protocol — all warrant evaluation by a sleep-medicine clinician. The federation framework is for healthy sleep maintenance, not undiagnosed sleep-disorder treatment.',
  sleepApnea: 'Obstructive sleep apnea (OSA) is dramatically underdiagnosed. An estimated 80% of moderate-to-severe OSA cases in US adults are undiagnosed. Loud snoring + witnessed apneas + daytime sleepiness + morning headache + hypertension is the cluster to recognize. Home sleep apnea tests are now widely available and affordable. CPAP treatment is highly effective. If you or your partner has these symptoms, screening is the federation\'s strong recommendation.',
  insomniaTreatment: 'Cognitive Behavioral Therapy for Insomnia (CBT-I) is the evidence-based first-line treatment for chronic insomnia and outperforms sleep medications in long-term outcomes. CBT-I is brief (typically 6-8 sessions) and includes sleep-restriction, stimulus-control, cognitive restructuring, and relaxation training. Federation referral network maintains CBT-I-trained clinicians; persistent insomnia is exactly the case where the federation\'s recommendation is "see a clinician" rather than "follow our 90-day protocol."',
  sleepMedications: 'Prescription sleep medications (zolpidem, eszopiclone, etc.) are useful short-term tools (1-4 weeks) for acute insomnia. They are problematic as long-term solutions: tolerance, dependence, withdrawal, residual cognitive effects, fall risk in older adults, possibly accelerated cognitive aging. The federation\'s position is informed honest use, in consultation with a physician, for brief windows when truly needed. Long-term sleep medication is a signal to escalate to CBT-I or sleep-medicine evaluation.',
  shiftWork: 'Shift workers (night shift, rotating shifts, on-call) face genuine biological challenges this paper\'s framework cannot solve. Shift work disorder is real and well-documented. If you are a shift worker, this paper\'s general recommendations apply where they can; specific shift-work sleep strategies (anchor sleep, strategic napping, melatonin timing, light management) are beyond this paper\'s scope and warrant a sleep-medicine clinician familiar with shift work.',
  pregnancy: 'Pregnancy disrupts sleep substantially, especially second and third trimesters. Specific pregnancy guidance: sleep on the left side (third trimester), use pillows for positional support, accept that sleep will be fragmented and that this is normal. Severe pregnancy-related sleep problems (snoring development, pregnancy-onset restless legs, severe insomnia) warrant OB-GYN consultation.',
  children: 'Children\'s sleep needs are substantially higher than adults\' (10-13 hours for ages 3-5, 9-12 for 6-13, 8-10 for 14-17). Bedtime resistance, night waking, early waking are common and usually behavioral. Pediatric sleep is its own field; this paper is for adults. Consult a pediatrician for child-specific guidance.',
};

export const REFERENCES = [
  { id: 'walker', cite: 'Walker, M. (2017). *Why We Sleep: Unlocking the Power of Sleep and Dreams*. Scribner. The contemporary canonical synthesis of sleep science for general readers.' },
  { id: 'dement', cite: 'Dement, W. C. (1999). *The Promise of Sleep: A Pioneer in Sleep Medicine Explores the Vital Connection Between Health, Happiness, and a Good Night\'s Sleep*. Delacorte Press. The Stanford-sleep-lab-founder\'s lifetime synthesis.' },
  { id: 'aaSleep', cite: 'American Academy of Sleep Medicine. (Continuing). *Clinical Practice Guidelines for the Treatment of Adult Insomnia*. aasm.org. The clinical-practice reference.' },
  { id: 'cbt-i-edinger', cite: 'Edinger, J. D., et al. (2021). *Behavioral and psychological treatments for chronic insomnia disorder in adults: an American Academy of Sleep Medicine clinical practice guideline*. Journal of Clinical Sleep Medicine, 17(2), 255-262. CBT-I clinical guideline.' },
  { id: 'glymphatic-xie', cite: 'Xie, L., et al. (2013). *Sleep drives metabolite clearance from the adult brain*. Science, 342(6156), 373-377. The foundational paper on glymphatic-system activity in sleep.' },
  { id: 'czeisler', cite: 'Czeisler, C. A., et al. (1986). *Bright light resets the human circadian pacemaker*. Science, 233(4764), 667-671. Foundational circadian-entrainment research.' },
  { id: 'aschoff', cite: 'Aschoff, J. (1965). *Circadian Rhythms in Man*. Science, 148(3676), 1427-1432.' },
  { id: 'porges', cite: 'Porges, S. W. (2011). *The Polyvagal Theory*. W.W. Norton. Foundation for pre-sleep parasympathetic-activation practice.' },
  { id: 'cappuccio', cite: 'Cappuccio, F. P., et al. (2010). *Sleep duration and all-cause mortality: a systematic review and meta-analysis of prospective studies*. Sleep, 33(5), 585-592. Large meta-analysis establishing U-shaped sleep-duration mortality curve.' },
  { id: 'osa-prevalence', cite: 'Peppard, P. E., et al. (2013). *Increased prevalence of sleep-disordered breathing in adults*. American Journal of Epidemiology, 177(9), 1006-1014. Foundational US OSA prevalence work.' },
  { id: 'orthosomnia', cite: 'Baron, K. G., et al. (2017). *Orthosomnia: Are some patients taking the quantified self too far?* Journal of Clinical Sleep Medicine, 13(2), 351-354. The paper that named the tracker-anxiety syndrome.' },
  { id: 'pointcast-time', cite: 'University of El Segundo. (2026). *Time*. UES-WP-2026-16. https://pointcast.xyz/time.' },
  { id: 'pointcast-marine-layer', cite: 'University of El Segundo. (2026). *Marine Layer*. UES-WP-2026-01. https://pointcast.xyz/marine-layer.' },
  { id: 'pointcast-food', cite: 'University of El Segundo. (2026). *Food*. UES-WP-2026-22. https://pointcast.xyz/food.' },
  { id: 'pointcast-plant', cite: 'University of El Segundo. (2026). *Plant*. UES-WP-2026-21. https://pointcast.xyz/plant.' },
  { id: 'pointcast-practice', cite: 'University of El Segundo. (2026). *Practice*. UES-WP-2026-20. https://pointcast.xyz/practice.' },
  { id: 'pointcast-sabbatical', cite: 'University of El Segundo. (2026). *Sabbatical Infrastructure*. UES-Federation-07. https://pointcast.xyz/sabbatical.' },
];

export const PAPER_NOTES = {
  uesNote: 'Ninth paper in the Department of Local Inquiry body-practice arc. Documents the corridor\'s working sleep framework. The framework is non-novel by design — sleep science\'s boring consensus is reliable and consistent; the corridor\'s contribution is the cohort form that makes the boring consensus livable against a culture that yields sleep to everything else.',
  invitation: 'If you are a corridor cohort member ready to begin the 90-day sleep protocol or join the Sleep Cohort, a CBT-I-trained clinician interested in joining the federation practitioner network, a sleep-medicine physician open to corridor partnership for referral cases, email mh@pointcast.xyz with subject line "Sleep · {role}". Sleep Cohort cap is 12; first cycle begins autumnal-equinox 2026 with weekly Monday evening meetings before lights-out time.',
  closingNote: 'Sleep is the foundation. Build the environment that makes it possible. Hold the ritual that gets you there. Let the cohort hold you accountable to the practice. Eight hours, ninety minutes per cycle, five cycles per night, four nightly stages — N1, N2, N3, REM — each restoring something the day depleted. The corridor\'s contribution is the cohort that makes 10pm lights-out durable against a culture that treats sleep as the variable that yields. Go to bed.',
};
