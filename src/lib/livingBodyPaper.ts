/**
 * The Living Body — UES Working Paper 2026-18.
 *
 * Department of Local Inquiry. The federation's foremost-resource
 * surface on the three traditions of mapped body-energy: traditional
 * Chinese medicine (TCM) meridians, Indian/Yogic chakras, and
 * acupuncture (TCM + Western-integrated practice). A positive-belief
 * framework that treats these traditions as significant practices
 * worth careful study, accurate documentation, and corridor-cohort
 * integration — alongside (not replacing) honest contemporary
 * scientific inquiry.
 *
 * Companion to /marine-layer (sit practice), /time (altered time),
 * /bath-house (water and heat practice). The Living Body completes
 * the corridor's body-practice quartet: breath, time, water, energy.
 */

export const PAPER_META = {
  title: 'The Living Body',
  subtitle: 'A foremost-resource framework on meridians, chakras, and acupuncture · positive-belief study under Department of Local Inquiry · UES Working Paper 2026-18',
  thesis: 'Three traditions — traditional Chinese medicine (TCM) meridians, Indian/Yogic chakras, and acupuncture practice in its modern integrated form — together describe a Living Body that is more than its anatomy. Each tradition maps the body, names its energy flows, and identifies points of intervention. Each tradition has continuous documented practice for at least 2,000 years (TCM/acupuncture) and at least 1,500 years (chakra). Each tradition has been validated by lived practitioners across cultures and centuries to a degree that would be the envy of any contemporary therapeutic system if measured by longevity alone. The federation\'s working position is positive: these traditions are significant, deserve foremost-resource documentation, and integrate naturally with the corridor\'s existing body practices (Marine Layer sit, Bath House heat-and-cold, Time-fluency). This paper documents the three traditions with traditional accuracy, names the contemporary scientific findings honestly (what is supported, what is contested, what is genuinely unknown), maps how the corridor practices integrate the three, and proposes UES as the South Bay\'s foremost public-good resource on living-body practice. No commercial promotion; no proprietary methods; no over-claiming. Just careful documentation of practices worth honoring.',
  paperNumber: 'UES-WP-2026-18',
  date: '2026-05-08',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Inquiry', email: 'mh@pointcast.xyz' },
  ],
  keywords: ['meridians', 'chakras', 'acupuncture', 'traditional Chinese medicine', 'TCM', 'yoga', 'tantra', 'living body', 'body-energy', 'University of El Segundo', 'positive belief', 'integrative practice'],
  parentSurface: 'University of El Segundo · Department of Local Inquiry',
  relatedSurfaces: ['UES-WP-2026-01 Marine Layer', 'UES-WP-2026-14 The Bath House', 'UES-WP-2026-16 Time', 'UES-WP-2026-15 Peer-to-Peer AI'],
};

export const FRAMING_POSITION = {
  positiveBelief: 'The federation holds that the three traditions documented here are significant. Significant means: continuously practiced for two millennia or more, refined by hundreds of thousands of practitioners across many cultures, documented in foundational texts that have informed both traditional medicine and contemporary integrative health. The federation does not claim these traditions are scientifically complete or that all their claims have been validated by contemporary research methods. It claims that they are worth careful documentation, respectful study, and corridor-cohort integration.',
  notProselytizing: 'This paper does not advocate that anyone adopt any tradition. It documents what the traditions say about the body, who has practiced them, where the contemporary evidence is strong and where it is contested. Readers may engage at any depth, including not at all. The federation cohort offers integration; the federation does not require it.',
  notDismissive: 'The paper also does not adopt the dismissive register common in mainstream Western medicine when these traditions appear. "Pseudoscience" is a word that does work for the speaker; it does not do work for the millions of practitioners across centuries who found these practices meaningful. The federation\'s position is documentary respect even where contemporary research has not (yet) validated specific mechanisms. Honest uncertainty is the position; categorical dismissal is not.',
  scientificHonesty: 'Where contemporary research strongly supports a finding (e.g., acupuncture\'s efficacy for chronic low back pain, NIH NCCIH systematic reviews; vagal-tone modulation via breath practice, Porges polyvagal theory), the paper says so. Where research has not validated a specific mechanism (e.g., the qi-as-measurable-energy-flow hypothesis), the paper says so. Where research is genuinely emerging (e.g., fascia-as-tensile-network research possibly relating to meridian mapping), the paper notes the work without overclaiming. Honesty cuts both ways.',
  whyTheCorridorAndNotJustSomeone: 'A solo practitioner in any of these traditions is hard to find, expensive when found, and varies wildly in quality. The corridor\'s federation infrastructure (cohort cap-12, voluntary association template, federation library) can host vetted practitioner networks, document outcomes openly, and offer first-time-practitioner cohort experiences at affordable cost. The federation makes vetted access easier than the open market does — that is the contribution.',
};

