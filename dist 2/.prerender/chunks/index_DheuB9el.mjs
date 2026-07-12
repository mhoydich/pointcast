import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BaseLayout } from './BaseLayout_DxT1W98p.mjs';
import { R as RACE_REGISTRY, d as deriveStatus } from './races_BtvB86Iy.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

const $$Index = createComponent(($$result, $$props, $$slots) => {
  const now = /* @__PURE__ */ new Date();
  const WITH_STATUS = RACE_REGISTRY.map((race) => ({
    race,
    status: deriveStatus(race, now)
  }));
  function sortFor(status) {
    return (a, b) => {
      const byField = status === "open" ? "closesAt" : status === "scheduled" ? "opensAt" : "resolvesAt";
      const av = Date.parse(a.race[byField]);
      const bv = Date.parse(b.race[byField]);
      const asc = status === "open" || status === "scheduled";
      return asc ? av - bv : bv - av;
    };
  }
  const OPEN = WITH_STATUS.filter((w) => w.status === "open").sort(sortFor("open"));
  const SCHEDULED = WITH_STATUS.filter((w) => w.status === "scheduled").sort(sortFor("scheduled"));
  const CLOSED = WITH_STATUS.filter((w) => w.status === "closed").sort(sortFor("closed"));
  const RESOLVED = WITH_STATUS.filter((w) => w.status === "resolved").sort(sortFor("resolved"));
  const GROUPS = [
    { label: "Running now", key: "open", rows: OPEN },
    { label: "Scheduled", key: "scheduled", rows: SCHEDULED },
    { label: "Closed", key: "closed", rows: CLOSED },
    { label: "Resolved", key: "resolved", rows: RESOLVED }
  ];
  const fmtLA = (iso) => new Date(iso).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short"
  });
  const MODE_COPY = {
    fastest: "lowest time wins",
    most: "highest count wins",
    best: "judged",
    streak: "longest streak wins",
    prediction: "closest guess wins"
  };
  const title = "Race · PointCast";
  const description = "Every race on PointCast — running, scheduled, and resolved. One competition per day, per channel.";
  return renderTemplate`${renderComponent($$result, "BaseLayout", $$BaseLayout, { "title": title, "description": description, "data-astro-cid-twd2hwy7": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="race-page race-hub" data-surface="hub" data-astro-cid-twd2hwy7> <header class="race-head" data-astro-cid-twd2hwy7> <p class="race-head__kicker mono" data-astro-cid-twd2hwy7>POINTCAST · RACE · HUB</p> <h1 class="race-head__title" data-astro-cid-twd2hwy7>The race board.</h1> <p class="race-head__dek" data-astro-cid-twd2hwy7>
One competition at a time, per channel, per day. Enter at the
        page that carries the live leaderboard. Winners get
        attribution — their noun takes the strip for the next day.
</p> <dl class="race-head__meta" data-astro-cid-twd2hwy7> <div class="race-head__meta-row" data-astro-cid-twd2hwy7> <dt class="mono" data-astro-cid-twd2hwy7>OPEN NOW</dt> <dd data-astro-cid-twd2hwy7><strong data-astro-cid-twd2hwy7>${OPEN.length}</strong></dd> </div> <div class="race-head__meta-row" data-astro-cid-twd2hwy7> <dt class="mono" data-astro-cid-twd2hwy7>SCHEDULED</dt> <dd data-astro-cid-twd2hwy7><strong data-astro-cid-twd2hwy7>${SCHEDULED.length}</strong></dd> </div> <div class="race-head__meta-row" data-astro-cid-twd2hwy7> <dt class="mono" data-astro-cid-twd2hwy7>RESOLVED</dt> <dd data-astro-cid-twd2hwy7><strong data-astro-cid-twd2hwy7>${RESOLVED.length}</strong></dd> </div> <div class="race-head__meta-row" data-astro-cid-twd2hwy7> <dt class="mono" data-astro-cid-twd2hwy7>TOTAL</dt> <dd data-astro-cid-twd2hwy7><strong data-astro-cid-twd2hwy7>${WITH_STATUS.length}</strong></dd> </div> </dl> </header> ${WITH_STATUS.length === 0 && renderTemplate`<section class="race-hub__empty" data-astro-cid-twd2hwy7> <p class="mono" data-astro-cid-twd2hwy7>NO RACES REGISTERED YET.</p> <p data-astro-cid-twd2hwy7>
The registry lives at <code data-astro-cid-twd2hwy7>src/lib/races.ts</code> — add a
<code data-astro-cid-twd2hwy7>RaceSpec</code> to <code data-astro-cid-twd2hwy7>RACE_REGISTRY</code> and this
          page fills in.
