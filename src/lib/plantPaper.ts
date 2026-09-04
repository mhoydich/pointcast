/**
 * Plant — UES Working Paper 2026-21.
 *
 * The seventh paper in the Department of Local Inquiry body-practice
 * arc, after /marine-layer, /bath-house, /time, /p2p-ai, /living-body,
 * /civic-federation, /practice. Documents the corridor's working
 * relationship with adaptogenic and nootropic plants in the
 * Andrew-Weil tradition of integrative medicine — slow, respectful,
 * relationship-coded rather than stack-coded.
 *
 * The framing rejects two contemporary defaults: the dismissive-
 * pharmaceutical default ("plants are just placebos") and the
 * extractive-supplement default ("buy the powder, take the dose,
 * optimize the metric"). Both miss what the traditions know: a plant
 * is something you live with, learn from, prepare yourself when
 * possible, source carefully when not. The relationship is the
 * practice.
 */

export const PAPER_META = {
  title: 'Plant',
  subtitle: 'Adaptogens, nootropics, and the slow relationship with botanical medicine in the Andrew-Weil tradition · UES Working Paper 2026-21',
  thesis: 'A working framework for the corridor cohort\'s relationship with adaptogenic and nootropic plants. The framing rejects the two contemporary defaults — pharmaceutical dismissal ("just a placebo") and stack-culture extraction ("buy the powder, optimize the metric") — and adopts the Andrew-Weil integrative-medicine lineage: a plant is something you live with, prepare carefully, learn slowly, and source from someone you can name. This paper documents 16 plants across three tiers (6 starter, 6 intermediate, 4 advanced), explains the difference between adaptogen and nootropic, names the major traditions (Ayurveda, TCM, Andean, Western herbalism), provides sourcing principles, lays out a 90-day "one plant" beginner protocol, identifies the major drug-interaction and contraindication concerns honestly, and proposes a Plant Year cohort that studies one plant per quarter for four years. The corridor\'s contribution is not stacking; it is relationship.',
  paperNumber: 'UES-WP-2026-21',
  date: '2026-05-09',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Inquiry', email: 'mh@pointcast.xyz' },
  ],
  keywords: ['adaptogens', 'nootropics', 'herbalism', 'Andrew Weil', 'integrative medicine', 'ashwagandha', 'tulsi', 'reishi', 'lion\'s mane', 'rhodiola', 'University of El Segundo', 'plant medicine', 'materia medica'],
  parentSurface: 'University of El Segundo · Department of Local Inquiry',
  relatedSurfaces: ['UES-WP-2026-18 The Living Body', 'UES-WP-2026-20 Practice', 'UES-WP-2026-16 Time'],
};

export const THE_FRAMING = {
  whyNotStackCulture: 'Modern "nootropic stack" culture treats plants as inputs to optimize a measurable output: more focus, more energy, more sleep, more mood. The framing is extractive (buy the active compound, in maximum bioavailability form, at the highest tolerated dose) and consumerist (12 different powders in a daily blender). It produces results for some people in the short term and habituation, expense, and dependency for many in the long term. The corridor\'s working position is that this is the wrong frame.',
  whyAndrewWeil: 'Dr. Andrew Weil — Harvard botany undergrad, Harvard Medical School, founder of the Arizona Center for Integrative Medicine (1994) — has spent five decades arguing for a different relationship: integrative medicine that treats plants as partners rather than inputs, that respects traditional preparation methods, that values slow knowledge over fast biohacking. His framing is the corridor\'s starting point. We are not Weil acolytes; we use his lineage as the most credible English-language synthesis available.',
  whatRelationshipMeans: 'A relationship with a plant means: knowing its botanical name (genus + species, not just marketing name), knowing what part is used (root, leaf, bark, berry, mushroom fruiting body), knowing how it is traditionally prepared (decoction, tincture, powder, fresh juice, fermented), knowing where this batch came from (named farm or wildcraft source, ideally), knowing what conditions it traditionally addresses, knowing the contraindications and drug interactions, taking it for a long-enough window to actually learn what it does in your particular body. None of that requires becoming an herbalist. All of it is available to a serious cohort member willing to slow down.',
  oneOverMany: 'A 90-day relationship with one plant produces more reliable knowledge than a 30-day rotation across six. The corridor\'s default is one-plant-at-a-time learning. Stack culture treats this as inefficient; the corridor treats it as the only way to actually learn what a plant does for you specifically.',
  honestUncertainty: 'Most plants documented here have some clinical research supporting some traditional uses; most also have less research than pharmaceutical drug trials; some have well-known drug interactions that matter; a few have specific contraindications (pregnancy, blood-thinner interactions, hypertension) that the federation flags loudly. We are honest about all of this. We do not claim plants cure conditions Western medicine treats well. We do claim that some plants, in relationship, in traditional preparation, with attention, contribute meaningfully to long-term thriving.',
};

export const ADAPTOGEN_VS_NOOTROPIC = {
  adaptogen: 'A class of plants (term coined by Soviet pharmacologist N. V. Lazarev in 1947, refined by Brekhman + Dardymov 1968) that produce non-specific resistance to physical, chemical, and biological stressors. Adaptogens "regulate from both directions" — they up-regulate when you are depleted and down-regulate when you are over-stimulated. Three formal criteria: (1) non-specific (work across many stressors), (2) normalizing (regulate toward homeostasis), (3) non-toxic at therapeutic doses. Examples: ashwagandha, rhodiola, holy basil (tulsi), reishi mushroom, schisandra berry, eleuthero, panax ginseng.',
  nootropic: 'Coined by Romanian pharmacologist Corneliu Giurgea in 1972 from Greek noos (mind) + tropein (toward). Substances that improve cognitive function — memory, learning, focus, attention — without significant toxicity. Original definition included pharmaceuticals (piracetam being the prototype); modern usage includes natural plants traditionally associated with cognitive benefit. Examples: bacopa, lion\'s mane mushroom, gotu kola, ginkgo biloba, rhodiola (overlaps with adaptogens), panax ginseng (overlaps), cordyceps (overlaps).',
  overlapAndDistinction: 'Some plants are both. Rhodiola is adaptogenic (stress regulation) AND nootropic (focus). Panax ginseng same. Lion\'s mane is primarily nootropic (NGF promotion) but has mild adaptogenic effect. The categories are practical, not absolute. The corridor uses both terms because both are useful framing — adaptogen for "what plant for chronic stress?" and nootropic for "what plant for cognitive support?"',
  whatNeitherTermCovers: 'Many of the most useful plants the corridor cohort will encounter — turmeric, ginger, garlic, green tea, cacao — are neither adaptogens nor nootropics in the strict sense. They are food-medicines: traditionally consumed at meaningful frequencies, with documented health benefits at culinary doses. The corridor framework values these too; the paper covers them as the third tier alongside the technical adaptogen and nootropic categories.',
};