export type Tradition = {
  id: string;
  name: string;
  origin: string;
  age: string;
  foundationalTexts: string;
  coreClaim: string;
  majorBranches: string;
  contemporaryReach: string;
  whatModernResearchSays: string;
};

export const THREE_TRADITIONS: Tradition[] = [
  {
    id: 'tcm-meridians',
    name: 'Traditional Chinese Medicine · Meridians',
    origin: 'China, originating in the late Warring States period (3rd c. BCE) and consolidated in the Han dynasty (200 BCE - 220 CE).',
    age: '~2,300 years of continuous documented practice.',
    foundationalTexts: 'Huangdi Neijing (黄帝内经, "Yellow Emperor\'s Inner Canon") compiled c. 2nd c. BCE; Lingshu (灵枢) and Suwen (素问) sections. Nan Jing (难经, "Classic of Difficulties") c. 1st-2nd c. CE. Zhenjiu Jiayi Jing (针灸甲乙经, "Systematic Classic of Acupuncture and Moxibustion") c. 256-282 CE.',
    coreClaim: 'The body has 12 primary channels (jingluo, 经络) plus 8 extraordinary channels through which qi (vital energy) circulates. Disease is understood as obstruction or imbalance in these flows; treatment restores the flow via needling (acupuncture), heat application (moxibustion), pressure (acupressure), or herbal-medicine tonification.',
    majorBranches: 'Five-Element school (Wu Xing, 五行 — wood, fire, earth, metal, water correspondences); Eight Principles diagnosis (yin/yang, hot/cold, exterior/interior, deficiency/excess); Zang-Fu organ-system theory; Six Stages and Four Levels diagnostic frameworks for febrile and chronic conditions.',
    contemporaryReach: 'TCM is integrated into the official healthcare system in China (where TCM hospitals operate alongside Western-medicine hospitals), Japan (Kampo), Korea (Hanbang), and Vietnam. Approximately 30,000+ licensed acupuncturists in the United States as of 2024 (NCCAOM data). WHO has acknowledged acupuncture\'s efficacy for over 100 conditions in formal guidelines.',
    whatModernResearchSays: 'Acupuncture has strong evidence for chronic low back pain, knee osteoarthritis pain, tension headaches, and chemotherapy-induced nausea (multiple Cochrane reviews; NIH NCCIH systematic syntheses). The mechanism is debated: leading hypotheses include neurochemical (endogenous opioid release at needling sites), connective-tissue (Langevin et al. 2002+ on fascial tissue at acupuncture-point locations), and central-nervous-system (Hui et al. 2005+ fMRI showing brain-region activation patterns specific to acupuncture). The "qi-as-measurable-energy-flow" hypothesis has not been validated by contemporary measurement but is also not the only mechanistic explanation that traditional practitioners offered or contemporary research has tested.',
  },
  {
    id: 'yogic-chakras',
    name: 'Indian / Yogic · Chakras',
    origin: 'India, with roots in late Vedic period (c. 1000-500 BCE), consolidation during the Tantric period (5th-12th c. CE), and systematic exposition in medieval Hatha Yoga texts (12th-17th c. CE).',
    age: '~2,500 years of textual reference; ~1,500 years of explicit chakra-system practice.',
    foundationalTexts: 'Brihadaranyaka Upanishad and Chandogya Upanishad (c. 800-600 BCE, with proto-chakra references). Yoga Sutras of Patanjali (c. 200 BCE - 400 CE) on subtle-body practice. Sat-Chakra-Nirupana (षट्चक्रनिरूपण, "Description of the Six Chakras") by Purnananda Yati (c. 1577 CE) — the canonical seven-chakra exposition. Hatha Yoga Pradipika (c. 15th c. CE).',
    coreClaim: 'The subtle body (sukshma sharira) contains energy centers (chakras, चक्र, "wheels") aligned along the central channel (sushumna nadi). Seven principal chakras span from the base of the spine to the crown of the head. Each chakra has a name, an associated element, a seed mantra (bija), a presiding deity (in some traditions), an associated body region and endocrine cluster, and a set of practices (asana, pranayama, meditation) that work with it.',
    majorBranches: 'Tantric Hindu tradition (Kashmir Shaivism, Sri Vidya); Buddhist Vajrayana tradition (with subtle-body cartography that overlaps but uses different naming and practice systems); Hatha Yoga lineages (Natha, Krishnamacharya); modern syncretic adaptations (Theosophy, New Age, contemporary therapeutic-yoga).',
    contemporaryReach: 'Approximately 36 million yoga practitioners in the United States (Yoga Alliance / Yoga Journal 2023 census), most of whom encounter chakra references in some form. Indian government recognition through AYUSH ministry (Ayurveda, Yoga, Unani, Siddha, Homeopathy). Chakra-system teaching is widespread in yoga teacher-training programs internationally. Practice depth varies enormously from postural-only to deep tantric study.',
    whatModernResearchSays: 'Specific physiological correlates of chakras have not been validated by contemporary research as a single energetic system. However, the broader claim that focused attention on body regions affects autonomic-nervous-system tone is well-supported by polyvagal-theory research (Porges 1995+), interoception research (Craig 2003+), and HRV-coherence research. The chakra system\'s pairing of body-region attention with breath, mantra, and visualization maps loosely onto contemporary "embodied-cognition" and "interoceptive-awareness" research traditions even where the specific energetic claims remain unstudied. The endocrine-cluster correspondence (root-chakra/adrenals, throat-chakra/thyroid, etc.) is not a contemporary finding; it is a 19th- and 20th-century syncretic addition that traditional Sanskrit texts do not make.',
  },
  {
    id: 'acupuncture-modern',
    name: 'Acupuncture · Modern Integrated Practice',
    origin: 'Originally TCM (see above). The "modern integrated" branch began with mid-20th-century formalization of acupuncture education (China\'s 1950s-1970s standardization) and accelerated in the West post-1971 (James Reston\'s NYT article on his post-appendectomy acupuncture in Beijing).',
    age: '~50 years of organized Western-integrated practice; rooted in the 2,300-year TCM tradition.',
    foundationalTexts: 'Chinese-language: People\'s Republic of China official acupuncture textbooks (1956 onward; revised 1995, 2003, 2012). English-language: Felix Mann *Acupuncture: The Ancient Chinese Art of Healing* (1962, controversial early Western synthesis); Giovanni Maciocia *The Foundations of Chinese Medicine* (1989, the foremost English-language clinical reference); Peter Deadman, Mazin Al-Khafaji & Kevin Baker *A Manual of Acupuncture* (1998, the foremost English-language point reference).',
    coreClaim: 'Treatment via fine-needle insertion at specific points (acupoints, 穴位) along the meridians, with the goal of resolving qi-flow obstructions and re-establishing balance. Modern integrated practice retains the TCM theoretical framework while incorporating contemporary anatomical knowledge, Western diagnostic categories where compatible, and (in many practices) electrical stimulation or laser-assisted needling.',
    majorBranches: 'Traditional Chinese Acupuncture (TCA) — orthodox TCM with full Eight Principles diagnosis. Five-Element Acupuncture (J.R. Worsley lineage) — emphasizes constitutional types and emotional-spiritual dimensions. Japanese Meridian Therapy — gentler, more palpation-driven, often using thinner needles. Korean Saam acupuncture — uses elemental balancing with fewer points. Trigger-point dry needling — Western-physical-therapy adaptation that uses similar needles but rejects the meridian framework (controversial: most state acupuncture boards in the US dispute the dry-needling-is-different position).',
    contemporaryReach: 'NCCAOM (US national certification commission) reports ~30,000+ active certified acupuncturists in the United States as of 2024. WHO recognizes acupuncture for over 100 conditions in 2003 official guidelines. Insurance coverage in the US has expanded substantially since 2017 (federal Medicare coverage for chronic low back pain; many private insurers cover acupuncture broadly). The Department of Veterans Affairs employs acupuncturists in 130+ VA medical centers.',
    whatModernResearchSays: 'Strongest evidence for: chronic low back pain (multiple RCTs, Cochrane review), knee osteoarthritis pain (Cochrane review), tension and migraine headaches (multiple RCTs), chemotherapy-induced nausea (NCI evidence summary). Moderate evidence for: post-operative pain, fibromyalgia, anxiety, depression-as-adjunctive. Weaker but emerging evidence for: PCOS, infertility (multiple ongoing RCTs at major academic centers). The "sham acupuncture" controversy is real: well-controlled trials often find both real and sham acupuncture better than no-treatment, with smaller real-vs-sham differences than the field originally claimed. The simplest reading is that needle insertion produces real effects via multiple mechanisms (neurochemical, fascial, central-nervous-system, expectation), with traditional point-selection adding variable but real specificity above non-point insertion in many but not all conditions.',
  },
];

