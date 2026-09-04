/**
 * Food — UES Working Paper 2026-22.
 *
 * The eighth paper in the Department of Local Inquiry body-practice
 * arc, after /marine-layer, /bath-house, /time, /p2p-ai, /living-body,
 * /civic-federation, /practice, /plant. Food is the foundational
 * daily body practice — the one nearly everyone engages three times
 * a day for a lifetime. This paper documents the corridor's working
 * relationship with food in the integrative-nutrition lineage of
 * Andrew Weil, Michael Pollan, Wendell Berry, the Slow Food movement,
 * and the Blue Zones research.
 *
 * Companion to /plant — the line between food-medicine and plant
 * medicine is porous. Companion to /time — when you eat and at what
 * pace matters as much as what. Companion to /marine-layer — the
 * cohort table is the cohort sit, scaled to three meals per day.
 */

export const PAPER_META = {
  title: 'Food',
  subtitle: 'Eating as the foundational daily practice · seasonal, traditional, table-bound · in the integrative-nutrition lineage of Weil, Pollan, Berry, Slow Food · UES Working Paper 2026-22',
  thesis: 'Food is the body practice nearly everyone engages three times a day for a lifetime, which makes it both the most consequential and the most overlooked. This paper documents the corridor\'s working position: a Mediterranean-with-Asian-elements baseline (the Weil + Blue Zones synthesis), seasonal eating keyed to the corridor\'s coastal-California growing year, four working foodways the corridor honors (Mediterranean, Japanese, Mexican, Korean), the cohort table as the cohort sit scaled to mealtimes, CSA and farmers-market sourcing, a 90-day food protocol for one-shift-per-fortnight gradual change, and honest cautions about eating disorders, restrictive diets, and supplement substitution. The framing rejects two contemporary defaults — industrial-food convenience and optimization-diet extremism — and adopts the slower position: eat real food, mostly plants, at a table, with named people, on a cadence the body recognizes. The corridor\'s contribution is not nutrition science; it is access to slow eating in a fast-eating culture.',
  paperNumber: 'UES-WP-2026-22',
  date: '2026-05-09',
  authors: [
    { name: 'Michael Hoydich (UES Convener)', dept: 'Department of Local Inquiry', email: 'mh@pointcast.xyz' },
  ],
  keywords: ['food', 'integrative nutrition', 'Andrew Weil', 'Michael Pollan', 'Wendell Berry', 'Slow Food', 'Blue Zones', 'Mediterranean diet', 'seasonal eating', 'cohort table', 'University of El Segundo'],
  parentSurface: 'University of El Segundo · Department of Local Inquiry',
  relatedSurfaces: ['UES-WP-2026-21 Plant', 'UES-WP-2026-20 Practice', 'UES-WP-2026-18 The Living Body', 'UES-WP-2026-16 Time'],
};

export const FRAMING_POSITION = {
  oneSentence: 'Eat real food, mostly plants, in modest portions, at a table, with named people, on a cadence the body recognizes — slowly, attentively, with gratitude.',
  whyNotIndustrialFood: 'The industrial food system — ultra-processed packaged foods comprising 60%+ of American caloric intake (Monteiro et al., NOVA classification research) — produces measurable harm across nearly every health metric studied: cardiovascular disease, type 2 diabetes, obesity, depression, cognitive decline, certain cancers. Convenience is real but the cost compounds across decades. The federation\'s working position is that ultra-processed food is the principal nutritional problem of the 21st century and is best addressed at the corridor scale through cohort-supported change rather than individual willpower.',
  whyNotOptimizationDiet: 'Carnivore, keto, paleo, raw, fruitarian, all-meat, no-meat, intermittent fasting at extreme protocols — the optimization-diet ecosystem produces results for some people in the short term and is also a category of disordered-eating risk factor. The corridor does not advocate any single optimization protocol; we adopt the Pollan synthesis: eat food, not too much, mostly plants. Specific therapeutic diets prescribed by a physician for a diagnosed condition are different and outside this paper\'s scope.',
  whyMediterraneanAsianBaseline: 'The Mediterranean diet (multiple PREDIMED-cohort RCTs; Estruch et al. 2018) and traditional East Asian diets (Okinawa, Japan, parts of China — Blue Zones research by Buettner) both produce documented longevity + low chronic-disease populations. Both share: heavy plant emphasis, modest meat, fish 1-3x/week, olive oil OR sesame oil as principal fat, fermented foods, whole grains, beans/legumes, nuts, tea, modest wine (Mediterranean) OR green tea (Asian), shared meals, slow eating. Andrew Weil\'s "anti-inflammatory diet" is essentially the Mediterranean-Asian synthesis with explicit attention to sustainable sourcing and traditional preparation. The corridor adopts this as baseline.',
  whyTheTable: 'The most-undervalued food intervention in contemporary nutrition is the table itself. Eating standing, in transit, alone, in front of screens, in 8-minute fast-food windows — these produce qualitatively different physiological and psychological responses than eating seated, slowly, with conversation, at a table laid for a meal. The corridor\'s framing: the table is the practice as much as the food. A frozen pizza eaten slowly at a set table with attention and conversation is closer to the corridor\'s thesis than a kale salad eaten alone at a desk in eight minutes. This is heterodox but defended.',
  whyCohort: 'Individuals attempting to change food habits against the friction of family + workplace + social context routinely fail. Cohort-supported change works. The Marine Layer cohort form (eight-week, capped-at-twelve, weekly gathering) translates directly to food: a Cooking Cohort, a CSA Share Cohort, a Restaurant Walk Cohort. Federation cohort offerings scale this to corridor membership.',
  honestUncertainty: 'Nutrition science is genuinely uncertain at many specific levels (saturated fat, exact protein requirements, specific micronutrient optima, intermittent-fasting durations, etc.). The federation\'s position is to follow the boring consensus where consensus exists (more plants, less ultra-processed, more whole grains, less added sugar, more fish for those who eat it, smaller portions than typical American) and to remain humble where research is still evolving. We do not have the answer for everything; the broad strokes are reliable enough to act on.',
};

