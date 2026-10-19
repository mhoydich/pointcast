// Staycamp — a home camping kit brand concept.
// Concept by cc. Safety copy checked against the linked public guidance,
// 2026-10-19; the concept is not a product or an emergency response service.

export const safetySources = [
  { title: 'CDC: emergency water storage', url: 'https://www.cdc.gov/water-emergency/about/how-to-create-and-store-an-emergency-water-supply.html' },
  { title: 'CDC: making water safe', url: 'https://www.cdc.gov/water-emergency/about/index.html' },
  { title: 'CDC: carbon monoxide and generators', url: 'https://www.cdc.gov/carbon-monoxide/about/index.html' },
  { title: 'FoodSafety.gov: food during an outage', url: 'https://www.foodsafety.gov/food-safety-charts/food-safety-during-power-outage' },
  { title: 'FDA: insulin storage in an emergency', url: 'https://www.fda.gov/drugs/emergency-preparedness-drugs/information-regarding-insulin-storage-and-switching-between-products-emergency' },
  { title: 'CDC: heat and your health', url: 'https://www.cdc.gov/heat-health/about/index.html' },
];

export const brand = {
  name: 'Staycamp',
  tagline: 'Camp in. Lights optional.',
  promise:
    'A camping kit concept that lives in your hall closet. On an ordinary weekend it is a living-room campout. When the power takes a long break, it helps you plan for water, warmth, light, supper and routine.',
  idea:
    'In a long outage the house stays put and the systems wander off. Staycamp packs the small jobs the city usually does for you. Home can be the campsite while it is safe to stay; a plan to leave belongs in the kit too.',
};

export type Essential = {
  id: string;
  kitName: string;
  need: string;
  line: string;
  packs: string[];
  fieldNote: string;
};

export const essentials: Essential[] = [
  {
    id: 'canteen',
    kitName: 'The Canteen',
    need: 'Water',
    line: 'At least a gallon a person a day, stored before you need it.',
    packs: [
      'Food-grade 5-gallon jugs with spigots (five person-days each at the baseline)',
      'A storage checklist: fill with safe water before an outage and date each jug',
      'A printed copy of current CDC water-treatment instructions, matched to the product label',
      'A household water plan that adds capacity for heat, illness, pregnancy and pets',
    ],
    fieldNote:
      'Use safe bottled or stored water. Household tanks are not part of the baseline supply. Follow local water advisories; boiling or bleach cannot remove fuel or toxic chemicals.',
  },
  {
    id: 'den',
    kitName: 'The Den',
    need: 'Warmth and cool',
    line: 'A warm place to rest, and somewhere cooler to go.',
    packs: [
      'A freestanding indoor tent that pitches on a rug, no stakes needed',
      'Sleeping bags chosen for your actual climate',
      'Warm layers and socks, with exits and required ventilation kept clear',
      'Cooling towels and a battery fan for indoor temperatures below 90°F',
      'A battery-powered or battery-backed carbon-monoxide alarm',
    ],
    fieldNote:
      'A tent is not a heater or a heat shelter. Keep flames outside it. Plan a safe warm or air-conditioned place to go if your home becomes unsafe, and follow evacuation advice.',
  },
  {
    id: 'little-house',
    kitName: 'The Little House',
    need: 'Sanitation',
    line: 'The camp loo, done properly, before day four asks for it.',
    packs: [
      'A 5-gallon bucket with a snap-on seat and lid',
      'A divider insert that keeps liquid and solid apart, which keeps it civilised',
      'A roll of heavy liners and a sack of pine shavings for covering',
      'A spigot hand-wash station and a bar of soap that does not get skipped',
    ],
    fieldNote:
      'Wash hands with soap and safe water. Use a temporary toilet only with your local emergency sanitation instructions, including how to contain and dispose of waste.',
  },
  {
    id: 'pocket',
    kitName: 'The Pocket',
    need: 'Medicine',
    line: 'Your routine, kept on paper and kept cool.',
    packs: [
      'A water-resistant folio for prescription copies and a written medication list',
      'An insulated pouch to support the storage plan agreed with your pharmacist; it does not guarantee temperature control',
      'A refill calendar for an emergency supply agreed with your pharmacist or clinician',
      'A one-page question sheet to take to your own clinician',
    ],
    fieldNote:
      'Some things need power: CPAP, oxygen concentrators, nebulisers. Staycamp does not guess at those. The question sheet is there so your clinician can tell you what your household needs.',
  },
];

