#!/usr/bin/env node
// Coast Commons: writes the static pages under public/coast-commons/ and the JSON twin
// public/coast-commons.json from scripts/coast-commons/data.mjs.
//   node scripts/coast-commons/build.mjs          write the files
//   node scripts/coast-commons/build.mjs --check  exit 1 if the committed files are stale
// Pages are plain HTML with one shared stylesheet, inline SVG and small inline scripts.
// They load nothing from outside pointcast.xyz.
// Pages with an unfurl card (scripts/unfurl-cards/cards.mjs) take their share tags from there.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { studiesIndex } from '../coast-commons-studies/build.mjs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEFT_OUT, ORIGIN, SRC, STAY, TOWNS, VERIFIED, miles, rulesFor } from './data.mjs';
import { shareHead } from '../unfurl-cards/cards.mjs';
import { pageIndex, seoFor, townSeo } from '../unfurl-cards/seo.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const check = process.argv.includes('--check');
const BASE = 'https://pointcast.xyz';
const DATE_WORDS = 'November 11, 2026';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const towns = TOWNS.map((t) => ({ ...t, miles: miles(t.lat, t.lon), r: rulesFor(t) }));
const flagship = towns.find((t) => t.flagship);

const srcLinks = (keys) => keys.map((k) => {
  const s = SRC[k];
  const tag = s.kind === 'copy' ? ' <i>(copy, not the adopted code)</i>' : '';
  return `<a class="src" href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a>${tag}`;
}).join('');
const fact = (f) => `<p${f.verified ? '' : ' class="nv"'}>${esc(f.text)}</p>${f.src.length ? `<p class="srcs">Source${f.src.length > 1 ? 's' : ''}, read ${VERIFIED}: ${srcLinks(f.src)}</p>` : ''}`;

const NOTICE = `<aside class="plain" aria-label="What this is">
<h2>Plainly</h2>
<ul>
<li>This is a study and a public resource. It is not an offer.</li>
<li>Nothing is being bought or sold. No money is being raised. There are no listings here.</li>
<li>It is not legal, tax or investment advice.</li>
<li>Tradable shares in property are likely securities. Anyone going near that needs a securities lawyer first.</li>
<li>Rules change. Each rule here was read on ${DATE_WORDS}; open the linked page and call the planning counter before acting on any of it.</li>
</ul>
</aside>`;

const head = (title, given, path, extra = '') => { const desc = seoFor(path)?.description ?? given; return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${BASE}${path}">
<link rel="icon" href="/favicon.svg">
<link rel="alternate" type="application/json" href="/coast-commons.json">
<link rel="stylesheet" href="/coast-commons/cc.css">
${shareHead(path, title, desc) ?? `<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">`}
<meta name="author" content="Claude">
${extra}</head>
<body>
<a class="skip" href="#main">Skip to the page</a>
<nav class="top" aria-label="Coast Commons">
<a href="/coast-commons/"><b>Coast Commons</b></a>
<a href="/coast-commons/el-segundo/">The El Segundo house</a>
<a href="/coast-commons/pattern/">The pattern</a>
<a href="/coast-commons.json">JSON</a>
</nav>
<main id="main">
`; };
const foot = () => `</main>
<footer>
<p>Coast Commons is a public resource on <a href="/">PointCast</a>, written by Claude at Mike Hoydich's request. Free for anyone to use. Licence for the words and drawings: <a href="/coast-commons/LICENSE.txt">CC BY 4.0</a>. A study, not an offer.</p>
<p>Rules read ${DATE_WORDS}. Found something out of date? The page data lives in <code>scripts/coast-commons/data.mjs</code> in the PointCast repository.</p>
</footer>
</body>
</html>
`;

// ---- the coast strip ----
function strip() {
  const top = 70, gap = 62, H = top + gap * (towns.length - 1) + 70, W = 360;
  const x = (i) => 150 + Math.round(34 * Math.sin(i * 0.9) + (i > 9 ? (i - 9) * 9 : 0));
  const pts = towns.map((t, i) => [x(i), top + i * gap]);
  let shore = `M${pts[0][0]} 0 L${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i];
    shore += ` C${px} ${py + 26} ${cx} ${cy - 26} ${cx} ${cy}`;
  }
  const last = pts[pts.length - 1];
  shore += ` L${last[0]} ${H}`;
  const land = `${shore} L${W} ${H} L${W} 0 Z`;
  const waves = Array.from({ length: Math.floor(H / 44) }, (_, k) => {
    const y = 30 + k * 44, sx = 14 + (k % 3) * 16;
    return `<path d="M${sx} ${y} q9 -7 18 0 t18 0 t18 0" />`;
  }).join('');
  const kelp = [3, 7, 11, 14].map((i) => `<path d="M${pts[i][0] - 46} ${pts[i][1] + 26} q-7 -9 0 -18 q7 -9 0 -18" />`).join('');
  const stops = towns.map((t, i) => {
    const [cx, cy] = pts[i];
    const big = t.flagship;
    const house = big ? `<path class="hs" d="M${cx - 13} ${cy + 4} v-12 l13 -11 l13 11 v12 z M${cx - 4} ${cy + 4} v-8 h8 v8" />` : `<circle class="dot" cx="${cx}" cy="${cy}" r="8" />`;
    return `<a class="stop${big ? ' flag' : ''}" href="/coast-commons/${t.slug}/" data-miles="${t.miles}" data-stay="${t.r.stay}">
<title>${esc(t.name)}, ${t.miles} miles</title>
${house}
<text class="nm" x="${cx + 22}" y="${cy - 1}">${esc(t.name)}</text>
<text class="mi" x="${cx + 22}" y="${cy + 15}">${big ? 'start here' : `${t.miles} mi`} · ${esc(STAY[t.r.stay].label)}</text>
</a>`;
  }).join('\n');
  return `<svg class="strip" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="strip-t strip-d">
<title id="strip-t">The coast within about 25 miles of El Segundo, north at the top</title>
<desc id="strip-d">A drawn strip of shoreline with ${towns.length} stops from Malibu to Seal Beach. Each stop links to that town's page. The same towns are listed as text below.</desc>
<rect class="sea" width="${W}" height="${H}" />
<g class="wv">${waves}</g>
<path class="land" d="${land}" />
<path class="shore" d="${shore}" />
<g class="kelp">${kelp}</g>
<g class="compass" transform="translate(40 ${H - 46})"><circle r="17" /><path d="M0 -12 L5 4 L0 0 L-5 4 Z" /><text y="-21" text-anchor="middle">N</text></g>
<text class="lbl" x="18" y="24">Pacific</text>
<text class="lbl" x="${W - 12}" y="24" text-anchor="end">north</text>
<text class="lbl" x="${W - 12}" y="${H - 12}" text-anchor="end">south</text>
${stops}
</svg>`;
}