export type Plant = {
  id: string;
  commonName: string;
  botanicalName: string;
  partUsed: string;
  category: 'adaptogen' | 'nootropic' | 'food-medicine' | 'multiple';
  tradition: string;
  whatItDoes: string;
  evidenceTier: 'strong' | 'moderate' | 'emerging' | 'traditional-only';
  traditionalPreparation: string;
  modernDosing: string;
  sourcingNotes: string;
  cautions: string;
  beginnerRanking: 1 | 2 | 3;
};

export const STARTER_TIER: Plant[] = [
  {
    id: 'tulsi',
    commonName: 'Holy Basil (Tulsi)',
    botanicalName: 'Ocimum sanctum (also Ocimum tenuiflorum)',
    partUsed: 'leaf',
    category: 'adaptogen',
    tradition: 'Ayurveda — sacred plant of Hindu tradition; cultivated near temples and homes for 3,000+ years. The "queen of herbs" in Ayurvedic materia medica.',
    whatItDoes: 'Adaptogenic stress regulation, mild mood lift, immune support, blood sugar modulation. The most beginner-friendly adaptogen — unusually safe profile, clear felt effect within 2-4 weeks of daily use, easy to grow.',
    evidenceTier: 'moderate',
    traditionalPreparation: 'Fresh leaves chewed daily, or steeped as tea (3-5 fresh leaves or 1 tsp dried in hot water for 5-10 min). Traditional dose is several cups per day during cold/flu seasons. The plant is sacred — picking is preceded by gratitude in traditional households.',
    modernDosing: 'Dried leaf tea 1-2 cups daily; OR standardized extract 300-600 mg/day in capsule form. 90-day initial relationship recommended. Effect is cumulative and gentle.',
    sourcingNotes: 'Grow your own (easy from seed, thrives in CA climate; the corridor grows tulsi well). Otherwise: organic, single-source farm. Avoid generic brand "tulsi tea" with fillers; look for whole-leaf or single-ingredient preparations. Banyan Botanicals + Sun Potion + Mountain Rose Herbs are reliable suppliers.',
    cautions: 'May lower blood sugar (caution if diabetic on medication); may slow blood clotting (avoid 2 weeks before surgery); may reduce fertility at high doses (couples trying to conceive should pause). No serious adverse events documented at culinary or modest extract doses.',
    beginnerRanking: 1,
  },
  {
    id: 'ashwagandha',
    commonName: 'Ashwagandha',
    botanicalName: 'Withania somnifera',
    partUsed: 'root',
    category: 'adaptogen',
    tradition: 'Ayurveda — name means "smell of horse" referring to traditional belief that the root imparts the strength of a horse. Used 3,000+ years for stress, sleep, vitality. Classified as a rasayana (rejuvenative).',
    whatItDoes: 'Stress regulation (multiple RCTs showing cortisol reduction), sleep quality improvement, mild thyroid up-regulation, modest strength and recovery support in athletes (small RCTs), anxiety reduction. Among the most-studied of the traditional adaptogens.',
    evidenceTier: 'strong',
    traditionalPreparation: 'Powdered root mixed with warm milk (or plant-milk equivalent) and a sweetener at bedtime — the classic Ayurvedic preparation. Taste is bitter; the milk softens it. 1/4 to 1/2 teaspoon nightly is the traditional dose.',
    modernDosing: 'Capsule form: 300-600 mg standardized extract daily; OR 1/4-1/2 tsp powder in warm milk at bedtime. 60-90 day initial relationship. Sleep effect typically felt within 2-3 weeks; full stress effect 6-8 weeks.',
    sourcingNotes: 'KSM-66 and Sensoril are two well-studied standardized extracts; either is reliable for capsule form. For powder: Banyan Botanicals or comparable Ayurvedic supplier. Wildcrafted vs cultivated is a meaningful distinction; cultivated is more sustainable and equally effective.',
    cautions: 'Avoid in pregnancy (traditional contraindication). May increase thyroid hormone levels — caution if hyperthyroid or on thyroid medication. Mild GI upset possible at higher doses. Mild interaction with sedative medications (additive sedation possible).',
    beginnerRanking: 1,
  },
  {
    id: 'reishi',
    commonName: 'Reishi (Lingzhi)',
    botanicalName: 'Ganoderma lucidum',
    partUsed: 'fruiting body (mushroom)',
    category: 'adaptogen',
    tradition: 'TCM — the "mushroom of immortality" in Chinese tradition; used 2,000+ years. Daoist materia medica; portrayed in Chinese painting as a symbol of longevity.',
    whatItDoes: 'Immune system modulation (well-documented beta-glucan content), sleep support, mild calming effect. Traditional use emphasizes long-term consumption rather than acute dosing. One of the few adaptogens with significant cancer-supportive-care research (immunomodulation in chemotherapy contexts).',
    evidenceTier: 'moderate',
    traditionalPreparation: 'Decoction — slow simmer of dried mushroom slices for 1-2 hours, sometimes with other herbs. Bitter taste. Traditional consumption is daily as a tonic, often combined with goji berries or jujube to soften the taste.',
    modernDosing: 'Capsule form: 1-3 g dried mushroom equivalent daily (read labels carefully — many products are mycelium grown on grain rather than fruiting body, which is significantly weaker). 90-day initial relationship for sleep + immunity.',
    sourcingNotes: 'Critical to source carefully: insist on fruiting body, not mycelium-on-grain. Real Mushrooms, Nammex, Host Defense (fruiting body line) are trustworthy. Many cheap reishi products are mostly grain.',
    cautions: 'May potentiate blood thinners (warfarin, aspirin) — meaningful interaction, consult physician if on blood thinners. May lower blood pressure modestly. Mild GI upset possible at higher doses. Avoid 2 weeks before surgery.',
    beginnerRanking: 2,
  },
  {
    id: 'lions-mane',
    commonName: 'Lion\'s Mane',
    botanicalName: 'Hericium erinaceus',
    partUsed: 'fruiting body (mushroom)',
    category: 'nootropic',
    tradition: 'TCM and Japanese — yamabushitake ("mountain monk mushroom") in Japan, used by mountain ascetics. Traditional use for digestive and nerve support; modern interest concentrated on cognitive applications.',
    whatItDoes: 'Promotes nerve growth factor (NGF) production — the only natural substance with well-documented NGF-promoting capacity at typical doses. Cognitive support; emerging research on mild cognitive impairment and possibly early-stage neurodegenerative conditions. Subjective reports of mental clarity within 2-4 weeks.',
    evidenceTier: 'emerging',
    traditionalPreparation: 'Cooked as food — tastes mildly like crab or lobster. Sautéed in butter is the traditional gourmet preparation. As medicine, decoction or tincture; less commonly taken as raw mushroom in traditional contexts.',
    modernDosing: 'Capsule: 500-1000 mg dried mushroom equivalent twice daily. Same fruiting-body-vs-mycelium caution as reishi — insist on fruiting body. 90-day initial relationship; cognitive effects build slowly.',
    sourcingNotes: 'Same suppliers as reishi (Real Mushrooms, Nammex, Host Defense fruiting body line). For fresh mushroom (when available at farmers markets): cook it; the cooking releases the bioactives.',
    cautions: 'Generally well-tolerated. Possible mild GI upset. Some allergic reactions documented (rare). Fewer drug interactions than reishi.',
    beginnerRanking: 1,
  },
  {
    id: 'turmeric',
    commonName: 'Turmeric',
    botanicalName: 'Curcuma longa',
    partUsed: 'rhizome',
    category: 'food-medicine',
    tradition: 'Ayurveda + South Asian + Southeast Asian cooking — used 4,000+ years as both medicine and culinary spice. The most-studied food-medicine in the contemporary research literature.',
    whatItDoes: 'Anti-inflammatory (curcumin is the principal active compound, well-documented in RCTs for osteoarthritis pain, ulcerative colitis maintenance, mild depression as adjunctive). Cooking-dose anti-inflammatory effect modest but cumulative across years.',
    evidenceTier: 'strong',
    traditionalPreparation: 'Cooked into curries, dals, golden milk (turmeric + warm milk + black pepper + ghee). The black pepper (piperine) substantially increases curcumin bioavailability — traditional preparations have known this for centuries before Western research confirmed it. Always combine with fat (ghee, coconut oil) for absorption.',
    modernDosing: 'Culinary use daily (1-3 tsp powder in cooking) is the foundation. For inflammatory conditions, standardized curcumin extract 500-1000 mg daily with piperine and fat. Whole-spice preparation always preferred over isolated curcumin extract for general wellness use.',
    sourcingNotes: 'Single-origin organic turmeric from India, Indonesia, or Hawaii is widely available. Lead contamination has been documented in cheap turmeric — buy from a reputable source (Diaspora Co., Burlap & Barrel, or comparable). Fresh turmeric rhizome is increasingly available at California grocery stores; superior to powder for cooking.',
    cautions: 'High-dose curcumin extract may potentiate blood thinners (modest effect, but real). May lower blood sugar. Possible GI upset at high doses. Pregnancy: culinary doses fine; high-dose extract avoided traditionally.',
    beginnerRanking: 1,
  },
  {
    id: 'ginger',
    commonName: 'Ginger',
    botanicalName: 'Zingiber officinale',
    partUsed: 'rhizome',
    category: 'food-medicine',
    tradition: 'TCM + Ayurveda + globally — used 5,000+ years. Among the most universally adopted plant medicines across cultures.',
    whatItDoes: 'Anti-nausea (well-documented for motion sickness, pregnancy nausea, chemotherapy-induced nausea), anti-inflammatory (modest), warming and circulation-promoting in TCM frame, digestive support. The most-studied anti-nausea natural agent.',
    evidenceTier: 'strong',
    traditionalPreparation: 'Fresh ginger sliced and steeped in hot water (with honey, lemon optional) — the universal "feeling-under-the-weather" preparation. Cooked into food. Crystallized ginger as portable acute-nausea treatment. Powdered in baking and curries.',
    modernDosing: 'Fresh: 1-3 g daily as food/tea is well within traditional norms. For acute nausea: 1-1.5 g powdered ginger or equivalent fresh, divided. Long-term daily ginger consumption is the most common path.',
    sourcingNotes: 'Fresh ginger root from any well-stocked grocery; California-grown or Hawaiian when available. Organic preferred but not critical. Powder loses potency rapidly — buy small quantities or grind fresh.',
    cautions: 'May potentiate blood thinners modestly. Possible heartburn at high doses for some people. Pregnancy-safe at culinary doses (and useful for morning sickness). Generally one of the safest plants on this list.',
    beginnerRanking: 1,
  },
];