export const SEVEN_CORRIDOR_FOOD_PRINCIPLES = [
  { principle: 'Real food first', detail: 'Most of what you eat should be recognizable as a plant or animal in its near-original form. Lentils, rice, tomatoes, fish, chicken, eggs, olives, almonds, an apple. Ultra-processed foods (extruded snacks, sugar-sweetened beverages, packaged baked goods, fast food) should be the minority of intake, not the majority. The 80/20 corridor heuristic: 80% real food, 20% room for what the moment asks for, no shame attached to the 20%.' },
  { principle: 'Mostly plants', detail: 'Three-quarters of what you eat (by volume, by plate area, by week) should be plant material — vegetables, fruit, legumes, whole grains, nuts, seeds, herbs, spices. Meat and dairy are valuable in modest portions; they are not the meal\'s center of gravity. The Pollan formulation: eat plants like you mean it.' },
  { principle: 'In modest portions', detail: 'The standard American restaurant portion is 2-3x what most traditional cuisines treat as one serving. Eat off smaller plates. Pay attention to fullness at 70-80%, the traditional Japanese hara hachi bu principle. Stop before you cannot eat another bite.' },
  { principle: 'At a table', detail: 'The table is the practice. Set a place. Sit down. Use real plates and silverware. No screens during meals. The table itself produces parasympathetic-nervous-system activation that standing/transit/screen eating does not.' },
  { principle: 'With named people', detail: 'Eating alone is fine and sometimes the right thing. Eating WITH others, on a regular cadence, is one of the most well-documented longevity-and-wellbeing correlates in Blue Zones and related research. The corridor\'s commitment: at least one meal per week eaten with the same cohort, at the same table, at the same time.' },
  { principle: 'Seasonally and locally', detail: 'Eat what is growing now in your radius. The corridor\'s ~25-mile growing region produces approximately 60% of California\'s vegetable diversity year-round; CSA + farmers markets make local sourcing accessible. Seasonal eating produces variety, supports local agriculture, and aligns the body to the seasonal time-frames documented in /time.' },
  { principle: 'Slowly and gratefully', detail: 'A 20-minute meal is approximately the floor for full satiety signaling. Most Americans average 8-12 minutes. Slow down. Chew. Notice flavor, texture, temperature. Brief expressions of gratitude (silent or spoken, religious or secular) shift eating from refueling to practice. This is the most overlooked food intervention.' },
];