// ---- hub ----
const STUDIES = studiesIndex();

function hub() {
  const stays = [...new Set(towns.map((t) => t.r.stay))];
  const list = towns.map((t) => `<li data-miles="${t.miles}" data-stay="${t.r.stay}"><a href="/coast-commons/${t.slug}/"><b>${esc(t.name)}</b></a> <span class="mi">${t.flagship ? 'home' : `${t.miles} mi`}</span><br><span class="st st-${t.r.stay}">${esc(STAY[t.r.stay].label)}</span> <span class="by">${esc(t.r.body)}</span></li>`).join('\n');
  const out = LEFT_OUT.map((o) => `<li><b>${esc(o.name)}.</b> ${esc(o.why)}</li>`).join('\n');
  return head('Coast Commons: shared houses for the beach towns near El Segundo', 'A free, open study of community-run shared houses and clubhouses for fifteen beach towns within about 25 miles of El Segundo, with each town\'s official rules pages. Not an offer.', '/coast-commons/') + `<header class="hero">
<p class="kick">A public good · open study · started ${DATE_WORDS}</p>
<h1>Coast Commons</h1>
<p class="lede">What if a beach town kept one house, shed or boat in common? Ten neighbors, open books, a share set aside for everyone else. This is the homework for ${towns.length} towns within about 25 miles of El Segundo: what the place is like, what a commons could be there, and what each city actually allows.</p>
<p class="note"><b>A study and a public resource, not an offer.</b> Nothing is for sale, no money is being raised, and none of this is legal advice. <a href="/coast-commons/pattern/#plainly">Read the plain box</a>.</p>
</header>

<section class="flagcard" aria-labelledby="flag-h">
<h2 id="flag-h">Start at home: the El Segundo house</h2>
<p>El Segundo is the flagship. The city only permits hosted rooms, so the first step there is not the usual rented weekend. The page works out what it could be instead.</p>
<p><a class="btn" href="/coast-commons/el-segundo/">Open the El Segundo study</a> <a class="btn alt" href="/coast-commons/pattern/">Read the pattern</a></p>
</section>

<section aria-labelledby="studies-h">
<h2 id="studies-h">Two longer studies</h2>
<p>The same idea followed all the way through, twice. Each is a study and a public resource, not an offer, with every source linked beside the claim and what could not be verified marked where it matters.</p>
<ul class="finds">
${STUDIES.list.map((x) => `<li><a href="/coast-commons/${x.slug}/"><b>${esc(x.title)}</b></a>. ${esc(x.summary)}</li>`).join('\n')}
</ul>
</section>

<section aria-labelledby="map-h">
<h2 id="map-h">The coast, stop by stop</h2>
<p>North is up. Tap a stop. The line under each name is a plain reading of whether a group could lawfully book a whole house there for a weekend.</p>
<form class="tool" id="filter" aria-label="Filter the towns">
<label for="reach">Within <output id="reach-o">25</output> miles of El Segundo</label>
<input id="reach" type="range" min="3" max="25" step="1" value="25">
<label for="stay">Short-stay rule</label>
<select id="stay"><option value="">Any</option>${stays.map((s) => `<option value="${s}">${esc(STAY[s].label)}</option>`).join('')}</select>
<p class="count" id="count" aria-live="polite">${towns.length} towns shown.</p>
</form>
${strip()}
</section>

<section aria-labelledby="list-h">
<h2 id="list-h">The same towns as a list</h2>
<ol class="towns" id="towns">
${list}
</ol>
</section>

<section aria-labelledby="how-h">
<h2 id="how-h">How the circle was drawn</h2>
<p>Distance is a straight line over the earth's surface (great-circle, haversine) from ${esc(ORIGIN.name)} to one reference point in each town, usually its pier or main beach. The reference points are approximate coordinates chosen by Claude. It is not driving distance, which is longer everywhere on this coast.</p>
<h3>Checked and left out</h3>
<ul class="out">
${out}
</ul>
</section>

<section aria-labelledby="read-h">
<h2 id="read-h">What the reading turned up</h2>
<ul class="finds">
<li><b>The rented weekend is not available everywhere.</b> Several towns bar short stays in homes or allow only a resident host renting rooms. In those towns the first step has to be a campsite, a day room, a month-long lease or a clubhouse with no beds.</li>
<li><b>Backyard units are not a way around it.</b> Every city page that addressed the question said an ADU cannot be a short-term rental.</li>
<li><b>The coast has two permit desks.</b> Some cities issue their own coastal permits. In others the Coastal Commission still does. Each town page says which, where that was confirmed. <a class="src" href="${SRC.ccc.url}" rel="noopener">${esc(SRC.ccc.label)}</a></li>
</ul>
</section>
<script>
(function(){
  var reach=document.getElementById('reach'),stay=document.getElementById('stay'),out=document.getElementById('reach-o'),count=document.getElementById('count');
  if(!reach||!stay)return;
  function run(){
    var m=Number(reach.value),s=stay.value,n=0;
    out.textContent=m;
    var items=document.querySelectorAll('#towns li, .strip .stop');
    for(var i=0;i<items.length;i++){
      var el=items[i],ok=Number(el.getAttribute('data-miles'))<=m&&(!s||el.getAttribute('data-stay')===s);
      el.classList.toggle('off',!ok);
      if(ok&&el.tagName==='LI')n++;
    }
    count.textContent=n+(n===1?' town shown.':' towns shown.');
  }
  reach.addEventListener('input',run);stay.addEventListener('change',run);run();
})();
</script>
` + foot();
}

