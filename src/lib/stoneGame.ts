/**
 * STONE ENERGIES — a card game.
 *
 * 32 stones drawn from the catalog. Each card carries a four-axis energy
 * profile and a midcentury-modern color pairing. Energy axes:
 *
 *   PRESSURE      formation depth, compression history (high: eclogite,
 *                 diamond, blueschist; low: amber, beach sand)
 *   ELECTRICITY   literal piezoelectric, pyroelectric, ferromagnetic
 *                 (high: tourmaline, magnetite, fulgurite; low: amber)
 *   LIGHT         optical phenomena — refraction, iridescence, color
 *                 (high: calcite Iceland spar, labradorite, opal, diamond)
 *   MEMORY        geological age, deep-time depth (high: meteorite,
 *                 BIF hematite, blueschist; low: beach sand, fulgurite)
 *
 * Pair two cards. Compute exchange:
 *   exchange[axis] = caller[axis] - opponent[axis]
 *   total          = sum of all four
 *
 * Positive total: caller absorbs energy. Negative: caller releases.
 * Zero (or near-zero): the cards balance — the philosophical win.
 *
 * Card art is rendered programmatically (SVG gradients + geometric form)
 * so the game ships standalone. Each card also carries a
 * detailed `imagePrompt` field so the same deck can be regenerated with
 * ChatGPT / DALL-E / Midjourney image generation when desired.
 */

export type EnergyAxis = 'pressure' | 'electricity' | 'light' | 'memory';

export type EnergyProfile = Record<EnergyAxis, number>; // 0–10 each

export type CardForm = 'circle' | 'square' | 'hexagon' | 'triangle' | 'arc' | 'cross' | 'oval';

export type StoneCard = {
  id: string;
  number: number; // deck position 01–32
  name: string;
  formula?: string;
  category: string;
  scale: 'local' | 'national' | 'global';
  energies: EnergyProfile;
  colorA: string; // gradient stop 1 (background)
  colorB: string; // gradient stop 2 (background)
  accent: string; // the foreground geometric form color
  form: CardForm;
  trait: string; // a one-line trait that flavors play
  literalElectric?: boolean; // axis claim has a real physical correlate
  literalLight?: boolean;
  imagePrompt: string;
};

