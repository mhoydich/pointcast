import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { n as nextFullMoon, h as hoursToNextFullMoon, a as namedMoonForDate, m as moonSeeds, b as bracketMatches, L as LUNAR_TIDE_FIELD } from './battler-moon-tournament_Bbz_lH4Q.mjs';

const $$NounsNationBattlerMoon = createComponent(($$result, $$props, $$slots) => {
  const ch = CHANNELS.BTL;
  const now = /* @__PURE__ */ new Date();
  const fullMoon = nextFullMoon(now);
  const hoursAway = hoursToNextFullMoon(now);
  const daysAway = Math.floor(hoursAway / 24);
  const namedMoon = namedMoonForDate(fullMoon);
  const tournamentName = `${namedMoon} Cup`;
  const seeds = moonSeeds();
  const seedByNumber = new Map(seeds.map((s) => [s.seed, s]));
  const matches = bracketMatches();
  new Map(matches.map((m) => [m.code, m]));
  const fullMoonStamp = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short"
  }).format(fullMoon);
  const asOf = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short"
  }).format(now);
  function slotLabel(slot) {
    if (slot.kind === "seed") {
      const s = seedByNumber.get(slot.seed);
      return {
        kind: "seed",
        primary: s.name,
        secondary: `#${s.seed} · ${s.short}`,
        color: s.color,
        noun: s.noun,
        defending: s.defending
      };
    }
    return { kind: "winner", primary: `Winner of ${slot.from}` };
  }
  const FAST_PATHS = [
    { label: "Bowl path", href: "/nouns-nation-battler-bowl/", note: "Two-week table — the regular S6 lock cycle." },
    { label: "Battle Desk", href: "/nouns-nation-battler/", note: "Live scorebug, league standings, top Nouns." },
    { label: "V3", href: "/nouns-nation-battler-v3/", note: "Federation desk: Sprint Room, Recap Desk, Pocket." },
    { label: "CH.BTL archive", href: "/c/battler/", note: "Every Battler beat in one channel index." },
    { label: "Moon JSON", href: "/nouns-nation-battler-moon.json", note: "Machine-readable tournament state." },
    { label: "Bowl JSON", href: "/nouns-nation-battler-bowl.json", note: "Companion snapshot for the regular Bowl path." }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: `Nouns Nation Battler — ${tournamentName}`,
    description: `Once-per-full-moon single-elimination knockout for the 8 founding gangs of Nouns Nation Battler. One night, one boss field (Lunar Tide), one trophy (${tournamentName}). Seeded from real championship history.`,
    startDate: fullMoon.toISOString(),
    url: "https://pointcast.xyz/nouns-nation-battler-moon/",
    sport: "Auto battler",
    inLanguage: "en-US"
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": `PointCast Battle Desk · Moon Tournament — ${tournamentName}`, "description": `Moon Tournament for Nouns Nation Battler S6: a one-night single-elimination knockout among the 8 founding gangs, run on the Lunar Tide field, on the night of the ${namedMoon}. Seeds from real championship history; bracket outcomes are pending until tournament night.`, "image": "/images/og/nouns-battler-v3.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/nouns-nation-battler-moon.json", title: "Moon Tournament snapshot (JSON)" },
    { type: "application/json", href: "/nouns-nation-battler-bowl.json", title: "Bowl-path snapshot (JSON)" },
    { type: "application/json", href: "/nouns-nation-battler.json", title: "Nouns Nation Battler manifest (JSON)" }
  ], "frame": {
    image: "https://pointcast.xyz/images/og/nouns-battler-v3.png",
    buttons: [
      { label: "Bowl path", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-bowl/" },
      { label: "Battle Desk", action: "link", target: "https://pointcast.xyz/nouns-nation-battler/" },
      { label: "Watch V3", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-v3/" },
      { label: "CH.BTL", action: "link", target: "https://pointcast.xyz/c/battler/" },
      { label: "Moon JSON", action: "link", target: "https://pointcast.xyz/nouns-nation-battler-moon.json" }
    ]
  }, "data-astro-cid-dm44wmwj": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="moon-tournament"${addAttribute(`--btl: ${ch.color600}; --btl-dark: ${ch.color800}; --btl-soft: ${ch.color50};`, "style")} data-astro-cid-dm44wmwj> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-dm44wmwj> <a href="/" data-astro-cid-dm44wmwj>Home</a> <span aria-hidden="true" data-astro-cid-dm44wmwj>/</span> <a href="/c/battler/" data-astro-cid-dm44wmwj>CH.BTL</a> <span aria-hidden="true" data-astro-cid-dm44wmwj>/</span> <a href="/nouns-nation-battler/" data-astro-cid-dm44wmwj>Battle Desk</a> <span aria-hidden="true" data-astro-cid-dm44wmwj>/</span> <span aria-current="page" data-astro-cid-dm44wmwj>Moon Tournament</span> </nav> <header class="hero" data-astro-cid-dm44wmwj> <div class="hero__moon" aria-hidden="true" data-astro-cid-dm44wmwj> <span class="moon-disc" data-astro-cid-dm44wmwj></span> </div> <div class="hero__copy" data-astro-cid-dm44wmwj> <p class="kicker" data-astro-cid-dm44wmwj>CH.BTL · Moon Tournament · ${namedMoon} · as of ${asOf}</p> <h1 data-astro-cid-dm44wmwj>${tournamentName}.</h1> <p class="dek" data-astro-cid-dm44wmwj>
One night. Eight gangs. Single elimination. The whole bracket runs on the
<strong data-astro-cid-dm44wmwj>Lunar Tide</strong> field — the only night this boss appears. Trophy is the
<strong data-astro-cid-dm44wmwj>${tournamentName}</strong>; winner of the regular Bowl carries it for the next
          lunar cycle. Seeds are pinned to real championship history; bracket outcomes stay
          pending until tournament night.
</p> <div class="hero-strip" data-astro-cid-dm44wmwj> <span class="pill pill--countdown" data-astro-cid-dm44wmwj> ${hoursAway > 24 ? `${daysAway} days · ${Math.round(hoursAway - daysAway * 24)}h to full moon` : hoursAway > 0 ? `${Math.round(hoursAway)}h to full moon` : "Moon is up — tournament window open"} </span> <span class="pill" data-astro-cid-dm44wmwj>${fullMoonStamp}</span> <span class="pill" data-astro-cid-dm44wmwj>8 seeds</span> <span class="pill" data-astro-cid-dm44wmwj>7 matches</span> <span class="pill pill--field" data-astro-cid-dm44wmwj>Lunar Tide</span> </div> <p class="hero__caveat" data-astro-cid-dm44wmwj>
Lunar timing computed from the mean synodic cycle. Real astronomical full moon may shift by ±12h.
</p> </div> </header> <section class="format" aria-labelledby="format-title" data-astro-cid-dm44wmwj> <header class="section-head" data-astro-cid-dm44wmwj> <p class="kicker" data-astro-cid-dm44wmwj>Format</p> <h2 id="format-title" data-astro-cid-dm44wmwj>Different shape than the Bowl.</h2> </header> <ul class="format-grid" data-astro-cid-dm44wmwj> <li class="format-card" data-astro-cid-dm44wmwj> <p class="format-card__code" data-astro-cid-dm44wmwj>CYCLE</p> <h3 data-astro-cid-dm44wmwj>Once per full moon</h3> <p data-astro-cid-dm44wmwj>One night per ~29 days. Outside the Sprint Room calendar — moon time, not week time.</p> </li> <li class="format-card" data-astro-cid-dm44wmwj> <p class="format-card__code" data-astro-cid-dm44wmwj>FORMAT</p> <h3 data-astro-cid-dm44wmwj>Single elimination</h3> <p data-astro-cid-dm44wmwj>QF → SF → Final. Seven matches, one night, one trophy. No best-of, no replay.</p> </li> <li class="format-card" data-astro-cid-dm44wmwj> <p class="format-card__code" data-astro-cid-dm44wmwj>FIELD</p> <h3 data-astro-cid-dm44wmwj>Lunar Tide only</h3> <p data-astro-cid-dm44wmwj>Every match runs on the same boss. Tide pulse rewards healers timing the down-pull and ranged volleys near the peak.</p> </li> <li class="format-card" data-astro-cid-dm44wmwj> <p class="format-card__code" data-astro-cid-dm44wmwj>SEEDS</p> <h3 data-astro-cid-dm44wmwj>Title history first</h3> <p data-astro-cid-dm44wmwj>Most championships → most recent year → defending tiebreaker → alphabetical for un-titled gangs. Pure ranking from facts.</p> </li> </ul> </section> <section class="seeds" aria-labelledby="seeds-title" data-astro-cid-dm44wmwj> <header class="section-head" data-astro-cid-dm44wmwj> <p class="kicker" data-astro-cid-dm44wmwj>Seeds 1–8</p> <h2 id="seeds-title" data-astro-cid-dm44wmwj>Where each gang lines up.</h2> <p class="section-dek" data-astro-cid-dm44wmwj>
Title count first, then most-recent title year, then defending tiebreaker, then
          alphabetical short-code for the un-titled. The same lib that powers the Bowl path
          drives this list — when a new title lands, the seed order recomputes.
</p> </header> <ol class="seed-list" data-astro-cid-dm44wmwj> ${seeds.map((s) => renderTemplate`<li class="seed-row"${addAttribute(`--gang: ${s.color};`, "style")} data-astro-cid-dm44wmwj> <span class="seed-row__num" data-astro-cid-dm44wmwj>#${s.seed}</span> <span class="seed-row__noun-frame" aria-hidden="true" data-astro-cid-dm44wmwj> <img${addAttribute(`https://noun.pics/${s.noun}.svg`, "src")} alt="" width="40" height="40" loading="lazy" style="image-rendering: pixelated;" onerror="this.style.visibility='hidden'" data-astro-cid-dm44wmwj> </span> <span class="seed-row__copy" data-astro-cid-dm44wmwj> <strong data-astro-cid-dm44wmwj> ${s.name} <span class="seed-row__short" data-astro-cid-dm44wmwj>${s.short}</span> ${s.defending && renderTemplate`<span class="seed-row__def" data-astro-cid-dm44wmwj>DEF</span>`} </strong> <span class="seed-row__rationale" data-astro-cid-dm44wmwj>${s.rationale}</span> </span> <span class="seed-row__titles" data-astro-cid-dm44wmwj> ${s.championships.length === 0 ? renderTemplate`<em data-astro-cid-dm44wmwj>—</em>` : s.championships.map((t) => renderTemplate`<span class="seed-row__title" data-astro-cid-dm44wmwj>${t}</span>`)} </span> </li>`)} </ol> </section> <section class="bracket" aria-labelledby="bracket-title" data-astro-cid-dm44wmwj> <header class="section-head" data-astro-cid-dm44wmwj> <p class="kicker" data-astro-cid-dm44wmwj>Bracket</p> <h2 id="bracket-title" data-astro-cid-dm44wmwj>Seven matches under the same moon.</h2> <p class="section-dek" data-astro-cid-dm44wmwj>
Standard 8-team single-elim layout. 1v8, 4v5, 3v6, 2v7 in the quarters; QF1 vs QF4
          and QF3 vs QF2 in the semis; semis winners in the final. Every cell stays
<code data-astro-cid-dm44wmwj>pending</code> until tournament night flips it.
</p> </header> <div class="bracket-grid" data-astro-cid-dm44wmwj> <div class="bracket-col bracket-col--qf" data-astro-cid-dm44wmwj> <p class="bracket-col__label" data-astro-cid-dm44wmwj>Quarterfinals</p> ${matches.filter((m) => m.round === "QF").map((m) => renderTemplate`<article${addAttribute(`match match--${m.round.toLowerCase()}`, "class")}${addAttribute(m.code, "data-match")} data-astro-cid-dm44wmwj> <header class="match__head" data-astro-cid-dm44wmwj> <span class="match__code" data-astro-cid-dm44wmwj>${m.code}</span> <span class="match__pending" data-astro-cid-dm44wmwj>pending</span> </header> <div class="match__slots" data-astro-cid-dm44wmwj> <div${addAttribute(`slot slot--top ${slotLabel(m.top).kind}`, "class")}${addAttribute(slotLabel(m.top).color ? `--gang: ${slotLabel(m.top).color};` : "", "style")} data-astro-cid-dm44wmwj> <span class="slot__primary" data-astro-cid-dm44wmwj>${slotLabel(m.top).primary}</span> ${slotLabel(m.top).secondary && renderTemplate`<span class="slot__secondary" data-astro-cid-dm44wmwj>${slotLabel(m.top).secondary}</span>`} </div> <span class="match__vs" aria-hidden="true" data-astro-cid-dm44wmwj>vs</span> <div${addAttribute(`slot slot--bottom ${slotLabel(m.bottom).kind}`, "class")}${addAttribute(slotLabel(m.bottom).color ? `--gang: ${slotLabel(m.bottom).color};` : "", "style")} data-astro-cid-dm44wmwj> <span class="slot__primary" data-astro-cid-dm44wmwj>${slotLabel(m.bottom).primary}</span> ${slotLabel(m.bottom).secondary && renderTemplate`<span class="slot__secondary" data-astro-cid-dm44wmwj>${slotLabel(m.bottom).secondary}</span>`} </div> </div> </article>`)} </div> <div class="bracket-col bracket-col--sf" data-astro-cid-dm44wmwj> <p class="bracket-col__label" data-astro-cid-dm44wmwj>Semifinals</p> ${matches.filter((m) => m.round === "SF").map((m) => renderTemplate`<article${addAttribute(`match match--${m.round.toLowerCase()}`, "class")}${addAttribute(m.code, "data-match")} data-astro-cid-dm44wmwj> <header class="match__head" data-astro-cid-dm44wmwj> <span class="match__code" data-astro-cid-dm44wmwj>${m.code}</span> <span class="match__pending" data-astro-cid-dm44wmwj>pending</span> </header> <div class="match__slots" data-astro-cid-dm44wmwj> <div${addAttribute(`slot slot--top ${slotLabel(m.top).kind}`, "class")} data-astro-cid-dm44wmwj> <span class="slot__primary" data-astro-cid-dm44wmwj>${slotLabel(m.top).primary}</span> </div> <span class="match__vs" aria-hidden="true" data-astro-cid-dm44wmwj>vs</span> <div${addAttribute(`slot slot--bottom ${slotLabel(m.bottom).kind}`, "class")} data-astro-cid-dm44wmwj> <span class="slot__primary" data-astro-cid-dm44wmwj>${slotLabel(m.bottom).primary}</span> </div> </div> </article>`)} </div> <div class="bracket-col bracket-col--f" data-astro-cid-dm44wmwj> <p class="bracket-col__label" data-astro-cid-dm44wmwj>Final · ${tournamentName}</p> ${matches.filter((m) => m.round === "F").map((m) => renderTemplate`<article${addAttribute(`match match--${m.round.toLowerCase()}`, "class")}${addAttribute(m.code, "data-match")} data-astro-cid-dm44wmwj> <header class="match__head" data-astro-cid-dm44wmwj> <span class="match__code" data-astro-cid-dm44wmwj>${m.code}</span> <span class="match__pending" data-astro-cid-dm44wmwj>pending</span> </header> <div class="match__slots" data-astro-cid-dm44wmwj> <div${addAttribute(`slot slot--top ${slotLabel(m.top).kind}`, "class")} data-astro-cid-dm44wmwj> <span class="slot__primary" data-astro-cid-dm44wmwj>${slotLabel(m.top).primary}</span> </div> <span class="match__vs" aria-hidden="true" data-astro-cid-dm44wmwj>vs</span> <div${addAttribute(`slot slot--bottom ${slotLabel(m.bottom).kind}`, "class")} data-astro-cid-dm44wmwj> <span class="slot__primary" data-astro-cid-dm44wmwj>${slotLabel(m.bottom).primary}</span> </div> </div> <footer class="match__trophy" data-astro-cid-dm44wmwj> <span class="match__trophy-glyph" aria-hidden="true" data-astro-cid-dm44wmwj>🌕</span> <span class="match__trophy-name" data-astro-cid-dm44wmwj>${tournamentName}</span> </footer> </article>`)} </div> </div> </section> <section class="field" aria-labelledby="field-title" data-astro-cid-dm44wmwj> <header class="section-head" data-astro-cid-dm44wmwj> <p class="kicker" data-astro-cid-dm44wmwj>${LUNAR_TIDE_FIELD.code} · only on tournament night</p> <h2 id="field-title" data-astro-cid-dm44wmwj>${LUNAR_TIDE_FIELD.title}.</h2> </header> <article class="field-card" data-astro-cid-dm44wmwj> <p data-astro-cid-dm44wmwj>${LUNAR_TIDE_FIELD.effect}</p> </article> </section> <section class="paths" aria-labelledby="paths-title" data-astro-cid-dm44wmwj> <header class="section-head" data-astro-cid-dm44wmwj> <p class="kicker" data-astro-cid-dm44wmwj>Fast paths</p> <h2 id="paths-title" data-astro-cid-dm44wmwj>Where to look next.</h2> </header> <ul class="path-grid" data-astro-cid-dm44wmwj> ${FAST_PATHS.map((path) => renderTemplate`<li class="path-card" data-astro-cid-dm44wmwj> <a${addAttribute(path.href, "href")} data-astro-cid-dm44wmwj> <strong data-astro-cid-dm44wmwj>${path.label}</strong> <span data-astro-cid-dm44wmwj>${path.note}</span> </a> </li>`)} </ul> </section> <footer class="signoff" data-astro-cid-dm44wmwj> <p data-astro-cid-dm44wmwj>
Filed from the <a href="/nouns-nation-battler/" data-astro-cid-dm44wmwj>Battle Desk</a>, El Segundo. Lunar
        timing is computed from the mean synodic cycle and may drift up to half a day from
        the real astronomical full moon. Bracket outcomes stay pending — the night flips them.
</p> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-moon.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/nouns-nation-battler-moon.astro";
const $$url = "/nouns-nation-battler-moon";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NounsNationBattlerMoon,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