export const INTERMEDIATE_TIER: Plant[] = [
  {
    id: 'rhodiola',
    commonName: 'Rhodiola (Golden Root, Arctic Root)',
    botanicalName: 'Rhodiola rosea',
    partUsed: 'root',
    category: 'multiple',
    tradition: 'Northern European + Russian + Scandinavian + Tibetan herbalism. Used 1,000+ years across Arctic and high-altitude cultures. Soviet-era research established the modern adaptogen framework using rhodiola as a primary subject.',
    whatItDoes: 'Stress regulation + cognitive support + fatigue reduction. Both adaptogenic AND nootropic. Particularly studied for "burnout"-pattern fatigue (RCTs in physicians, students under high cognitive load, military personnel). Rapid onset compared to most adaptogens — effect often felt within days, not weeks.',
    evidenceTier: 'moderate',
    traditionalPreparation: 'Decoction or tincture from dried root. Traditional Russian dose was a single morning preparation; not split through the day.',
    modernDosing: 'Standardized extract 200-600 mg daily, taken in morning (later doses can disturb sleep due to mild stimulant effect). Look for SHR-5 standardized extract (the most-studied formulation). Cycling 6 weeks on / 2 weeks off is a common protocol.',
    sourcingNotes: 'Rhodiola wild-population pressure has been significant — buy cultivated, not wild-harvested, for sustainability. Gaia Herbs and Nature\'s Way SHR-5 are reliable.',
    cautions: 'Mild stimulant — may cause jitteriness or sleep disturbance at high doses or late-day timing. Possible interactions with antidepressant medications (especially MAOIs, with theoretical interaction with SSRIs). Avoid in bipolar disorder (may trigger manic episodes in susceptible individuals).',
    beginnerRanking: 2,
  },
  {
    id: 'cordyceps',
    commonName: 'Cordyceps',
    botanicalName: 'Cordyceps sinensis (now Ophiocordyceps sinensis) and Cordyceps militaris',
    partUsed: 'fruiting body or fermented mycelium',
    category: 'adaptogen',
    tradition: 'TCM + Tibetan medicine — wild Cordyceps sinensis is one of the most expensive fungi in the world (~$20,000+/lb at peak), traditionally prescribed for fatigue and respiratory conditions. Modern cultivated Cordyceps militaris is the practical substitute.',
    whatItDoes: 'Energy + endurance support, mild adaptogen, respiratory support, possible exercise-performance benefit (modest in RCTs). Traditional use emphasized respiratory + adrenal restoration; modern interest concentrated on exercise performance.',
    evidenceTier: 'moderate',
    traditionalPreparation: 'Decoction with chicken or duck soup is the classical Chinese preparation. Tibetan tradition used it as a tonic for high-altitude work and post-illness recovery.',
    modernDosing: 'Capsule: 1-3 g daily. Cordyceps militaris cultivated on grain substrate is the practical contemporary form (wild-Tibetan is unsustainable and frequently fraudulent in supply chain). 60-90 day initial relationship.',
    sourcingNotes: 'Real Mushrooms is the most reliable English-language supplier. Avoid claims of "wild Tibetan Cordyceps sinensis" — almost all of it is fraudulent at retail price points. Cultivated militaris is honest and effective.',
    cautions: 'Generally well-tolerated. May potentiate blood thinners modestly. Possible mild GI upset. Avoid in autoimmune conditions (immunostimulant; theoretical risk).',
    beginnerRanking: 2,
  },
  {
    id: 'bacopa',
    commonName: 'Bacopa (Brahmi)',
    botanicalName: 'Bacopa monnieri',
    partUsed: 'leaf and stem (whole plant)',
    category: 'nootropic',
    tradition: 'Ayurveda — name "brahmi" derives from "brahman" referring to consciousness; used 3,000+ years for memory and cognitive support. Traditional use in students preparing for exams; classical reference in Ayurvedic texts as a medhya rasayana (cognitive rejuvenative).',
    whatItDoes: 'Memory and learning support, particularly verbal memory and information acquisition. Effect is slow (8-12 weeks for full effect) and sustained. Among the most-studied traditional nootropics; multiple RCTs in school-age children, adults, and older adults with mild cognitive concerns.',
    evidenceTier: 'moderate',
    traditionalPreparation: 'Fresh herb juice, dried powder mixed with ghee + warm milk + honey. Bitter taste; the traditional preparations always include sweetening agents.',
    modernDosing: 'Standardized extract 300-450 mg daily (look for 50% bacosides standardization). 90-120 day initial relationship — effects build slowly. Take with food (fat-soluble compounds; absorption requires fat).',
    sourcingNotes: 'Banyan Botanicals, Himalaya, and Pukka are reliable Ayurvedic suppliers. Some bacopa products contain Centella asiatica (gotu kola, also called brahmi in some traditions); read labels carefully if you specifically want Bacopa monnieri.',
    cautions: 'GI side effects (nausea, cramping, increased bowel movements) common at higher doses; reduce dose if these occur. May potentiate sedatives. May interact with thyroid medications. Generally safe long-term.',
    beginnerRanking: 2,
  },
  {
    id: 'gotu-kola',
    commonName: 'Gotu Kola',
    botanicalName: 'Centella asiatica',
    partUsed: 'leaf',
    category: 'multiple',
    tradition: 'Ayurveda + TCM + Indonesian + Sri Lankan — used 2,500+ years. In some traditions also called brahmi (creating confusion with Bacopa monnieri). Considered a longevity herb in TCM ("herb of long life").',
    whatItDoes: 'Cognitive support (similar to but milder than bacopa), wound healing (well-documented for diabetic wound and burn healing), connective tissue support, mild calming effect. Both nootropic and food-medicine. Eaten as a salad green in Sri Lanka and parts of Southeast Asia.',
    evidenceTier: 'moderate',
    traditionalPreparation: 'Fresh leaves eaten as salad green or added to dal. Powdered for medicinal use. Traditional Sinhalese preparation: kola kenda (rice porridge with gotu kola leaves) eaten for breakfast.',
    modernDosing: 'Standardized extract 500-1000 mg daily; OR fresh leaves as part of regular cooking. Easier to integrate into daily food than capsule form.',
    sourcingNotes: 'Fresh gotu kola available at Sri Lankan, Vietnamese, and well-stocked Asian grocery stores. Organic standardized extract via Banyan Botanicals or Mountain Rose Herbs.',
    cautions: 'Possible drowsiness at higher doses. May potentiate sedatives. Possible mild liver concerns at very high doses (cases extremely rare and only at extreme doses). Avoid in pregnancy (traditional contraindication, lacking modern data either direction).',
    beginnerRanking: 2,
  },
  {
    id: 'eleuthero',
    commonName: 'Eleuthero (Siberian Ginseng)',
    botanicalName: 'Eleutherococcus senticosus',
    partUsed: 'root',
    category: 'adaptogen',
    tradition: 'TCM (acanthopanax) + Russian/Soviet research-traditions. Despite "Siberian ginseng" name, not actually a Panax — distinct genus. Soviet research from 1950s-1970s established its adaptogen properties (Brekhman + Dardymov framework derives from this plant).',
    whatItDoes: 'Stress regulation + immune support + mild energy. Gentler than Panax ginseng — fewer side effects, slower-building benefit. Often recommended for people who find Panax ginseng too stimulating. Traditional use for endurance work + recovery from illness.',
    evidenceTier: 'moderate',
    traditionalPreparation: 'Decoction from dried root. Russian tincture preparation is also common.',
    modernDosing: 'Standardized extract 300-1200 mg daily. 6-8 weeks for noticeable effect. Cycling protocols common (6 weeks on / 2 weeks off) but not strictly necessary at moderate doses.',
    sourcingNotes: 'Gaia Herbs, Herb Pharm, Mountain Rose Herbs all reliable. Look for Russian or Eastern-European-sourced root — quality reputation is best from those regions.',
    cautions: 'Caution in hypertension (may modestly raise blood pressure in some individuals). May interact with digoxin (case reports). Generally one of the safer adaptogens.',
    beginnerRanking: 2,
  },
  {
    id: 'green-tea',
    commonName: 'Green Tea / Matcha',
    botanicalName: 'Camellia sinensis',
    partUsed: 'leaf',
    category: 'food-medicine',
    tradition: 'Chinese + Japanese — 2,000+ years of continuous cultivation and consumption. Japanese tea ceremony codifies the relationship-with-plant aspect more explicitly than perhaps any other tradition. Matcha (powdered green tea) preparation comes from Zen Buddhist monastic practice.',
    whatItDoes: 'L-theanine (calming amino acid unique to Camellia sinensis) + caffeine combination produces alert-calm state distinctive from coffee. EGCG (catechin) provides antioxidant + modest metabolic effect. Cumulative cardiovascular benefit documented in long-term population studies.',
    evidenceTier: 'strong',
    traditionalPreparation: 'Loose-leaf brewing (steep at 175°F for 1-3 minutes, multiple infusions from same leaves). Matcha: whisked with hot water in a chawan (tea bowl); the tea ceremony codifies a 30-60 minute slow attentive preparation that is the practice as much as the drink.',
    modernDosing: '2-4 cups daily of brewed tea OR 1-2 servings (1/2 to 1 tsp matcha per serving) daily. The L-theanine effect is strongest in matcha (concentrated leaf form).',
    sourcingNotes: 'Single-origin Japanese (Uji, Shizuoka) for matcha; ceremonial-grade for tea ceremony or daily use, culinary-grade for cooking. For loose-leaf: Ippodo, Marukyu Koyamaen, Rishi, Mem Tea are reliable. Avoid stale grocery-store green tea bags.',
    cautions: 'Caffeine content meaningful — limit late-day consumption. EGCG at very high supplement doses has caused liver injury in rare cases (whole-leaf consumption is safe; isolated extract at high doses is the concern). Pregnancy-safe at moderate doses.',
    beginnerRanking: 1,
  },
];