const CARDS: StoneCard[] = [
  { id:'quartz-clear', number:1, name:'CLEAR QUARTZ', formula:'SiO₂', category:'quartz-family', scale:'global',
    energies:{pressure:5,electricity:9,light:7,memory:6}, colorA:'#e8e3d6', colorB:'#9aa6b8', accent:'#1a1a1a', form:'hexagon',
    trait:'Amplifies any energy you place beside it. Piezoelectric (literal).', literalElectric:true,
    imagePrompt:'Square midcentury modern minimalist poster of a clear quartz crystal. Brutalist geometry. Soft gradient from cream #e8e3d6 to slate blue #9aa6b8. Single bold black hexagonal form centered. Hard edges. Subtle paper grain. Reference: Saul Bass, Alvin Lustig. No text. 1:1 square.' },
  { id:'amethyst', number:2, name:'AMETHYST', formula:'SiO₂', category:'quartz-family', scale:'global',
    energies:{pressure:5,electricity:8,light:8,memory:6}, colorA:'#5b3d7a', colorB:'#d6c8e8', accent:'#1a1a1a', form:'hexagon',
    trait:'Doubles light gain when paired with a stone tier "named" or higher.',
    imagePrompt:'Square midcentury modern minimalist poster representing amethyst. Brutalist composition. Smooth radial gradient from deep purple #5b3d7a to lavender #d6c8e8. A single bold matte-black hexagonal prism centered. Reference: Saul Bass, Paul Rand. No text. 1:1 square.' },
  { id:'citrine', number:3, name:'CITRINE', formula:'SiO₂', category:'quartz-family', scale:'global',
    energies:{pressure:5,electricity:8,light:9,memory:6}, colorA:'#d49a3c', colorB:'#f4ecd9', accent:'#1a1a1a', form:'hexagon',
    trait:'Adds +2 light to any partner this turn.',
    imagePrompt:'Square midcentury modern minimalist poster representing citrine. Bold gradient from ochre #d49a3c to cream #f4ecd9. A single black hexagonal form centered, slightly off-axis. Brutalist hard edges. Reference: Alvin Lustig. No text. 1:1 square.' },
  { id:'smoky-quartz', number:4, name:'SMOKY QUARTZ', formula:'SiO₂', category:'quartz-family', scale:'global',
    energies:{pressure:6,electricity:7,light:6,memory:7}, colorA:'#3a3530', colorB:'#a89f93', accent:'#f4ecd9', form:'hexagon',
    trait:'Negates an opponent card\'s electricity for one round.',
    imagePrompt:'Square midcentury minimalist poster of smoky quartz. Gradient from charcoal #3a3530 to warm grey #a89f93. A single cream-white hexagonal silhouette centered. Brutalist. Reference: Paul Rand. No text. 1:1 square.' },
  { id:'rose-quartz', number:5, name:'ROSE QUARTZ', formula:'SiO₂', category:'quartz-family', scale:'global',
    energies:{pressure:5,electricity:6,light:6,memory:6}, colorA:'#d8a3a8', colorB:'#f4ecd9', accent:'#1a1a1a', form:'hexagon',
    trait:'On pairing, both players gain +1 across all axes.',
    imagePrompt:'Square midcentury modern minimalist poster of rose quartz. Gradient from soft rose #d8a3a8 to cream #f4ecd9. A single bold black hexagon centered. Hard edges, gentle paper grain. Reference: Saul Bass. No text. 1:1 square.' },
  { id:'tourmaline-schorl', number:6, name:'BLACK TOURMALINE', formula:'NaFe₃Al₆…', category:'silicate-other', scale:'global',
    energies:{pressure:5,electricity:10,light:4,memory:6}, colorA:'#1a1a1a', colorB:'#3a3530', accent:'#d49a3c', form:'triangle',
    trait:'Reflects half of any incoming energy back to the source. Pyroelectric (literal).', literalElectric:true,
    imagePrompt:'Square brutalist midcentury minimalist poster of black tourmaline. Solid near-black gradient #1a1a1a to #3a3530. A single mustard-yellow #d49a3c sharp triangle centered. Hard edges, no decoration. Reference: Massimo Vignelli. No text. 1:1 square.' },
  { id:'tourmaline-elbaite', number:7, name:'WATERMELON TOURMALINE', formula:'Na(Li,Al)₃Al₆…', category:'silicate-other', scale:'global',
    energies:{pressure:5,electricity:10,light:8,memory:5}, colorA:'#c93a5a', colorB:'#7a8c4f', accent:'#f4ecd9', form:'triangle',
    trait:'Bicolor — counts as two cards of two random axes. Pyroelectric + piezoelectric.', literalElectric:true,
    imagePrompt:'Square midcentury minimalist poster of watermelon tourmaline. Bold split gradient: top half deep red #c93a5a, bottom half olive green #7a8c4f, hard horizontal seam. Cream triangle accent. Brutalist. Reference: Paul Rand. No text. 1:1 square.' },
  { id:'magnetite', number:8, name:'MAGNETITE', formula:'Fe₃O₄', category:'oxide', scale:'local',
    energies:{pressure:6,electricity:10,light:3,memory:6}, colorA:'#1a1a1a', colorB:'#4a4f5a', accent:'#c93a5a', form:'square',
    trait:'Pulls an opposing card to its lane. Ferromagnetic (literal).', literalElectric:true,
    imagePrompt:'Square brutalist minimalist poster of magnetite. Solid black-to-steel gradient #1a1a1a to #4a4f5a. A single deep red #c93a5a square form centered, with two faint field-line arcs. Reference: Massimo Vignelli. No text. 1:1 square.' },
  { id:'hematite', number:9, name:'HEMATITE', formula:'Fe₂O₃', category:'oxide', scale:'global',
    energies:{pressure:6,electricity:5,light:4,memory:9}, colorA:'#7a2820', colorB:'#3a1a14', accent:'#f4ecd9', form:'square',
    trait:'Records the deck. Once played, every subsequent pairing adds +1 memory to both cards.',
    imagePrompt:'Square midcentury minimalist poster of hematite. Gradient from oxblood red #7a2820 to deep maroon #3a1a14. A single cream square form centered. Hard edges. Brutalist. Reference: Saul Bass. No text. 1:1 square.' },
  { id:'calcite', number:10, name:'CALCITE', formula:'CaCO₃', category:'carbonate', scale:'local',
    energies:{pressure:3,electricity:4,light:10,memory:5}, colorA:'#f4ecd9', colorB:'#d8d2c4', accent:'#1a1a1a', form:'cross',
    trait:'Doubles whatever you can read through it. Iceland-spar double refraction (literal).', literalLight:true,
    imagePrompt:'Square midcentury minimalist poster of Iceland-spar calcite. Cream gradient #f4ecd9 to soft tan #d8d2c4. A single bold black cross/plus shape centered, with a faint doubled shadow offset to one side suggesting double refraction. Reference: Paul Rand. No text. 1:1 square.' },
  { id:'labradorite', number:11, name:'LABRADORITE', formula:'(Ca,Na)(Al,Si)₄O₈', category:'silicate-framework', scale:'global',
    energies:{pressure:6,electricity:5,light:10,memory:7}, colorA:'#2a3550', colorB:'#7a8a9a', accent:'#d49a3c', form:'oval',
    trait:'Hides until paired. While face-down, all four energies = ?. Reveal at pairing. Labradorescence (literal).', literalLight:true,
    imagePrompt:'Square midcentury minimalist poster of labradorite. Gradient from deep iridescent navy #2a3550 to slate blue #7a8a9a. A single ochre #d49a3c oval form centered. Subtle iridescent shimmer suggested with overlapping translucent strokes. Brutalist. Reference: Alvin Lustig. No text. 1:1 square.' },
  { id:'moonstone', number:12, name:'MOONSTONE', formula:'(K,Na)AlSi₃O₈', category:'silicate-framework', scale:'global',
    energies:{pressure:5,electricity:4,light:9,memory:5}, colorA:'#d8d8e8', colorB:'#a8b0c4', accent:'#1a1a1a', form:'circle',
    trait:'Tide-card. Energies +1 at night turn (alternates).', literalLight:true,
    imagePrompt:'Square midcentury minimalist poster of moonstone. Gradient from pale blue-white #d8d8e8 to soft slate #a8b0c4. A single black circle centered. Brutalist hard edge. Reference: Saul Bass moon studies. No text. 1:1 square.' },
  { id:'sunstone', number:13, name:'SUNSTONE', formula:'(Ca,Na)(Al,Si)₄O₈', category:'silicate-framework', scale:'national',
    energies:{pressure:5,electricity:5,light:9,memory:5}, colorA:'#d49a3c', colorB:'#c97b56', accent:'#1a1a1a', form:'circle',
    trait:'Day-card. Energies +1 at day turn. Pairs with Moonstone for +3 light each.',
    imagePrompt:'Square midcentury minimalist poster of sunstone. Bold gradient from solar yellow #d49a3c to warm terracotta #c97b56. A single black circle centered. Reference: Saul Bass solar disc compositions. No text. 1:1 square.' },
  { id:'pyrite', number:14, name:'PYRITE', formula:'FeS₂', category:'sulfide', scale:'global',
    energies:{pressure:4,electricity:6,light:3,memory:6}, colorA:'#d4a534', colorB:'#7a6020', accent:'#1a1a1a', form:'square',
    trait:'Sparks: on play, deal 1 electricity to all opposing cards. Fool\'s gold.',
    imagePrompt:'Square brutalist minimalist poster of pyrite. Gradient from brassy yellow #d4a534 to dark bronze #7a6020. A single bold black square cube centered, perfectly geometric. Reference: Massimo Vignelli. No text. 1:1 square.' },
  { id:'obsidian', number:15, name:'OBSIDIAN', formula:'~SiO₂ (glass)', category:'igneous', scale:'national',
    energies:{pressure:4,electricity:5,light:3,memory:3}, colorA:'#0a0a0a', colorB:'#2a2a2a', accent:'#f4ecd9', form:'triangle',
    trait:'Mirror-edge: reflects opponent\'s lowest axis back as its own. Conchoidal fracture.',
    imagePrompt:'Square brutalist minimalist poster of obsidian. Near-black gradient #0a0a0a to #2a2a2a. A single sharp cream triangle centered with a single razor-thin highlight along one edge. Hard edges. Reference: Wim Crouwel. No text. 1:1 square.' },
  { id:'ruby', number:16, name:'RUBY', formula:'Al₂O₃ (Cr)', category:'oxide', scale:'global',
    energies:{pressure:9,electricity:6,light:9,memory:8}, colorA:'#9a1f3c', colorB:'#3a0a14', accent:'#f4ecd9', form:'triangle',
    trait:'Vital fire: +2 across all axes when paired with another foundational card.',
    imagePrompt:'Square midcentury minimalist poster of ruby corundum. Deep crimson gradient #9a1f3c to near-black maroon #3a0a14. A single cream triangle centered. Brutalist composition, no decoration. Reference: Saul Bass. No text. 1:1 square.' },
  { id:'sapphire', number:17, name:'SAPPHIRE', formula:'Al₂O₃ (Fe,Ti)', category:'oxide', scale:'global',
    energies:{pressure:9,electricity:6,light:9,memory:8}, colorA:'#1a3a8a', colorB:'#0a1a4a', accent:'#f4ecd9', form:'triangle',
    trait:'Royal sky: locks an opponent\'s electricity at its current value for one turn.',
    imagePrompt:'Square midcentury minimalist poster of sapphire. Royal blue gradient #1a3a8a to deep indigo #0a1a4a. A single cream triangle centered. Hard edges. Reference: Paul Rand. No text. 1:1 square.' },
  { id:'diamond', number:18, name:'DIAMOND', formula:'C', category:'native', scale:'global',
    energies:{pressure:10,electricity:5,light:10,memory:9}, colorA:'#f4ecd9', colorB:'#a8b0c4', accent:'#1a1a1a', form:'triangle',
    trait:'Mantle relic. Cannot be reduced below 5 on any axis.',
    imagePrompt:'Square brutalist midcentury minimalist poster of a diamond. Cream-to-cool-grey gradient #f4ecd9 to #a8b0c4. A single sharp black triangle centered, perfectly equilateral. Hard edges. Reference: Massimo Vignelli. No text. 1:1 square.' },
  { id:'emerald', number:19, name:'EMERALD', formula:'Be₃Al₂Si₆O₁₈ (Cr)', category:'silicate-other', scale:'global',
    energies:{pressure:7,electricity:5,light:8,memory:7}, colorA:'#1a5a3a', colorB:'#0a2a1a', accent:'#d49a3c', form:'hexagon',
    trait:'Heart of mountain. Heals one of your previously played cards by +1 across all axes.',
    imagePrompt:'Square midcentury minimalist poster of emerald. Deep green gradient #1a5a3a to forest #0a2a1a. A single ochre #d49a3c hexagon centered. Brutalist. Reference: Alvin Lustig. No text. 1:1 square.' },
  { id:'aquamarine', number:20, name:'AQUAMARINE', formula:'Be₃Al₂Si₆O₁₈ (Fe)', category:'silicate-other', scale:'global',
    energies:{pressure:6,electricity:5,light:8,memory:7}, colorA:'#7ab0c4', colorB:'#d8e8ec', accent:'#1a1a1a', form:'hexagon',
    trait:'Sea-mind: cannot be silenced. Speech turn ignored.',
    imagePrompt:'Square midcentury minimalist poster of aquamarine. Soft sea-blue gradient #7ab0c4 to pale blue-white #d8e8ec. A single black hexagon centered. Reference: Saul Bass coastal posters. No text. 1:1 square.' },
  { id:'opal-precious', number:21, name:'OPAL', formula:'SiO₂·nH₂O', category:'quartz-family', scale:'global',
    energies:{pressure:3,electricity:4,light:10,memory:4}, colorA:'#e8d8d4', colorB:'#7ab0c4', accent:'#d49a3c', form:'oval',
    trait:'Diffraction grating: rolls a random axis to +10 each turn. Trapped fire-rainbow.', literalLight:true,
    imagePrompt:'Square midcentury minimalist poster of precious opal. Iridescent gradient cycling through cream #e8d8d4, sea-blue #7ab0c4, with ochre #d49a3c flecks. A single soft-edged oval centered. Reference: Alvin Lustig. No text. 1:1 square.' },
  { id:'lapis-lazuli', number:22, name:'LAPIS LAZULI', category:'silicate-framework', scale:'global',
    energies:{pressure:5,electricity:4,light:7,memory:7}, colorA:'#1a3a8a', colorB:'#0a2050', accent:'#d4a534', form:'square',
    trait:'Ancient pigment. Adds a permanent +2 memory to any card it pairs with — they remember.',
    imagePrompt:'Square brutalist minimalist poster of lapis lazuli. Deep blue gradient #1a3a8a to ultramarine #0a2050 with tiny gold #d4a534 pyrite-fleck dots scattered. A single solid gold square centered. Reference: Saul Bass. No text. 1:1 square.' },
  { id:'malachite', number:23, name:'MALACHITE', formula:'Cu₂CO₃(OH)₂', category:'carbonate', scale:'global',
    energies:{pressure:4,electricity:4,light:7,memory:5}, colorA:'#1a5a3a', colorB:'#7a8c4f', accent:'#1a1a1a', form:'oval',
    trait:'Banded green. Read its bands: predicts opponent\'s next play.',
    imagePrompt:'Square midcentury minimalist poster of malachite. Banded green gradient with concentric arcs from deep emerald #1a5a3a to olive #7a8c4f. A single black oval centered. Brutalist. Reference: Paul Rand. No text. 1:1 square.' },
  { id:'azurite', number:24, name:'AZURITE', formula:'Cu₃(CO₃)₂(OH)₂', category:'carbonate', scale:'global',
    energies:{pressure:4,electricity:4,light:7,memory:5}, colorA:'#1a3a8a', colorB:'#3a5a8a', accent:'#1a5a3a', form:'oval',
    trait:'Sky-mind. Pairs with Malachite for +3 light each (alters into malachite over time).',
    imagePrompt:'Square midcentury minimalist poster of azurite. Deep sky-blue gradient #1a3a8a to softer blue #3a5a8a. A single forest-green #1a5a3a oval centered (foreshadowing alteration). Reference: Saul Bass. No text. 1:1 square.' },
  { id:'turquoise', number:25, name:'TURQUOISE', formula:'CuAl₆(PO₄)₄(OH)₈·4H₂O', category:'phosphate', scale:'national',
    energies:{pressure:4,electricity:4,light:6,memory:5}, colorA:'#5ab0c4', colorB:'#d8e8ec', accent:'#c97b56', form:'oval',
    trait:'Rider\'s stone. Carry into any new lane without penalty.',
    imagePrompt:'Square midcentury minimalist poster of turquoise. Soft sky-blue gradient #5ab0c4 to pale ice #d8e8ec. A single warm terracotta #c97b56 oval centered. Brutalist hard edges. Reference: Alvin Lustig. No text. 1:1 square.' },
  { id:'granite', number:26, name:'GRANITE', category:'igneous', scale:'national',
    energies:{pressure:7,electricity:5,light:4,memory:9}, colorA:'#a8a39a', colorB:'#5a5450', accent:'#1a1a1a', form:'square',
    trait:'Civic foundation. Cannot be displaced. Sierra batholith.',
    imagePrompt:'Square brutalist minimalist poster of granite. Cool grey gradient #a8a39a to charcoal #5a5450 with a hint of speckled grain. A single hard black square centered. Reference: Massimo Vignelli. No text. 1:1 square.' },
  { id:'basalt', number:27, name:'BASALT', category:'igneous', scale:'global',
    energies:{pressure:5,electricity:6,light:3,memory:8}, colorA:'#2a2a2a', colorB:'#5a5450', accent:'#c93a5a', form:'hexagon',
    trait:'Ocean-floor. Columnar. Each basalt in play counts as +1 memory to all basalts.',
    imagePrompt:'Square brutalist minimalist poster of columnar basalt. Dark gradient #2a2a2a to grey #5a5450. A single deep red #c93a5a hexagon centered, with faint suggestions of columnar joints behind it. Reference: Wim Crouwel. No text. 1:1 square.' },
  { id:'serpentine', number:28, name:'SERPENTINE', category:'silicate-other', scale:'national',
    energies:{pressure:8,electricity:5,light:5,memory:9}, colorA:'#3a5a3a', colorB:'#7a8c4f', accent:'#f4ecd9', form:'arc',
    trait:'State rock (CA). Ascends through subduction. After three turns, returns to deck top.',
    imagePrompt:'Square midcentury minimalist poster of serpentine. Mottled green gradient #3a5a3a to olive #7a8c4f. A single cream arc shape suggesting upward movement. Brutalist. Reference: Alvin Lustig. No text. 1:1 square.' },
  { id:'catalina-blueschist', number:29, name:'CATALINA BLUESCHIST', category:'metamorphic', scale:'local',
    energies:{pressure:10,electricity:5,light:5,memory:9}, colorA:'#3a5a8a', colorB:'#1a2a4a', accent:'#f4ecd9', form:'square',
    trait:'The basement. Played from below — sits under any other card. All cards above gain +1 pressure.',
    imagePrompt:'Square brutalist minimalist poster of Catalina blueschist. Cool blue-grey gradient #3a5a8a to deep navy #1a2a4a. A single cream square centered, low in the composition. Reference: Saul Bass deep-sea posters. No text. 1:1 square.' },
  { id:'moldavite', number:30, name:'MOLDAVITE', category:'meteorite', scale:'global',
    energies:{pressure:10,electricity:6,light:7,memory:7}, colorA:'#1a5a3a', colorB:'#7a8c4f', accent:'#d49a3c', form:'triangle',
    trait:'Impact glass (Ries crater, 14.7 Mya). On play, swap one of your card\'s axis values with an opponent.',
    imagePrompt:'Square brutalist minimalist poster of moldavite. Deep mossy green gradient #1a5a3a to olive #7a8c4f with a faint warm flash suggesting impact heat. A single ochre #d49a3c triangle pointing skyward. Reference: Paul Rand. No text. 1:1 square.' },
  { id:'iron-meteorite', number:31, name:'IRON METEORITE', formula:'Fe-Ni', category:'meteorite', scale:'global',
    energies:{pressure:8,electricity:10,light:4,memory:10}, colorA:'#5a5450', colorB:'#1a1a1a', accent:'#c93a5a', form:'cross',
    trait:'Core-of-a-planet relic. Older than Earth. Memory cannot be reduced. Ferromagnetic (literal).', literalElectric:true,
    imagePrompt:'Square brutalist minimalist poster of an iron meteorite. Steel-grey gradient #5a5450 to near-black #1a1a1a with hint of Widmanstätten cross-hatch pattern. A single deep red #c93a5a cross centered. Reference: Massimo Vignelli. No text. 1:1 square.' },
  { id:'fulgurite', number:32, name:'FULGURITE', category:'organic', scale:'global',
    energies:{pressure:6,electricity:10,light:4,memory:2}, colorA:'#d8d2c4', colorB:'#3a3530', accent:'#d4a534', form:'arc',
    trait:'Lightning-frozen sand. On play, deal 5 electricity to a single target. Burns out: discard after use.', literalElectric:true,
    imagePrompt:'Square brutalist minimalist poster of a fulgurite tube. Sandy gradient #d8d2c4 to charcoal #3a3530 with a single jagged ochre #d4a534 lightning-bolt arc. Hard edges. Reference: Alvin Lustig. No text. 1:1 square.' },
];