export const TWELVE_MERIDIANS = [
  { number: 1, name: 'Lung (LU, Tai Yin)', element: 'metal', associatedOrgan: 'lung', startsEnds: 'starts on chest LU-1, ends thumb LU-11', timeOfDay: '3am-5am', principalPoints: 11, notes: 'Often the first meridian taught; runs from chest down arm to thumb. Pairs energetically with Large Intestine.' },
  { number: 2, name: 'Large Intestine (LI, Yang Ming)', element: 'metal', associatedOrgan: 'large intestine', startsEnds: 'starts index finger LI-1, ends face LI-20', timeOfDay: '5am-7am', principalPoints: 20, notes: 'Up the arm to the face. LI-4 (between thumb and index finger) is one of acupuncture\'s most-used points.' },
  { number: 3, name: 'Stomach (ST, Yang Ming)', element: 'earth', associatedOrgan: 'stomach', startsEnds: 'starts face ST-1, ends second toe ST-45', timeOfDay: '7am-9am', principalPoints: 45, notes: 'Longest meridian; runs from face down chest, abdomen, leg to second toe. ST-36 (below knee) is another foundational point.' },
  { number: 4, name: 'Spleen (SP, Tai Yin)', element: 'earth', associatedOrgan: 'spleen', startsEnds: 'starts big toe SP-1, ends side of chest SP-21', timeOfDay: '9am-11am', principalPoints: 21, notes: 'Up the leg, across the abdomen. Spleen meridian in TCM does not map directly onto the Western spleen organ.' },
  { number: 5, name: 'Heart (HT, Shao Yin)', element: 'fire', associatedOrgan: 'heart', startsEnds: 'starts axilla HT-1, ends little finger HT-9', timeOfDay: '11am-1pm', principalPoints: 9, notes: 'Short meridian, arm and chest. Heart meridian in TCM also governs the mind and spirit (shen).' },
  { number: 6, name: 'Small Intestine (SI, Tai Yang)', element: 'fire', associatedOrgan: 'small intestine', startsEnds: 'starts little finger SI-1, ends face SI-19', timeOfDay: '1pm-3pm', principalPoints: 19, notes: 'Up the arm, across the shoulder, to the face.' },
  { number: 7, name: 'Bladder (BL, Tai Yang)', element: 'water', associatedOrgan: 'urinary bladder', startsEnds: 'starts inner eye BL-1, ends little toe BL-67', timeOfDay: '3pm-5pm', principalPoints: 67, notes: 'Most points of any meridian; runs from face over head, down back, leg to little toe. The Back Shu points along the spine connect to all internal organs.' },
  { number: 8, name: 'Kidney (KI, Shao Yin)', element: 'water', associatedOrgan: 'kidney', startsEnds: 'starts sole of foot KI-1, ends chest KI-27', timeOfDay: '5pm-7pm', principalPoints: 27, notes: 'Up the leg from sole of foot, across abdomen and chest. Kidney is foundational in TCM (jing — essence).' },
  { number: 9, name: 'Pericardium (PC, Jue Yin)', element: 'fire', associatedOrgan: 'pericardium / heart sac', startsEnds: 'starts chest PC-1, ends middle finger PC-9', timeOfDay: '7pm-9pm', principalPoints: 9, notes: 'Down the arm to middle finger. PC-6 (Nei Guan, inner forearm) is the standard anti-nausea point.' },
  { number: 10, name: 'Triple Heater (TE, Shao Yang)', element: 'fire', associatedOrgan: 'no Western anatomical equivalent (functional system)', startsEnds: 'starts ring finger TE-1, ends face TE-23', timeOfDay: '9pm-11pm', principalPoints: 23, notes: 'Up the arm to the face. The "triple heater" is a functional system in TCM with no direct anatomical correlate, governing fluid metabolism and warming.' },
  { number: 11, name: 'Gallbladder (GB, Shao Yang)', element: 'wood', associatedOrgan: 'gallbladder', startsEnds: 'starts outer eye GB-1, ends fourth toe GB-44', timeOfDay: '11pm-1am', principalPoints: 44, notes: 'Zigzags down the side of the head and body to the foot.' },
  { number: 12, name: 'Liver (LV, Jue Yin)', element: 'wood', associatedOrgan: 'liver', startsEnds: 'starts big toe LV-1, ends chest LV-14', timeOfDay: '1am-3am', principalPoints: 14, notes: 'Up the leg to chest. Liver is the smoothing-and-flowing meridian; LV-3 (top of foot) is a foundational stress point.' },
];