export const ADVANCED_TIER: Plant[] = [
  {
    id: 'panax',
    commonName: 'Panax Ginseng (Korean / Asian)',
    botanicalName: 'Panax ginseng',
    partUsed: 'root',
    category: 'multiple',
    tradition: 'TCM + Korean traditional medicine — 5,000+ years. The most-revered single plant in Chinese materia medica. Different preparations (white vs red ginseng, processing differences) produce notably different effects. Wild ginseng (rare, expensive) considered superior to cultivated, though cultivated is now standard.',
    whatItDoes: 'Strong adaptogen + nootropic + qi tonic. Energy, cognitive support, immune support, mild blood-sugar support, possible cardiovascular benefits. More potent than eleuthero; correspondingly more potential for side effects.',
    evidenceTier: 'strong',
    traditionalPreparation: 'Decoction. Slow-cooked into soups (samgyetang in Korean tradition — chicken soup with whole ginseng root). Korean red ginseng is steamed-and-dried, producing a different chemical profile from white ginseng (sun-dried).',
    modernDosing: 'Standardized extract 200-400 mg daily; OR traditional decoction. Korean red ginseng (Cheong Kwan Jang is the standard reliable brand) is a quality benchmark. Cycling protocols (6-8 weeks on / 2-4 weeks off) are recommended.',
    sourcingNotes: 'Korean red ginseng: Cheong Kwan Jang, Ilhwa. American ginseng (related plant Panax quinquefolius, milder, slightly different effect): Wisconsin-grown is the gold standard. Avoid generic "ginseng" without species + processing detail.',
    cautions: 'Stimulating — caution in hypertension, anxiety disorders, insomnia. Substantial drug interactions: warfarin (reduces effect), MAOIs, diabetic medications (may potentiate). Hormonal effects — some research suggests caution in hormone-sensitive cancers. Pregnancy: avoid.',
    beginnerRanking: 3,
  },
  {
    id: 'maca',
    commonName: 'Maca',
    botanicalName: 'Lepidium meyenii',
    partUsed: 'root',
    category: 'food-medicine',
    tradition: 'Andean (Peruvian high altitude) — 2,000+ years of cultivation as both food and medicine. Traditional use for fertility, energy, altitude adaptation. Indigenous Quechua framework treats maca as a balancing food-medicine.',
    whatItDoes: 'Endocrine support (somewhat documented for libido, perimenopausal symptoms), energy, mood support. Color-coded by variety: black maca (energy + cognitive), red maca (women\'s reproductive health), yellow maca (general daily). Effects are variable across individuals.',
    evidenceTier: 'emerging',
    traditionalPreparation: 'Cooked (NOT raw) — traditional Andean preparation always cooks the root. Boiled, baked, or made into a porridge. Modern raw maca powder is a contemporary innovation that bypasses traditional preparation; some indigenous Andean herbalists explicitly recommend against raw consumption.',
    modernDosing: 'Gelatinized maca powder (cooked then powdered) 1-3 tsp daily in smoothies, oatmeal, or warm milk. 90-day initial relationship. Effect varies substantially across individuals; some feel it strongly, some not at all.',
    sourcingNotes: 'Sustainable sourcing matters: Peruvian export demand has caused some sourcing concerns. The Maca Team and Sun Potion are reliable and ethical. Insist on gelatinized rather than raw.',
    cautions: 'Generally well-tolerated. Possible mild thyroid effects at higher doses. Hormone-sensitive conditions: caution + clinician consultation. Pregnancy: traditional Andean cuisine includes maca, but supplemental high-dose use during pregnancy is not well-studied.',
    beginnerRanking: 3,
  },
  {
    id: 'cannabis',
    commonName: 'Cannabis (specifically THC + CBD)',
    botanicalName: 'Cannabis sativa / Cannabis indica',
    partUsed: 'flower (and various derivatives)',
    category: 'multiple',
    tradition: 'Multi-cultural: Vedic Indian (the soma debate), TCM (recorded in Pen Ts\'ao Ching c. 100 CE), Middle Eastern, Greek, modern Western. Used 5,000+ years across many cultures for both medicinal and ritual purposes. The contemporary US legalization wave (2012 onward, 24 states fully legal as of 2026) opens corridor practitioner access.',
    whatItDoes: 'Sleep support (CBD primarily, modest THC for sleep architecture), pain modulation (well-documented for chronic neuropathic pain), anxiety modulation (biphasic — low doses calming, high doses anxiogenic for many users), appetite stimulation, end-of-day decompression. The effects depend strongly on cannabinoid profile (THC:CBD ratio), terpenes, and individual neurochemistry.',
    evidenceTier: 'strong',
    traditionalPreparation: 'Varies enormously by tradition. Traditional Indian: bhang (cannabis ground with milk + spices). Traditional Middle Eastern: hashish + tobacco. Modern Western: smoked flower, vaporized flower, edibles, tinctures, topicals. Each delivery method has substantially different onset + duration + effect profile.',
    modernDosing: 'Beginner: 2.5-5 mg THC for edibles (start low; THC dose-response is steep and individual). For CBD-only sleep: 25-50 mg before bed. The federation\'s Andrew-Weil-style position: occasional small doses, intentionally taken, is qualitatively different from daily heavy use.',
    sourcingNotes: 'California legal market: dispensaries with seed-to-sale tracking. Look for organic / sun-grown / craft producers (Henry\'s Original, Aster Farms, Sonoma Hills, Good Feels are corridor-relevant). Avoid concentrate-heavy products as introduction (vaporizer cartridges can deliver very high doses very quickly).',
    cautions: 'Substantial. Adolescent brain development (avoid under 25 for non-medical use). Pregnancy: avoid. Cardiovascular conditions: caution (THC raises heart rate, can trigger arrhythmias in vulnerable individuals). Psychotic disorders: avoid (cannabis can trigger or worsen psychosis in vulnerable individuals). Daily heavy use produces tolerance + dependency + cognitive effects in long-term users. Drug-tested employment: avoid. Drug interactions with sedatives, blood thinners. The federation\'s strong recommendation is informed occasional use, not casual frequent use.',
    beginnerRanking: 3,
  },
  {
    id: 'cacao',
    commonName: 'Cacao (Ceremonial Grade)',
    botanicalName: 'Theobroma cacao',
    partUsed: 'seed (bean)',
    category: 'food-medicine',
    tradition: 'Mesoamerican (Olmec, Maya, Aztec) — 4,000+ years of cultivation. Ceremonial use in pre-Columbian Mesoamerican religious + diplomatic + medicinal contexts. Modern "ceremonial cacao" is a contemporary syncretic practice that draws on traditional Mayan + Aztec preparations.',
    whatItDoes: 'Mild stimulant (theobromine, gentler than caffeine), mood elevation (phenylethylamine + anandamide-related compounds), heart-opening warming sensation in traditional use, cardiovascular support (flavanol content). Distinct from chocolate (which has cacao but added sugar + milk that change the experience substantially).',
    evidenceTier: 'moderate',
    traditionalPreparation: 'Hot water + ground cacao beans + spice (chile, cinnamon, vanilla in traditional preparations). Whisked to a froth. Drunk slowly, attentively. Ceremonial dose is 30-50 g (1-2 oz) of pure cacao paste, substantially more than ordinary cocoa.',
    modernDosing: 'Ceremonial: 30-50 g cacao paste with hot water + spice, 1-2 times per week. Daily: small amount of high-quality dark chocolate (70%+ cacao). Avoid daily ceremonial doses; the practice is the occasional intentional preparation.',
    sourcingNotes: 'Single-origin direct-trade: Soma (Vancouver), Dandelion (San Francisco), Ritual Chocolate. For ceremonial paste: Keith\'s Cacao, Sacred Earth Botanicals, Goddess Chocolates. Fair-trade and environmental sourcing matters substantially in the cacao supply chain.',
    cautions: 'Theobromine effects: jitteriness, heart palpitations possible at high doses (30 g+). May interact with MAOIs. Caffeine-sensitive individuals should avoid late-day. High oxalate content may concern kidney-stone-prone individuals. Otherwise broadly safe.',
    beginnerRanking: 2,
  },
];