export const SEASONAL_CYCLE = {
  description: 'A corridor-coastal-California seasonal eating cycle. The Mediterranean-Asian baseline runs year-round; what shifts is what local agriculture produces. Use this as a flexible template, not a prescription.',
  winter: {
    months: 'December — February',
    inSeason: 'Citrus (oranges, lemons, mandarins, grapefruit — California citrus season peak), winter squash (butternut, acorn, kabocha, delicata), kale, chard, collards, broccoli, cauliflower, brussels sprouts, fennel, leeks, parsnips, beets, sweet potatoes, persimmons, pomegranates, avocados (yes, California avocados are winter-spring peak).',
    cookingMode: 'Slow-cooked stews, braises, soups, roasted vegetables, citrus-bright salads. Warming spices: ginger, turmeric, cinnamon, black pepper. Pair with whole grains (farro, barley, brown rice). Bean-and-grain bowls.',
    coastalNote: 'The marine layer is heaviest in winter; warming food matters here in a way it does not in inland California. Slow-cooker stew on a foggy morning is the practice.',
  },
  spring: {
    months: 'March — May',
    inSeason: 'Asparagus, peas (snap peas, English peas, snow peas), artichokes (CA produces ~99% of US crop), strawberries (April peak), spring onions, green garlic, leeks, fava beans, rhubarb, baby lettuces, radishes, apricots (late spring), cherries (May).',
    cookingMode: 'Lighter cooking: quick sautés, fresh herb salads, frittatas, pesto (mint, basil, sorrel). Less stew, more salad. Asparagus + lemon + olive oil is the corridor\'s spring practice.',
    coastalNote: 'The marine layer begins its annual buildup. Mornings cool, afternoons warm. Eating outside becomes possible by April.',
  },
  summer: {
    months: 'June — August',
    inSeason: 'Tomatoes (mid-summer peak — heirloom diversity at CA farmers markets is unmatched), peaches, plums, nectarines, berries, peppers, eggplant, zucchini and summer squash, corn, basil, cucumbers, melons, figs (late summer), green beans.',
    cookingMode: 'Minimal cooking. Tomato sandwiches. Caprese. Grilled vegetables. Cold soups (gazpacho). Salads with peaches and burrata. The summer corridor table is most accessible — even non-cooks can produce extraordinary summer meals with seasonal produce.',
    coastalNote: 'Marine layer peak (May-July). Cool mornings, sometimes overcast all day at the coast. Inland is warmer. Eating with the layer in mind: the coastal Hermosa Pier table is sweater-weather even in July.',
  },
  fall: {
    months: 'September — November',
    inSeason: 'Apples, pears, pomegranates (October), persimmons (Hachiya + Fuyu), winter squash returns, brussels sprouts, leeks, fennel, late tomatoes, broccoli, cauliflower, kale, beets, sweet potatoes, walnuts and other tree nuts (October-November harvest).',
    cookingMode: 'Bridge season: lighter summer eating gradually shifts to warmer dishes. Roasted squash with sage and brown butter. Apple-and-fennel salad. Persimmon-walnut salad. Soups return by late October.',
    coastalNote: 'Marine layer recedes through October. Clearest days of the year are often late September through November. Outdoor cohort tables work best in fall.',
  },
};