export type Gear = { name: string; need: string; line: string };

// Grouped by what each job depends on, not by product category.
export const rest: Gear[] = [
  {
    name: 'Camp Kitchen',
    need: 'Cooking',
    line: 'Ready-to-eat food for indoors. Portable gas camp stoves and charcoal grills are outdoors only, away from openings; an open window or CO alarm does not make indoor use safe. An indoor-rated electric appliance needs safe power.',
  },
  {
    name: 'Lantern Shelf',
    need: 'Light',
    line: 'A headlamp for everyone, because two free hands beat a torch. LED lanterns for the table. No candles in the box, on purpose.',
  },
  {
    name: 'Camp Radio',
    need: 'News',
    line: 'A battery or hand-crank radio tuned to local emergency broadcasts, and walkie-talkies legal for your area. Mobile service may be interrupted; write down a backup way to reach people.',
  },
  {
    name: 'The Biscuit Tin',
    need: 'Cash',
    line: 'An actual tin, with room for small bills. Nobody can make change for a twenty when the till is a biscuit tin.',
  },
  {
    name: 'Cool Box Kit',
    need: 'Food',
    line: 'Two fridge thermometers and a magnet card with the timings, so nobody has to guess what is still good.',
  },
  {
    name: 'Pantry Rotation',
    need: 'Food',
    line: 'Shelf labels and a monthly reminder for rice, pulses, tins, oil, salt and sugar, so the stock gets eaten before it becomes archaeology.',
  },
  {
    name: 'Power Notes',
    need: 'Fuel',
    line: 'Staycamp does not sell fuel or generators. It does include a card on what to know if you own one, and the one rule that never bends.',
  },
  {
    name: 'Road Card',
    need: 'Getting around',
    line: 'Check local road instructions during an outage. An electric car only supplies home backup when the vehicle and installed equipment support it; check the manuals and a qualified installer.',
  },
];

export type Kit = {
  name: string;
  span: string;
  forWho: string;
  includes: string[];
  price: string;
};

// Concept pricing only: there is no product and nothing is for sale.
export const kits: Kit[] = [
  {
    name: 'The Weekender',
    span: '3 days',
    forWho: 'Two people, or a first try',
    includes: ['Canteen (2 jugs)', 'Lantern Shelf', 'Camp Radio', 'Biscuit Tin', 'Camp Days deck'],
    price: '$149',
  },
  {
    name: 'The Fortnight',
    span: '14 days',
    forWho: 'A household of four, with water capacity added',
    includes: [
      'Canteen starter (6 jugs): 30 gallons; four people for 14 days need at least 56 gallons, so add 6 more 5-gallon jugs',
      'The Den',
      'The Little House',
      'The Pocket',
      'Camp Kitchen',
      'Lantern Shelf, Camp Radio, Biscuit Tin',
      'Cool Box Kit and Pantry Rotation',
      'Porch Cards and Camp Days deck',
    ],
    price: '$689',
  },
  {
    name: 'The Refill',
    span: 'Every 6 months',
    forWho: 'Anyone who already has a kit',
    includes: ['Water-treatment supplies checked against their labels', 'Batteries', 'Liners and shavings', 'A new pantry list'],
    price: '$39',
  },
];