export const SOURCING_PRINCIPLES = [
  'Botanical name on the label, not just common name. Common names are ambiguous; "Tulsi" can mean Ocimum sanctum or Ocimum tenuiflorum or hybrids. Insist on the binomial.',
  'Part used specified. Bacopa leaf and bacopa whole-plant are different. Reishi fruiting body and reishi mycelium are different. Read the label.',
  'Standardization disclosed where applicable. "300 mg ashwagandha extract standardized to 5% withanolides" is a real claim. "Ashwagandha extract 300 mg" without standardization is incomplete.',
  'Sourcing region named. "Korean red ginseng from Geumsan, Korea" is a real claim. "Asian ginseng" is not.',
  'Third-party testing for contaminants. Lead, arsenic, pesticides, microbial contamination — all real concerns in the herbal supply chain. Look for ConsumerLab, USP, NSF, or in-house third-party testing disclosed.',
  'Avoid proprietary blends. "Stress Support Blend 1.5 g" without per-ingredient amounts is a marketing maneuver; you cannot dose-correlate or interaction-check. Single-ingredient products always preferable.',
  'Buy in small quantities, replace often. Most plant extracts degrade meaningfully within 12-18 months. Bulk-buying multi-year supplies is false economy.',
  'Prefer suppliers who can name their farm or wildcraft source. The supply chain visibility correlates strongly with quality.',
  'When possible, grow your own. Tulsi, gotu kola, mint, ginger, turmeric, lemon balm, lavender all grow well in California. The relationship is different when you cultivated the plant yourself.',
];