// ---- town pages ----
const ruleRows = (t) => [['Short stays', t.r.str], ['Backyard units (ADUs)', t.r.adu], ['Coastal permits', t.r.coastal], ['Zoning', t.r.zoning]]
  .map(([k, f]) => `<div class="rule"><h3>${k}</h3>${fact(f)}</div>`).join('\n');

const QUESTIONS = ['Is this address inside the Coastal Zone, and who issues the coastal permit here?', 'What is this parcel zoned, and is a club, meeting room or lodging use allowed in that zone?', 'Is a stay under 30 days lawful at this address, and under which permit?', 'What does the city count as an event or a gathering, and when does it need its own permit?', 'Which business license and occupancy tax apply, and who has to hold them?'];
const askBox = () => `<section aria-labelledby="ask-h"><h2 id="ask-h">Five questions for the planning counter</h2>
<ol class="ask">${QUESTIONS.map((q) => `<li>${q}</li>`).join('')}</ol>
<p><button class="btn" type="button" id="copy-q">Copy the questions</button> <span id="copy-s" role="status"></span></p>
<script>
(function(){var b=document.getElementById('copy-q'),s=document.getElementById('copy-s');if(!b)return;
b.addEventListener('click',function(){var t=[].map.call(document.querySelectorAll('.ask li'),function(li,i){return (i+1)+'. '+li.textContent}).join('\\n');
function done(ok){s.textContent=ok?'Copied.':'Select the list and copy it by hand.'}
try{navigator.clipboard.writeText(t).then(function(){done(true)},function(){done(false)})}catch(e){done(false)}});})();
</script></section>`;

const neighbors = (t) => {
  const i = towns.indexOf(t), n = towns[i - 1], s = towns[i + 1];
  return `<nav class="hop" aria-label="Neighboring towns">${n ? `<a href="/coast-commons/${n.slug}/">North: ${esc(n.name)}</a>` : '<span></span>'}<a href="/coast-commons/">The coast</a>${s ? `<a href="/coast-commons/${s.slug}/">South: ${esc(s.name)}</a>` : '<span></span>'}</nav>`;
};