export const SEVEN_CHAKRAS = [
  { number: 1, sanskrit: 'Muladhara', english: 'Root', location: 'base of spine, perineum', element: 'earth', bijaMantra: 'Lam', petalCount: 4, governing: 'survival, grounding, stability, basic needs', commonPractices: 'standing postures (tadasana, mountain pose); slow exhale-emphasized breath; awareness of contact with ground' },
  { number: 2, sanskrit: 'Svadhisthana', english: 'Sacral', location: 'below navel, sacrum', element: 'water', bijaMantra: 'Vam', petalCount: 6, governing: 'creativity, sexuality, emotion, fluidity', commonPractices: 'hip-opening postures (baddha konasana, butterfly); circular movement; water-coded visualizations' },
  { number: 3, sanskrit: 'Manipura', english: 'Solar Plexus', location: 'just above navel, upper abdomen', element: 'fire', bijaMantra: 'Ram', petalCount: 10, governing: 'will, personal power, transformation, digestion', commonPractices: 'core-engaging postures (navasana, boat pose); kapalabhati pranayama; agni (fire) visualizations' },
  { number: 4, sanskrit: 'Anahata', english: 'Heart', location: 'center of chest', element: 'air', bijaMantra: 'Yam', petalCount: 12, governing: 'love, compassion, connection, balance between lower and upper chakras', commonPractices: 'chest-opening postures (camel, fish); equal-ratio breath; loving-kindness meditation' },
  { number: 5, sanskrit: 'Vishuddha', english: 'Throat', location: 'throat, base of neck', element: 'ether (akasha)', bijaMantra: 'Ham', petalCount: 16, governing: 'communication, expression, truth-speaking, listening', commonPractices: 'neck-stretching postures; chanting; bhramari (humming) pranayama; silence practices' },
  { number: 6, sanskrit: 'Ajna', english: 'Third Eye / Brow', location: 'between eyebrows, mid-brain', element: 'light (some traditions) / mind', bijaMantra: 'Om / Aum', petalCount: 2, governing: 'intuition, perception, insight, witness consciousness', commonPractices: 'gentle inversions; trataka (candle gazing); third-eye-focused meditation; alternate-nostril breath' },
  { number: 7, sanskrit: 'Sahasrara', english: 'Crown', location: 'top of head', element: 'beyond elements (some traditions: pure consciousness)', bijaMantra: 'Om / silence', petalCount: '1,000', governing: 'transcendence, connection to the divine, the witness beyond witness', commonPractices: 'inversions (sirsasana, headstand); sustained silence; samadhi practices in deep traditions' },
];