export const NINETY_DAY_PROTOCOL = {
  description: 'The corridor\'s default for beginning a relationship with a single plant. 90 days is the minimum window to honestly evaluate any adaptogenic or nootropic plant in your specific body.',
  weekByWeek: [
    { week: 1, focus: 'Source carefully. Read the label. Confirm botanical name + part + standardization + source. If uncertain, return it and source again.' },
    { week: 2, focus: 'Begin at half the typical dose. Take consistently at the same time daily. Notice baseline feelings (sleep, energy, mood, digestion, focus) so you have a reference for changes.' },
    { week: 3, focus: 'Move to typical dose if tolerating well. Continue daily. No other new plants started during this period — you cannot evaluate one if you started two simultaneously.' },
    { week: 4, focus: 'Brief check-in. Subtle changes may be appearing. Do not raise dose seeking dramatic effect; trust the slow build. Keep journal notes if helpful.' },
    { week: 6, focus: 'Most adaptogens reach a noticeable effect window around week 6-8. Note any changes in stress response, sleep quality, baseline mood. Cross-reference against your week-2 baseline.' },
    { week: 8, focus: 'Effect should be either present and welcome, present and unwelcome, or notably absent. All three are valid outcomes. The 8-week window is your data point.' },
    { week: 10, focus: 'Continue if effect is welcome. Pause for 1-2 weeks if uncertain — sometimes the absence of the plant clarifies what it was doing. Stop if effect is unwelcome.' },
    { week: 12, focus: 'Decision point. Continue this plant as part of long-term practice? Pause and try a different plant? Stop and absorb the learning? All three are valid; the federation default is conscious choice rather than drift into permanent supplementation.' },
  ],
  decisionFramework: [
    'CONTINUE if: clear benefit, no troubling side effects, sustainable cost, you can name what the plant does for you specifically.',
    'PAUSE if: unclear effect, mild side effects you want to evaluate without the plant, cost concern, sense that the plant has done its work for now.',
    'STOP if: clear adverse effect, no benefit detected, drug-interaction concern emerged, no longer useful.',
    'ROTATE if: you want to learn another plant; one-plant-at-a-time learning over years builds far deeper knowledge than perpetual stacking.',
  ],
};

