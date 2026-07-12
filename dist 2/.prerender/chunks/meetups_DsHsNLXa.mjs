import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { M as MEETUP_SERIES, a as LOCAL_AREA_RADIUS } from './localAreas_mKBCCGeN.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Meetups = createComponent(($$result, $$props, $$slots) => {
  const title = "Mike-led Meetups";
  const description = "A community meetup page for Mike Hoydich led events inside the 25-mile PointCast participation radius.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://pointcast.xyz/meetups",
    name: title,
    description,
    url: "https://pointcast.xyz/meetups",
    hasPart: MEETUP_SERIES.map((series) => ({
      "@type": "EventSeries",
      name: series.title,
      description: series.format,
      location: series.where
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-552kadhi": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="page" data-astro-cid-552kadhi> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-552kadhi> <a href="/" data-astro-cid-552kadhi>Home</a> <span data-astro-cid-552kadhi>/</span> <a href="/areas" data-astro-cid-552kadhi>areas</a> <span data-astro-cid-552kadhi>/</span> <span data-astro-cid-552kadhi>meetups</span> </nav> <header class="hero" data-astro-cid-552kadhi> <p class="kicker" data-astro-cid-552kadhi>MIKE-LED EVENTS · SOUTH BAY TABLES</p> <h1 data-astro-cid-552kadhi>A public call sheet for small useful gatherings.</h1> <p data-astro-cid-552kadhi>\nCourt windows, beach walks, build nights, honey tables, and the first\n        University of El Segundo sessions can all land here. The promise is\n        lightweight: one place, one reason to show up, one receipt afterward.\n</p> </header> <section class="section" aria-labelledby="series-heading" data-astro-cid-552kadhi> <div class="section__head" data-astro-cid-552kadhi> <p class="kicker" data-astro-cid-552kadhi>SEED SERIES</p> <h2 id="series-heading" data-astro-cid-552kadhi>The first four formats.</h2> </div> <div class="series" data-astro-cid-552kadhi> ', ' </div> </section> <section class="section signup" aria-labelledby="signup-heading" data-astro-cid-552kadhi> <div data-astro-cid-552kadhi> <p class="kicker" data-astro-cid-552kadhi>RSVP NOTE</p> <h2 id="signup-heading" data-astro-cid-552kadhi>Raise your hand for the next one.</h2> <p data-astro-cid-552kadhi>\nThis is a browser-local call sheet until the identity layer is ready.\n          It gives Mike and PointCast the exact shape of a future RSVP: who,\n          which series, where from, and what they can bring.\n</p> <div class="saved" data-meetup-saved hidden data-astro-cid-552kadhi></div> </div> <form class="form" data-meetup-form data-astro-cid-552kadhi> <label data-astro-cid-552kadhi> <span data-astro-cid-552kadhi>Name</span> <input name="name" type="text" required data-astro-cid-552kadhi> </label> <label data-astro-cid-552kadhi> <span data-astro-cid-552kadhi>Neighborhood</span> <input name="neighborhood" type="text" required data-astro-cid-552kadhi> </label> <label data-astro-cid-552kadhi> <span data-astro-cid-552kadhi>Series</span> <select name="series" required data-astro-cid-552kadhi> ', ' </select> </label> <label data-astro-cid-552kadhi> <span data-astro-cid-552kadhi>What you can bring</span> <textarea name="bring" rows="4" data-astro-cid-552kadhi></textarea> </label> <div class="actions" data-astro-cid-552kadhi> <button type="submit" data-astro-cid-552kadhi>Save RSVP note</button> <button type="button" data-clear-meetup data-astro-cid-552kadhi>Clear</button> </div> </form> </section> <section class="section split" aria-labelledby="radius-heading" data-astro-cid-552kadhi> <div data-astro-cid-552kadhi> <p class="kicker" data-astro-cid-552kadhi>WHY 25 MILES</p> <h2 id="radius-heading" data-astro-cid-552kadhi>A meetup radius should feel repeatable.</h2> </div> <p data-astro-cid-552kadhi> ', ` A meetup is not content until people can
        return, recognize each other, and bring the next person.
</p> </section> <aside class="related" data-astro-cid-552kadhi> <a href="/paddle-exchange" data-astro-cid-552kadhi>Paddle Tide</a> <a href="/university-of-el-segundo" data-astro-cid-552kadhi>University of El Segundo</a> <a href="/honey-league" data-astro-cid-552kadhi>Honey League</a> <a href="/areas.json" data-astro-cid-552kadhi>/areas.json</a> </aside> </div> <script>
    (function () {
      var key = 'pc:meetup-rsvp';
      var form = document.querySelector('[data-meetup-form]');
      var saved = document.querySelector('[data-meetup-saved]');
      var clear = document.querySelector('[data-clear-meetup]');
      if (!form || !saved) return;

      function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
          return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
        });
      }

      function titleFor(slug) {
        var option = form.querySelector('option[value="' + slug + '"]');
        return option ? option.textContent : slug;
      }

      function render(note) {
        if (!note || !note.name) {
          saved.hidden = true;
          saved.innerHTML = '';
          return;
        }
        saved.hidden = false;
        saved.innerHTML =
          '<p>saved locally</p>' +
          '<h3>' + escapeHtml(note.name) + '</h3>' +
          '<span>' + escapeHtml(note.neighborhood) + ' · ' + escapeHtml(titleFor(note.series)) + '</span>' +
          '<small>' + escapeHtml(note.bring || 'bring note open') + '</small>';
      }

      function readSaved() {
        try {
          return JSON.parse(localStorage.getItem(key) || 'null');
        } catch (error) {
          return null;
        }
      }

      var note = readSaved();
      if (note) {
        Array.from(form.elements).forEach(function (element) {
          if (element.name && note[element.name]) element.value = note[element.name];
        });
      }
      render(note);

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var data = new FormData(form);
        var next = {
          name: data.get('name') || '',
          neighborhood: data.get('neighborhood') || '',
          series: data.get('series') || '',
          bring: data.get('bring') || '',
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(next));
        render(next);
      });

      if (clear) {
        clear.addEventListener('click', function () {
          localStorage.removeItem(key);
          form.reset();
          render(null);
        });
      }
    })();
  <\/script> `])), maybeRenderHead(), MEETUP_SERIES.map((series, index) => renderTemplate`<article class="event"${addAttribute(series.slug, "data-series")} data-astro-cid-552kadhi> <div class="event__date" data-astro-cid-552kadhi> <span data-astro-cid-552kadhi>0${index + 1}</span> <small data-astro-cid-552kadhi>${series.cadence}</small> </div> <div class="event__body" data-astro-cid-552kadhi> <h3 data-astro-cid-552kadhi>${series.title}</h3> <p data-astro-cid-552kadhi>${series.format}</p> <dl data-astro-cid-552kadhi> <div data-astro-cid-552kadhi><dt data-astro-cid-552kadhi>Where</dt><dd data-astro-cid-552kadhi>${series.where}</dd></div> <div data-astro-cid-552kadhi><dt data-astro-cid-552kadhi>Connects</dt><dd data-astro-cid-552kadhi>${series.connectedArea}</dd></div> </dl> </div> </article>`), MEETUP_SERIES.map((series) => renderTemplate`<option${addAttribute(series.slug, "value")} data-astro-cid-552kadhi>${series.title}</option>`), LOCAL_AREA_RADIUS.policy) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/meetups.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/meetups.astro";
const $$url = "/meetups";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Meetups,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
