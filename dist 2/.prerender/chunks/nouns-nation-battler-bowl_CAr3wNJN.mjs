import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute, F as Fragment } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { d as dayNumber, a as daysToLock, b as annotateCalendar, F as FOUNDING_GANGS, S as SEASON_6 } from './battler-bowl-state_CHLF-ptq.mjs';
import { m as moonSeeds } from './battler-moon-tournament_Bbz_lH4Q.mjs';

const $$NounsNationBattlerBowl = createComponent(($$result, $$props, $$slots) => {
  const ch = CHANNELS.BTL;
  const now = /* @__PURE__ */ new Date();
  const today = dayNumber(now);
  const daysLeft = daysToLock(now);
  const sprintCalendar = annotateCalendar(now);
  const currentMilestone = sprintCalendar.find((m) => m.state === "now") ?? sprintCalendar[0];
  const lockCounts = FOUNDING_GANGS.reduce(
    (acc, g) => {
      acc[g.lockStatus] = (acc[g.lockStatus] ?? 0) + 1;
      return acc;
    },
    {}
  );
  const allPending = (lockCounts.pending ?? 0) === FOUNDING_GANGS.length;
  const projectedTop4 = moonSeeds().slice(0, 4);
  const lockedSeeds = FOUNDING_GANGS.filter((g) => g.lockStatus === "locked" || g.lockStatus === "in");
  const useProjection = lockedSeeds.length < 4;
  const top4 = useProjection ? projectedTop4 : projectedTop4;
  const bowlPairings = [
    { code: "SF1", label: "Semifinal 1", topSeed: top4[0], bottomSeed: top4[3] },
    { code: "SF2", label: "Semifinal 2", topSeed: top4[1], bottomSeed: top4[2] }
  ];
  const lockPillCopy = {
    pending: { label: "?", tone: "pending" },
    in: { label: "IN", tone: "in" },
    locked: { label: "LOCKED", tone: "lock" },
    bubble: { label: "BUBBLE", tone: "bubble" },
    out: { label: "OUT", tone: "out" }
  };
  const asOf = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short"
  }).format(now);
  const BOWL_BANDS = [
    {
      code: "LOCK",
      title: "Lock band",
      requirement: "8+ wins by D14",
      population: "top 4 of 8",
      note: "Earns a Bowl seed and the rights-receipt package. Win column does the work; tiebreakers fall to points, then fan count, then rivalry record."
    },
    {
      code: "BUBBLE",
      title: "Bubble band",
      requirement: "5–7 wins by D14",
      population: "middle 2–3",
      note: "Plays the play-in slate. One Sprint-Storm boss field decides at least one bubble seat every season. Re-staking the roster pre-lock is the move."
    },
    {
      code: "OUT",
      title: "Out band",
      requirement: "4 or fewer wins by D14",
      population: "bottom 1–2",
      note: "Builder Circuit relegation lane opens. Imported nations get a graduation slot if the bottom seat is structurally vacant."
    }
  ];
  const BOSS_FIELDS = [
    { code: "MR", title: "Monsoon Rift", effect: "Wet, low-visibility lane fights. Healers over-perform. Punishes drafts that lean on clean range trades." },
    { code: "NC", title: "Neon Crown", effect: 'Clean field, no weather modifier. Paper advantages cash in. The "default" boss, but it is rarer than people remember.' },
    { code: "SS", title: "Scrap Storm", effect: "Debris hazards and broken sightlines. Scrappy gangs and emergency-mint healers eat clean teams alive." },
    { code: "BF", title: "Blackout Fog", effect: "Reduced read distance. Auction-tower volleys and chant-based morale plays exit the meta; ambushes return." }
  ];
  const READING_ORDER = [
    { tag: "0411", day: "Thu Apr 30", kicker: "Open", line: "Late-April leagues + Battler S6 checkpoint." },
    { tag: "0422", day: "Sat May 2", kicker: "Follow", line: "48-hour follow. Boss-field rotation doing the heavy lifting." },
    { tag: "0434", day: "Mon May 4", kicker: "Cap", line: "Trilogy capper. Cadence as the editorial product." },
    { tag: "——", day: "Thu May 7", kicker: "Next", line: "Bowl-path scoreboard if the table has tightened by then." }
  ];
  const FAST_PATHS = [
    { label: "Moon Tournament", href: "/nouns-nation-battler-moon/", note: "Once-per-full-moon knockout. Different format, same gangs." },
    { label: "Battle Desk", href: "/nouns-nation-battler/", note: "Live scorebug, league table, match queue, top Nouns." },
    { label: "V3", href: "/nouns-nation-battler-v3/", note: "Federation desk: Sprint Room, Recap Desk, Pocket Desk, Agent Ops." },
    { label: "Sprint Room", href: "/nouns-nation-battler-v3#sprint-room", note: "S6 14-day calendar, scoreboard, agent queue." },
    { label: "Recap Desk", href: "/nouns-nation-battler-v3#season-recap", note: "Champions, MVPs, story arcs, league memory." },
    { label: "CH.BTL archive", href: "/c/battler/", note: "Every Battler beat in one channel index." },
    { label: "Game JSON", href: "/nouns-nation-battler.json", note: "Machine-readable league state for agents." }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: "Nouns Nation Battler — Season 6 Bowl Path",
    description: "Structural surface for the Nouns Nation Battler S6 two-week table as it rolls toward the Bowl: lock/bubble/out bands across 8 founding gangs, a 14-day Sprint Room calendar, the boss-field rotation that decides the second half, and fast paths to the live Battle Desk.",
    url: "https://pointcast.xyz/nouns-nation-battler-bowl/",
    sport: "Auto battler",
    inLanguage: "en-US"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "PointCast Battle Desk · Bowl Path", "description": "The Bowl path for Nouns Nation Battler S6: lock/bubble/out bands across 8 founding gangs, the 14-day Sprint Room calendar, the boss-field rotation that decides the second half, and fast paths to the live Battle Desk.", "image": "/images/og/nouns-battler-v3.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation-battler-bowl.json", title: "Nouns Nation Battler Bowl-path snapshot (JSON)" },
    { type: "application/json", href: "/nouns-nation-battler.json", title: "Nouns Nation Battler manifest (JSON)" },
    { type: "application/json", href: "/nouns-nation-battler-sprint.json", title: "Season 6 Sprint Room missions (JSON)" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-battler-v3.png",
    buttons: [
      { label: "Battle Desk", action: "link", target: "https://pointcast.xyz/nouns-nation-battler/" },
      { label: "Watch V3", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-v3/" },
      { label: "Sprint Room", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-v3#sprint-room" },
      { label: "CH.BTL", action: "link", target: "https://pointcast.xyz/c/battler/" },
      { label: "Game JSON", action: "link", target: "https://pointcast.xyz/nouns-nation-battler.json" }
    ]
  }, "data-astro-cid-l5pcc3qu": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="bowl-path"${addAttribute(`--btl: ${ch.color600}; --btl-dark: ${ch.color800}; --btl-soft: ${ch.color50};`, "style")} data-astro-cid-l5pcc3qu> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-l5pcc3qu> <a href="/" data-astro-cid-l5pcc3qu>Home</a> <span aria-hidden="true" data-astro-cid-l5pcc3qu>/</span> <a href="/c/battler/" data-astro-cid-l5pcc3qu>CH.BTL</a> <span aria-hidden="true" data-astro-cid-l5pcc3qu>/</span> <a href="/nouns-nation-battler/" data-astro-cid-l5pcc3qu>Battle Desk</a> <span aria-hidden="true" data-astro-cid-l5pcc3qu>/</span> <span aria-current="page" data-astro-cid-l5pcc3qu>Bowl Path</span> </nav> <header class="hero" data-astro-cid-l5pcc3qu> <p class="kicker" data-astro-cid-l5pcc3qu>CH.BTL / ${SEASON_6.name} / Bowl Path · as of ${asOf}</p> <h1 data-astro-cid-l5pcc3qu>The Bowl is no longer abstract.</h1> <p class="dek" data-astro-cid-l5pcc3qu>
The two-week table is ${today >= 7 ? "past its midpoint" : "opening"}. This page is the
        structural read on top of the live scoreboard — what the lock band looks like, who is on
        the bubble by structure, what boss fields decide the second half, and where today sits
        inside the 14-day Sprint Room. For current wins, points, and fan counts, the
<a href="/nouns-nation-battler/" data-astro-cid-l5pcc3qu>Battle Desk</a> is the source of truth; this page's
        live state is also <a href="/nouns-nation-battler-bowl.json" data-astro-cid-l5pcc3qu>readable as JSON</a>.
</p> <div class="hero-strip" data-astro-cid-l5pcc3qu> <span class="pill pill--now" data-astro-cid-l5pcc3qu>D${today} · ${currentMilestone.title}</span> <span class="pill" data-astro-cid-l5pcc3qu>${daysLeft > 0 ? `${daysLeft} days to lock` : daysLeft === 0 ? "Lock day" : `${Math.abs(daysLeft)} days past lock`}</span> <span class="pill" data-astro-cid-l5pcc3qu>8 founding gangs</span> ${!allPending && renderTemplate`<span class="pill pill--ledger" data-astro-cid-l5pcc3qu> ${lockCounts.locked ?? 0}L · ${lockCounts.in ?? 0}I · ${lockCounts.bubble ?? 0}B · ${lockCounts.out ?? 0}O
</span>`} </div> ${allPending && renderTemplate`<p class="hero__note" data-astro-cid-l5pcc3qu>
Lock status reads as <code data-astro-cid-l5pcc3qu>pending</code> until a beat brings real signal. The page
          shows structural framing in the meantime — no fabricated records.
</p>`} </header> <section class="bands" aria-labelledby="bands-title" data-astro-cid-l5pcc3qu> <header class="section-head" data-astro-cid-l5pcc3qu> <p class="kicker" data-astro-cid-l5pcc3qu>Lock / bubble / out</p> <h2 id="bands-title" data-astro-cid-l5pcc3qu>Three bands by D14.</h2> </header> <div class="band-grid" data-astro-cid-l5pcc3qu> ${BOWL_BANDS.map((band) => renderTemplate`<article${addAttribute(`band band--${band.code.toLowerCase()}`, "class")} data-astro-cid-l5pcc3qu> <p class="band__code" data-astro-cid-l5pcc3qu>${band.code}</p> <h3 data-astro-cid-l5pcc3qu>${band.title}</h3> <p class="band__req" data-astro-cid-l5pcc3qu><strong data-astro-cid-l5pcc3qu>Requirement:</strong> ${band.requirement}</p> <p class="band__pop" data-astro-cid-l5pcc3qu><strong data-astro-cid-l5pcc3qu>Population:</strong> ${band.population}</p> <p class="band__note" data-astro-cid-l5pcc3qu>${band.note}</p> </article>`)} </div> </section> <section class="bracket" aria-labelledby="bracket-title" data-astro-cid-l5pcc3qu> <header class="section-head" data-astro-cid-l5pcc3qu> <p class="kicker" data-astro-cid-l5pcc3qu>House league</p> <h2 id="bracket-title" data-astro-cid-l5pcc3qu>The eight gangs that fill the bracket.</h2> <p class="section-dek" data-astro-cid-l5pcc3qu>
Standings live; identities don't. Each gang has a stable color, a stable Noun, and a
          structural reason it does or doesn't survive a given boss field.
</p> </header> <ol class="gang-grid" data-astro-cid-l5pcc3qu> ${FOUNDING_GANGS.map((gang) => renderTemplate`<li class="gang-card"${addAttribute(`--gang: ${gang.color};`, "style")} data-astro-cid-l5pcc3qu> <span class="gang-card__noun-frame" aria-hidden="true" data-astro-cid-l5pcc3qu> <img${addAttribute(`https://noun.pics/${gang.noun}.svg`, "src")} alt="" width="40" height="40" loading="lazy" style="image-rendering: pixelated;" onerror="this.style.visibility='hidden'" data-astro-cid-l5pcc3qu> </span> <p class="gang-card__code" data-astro-cid-l5pcc3qu> <span class="gang-card__short" data-astro-cid-l5pcc3qu>${gang.short}</span> ${gang.lockStatus !== "pending" && renderTemplate`<span${addAttribute(`gang-card__lock gang-card__lock--${lockPillCopy[gang.lockStatus].tone}`, "class")} data-astro-cid-l5pcc3qu> ${lockPillCopy[gang.lockStatus].label} </span>`} </p> <h3 data-astro-cid-l5pcc3qu>${gang.name}</h3> ${(gang.championships.length > 0 || gang.defending) && renderTemplate`<p class="gang-card__history" data-astro-cid-l5pcc3qu> ${gang.championships.map((s, i) => renderTemplate`<span${addAttribute(`gang-card__champ ${gang.defending && i === gang.championships.length - 1 ? "gang-card__champ--defending" : ""}`, "class")} data-astro-cid-l5pcc3qu> ${s}${gang.defending && i === gang.championships.length - 1 ? " · DEF" : ""} </span>`)} </p>`} <p class="gang-card__line" data-astro-cid-l5pcc3qu>${gang.line}</p> </li>`)} </ol> <p class="bracket__source" data-astro-cid-l5pcc3qu>
Live wins, points, and fan count → <a href="/nouns-nation-battler/" data-astro-cid-l5pcc3qu>Battle Desk</a> · <a href="/nouns-nation-battler.json" data-astro-cid-l5pcc3qu>Game JSON</a> </p> </section> <section class="calendar" aria-labelledby="calendar-title" data-astro-cid-l5pcc3qu> <header class="section-head" data-astro-cid-l5pcc3qu> <p class="kicker" data-astro-cid-l5pcc3qu>Sprint Room · 14 days</p> <h2 id="calendar-title" data-astro-cid-l5pcc3qu>Where today sits in the lock cycle.</h2> </header> <ol class="calendar-rail" data-astro-cid-l5pcc3qu> ${sprintCalendar.map((day) => renderTemplate`<li${addAttribute(`cal-step cal-step--${day.state}`, "class")} data-astro-cid-l5pcc3qu> <p class="cal-step__day" data-astro-cid-l5pcc3qu>${day.day}</p> <h3 data-astro-cid-l5pcc3qu>${day.title}</h3> <p class="cal-step__note" data-astro-cid-l5pcc3qu>${day.note}</p> <span${addAttribute(`cal-step__state cal-state--${day.state}`, "class")} data-astro-cid-l5pcc3qu>${day.state.toUpperCase()}</span> </li>`)} </ol> </section> <section class="projection" aria-labelledby="projection-title" data-astro-cid-l5pcc3qu> <header class="section-head" data-astro-cid-l5pcc3qu> <p class="kicker" data-astro-cid-l5pcc3qu>Bowl bracket · ${useProjection ? "projected" : "live"}</p> <h2 id="projection-title" data-astro-cid-l5pcc3qu>Four seeds, two semis, one final.</h2> <p class="section-dek" data-astro-cid-l5pcc3qu> ${useProjection ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-l5pcc3qu": true }, { "default": ($$result3) => renderTemplate`The Bowl runs 4-team single-elim — top seed plays the four-seed in SF1, two-seed plays three in SF2, winners meet in the Final. Until <code data-astro-cid-l5pcc3qu>lockStatus</code> carries real signal, the projection reuses the same championship-history ranking that drives the <a href="/nouns-nation-battler-moon/" data-astro-cid-l5pcc3qu>Moon Tournament</a> seeds. Real lock-band gangs replace this when wins, points, and fans graduate the projection.` })}` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-l5pcc3qu": true }, { "default": ($$result3) => renderTemplate`Live lock seeds taken from the locked band. Pairings: 1 vs 4 in SF1, 2 vs 3 in SF2, winners in the Final.` })}`} </p> </header> <div class="bracket-projection" data-astro-cid-l5pcc3qu> <div class="bracket-projection__semis" data-astro-cid-l5pcc3qu> ${bowlPairings.map((m) => renderTemplate`<article class="proj-match" data-astro-cid-l5pcc3qu> <header class="proj-match__head" data-astro-cid-l5pcc3qu> <span class="proj-match__code" data-astro-cid-l5pcc3qu>${m.code}</span> <span class="proj-match__label" data-astro-cid-l5pcc3qu>${m.label}</span> </header> <div class="proj-match__slot"${addAttribute(`--gang: ${m.topSeed.color};`, "style")} data-astro-cid-l5pcc3qu> <span class="proj-match__seed" data-astro-cid-l5pcc3qu>#${m.topSeed.seed}</span> <span class="proj-match__name" data-astro-cid-l5pcc3qu>${m.topSeed.name}</span> <span class="proj-match__short" data-astro-cid-l5pcc3qu>${m.topSeed.short}</span> </div> <span class="proj-match__vs" aria-hidden="true" data-astro-cid-l5pcc3qu>vs</span> <div class="proj-match__slot"${addAttribute(`--gang: ${m.bottomSeed.color};`, "style")} data-astro-cid-l5pcc3qu> <span class="proj-match__seed" data-astro-cid-l5pcc3qu>#${m.bottomSeed.seed}</span> <span class="proj-match__name" data-astro-cid-l5pcc3qu>${m.bottomSeed.name}</span> <span class="proj-match__short" data-astro-cid-l5pcc3qu>${m.bottomSeed.short}</span> </div> </article>`)} </div> <div class="bracket-projection__final" data-astro-cid-l5pcc3qu> <article class="proj-match proj-match--final" data-astro-cid-l5pcc3qu> <header class="proj-match__head" data-astro-cid-l5pcc3qu> <span class="proj-match__code" data-astro-cid-l5pcc3qu>F</span> <span class="proj-match__label" data-astro-cid-l5pcc3qu>Final · Nouns Bowl</span> </header> <div class="proj-match__slot proj-match__slot--tbd" data-astro-cid-l5pcc3qu> <span class="proj-match__seed" data-astro-cid-l5pcc3qu>—</span> <span class="proj-match__name" data-astro-cid-l5pcc3qu>Winner of SF1</span> </div> <span class="proj-match__vs" aria-hidden="true" data-astro-cid-l5pcc3qu>vs</span> <div class="proj-match__slot proj-match__slot--tbd" data-astro-cid-l5pcc3qu> <span class="proj-match__seed" data-astro-cid-l5pcc3qu>—</span> <span class="proj-match__name" data-astro-cid-l5pcc3qu>Winner of SF2</span> </div> <footer class="proj-match__trophy" data-astro-cid-l5pcc3qu> <span class="proj-match__trophy-glyph" aria-hidden="true" data-astro-cid-l5pcc3qu>🏆</span> <span class="proj-match__trophy-name" data-astro-cid-l5pcc3qu>Nouns Bowl</span> </footer> </article> </div> </div> </section> <section class="fields" aria-labelledby="fields-title" data-astro-cid-l5pcc3qu> <header class="section-head" data-astro-cid-l5pcc3qu> <p class="kicker" data-astro-cid-l5pcc3qu>Film room</p> <h2 id="fields-title" data-astro-cid-l5pcc3qu>Four boss fields decide the second half.</h2> <p class="section-dek" data-astro-cid-l5pcc3qu>
The boss-field rotation is the league's volatility engine. Same matchup, different
          field, materially different result distributions. The reason you can't read a single
          weekend in isolation — look at three.
</p> </header> <div class="field-grid" data-astro-cid-l5pcc3qu> ${BOSS_FIELDS.map((field) => renderTemplate`<article class="field-card" data-astro-cid-l5pcc3qu> <p class="field-card__code" data-astro-cid-l5pcc3qu>${field.code}</p> <h3 data-astro-cid-l5pcc3qu>${field.title}</h3> <p data-astro-cid-l5pcc3qu>${field.effect}</p> </article>`)} </div> </section> <section class="cadence" aria-labelledby="cadence-title" data-astro-cid-l5pcc3qu> <header class="section-head" data-astro-cid-l5pcc3qu> <p class="kicker" data-astro-cid-l5pcc3qu>Sports Desk cadence</p> <h2 id="cadence-title" data-astro-cid-l5pcc3qu>The desk shows up on a schedule.</h2> <p class="section-dek" data-astro-cid-l5pcc3qu>
A trilogy proved the Thu→Sat→Mon shape. The next beat lands Thursday, with this page
          to point at if the table has tightened by then.
</p> </header> <ol class="cadence-list" data-astro-cid-l5pcc3qu> ${READING_ORDER.map((beat) => renderTemplate`<li class="cadence-row" data-astro-cid-l5pcc3qu> <span class="cadence-row__tag" data-astro-cid-l5pcc3qu> ${beat.tag === "——" ? "——" : renderTemplate`<a${addAttribute(`/b/${beat.tag}`, "href")} data-astro-cid-l5pcc3qu>${beat.tag}</a>`} </span> <span class="cadence-row__day" data-astro-cid-l5pcc3qu>${beat.day}</span> <span class="cadence-row__kicker" data-astro-cid-l5pcc3qu>${beat.kicker}</span> <span class="cadence-row__line" data-astro-cid-l5pcc3qu>${beat.line}</span> </li>`)} </ol> </section> <section class="paths" aria-labelledby="paths-title" data-astro-cid-l5pcc3qu> <header class="section-head" data-astro-cid-l5pcc3qu> <p class="kicker" data-astro-cid-l5pcc3qu>Fast paths</p> <h2 id="paths-title" data-astro-cid-l5pcc3qu>Where to look next.</h2> </header> <ul class="path-grid" data-astro-cid-l5pcc3qu> ${FAST_PATHS.map((path) => renderTemplate`<li class="path-card" data-astro-cid-l5pcc3qu> <a${addAttribute(path.href, "href")} data-astro-cid-l5pcc3qu> <strong data-astro-cid-l5pcc3qu>${path.label}</strong> <span data-astro-cid-l5pcc3qu>${path.note}</span> </a> </li>`)} </ul> </section> <footer class="signoff" data-astro-cid-l5pcc3qu> <p data-astro-cid-l5pcc3qu>
Filed from the <a href="/nouns-nation-battler/" data-astro-cid-l5pcc3qu>Battle Desk</a>, El Segundo. Format
        notes are structural; live numbers live on the desk and in
<a href="/nouns-nation-battler.json" data-astro-cid-l5pcc3qu>Game JSON</a>. The Bowl path is what you walk
        when wins, points, and fan counts agree.
</p> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-bowl.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-bowl.astro";
const $$url = "/nouns-nation-battler-bowl";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsNationBattlerBowl,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