export const PLANT_YEAR_COHORT = {
  description: 'A four-year corridor-cohort program studying one plant per quarter. Sixteen plants across four years, with the same cohort moving through together.',
  structure: 'Quarterly: one plant chosen by cohort consensus. 90-day relationship per the protocol above. Monthly cohort gathering to share notes, pool observations, ask vetted-herbalist questions. Quarterly written cohort synthesis published to federation library.',
  yearOne: 'Starter tier: tulsi, ashwagandha, lion\'s mane, reishi (one per quarter). Foundational adaptogens + cognitive support; easiest to source and tolerate.',
  yearTwo: 'Intermediate tier: rhodiola, bacopa, eleuthero, gotu kola. Deeper engagement; more individual variation in response.',
  yearThree: 'Food-medicines deepening: turmeric (8 weeks integration into cooking), ginger (cultivation + traditional preparations), green tea/matcha (tea ceremony introduction), cacao (one ceremonial preparation per quarter).',
  yearFour: 'Advanced tier: panax ginseng, maca, cordyceps, cannabis (with explicit federation framing — informed occasional use, not casual frequent use). The advanced tier requires the prior years\' foundation; the cohort decides whether to proceed or to deepen prior plants instead.',
  outcome: 'After four years, cohort members have lived 90+ days each with sixteen plants, can name what each does in their specific body, and have a working materia-medica grounded in their own experience rather than internet folklore. The cohort itself becomes a long-term plant-knowledge community.',
  cost: 'Federation cohort rate: $200/year for the cohort (covers one quarterly group purchase of cohort-wide tested supply, plus quarterly herbalist consultation, plus monthly cohort meetings).',
};

export const HONEST_CAUTIONS_SECTION = {
  drugInteractions: 'Adaptogenic and nootropic plants interact with many pharmaceutical medications, sometimes substantively. Common interactions: blood thinners (warfarin, aspirin) potentiated by ginseng, ginkgo, reishi, cordyceps, turmeric, ginger; sedatives potentiated by ashwagandha, valerian, kava; SSRIs/MAOIs interact with rhodiola, ginseng; thyroid medications affected by ashwagandha. The federation\'s strong recommendation: disclose all herb use to your physician, particularly before any surgery or new prescription.',
  pregnancyAndNursing: 'Most adaptogens are traditionally avoided in pregnancy. Specific pregnancy-contraindicated plants on this list: ashwagandha, panax ginseng, rhodiola (uncertain), cordyceps. Pregnancy-safe-at-culinary-doses: tulsi, turmeric, ginger, green tea (modest). Always check with a knowledgeable provider.',
  hypertensionAndCardiovascular: 'Stimulating adaptogens (panax ginseng, eleuthero modestly) may raise blood pressure. Reishi may lower it. Cannabis raises heart rate acutely. Cardiovascular conditions warrant clinician consultation before initiating any of these plants.',
  childrenAndAdolescents: 'Most plants on this list have not been adequately studied in children. Tulsi, ginger, turmeric in culinary doses are generally fine. Adaptogens for cognitive enhancement in adolescents is the federation\'s no-go zone — adolescent brain development is too important to experiment with.',
  autoimmuneConditions: 'Immunostimulating plants (cordyceps, reishi, eleuthero, panax) may exacerbate autoimmune conditions in theory. Lupus, MS, RA, IBD: clinician consultation essential.',
  dependence: 'Stack culture often produces dependency without acknowledging it — the daily ashwagandha that is now non-negotiable. The federation\'s discipline: cycle off plants periodically (1-2 weeks per quarter at minimum) to verify the plant is contributing rather than just maintaining a dependent baseline. If cycling off feels unsustainable, that is information about your relationship with the plant.',
  whenToSeekClinicalCare: 'Plants are not substitutes for diagnosis. New symptoms, worsening symptoms, symptoms that do not respond to a 90-day plant trial, symptoms that interfere with daily function — all warrant clinical evaluation. The federation\'s working position is plants AND clinical care, not plants INSTEAD OF clinical care.',
};