const notVerified = (t) => {
  const rows = [['Beach character', t.character.filter((c) => !c.verified)], ['Short stays', [t.r.str]], ['Backyard units', [t.r.adu]], ['Coastal permits', [t.r.coastal]], ['Zoning', [t.r.zoning]]]
    .filter(([, fs]) => fs.some((f) => !f.verified)).map(([k]) => k);
  return rows;
};

function townPage(t) {
  const nv = notVerified(t);
  return head(`${t.name}: Coast Commons`, townSeo(t).description, `/coast-commons/${t.slug}/`) + `<header class="hero town">
<p class="kick">${t.miles} miles from El Segundo · measured to ${esc(t.ref)}</p>
<h1>${esc(t.name)}</h1>
<p class="gov">Governing body: <b>${esc(t.r.body)}</b></p>
<p class="stay st-${t.r.stay}"><b>${esc(STAY[t.r.stay].label)}.</b> ${esc(STAY[t.r.stay].note)}</p>
</header>
<section aria-labelledby="ch-h"><h2 id="ch-h">The water and the sand</h2>
${t.character.map(fact).join('\n')}
${t.edge ? `<p class="edge">${esc(t.edge)}</p>` : ''}
</section>
<section class="idea" aria-labelledby="id-h"><h2 id="id-h">What a commons could be here</h2>
<p class="tag">A sketch by Claude, not a plan and not a listing.</p>
<p>${esc(t.house)}</p>
<p><a href="/coast-commons/pattern/">The recipe is on the pattern page.</a></p>
</section>
<section aria-labelledby="ru-h"><h2 id="ru-h">The rules, with the city's own pages</h2>
${ruleRows(t)}
</section>
<section class="dated" aria-labelledby="vd-h"><h2 id="vd-h">What was checked, and when</h2>
<p>Every linked page above was opened and read on <time datetime="${VERIFIED}">${DATE_WORDS}</time>. The sentences are short paraphrases, not the rule itself.</p>
${nv.length ? `<p><b>Not verified for ${esc(t.name)}:</b> ${nv.map(esc).join(', ').toLowerCase()}. Those entries say so and carry no link.</p>` : '<p>Nothing on this page is marked not verified.</p>'}
</section>
${askBox()}
${neighbors(t)}
<p class="note small"><b>A study, not an offer.</b> Nothing is for sale and no money is being raised. Not legal advice. <a href="/coast-commons/pattern/#plainly">The plain box</a>.</p>
` + foot();
}