export const ACUPUNCTURE_PRINCIPAL_POINTS = [
  { code: 'LI-4', name: 'Hegu (Joining Valley)', location: 'between thumb and index finger', traditionalUse: 'foundational pain-relief point; headaches, facial pain, immune support', cautions: 'classically contraindicated in pregnancy (may stimulate uterine contraction)' },
  { code: 'ST-36', name: 'Zusanli (Leg Three Miles)', location: 'four finger-widths below knee, lateral to shinbone', traditionalUse: 'tonifying point; digestion, energy, immunity. Said to give a person "the energy to walk three more miles."', cautions: 'none significant for moderate stimulation' },
  { code: 'SP-6', name: 'Sanyinjiao (Three Yin Intersection)', location: 'four finger-widths above inner ankle bone', traditionalUse: 'gynecological conditions, sleep, anxiety. Intersection of three yin meridians.', cautions: 'classically contraindicated in pregnancy' },
  { code: 'PC-6', name: 'Neiguan (Inner Pass)', location: 'three finger-widths above inner wrist crease', traditionalUse: 'nausea (validated for chemotherapy- and pregnancy-related nausea), heart palpitations, anxiety', cautions: 'none significant' },
  { code: 'GV-20', name: 'Baihui (Hundred Meetings)', location: 'crown of head', traditionalUse: 'mental clarity, headaches, prolapse conditions; the meeting of yang energies', cautions: 'gentle stimulation only on infants' },
  { code: 'LV-3', name: 'Taichong (Great Surge)', location: 'top of foot, in the depression between first and second metatarsal bones', traditionalUse: 'stress relief, headaches, irritability; partner with LI-4 as the "Four Gates" for general stress relief', cautions: 'none significant' },
  { code: 'KI-1', name: 'Yongquan (Bubbling Well)', location: 'sole of foot, depression at the front', traditionalUse: 'grounding, calming the spirit, kidney tonification; classically the only acupuncture point on the sole of the foot', cautions: 'sensitive area; gentle pressure or self-acupressure' },
  { code: 'BL-23', name: 'Shenshu (Kidney Shu)', location: 'lower back, two finger-widths lateral to the spine at the level of L2', traditionalUse: 'kidney tonification, lower back pain, fertility support, ear conditions', cautions: 'none significant' },
  { code: 'GB-20', name: 'Fengchi (Wind Pool)', location: 'base of skull, in the hollow between the trapezius and sternocleidomastoid muscles', traditionalUse: 'headaches (especially tension and occipital), neck stiffness, vision conditions, common cold', cautions: 'angle needling carefully (proximity to brain stem); standard practice contraindicates deep insertion' },
  { code: 'CV-17', name: 'Shanzhong (Chest Center)', location: 'midline of chest, level with fourth intercostal space', traditionalUse: 'chest oppression, anxiety, breast conditions, heart issues, grief', cautions: 'none significant' },
];