export const REFERENCES = [
  { id: 'weil-spontaneous', cite: 'Weil, A. (1995). *Spontaneous Healing*. Knopf. The integrative-medicine framework foundational to this paper\'s framing.' },
  { id: 'weil-eight-weeks', cite: 'Weil, A. (1997). *Eight Weeks to Optimum Health*. Knopf. Practical integrative-health protocols.' },
  { id: 'weil-aging', cite: 'Weil, A. (2005). *Healthy Aging*. Knopf. Long-term plant-relationship framework.' },
  { id: 'arizona-integrative', cite: 'Arizona Center for Integrative Medicine. (Continuing). *Integrative Medicine Curriculum and Research*. integrativemedicine.arizona.edu.' },
  { id: 'brekhman-dardymov', cite: 'Brekhman, I. I., & Dardymov, I. V. (1969). *New substances of plant origin which increase nonspecific resistance*. Annual Review of Pharmacology, 9, 419-430. The foundational adaptogen-research framework.' },
  { id: 'panossian-wikman', cite: 'Panossian, A., & Wikman, G. (2010). *Effects of adaptogens on the central nervous system and the molecular mechanisms associated with their stress-protective activity*. Pharmaceuticals, 3(1), 188-224. Modern adaptogen-mechanism review.' },
  { id: 'giurgea', cite: 'Giurgea, C. (1972). *Vers une pharmacologie de l\'activité intégrative du cerveau: Tentative du concept nootrope en psychopharmacologie*. Actualités pharmacologiques, 25, 115-156. The original nootropic concept paper.' },
  { id: 'maciocia-herbs', cite: 'Maciocia, G. (2009). *The Practice of Chinese Medicine* (2nd ed.). Elsevier. The foremost English-language clinical TCM reference.' },
  { id: 'pole', cite: 'Pole, S. (2013). *Ayurvedic Medicine: The Principles of Traditional Practice*. Singing Dragon. Comprehensive Ayurvedic materia medica reference.' },
  { id: 'frawley-ranade', cite: 'Frawley, D., & Ranade, S. (2001). *Ayurveda, Nature\'s Medicine*. Lotus Press.' },
  { id: 'winston-maimes', cite: 'Winston, D., & Maimes, S. (2007, 2nd ed. 2019). *Adaptogens: Herbs for Strength, Stamina, and Stress Relief*. Healing Arts Press. The foremost contemporary English-language adaptogen reference.' },
  { id: 'hoffmann', cite: 'Hoffmann, D. (2003). *Medical Herbalism: The Science and Practice of Herbal Medicine*. Healing Arts Press. Comprehensive Western herbal-medicine reference.' },
  { id: 'wagner-stenton', cite: 'Wagner, H., & Norr, H. (Eds.). (2017). *Phytomedicines, Herbal Drugs, and Poisons*. University of Chicago Press. Comprehensive interactions + pharmacology reference.' },
  { id: 'consumerlab', cite: 'ConsumerLab. (Continuing). *Independent Testing of Herbal Supplements*. consumerlab.com. The foremost third-party supplement-quality testing organization.' },
  { id: 'usp', cite: 'United States Pharmacopeia. (Continuing). *Dietary Supplement Verification Program*. usp.org/verification-services.' },
  { id: 'pointcast-living-body', cite: 'University of El Segundo. (2026). *The Living Body*. UES-WP-2026-18. https://pointcast.xyz/living-body.' },
  { id: 'pointcast-practice', cite: 'University of El Segundo. (2026). *Practice*. UES-WP-2026-20. https://pointcast.xyz/practice.' },
  { id: 'pointcast-time', cite: 'University of El Segundo. (2026). *Time*. UES-WP-2026-16. https://pointcast.xyz/time.' },
];

export const PAPER_NOTES = {
  uesNote: 'This paper is the corridor\'s working framework for plant relationship in the Andrew-Weil integrative-medicine lineage. It documents 16 plants across three tiers (6 starter, 6 intermediate, 4 advanced), proposes a 4-year Plant Year cohort, and is honest about both benefits and risks. The federation does not sell plants; the federation does not earn affiliate revenue; the federation maintains no commercial interest in any source named here. Recommendations are based on practitioner-network input, traditional-text reading, and contemporary research literature.',
  invitation: 'If you are a clinical herbalist with deep tradition + modern research literacy interested in joining the federation\'s practitioner network, an integrative-medicine physician open to corridor partnership, a corridor cohort member who wants to begin the 90-day single-plant protocol or join the Plant Year cohort, email mh@pointcast.xyz with subject line "Plant · {role}". The Plant Year cohort cap is 12; the first cycle begins autumnal-equinox 2026 with tulsi as the consensus starter plant.',
  closingNote: 'The plant has been in relationship with humans for tens of thousands of years. We are the recent arrivals to the conversation. The corridor\'s contribution is not to optimize the conversation; it is to slow it down enough that we can hear what the plant has to say. Begin with one plant. Source it carefully. Live with it for 90 days. Notice. Trust the slow knowledge.',
};
