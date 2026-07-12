import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead } from './prerender_CmTjnOuJ.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$ListeningRoom = createComponent(($$result, $$props, $$slots) => {
  const title = "PointCast Listening Room";
  const description = "An interactive space-sparkle listening room for PointCast, sponsored by Nouns Cola and Get Good Feels.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": "https://pointcast.xyz/listening-room",
    name: title,
    description,
    url: "https://pointcast.xyz/listening-room",
    applicationCategory: "MusicApplication",
    operatingSystem: "Web",
    isPartOf: {
      "@type": "WebSite",
      name: "PointCast",
      url: "https://pointcast.xyz"
    },
    sponsor: [
      { "@type": "Organization", name: "Nouns Cola", url: "https://pointcast.xyz/nouns-cola" },
      { "@type": "Organization", name: "Get Good Feels", url: "https://getgoodfeels.net" }
    ]
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/listening-room/pointcast-listening-room-space.png", "jsonLd": jsonLd, "alternates": [
    { type: "application/json", href: "/listening-room.json", title: "Listening room manifest (JSON)" }
  ], "frame": {
    image: "https://pointcast.xyz/images/listening-room/pointcast-listening-room-space.png",
    buttons: [
      { label: "Open room", action: "link", target: "https://pointcast.xyz/listening-room" },
      { label: "Open Spotify", action: "link", target: "https://open.spotify.com/playlist/35WC68tu9rrBoRrW3N2n0M?si=3543c0d357294d9f" },
      { label: "Nouns Cola", action: "link", target: "https://pointcast.xyz/nouns-cola" },
      { label: "Room JSON", action: "link", target: "https://pointcast.xyz/listening-room.json" }
    ]
  }, "data-astro-cid-db4cunp4": true }, { "default": ($$result2) => renderTemplate(_a || (_a = __template([" ", `<div class="room-page" data-room-page data-astro-cid-db4cunp4> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-db4cunp4> <a href="/" data-astro-cid-db4cunp4>Home</a> <span aria-hidden="true" data-astro-cid-db4cunp4>/</span> <span data-astro-cid-db4cunp4>listening room</span> </nav> <section class="hero" data-scene="nebula" data-astro-cid-db4cunp4> <img class="hero__art" src="/images/listening-room/pointcast-listening-room-space.png" alt="Space sparkle listening room with velvet couches, hi-fi speakers, and a cosmic starfield" width="1792" height="1024" loading="eager" decoding="async" data-astro-cid-db4cunp4> <canvas class="hero__sparkles" data-sparkles aria-hidden="true" data-astro-cid-db4cunp4></canvas> <div class="hero__veil" data-astro-cid-db4cunp4></div> <div class="hero__top" data-astro-cid-db4cunp4> <div class="hero__meta" data-astro-cid-db4cunp4> <span class="mono" data-astro-cid-db4cunp4>PointCast</span> <span class="mono" data-astro-cid-db4cunp4>Listening Room</span> </div> <div class="hero__sponsors" data-astro-cid-db4cunp4> <a href="/nouns-cola" data-astro-cid-db4cunp4>Sponsored by Nouns Cola</a> <a href="https://getgoodfeels.net" target="_blank" rel="noopener" data-astro-cid-db4cunp4>getgoodfeels.net</a> </div> </div> <div class="hero__copy" data-astro-cid-db4cunp4> <p class="kicker" data-astro-cid-db4cunp4>SPACE SPARKLE / LIVE ROOM</p> <h1 data-astro-cid-db4cunp4>Put the site in orbit.</h1> <p class="dek" data-astro-cid-db4cunp4>
A cosmic lounge for the PointCast soundtrack: dial the glow, drift the
          stars, cut into focus mode, and let the playlist hold the room.
</p> </div> <div class="hero__panel" data-astro-cid-db4cunp4> <div class="panel__modes" role="tablist" aria-label="Scene mode" data-astro-cid-db4cunp4> <button type="button" class="mode is-active" data-mode="nebula" data-astro-cid-db4cunp4>Nebula</button> <button type="button" class="mode" data-mode="cola" data-astro-cid-db4cunp4>Cola</button> <button type="button" class="mode" data-mode="night" data-astro-cid-db4cunp4>Night</button> </div> <div class="panel__sliders" data-astro-cid-db4cunp4> <label class="slider" data-astro-cid-db4cunp4> <span class="mono" data-astro-cid-db4cunp4>Sparkle</span> <input type="range" min="20" max="120" value="72" data-range="sparkle" data-astro-cid-db4cunp4> </label> <label class="slider" data-astro-cid-db4cunp4> <span class="mono" data-astro-cid-db4cunp4>Drift</span> <input type="range" min="8" max="40" value="18" data-range="drift" data-astro-cid-db4cunp4> </label> </div> <div class="panel__actions" data-astro-cid-db4cunp4> <button type="button" class="panel-btn" data-action="focus" data-astro-cid-db4cunp4>Focus mode</button> <button type="button" class="panel-btn" data-action="burst" data-astro-cid-db4cunp4>Sparkle burst</button> <a class="panel-btn panel-btn--link" href="https://open.spotify.com/playlist/35WC68tu9rrBoRrW3N2n0M?si=3543c0d357294d9f" target="_blank" rel="noopener" data-astro-cid-db4cunp4>Open Spotify</a> </div> </div> </section> <section class="dock" data-astro-cid-db4cunp4> <div class="player" data-astro-cid-db4cunp4> <iframe src="https://open.spotify.com/embed/playlist/35WC68tu9rrBoRrW3N2n0M" width="100%" height="352" frameborder="0" allowfullscreen allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="PointCast Listening Room playlist" data-astro-cid-db4cunp4></iframe> </div> <aside class="ledger" data-astro-cid-db4cunp4> <div class="ledger__section" data-astro-cid-db4cunp4> <span class="mono" data-astro-cid-db4cunp4>Room signal</span> <strong data-signal data-astro-cid-db4cunp4>nebula glow</strong> <p data-note data-astro-cid-db4cunp4>Velvet magenta, silver sparkle, slow drift.</p> </div> <div class="ledger__section" data-astro-cid-db4cunp4> <span class="mono" data-astro-cid-db4cunp4>Local memory</span> <strong data-astro-cid-db4cunp4>saved in this browser</strong> <p data-astro-cid-db4cunp4>The room remembers your scene and slider choices.</p> </div> <div class="ledger__section" data-astro-cid-db4cunp4> <span class="mono" data-astro-cid-db4cunp4>Archive</span> <a href="/b/0339" data-astro-cid-db4cunp4>Block 0339</a> <a href="/listening-room.json" data-astro-cid-db4cunp4>JSON mirror</a> </div> </aside> </section> </div> <script>
    (function () {
      const root = document.querySelector('[data-room-page]');
      if (!root) return;

      const hero = root.querySelector('.hero');
      const canvas = root.querySelector('[data-sparkles]');
      const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
      const modeButtons = Array.from(root.querySelectorAll('[data-mode]'));
      const sparkleRange = root.querySelector('[data-range="sparkle"]');
      const driftRange = root.querySelector('[data-range="drift"]');
      const signal = root.querySelector('[data-signal]');
      const note = root.querySelector('[data-note]');
      const storageKey = 'pc:listening-room:v1';
      const state = {
        mode: 'nebula',
        sparkle: 72,
        drift: 18,
        focus: false,
        burst: 0,
      };

      const modes = {
        nebula: {
          signal: 'nebula glow',
          note: 'Velvet magenta, silver sparkle, slow drift.',
          colors: ['255,109,214', '125,211,252', '255,255,255'],
        },
        cola: {
          signal: 'cola fizz',
          note: 'Cherry red, golden bubbles, green sponsor edge-light.',
          colors: ['232,77,106', '247,195,37', '44,197,160'],
        },
        night: {
          signal: 'deep night',
          note: 'Cool blue stars, low lounge, softer reflections.',
          colors: ['106,167,255', '196,226,255', '255,255,255'],
        },
      };

      function load() {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
          if (saved.mode && modes[saved.mode]) state.mode = saved.mode;
          if (saved.sparkle) state.sparkle = Number(saved.sparkle);
          if (saved.drift) state.drift = Number(saved.drift);
        } catch (error) {}
      }

      function save() {
        try {
          localStorage.setItem(storageKey, JSON.stringify({
            mode: state.mode,
            sparkle: state.sparkle,
            drift: state.drift,
          }));
        } catch (error) {}
      }

      function applyUI() {
        hero.setAttribute('data-scene', state.mode);
        modeButtons.forEach((button) => {
          button.classList.toggle('is-active', button.getAttribute('data-mode') === state.mode);
        });
        if (sparkleRange) sparkleRange.value = String(state.sparkle);
        if (driftRange) driftRange.value = String(state.drift);
        if (signal) signal.textContent = modes[state.mode].signal;
        if (note) note.textContent = modes[state.mode].note;
        document.documentElement.toggleAttribute('data-room-focus', state.focus);
      }

      function resize() {
        if (!canvas || !ctx) return;
        const rect = hero.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      let particles = [];
      function buildParticles() {
        const rect = hero.getBoundingClientRect();
        const count = Math.max(28, Math.floor(state.sparkle));
        particles = Array.from({ length: count }, (_, index) => ({
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          r: Math.random() * 2.4 + 0.6,
          a: Math.random() * Math.PI * 2,
          s: Math.random() * 0.35 + 0.05,
          tw: Math.random() * 0.02 + 0.01,
          color: modes[state.mode].colors[index % modes[state.mode].colors.length],
        }));
      }

      function draw() {
        if (!canvas || !ctx) return;
        const rect = hero.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
        particles.forEach((p) => {
          p.a += p.tw;
          p.y += p.s * (state.drift / 18);
          if (p.y > rect.height + 12) {
            p.y = -12;
            p.x = Math.random() * rect.width;
          }
          const alpha = 0.35 + (Math.sin(p.a) + 1) * 0.25 + state.burst;
          ctx.beginPath();
          ctx.fillStyle = 'rgba(' + p.color + ',' + Math.min(alpha, 1) + ')';
          ctx.arc(p.x, p.y, p.r + state.burst * 1.2, 0, Math.PI * 2);
          ctx.fill();
        });
        state.burst *= 0.92;
        requestAnimationFrame(draw);
      }

      modeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          state.mode = button.getAttribute('data-mode') || 'nebula';
          buildParticles();
          applyUI();
          save();
        });
      });

      if (sparkleRange) {
        sparkleRange.addEventListener('input', () => {
          state.sparkle = Number(sparkleRange.value);
          buildParticles();
          save();
        });
      }

      if (driftRange) {
        driftRange.addEventListener('input', () => {
          state.drift = Number(driftRange.value);
          save();
        });
      }

      root.querySelector('[data-action="focus"]').addEventListener('click', () => {
        state.focus = !state.focus;
        applyUI();
      });

      root.querySelector('[data-action="burst"]').addEventListener('click', () => {
        state.burst = 0.65;
      });

      window.addEventListener('resize', () => {
        resize();
        buildParticles();
      });

      load();
      applyUI();
      resize();
      buildParticles();
      draw();
    })();
  <\/script> `])), maybeRenderHead()) })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/listening-room.astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/listening-room.astro";
const $$url = "/listening-room";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ListeningRoom,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