export const FOUR_FOODWAYS = [
  {
    name: 'Mediterranean',
    geography: 'Italy, Greece, Spain, Southern France, Levant',
    coreFoods: 'Olive oil as principal fat, whole grains (wheat, barley, farro), legumes (chickpeas, lentils, fava beans, white beans), vegetables (tomatoes, eggplant, zucchini, peppers, fennel, artichokes), fish and seafood (sardines, anchovies, sea bass, mussels, octopus), modest meat (lamb, chicken, occasionally pork or beef), cheese (sheep + goat, modest), yogurt, fresh herbs (basil, oregano, rosemary, thyme, parsley), nuts (almonds, walnuts), wine (red, with food, in moderation).',
    keyPreparations: 'Olive-oil-finished vegetables, simple grilled fish, beans-and-grains, salads with fresh tomatoes and olive oil, pasta with vegetable sauces, slow-braised lamb, fresh fruit for dessert.',
    researchBase: 'PREDIMED RCT (Estruch et al. 2018) — 7,447 participants over 4.8 years, Mediterranean-diet group with extra-virgin olive oil showed 30% reduction in major cardiovascular events. Largest randomized trial of any specific dietary pattern.',
    corridorAccess: 'Strongest at the farmers markets (Manhattan Beach, Hermosa, Redondo Beach all have weekly markets). Olive oil sourcing: California olive oil cooperatives (McEvoy Ranch, Olea Farm, Pasolivo) produce world-class olive oil; pair with single-origin Italian or Spanish for variety.',
  },
  {
    name: 'Japanese (Traditional Washoku)',
    geography: 'Japan, with Okinawa as a Blue Zone-significant subregion',
    coreFoods: 'Rice (short-grain), miso (fermented soybean paste), soy sauce, dashi (kombu + bonito stock), fish (salmon, mackerel, sardines, sea bream, tuna in moderation), tofu and edamame, fermented vegetables (pickled daikon, ume, kimchi-adjacent tsukemono), seaweed (nori, wakame, hijiki), green tea, mushrooms (shiitake, enoki, maitake), seasonal vegetables, sesame oil, sake.',
    keyPreparations: 'Ichiju-sansai principle: one soup + three vegetable sides + rice + a small protein. Simple grilling and steaming preferred over heavy frying. Fermented foods at most meals. Tea ceremony as relationship-with-meal codification at the formal extreme; daily ichiju-sansai at the everyday extreme.',
    researchBase: 'Okinawan and traditional-Japanese diets correlate with the longest documented human longevity (Okinawa Centenarian Study, multi-decade research). Recent Westernization has begun eroding this; the traditional pattern is documented and emulatable.',
    corridorAccess: 'Strong: Mitsuwa Marketplace (Torrance), Marukai (Torrance), Tokyo Central. Quality miso, dashi, fish, tea, sesame oil all accessible. Torrance Japanese-American community provides cultural depth beyond product availability.',
  },
  {
    name: 'Mexican (Mesoamerican-Indigenous Foundation)',
    geography: 'Mexico, with regional diversity (Yucatan, Oaxaca, Puebla, Northern, Central, etc.)',
    coreFoods: 'Corn (the trinity foundation: corn + beans + squash), beans (pinto, black, mayocoba), squashes (calabaza, zucchini), tomatoes, tomatillos, chiles (the chile diversity rivals any cuisine globally), avocados, lime, cilantro, cumin, oregano, chocolate (Mesoamerican origin), nopales (cactus pads), epazote, peanuts (Mesoamerican origin), pumpkin seeds.',
    keyPreparations: 'Masa (nixtamalized corn) as the structural carbohydrate — tortillas, tamales, sopes, gorditas. Black or pinto beans daily, often slow-cooked from dry. Salsas (the regional diversity is enormous). Mole (Oaxacan complexity is famous; many simpler regional versions). Tacos as a daily-meal form, not a fast-food category.',
    researchBase: 'The pre-Columbian Mesoamerican diet — corn + beans + squash + chile + occasional meat + fruit — is one of the most-nutritionally-complete traditional dietary patterns documented (FAO indigenous-food-system research). Modern industrial-Mexican food (refined-flour tortillas, deep frying, sugary beverages) is a contemporary departure that has produced rapidly increasing chronic-disease rates.',
    corridorAccess: 'Excellent: corridor demographics include substantial Mexican-American population, especially in Torrance, Hawthorne, Lawndale. Vallarta Supermarket, Northgate Market, and multiple smaller carnicerias provide ingredient access. Masa from Masienda (corridor-adjacent Boyle Heights producer) is the gold standard for tortilla-making at home.',
  },
  {
    name: 'Korean (Traditional Hansik)',
    geography: 'Korea, with regional variation',
    coreFoods: 'Rice (short-grain), kimchi (the foundational fermented vegetable — many varieties beyond the standard napa-cabbage version), gochujang and doenjang (fermented chile + soy bean pastes), sesame oil, garlic, ginger, scallions, fish and seafood (anchovies, mackerel, squid), beef and pork in moderation, mushrooms, seaweed, tofu, soybean sprouts, perilla leaves, Korean radish, fermented vegetables broadly.',
    keyPreparations: 'Banchan (multiple small side dishes) at every meal, anchored by rice and a soup or stew. Kimchi at every meal. Bibimbap. Doenjang jjigae. Grilled meats balanced by vegetable wraps (ssam). Substantial fermented-food intake — Korean cuisine may be the most fermented-food-heavy traditional cuisine globally.',
    researchBase: 'Korean traditional diet patterns associate with lower rates of inflammatory disease and excellent gut-microbiome diversity (multiple recent studies on kimchi + microbiome health). Korean cuisine has also been studied for capsaicin metabolic effects.',
    corridorAccess: 'Excellent: H Mart locations across the corridor (Torrance, Diamond Bar, etc.). Korean grocery in Torrance is among the best in the US. The corridor\'s Korean-American population (especially in Torrance) provides cultural depth and restaurant excellence.',
  },
];