export const STONE_DECK: StoneCard[] = CARDS;

export type EnergyExchange = {
  caller: { id: string; name: string };
  opponent: { id: string; name: string };
  perAxis: Record<EnergyAxis, number>;
  total: number;
  verdict: 'absorb' | 'release' | 'balance';
};

export function exchange(caller: StoneCard, opponent: StoneCard): EnergyExchange {
  const perAxis: Record<EnergyAxis, number> = {
    pressure: caller.energies.pressure - opponent.energies.pressure,
    electricity: caller.energies.electricity - opponent.energies.electricity,
    light: caller.energies.light - opponent.energies.light,
    memory: caller.energies.memory - opponent.energies.memory,
  };
  const total = perAxis.pressure + perAxis.electricity + perAxis.light + perAxis.memory;
  const verdict: 'absorb' | 'release' | 'balance' = total > 1 ? 'absorb' : total < -1 ? 'release' : 'balance';
  return {
    caller: { id: caller.id, name: caller.name },
    opponent: { id: opponent.id, name: opponent.name },
    perAxis, total, verdict,
  };
}

export const RULES = {
  name: 'STONE ENERGIES',
  goal: 'Reach +20 absorbed energy or pull an opponent to -20. Or — the philosophical win — exchange a hand to total exact balance (zero) across all four axes.',
  setup: 'Shuffle the 32-card deck. Each player draws 5. Lay one face-up "ground" card (the basement) — its memory is a floor for the round.',
  turn: [
    'Draw to 5.',
    'Place one card in your lane.',
    'Declare a pairing: choose one of your cards and one of the opponent\'s cards in play.',
    'Compute exchange: caller axes minus opponent axes, summed.',
    'Apply trait effects in the order they were played.',
    'End turn. Track your absorbed/released total.',
  ],
  axes: {
    pressure: 'formation depth and compression history',
    electricity: 'piezoelectric, pyroelectric, ferromagnetic — many literal',
    light: 'optical phenomena: refraction, iridescence, color',
    memory: 'geological age, deep-time depth',
  },
  philosophicalWin: 'A balanced exchange (sum of axes equals exactly 0) ends the round in mutual recognition. Both players advance one phase. The deck favors balance over domination.',
};
