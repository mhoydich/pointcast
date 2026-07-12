import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { c as checkoutHost } from './commerce_DCJpkdIb.mjs';
import { r as resolveMoodTemplate } from './moods-soundtracks_CEitMVRv.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
async function getStaticPaths() {
  const blocks = await getCollection("blocks", ({ data }) => !data.draft);
  const products = await getCollection("products", ({ data }) => !data.draft);
  const moods = /* @__PURE__ */ new Set();
  blocks.forEach((b) => {
    if (b.data.mood) moods.add(b.data.mood);
  });
  products.forEach((p) => {
    (p.data.pairsWithMood ?? []).forEach((m) => moods.add(m));
  });
  return Array.from(moods).map((mood) => ({
    params: { mood },
    props: { mood }
  }));
}
const $$mood = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$mood;
  const { mood } = Astro2.props;
  const template = resolveMoodTemplate(mood);
  const [allBlocks, allProducts] = await Promise.all([
    getCollection("blocks", ({ data }) => !data.draft),
    getCollection("products", ({ data }) => !data.draft)
  ]);
  const blocks = allBlocks.filter((b) => b.data.mood === mood).sort((a, b) => b.data.timestamp.getTime() - a.data.timestamp.getTime());
  const products = allProducts.filter((p) => (p.data.pairsWithMood ?? []).includes(mood)).sort((a, b) => b.data.addedAt.getTime() - a.data.addedAt.getTime());
  const vibeProfile = products.find((p) => p.data.vibeProfile)?.data.vibeProfile ?? null;
  const moodCounts = /* @__PURE__ */ new Map();
  allBlocks.forEach((b) => {
    if (!b.data.mood || b.data.mood === mood) return;
    moodCounts.set(b.data.mood, (moodCounts.get(b.data.mood) ?? 0) + 1);
  });
  allProducts.forEach((p) => {
    (p.data.pairsWithMood ?? []).forEach((m) => {
      if (m === mood) return;
      moodCounts.set(m, (moodCounts.get(m) ?? 0) + 1);
    });
  });
  const adjacentMoods = Array.from(moodCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([m, n]) => ({ mood: m, count: n }));
  const moodTitle = template.label;
  const title = `Pairings · ${moodTitle}`;
  const description = `${template.dek} ${blocks.length} block${blocks.length === 1 ? "" : "s"} and ${products.length} Good Feels product${products.length === 1 ? "" : "s"} keyed to "${mood}".`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: `https://pointcast.xyz/pairings/${mood}`
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "image": "/images/og/polls.png", "jsonLd": jsonLd, "data-astro-cid-q6iwd3om": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="page"${addAttribute(`--mood-accent:${template.accent};--mood-wash:${template.wash};--mood-ink:${template.ink}`, "style")} data-astro-cid-q6iwd3om> <nav class="crumb" aria-label="Breadcrumb" data-astro-cid-q6iwd3om> <a href="/" data-astro-cid-q6iwd3om>Home</a> <span aria-hidden="true" data-astro-cid-q6iwd3om>›</span> <a href="/pairings" data-astro-cid-q6iwd3om>pairings</a> <span aria-hidden="true" data-astro-cid-q6iwd3om>›</span> <span data-astro-cid-q6iwd3om>${mood}</span> </nav> <header class="head" data-astro-cid-q6iwd3om> <p class="kicker mono" data-astro-cid-q6iwd3om>PAIRING · MOOD</p> <h1 class="title" data-astro-cid-q6iwd3om>${moodTitle}</h1> <p class="dek" data-astro-cid-q6iwd3om> ${template.dek} Every PointCast surface keyed to <code class="mono" data-astro-cid-q6iwd3om>${mood}</code> — editorial blocks, Good Feels products, and soundtrack cues under one register.
</p> <p class="template-line mono" data-astro-cid-q6iwd3om>${template.register}</p> </header> ${vibeProfile && renderTemplate`<section class="vibe"${addAttribute(vibeProfile, "data-vibe-profile")} data-astro-cid-q6iwd3om> <div class="vibe__text" data-astro-cid-q6iwd3om> <p class="vibe__kicker mono" data-astro-cid-q6iwd3om>VIBE · SONIC POSTCARD</p> <p class="vibe__profile mono" data-astro-cid-q6iwd3om>${vibeProfile}</p> <p class="vibe__dek" data-astro-cid-q6iwd3om>Procedural ambient synthesized in-browser. Plays while you browse this pairing.</p> </div> <button type="button" class="vibe__btn mono" data-role="vibe-toggle" aria-pressed="false" data-astro-cid-q6iwd3om>▶ PLAY VIBE</button> </section>`} <section class="grid" data-astro-cid-q6iwd3om> <div class="col col--blocks" data-astro-cid-q6iwd3om> <p class="col__kicker mono" data-astro-cid-q6iwd3om>EDITORIAL · ${blocks.length} BLOCK${blocks.length === 1 ? "" : "S"}</p> ${blocks.length === 0 ? renderTemplate`<p class="empty" data-astro-cid-q6iwd3om>No blocks yet for <code data-astro-cid-q6iwd3om>${mood}</code>. A block tagged with this mood will surface here on next publish.</p>` : renderTemplate`<ul class="cards" data-astro-cid-q6iwd3om> ${blocks.map((b) => {
    const ch = CHANNELS[b.data.channel];
    const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "2-digit" }).format(b.data.timestamp);
    return renderTemplate`<li class="card card--block" data-astro-cid-q6iwd3om> <a${addAttribute(`/b/${b.data.id}`, "href")} class="card__link"${addAttribute(`--ch-600:${ch.color600};--ch-50:${ch.color50};--ch-800:${ch.color800}`, "style")} data-astro-cid-q6iwd3om> <span class="card__chip mono" data-astro-cid-q6iwd3om>CH.${ch.code} · ${b.data.type}</span> <h2 class="card__title" data-astro-cid-q6iwd3om>${b.data.title}</h2> ${b.data.dek && renderTemplate`<p class="card__dek" data-astro-cid-q6iwd3om>${b.data.dek}</p>`} <p class="card__meta mono" data-astro-cid-q6iwd3om>№${b.data.id} · ${date.toUpperCase()}</p> </a> </li>`;
  })} </ul>`} </div> <div class="col col--products" data-astro-cid-q6iwd3om> <p class="col__kicker mono" data-astro-cid-q6iwd3om>COMMERCE · ${products.length} GOOD FEELS PRODUCT${products.length === 1 ? "" : "S"}</p> ${products.length === 0 ? renderTemplate`<p class="empty" data-astro-cid-q6iwd3om>No Good Feels products pair with <code data-astro-cid-q6iwd3om>${mood}</code> yet.</p>` : renderTemplate`<ul class="cards" data-astro-cid-q6iwd3om> ${products.map((p) => {
    const host = checkoutHost(p.data.url);
    return renderTemplate`<li class="card card--product" data-astro-cid-q6iwd3om> <a${addAttribute(p.data.url, "href")} class="card__link card__link--shop" target="_blank" rel="noopener" data-astro-cid-q6iwd3om> <span class="card__chip mono" data-astro-cid-q6iwd3om>${(p.data.category || "PRODUCT").toUpperCase()} · $${p.data.priceUsd ?? "—"}</span> <h2 class="card__title" data-astro-cid-q6iwd3om>${p.data.name}</h2> ${p.data.dek && renderTemplate`<p class="card__dek" data-astro-cid-q6iwd3om>${p.data.dek}</p>`} ${p.data.effects && p.data.effects.length > 0 && renderTemplate`<p class="card__effects mono" data-astro-cid-q6iwd3om>${p.data.effects.join(" · ")}</p>`} ${p.data.vibeProfile && renderTemplate`<p class="card__vibe mono" data-astro-cid-q6iwd3om>♫ VIBE · ${p.data.vibeProfile}</p>`} <p class="card__meta mono" data-astro-cid-q6iwd3om>→ ${host}</p> </a> </li>`;
  })} </ul>`} </div> </section> ${adjacentMoods.length > 0 && renderTemplate`<section class="adjacent" data-astro-cid-q6iwd3om> <p class="kicker mono" data-astro-cid-q6iwd3om>OTHER MOODS</p> <ul class="adjacent__list" data-astro-cid-q6iwd3om> ${adjacentMoods.map(({ mood: m, count }) => renderTemplate`<li data-astro-cid-q6iwd3om><a class="adjacent__chip mono"${addAttribute(`/pairings/${m}`, "href")} data-astro-cid-q6iwd3om>${m} · ${count}</a></li>`)} </ul> </section>`} <section class="agent-strip" data-astro-cid-q6iwd3om> <p class="agent-strip__label mono" data-astro-cid-q6iwd3om>MACHINE-READABLE</p> <ul data-astro-cid-q6iwd3om> <li data-astro-cid-q6iwd3om><a href="/api/products.jsonl" data-astro-cid-q6iwd3om>/api/products.jsonl</a></li> <li data-astro-cid-q6iwd3om><a href="/api/blocks.jsonl" data-astro-cid-q6iwd3om>/api/blocks.jsonl</a></li> <li data-astro-cid-q6iwd3om><a${addAttribute(`/mood/${mood}`, "href")} data-astro-cid-q6iwd3om>/mood/${mood} (blocks-only)</a></li> <li data-astro-cid-q6iwd3om><a href="/for-agents" data-astro-cid-q6iwd3om>/for-agents</a></li> </ul> </section> ${vibeProfile && renderTemplate(_a || (_a = __template([`<script>
        (() => {
          const vibe = document.querySelector('.vibe[data-vibe-profile]');
          if (!vibe) return;
          const profile = vibe.getAttribute('data-vibe-profile');
          const btn = vibe.querySelector('[data-role="vibe-toggle"]');
          if (!btn) return;

          // The Sonic Postcard profiles live on /clock/0324. Rather than
          // re-implement the synth graph here, we open the clock in a new
          // tab with ?play={profile} as a hint, and fall back to a tiny
          // inline synth for the pairing page itself — a single minor
          // chord pulse keyed to the profile hash. Low-fidelity preview;
          // full patch lives on the clock page.
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) { btn.disabled = true; btn.textContent = 'AUDIO UNAVAILABLE'; return; }

          let ctx = null, stack = [];
          function pulse() {
            if (!ctx) ctx = new AC();
            if (ctx.state === 'suspended') ctx.resume();
            // Minor triad, one shimmer per 8s. Simple preview.
            const roots = { 'el-segundo': 146.83, 'medway': 164.81, 'nyc': 174.61, 'london': 196, 'mallorca': 146.83, 'istanbul': 146.83, 'tokyo': 220, 'mexico-city': 174.61 };
            const root = roots[profile] ?? 146.83;
            const t = ctx.currentTime;
            [root, root * 1.189, root * 1.498].forEach((f, i) => {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.type = 'sine';
              o.frequency.value = f;
              o.connect(g).connect(ctx.destination);
              g.gain.setValueAtTime(0, t);
              g.gain.linearRampToValueAtTime(0.035, t + 0.4 + i * 0.15);
              g.gain.exponentialRampToValueAtTime(0.0008, t + 6);
              o.start(t); o.stop(t + 6.1);
              stack.push({ o, g });
            });
          }
          let timer = null;
          let on = false;
          btn.addEventListener('click', () => {
            on = !on;
            btn.setAttribute('aria-pressed', String(on));
            if (on) {
              btn.textContent = '⏹ STOP VIBE';
              pulse();
              timer = setInterval(pulse, 8000);
            } else {
              btn.textContent = '▶ PLAY VIBE';
              if (timer) clearInterval(timer);
              stack.forEach(({ o, g }) => {
                try { o.stop(); } catch(e) {}
                try { g.disconnect(); } catch(e) {}
              });
              stack = [];
            }
          });
        })();
      <\/script>`])))} </main> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/pairings/[mood].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/pairings/[mood].astro";
const $$url = "/pairings/[mood]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$mood,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