export const campDays = [
  {
    name: 'Porch Cards',
    line: 'A few cards to swap with trusted neighbours: name, number and who would welcome a check-in. Neighbours can help with everyday tasks; emergency and medical needs still need qualified help.',
  },
  {
    name: 'Camp Days deck',
    line: 'Fifty-two cards for days three through fourteen: a morning job, a supper plan, a game, a walk. A routine is not the same as waiting, and morale runs down like anything else.',
  },
  {
    name: 'The Long Trip rule',
    line: 'Try to build a two-week water supply where possible. Plan safe places to go and people to contact as well as supplies to keep at home.',
  },
];

export type FieldRow = { topic: string; figure: string; detail: string; source: number };

export const fieldBook: FieldRow[] = [
  { topic: 'Water to store', figure: 'At least 1 gal / person / day', detail: 'Store at least three days; try for two weeks. Four people for 14 days need 56 gallons: twelve 5-gallon jugs. Allow extra for heat, illness, pregnancy and pets.', source: 0 },
  { topic: 'Water treatment', figure: 'Follow the current instructions', detail: 'Use safe bottled water when available. Match any treatment to the product label and CDC instructions. Boiling or disinfecting does not remove fuel or toxic chemicals.', source: 1 },
  { topic: 'Fridge, door shut', figure: 'Up to 4 hours', detail: 'After four hours without power, discard refrigerated perishables unless a safe temperature was maintained. Use the linked food-by-food chart; do not taste-test.', source: 3 },
  { topic: 'Freezer, door shut', figure: 'About 48 h full · 24 h half', detail: 'Food with ice crystals or at 40°F (4°C) or below can generally be refrozen. Discard thawed perishables held above 40°F for more than two hours. Check the chart for each food.', source: 3 },
  { topic: 'Insulin storage', figure: 'Check your exact product', detail: 'Storage times and temperatures vary by product and device. Follow its label and your clinician or pharmacist; protect from heat and sunlight. Do not use insulin that has frozen.', source: 4 },
  { topic: 'Camp stoves and grills', figure: 'Outdoors only', detail: 'Never use portable gas camp stoves or charcoal grills indoors, in a tent or by an open window. A CO alarm is a backup warning, not permission to burn fuel indoors.', source: 2 },
  { topic: 'Generators', figure: 'More than 20 feet away', detail: 'Operate outdoors, more than 20 feet from doors, windows and vents, never in a garage. Use a battery-powered or battery-backed CO alarm indoors and follow the manufacturer’s instructions.', source: 2 },
  { topic: 'Hot weather', figure: 'Have a cooling plan', detail: 'Use indoor fans only below 90°F. Find an air-conditioned place if home becomes too hot; check on people at higher risk. An indoor tent is not a heat shelter.', source: 5 },
];

export const voice = {
  say: ['camp', 'cosy', 'the long trip', 'supper', 'neighbours', 'just in case', 'kit', 'two calm weeks'],
  avoid: ['survival', 'doomsday', 'bug-out', 'SHTF', 'when it all collapses', 'countdowns', 'fear of strangers', 'tactical anything'],
  rules: [
    'Explain, do not sell. Every number on a box is one a household can act on.',
    'Lead with the ordinary weekend. The outage is the second use, not the first.',
    'Warmth over drama: no black packaging, no camouflage, no red alert banners.',
    'Portable gas stoves and grills stay outdoors. Indoor scenes use LED light and no combustion; a CO alarm never makes indoor fuel-burning safe.',
    'Medicine copy always ends with "ask your clinician". We never stand in for one.',
    'Neighbours are the best part of camp. Nothing we make treats them as a threat.',
  ],
};

export const palette = [
  { name: 'Canvas', hex: '#F3ECDF', use: 'Ground, boxes, labels' },
  { name: 'Pine', hex: '#2F4A3A', use: 'Wordmark, type' },
  { name: 'Ember', hex: '#D7643A', use: 'One accent per surface' },
  { name: 'Dusk', hex: '#27324B', use: 'Night scenes, the Den' },
  { name: 'Lantern', hex: '#E9B84C', use: 'Light, the Lantern Shelf' },
];