// ---- the flagship ----
const LADDER = [
  ['A table', 'Ten people who live or work in town sit down once. No money. Each says what they would use a shared place for and what they would give to it.'],
  ['A lawful first weekend', 'The city permits hosted rooms only, so the first weekend is not a rented house. Three ways to do it within the rules as read: a month-long lease used on weekends, campsites and a fire ring at Dockweiler next door, or a hosted stay in a member\'s permitted home for a few at a time. Costs are split in the open.'],
  ['House rules and a book', 'Write one page of rules and keep one ledger that every member can read. Use the templates on the pattern page.'],
  ['A season', 'Repeat monthly for three months. Count who came, what it cost, what broke, and what the neighbors said. Run the first public-good morning.'],
  ['A room, not a house', 'If it holds, look for a standing day room or a garage bay on a plain lease: boards, tools, a table. Still no beds, no purchase.'],
  ['The questions for a lawyer', 'Only after a year of this does a longer lease or any form of ownership come up, and that starts with a lawyer, the planning counter, and the plain box on the pattern page.'],
];
function flagshipPage() {
  const t = flagship;
  const chairs = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2 - Math.PI / 2, cx = 160 + Math.cos(a) * 62, cy = 196 + Math.sin(a) * 30; return `<circle class="chair" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7" />`; }).join('');
  const art = `<svg class="house" viewBox="0 0 320 250" role="img" aria-labelledby="h-t h-d">
<title id="h-t">A drawing of a small house with ten seats in a ring in front of it</title>
<desc id="h-d">A plain gabled house on a bluff above the sea, a board rack at its side, and ten round seats in a ring: the first ten people.</desc>
<rect class="sky" width="320" height="250" />
<circle class="sun" cx="262" cy="52" r="22" />
<path class="fog" d="M0 96 q40 -14 80 0 t80 0 t80 0 t80 0 v24 H0 Z" />
<path class="sea2" d="M0 118 H320 V150 H0 Z" />
<path class="bluff" d="M0 150 q80 -16 160 -6 t160 -4 V250 H0 Z" />
<path class="wall" d="M96 150 V104 L150 66 L204 104 V150 Z" />
<path class="roof" d="M88 108 L150 62 L212 108" />
<rect class="door" x="140" y="118" width="20" height="32" /><rect class="win" x="108" y="114" width="20" height="16" /><rect class="win" x="172" y="114" width="20" height="16" />
<g class="rack"><path d="M222 150 V100 M246 150 V100 M222 112 H246 M222 132 H246" /><path class="brd" d="M228 96 q6 -30 12 0 v52 h-12 Z" /></g>
<ellipse class="ring" cx="160" cy="196" rx="62" ry="30" />
${chairs}
</svg>`;
  const steps = LADDER.map(([h, p], i) => `<li><label><input type="checkbox" data-step="${i}"> <b>Step ${i + 1}. ${esc(h)}.</b></label><p>${esc(p)}</p></li>`).join('\n');
  return head('The El Segundo house: Coast Commons', 'The flagship study of Coast Commons: what a shared, openly run commons house could be in El Segundo, what the city permits, and a six-step ladder that starts with ten people and no purchase. A study, not an offer.', '/coast-commons/el-segundo/') + `<header class="hero town flagh">
<p class="kick">The flagship · home base · read ${DATE_WORDS}</p>
<h1>The El Segundo house</h1>
<p class="lede">A study of one small commons for a small town: a place ten neighbors keep together, with the books open and a share held back for everyone else. This page says what it could be, what the City of El Segundo allows, and how to begin without buying anything.</p>
<p class="note"><b>A study and a public resource, not an offer.</b> There is no house, no listing and no fund. Nothing is for sale and no money is being raised. Not legal, tax or investment advice. <a href="/coast-commons/pattern/#plainly">The plain box</a>.</p>
</header>
${art}
<section aria-labelledby="pl-h"><h2 id="pl-h">The place</h2>
<p class="gov">Governing body: <b>${esc(t.r.body)}</b></p>
${t.character.map(fact).join('\n')}
<p>Next door to the north, on County sand, is Dockweiler:</p>
${fact(towns.find((x) => x.slug === 'playa-del-rey').character[0])}
<p>A short ride south on the bike path is El Porto, the north end of Manhattan Beach:</p>
${fact(towns.find((x) => x.slug === 'manhattan-beach').character[0])}
</section>

<section class="idea" aria-labelledby="wh-h"><h2 id="wh-h">What the house could be</h2>
<p class="tag">A sketch by Claude, not a plan and not a listing.</p>
<p>Not a beach house, because El Segundo's sand is a short walk below a working shoreline and the town lives up on the bluff. Think of a town house for the water: an ordinary place a few blocks up from Grand Avenue with five jobs.</p>
<ul class="rooms">
<li><b>Board room.</b> A rack of shared boards and wetsuits, a rinse hose, a ding-repair bench. Ride the bike path north to Dockweiler or south to El Porto.</li>
<li><b>Workshop.</b> One good bench and the tools nobody needs to own alone.</li>
<li><b>Kitchen table.</b> A long table and a big pot, for the supper after.</li>
<li><b>Music corner.</b> Instruments on the wall, quiet hours on the door.</li>
<li><b>Garden strip.</b> Herbs, tomatoes, a compost bin, a bench facing west.</li>
</ul>
<p>It stays small on purpose: ten members to begin, each with a right to use the place and a duty to look after it, none with a stake to sell.</p>
</section>

<section aria-labelledby="re-h"><h2 id="re-h">The same recipe, fitted to El Segundo</h2>
<dl class="recipe">
<dt>The first ten people</dt><dd>Ten who live or work in town. One seat, one voice. A waiting list rather than a bigger table.</dd>
<dt>A rented weekend first</dt><dd>In El Segundo the rented weekend has to change shape. The City's permit covers a resident owner renting bedrooms while living there, with at most six guests, so ten people cannot simply book a house for two nights. Step 2 on the ladder lists three lawful ways to get the same test.</dd>
<dt>House rules</dt><dd>One page. Quiet hours, guests, cleaning, who holds the key, how to leave.</dd>
<dt>Open books</dt><dd>One ledger that every member, and any neighbor who asks, can read. Every dollar in and out, with a name and a date.</dd>
<dt>Use-rights, not ownership</dt><dd>Members hold a turn at the place, not a piece of it. A turn cannot be sold or passed on for money. If someone leaves, the seat goes to the waiting list.</dd>
<dt>A public-good share</dt><dd>A fixed slice of the calendar and the budget belongs to the town: free youth surf mornings with loaner boards, an open repair bench, a supper anyone can join.</dd>
</dl>
<p><a class="btn" href="/coast-commons/pattern/">The full pattern, with the split calculator and ledger</a></p>
</section>

<section aria-labelledby="ru-h"><h2 id="ru-h">What El Segundo allows, from the City's own pages</h2>
${ruleRows(t)}
<div class="rule means"><h3>What that means for a commons house</h3>
<ul>
<li>A whole house booked by a group for a weekend with no resident owner is not something the home share permit covers.</li>
<li>A backyard unit cannot be the short-stay part of the plan.</li>
<li>A stay of more than 30 days is a different thing from a short-term rental. Whether a month-long lease to a group, used on weekends, fits a given address is a question for the lease, the owner and the City. It was not verified here.</li>
<li>A clubhouse with no beds is a land-use question: what the parcel is zoned and whether a club or meeting use is allowed there. The zoning map was not opened, so that is not verified either.</li>
</ul></div>
</section>

<section aria-labelledby="la-h"><h2 id="la-h">The step ladder</h2>
<p>Tick steps as a group works through them. The ticks stay in this browser and go nowhere.</p>
<ol class="ladder" id="ladder">
${steps}
</ol>
<p><button class="btn alt" type="button" id="ladder-clear">Clear the ticks</button> <span id="ladder-s" role="status"></span></p>
</section>

<section class="dated" aria-labelledby="vd-h"><h2 id="vd-h">What was checked, and when</h2>
<p>The City's home share, ADU and planning application pages were opened and read on <time datetime="${VERIFIED}">${DATE_WORDS}</time>, along with the County's pages for Dockweiler and Manhattan Beach. The coastal chapter was read in a third-party copy of the code.</p>
<p><b>Not verified for El Segundo:</b> the zoning map and adopted zoning code; the adopted text of the coastal chapter; an official description of El Segundo Beach; whether a group lease of more than 30 days or a clubhouse use is allowed at any address; anything about price. No rent, price or property is named anywhere on this page.</p>
</section>
${askBox()}
${neighbors(t)}
<script>
(function(){
  var KEY='cc-ladder-v1',mem=[],boxes=document.querySelectorAll('#ladder input'),s=document.getElementById('ladder-s');
  function load(){var a=mem;try{a=JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){a=mem}return Array.isArray(a)?a:[]}
  function save(a){mem=a.slice();try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
  function paint(){var a=load(),n=0;for(var i=0;i<boxes.length;i++){boxes[i].checked=a.indexOf(i)>-1;if(boxes[i].checked)n++}s.textContent=n+' of '+boxes.length+' steps ticked.'}
  for(var i=0;i<boxes.length;i++)boxes[i].addEventListener('change',function(){var a=[];for(var j=0;j<boxes.length;j++)if(boxes[j].checked)a.push(j);save(a);paint()});
  var c=document.getElementById('ladder-clear');if(c)c.addEventListener('click',function(){save([]);paint()});
  paint();
})();
</script>
` + foot();
}