export const THE_PLATE = {
  description: 'A practical visualization of a corridor meal. Not prescriptive at the gram level — closer to a default plate that scales across cuisines.',
  proportions: [
    { portion: '50% (half the plate)', what: 'Vegetables and fruit. Cooked + raw mix. Multiple colors (the antioxidant rainbow). Includes greens, cruciferous, root vegetables, alliums (onions, garlic), nightshades, squashes, etc.', examples: 'Roasted brussels sprouts + sautéed kale + sliced cucumber salad; or grilled zucchini + tomato salad + carrot ribbons; or steamed broccoli + roasted sweet potato + spinach.' },
    { portion: '25% (quarter plate)', what: 'Whole grains OR legumes OR both. Brown rice, farro, quinoa, oats, whole-wheat pasta, beans, lentils, chickpeas. Bean-and-grain combinations produce complete protein.', examples: 'Brown rice + black beans; farro + chickpeas; whole-wheat pasta + white beans; barley + lentil soup.' },
    { portion: '15% (small portion)', what: 'Protein. Fish 1-3x/week (sardines, salmon, sole, tuna in moderation). Chicken or eggs as principal land animal. Modest red meat (1-2x/week max). Tofu, tempeh, edamame for plant-based.', examples: 'Grilled salmon (palm-size portion); roasted chicken thigh; baked tofu; two-egg omelet; lentil patty.' },
    { portion: '10% (small portion)', what: 'Healthy fats. Olive oil, avocado, nuts, seeds. Used in cooking + dressing. The Mediterranean baseline is generous with olive oil — not afraid of fat from whole-food sources.', examples: 'Olive oil drizzle; sliced avocado; toasted almonds or walnuts; tahini; pumpkin seeds.' },
  ],
  beverage: 'Water primary. Green tea or black tea daily. Coffee in moderation (1-3 cups, before noon). Wine with dinner (one glass for those who drink) is the Mediterranean tradition; the corridor does not advocate but does not oppose.',
  dessert: 'Fresh fruit is the default. Occasional dark chocolate (70%+). Occasional baked dessert (the 20% category). Sugar-sweetened beverages are the principal added-sugar concern; eliminate or strongly reduce them as the single most impactful sugar intervention.',
};

export const THE_COHORT_TABLE = {
  description: 'The table-as-practice scaled to corridor cohort form. The Marine Layer cohort meets weekly at a place; the Cohort Table meets weekly at a meal. Format documented for direct cohort use.',
  format: 'Sunday dinner, 5:30-7:30pm, alternating host (cohort members rotate). Cap 12 people. Same time every week. Each guest brings one dish (potluck format) OR contributes $20 toward a host-cooked meal. No phones at the table. Conversation starts with brief gratitude (silent or spoken). Two-hour meal pace minimum.',
  ritualElements: [
    'Arrival window 5:00-5:30pm; meal at 5:30pm sharp; the punctuality is the practice',
    'Table set before guests arrive — placecards, real plates and silverware, cloth napkins, candles. The hosting work is the practice',
    'Brief opening: gratitude, naming who is at the table, what is being eaten',
    'Slow eating — first course out for 20-30 minutes, second course for another 20-30 if multi-course',
    'Conversation across the table, not phones or screens. Conversation prompts available if the room is shy: what are you reading, what are you growing, what season is the corridor in',
    'Brief closing: thanks to host, who hosts next week, any cohort business (one minute max)',
    'Cleanup is collaborative; the cohort cleans the host\'s kitchen together',
  ],
  whatItDoes: 'The cohort table is the most-undervalued corridor practice on this list. Three things compound across years: shared table time produces the strongest documented social-tie strengthening of any intervention; weekly slow eating retunes individual eating habits more durably than any individual willpower-based change; the cohort becomes the food cohort that supports cooking classes, CSA shares, restaurant exploration, and the deeper corridor food culture.',
};

