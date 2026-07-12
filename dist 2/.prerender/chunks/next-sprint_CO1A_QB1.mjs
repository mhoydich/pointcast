import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { N as NEXT_SPRINT } from './next-sprint_DYY-RK3_.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$NextSprint = createComponent(($$result, $$props, $$slots) => {
  const palette = ["#E84D6A", "#185FA5", "#2CC5A0", "#BA7517", "#12110E"];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Project",
    "@id": "https://pointcast.xyz/next-sprint#project",
    name: NEXT_SPRINT.title,
    description: NEXT_SPRINT.goal,
    url: "https://pointcast.xyz/next-sprint",
    sameAs: [
      NEXT_SPRINT.related.operatingBoard,
      NEXT_SPRINT.related.builder,
      NEXT_SPRINT.related.manifest,
      NEXT_SPRINT.related.sprintPicker
    ].filter(Boolean)
  };
  const pageDescription = `${NEXT_SPRINT.title}: ${NEXT_SPRINT.goal}`;
  const heroImage = NEXT_SPRINT.heroImage;
  const heroImageAbs = heroImage.startsWith("http") ? heroImage : `https://pointcast.xyz${heroImage}`;
  const primaryLinks = [
    { label: NEXT_SPRINT.related.operatingBoardLabel ?? "Operating board", href: NEXT_SPRINT.related.operatingBoard },
    { label: NEXT_SPRINT.related.builderLabel ?? "Builder", href: NEXT_SPRINT.related.builder },
    { label: "Agent JSON", href: "/next-sprint.json" }
  ];
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": "Next Sprint", "description": pageDescription, "image": heroImage, "jsonLd": jsonLd, "alternates": [{ type: "application/json", href: "/next-sprint.json", title: "Next sprint plan (JSON)" }], "frame": {
    image: heroImageAbs,
    buttons: [
      { label: "Open sprint", action: "link", target: "https://pointcast.xyz/next-sprint" },
      { label: NEXT_SPRINT.related.operatingBoardLabel ?? "Board", action: "link", target: NEXT_SPRINT.related.operatingBoard },
      { label: NEXT_SPRINT.related.builderLabel ?? "Builder", action: "link", target: NEXT_SPRINT.related.builder },
      { label: "Sprint JSON", action: "link", target: "https://pointcast.xyz/next-sprint.json" }
    ]
  }, "data-astro-cid-5ch7idba": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="sprint-page" data-next-sprint data-astro-cid-5ch7idba> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-5ch7idba> <a href="/" data-astro-cid-5ch7idba>Home</a> <span aria-hidden="true" data-astro-cid-5ch7idba>/</span> <span data-astro-cid-5ch7idba>Next Sprint</span> </nav> <header class="hero" data-astro-cid-5ch7idba> <div class="hero__copy" data-astro-cid-5ch7idba> <p class="kicker" data-astro-cid-5ch7idba>NEXT SPRINT / ', "</p> <h1 data-astro-cid-5ch7idba>", '</h1> <p class="dek" data-astro-cid-5ch7idba>', '</p> <div class="hero__actions" aria-label="Primary actions" data-astro-cid-5ch7idba> <a class="btn btn--primary" href="#lanes" data-astro-cid-5ch7idba>Run lanes</a> ', ' </div> </div> <figure class="hero__visual" data-astro-cid-5ch7idba> <img', "", ' width="1672" height="941" data-astro-cid-5ch7idba> <figcaption data-astro-cid-5ch7idba> <span class="mono" data-astro-cid-5ch7idba>HORIZON</span> <strong data-astro-cid-5ch7idba>', '</strong> </figcaption> </figure> </header> <section class="scoreboard" aria-label="Sprint scoreboard" data-astro-cid-5ch7idba> ', ' </section> <section class="band band--intro" data-astro-cid-5ch7idba> <div data-astro-cid-5ch7idba> <p class="kicker" data-astro-cid-5ch7idba>WHY THIS SPRINT</p> <h2 data-astro-cid-5ch7idba>Make the ritual repeatable.</h2> </div> <p data-astro-cid-5ch7idba>\nThe shrine gallery and builder are live. The next sprint makes them\n        operational: expand the route catalog, validate the metadata, tighten\n        the builder presets, and package the right URL for the right audience.\n</p> </section> <section class="lanes" id="lanes" aria-label="Sprint lanes" data-astro-cid-5ch7idba> <div class="section-head" data-astro-cid-5ch7idba> <p class="kicker" data-astro-cid-5ch7idba>LANES</p> <h2 data-astro-cid-5ch7idba>Five workstreams, one board.</h2> </div> <div class="lane-grid" data-astro-cid-5ch7idba> ', ' </div> </section> <section class="band" id="plan" data-astro-cid-5ch7idba> <div class="section-head" data-astro-cid-5ch7idba> <p class="kicker" data-astro-cid-5ch7idba>SPRINT SHAPE</p> <h2 data-astro-cid-5ch7idba>Four checkpoints before the next ritual.</h2> </div> <ol class="days" data-astro-cid-5ch7idba> ', ' </ol> </section> <section class="band checklist" aria-label="Local sprint checklist" data-astro-cid-5ch7idba> <div class="section-head" data-astro-cid-5ch7idba> <p class="kicker" data-astro-cid-5ch7idba>LOCAL CHECKLIST</p> <h2 data-astro-cid-5ch7idba>Track the work in this browser.</h2> <p data-astro-cid-5ch7idba>\nThis checklist is local-only. It helps Mike or an agent keep a working\n          tab during the sprint without creating server state.\n</p> </div> <div class="progress" aria-live="polite" data-astro-cid-5ch7idba> <span class="mono" data-progress-label data-astro-cid-5ch7idba>0 of 0 done</span> <div class="progress__bar" data-astro-cid-5ch7idba><span data-progress-bar data-astro-cid-5ch7idba></span></div> </div> <div class="check-grid" data-astro-cid-5ch7idba> ', ' </div> </section> <section class="band gates" data-astro-cid-5ch7idba> <div class="section-head" data-astro-cid-5ch7idba> <p class="kicker" data-astro-cid-5ch7idba>GATES</p> <h2 data-astro-cid-5ch7idba>Ship fast, keep the line bright.</h2> </div> <ul data-astro-cid-5ch7idba> ', ` </ul> </section> <section class="links" data-astro-cid-5ch7idba> <a href="/shrines" data-astro-cid-5ch7idba>/shrines</a> <a href="/unfurls" data-astro-cid-5ch7idba>/unfurls</a> <a href="/shrines.json" data-astro-cid-5ch7idba>/shrines.json</a> <a href="/unfurls.json" data-astro-cid-5ch7idba>/unfurls.json</a> <a href="/sprint" data-astro-cid-5ch7idba>/sprint</a> </section> </div> <script>
    (function () {
      const root = document.querySelector('[data-next-sprint]');
      if (!root) return;

      const checks = Array.from(root.querySelectorAll('[data-check]'));
      const label = root.querySelector('[data-progress-label]');
      const bar = root.querySelector('[data-progress-bar]');
      const key = 'pc:next-sprint:checks';

      function readState() {
        try {
          return JSON.parse(localStorage.getItem(key) || '{}') || {};
        } catch (error) {
          return {};
        }
      }

      function writeState(state) {
        try {
          localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {}
      }

      function render() {
        const done = checks.filter((check) => check.checked).length;
        const total = checks.length;
        if (label) label.textContent = done + ' of ' + total + ' done';
        if (bar) bar.style.width = total ? ((done / total) * 100).toFixed(0) + '%' : '0%';
      }

      const state = readState();
      checks.forEach((check) => {
        check.checked = Boolean(state[check.getAttribute('data-check')]);
        check.addEventListener('change', () => {
          state[check.getAttribute('data-check')] = check.checked;
          writeState(state);
          render();
        });
      });
      render();
    })();
  <\/script> `])), maybeRenderHead(), NEXT_SPRINT.id, NEXT_SPRINT.title, NEXT_SPRINT.goal, primaryLinks.map((link) => renderTemplate`<a class="btn"${addAttribute(link.href, "href")} data-astro-cid-5ch7idba>${link.label}</a>`), addAttribute(heroImage, "src"), addAttribute(NEXT_SPRINT.heroImageAlt, "alt"), NEXT_SPRINT.horizon, NEXT_SPRINT.scoreboard.map((item) => renderTemplate`<article data-astro-cid-5ch7idba> <span class="mono" data-astro-cid-5ch7idba>${item.label}</span> <strong data-astro-cid-5ch7idba>${item.target}</strong> <small data-astro-cid-5ch7idba>${item.unit}</small> </article>`), NEXT_SPRINT.lanes.map((lane, index) => renderTemplate`<article class="lane"${addAttribute(`--lane: ${palette[index % palette.length]};`, "style")} data-astro-cid-5ch7idba> <div class="lane__head" data-astro-cid-5ch7idba> <span class="mono" data-astro-cid-5ch7idba>${lane.owner}</span> <strong data-astro-cid-5ch7idba>${lane.label}</strong> <p data-astro-cid-5ch7idba>${lane.target}</p> </div> <ul data-astro-cid-5ch7idba> ${lane.tasks.map((task) => renderTemplate`<li data-astro-cid-5ch7idba>${task}</li>`)} </ul> </article>`), NEXT_SPRINT.days.map((day) => renderTemplate`<li data-astro-cid-5ch7idba> <span class="mono" data-astro-cid-5ch7idba>${day.label}</span> <strong data-astro-cid-5ch7idba>${day.title}</strong> <p data-astro-cid-5ch7idba>${day.deliverable}</p> </li>`), NEXT_SPRINT.nextBuilds.map((build) => renderTemplate`<label class="check-item" data-astro-cid-5ch7idba> <input type="checkbox"${addAttribute(build.id, "data-check")} data-astro-cid-5ch7idba> <span data-astro-cid-5ch7idba> <strong data-astro-cid-5ch7idba>${build.title}</strong> <em class="mono" data-astro-cid-5ch7idba>~${build.estMin}m</em> <small data-astro-cid-5ch7idba>${build.output}</small> </span> </label>`), NEXT_SPRINT.gates.map((gate) => renderTemplate`<li data-astro-cid-5ch7idba>${gate}</li>`)) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/next-sprint.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/next-sprint.astro";
const $$url = "/next-sprint";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$NextSprint,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
