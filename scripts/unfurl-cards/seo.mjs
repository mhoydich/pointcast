// What search engines, link previews and agents read about each static page in the four areas
// (Baby Bonfire, Coast Commons, House Channel, Light Companion): the meta description, a short
// name and a one-line summary for the area's JSON twin (its pageIndex). Data and helpers only.
// The words describe what the page says and nothing more. They are written by Claude, not in
// anyone's first person, and nothing on these pages is for sale.
// Read by cards.mjs (stampHead, shareHead, the JSON-LD block), by build.mjs (the twins'
// pageIndex) and by the Coast Commons generators.
const SITE = 'https://pointcast.xyz';

const BB_NOTE = ' A concept sketch. Nothing is for sale.';
// [path, name, description (70 to 160 characters), summary (one line)]
const ROWS = [
  ['/baby-bonfire/', 'Baby Bonfire', 'An open exploration of small home objects that bring fire, water, air, earth, light and sound indoors without a screen. Concept sketches. Nothing is for sale.', 'The hub: one dusk street of concept sketches, each a house with a lit window, plus the workshop pages.'],
  ['/baby-bonfire/light-the-hearth/', 'Light the Hearth', `Stack three pallets, carry a flame over from the candle and put the lid on when you are done.${BB_NOTE}`, 'Stack three pallets, carry a flame over from the candle and put the lid on.'],
  ['/baby-bonfire/the-shelf/', 'The Shelf', `Five stone places and seven pieces. Set the shelf, light the hearth and see what the room does.${BB_NOTE}`, 'Five stone places and seven pieces: set the shelf and see what the room does.'],
  ['/baby-bonfire/pieces-roam/', 'The Roaming Shelf', 'A home seen from above. Carry eight pieces between seventeen places and the arrangement is the message. A concept sketch. Nothing is for sale.', 'A home seen from above: carry eight pieces between seventeen places.'],
  ['/baby-bonfire/the-rounds/', 'The Rounds', `Carry a piece to a spot in the house at dawn, midday, dusk or night and the house answers.${BB_NOTE}`, 'Carry a piece to a spot at dawn, midday, dusk or night and the house answers.'],
  ['/baby-bonfire/the-helper/', 'The Helper', 'A small helper on three wheels does chores around an evening home, with a dial for how much it does alone. It never lights a flame. Nothing is for sale.', 'A small helper on three wheels returns stray pieces, brings the snuffer and waters the fern.'],
  ['/baby-bonfire/any-object/', 'Any Object, Any World', `Stick a dot on anything you love and it becomes a piece. Then change the whole room around it.${BB_NOTE}`, 'Stick a dot on any object and it becomes a piece; change the room around it.'],
  ['/baby-bonfire/home-press/', 'The Home Press', 'Five small machines on one bench: clay, wax, paper, felt and food. Design a piece and watch it made. A concept sketch. Nothing is for sale.', 'Five small machines on one bench; design a piece and watch it made.'],
  ['/baby-bonfire/paired-hearths/', 'Paired Hearths', `Two rooms in two homes. Light one hearth and the other one glows.${BB_NOTE}`, 'Two rooms in two homes: light one hearth and the other glows.'],
  ['/baby-bonfire/mesh-street/', 'Mesh Street', 'Light a hearth and watch the signal cross a small town by near hops, rooftop radios and relays. Embers wait when a path is missing. Nothing is for sale.', 'A signal crosses a small town by near hops, rooftop radios and internet relays.'],
  ['/baby-bonfire/house-power/', 'House Power', 'Gather tiny amounts of energy from sun, heat, water, footsteps and a hand crank into one ember bank, then spend it on small signs. Nothing is for sale.', 'Gather tiny energy from the house and spend it on small signs; every sum shown.'],
  ['/baby-bonfire/stations/', 'Stations', `Four places that like company: a drum, a voice, a dance floor and a stretch by the window.${BB_NOTE}`, 'Four places that like company: drum, voice, dance and stretch.'],
  ['/baby-bonfire/the-table/', 'The Table', 'A table seen from above with six seats, one kept for someone far away. Begin a meal, pass the plate, hold a pause. Nothing is for sale.', 'Six seats at a table, one kept for someone far away.'],
  ['/baby-bonfire/weather-in-the-house/', 'Weather in the House', `Six pieces that follow the sky outside: fog, wind, swell, rain, sun and moon. Simulated on the page.${BB_NOTE}`, 'Six pieces follow the sky outside: fog, wind, swell, rain, sun and moon.'],
  ['/baby-bonfire/creatures/', 'Creatures', 'One house, one yard, one day. Set out seed, water and a bell, move the time from dawn to night and see which animals come. Nothing is for sale.', 'Set out seed, water and a bell and see which animals come where.'],
  ['/baby-bonfire/four-seasons/', 'Four Seasons', 'Turn a year wheel and one home changes with it: the light, the pieces, the scent, the sound and a gathering each season. Nothing is for sale.', 'Turn a year wheel and watch one home change with it.'],
  ['/baby-bonfire/five-levels/', 'Five Levels of Magic', `The same hearth at five levels, from a flame that reacts to a shelf that knows the date and the tide.${BB_NOTE}`, 'The same hearth at five levels, from a reacting flame to a shelf that knows the tide.'],
  ['/baby-bonfire/seven-homes/', 'Seven Homes', `One idea in seven houses, where each element gets a built place in the wall. Then build your own.${BB_NOTE}`, 'One idea in seven houses; then build your own.'],
  ['/baby-bonfire/cabinet-of-no-bounds/', 'The Cabinet of No Bounds', `Sixteen home objects nobody can make yet. Each does one thing, wants a gesture and has a cost.${BB_NOTE}`, 'Sixteen impossible home objects, each with one job and a cost.'],
  ['/baby-bonfire/ritual-atlas/', 'Ritual Atlas', 'Thirty-five things people do with fire, water, air, earth, light and sound when something in life changes. A concept sketch. Nothing is for sale.', 'Thirty-five rituals, browsed by element and by occasion.'],
  ['/baby-bonfire/anchors-and-open-time/', 'Anchors and Open Time', `A house that keeps a few fixed moments on three rings and leaves everything else alone.${BB_NOTE}`, 'Three rings of fixed moments, with the rest of the day left open.'],
  ['/baby-bonfire/precedents/', 'Precedents Wall', 'Other people’s work in the directions this exploration is heading, each described briefly with a link out. A concept sketch. Nothing is for sale.', 'Other people’s related work, each card with a link out.'],
  ['/baby-bonfire/open-spec/', 'Open spec v0', 'A draft open to change: what a Baby Bonfire place and piece are, the four signals, the rules, fire safety and what is undecided. Nothing is built or tested.', 'The draft spec: place, piece, four signals, rules, fire safety and open questions.'],
  ['/baby-bonfire/open-mesh/', 'Open mesh notes', 'Notes, not a design: how Baby Bonfire places could talk inside one home and between homes. Opt-in per object, on or off as the owner decides, no account.', 'Notes on how places could talk inside a home and between homes, opt-in only.'],
  ['/baby-bonfire/barter-board/', 'Barter board', 'Makers trading parts of the Baby Bonfire system, such as logs, places, scent, printing time and files. A static first version with example cards. No payments.', 'A static board of example trades between makers; no payments, no prices.'],
  ['/baby-bonfire/make-a-piece/', 'Make a piece', 'How anyone can add to Baby Bonfire: a scene, a piece idea, a file for a printer or laser, a test result or a ritual. The files are open. No licence yet.', 'How to contribute a scene, idea, file, test result or ritual.'],
  ['/baby-bonfire/first-place/', 'First place', 'A printable place: a tile, a puck that drops into it and a recess for a tap tag, with files. A v0.1 proposal, not yet printed, that holds no flame.', 'A v0.1 printable place: tile, puck and tag recess, with files; not yet printed.'],
  ['/baby-bonfire/higher-purpose/', 'A Higher Purpose', 'An island of tiles with a fire, water, air and ground, and a slow groove made as it plays. Walk it on a phone, a desktop or in a headset. Nothing is for sale.', 'A small 3D island of four elements with a generated groove, for a phone, a desktop or a headset.'],
  ['/baby-bonfire/room/', 'The Room', 'A small alcove with the fireplace lit on a table. Look around on a phone or a laptop, or stand in it with a headset. Nothing is for sale.', 'A small alcove with the fireplace lit on a table, to look around on a phone or stand in with a headset.'],
  ['/baby-bonfire/ar/', 'On Your Table', 'The fireplace as a 3D model to turn, 13 cm tall. A phone that supports AR can stand it on a real table. A concept sketch. Nothing is for sale.', 'The fireplace as a 13 cm 3D model to turn, and to stand on a real table where AR works.'],
  ['/baby-bonfire/prayer/', 'Prayer Fire', 'A film of a small fireplace, with sound. Light it, say what it is for, give the words to the flame and sit for a minute. Nothing is for sale.', 'A film of a small fireplace with sound: light it, give the words to the flame, sit.'],

  ['/coast-commons/', 'Coast Commons', 'A free, open study of community-run shared houses for fifteen beach towns within about 25 miles of El Segundo, with each town’s official rules. Not an offer.', 'The hub: a study of shared houses for fifteen beach towns, with the rules read for each.'],
  ['/coast-commons/el-segundo/', 'The El Segundo house', 'What a shared, openly run commons house could be in El Segundo, what the city permits and a six-step ladder that starts with ten people. A study, not an offer.', 'The flagship study: El Segundo’s rules and a six-step ladder starting with ten people.'],
  ['/coast-commons/pattern/', 'The commons recipe', 'The open recipe behind Coast Commons: six ingredients in order, with a cost-split calculator and a ledger template. A study, not an offer.', 'Six ingredients in order, a cost-split calculator and a ledger template.'],
  ['/coast-commons/sb-surf-house/', 'SB Surf House', 'What it would take for a community to run a shared surf house on the Santa Barbara coast: rules, ownership, costs and a nine-step ladder. A study, not an offer.', 'A study of a shared surf house on the Santa Barbara coast, with plans and a nine-step ladder.'],
  ['/coast-commons/fresh-milk/', 'Fresh Milk, Local', 'Could a South Bay neighbourhood get fresh milk from close by? Dairy law, food safety, animal zoning by town and a six-rung ladder. A study, not an offer.', 'A study of dairy rules and animal zoning for local milk, with a six-rung ladder.'],

  ['/house/', 'House Channel', 'A page for a TV that shows a five-letter code. Type the code on a phone and the phone is the remote for a hearth, a window, a hillside of lights and a drum.', 'The TV page: it shows a pairing code and then a hearth, a window, lights or a drum.'],
  ['/house/about/', 'House Channel: the TV as the hearth', 'What House Channel is: open one page on the TV, type five letters on a phone, and the TV shows a hearth, a window, a hillside of lights or a drum. No app.', 'What House Channel is and how a phone pairs with a TV; no account, no app.'],

  ['/light/', 'Light Companion', 'Each person in a circle has one light. Light yours and the others see it. No messages, no feed, no accounts. Not an emergency or monitoring service.', 'A small shared light between people; presence only, not an emergency or monitoring service.'],
];

export const SEO = new Map(ROWS.map(([path, name, description, summary]) => [path, { name, description, summary }]));
export const seoFor = (path) => SEO.get(path) ?? null;

/** The Coast Commons town pages: one template, so the name and the distance make each unique. */
export function townSeo(t) {
  const path = `/coast-commons/${t.slug}/`;
  return {
    path,
    name: t.name,
    description: `${t.name}, ${t.miles} miles from El Segundo: the beach, what a shared commons could be there and the official rules pages that apply. A study, not an offer.`,
    summary: `${t.name}, ${t.miles} miles from El Segundo: the beach, the local rules and what a commons could be there.`,
  };
}

/** The pageIndex of one area's JSON twin: every public page with its url, title and summary. */
export function pageIndex(area, towns = []) {
  const rows = [...SEO].filter(([p]) => p.startsWith(`/${area}/`)).map(([p, s]) => ({ url: `${SITE}${p}`, title: s.name, summary: s.summary }));
  for (const t of towns) { const s = townSeo(t); rows.push({ url: `${SITE}${s.path}`, title: s.name, summary: s.summary }); }
  return rows;
}