export const SOURCING = {
  description: 'Practical sourcing guidance for the corridor\'s coastal-California context. Specific named sources where useful.',
  csa: 'Community-Supported Agriculture: weekly box of seasonal produce, paid up-front, supports local farmers, removes the "what to cook this week" decision. Corridor CSA recommendations: County Line Harvest, Tutti Frutti Farms, Weiser Family Farms, Tamai Family Farms. Cost ~$30-45/week for full share, ~$20-25/week for half. Pickup at farmers markets typically.',
  farmersMarkets: 'Saturdays: Manhattan Beach (8am-2pm, Live Oak Park area), Torrance (8am-1pm, Wilson Park), Santa Monica (the gold-standard Saturday market, 30 min north). Sundays: Hermosa Beach (10am-2pm, Pier Plaza area). Tuesdays: Manhattan Beach midweek market. Choose the consistent weekly market that fits your schedule; the farmer relationships build with regular visits.',
  fish: 'Quality Seafood (Redondo Beach Pier) for fresh whole fish + responsible sourcing. Coastal Seafoods, Royal Hawaiian. Avoid the supermarket fish counter for anything other than canned (sardines, anchovies, salmon — Wild Planet brand is solid). Aim for 1-3 fish meals per week.',
  oliveOil: 'California single-estate olive oils have reached world-class quality. McEvoy Ranch, Pasolivo, Olea Farm, California Olive Ranch (single-estate line only — their blends are conventional). Italian or Spanish single-estate for variety. Buy in dark bottles, store away from light + heat, use within 12 months of harvest date (look for harvest date on the bottle).',
  grainsAndLegumes: 'Anson Mills (Carolina) for grits, flour, oats, beans. Rancho Gordo (Napa) for the canonical California heirloom-bean source. Whole Foods + good supermarkets for everyday whole grains. Bulk bin sourcing typically 30-50% cheaper than packaged.',
  pantry: 'Diaspora Co. for single-origin spices (turmeric, ginger, cinnamon, cardamom, the Diaspora-quality difference is meaningful). Burlap & Barrel for spices broadly. Mitsuwa or H Mart for Asian pantry (miso, soy sauce, sesame oil, kimchi). Northgate or Vallarta for Mexican pantry (masa harina, dried chiles, beans).',
  whatToAvoid: 'Costco-scale industrial olive oil (often adulterated), supermarket fish counter (sourcing opaque), generic supermarket spices (stale, often adulterated, single-origin substantially better), bulk seed oils (industrial canola, soy, corn — minimize), sugar-sweetened beverages broadly (the principal added-sugar source in the American diet).',
};

export const NINETY_DAY_FOOD_PROTOCOL = {
  description: 'A 90-day gradual-change protocol — one shift per fortnight rather than total overhaul. Designed for sustainability over speed. The corridor\'s default starting point for someone wanting to shift food habits.',
  fortnightShifts: [
    { fortnight: 1, weeks: 'Weeks 1-2', shift: 'Add one cohort meal per week. Establish the Cohort Table OR begin attending one. Change nothing else about eating yet — just add the table-with-cohort meal.' },
    { fortnight: 2, weeks: 'Weeks 3-4', shift: 'Eliminate sugar-sweetened beverages. Soda, sweetened juice, sweetened iced tea, frappuccinos. Replace with: water, plain green tea, plain coffee. This is the single highest-leverage food intervention in the American diet.' },
    { fortnight: 3, weeks: 'Weeks 5-6', shift: 'Vegetables at every meal — including breakfast. Spinach in eggs, fruit + nuts + yogurt, lentil soup at lunch, salad at dinner. The defaults shift.' },
    { fortnight: 4, weeks: 'Weeks 7-8', shift: 'Slow down eating. 20-minute meals minimum. Smaller plates. No screens. The Pollan-Weil framing: eat at a table, with attention.' },
    { fortnight: 5, weeks: 'Weeks 9-10', shift: 'Reduce ultra-processed foods. Read labels: more than 5 ingredients you cannot pronounce = ultra-processed. Aim for 70-80% real-food.' },
    { fortnight: 6, weeks: 'Weeks 11-12', shift: 'Begin CSA OR weekly farmers market commitment. Seasonal eating becomes structural, not aspirational.' },
    { fortnight: 7, weeks: 'Weeks 13', shift: 'Synthesize. Write a 200-word reflection: what shifts held, what slipped, what cohort practice you commit to next quarter. The 13 weeks are the protocol; from here, you are practicing rather than transitioning.' },
  ],
};