export const CORRIDOR_PRACTICE = {
  description: 'How the corridor integrates Living Body practices alongside its existing Marine Layer, Bath House, and Time-fluency offerings. The integration is additive, voluntary, and structured to make first-time access easier than the open commercial market makes it.',
  cohortOfferings: [
    { offering: 'Foundations of Acupressure (8-week cohort)', format: 'Weekly 90-minute meetings, capped at 12 participants, taught by a vetted licensed acupuncturist (LAc). Cost: federation cohort rate $200 per 8-week cycle (vs ~$80-150 per individual office session).', whatItIsNot: 'NOT a clinical-acupuncture replacement. Self-acupressure on yourself, peer-acupressure with a partner, and basic point-location knowledge.' },
    { offering: 'Chakra Foundations (6-week study cycle)', format: 'Weekly 75-minute meetings, capped at 12, taught by a vetted yoga teacher with 500+ hours of training and explicit chakra-system depth. Cost: federation cohort rate $150 per 6-week cycle.', whatItIsNot: 'NOT a yoga-asana class. Reading from primary sources (Sat-Chakra-Nirupana excerpts in translation), discussion, light practice (breath, visualization), and a personal reflection journal across the six weeks.' },
    { offering: 'TCM Diagnostic Awareness (4-week intro)', format: 'Weekly 60-minute meetings, capped at 12, taught by a vetted TCM practitioner. Cost: federation cohort rate $100 per 4-week cycle.', whatItIsNot: 'NOT a clinical-diagnosis training. Awareness of the Eight Principles, basic tongue and pulse self-observation (without diagnostic claim), seasonal-attunement practices.' },
    { offering: 'Living Body Open Hours (monthly)', format: 'Once-monthly Saturday morning at the Bath House (when funded) or at a federation cohort space. 3 hours, drop-in, no fee for cohort members, $20 for visitors.', whatItIsNot: 'NOT a treatment session. Conversation, demonstration, peer learning across all three traditions.' },
  ],
  practitionerNetwork: {
    description: 'The federation maintains a vetted network of practitioners across the three traditions for cohort referrals and lower-cost first-session access.',
    vettingCriteria: [
      'Acupuncturists: California-licensed (LAc) with NCCAOM certification; minimum 5 years clinical practice; explicit comfort with skeptical first-time patients; commitment to honest scope (refers to Western medicine when appropriate).',
      'Yoga teachers: 500+ hour Yoga Alliance certification or equivalent traditional lineage credential; demonstrated chakra-system depth (not all 200-hour teachers have this); commitment to honest framing (no health-claim overreach).',
      'TCM practitioners: California-licensed acupuncturist (LAc) credential plus dedicated TCM herbal-medicine training (DACM, DAOM, or equivalent); commitment to communicating openly with patients\' Western-medicine physicians.',
    ],
    referralProtocol: 'Cohort members can request a referral to a network practitioner via /api/living-body/referral. The federation does not take referral fees and is not a medical authority. Practitioners are vetted but the federation does not warrant clinical outcomes.',
    firstSessionDiscount: 'Network practitioners offer corridor cohort members a 30% first-session discount in exchange for federation listing and openness to cohort-program contribution. Continued sessions are at the practitioner\'s standard rate.',
  },
  futureGiantWork: 'The Living Body cohort offerings could anchor a future Tier D civic project: a small dedicated Living Body Pavilion (estimated $2-4M, 3,500 sq ft) with treatment rooms for the practitioner network, cohort-class meeting space, and a small reference library. This is speculative and not currently in the Tier D queue (Giant Works UES-Federation-02 + Giant Works Art UES-Federation-04). Could enter the queue at the autumnal-equinox 2027 council meeting if cohort demand demonstrates need.',
};

