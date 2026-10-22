// CHAPTER CITY — the novelist. Turns a simulated year into a chapter.
// Deterministic for a given seed and year, so a reload rewrites nothing.
import { rngFrom, pick, MONTHS, DILEMMAS, TOOLS, snapshot } from './chapter-city-sim.mjs';

const n = v => Math.round(v).toLocaleString('en-US');
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fill = (tpl, ctx) => tpl.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] ?? `{${k}}`));
const plural = (count, one, many = `${one}s`) => `${count === 1 ? 'one' : numberWord(count)} ${count === 1 ? one : many}`;
const numberWord = v => ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][v] || n(v);
const seasonOf = m => (m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn');

export const CAST = {
  odile: { name: 'Odile Marsh', role: 'the town clerk' },
  tomas: { name: 'Tomas Ferreira', role: 'the baker' },
  juniper: { name: 'Juniper Bell', role: 'a girl with opinions' },
  wexley: { name: 'Augustin Wexley', role: 'a developer' },
  mei: { name: 'Mei Okafor', role: 'editor of the Ledger' },
};

const juniperAge = year => 8 + year;

// Pick a line this book has not used yet for this slot; once every line in a
// slot has been used, the slot starts over. Keeps chapters from repeating.
function pickFresh(state, rng, list, slot) {
  state.story ||= { used: {} };
  const used = (state.story.used[slot] ||= []);
  let open = list.map((_, i) => i).filter(i => !used.includes(i));
  if (!open.length) { used.length = 0; open = list.map((_, i) => i); }
  const i = open[Math.floor(rng() * open.length) % open.length];
  used.push(i);
  return list[i];
}

// ---------- prologue ----------
export function prologue(state) {
  const rng = rngFrom(state.seed + 7);
  const town = state.name;
  const paras = [
    fill(pick(rng, [
      'Before it was a city, {town} was a stretch of coast, a creek that changed its mind about where to meet the sea, and a wind that never asked permission. The gulls had been there longest and behaved accordingly.',
      'Nobody remembers who first called the place {town}. It was a grassy shelf above a cold blue bay, with a creek, some stubborn trees and a beach that collected driftwood the way some people collect grudges.',
      '{town} began, as most places do, as an argument about where the road should go. The sea had already decided where the edge was.',
    ]), { town }),
    fill(pick(rng, [
      'The new Mayor arrived on a Tuesday with a borrowed desk, a box of survey stakes and six thousand in the treasury. Odile Marsh, who had been town clerk of a town with no buildings for eleven years, set out two cups of coffee and a ledger with nothing in it yet.',
      'The Mayor was sworn in on an upturned crate by Odile Marsh, the clerk, who had brought her own pen. The treasury held six thousand. “That,” Odile said, “is what it holds now.”',
    ]), {}),
    'Down at the edge of the grass, a nine-year-old named Juniper Bell was already drawing streets in the sand with a stick, which was more planning than anyone else had done.',
    'Every road, every house, every bad decision would go into the ledger. Some of it would go into this book.',
  ];
  return { n: 0, year: 0, title: `Prologue: A Coast, a Creek, a Clerk`, headline: `${town} Founded; Gulls Unimpressed`, paras, dilemma: null, snap: snapshot(state) };
}

// ---------- chapter ----------
export function writeChapter(state, record) {
  const rng = rngFrom(state.seed * 3 + record.year * 977);
  const town = state.name;
  const ledger = `The ${town} Ledger`;
  const pop = record.pop, prevPop = record.prev.pop;
  const growth = pop - prevPop;
  const ctx = { town, ledger, pop: n(pop), year: record.year, growth: n(Math.abs(growth)), funds: n(record.funds), tax: record.tax };
  const D = record.districts;
  const bigRes = D.res[0]?.name, bigCom = D.com[0]?.name, bigInd = D.ind[0]?.name;
  ctx.res = bigRes || 'the new streets';
  ctx.com = bigCom || 'the main road';
  ctx.ind = bigInd || 'the east end';
  const paras = [];
  const fresh = (list, slot) => pickFresh(state, rng, list, slot);
  const events = record.log;
  const kinds = new Set(events.map(e => e.kind));

  // opening
  const openSeason = pick(rng, ['end', 'close', 'last weeks']);
  const openers = {
    empty: [
      'Year {year} began with more survey stakes than people. The wind went through {town} without stopping, because there was nothing yet to stop it.',
      'In Year {year}, {town} was mostly a plan and a smell of cut grass. The ledger had a column for population, and the column was being patient.',
    ],
    first: [
      'By the end of Year {year}, {pop} people had moved to {town}. They arrived with furniture tied to car roofs and stayed because the light was good.',
      'In Year {year} the first families came: {pop} people by December, each with a reason, most of them the sea.',
    ],
    tiny: [
      'By the {season} of Year {year}, {town} had {pop} people, which was enough to have a rumour but not yet enough to have two.',
      'Year {year} closed on a town of {pop} souls, most of whom knew each other’s dogs by name.',
      'By the {season} of Year {year} there were {pop} people in {town}: enough for a choir, not yet enough for a choir that could agree.',
      '{town} entered Year {year} with {pop} residents and the particular confidence of a place that has just got its first stop sign.',
    ],
    growing: [
      'By the {season} of Year {year}, {town} had {pop} people and an opinion about each of them.',
      'Year {year} found {town} at {pop} people, {growth} more than a year before. Odile had started writing the totals in pencil.',
      'The sign at the edge of town said {pop} by the end of Year {year}. Someone repainted it twice and gave up.',
      'Year {year}: {pop} people, {growth} of them new, all of them sure the traffic used to be better.',
      'At the {season} of Year {year}, the census-taker counted {pop} people in {town}, plus a dog who would not stop following her.',
      '{town} grew by {growth} people in Year {year}, to {pop}. The bakery queue grew faster.',
      'Year {year} ended with {pop} people in {town}. The newest of them still asked for directions, and got four different answers.',
    ],
    shrinking: [
      'Year {year} was the year {town} got smaller. The sign said {pop}; it had said more. Moving vans went out along the coast road and none came back.',
      'In Year {year}, {growth} people left {town}. The ones who stayed noticed which lights stayed dark.',
      'The Ledger counted the moving vans in Year {year}: enough to carry {growth} people, a piano and two goats out of {town}.',
    ],
    big: [
      'By Year {year}, {town} was a city of {pop}. You could no longer see the whole of it from the water tower, which some people regretted and some people had always wanted.',
      'Year {year}: {pop} people. The Ledger now needed two pages for letters to the editor.',
    ],
  };
  const openKey = pop === 0 ? 'empty' : prevPop === 0 ? 'first' : growth < -10 ? 'shrinking' : pop < 300 ? 'tiny' : pop > 3000 ? 'big' : 'growing';
  paras.push(fill(fresh(openers[openKey], `open-${openKey}`), { ...ctx, season: openSeason }));

  // the town outgrows itself: landmarks become possible
  const unlockLines = {
    lighthouse: 'Somewhere around then, {town} became big enough to want a lighthouse. It was raised at a council meeting by a fisherman who said he was tired of finding the harbour by smell.',
    pier: 'The town was now large enough that people started asking about a ferry. Mei Okafor ran a poll. The ferry won, and so, narrowly, did “a bigger ferry.”',
    college: 'With {pop} people, {town} could finally think about a college. Juniper Bell wrote a four-page letter on the subject; it was the first of many.',
    stadium: 'At {pop} people, {town} had enough fans to fill a stadium, if it had one, and enough opinions to argue about where it would go.',
  };
  for (const k of record.unlocked || []) if (unlockLines[k]) paras.push(fill(unlockLines[k], ctx));

  // the mayor's choice from the start of the year
  if (record.lastChoice) {
    const c = record.lastChoice, d = DILEMMAS[c.key];
    const consequences = {
      casino: { a: 'Wexley’s pier opened in the spring with a brass band and a faint smell of new carpet. The treasury was richer. The night was louder.', b: 'Wexley took the refusal with a smile that did not reach his eyebrows. Mei Okafor ran the headline she had been saving: MAYOR KEEPS THE PIER FOR FISHING.' },
      library: { a: 'The library opened in a former shoe shop. Juniper Bell was its first borrower and its first complaint, about the shelving.', b: 'There was no library that year. Juniper kept the petition in a folder marked LATER, underlined.' },
      exemption: { a: 'The factories got their exemption. The chimneys worked overtime, and so did the laundry lines.', b: 'The emissions rules stayed. The factory owners grumbled into their ledgers; the air over town stayed the colour of air.' },
      film: { a: 'The film crew was booked for next spring. People began practising looking surprised near the waterfront.', b: 'The studio went to another town. Several residents were privately relieved to keep their faces to themselves.' },
      bread: { a: 'Tomas spent the year planning the loaf. His notebooks filled with arithmetic about yeast.', b: 'Tomas folded his loaf plans into a very small square and said nothing about it, loudly.' },
      rail: { a: 'Rails arrived from the north on flatbed trucks. By autumn the first train had pulled in, nine minutes late, which everyone agreed was close enough.', b: '{town} stayed a road town. The trains went by inland, a faint sound on still nights.' },
      serpentMuseum: { a: 'The serpent museum opened with a plaster model of Wendell that children were not allowed to climb and climbed anyway.', b: 'The town asked the serpent to leave, through a letter read aloud at the end of the pier. The water was very still afterwards.' },
      loan: { a: 'The bank’s money arrived in a single afternoon. The repayments would arrive every month for ten years. Odile pinned the schedule above her desk.', b: 'The town tightened its belt. Streetlights went off an hour early and the parks went unmown, and people noticed both.' },
      union: { a: 'The staff got their raise. The cake that came with the thank-you letter was larger than the cake that came with the request.', b: 'The raise was refused. In the staff rooms of {town}, conversations stopped when the Mayor walked in.' },
      capsule: { a: 'The time capsule went into the ground under the square: drawings, a newspaper, a tin of Tomas’s biscuits and a sealed letter from Juniper marked DO NOT READ UNTIL YOU ARE SORRY.', b: 'The time capsule waited in a cupboard at the school, half full.' },
      gulls: { a: 'The falconer, a quiet woman named Ines, patrolled the boardwalk with a hawk called Bartholomew. The gulls withdrew to consider their options.', b: 'The town learned to coexist with the gulls, which mostly meant learning to eat indoors.' },
    };
    const line = consequences[c.key]?.[c.option];
    if (line && d) paras.push(fill(line, ctx));
  }

  // construction
  const b = record.built;
  const builtParts = [];
  if (b.road) builtParts.push(b.road > 20 ? 'miles of new road' : b.road > 6 ? 'several new streets' : 'a short new street');
  if (b.res) builtParts.push(b.res > 12 ? 'whole blocks zoned for homes' : 'land marked out for houses');
  if (b.com) builtParts.push(b.com > 8 ? 'a long run of shopfronts' : 'room for a few shops');
  if (b.ind) builtParts.push(b.ind > 8 ? 'an industrial district' : 'a few lots for workshops and sheds');
  if (b.park) builtParts.push(plural(b.park, 'park'));
  const services = ['power', 'water', 'school', 'clinic', 'fire', 'police', 'lighthouse', 'pier', 'college', 'stadium'].filter(k => b[k]);
  const serviceNames = { power: 'a power plant', water: 'a water tower', school: 'a school', clinic: 'a clinic', fire: 'a fire station', police: 'a watch house', lighthouse: 'a lighthouse', pier: 'a ferry pier', college: 'a college', stadium: 'a stadium' };
  const firsts = services.filter(k => state.flags[`first_${k}`] === record.year);
  if (builtParts.length || services.length) {
    let s = `That year the Mayor ${pick(rng, ['laid down', 'ordered', 'signed off on', 'paid for'])} ${listJoin([...builtParts, ...services.map(k => serviceNames[k])])}.`;
    if (firsts.length) {
      const firstLines = {
        power: 'When the first power plant hummed into life, people stood in the street to watch their own windows light up.',
        water: 'The first water tower went up on the rise; children dared each other to touch its legs.',
        school: 'The first school opened with forty desks and one bell, which the children rang until it was confiscated.',
        clinic: 'The clinic’s first patient was a fisherman with a hook in his thumb, who recommended it to everyone.',
        fire: 'The fire station got a red truck and a dog that nobody admitted to adopting.',
        police: 'The watch house opened with two constables and a lost-property box that filled up by Friday.',
        lighthouse: 'The lighthouse was lit for the first time on a foggy night. Its beam swept the bay once, twice, and on the third pass the whole town on the beach cheered as if it had done something clever.',
        pier: 'The first ferry tied up at the new pier with eleven passengers, two bicycles and a goat. The goat was the only one who had booked.',
        college: `The college opened with a library, a lecture hall and a motto in Latin that nobody could translate. Juniper Bell, ${juniperAge(record.year)}, was at the front of the queue on the first day.`,
        stadium: 'The stadium hosted its first home game in the autumn. The home side lost by four, and the town celebrated anyway, because it was the first game and they had never lost at home before.',
      };
      s += ' ' + firsts.map(k => firstLines[k]).join(' ');
    }
    if (b.doze) s += ` ${cap(plural(b.doze, 'building'))} came down to make room, and a few people never forgave the bulldozer.`;
    paras.push(s);
  } else if (pop > 0 && rng() < 0.55) {
    paras.push(fresh([
      'The Mayor built nothing new that year, which some called prudence and Mei Okafor called “a long nap.”',
      'No ribbons were cut in Year ' + record.year + '. The town grew into the clothes it already had.',
      'The bulldozers stayed in the yard all year. Grass grew around their wheels, and Odile approved of the savings.',
      'There was no construction to speak of that year. The town’s one crane was lent to a neighbouring town and came back with a dent and a story.',
      'The Mayor spent the year on paperwork instead of foundations. Odile said it was the most productive year she could remember, and meant it as a warning.',
      'City Hall commissioned nothing that year. The town filled in its own gaps: a porch here, a shed there, a flower box on every sill along ' + ctx.res + '.',
    ], 'nobuild'));
  }

  // events, in month order, at most four
  const eventLines = {
    fire: e => fresh([
      `In ${MONTHS[e.month]}, fire broke out ${e.district ? `in ${state.districtNames[e.district] || 'a crowded block'}` : 'in a row of houses'} with no fire station near enough to matter. ${e.size > 1 ? `${cap(numberWord(e.size))} buildings` : 'One building'} burned to the ground before the bucket line reached it.`,
      `The fire came in ${MONTHS[e.month]}, at night, as fires do. By morning there ${e.size > 1 ? `were ${numberWord(e.size)} blackened lots` : 'was one blackened lot'} and a lot of people asking where the fire station was.`,
    ], 'ev-fire'),
    fireSaved: e => fresh([`In ${MONTHS[e.month]} a kitchen fire on ${state.districtNames[state.district[e.tile]] || ctx.res} was out in eleven minutes. The fire crew posed for the Ledger with the dog, which got the caption.`, `The fire crew earned their pay in ${MONTHS[e.month]}: a chimney fire, out before the neighbours had finished their tea.`], 'firesaved'),
    blackout: e => fresh([
      `The lights went out in ${MONTHS[e.month]}. Demand had outrun the power plants${e.ratio === 0 ? ', of which there were none' : ''}, and for a week ${town} ate cold dinners by candlelight and blamed the Mayor by name.`,
      `${cap(MONTHS[e.month])} brought rolling blackouts. Tomas baked by lantern and claimed the bread was better for it. Nobody else claimed anything was better for it.`,
    ], 'ev-blackout'),
    drought: e => `By ${MONTHS[e.month]} the taps were coughing. The water towers could not keep up, and the Ledger printed instructions for a two-minute shower.`,
    storm: e => fresh([
      `A winter storm came off the bay in ${MONTHS[e.month]}, shouldering the waves up over the sand. ${e.hit ? 'The waterfront took the worst of it.' : 'There was little on the shore to break, which was the only consolation.'}`,
      `In ${MONTHS[e.month]} the wind came up so hard that the gulls flew backwards. The coast road closed for a day and reopened covered in kelp.`,
      `The storm in ${MONTHS[e.month]} stripped shingles and nerves. On the coast road, people said “last year’s was worse,” and were wrong.`,
    ], 'ev-storm'),
    crime: () => fresh([
      `Crime crept up. Bicycles vanished, then the locks for the bicycles. The Ledger started a column called WHO TOOK IT.`,
      `There was a run of break-ins in the crowded blocks, and doors that had never been locked learned how.`,
      `Someone stole the brass bell from the harbourmaster’s office. It was returned a week later, polished, with a note that said SORRY.`,
      `The constables, when there were any, spent the year chasing a gang of teenagers who painted murals of gulls on every blank wall. Several of the murals were good.`,
    ], 'ev-crime'),
    festival: () => fresh([
      `Midsummer brought a festival in the parks: paper lanterns, a brass band with two trumpets and a strong opinion about tempo, and Tomas selling out of almond buns by noon.`,
      `In June the town held a lantern festival. Somebody released a lantern too close to the water tower and the fire crew got to show off.`,
      `The summer fair took over the parks for a weekend: a pie contest, a sandcastle contest, and a contest for the best complaint about the other two.`,
    ], 'ev-festival'),
    traffic: () => `The roads were choked by autumn. A delivery van spent forty minutes on the main road and the driver wrote a poem about it that the Ledger printed.`,
    taxRevolt: () => `Taxes at ${record.tax}% provoked a march on City Hall. It was orderly, well-attended and carried a banner that said WE COUNT TOO, spelled correctly.`,
    boom: () => fresh([
      `Then came the boom. Cranes appeared over ${ctx.res}. Rents went up, then the buildings did.`,
      `Money came to ${town} that year in a rush. Every vacant lot had a sign on it, and every sign had a phone number.`,
    ], 'ev-boom'),
    serpent: e => (e.nth > 1 ? (l => l[1]) : (l => l[0]))([
      `In ${MONTHS[e.month]} something rose out of the bay: grey-green, long as a street, with an expression Mei Okafor described as “bored.” It flattened ${e.hit ? numberWord(e.hit) + ' waterfront buildings' : 'a fishing shed'} and sank again. By evening the children had named it Wendell.`,
      `Wendell came back in ${MONTHS[e.month]}. The serpent surfaced, looked at the town for a long minute, and took ${e.hit ? numberWord(e.hit) + ' buildings on the shore' : 'a bench'} with it when it left.`,
    ]),
    film: () => `The film crew came in April and blocked the coast road for three days to shoot a chase that will last eleven seconds on screen. Half the town appears as extras. The other half claims to.`,
    strike: () => `In the autumn the city staff walked out. The clinic ran on volunteers, the school on parents, and the Mayor on very little sleep.`,
  };
  const picked = [];
  const seen = new Set();
  for (const e of events.slice().sort((x, y) => x.month - y.month)) {
    const key = e.kind === 'blackout' || e.kind === 'drought' || e.kind === 'crime' || e.kind === 'traffic' || e.kind === 'boom' || e.kind === 'taxRevolt' ? e.kind : `${e.kind}-${e.month}`;
    if (seen.has(e.kind === 'fire' || e.kind === 'serpent' ? key : e.kind)) continue;
    seen.add(e.kind === 'fire' || e.kind === 'serpent' ? key : e.kind);
    picked.push(e);
  }
  const shown = picked.filter(e => e.kind === 'serpent' || e.kind === 'fire').concat(picked.filter(e => e.kind !== 'serpent' && e.kind !== 'fire')).slice(0, 4).sort((x, y) => x.month - y.month);
  for (const e of shown) paras.push(eventLines[e.kind](e));
  if (!shown.length && pop > 0) {
    paras.push(fill(fresh([
      'A whale passed the point in the spring and the whole town went down to the beach to watch it not do anything in particular.',
      'The year’s great controversy was the colour of the new benches. Green won, narrowly, after a recount.',
      'Nothing much happened that year, which in a town is its own kind of event. The hedges grew. People learned which neighbours waved back.',
      'It was a quiet year. The Ledger’s biggest story was a lost tortoise found two streets from home, “looking pleased with itself.”',
      'The year passed without fire, flood or serpent. Odile wrote QUIET at the top of the ledger page and then, because she was honest, “mostly.”',
    ], 'quiet'), ctx));
  }

  // characters
  const beats = [];
  const age = juniperAge(record.year);
  const edu = (record.stats.count?.school || 0) + (state.flags.library ? 1 : 0) + (record.stats.count?.college ? 2 : 0);
  if (age <= 17) {
    beats.push(fresh(age < 13 ? [
      `Juniper Bell, ${age}, was caught measuring the width of ${ctx.res} with a ball of string. Asked why, she said, “Somebody has to.”`,
      `Juniper Bell turned ${age} and asked for a drafting compass. Her mother gave her a scarf. She used the scarf as a compass.`,
      `Juniper, now ${age}, wrote to the Mayor about the placement of crossings. The letter included a map, a legend, and a sentence beginning “With respect.”`,
      `Juniper Bell, ${age}, built a model of ${town} out of sugar cubes on her kitchen table. The ants found it before the Mayor did.`,
      `At ${age}, Juniper started a newspaper of her own, one copy a week, pinned to the school door. Its first headline was CROSSINGS: A SCANDAL.`,
    ] : [
      `At ${age}, Juniper Bell had moved on from maps to arguments. She attended every council meeting and sat in the front row taking notes in two colours.`,
      `Juniper, ${age}, won the school science prize with a model of ${town} that showed where the floods would go. The judges asked her not to show it to the Mayor; she did.`,
      `Juniper Bell, ${age}, got her first job, sweeping the planning office, and read every file in it before she was asked to stop.`,
      `At ${age}, Juniper argued with Augustin Wexley in the post office queue about building heights. Witnesses agreed she won on points.`,
    ], age < 13 ? 'jun-young' : 'jun-teen'));
  } else if (age === 18) {
    beats.push(edu >= 2
      ? `Juniper Bell turned eighteen and, to everyone’s surprise including her own, stayed. “There’s a school here now,” she told Mei Okafor. “And somebody has to fix the crossings.”`
      : `Juniper Bell turned eighteen and left on the morning bus for a city with a university. She waved from the back window at the town she had spent nine years correcting.`);
    state.flags.juniperStayed = edu >= 2;
  } else if (state.flags.juniperStayed) {
    beats.push(fresh([
      `Juniper Bell, ${age}, chaired the new traffic committee. Its first meeting ran four hours and produced one crossing, in the right place.`,
      `Juniper Bell, ${age}, now worked in the planning office, where she redrew the Mayor’s plans in pencil and left them on the desk without comment.`,
      `Juniper had become the town’s youngest engineer. Her first bridge did not fall down, and she said so often.`,
    ], 'jun-adult'));
  } else if (age === 24 && pop > 1500) {
    beats.push('A letter came from Juniper Bell, now an architect in the capital. “I hear you’ve finally got enough people for a real crossing,” it said. “I might come and look.”');
    state.flags.juniperReturns = true;
  }

  const comJobs = record.stats.jobsC;
  state.story.tomas ||= 0;
  if ((record.stats.count?.com || 0) > 0) {
    let line = null;
    if (record.tax >= 10) line = fresh([
      `Tomas Ferreira raised the price of a loaf by a coin and taped a note to the till: ASK THE MAYOR.`,
      `Tomas complained about taxes to anyone buying bread, which was everyone.`,
      `Tomas Ferreira began printing the tax rate on his paper bags, next to the word “regrettably.”`,
    ], 'tomas-tax');
    else if (state.story.tomas < 1 && comJobs > 60) { state.story.tomas = 1; line = `Tomas Ferreira hired his first apprentice, a serious boy named Cal who measured flour like it owed him money.`; }
    else if (state.story.tomas < 2 && comJobs > 220) { state.story.tomas = 2; line = `Tomas Ferreira opened a second bakery on ${ctx.com}. He kept the first one too, out of sentiment and because it had the good oven.`; }
    else if (state.story.tomas < 3 && comJobs > 500) { state.story.tomas = 3; line = `Tomas opened a café with tablecloths. People sat at the tablecloths and ordered the same bread they had always ordered, which pleased him more than he let on.`; }
    else if (state.flags.gulls === 'falcon' && !state.story.romance && record.year >= 4) { state.story.romance = record.year; line = `Tomas Ferreira was seen walking the boardwalk with Ines the falconer. Bartholomew the hawk rode on her glove and looked at the bread bag the way the rest of the town looked at the couple.`; }
    else if (state.story.romance && record.year === state.story.romance + 2) line = `Tomas Ferreira married Ines the falconer on the pier. The gulls stayed away from the reception, out of respect or fear.`;
    else if (rng() < 0.7) line = fresh([
      `Tomas Ferreira entered his rye in the county fair and came second to a woman who, he maintained, had used a machine.`,
      `A food critic from the capital called Tomas’s sourdough “honest.” Tomas did not know whether to frame the review or burn it, and did both, in that order.`,
      `Tomas started opening at five instead of six. The fishermen noticed first, then the insomniacs, then everyone.`,
      `The bakery oven broke in midwinter. Half the town turned up with tools and the other half with opinions, and by evening it was fixed.`,
      `Tomas Ferreira began leaving yesterday’s bread on a shelf by the door with a sign: TAKE IT. People did, and some of them left coins anyway.`,
      `Tomas Ferreira’s bakery on ${ctx.com} had a queue by seven every morning. He considered this a review.`,
      `Tomas tried a seaweed loaf. It was not a success. He served it anyway, with confidence, until it was.`,
      `Tomas Ferreira took one day off that year, spent it fishing and caught nothing, and declared it the best day of his life.`,
      `Tomas kept a bread named after the Mayor on the shelf. It was sold at a discount when approval was low and nobody missed the joke.`,
      `Tomas taught a baking class at the school. Forty children went home with flour in places flour should not be.`,
    ], 'tomas');
    if (line) beats.push(line);
  }

  if (record.funds < 1000) beats.push(fresh([
    `Odile Marsh closed the year’s ledger and sat with it for a while. “We are not broke,” she told the Mayor. “We are approaching broke from an interesting angle.”`,
    `The treasury held ${ctx.funds}. Odile began reusing envelopes, then paperclips, then sighs.`,
    `Odile Marsh brought her own lightbulb to work. She did not explain, and nobody asked.`,
  ], 'odile-poor'));
  else if (record.funds > 15000) beats.push(`The treasury held ${ctx.funds}. Odile Marsh, who distrusted large numbers, recounted them twice.`);
  else if (rng() < 0.5) beats.push(fresh([
    `Odile Marsh added another column to the ledger. She did this every year, and every year the Mayor pretended not to notice.`,
    `Odile kept the ledger as she always had: in ink, in silence, with a small mark beside every promise that had not yet been kept.`,
    `Odile Marsh took her annual holiday: one afternoon on a bench facing City Hall, to see how it looked from outside.`,
    `Someone left a potted fern on Odile’s desk. She watered it with the precision of a woman balancing accounts.`,
  ], 'odile'));
  if (record.year === 12) beats.push('Odile Marsh retired at the end of Year 12. She handed the Mayor the ledger, now eleven volumes thick, and said, “Try to make the next one shorter.”');
  if (state.flags.capsule && record.year === state.flags.capsule + 10) beats.push('The time capsule came out of the ground under the square. Juniper’s letter, marked DO NOT READ UNTIL YOU ARE SORRY, was read aloud. It said: “You should have built the crossing on Fourth.” Everyone agreed that it was correct.');
  if (state.flags.casino && rng() < 0.5) beats.push(fresh([
    `Wexley’s pier was busy every night. Its lights could be seen from the next town, which the next town mentioned in a letter.`,
    `A man lost his boat at Wexley’s card tables and won it back the same night. He sold it the next morning, wisely.`,
  ], 'pier'));
  if (state.flags.museum && rng() < 0.5) beats.push(fresh([
    `The serpent museum sold out of Wendell plush toys in a week. Mei Okafor won a regional press prize for her serpent coverage.`,
    `A professor came from the capital to study Wendell. She stayed a month, saw nothing, and left happy.`,
  ], 'museum'));
  if ((record.stats.count?.ind || 0) >= 3 && rng() < 0.45) beats.push(fresh([
    `Wexley bought a boat he could not sail and kept it in the harbour where everyone could see it not moving.`,
    `Augustin Wexley sponsored the town’s youth football team. Their shirts said WEXLEY on the front and, in smaller letters, OPPORTUNITY on the back.`,
    `Wexley proposed a forty-storey tower on ${ctx.ind}. The council laughed, which he took as the start of a negotiation.`,
    `Augustin Wexley bought three lots near ${ctx.ind} and painted the fence a colour he called “opportunity.”`,
    `Wexley was seen at every ribbon-cutting, standing slightly to the left of the Mayor in every photograph.`,
    `Augustin Wexley gave a speech at the Rotary lunch about “the {town} of tomorrow.” It lasted until the {town} of the afternoon.`,
  ].map(t => fill(t, ctx)), 'wexley'));
  for (const beat of beats.slice(0, 3)) paras.push(beat);

  // the city itself: standing conditions get a line at most every other year
  const lastSaid = (state.story.said ||= {});
  const sayEveryOther = (key, cond, lines) => {
    if (!cond || lastSaid[key] === record.year - 1) return;
    lastSaid[key] = record.year;
    paras.push(fill(fresh(lines, key), ctx));
  };
  sayEveryOther('smoke', record.stats.pollution > 4, [
    'The air over {res} had a taste now. Washing hung out to dry came back a shade darker, and people moved away from the chimneys when they could.',
    'On still days a brown haze sat over {ind}. The clinic started keeping a jar of cough sweets on the counter.',
    'Children on {res} drew the sky grey in their pictures. Their teachers did not correct them.',
  ]);
  sayEveryOther('parks', record.stats.pollution <= 4 && (record.stats.count?.park || 0) >= 3 && pop > 200, [
    'The parks had grown into themselves. On Sundays you could hear three different picnics arguing about the same football.',
    'There were enough trees now that the gulls had competition.',
    'Someone planted tulips in the park without permission. The Mayor issued a permit retroactively.',
  ]);
  if (lastSaid.jobs !== record.year - 1 && record.stats.unemployment > 0.25 && pop > 150 && (lastSaid.jobs = record.year)) paras.push(fresh([
    'There were not enough jobs. Men and women stood outside the shops at ten in the morning, which in a small town is a kind of announcement.',
    'Work was scarce. The Ledger’s job listings shrank to a single column, and then to a single box.',
    'Too many people and too few jobs: the benches by the harbour were full on weekday afternoons, and nobody was fishing.',
  ], 'unemployed'));

  // election
  if (record.election) {
    paras.push(record.won
      ? pick(rng, [
        `Then came the election. The Mayor won with ${Math.round(record.approval)}% approval. Wexley sent flowers. Mei Okafor printed the result above the fold and the tortoise below it.`,
        `In November the town voted. With approval at ${Math.round(record.approval)}%, the Mayor kept the job and the borrowed desk.`,
        `The election was closer than the Ledger had predicted and further than the Mayor had feared: ${Math.round(record.approval)}% approval, another four years.`,
        `On election night the count ran past midnight. At ${Math.round(record.approval)}%, the Mayor won, and Odile Marsh, who never voted in public, was seen smiling at a filing cabinet.`,
        `The Mayor was returned to office with ${Math.round(record.approval)}% approval. The victory party was held at the bakery, where Tomas charged full price.`,
      ])
      : `Then came the election. With approval at ${Math.round(record.approval)}%, the result was never in doubt. The Mayor lost.`);
  }

  // closing and cliffhanger
  const pend = state.pending && DILEMMAS[state.pending];
  if (!state.over) {
    paras.push(fill(fresh(record.approval > 65 ? [
      'On the last night of Year {year}, the Mayor walked the length of the main road and was greeted by name eleven times.',
      'The year ended well. People complained about small things, which is how you know the big ones are going right.',
      'At the New Year’s dance, the band played a song somebody had written about the town. It was not good, and everyone knew the words.',
    ] : record.approval < 40 ? [
      'On the last night of Year {year}, someone threw an egg at City Hall. It missed, which Odile considered the most competent thing to happen all year.',
      'The year ended in grumbling. The Mayor read the letters page with the curtains drawn.',
      'Somebody chalked RESIGN on the steps of City Hall. The rain washed it off by morning, mostly.',
    ] : [
      'The year ended the way most years end in {town}: with fog in the morning, a few new streetlights, and the feeling that next year would decide something.',
      'Year {year} closed with the bay grey and the ledger balanced, more or less.',
      'Snow fell on {town} once that winter, for twenty minutes, and every child in town remembered it for the rest of their lives.',
      'On New Year’s Eve the fishing boats sounded their horns at midnight, one after another, down the whole length of the harbour.',
      'The last week of the year was spent, as always, arguing about the new year’s budget and eating the old year’s leftovers.',
      'The year ended without ceremony. The Mayor locked City Hall, walked to the end of the pier, and watched the lights of {town} come on one by one.',
      'On the last night of the year the fog came in early and stayed late, as if it too wanted to see what happened next.',
      'The year ran out quietly, like a tide. The Mayor turned off the office lamp at midnight and left the ledger open.',
    ], record.approval > 65 ? 'close-good' : record.approval < 40 ? 'close-bad' : 'close-mid'), ctx));
    if (pend) paras.push(`Then, on the first morning of the new year, came ${pick(rng, ['a letter', 'a knock at the door', 'a visitor with an umbrella', 'a phone call'])}: ${pend.text}`);
  }

  const headline = pickHeadline(rng, record, town, ctx);
  const title = `Chapter ${record.year}: ${pickTitle(rng, record, shown, ctx)}`;
  return { n: record.year, year: record.year, title, headline, paras, dilemma: state.over ? null : state.pending, snap: record.snap, stats: { pop: record.pop, approval: Math.round(record.approval), funds: record.funds } };
}

function pickTitle(rng, record, shown, ctx) {
  if (record.election) return record.won ? 'The Vote' : 'The Vote, and After';
  const k = shown.map(e => e.kind);
  if (k.includes('serpent')) return pick(rng, ['Something in the Bay', 'Wendell', 'Long as a Street']);
  if (k.includes('fire')) return pick(rng, [`Smoke Over ${ctx.res}`, 'The Bucket Line', 'Ash']);
  const lm = ['stadium', 'college', 'pier', 'lighthouse'].find(x => record.built[x]);
  if (lm) return { stadium: 'Home Game', college: 'The Motto', pier: 'A Goat on the Ferry', lighthouse: 'The Beam' }[lm];
  if (k.includes('blackout')) return pick(rng, ['The Dark Weeks', 'Candles', 'Cold Dinners']);
  if (k.includes('boom')) return pick(rng, ['Cranes', 'Signs on Every Lot', 'Rush']);
  if (k.includes('festival')) return pick(rng, ['Paper Lanterns', 'Almond Buns', 'Midsummer']);
  if (k.includes('storm')) return pick(rng, ['Weather', 'High Water', 'The Coast Road']);
  if (k.includes('film')) return 'Extras';
  if (k.includes('strike')) return 'Empty Staff Rooms';
  if (record.pop - record.prev.pop < -10) return pick(rng, ['Moving Vans', 'The Dark Windows']);
  if (record.pop === 0) return pick(rng, ['Survey Stakes', 'Grass and Plans']);
  if (record.prev.pop === 0) return pick(rng, ['First Families', 'Arrivals', 'Furniture on the Roof']);
  return pick(rng, ['An Ordinary Year', 'Fog in the Morning', 'New Streetlights', 'The Long Middle', 'Paint Still Wet', 'Small Things']);
}

function pickHeadline(rng, record, town, ctx) {
  const k = record.log.map(e => e.kind);
  if (record.election) return record.won ? `MAYOR RE-ELECTED; WEXLEY “DELIGHTED”` : `MAYOR OUT; ${town.toUpperCase()} TURNS THE PAGE`;
  if (k.includes('serpent')) return 'SERPENT SIGHTED; NAMED BY CHILDREN BEFORE TEA';
  const lm = ['stadium', 'college', 'pier', 'lighthouse'].find(x => record.built[x]);
  if (lm) return { stadium: 'STADIUM OPENS; HOME SIDE LOSES; NOBODY MINDS', college: `${town.toUpperCase()} GETS A COLLEGE; MOTTO UNTRANSLATED`, pier: 'FERRY ARRIVES WITH GOAT', lighthouse: 'LIGHTHOUSE LIT; HARBOUR FOUND “WITHOUT SMELLING”' }[lm];
  if (k.includes('fire')) return `FIRE TAKES HOMES; “WHERE WAS THE STATION?” ASK NEIGHBOURS`;
  if (k.includes('blackout')) return 'LIGHTS OUT AGAIN; CANDLE SALES AT RECORD';
  if (k.includes('boom')) return `BOOM TIMES: CRANES OVER ${ctx.res.toUpperCase()}`;
  if (k.includes('festival')) return 'LANTERN FESTIVAL “BEST YET”; ONE LANTERN “TOO CLOSE”';
  if (k.includes('taxRevolt')) return `MARCH ON CITY HALL OVER ${record.tax}% TAX`;
  if (record.pop > record.prev.pop) return `POPULATION NOW ${n(record.pop)}; PARKING “A DISGRACE”`;
  if (record.pop < record.prev.pop) return `${town.toUpperCase()} SHRINKS TO ${n(record.pop)}`;
  return `${town.toUpperCase()} HOLDS STEADY; TORTOISE FOUND`;
}

// ---------- epilogue ----------
export function epilogue(state) {
  const rng = rngFrom(state.seed + 4242);
  const town = state.name;
  const last = state.history[state.history.length - 1] || { pop: 0 };
  const why = state.over === 'bankrupt'
    ? `The treasury ran dry. In the spring of Year ${state.year + 1}, the regional authority sent a man in a grey suit to run ${town} from a folding table, and the Mayor handed over the keys and the borrowed desk.`
    : `The Mayor cleared the desk on a Friday. There was not much: a box of survey stakes, never used, and a drawing of ${town} in a child’s hand, signed J.B.`;
  const paras = [
    why,
    `${town} had ${n(last.pop)} people when the Mayor left. Some of the streets were good streets. Some of the decisions were good decisions. Odile Marsh, who had seen everything, wrote one last line in the ledger and underlined it.`,
    state.flags.juniperStayed
      ? 'A year later, Juniper Bell ran for mayor. Her campaign posters had a map on them, with the crossings in the right places.'
      : pick(rng, ['The gulls stayed. The gulls always stay.', 'The sea kept the edge where it had always been. The town kept the rest.']),
    'The End. (Or, if you like, start the book again.)',
  ];
  return { n: state.year + 1, year: state.year + 1, title: 'Epilogue', headline: state.over === 'bankrupt' ? `${town.toUpperCase()} PLACED IN RECEIVERSHIP` : `NEW MAYOR SWORN IN`, paras, dilemma: null };
}

export function novelMarkdown(state) {
  const parts = [`# ${state.name}: A City in Chapters`, '', `*A novel written by a city, Years 1–${state.history.length}.*`, ''];
  for (const ch of state.chapters) {
    parts.push(`## ${ch.title}`, '', `> ${ch.headline} — *The ${state.name} Ledger*`, '');
    for (const p of ch.paras) parts.push(p, '');
  }
  return parts.join('\n');
}

function listJoin(items) {
  if (items.length <= 1) return items[0] || '';
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export { TOOLS };