export const HONEST_CAUTIONS = {
  eatingDisorders: 'Restrictive eating frameworks (this paper or otherwise) can trigger or worsen eating disorders in vulnerable individuals. If you have a history of anorexia, bulimia, orthorexia, binge eating, or compulsive exercise, the federation\'s strong recommendation is to work with a clinician (registered dietitian, eating-disorder-trained therapist) before adopting any structured dietary framework. Andrew Weil himself has been clear: "the goal is healthy relationship with food, not perfect diet."',
  diagnosedConditions: 'Diabetes, celiac, kidney disease, severe food allergies, post-surgical recovery — all warrant clinician-prescribed dietary modifications that supersede this paper. Talk to your doctor. The federation framework is a baseline for healthy adults; therapeutic diets are different and require professional support.',
  pregnancy: 'Specific pregnancy-relevant food guidance: increased folate-rich foods (leafy greens, legumes), iron-rich foods (red meat in modest amounts, lentils, spinach), choline-rich foods (eggs, fish). Avoid raw/undercooked fish and meats, high-mercury fish (tuna, swordfish), unpasteurized dairy, deli meats unless heated. Modest alcohol guidance is increasingly conservative in pregnancy research; the federation defers to OB-GYN guidance. This paper does not substitute for prenatal nutrition guidance.',
  cost: 'Real-food, seasonal, locally-sourced eating costs more in dollars than ultra-processed industrial food. The federation acknowledges this honestly. CSA + farmers market + bulk staples typically averages $80-150/week per person for a real-food diet vs $30-60/week for industrial; the health-cost difference is paid eventually either way. Federation cohort offerings (Cohort Table potluck, CSA Share splitting) reduce per-person cost meaningfully.',
  veganVegetarian: 'The federation does not advocate or oppose vegan or vegetarian diets. Both are completely viable on the corridor framework with attention to specific nutrients (B12 supplementation for vegan, iron + omega-3 + zinc consideration). Vegetarianism is implicit in many traditional foodways the corridor honors. Plant-based dietary patterns are well-supported by long-term outcome research when well-constructed. Poorly-constructed vegetarian diets (cheese pizza + pasta + processed snacks) miss the framework entirely; the issue is real-food-mostly-plants, not the meat/no-meat axis.',
  supplementSubstitution: 'A plant supplement (per /plant) does not substitute for the plant in food. Curcumin extract in capsule form is not equivalent to turmeric in cooking. The food is the practice; supplements are the auxiliary. Federation framing: source from food first, supplement when specifically warranted, never substitute supplement for food relationship.',
};

export const COHORT_OFFERINGS = [
  { offering: 'Cohort Table (weekly)', format: 'Sundays 5:30-7:30pm. Rotating host. Cap 12. Potluck or $20 host-cooked. Two-hour pace. No phones.', whoLeads: 'Rotating cohort members; no formal teacher required.' },
  { offering: 'CSA Share Cohort (weekly)', format: 'Group CSA subscription with 4-6 households splitting one large share. Weekly pickup + division at one cohort member\'s kitchen. Cost: $30-50/household/week.', whoLeads: 'Rotating logistics coordinator; no formal teacher.' },
  { offering: 'Cooking Cohort (4-week cycles)', format: 'Saturdays 11am-2pm, 4-week cycles focused on one foodway (Mediterranean Q1, Japanese Q2, Mexican Q3, Korean Q4). Cap 8 (kitchen capacity). Federation rate $80/cycle.', whoLeads: 'Vetted home-cook teacher per foodway; rotating chefs from the corridor practitioner network.' },
  { offering: 'Restaurant Walk (monthly)', format: 'One Sunday per month. Cohort walks to one corridor restaurant honoring a specific foodway. Slow meal. No-phone agreement. $30-60 per person depending on restaurant.', whoLeads: 'Rotating cohort members select the month\'s restaurant.' },
  { offering: 'Farmers Market Beat (weekly)', format: 'Saturday 9am. Cohort walks the local farmers market together. Conversation with farmers. Shared shopping. Pairs naturally with Cohort Table preparation.', whoLeads: 'Rotating; informal.' },
  { offering: 'Slow Breakfast (monthly)', format: 'One Saturday per month, 8am-10am, at the Bath House (when funded) or a cohort kitchen. Two-hour slow breakfast. Tea ceremony Japanese-tradition occasionally rotated in. Cap 12.', whoLeads: 'Rotating; occasionally a guest tea-ceremony teacher.' },
  { offering: 'Preserving Cohort (seasonal)', format: 'Spring + fall intensive weekends — preserve summer tomatoes + peaches, ferment fall produce, make kimchi. Cap 8. Cost: ingredient cost + $40/weekend.', whoLeads: 'Vetted preservation teacher (the corridor has multiple home-preservation experts).' },
];