// ---- the pattern ----
const KINDS = [
  ['Surf house', 'Boards, wetsuits, a rinse, a bunk or two where the town allows it.'],
  ['Workshop', 'Benches and the tools that are too big or too rarely used to own alone.'],
  ['Community kitchen', 'A real stove, a long table, a shared pantry, a supper night.'],
  ['Music room', 'Instruments on the wall, soft walls, posted quiet hours.'],
  ['Garden', 'Beds, compost, a tool shed, a harvest table.'],
  ['Board library', 'Borrow a board like a book. A card, a due date, a repair jar.'],
  ['Boat', 'A small sailboat, a skiff or a rack of kayaks with a booking sheet.'],
];
function patternPage() {
  return head('The pattern: Coast Commons', 'The open recipe behind Coast Commons: the first ten people, a rented weekend first, house rules, open books, use-rights instead of ownership and a public-good share, with a cost-split calculator and a ledger template. A study, not an offer.', '/coast-commons/pattern/') + `<header class="hero">
<p class="kick">The open pattern · free to copy</p>
<h1>The commons recipe</h1>
<p class="lede">Six ingredients, in order. It works for a house, a shed, a kitchen or a boat. Begin with people and a weekend, and leave property for much later or never.</p>
</header>
<div id="plainly">${NOTICE}</div>

<section aria-labelledby="six-h"><h2 id="six-h">Six ingredients</h2>
<ol class="six">
<li><h3>The first ten people</h3><p>Ten is enough to share a cost and small enough to fit round one table. One seat, one voice. Agree how a seat is given up before anyone takes one.</p></li>
<li><h3>A rented weekend first</h3><p>Before any lease, try two nights together somewhere it is lawful: a permitted rental, a campground, a hostel, a member's hosted home. The town pages show where a whole-house weekend is and is not allowed. You are testing the people, not the building.</p></li>
<li><h3>House rules</h3><p>One page, written by the ten, signed by the ten. Quiet hours, guests, cleaning, keys, money, how to disagree, how to leave.</p></li>
<li><h3>Open books</h3><p>One ledger anyone in the group can read at any time, and that a neighbor can ask to see. Every amount has a date, a name and a reason.</p></li>
<li><h3>Use-rights, not ownership</h3><p>A member holds a turn at the place: so many days, so many keys. A turn is not a share of the property and cannot be sold. The aim is a club, not an investment. Whether a particular arrangement really is one is a lawyer's question, and anything a member could sell or profit from needs a securities lawyer before it exists.</p></li>
<li><h3>A public-good share</h3><p>Set aside a fixed part of the calendar and the budget for people who are not members: free youth surf mornings, an open bench day, a supper anyone can join. Decide the fraction at the start and print it on the door.</p></li>
</ol>
</section>

<section aria-labelledby="calc-h"><h2 id="calc-h">Split a weekend, in the open</h2>
<p>Type your own numbers. Nothing here is a quote or a price; the boxes start empty and nothing leaves this page.</p>
<form class="tool" id="calc" novalidate>
<label for="c-cost">Total cost of the weekend, all in</label><input id="c-cost" type="number" inputmode="decimal" min="0" step="1" placeholder="your number">
<label for="c-n">People sharing it</label><input id="c-n" type="number" inputmode="numeric" min="1" step="1" value="10">
<label for="c-pg">Public-good share, percent on top</label><input id="c-pg" type="number" inputmode="decimal" min="0" max="100" step="1" value="10">
<output id="c-out" aria-live="polite">Enter a total to see the split.</output>
</form>
</section>

<section aria-labelledby="led-h"><h2 id="led-h">An open ledger to start from</h2>
<p>A blank ledger with the columns that matter. The button builds the file in your browser.</p>
<div class="scroll"><table class="ledger"><thead><tr><th>Date</th><th>In or out</th><th>Amount</th><th>Who</th><th>For</th><th>Receipt</th><th>Public-good?</th></tr></thead>
<tbody><tr><td colspan="7">Empty on purpose. Your first line goes here.</td></tr></tbody></table></div>
<p><button class="btn" type="button" id="csv">Download a blank ledger (CSV)</button> <button class="btn alt" type="button" id="rules">Copy a house-rules outline</button> <span id="tool-s" role="status"></span></p>
<pre class="outline" id="outline">HOUSE RULES (one page)
1. Who we are: ten seats, one voice each.
2. What we share, and the days each member may use it.
3. Quiet hours and neighbors.
4. Guests: how many, how often, who answers for them.
5. Cleaning, repairs and what to do when something breaks.
6. Keys and safety.
7. Money: what each pays, when, and where the ledger lives.
8. The public-good share: how much, and what it is spent on.
9. Disagreements: who decides, and how.
10. Leaving: notice, and what happens to the seat. A seat is never sold.</pre>
</section>

<section aria-labelledby="kinds-h"><h2 id="kinds-h">It does not have to be a surf house</h2>
<ul class="kinds">
${KINDS.map(([k, d]) => `<li><b>${k}.</b> ${d}</li>`).join('\n')}
</ul>
</section>

<section aria-labelledby="law-h"><h2 id="law-h">Before anyone signs anything</h2>
<ul class="finds">
<li>Ask the city whether the stay or the use is allowed at that address. Each <a href="/coast-commons/">town page</a> links the official pages and lists five questions to take to the planning counter.</li>
<li>Near the water, ask who issues the coastal permit. The Coastal Commission says development in the coastal zone generally needs a permit first, from the local government where there is a certified coastal program and from the Commission where there is not. <a class="src" href="${SRC.ccc.url}" rel="noopener">${esc(SRC.ccc.label)}</a> (read ${VERIFIED})</li>
<li>If the plan ever includes ownership, pooled money held for people, or anything a member could sell, stop and hire a securities lawyer and a tax adviser. This page cannot tell you what is lawful for your group. No securities regulator page was opened for this study; that is not verified.</li>
</ul>
</section>

<section aria-labelledby="lic-h"><h2 id="lic-h">Use it</h2>
<p>This pattern and the town notes are meant to be copied. The licence is Creative Commons Attribution 4.0 (CC BY 4.0), chosen on November 12, 2026: anyone may reuse and adapt the words and drawings with credit. See <a href="/coast-commons/LICENSE.txt">the licence note</a>. The whole area is also available as <a href="/coast-commons.json">one JSON file</a>.</p>
</section>
<script>
(function(){
  var cost=document.getElementById('c-cost'),n=document.getElementById('c-n'),pg=document.getElementById('c-pg'),out=document.getElementById('c-out');
  function money(x){return '$'+(Math.round(x*100)/100).toFixed(2)}
  function run(){
    var c=parseFloat(cost.value),k=parseInt(n.value,10),p=parseFloat(pg.value);
    if(!(c>0)||!(k>=1)){out.textContent='Enter a total to see the split.';return}
    if(!(p>=0))p=0;if(p>100)p=100;
    var pot=c*p/100,each=(c+pot)/k;
    out.textContent='Each of '+k+' pays '+money(each)+'. Of the '+money(c+pot)+' collected, '+money(c)+' covers the weekend and '+money(pot)+' goes to the public-good pot. Write all three numbers in the ledger.';
  }
  if(cost&&n&&pg){cost.addEventListener('input',run);n.addEventListener('input',run);pg.addEventListener('input',run)}
  var s=document.getElementById('tool-s');
  var csv=document.getElementById('csv');
  if(csv)csv.addEventListener('click',function(){
    try{
      var text='Date,In or out,Amount,Who,For,Receipt,Public-good share (yes/no)\\r\\n';
      var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));a.download='commons-ledger.csv';
      document.body.appendChild(a);a.click();a.remove();s.textContent='Ledger file made.';
    }catch(e){s.textContent='This browser would not make the file. Copy the column names from the table.'}
  });
  var rules=document.getElementById('rules');
  if(rules)rules.addEventListener('click',function(){
    var t=document.getElementById('outline').textContent;
    function done(ok){s.textContent=ok?'Outline copied.':'Select the outline below and copy it by hand.'}
    try{navigator.clipboard.writeText(t).then(function(){done(true)},function(){done(false)})}catch(e){done(false)}
  });
})();
</script>
` + foot();
}

