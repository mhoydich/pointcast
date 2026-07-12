import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, b as addAttribute, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { a as LOCAL_AREA_RADIUS, P as PADDLE_LIBRARY_SLOTS, d as PADDLE_PROFILE_FIELDS, e as PADDLE_EXCHANGE_MODES } from './localAreas_mKBCCGeN.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$PaddleExchange = createComponent(($$result, $$props, $$slots) => {
  const title = "Paddle Tide Exchange";
  const description = "A local pickleball paddle exchange and library for the 25-mile PointCast participation radius, with profile registration, DUPR handle field, and trade or loan intent.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://pointcast.xyz/paddle-exchange",
    name: title,
    description,
    url: "https://pointcast.xyz/paddle-exchange",
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
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-lsj3mcir": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", '<div class="page" data-astro-cid-lsj3mcir> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-lsj3mcir> <a href="/" data-astro-cid-lsj3mcir>Home</a> <span data-astro-cid-lsj3mcir>/</span> <a href="/areas" data-astro-cid-lsj3mcir>areas</a> <span data-astro-cid-lsj3mcir>/</span> <span data-astro-cid-lsj3mcir>paddle-exchange</span> </nav> <header class="hero" data-astro-cid-lsj3mcir> <div data-astro-cid-lsj3mcir> <p class="kicker" data-astro-cid-lsj3mcir>PADDLE TIDE · LOCAL LIBRARY · ', ' MI</p> <h1 data-astro-cid-lsj3mcir>Register the paddle you use, then make the shelf visible.</h1> <p data-astro-cid-lsj3mcir>\nPlayers can list their profile, DUPR handle or link, usual court,\n          current paddle, and what they would trade, lend, try, or donate into\n          a neighborhood library. First pass stays close and simple.\n</p> </div> <div class="shelf" aria-label="Paddle library shelf" data-astro-cid-lsj3mcir> <span class="shelf__label" data-astro-cid-lsj3mcir>NOUN BUOY SHELF</span> <div class="shelf__rail" data-astro-cid-lsj3mcir> <span class="paddle paddle--one" data-astro-cid-lsj3mcir></span> <span class="paddle paddle--two" data-astro-cid-lsj3mcir></span> <span class="paddle paddle--three" data-astro-cid-lsj3mcir></span> <span class="paddle paddle--four" data-astro-cid-lsj3mcir></span> </div> <p data-astro-cid-lsj3mcir>trial, loan, trade, return</p> </div> </header> <section class="section modes" aria-label="Exchange modes" data-astro-cid-lsj3mcir> ', ' </section> <section class="section register" aria-labelledby="register-heading" data-astro-cid-lsj3mcir> <div class="register__copy" data-astro-cid-lsj3mcir> <p class="kicker" data-astro-cid-lsj3mcir>PROFILE REGISTRY</p> <h2 id="register-heading" data-astro-cid-lsj3mcir>A v0 profile you can fill out now.</h2> <p data-astro-cid-lsj3mcir>\nThis stores only in this browser for the prototype. The shape is the\n          useful part: the eventual backend can lift these exact fields into a\n          shared roster after the first real profiles exist.\n</p> <div class="profile-card" data-profile-card hidden data-astro-cid-lsj3mcir></div> </div> <form class="form" data-paddle-form data-astro-cid-lsj3mcir> ', ' <fieldset class="checks" data-astro-cid-lsj3mcir> <legend data-astro-cid-lsj3mcir>Open to</legend> <label data-astro-cid-lsj3mcir><input type="checkbox" name="openTo" value="trade" data-astro-cid-lsj3mcir> Trade</label> <label data-astro-cid-lsj3mcir><input type="checkbox" name="openTo" value="loan" data-astro-cid-lsj3mcir> Loan</label> <label data-astro-cid-lsj3mcir><input type="checkbox" name="openTo" value="try" data-astro-cid-lsj3mcir> Try</label> <label data-astro-cid-lsj3mcir><input type="checkbox" name="openTo" value="library" data-astro-cid-lsj3mcir> Library donation</label> </fieldset> <div class="actions" data-astro-cid-lsj3mcir> <button type="submit" data-astro-cid-lsj3mcir>Save local profile</button> <button type="button" data-clear-profile data-astro-cid-lsj3mcir>Clear</button> </div> </form> </section> <section class="section" aria-labelledby="library-heading" data-astro-cid-lsj3mcir> <div class="section__head" data-astro-cid-lsj3mcir> <p class="kicker" data-astro-cid-lsj3mcir>LIBRARY TARGETS</p> <h2 id="library-heading" data-astro-cid-lsj3mcir>Start with feels, not brands.</h2> </div> <div class="library" data-astro-cid-lsj3mcir> ', ` </div> </section> <aside class="related" data-astro-cid-lsj3mcir> <a href="/meetups" data-astro-cid-lsj3mcir>Open meetup calendar</a> <a href="/university-of-el-segundo" data-astro-cid-lsj3mcir>Court Craft at UES</a> <a href="/honey-league" data-astro-cid-lsj3mcir>Score a helpful act</a> <a href="/areas.json" data-astro-cid-lsj3mcir>JSON mirror</a> </aside> </div> <script>
    (function () {
      var key = 'pc:paddle-exchange-profile';
      var form = document.querySelector('[data-paddle-form]');
      var card = document.querySelector('[data-profile-card]');
      var clear = document.querySelector('[data-clear-profile]');
      if (!form || !card) return;

      function escapeHtml(value) {
        return String(value || '').replace(/[&<>"']/g, function (char) {
          return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
        });
      }

      function render(profile) {
        if (!profile || !profile.name) {
          card.hidden = true;
          card.innerHTML = '';
          return;
        }
        card.hidden = false;
        card.innerHTML =
          '<p class="profile-card__label">saved locally</p>' +
          '<h3>' + escapeHtml(profile.name) + '</h3>' +
          '<p>' + escapeHtml(profile.neighborhood) + ' · ' + escapeHtml(profile.currentPaddle) + '</p>' +
          '<dl>' +
          '<div><dt>DUPR</dt><dd>' + escapeHtml(profile.dupr || 'not listed') + '</dd></div>' +
          '<div><dt>Court</dt><dd>' + escapeHtml(profile.court || 'open') + '</dd></div>' +
          '<div><dt>Open to</dt><dd>' + escapeHtml((profile.openTo || []).join(', ') || 'not specified') + '</dd></div>' +
          '</dl>';
      }

      function readSaved() {
        try {
          return JSON.parse(localStorage.getItem(key) || 'null');
        } catch (error) {
          return null;
        }
      }

      function fill(profile) {
        if (!profile) return;
        Array.from(form.elements).forEach(function (element) {
          if (!element.name) return;
          if (element.type === 'checkbox') {
            element.checked = (profile.openTo || []).includes(element.value);
          } else if (profile[element.name]) {
            element.value = profile[element.name];
          }
        });
      }

      var saved = readSaved();
      render(saved);
      fill(saved);

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var data = new FormData(form);
        var profile = {
          name: data.get('name') || '',
          neighborhood: data.get('neighborhood') || '',
          dupr: data.get('dupr') || '',
          currentPaddle: data.get('currentPaddle') || '',
          openPaddles: data.get('openPaddles') || '',
          court: data.get('court') || '',
          notes: data.get('notes') || '',
          openTo: data.getAll('openTo'),
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(key, JSON.stringify(profile));
        render(profile);
      });

      if (clear) {
        clear.addEventListener('click', function () {
          localStorage.removeItem(key);
          form.reset();
          render(null);
        });
      }
    })();
  <\/script> `])), maybeRenderHead(), LOCAL_AREA_RADIUS.radiusMiles, PADDLE_EXCHANGE_MODES.map((mode) => renderTemplate`<article class="mode" data-astro-cid-lsj3mcir> <span data-astro-cid-lsj3mcir>${mode.label}</span> <p data-astro-cid-lsj3mcir>${mode.promise}</p> <small data-astro-cid-lsj3mcir>${mode.signal}</small> </article>`), PADDLE_PROFILE_FIELDS.map((field) => renderTemplate`<label${addAttribute(field.kind === "textarea" ? "field field--wide" : "field", "class")} data-astro-cid-lsj3mcir> <span data-astro-cid-lsj3mcir>${field.label}${field.required ? " *" : ""}</span> ${field.kind === "textarea" ? renderTemplate`<textarea${addAttribute(field.id, "name")} rows="4"${addAttribute(field.required, "required")} data-astro-cid-lsj3mcir></textarea>` : renderTemplate`<input${addAttribute(field.id, "name")} type="text"${addAttribute(field.required, "required")} data-astro-cid-lsj3mcir>`} </label>`), PADDLE_LIBRARY_SLOTS.map((slot) => renderTemplate`<article class="slot" data-astro-cid-lsj3mcir> <span data-astro-cid-lsj3mcir>${slot.status}</span> <h3 data-astro-cid-lsj3mcir>${slot.name}</h3> <p data-astro-cid-lsj3mcir>${slot.feel}</p> <small data-astro-cid-lsj3mcir>steward: ${slot.steward}</small> </article>`)) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/paddle-exchange.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/paddle-exchange.astro";
const $$url = "/paddle-exchange";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$PaddleExchange,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