export const REFERENCES = [
  { id: 'weil-eating-well', cite: 'Weil, A. (2000). *Eating Well for Optimum Health: The Essential Guide to Bringing Health and Pleasure Back to Eating*. Knopf. The integrative-nutrition foundation text.' },
  { id: 'weil-anti-inflammatory', cite: 'Weil, A., & Daniel, S. (2013). *True Food: Seasonal, Sustainable, Simple, Pure*. Little, Brown. The True Food Kitchen restaurant cookbook; the anti-inflammatory-diet pattern in practical form.' },
  { id: 'pollan-defense', cite: 'Pollan, M. (2008). *In Defense of Food: An Eater\'s Manifesto*. Penguin. "Eat food. Not too much. Mostly plants." The seven words.' },
  { id: 'pollan-omnivore', cite: 'Pollan, M. (2006). *The Omnivore\'s Dilemma*. Penguin. The provenance-of-food investigation foundational to contemporary slow-food thinking.' },
  { id: 'berry-unsettling', cite: 'Berry, W. (1977). *The Unsettling of America: Culture and Agriculture*. Sierra Club Books. The foundational argument for local + traditional food systems.' },
  { id: 'berry-bringing', cite: 'Berry, W. (1990). *What Are People For?* North Point Press. Includes "The Pleasures of Eating," the canonical short essay on slow food.' },
  { id: 'buettner-blue-zones', cite: 'Buettner, D. (2008, rev. 2012). *The Blue Zones: Lessons for Living Longer from the People Who\'ve Lived the Longest*. National Geographic. The contemporary research synthesis of long-lived populations.' },
  { id: 'buettner-solution', cite: 'Buettner, D. (2015). *The Blue Zones Solution*. National Geographic. Practical implementation framework.' },
  { id: 'predimed', cite: 'Estruch, R., et al. (2018). *Primary prevention of cardiovascular disease with a Mediterranean diet supplemented with extra-virgin olive oil or nuts*. New England Journal of Medicine, 378(25), e34. The largest RCT of any specific dietary pattern.' },
  { id: 'monteiro-nova', cite: 'Monteiro, C. A., et al. (2019). *Ultra-processed foods: what they are and how to identify them*. Public Health Nutrition, 22(5), 936-941. The NOVA classification system.' },
  { id: 'okinawa-centenarian', cite: 'Willcox, B. J., Willcox, D. C., & Suzuki, M. (2001). *The Okinawa Program*. Harmony Books. The Okinawa Centenarian Study research synthesis.' },
  { id: 'slow-food', cite: 'Petrini, C. (2003). *Slow Food: The Case for Taste*. Columbia University Press. The Slow Food movement founder\'s case.' },
  { id: 'mintz-sweetness', cite: 'Mintz, S. W. (1985). *Sweetness and Power: The Place of Sugar in Modern History*. Penguin. The foundational historical work on industrial-sugar food culture.' },
  { id: 'shiva-food', cite: 'Shiva, V. (2000). *Stolen Harvest: The Hijacking of the Global Food Supply*. South End Press. The global-south food-sovereignty perspective.' },
  { id: 'mcgee-food-cooking', cite: 'McGee, H. (2004). *On Food and Cooking: The Science and Lore of the Kitchen* (rev. ed.). Scribner. The foremost reference on cooking science.' },
  { id: 'masienda', cite: 'Sandel, J. (2020). *Masa: Techniques, Recipes, and Reflections on a Timeless Staple*. Abrams. The Masienda founder\'s work on heirloom corn + masa.' },
  { id: 'pointcast-plant', cite: 'University of El Segundo. (2026). *Plant*. UES-WP-2026-21. https://pointcast.xyz/plant.' },
  { id: 'pointcast-practice', cite: 'University of El Segundo. (2026). *Practice*. UES-WP-2026-20. https://pointcast.xyz/practice.' },
  { id: 'pointcast-living-body', cite: 'University of El Segundo. (2026). *The Living Body*. UES-WP-2026-18. https://pointcast.xyz/living-body.' },
  { id: 'pointcast-time', cite: 'University of El Segundo. (2026). *Time*. UES-WP-2026-16. https://pointcast.xyz/time.' },
];

export const PAPER_NOTES = {
  uesNote: 'Eighth paper in the Department of Local Inquiry body-practice arc. Documents the corridor\'s working food framework in the integrative-nutrition lineage of Weil, Pollan, Berry, Slow Food, and Blue Zones research. The framework is intentionally pluralistic — Mediterranean-Asian baseline + four detailed foodways + flexible plate + cohort table. Not a diet; a relationship.',
  invitation: 'If you are a corridor cohort member ready to begin the 13-week food protocol or join the Cohort Table, a vetted cooking teacher interested in joining the practitioner network, a CSA operator seeking corridor subscribers, an integrative-nutrition physician open to corridor partnership, email mh@pointcast.xyz with subject line "Food · {role}". Cohort Table cap is 12; first weekly cycle begins autumnal-equinox 2026 quarter regardless of federation council formation.',
  closingNote: 'Eat real food. Mostly plants. In modest portions. At a table. With named people. Seasonally and locally. Slowly and gratefully. Seven principles; one practice; three times a day for a lifetime. The corridor\'s contribution is not a new diet — it is the cohort that makes the slow eating practice possible against the friction of fast-eating culture.',
};
