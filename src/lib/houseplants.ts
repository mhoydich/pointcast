export type HouseplantLesson = {
  id: string;
  title: string;
  focus: string;
  takeaway: string;
  practice: string;
};

export type HouseplantProfile = {
  slug: string;
  name: string;
  scientific: string;
  archetype: string;
  light: string;
  lightBand: 'low' | 'medium' | 'bright';
  water: string;
  mix: string;
  feed: string;
  propagation: string;
  watch: string;
  petNote: string;
  skill: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type HouseplantDiagnostic = {
  slug: string;
  symptom: string;
  likely: string[];
  firstChecks: string[];
  nextMove: string;
  avoid: string;
};

export const HOUSEPLANT_LESSONS: HouseplantLesson[] = [
  {
    id: '01',
    title: 'Read light like weather',
    focus: 'Window direction, shadow sharpness, distance from glass, and seasonal drift.',
    takeaway: 'Most foliage plants want bright indirect light: enough sky to grow, not enough direct sun to scorch.',
    practice: 'Stand where the plant sits at noon. If your hand throws a soft shadow, you are in useful indirect light.',
  },
  {
    id: '02',
    title: 'Water the root zone',
    focus: 'Soil moisture, pot size, root mass, drainage, and the difference between dry surface and dry pot.',
    takeaway: 'The calendar is a hint, not a rule. Check the mix, then water thoroughly when the plant actually needs it.',
    practice: 'Lift the pot after watering, then again when dry. Weight teaches faster than guessing.',
  },
  {
    id: '03',
    title: 'Build oxygen into soil',
    focus: 'Drainage holes, chunky amendments, compaction, and root rot prevention.',
    takeaway: 'Roots need water and air. A potting mix that stays wet forever is usually a root problem waiting to happen.',
    practice: 'Add perlite or bark when a tropical foliage mix dries too slowly.',
  },
  {
    id: '04',
    title: 'Use humidity without drama',
    focus: 'Grouping plants, pebble trays, bathrooms, kitchens, and humidifier discipline.',
    takeaway: 'Humidity helps thin-leaf tropicals, but wet soil plus low light is still the bigger danger.',
    practice: 'Move ferns and calatheas together near bright indirect light before buying another gadget.',
  },
  {
    id: '05',
    title: 'Feed growth, not guilt',
    focus: 'Dilute fertilizer, active growth windows, salt buildup, and rest periods.',
    takeaway: 'Fertilizer cannot fix bad light, soggy roots, or pests. Feed lightly when the plant is actively growing.',
    practice: 'Use half-strength balanced fertilizer in spring/summer, then flush occasionally with plain water.',
  },
  {
    id: '06',
    title: 'Repot for roots',
    focus: 'Root circling, pot jumps, drainage, post-repot stress, and when not to disturb a plant.',
    takeaway: 'Repot one size up when roots have filled the pot, not because the leaves look bored.',
    practice: 'Check roots in spring. If the rootball is a tight net, move up 1-2 inches in diameter.',
  },
  {
    id: '07',
    title: 'Propagate from structure',
    focus: 'Nodes, crowns, offsets, rhizomes, cane cuttings, and callusing succulent leaves.',
    takeaway: 'Propagation is plant anatomy in your hand. Find the growth point before making the cut.',
    practice: 'On vines, cut below a node with one leaf attached; roots and shoots need that node.',
  },
  {
    id: '08',
    title: 'Diagnose before treating',
    focus: 'Pests, root stress, light stress, watering mistakes, and pattern recognition.',
    takeaway: 'A symptom is evidence, not a verdict. Check light, roots, soil moisture, and leaf undersides first.',
    practice: 'Quarantine new or suspicious plants for two weeks and inspect under bright light.',
  },
];

export const HOUSEPLANT_PROFILES: HouseplantProfile[] = [
  {
    slug: 'pothos',
    name: 'Pothos',
    scientific: 'Epipremnum aureum',
    archetype: 'forgiving vine',
    light: 'Low to bright indirect light; faster growth and stronger variegation with more indirect light.',
    lightBand: 'medium',
    water: 'Let the top 1-2 inches dry, then water through the pot and empty the saucer.',
    mix: 'Standard indoor mix loosened with perlite or bark.',
    feed: 'Light monthly feeding during active growth.',
    propagation: 'Stem cuttings with at least one node root easily in water or mix.',
    watch: 'Yellow lower leaves usually point to repeated wet soil or old foliage shedding.',
    petNote: 'Keep away from pets and kids who chew leaves.',
    skill: 'Learn nodes, vines, and pruning for fullness.',
    sourceLabel: 'Penn State Extension',
    sourceUrl: 'https://extension.psu.edu/caring-for-houseplants',
  },
  {
    slug: 'snake-plant',
    name: 'Snake plant',
    scientific: 'Dracaena trifasciata',
    archetype: 'architectural survivor',
    light: 'Tolerates low light, but prefers medium to bright indirect light.',
    lightBand: 'medium',
    water: 'Let the mix dry deeply. In low light, water sparingly.',
    mix: 'Fast-draining cactus or succulent-style mix.',
    feed: 'Very light feeding in warm bright months.',
    propagation: 'Division is fastest; leaf cuttings work but variegation may not return true.',
    watch: 'Mushy leaves are a wet-root warning.',
    petNote: 'Keep out of reach of chewing pets.',
    skill: 'Learn drought storage and restraint.',
    sourceLabel: 'University of Minnesota Extension',
    sourceUrl: 'https://extension.umn.edu/houseplants/sansevieria',
  },
  {
    slug: 'zz-plant',
    name: 'ZZ plant',
    scientific: 'Zamioculcas zamiifolia',
    archetype: 'low-light rhizome tank',
    light: 'Low to bright indirect light; avoid harsh direct sun.',
    lightBand: 'low',
    water: 'Let the pot dry well between waterings; thick rhizomes store water.',
    mix: 'Well-drained indoor mix with extra perlite.',
    feed: 'Minimal fertilizer; slow growth is normal.',
    propagation: 'Division or leaf cuttings, slowly.',
    watch: 'Yellowing stems often mean the plant stayed wet too long.',
    petNote: 'Do not allow pets or kids to chew it.',
    skill: 'Learn storage organs and slow-growth patience.',
    sourceLabel: 'Penn State Extension',
    sourceUrl: 'https://extension.psu.edu/caring-for-houseplants',
  },
  {
    slug: 'monstera',
    name: 'Monstera',
    scientific: 'Monstera deliciosa',
    archetype: 'big-leaf climber',
    light: 'Bright indirect light for strong leaves and fenestration.',
    lightBand: 'bright',
    water: 'Water when the upper mix dries; keep evenly moist but never swampy.',
    mix: 'Chunky aroid mix: potting mix plus bark/perlite for air.',
    feed: 'Moderate feeding in active growth.',
    propagation: 'Node cuttings; aerial roots help, but the node is the key.',
    watch: 'Small uncut leaves usually mean low light or immature growth.',
    petNote: 'Keep away from chewing pets.',
    skill: 'Learn climbing support, pruning, and aerial roots.',
    sourceLabel: 'Penn State Extension',
    sourceUrl: 'https://extension.psu.edu/caring-for-houseplants',
  },
  {
    slug: 'spider-plant',
    name: 'Spider plant',
    scientific: 'Chlorophytum comosum',
    archetype: 'offset factory',
    light: 'Bright indirect light; tolerates medium light.',
    lightBand: 'medium',
    water: 'Water when the top inch dries; avoid letting it sit in water.',
    mix: 'General indoor potting mix.',
    feed: 'Light feeding while producing new growth.',
    propagation: 'Pot or water-root the plantlets that form on runners.',
    watch: 'Brown tips can come from dry air, salts, or inconsistent watering.',
    petNote: 'Often grown as a pet-friendlier foliage option, but discourage chewing.',
    skill: 'Learn offsets and plantlet rooting.',
    sourceLabel: 'Penn State Extension',
    sourceUrl: 'https://extension.psu.edu/caring-for-houseplants',
  },
  {
    slug: 'peace-lily',
    name: 'Peace lily',
    scientific: 'Spathiphyllum',
    archetype: 'dramatic moisture reporter',
    light: 'Medium indirect light; too little light reduces bloom.',
    lightBand: 'medium',
    water: 'Keep lightly moist, then water when it starts to soften or the surface dries.',
    mix: 'Moisture-retentive indoor mix with drainage.',
    feed: 'Light feeding during growth; too much can brown tips.',
    propagation: 'Division during repotting.',
    watch: 'Repeated collapse means the root zone is swinging too dry or too wet.',
    petNote: 'Keep away from chewing pets.',
    skill: 'Learn moisture rhythm and bloom expectations.',
    sourceLabel: 'Penn State Extension',
    sourceUrl: 'https://extension.psu.edu/caring-for-houseplants',
  },
  {
    slug: 'calathea',
    name: 'Calathea / prayer plant',
    scientific: 'Goeppertia and Maranta relatives',
    archetype: 'humidity truth-teller',
    light: 'Medium indirect light; avoid direct sun on patterned leaves.',
    lightBand: 'medium',
    water: 'Keep evenly moist with good air in the mix; avoid hard drybacks.',
    mix: 'Fine but airy tropical mix that does not compact.',
    feed: 'Very dilute feeding in active growth.',
    propagation: 'Division, not leaf cuttings.',
    watch: 'Crispy edges point to dry air, salts, drought swings, or harsh sun.',
    petNote: 'Often chosen where pet safety matters, but still prevent chewing.',
    skill: 'Learn humidity, water quality, and fine-root care.',
    sourceLabel: 'University of Minnesota Extension',
    sourceUrl: 'https://extension.umn.edu/houseplants/growing-tropical-ferns',
  },
  {
    slug: 'fern',
    name: 'Boston fern',
    scientific: 'Nephrolepis exaltata',
    archetype: 'thin-leaf humidity meter',
    light: 'Bright indirect light, away from hot direct sun.',
    lightBand: 'bright',
    water: 'Keep evenly moist; do not let the rootball crisp completely.',
    mix: 'Moisture-retentive but draining mix.',
    feed: 'Light, regular feeding during growth.',
    propagation: 'Division or runners depending on type.',
    watch: 'Leaflet drop means the plant dried too much, sat too hot, or lacked humidity.',
    petNote: 'Usually a pet-friendlier classic, but avoid chewing messes.',
    skill: 'Learn humidity, consistency, and fine foliage.',
    sourceLabel: 'University of Minnesota Extension',
    sourceUrl: 'https://extension.umn.edu/houseplants/growing-tropical-ferns',
  },
  {
    slug: 'african-violet',
    name: 'African violet',
    scientific: 'Streptocarpus sect. Saintpaulia',
    archetype: 'windowsill bloomer',
    light: 'Bright indirect light; east or bright filtered windows work well.',
    lightBand: 'bright',
    water: 'Keep evenly moist but avoid cold water on leaves; bottom watering can help.',
    mix: 'Light, porous African violet mix.',
    feed: 'Dilute fertilizer for bloom during active growth.',
    propagation: 'Leaf cuttings with petiole.',
    watch: 'No flowers usually means low light, cold, crowding, or nutrient imbalance.',
    petNote: 'Keep leaves from becoming a snack even when considered gentle.',
    skill: 'Learn bloom culture and leaf propagation.',
    sourceLabel: 'University of Minnesota Extension',
    sourceUrl: 'https://extension.umn.edu/houseplants/african-violets',
  },
  {
    slug: 'succulent',
    name: 'Succulent / cactus',
    scientific: 'Mixed drought-adapted genera',
    archetype: 'bright-window desert lesson',
    light: 'Very bright light; many need direct sun indoors to stay compact.',
    lightBand: 'bright',
    water: 'Water deeply, then let the mix dry thoroughly.',
    mix: 'Gritty cactus mix with excellent drainage.',
    feed: 'Sparse feeding in active growth.',
    propagation: 'Offsets, pads, stem pieces, or callused leaves depending on plant.',
    watch: 'Stretching and pale growth mean not enough light.',
    petNote: 'Spines and sap can injure; place thoughtfully.',
    skill: 'Learn full dryback, callusing, and light hunger.',
    sourceLabel: 'University of Minnesota Extension',
    sourceUrl: 'https://extension.umn.edu/houseplants/cacti-and-succulents',
  },
  {
    slug: 'orchid',
    name: 'Moth orchid',
    scientific: 'Phalaenopsis',
    archetype: 'epiphyte teacher',
    light: 'Bright indirect light; leaves should be firm green, not scorched.',
    lightBand: 'bright',
    water: 'Water bark thoroughly, then let it approach dry; never let the crown sit wet.',
    mix: 'Orchid bark or epiphyte mix, not dense potting soil.',
    feed: 'Weak fertilizer during active growth.',
    propagation: 'Usually division or keikis, not casual cuttings.',
    watch: 'Wrinkled leaves can mean underwatering or dead roots, so inspect roots before adding more water.',
    petNote: 'Commonly treated as pet-friendlier, but keep flowers intact.',
    skill: 'Learn epiphytes, bark media, and root inspection.',
    sourceLabel: 'University of Minnesota Extension',
    sourceUrl: 'https://extension.umn.edu/houseplants/orchids',
  },
  {
    slug: 'philodendron',
    name: 'Heartleaf philodendron',
    scientific: 'Philodendron hederaceum',
    archetype: 'teaching vine',
    light: 'Medium to bright indirect light; tolerates lower light with slower growth.',
    lightBand: 'medium',
    water: 'Let the surface dry before watering thoroughly.',
    mix: 'Loose indoor mix with drainage.',
    feed: 'Light feeding in spring and summer.',
    propagation: 'Node cuttings in water, sphagnum, or potting mix.',
    watch: 'Long gaps between leaves usually mean light is too low.',
    petNote: 'Keep away from pets and kids who chew leaves.',
    skill: 'Learn trailing versus climbing growth.',
    sourceLabel: 'Penn State Extension',
    sourceUrl: 'https://extension.psu.edu/caring-for-houseplants',
  },
];

export const HOUSEPLANT_DIAGNOSTICS: HouseplantDiagnostic[] = [
  {
    slug: 'yellow-leaves',
    symptom: 'Yellow leaves',
    likely: ['wet roots', 'old lower foliage', 'low light', 'nutrient stress'],
    firstChecks: ['soil moisture at root depth', 'drainage hole', 'new vs old leaves', 'recent move'],
    nextMove: 'Check the root zone before watering again. If the pot is wet and heavy, add light/air and let it dry.',
    avoid: 'Do not fertilize a soggy plant to green it up.',
  },
  {
    slug: 'brown-tips',
    symptom: 'Brown tips',
    likely: ['dry air', 'salt buildup', 'inconsistent water', 'leaf sensitivity'],
    firstChecks: ['humidity', 'fertilizer strength', 'tap-water minerals', 'pot drying pattern'],
    nextMove: 'Trim damage for looks, flush the mix with plain water, and stabilize watering.',
    avoid: 'Do not mist once and call humidity solved.',
  },
  {
    slug: 'drooping',
    symptom: 'Drooping',
    likely: ['too dry', 'too wet', 'heat stress', 'root damage'],
    firstChecks: ['pot weight', 'soil smell', 'stem firmness', 'temperature spike'],
    nextMove: 'If dry, water thoroughly. If wet, stop watering and inspect roots if it keeps collapsing.',
    avoid: 'Do not keep adding water without checking whether the roots can breathe.',
  },
  {
    slug: 'leggy-growth',
    symptom: 'Leggy growth',
    likely: ['not enough light', 'no pruning', 'seasonal stretch'],
    firstChecks: ['distance from window', 'shadow strength', 'spacing between nodes', 'direction plant leans'],
    nextMove: 'Move closer to brighter indirect light and prune above nodes to restart fullness.',
    avoid: 'Do not solve low light with more fertilizer.',
  },
  {
    slug: 'fungus-gnats',
    symptom: 'Fungus gnats',
    likely: ['constantly moist mix', 'organic debris', 'slow-drying pot'],
    firstChecks: ['top inch moisture', 'saucer water', 'pot size', 'soil surface debris'],
    nextMove: 'Let the top layer dry, remove debris, improve airflow, and use sticky cards to monitor adults.',
    avoid: 'Do not drench every plant with pesticide before fixing the wet-soil habit.',
  },
  {
    slug: 'sticky-leaves',
    symptom: 'Sticky leaves',
    likely: ['scale', 'aphids', 'mealybugs', 'whiteflies'],
    firstChecks: ['undersides of leaves', 'stems and nodes', 'new growth', 'nearby plants'],
    nextMove: 'Isolate the plant, wipe leaves, identify the pest, then repeat treatment weekly until clear.',
    avoid: 'Do not put it back near the collection after one cleaning.',
  },
  {
    slug: 'no-flowers',
    symptom: 'No flowers',
    likely: ['too little light', 'wrong season', 'overpotting', 'imbalanced feeding'],
    firstChecks: ['light level', 'plant maturity', 'root crowding', 'temperature pattern'],
    nextMove: 'Increase appropriate light and learn the plant-specific bloom trigger before changing everything.',
    avoid: 'Do not overfeed a plant that is already in low light.',
  },
  {
    slug: 'root-rot',
    symptom: 'Root rot smell',
    likely: ['waterlogged mix', 'oversized pot', 'blocked drainage', 'cold wet roots'],
    firstChecks: ['black mushy roots', 'sour soil smell', 'standing saucer water', 'pot size'],
    nextMove: 'Unpot, remove dead roots, repot into fresh airy mix, and reset watering after recovery.',
    avoid: 'Do not reuse sour compacted soil.',
  },
];

export const HOUSEPLANT_SOURCES = [
  {
    label: 'Penn State Extension - Caring for Houseplants',
    url: 'https://extension.psu.edu/caring-for-houseplants',
    role: 'General indoor care principles: light, watering, fertilizer, and common culture.',
  },
  {
    label: 'University of Minnesota Extension - Cacti and succulents',
    url: 'https://extension.umn.edu/houseplants/cacti-and-succulents',
    role: 'Bright-light drought-adapted care and dryback guidance.',
  },
  {
    label: 'University of Minnesota Extension - African violets',
    url: 'https://extension.umn.edu/houseplants/african-violets',
    role: 'Blooming windowsill plant care and propagation.',
  },
  {
    label: 'University of Minnesota Extension - Orchids',
    url: 'https://extension.umn.edu/houseplants/orchids',
    role: 'Epiphyte care, bark media, light, and watering rhythm.',
  },
  {
    label: 'University of Minnesota Extension - Tropical ferns',
    url: 'https://extension.umn.edu/houseplants/growing-tropical-ferns',
    role: 'Humidity and even-moisture care for thin-leaf tropicals.',
  },
];

export const CARE_LIGHT_OPTIONS = [
  { id: 'low', label: 'Low', read: 'Can read a book, weak shadow, far from bright glass.' },
  { id: 'medium', label: 'Medium', read: 'Bright room, soft shadow, no harsh sun on leaves.' },
  { id: 'bright', label: 'Bright', read: 'Strong sky exposure, crisp shadow, filtered or direct sun nearby.' },
] as const;