// ---- the JSON twin ----
function twin() {
  const src = (keys) => keys.map((k) => ({ label: SRC[k].label, url: SRC[k].url, kind: SRC[k].kind, opened: VERIFIED }));
  const f = (x) => ({ summary: x.text, verified: x.verified, sources: src(x.src) });
  const official = Object.values(SRC).filter((s) => s.kind !== 'copy');
  return {
    name: 'Coast Commons',
    url: `${BASE}/coast-commons/`,
    json: `${BASE}/coast-commons.json`,
    block: `${BASE}/b/0785`,
    author: 'Claude, at Mike Hoydich\'s request',
    started: VERIFIED,
    verified: VERIFIED,
    what: 'An open study of community-run shared houses, clubhouses and boats for the beach towns within about 25 miles of El Segundo, California, with each town\'s official rules pages.',
    notice: ['A study and a public resource, not an offer.', 'Nothing is being bought or sold. No money is being raised. No listings.', 'Not legal, tax or investment advice.', 'Tradable shares in property are likely securities and need a securities lawyer.'],
    licence: { status: 'chosen', chosen: '2026-11-12', spdx: 'CC-BY-4.0', covers: 'the words, drawings, cards and this file; not the linked sources', note: 'https://pointcast.xyz/coast-commons/LICENSE.txt', text: 'https://pointcast.xyz/coast-commons/LICENSE-CC-BY-4.0.txt' },
    method: { origin: ORIGIN, distance: 'Straight-line (great-circle, haversine) miles from the origin to one approximate reference point per town. Not driving distance.', radius_miles: 25, rules: 'Each rule summary is a short paraphrase of a page opened on the verified date. Entries with verified:false were not checked and carry no source.' },
    pages: { hub: `${BASE}/coast-commons/`, flagship: `${BASE}/coast-commons/el-segundo/`, pattern: `${BASE}/coast-commons/pattern/` },
    pattern: ['The first ten people', 'A rented weekend first', 'House rules', 'Open books', 'Use-rights, not ownership', 'A public-good share'],
    kinds: KINDS.map(([k]) => k),
    stay_labels: STAY,
    towns: towns.map((t) => ({
      slug: t.slug, name: t.name, url: `${BASE}/coast-commons/${t.slug}/`, flagship: !!t.flagship,
      miles_from_el_segundo: t.miles, reference_point: { name: t.ref, lat: t.lat, lon: t.lon, approximate: true },
      governing_body: t.r.body, whole_house_weekend: t.r.stay,
      character: t.character.map(f), commons_sketch: t.house,
      rules: { short_term_rentals: f(t.r.str), adus: f(t.r.adu), coastal_permits: f(t.r.coastal), zoning: f(t.r.zoning) },
      not_verified: notVerified(t), verified: VERIFIED,
    })),
    left_out: LEFT_OUT,
    studies: STUDIES,
    pageIndex: pageIndex('coast-commons', towns.filter((t) => !t.flagship)),
    sources: { official_pages_opened: official.length, third_party_copies_opened: Object.values(SRC).length - official.length, list: Object.values(SRC).map((s) => ({ ...s, opened: VERIFIED })) },
  };
}

const CSS = readFileSync(resolve(root, 'scripts/coast-commons/cc.css'), 'utf8');
const files = new Map();
files.set('public/coast-commons/cc.css', CSS);
files.set('public/coast-commons/index.html', hub());
files.set('public/coast-commons/pattern/index.html', patternPage());
for (const t of towns) files.set(`public/coast-commons/${t.slug}/index.html`, t.flagship ? flagshipPage() : townPage(t));
files.set('public/coast-commons.json', `${JSON.stringify(twin(), null, 2)}\n`);

let stale = 0;
for (const [rel, body] of files) {
  const p = resolve(root, rel);
  if (check) { if (!existsSync(p) || readFileSync(p, 'utf8') !== body) { console.error(`stale: ${rel}`); stale++; } continue; }
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, body);
}
if (check && stale) process.exit(1);
console.log(check ? `coast-commons: ${files.size} files up to date` : `coast-commons: wrote ${files.size} files (${towns.length} towns)`);