</p> </section>`} ${GROUPS.map((group) => group.rows.length > 0 && renderTemplate`<section class="race-hub__group"${addAttribute(group.key, "data-group")} data-astro-cid-twd2hwy7> <header class="race-hub__group-head" data-astro-cid-twd2hwy7> <h2 class="race-hub__group-title" data-astro-cid-twd2hwy7>${group.label}</h2> <span class="race-hub__group-count mono" data-astro-cid-twd2hwy7>${group.rows.length} race${group.rows.length === 1 ? "" : "s"}</span> </header> <ul class="race-hub__grid" data-astro-cid-twd2hwy7> ${group.rows.map(({ race, status }) => {
    const channel = CHANNELS[race.channel];
    const chLower = race.channel.toLowerCase();
    const when = status === "open" ? `closes ${fmtLA(race.closesAt)}` : status === "scheduled" ? `opens ${fmtLA(race.opensAt)}` : status === "closed" ? `closed · resolves ${fmtLA(race.resolvesAt)}` : `resolved ${fmtLA(race.resolvesAt)}`;
    return renderTemplate`<li class="race-card"${addAttribute(status, "data-status")}${addAttribute(chLower, "data-channel")} data-astro-cid-twd2hwy7> <a class="race-card__link"${addAttribute(`/race/${race.slug}`, "href")} data-astro-cid-twd2hwy7> <header class="race-card__head" data-astro-cid-twd2hwy7> <span class="race-card__status mono"${addAttribute(status, "data-status")} data-astro-cid-twd2hwy7>${status.toUpperCase()}</span> <span class="race-card__channel mono" data-astro-cid-twd2hwy7>CH · ${race.channel}</span> </header> <h3 class="race-card__title" data-astro-cid-twd2hwy7>${race.title}</h3> ${race.description && renderTemplate`<p class="race-card__dek" data-astro-cid-twd2hwy7>${race.description}</p>`} <footer class="race-card__foot mono" data-astro-cid-twd2hwy7> <span class="race-card__mode" data-astro-cid-twd2hwy7>${race.mode} · ${MODE_COPY[race.mode]}</span> <span class="race-card__when" data-astro-cid-twd2hwy7>${when}</span> ${race.prize && renderTemplate`<span class="race-card__prize" data-astro-cid-twd2hwy7>🏁 ${race.prize}</span>`} <span class="race-card__channel-name" data-astro-cid-twd2hwy7>${channel?.name ?? race.channel}</span> </footer> </a> </li>`;
  })} </ul> </section>`)} <footer class="race-foot mono" data-astro-cid-twd2hwy7> <a href="/race/front-door" data-astro-cid-twd2hwy7>front door</a> <span data-astro-cid-twd2hwy7>·</span> <a href="/scoreboard" data-astro-cid-twd2hwy7>scoreboard</a> <span data-astro-cid-twd2hwy7>·</span> <a href="/wire" data-astro-cid-twd2hwy7>wire</a> <span data-astro-cid-twd2hwy7>·</span> <a href="/" data-astro-cid-twd2hwy7>home</a> </footer> </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/race/index.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/race/index.astro";
const $$url = "/race";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
