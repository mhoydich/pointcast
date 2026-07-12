import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { a as LOCAL_AREA_RADIUS, b as HONEY_LEAGUE_SEASON, H as HONEY_LEAGUE_POINTS } from './localAreas_mKBCCGeN.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$HoneyLeague = createComponent(($$result, $$props, $$slots) => {
  const title = "Local Honey League";
  const description = "A local Honey League for the PointCast 25-mile radius: soft standings for helpful acts, court play, local tables, honey notes, and published receipts.";
  const sampleStandings = [
    { name: "Main Street Table", points: 12, note: "hosted, played, published" },
    { name: "Court Craft Crew", points: 9, note: "paddle loans and doubles" },
    { name: "First Tide Hosts", points: 7, note: "course demos and notes" },
    { name: "Sea Glass Shelf", points: 5, note: "library setup" }
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    "@id": "https://pointcast.xyz/honey-league",
    name: title,
    description,
    url: "https://pointcast.xyz/honey-league",
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: LOCAL_AREA_RADIUS.anchor.coords.latitude,
        longitude: LOCAL_AREA_RADIUS.anchor.coords.longitude
      },
      geoRadius: LOCAL_AREA_RADIUS.radiusMeters
    }
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-csg5h7et": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="page" data-astro-cid-csg5h7et> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-csg5h7et> <a href="/" data-astro-cid-csg5h7et>Home</a> <span data-astro-cid-csg5h7et>/</span> <a href="/areas" data-astro-cid-csg5h7et>areas</a> <span data-astro-cid-csg5h7et>/</span> <span data-astro-cid-csg5h7et>honey-league</span> </nav> <header class="hero" data-astro-cid-csg5h7et> <div data-astro-cid-csg5h7et> <p class="kicker" data-astro-cid-csg5h7et>LOCAL HONEY LEAGUE · SEASON ZERO</p> <h1 data-astro-cid-csg5h7et>Keep score for the helpful stuff.</h1> <p data-astro-cid-csg5h7et>\nA soft local league for reciprocal acts: play, lend, host, bring,\n          publish. It can sit beside pickleball without becoming only a sports\n          ladder, and it can carry local honey without becoming a vendor table.\n</p> </div> <div class="comb" aria-label="Honey League scorecomb" data-astro-cid-csg5h7et> ', ' </div> </header> <section class="section season" aria-labelledby="season-heading" data-astro-cid-csg5h7et> <div data-astro-cid-csg5h7et> <p class="kicker" data-astro-cid-csg5h7et>SEASON FORMAT</p> <h2 id="season-heading" data-astro-cid-csg5h7et>', "</h2> </div> <dl data-astro-cid-csg5h7et> <div data-astro-cid-csg5h7et><dt data-astro-cid-csg5h7et>Length</dt><dd data-astro-cid-csg5h7et>", "</dd></div> <div data-astro-cid-csg5h7et><dt data-astro-cid-csg5h7et>Cadence</dt><dd data-astro-cid-csg5h7et>", "</dd></div> <div data-astro-cid-csg5h7et><dt data-astro-cid-csg5h7et>Cap</dt><dd data-astro-cid-csg5h7et>", '</dd></div> </dl> </section> <section class="section" aria-labelledby="points-heading" data-astro-cid-csg5h7et> <div class="section__head" data-astro-cid-csg5h7et> <p class="kicker" data-astro-cid-csg5h7et>POINTS</p> <h2 id="points-heading" data-astro-cid-csg5h7et>Simple scoring, no status theater.</h2> </div> <div class="points" data-astro-cid-csg5h7et> ', ' </div> </section> <section class="section board" aria-labelledby="board-heading" data-astro-cid-csg5h7et> <div data-astro-cid-csg5h7et> <p class="kicker" data-astro-cid-csg5h7et>SAMPLE BOARD</p> <h2 id="board-heading" data-astro-cid-csg5h7et>What the first standings could look like.</h2> </div> <ol data-astro-cid-csg5h7et> ', ' </ol> </section> <section class="section claim" aria-labelledby="claim-heading" data-astro-cid-csg5h7et> <div data-astro-cid-csg5h7et> <p class="kicker" data-astro-cid-csg5h7et>LOCAL CLAIM</p> <h2 id="claim-heading" data-astro-cid-csg5h7et>Log one Season Zero act.</h2> <p data-astro-cid-csg5h7et>\nBrowser-local for the prototype. The important rule is evidence:\n          name the act, the place, and the receipt it could become.\n</p> <div class="saved" data-honey-saved hidden data-astro-cid-csg5h7et></div> </div> <form class="form" data-honey-form data-astro-cid-csg5h7et> <label data-astro-cid-csg5h7et> <span data-astro-cid-csg5h7et>Name or team</span> <input name="name" type="text" required data-astro-cid-csg5h7et> </label> <label data-astro-cid-csg5h7et> <span data-astro-cid-csg5h7et>Action</span> <select name="action" required data-astro-cid-csg5h7et> ', ' </select> </label> <label data-astro-cid-csg5h7et> <span data-astro-cid-csg5h7et>Where</span> <input name="where" type="text" required data-astro-cid-csg5h7et> </label> <label data-astro-cid-csg5h7et> <span data-astro-cid-csg5h7et>Receipt note</span> <textarea name="receipt" rows="4" data-astro-cid-csg5h7et></textarea> </label> <div class="actions" data-astro-cid-csg5h7et> <button type="submit" data-astro-cid-csg5h7et>Save local claim</button> <button type="button" data-clear-honey data-astro-cid-csg5h7et>Clear</button> </div> </form> </section> <section class="section prizes" aria-labelledby="prizes-heading" data-astro-cid-csg5h7et> <div class="section__head" data-astro-cid-csg5h7et> <p class="kicker" data-astro-cid-csg5h7et>CLOSEOUT</p> <h2 id="prizes-heading" data-astro-cid-csg5h7et>Prizes should stay small and useful.</h2> </div> <ul data-astro-cid-csg5h7et> ', ` </ul> </section> <aside class="related" data-astro-cid-csg5h7et> <a href="/meetups" data-astro-cid-csg5h7et>Honey Saturday on Meetups</a> <a href="/paddle-exchange" data-astro-cid-csg5h7et>Paddle library points</a> <a href="/university-of-el-segundo" data-astro-cid-csg5h7et>Honey & Garden track</a> <a href="/areas.json" data-astro-cid-csg5h7et>/areas.json</a> </aside> </div> <script>
    (function () {
      var key = 'pc:honey-league-claim';
      var form = document.querySelector('[data-honey-form]');
      var saved = document.querySelector('[data-honey-saved]');
      var clear = document.querySelector('[data-clear-honey]');
      if (!form || !saved) return;

      function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
          return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
        });
      }

      function render(claim) {
        if (!claim || !claim.name) {
          saved.hidden = true;
          saved.innerHTML = '';
          return;
        }
        saved.hidden = false;
        saved.innerHTML =
          '<p>saved locally</p>' +
          '<h3>' + escapeHtml(claim.name) + '</h3>' +
          '<span>' + escapeHtml(claim.action) + ' · ' + escapeHtml(claim.where) + '</span>' +
          '<small>' + escapeHtml(claim.receipt || 'receipt note open') + '</small>';
      }

      function readSaved() {
        try {
          return JSON.parse(localStorage.getItem(key) || 'null');
        } catch (error) {
          return null;
        }
      }

      var claim = readSaved();
      if (claim) {
        Array.from(form.elements).forEach(function (element) {
          if (element.name && claim[element.name]) element.value = claim[element.name];
        });
      }
      render(claim);

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var data = new FormData(form);
        var next = {
          name: data.get('name') || '',
          action: data.get('action') || '',
          where: data.get('where') || '',
          receipt: data.get('receipt') || '',
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
  <\/script> `])), maybeRenderHead(), sampleStandings.map((row, index) => renderTemplate`<div class="cell"${addAttribute(`--i:${index};`, "style")} data-astro-cid-csg5h7et> <span data-astro-cid-csg5h7et>${row.points}</span> <small data-astro-cid-csg5h7et>${row.name}</small> </div>`), HONEY_LEAGUE_SEASON.name, HONEY_LEAGUE_SEASON.length, HONEY_LEAGUE_SEASON.cadence, HONEY_LEAGUE_SEASON.cap, HONEY_LEAGUE_POINTS.map((item) => renderTemplate`<article class="point" data-astro-cid-csg5h7et> <span data-astro-cid-csg5h7et>${item.points} pt${item.points === 1 ? "" : "s"}</span> <h3 data-astro-cid-csg5h7et>${item.action}</h3> <p data-astro-cid-csg5h7et>${item.detail}</p> </article>`), sampleStandings.map((row) => renderTemplate`<li data-astro-cid-csg5h7et> <strong data-astro-cid-csg5h7et>${row.name}</strong> <span data-astro-cid-csg5h7et>${row.points} points</span> <small data-astro-cid-csg5h7et>${row.note}</small> </li>`), HONEY_LEAGUE_POINTS.map((item) => renderTemplate`<option${addAttribute(item.action, "value")} data-astro-cid-csg5h7et>${item.action} · ${item.points} pt${item.points === 1 ? "" : "s"}</option>`), HONEY_LEAGUE_SEASON.prizes.map((prize) => renderTemplate`<li data-astro-cid-csg5h7et>${prize}</li>`)) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/honey-league.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/honey-league.astro";
const $$url = "/honey-league";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$HoneyLeague,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