export const SCIENTIFIC_HONESTY_FRAMEWORK = {
  whatTheEvidenceSupports: [
    'Acupuncture for chronic low back pain (multiple Cochrane reviews; included in major US clinical practice guidelines including ACP, JAMA Internal Medicine).',
    'Acupuncture for knee osteoarthritis pain (Cochrane review; strongest single-condition evidence base).',
    'Acupuncture for tension and migraine headaches (multiple RCTs; included in International Headache Society guidance).',
    'Acupuncture (specifically PC-6 stimulation) for chemotherapy-induced and pregnancy-related nausea (NCI evidence summary; multiple RCTs).',
    'Yoga and breath practice for stress reduction, anxiety, and mild-to-moderate depression (multiple meta-analyses; included in NICE clinical guidance).',
    'Vagal-tone modulation through controlled breathing practices (Porges polyvagal theory; HRV-coherence research).',
    'Interoceptive-awareness training (e.g., body scans, mindful movement) for chronic pain and trauma recovery (van der Kolk; multiple RCTs).',
  ],
  whatRemainsContested: [
    'The specificity of individual acupuncture points vs. general needling. Sham-acupuncture controlled trials often show smaller-than-claimed real-vs-sham differences, suggesting that needle insertion in general (regardless of TCM-specified location) produces some effects.',
    'The mechanism by which acupuncture works. Multiple plausible mechanisms (neurochemical, fascial-tissue, central-nervous-system, expectation) compete; the field has not converged on a single answer.',
    'The endocrine-cluster correspondence of chakras (root-chakra/adrenals, etc.). This is a 19th- and 20th-century syncretic addition, not a traditional Sanskrit-text claim, and lacks contemporary research validation.',
    'Long-term outcomes of TCM herbal medicine for chronic conditions. Individual herbs and formulas have varying evidence; some are well-studied (artemisinin from Artemisia annua → antimalarial Nobel Prize 2015) and others are not.',
  ],
  whatIsGenuinelyUnknown: [
    'Whether qi (vital energy) is a coherent measurable phenomenon. Centuries of practitioner experience suggests something is being tracked; contemporary measurement has not isolated it. This is not a refutation of practitioner experience; it is a description of a research gap.',
    'Whether chakra activation produces specific physiological correlates beyond general autonomic-nervous-system modulation. Possible, possible-not, contemporary research has not adequately tested.',
    'Whether long-term consistent practice in any of these traditions produces life-extension or chronic-disease-prevention effects beyond what general healthy-lifestyle interventions produce. The relevant comparison studies have not been done at sufficient scale.',
  ],
  whatTheFederationDoesNotClaim: [
    'These traditions cure cancer or other serious diseases. They do not.',
    'These traditions are alternatives to Western medicine for conditions Western medicine treats well (acute trauma, infectious disease, surgical conditions). They are not.',
    'Any specific practitioner has special powers or insights. The federation\'s practitioner network is vetted for competence and ethical practice, not for paranormal capacity.',
    'Reading this paper or attending one cohort session has any therapeutic effect. Practice across time is what may produce benefit; documentation across time is what this paper offers.',
  ],
};

