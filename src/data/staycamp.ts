// Staycamp — a home camping kit brand concept.
// Every figure here comes from the household-outage brief the concept was
// written against. Keep them in sync with the Field Book on the page; when a
// number changes, change it here only.

export const brand = {
  name: 'Staycamp',
  tagline: 'Camp in. Lights optional.',
  promise:
    'A camping kit that lives in your hall closet. On an ordinary weekend it is a living-room campout. When the power takes a long break, it is two calm weeks of water, warmth, light, supper and routine.',
  idea:
    'In a long outage the house stays put and the systems wander off. Staycamp packs the small jobs the city usually does for you, so your home becomes the campsite and nothing else has to change.',
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
    line: 'A gallon a person a day, plus the water you already own.',
    packs: [
      'Stackable 5-gallon jugs with spigots (sized for one person-week each)',
      'Drain-tap hose for the hot-water tank, which already holds 30 to 50 gallons',
      'Dropper bottle and a laminated dose card for plain, unscented bleach',
      'Fill-up checklist for the first day or two, while the taps still run',
    ],
    fieldNote:
      'The toilet tank (not the bowl) holds about three more gallons, and it is usually fine to drink if no cleaner has been added.',
  },
  {
    id: 'den',
    kitName: 'The Den',
    need: 'Warmth and cool',
    line: 'Heat one room well instead of the whole house badly.',
    packs: [
      'A freestanding indoor tent that pitches on a rug, no stakes needed',
      'Sleeping bags rated for your actual climate (chosen by postcode at checkout)',
      'Wool layers, socks and a door draught snake to close the room off',
      'A battery fan and cooling towels for the hot-weather version',
      'A carbon-monoxide alarm, which ships with every Den whether or not you add a heater',
    ],
    fieldNote:
      'A tent pitched indoors warms the air around it. Cold works slowly; heat works fast and falls hardest on older people, so the summer Den is not an afterthought.',
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
      'Hand-washing with stored water matters more than any other single habit, and it is the first one people drop when water feels heavy.',
  },
  {
    id: 'pocket',
    kitName: 'The Pocket',
    need: 'Medicine',
    line: 'Your routine, kept on paper and kept cool.',
    packs: [
      'A water-resistant folio for prescription copies and a written medication list',
      'An insulated pouch for medicines that dislike heat and sunlight (it never freezes them)',
      'A refill calendar that keeps a fortnight of buffer on anything essential',
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
    line: 'A two-burner camp stove, fuel canisters and a note on where it is safe to use. A charcoal grill counts, outdoors only.',
  },
  {
    name: 'Lantern Shelf',
    need: 'Light',
    line: 'A headlamp for everyone, because two free hands beat a torch. LED lanterns for the table. No candles in the box, on purpose.',
  },
  {
    name: 'Camp Radio',
    need: 'News',
    line: 'A hand-crank radio pre-tuned to the national broadcaster, and a pair of licence-free walkie-talkies for the street. Phone towers run for hours, not days.',
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
    line: 'Dark signals mean four-way stops. A glovebox card says so, and says what a charged electric car can and cannot do for a house.',
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
    span: '3 nights',
    forWho: 'Two people, or a first try',
    includes: ['Canteen (2 jugs)', 'Lantern Shelf', 'Camp Radio', 'Biscuit Tin', 'Camp Days deck'],
    price: '$149',
  },
  {
    name: 'The Fortnight',
    span: '14 days',
    forWho: 'A household of four',
    includes: [
      'Canteen (6 jugs, hose, dose card): 30 gallons stored, plus the 30 to 50 in your tank',
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
    includes: ['Fresh bleach (it weakens with age)', 'Batteries', 'Liners and shavings', 'Stove fuel', 'A new pantry list'],
    price: '$39',
  },
];

export const campDays = [
  {
    name: 'Porch Cards',
    line: 'A few cards to swap with the neighbours: name, number, who has a generator, who needs a check-in. Most of the big problems in a long outage get solved by the people on your street.',
  },
  {
    name: 'Camp Days deck',
    line: 'Fifty-two cards for days three through fourteen: a morning job, a supper plan, a game, a walk. A routine is not the same as waiting, and morale runs down like anything else.',
  },
  {
    name: 'The Long Trip rule',
    line: 'Every Staycamp starts by assuming a fortnight. People who plan for the whole trip have an easier week than people who keep waiting for the lights.',
  },
];

export type FieldRow = { topic: string; figure: string; detail: string };

export const fieldBook: FieldRow[] = [
  { topic: 'Water to store', figure: '1 gal / person / day', detail: 'Drinking and basic washing. A fortnight is 14 gallons a person, 28 for a couple. Plan for more in heat.' },
  { topic: 'Water you already have', figure: '30 to 50 gal', detail: 'In the hot-water tank. Draw it from the drain tap, let it cool, disinfect it if in doubt.' },
  { topic: 'Bleach dose', figure: '2 drops / litre', detail: '8 drops a gallon of clear water, using plain unscented bleach at 5 to 6 percent. Double it for cloudy water. Wait 30 minutes.' },
  { topic: 'Bleach to avoid', figure: 'Scented, thick, "with detergent"', detail: 'Plain only. Concentrated (about 8 percent) needs less. Old bottles are weaker, so check the date.' },
  { topic: 'Fridge, door shut', figure: '4 hours', detail: 'Perishables that spend more than 2 hours above 4 °C should go.' },
  { topic: 'Freezer, door shut', figure: '48 h full · 24 h half', detail: 'Refreeze if there are still ice crystals or it stayed at 4 °C or below. Cook what thawed first.' },
  { topic: 'Insulin in use', figure: 'Up to 28 days', detail: 'At room temperature, depending on the product. Refrigerate unopened supplies where you can. Never freeze. Ask your clinician.' },
  { topic: 'Generator fuel', figure: '½ to 1 gal / hour', detail: 'A 5-gallon can lasts less than a working day. Stabilised petrol keeps about a year; propane keeps indefinitely.' },
  { topic: 'Generators', figure: 'Outdoors. Always.', detail: 'Never in a garage, even with the door open. Carbon monoxide has no smell.' },
];

export const voice = {
  say: ['camp', 'cosy', 'the long trip', 'supper', 'neighbours', 'just in case', 'kit', 'two calm weeks'],
  avoid: ['survival', 'doomsday', 'bug-out', 'SHTF', 'when it all collapses', 'countdowns', 'fear of strangers', 'tactical anything'],
  rules: [
    'Explain, do not sell. Every number on a box is one a household can act on.',
    'Lead with the ordinary weekend. The outage is the second use, not the first.',
    'Warmth over drama: no black packaging, no camouflage, no red alert banners.',
    'Every flame ships with a carbon-monoxide alarm, and the alarm is in the photo.',
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