export const REFERENCES = [
  { id: 'huangdi-neijing', cite: 'Anonymous (compiled c. 2nd c. BCE). *Huangdi Neijing · Yellow Emperor\'s Inner Canon*. The Lingshu and Suwen sections; modern critical translation: Unschuld, P. U. (2003-2016). University of California Press.' },
  { id: 'maciocia', cite: 'Maciocia, G. (1989, 3rd ed. 2015). *The Foundations of Chinese Medicine: A Comprehensive Text*. Elsevier. The foremost English-language clinical reference.' },
  { id: 'deadman', cite: 'Deadman, P., Al-Khafaji, M., & Baker, K. (1998, rev. 2007). *A Manual of Acupuncture*. Journal of Chinese Medicine Publications. The foremost English-language point reference.' },
  { id: 'sat-chakra', cite: 'Purnananda Yati. (c. 1577 CE). *Sat-Chakra-Nirupana*. Critical translation: Avalon, A. (Sir John Woodroffe). (1918). *The Serpent Power*. Ganesh & Co.' },
  { id: 'patanjali', cite: 'Patanjali. (c. 200 BCE - 400 CE). *Yoga Sutras*. Modern translation: Hartranft, C. (2003). *The Yoga-Sūtra of Patañjali*. Shambhala.' },
  { id: 'hatha-pradipika', cite: 'Svatmarama. (c. 15th c. CE). *Hatha Yoga Pradipika*. Translation: Akers, B. D. (2002).' },
  { id: 'feuerstein', cite: 'Feuerstein, G. (2008, 3rd ed.). *The Yoga Tradition: Its History, Literature, Philosophy and Practice*. Hohm Press. Comprehensive scholarly survey including chakra-system history.' },
  { id: 'mallinson', cite: 'Mallinson, J., & Singleton, M. (2017). *Roots of Yoga*. Penguin Classics. Historical-critical anthology with chakra-system contextualization.' },
  { id: 'langevin', cite: 'Langevin, H. M., et al. (2002). *Mechanical signaling through connective tissue: a mechanism for the therapeutic effect of acupuncture*. The FASEB Journal, 16(8), 872-874. The foundational fascial-tissue acupuncture-mechanism paper.' },
  { id: 'hui', cite: 'Hui, K. K. S., et al. (2005). *Acupuncture, the limbic system, and the anticorrelated networks of the brain*. Autonomic Neuroscience, 130(1-2), 55-69. Foundational fMRI work on acupuncture brain activation.' },
  { id: 'porges', cite: 'Porges, S. W. (1995, foundational; 2011 book). *The Polyvagal Theory: Neurophysiological Foundations of Emotions, Attachment, Communication, and Self-regulation*. W.W. Norton.' },
  { id: 'craig', cite: 'Craig, A. D. (2003). *Interoception: the sense of the physiological condition of the body*. Current Opinion in Neurobiology, 13(4), 500-505.' },
  { id: 'van-der-kolk', cite: 'van der Kolk, B. (2014). *The Body Keeps the Score: Brain, Mind, and Body in the Healing of Trauma*. Viking. Synthesis of body-based trauma research.' },
  { id: 'cochrane-back-pain', cite: 'Furlan, A. D., et al. (Cochrane reviews ongoing 2005-Continuing). *Acupuncture and dry-needling for low back pain*. Cochrane Database of Systematic Reviews.' },
  { id: 'cochrane-knee', cite: 'Manheimer, E., et al. (2010). *Acupuncture for peripheral joint osteoarthritis*. Cochrane Database of Systematic Reviews, 2010(1).' },
  { id: 'nccih', cite: 'National Center for Complementary and Integrative Health. (Continuing). *Acupuncture: In Depth*. NIH NCCIH systematic review summaries. nccih.nih.gov.' },
  { id: 'who-acupuncture', cite: 'World Health Organization. (2003). *Acupuncture: Review and Analysis of Reports on Controlled Clinical Trials*. WHO Geneva.' },
  { id: 'nccaom', cite: 'National Certification Commission for Acupuncture and Oriental Medicine. (Continuing). *US Practitioner Certification Standards*. nccaom.org.' },
  { id: 'tu-youyou', cite: 'Tu Youyou. (2015 Nobel Prize in Physiology or Medicine). *Discovery of Artemisinin from Artemisia annua*. The TCM-traditional-knowledge-to-modern-pharmaceutical exemplar.' },
  { id: 'pointcast-marine-layer', cite: 'University of El Segundo. (2026). *Marine Layer*. UES-WP-2026-01. https://pointcast.xyz/marine-layer.' },
  { id: 'pointcast-bath', cite: 'University of El Segundo. (2026). *The Bath House*. UES-WP-2026-14. https://pointcast.xyz/bath-house.' },
  { id: 'pointcast-time', cite: 'University of El Segundo. (2026). *Time*. UES-WP-2026-16. https://pointcast.xyz/time.' },
];

export const PAPER_NOTES = {
  uesNote: 'This paper is the federation\'s positive-belief working position on the Living Body traditions. It is documentary, not advocacy. It will be revised by the cohort, by practitioner-network members, and by external researchers who engage with the framework. The framework should be considered a starting point — comprehensive but not authoritative.',
  invitation: 'If you are a licensed acupuncturist (LAc) interested in joining the federation\'s vetted practitioner network, a 500+ hour yoga teacher with chakra-system depth, a TCM practitioner, an integrative-medicine physician open to corridor partnership, or a corridor cohort member who wants to attend a first-time Living Body cohort cycle (autumnal equinox 2027 candidate), email mh@pointcast.xyz with subject line "Living Body · {role}". Cohorts cap at 12 per offering; practitioner network reviews quarterly.',
  closingNote: 'The Living Body completes the corridor\'s body-practice quartet: breath (Marine Layer), water and heat (Bath House), time (Time), energy (Living Body). Together they constitute the federation\'s core invitation: that the body is more than its anatomy, that practices across cultures have honored that more, and that the corridor is one place where serious documentation and respectful first-time access can both happen.',
};
