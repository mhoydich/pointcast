import { c as createComponent } from './astro-component_DWMcTjG3.mjs';
import 'piccolore';
import { r as renderComponent, a as renderTemplate, m as maybeRenderHead, b as addAttribute, F as Fragment } from './prerender_CmTjnOuJ.mjs';
import { g as getCollection } from './_astro_content_kC0GrL8i.mjs';
import { $ as $$BlockLayout } from './BlockLayout_DHviHHrD.mjs';
import { C as CHANNELS } from './channels_C2qW9mSV.mjs';

async function getStaticPaths() {
  const allBlocks = await getCollection("blocks", ({ data }) => !data.draft);
  const family = await getCollection("family", ({ data }) => data.listed);
  const slugs = /* @__PURE__ */ new Set();
  for (const b of allBlocks) {
    if (b.data.channel === "BDY" || b.data.type === "BIRTHDAY") {
      const s = b.data.meta?.for;
      if (s) slugs.add(s);
    }
  }
  for (const f of family) {
    if (f.data.birthday) slugs.add(f.data.slug);
  }
  return Array.from(slugs).map((slug) => ({ params: { slug } }));
}
const $$slug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$slug;
  const { slug } = Astro2.params;
  const ch = CHANNELS.BDY;
  const allBlocks = await getCollection("blocks", ({ data }) => !data.draft);
  const family = await getCollection("family", ({ data }) => data.listed);
  const fam = family.find((f) => f.data.slug === slug);
  const blocks = allBlocks.filter(
    (b) => (b.data.channel === "BDY" || b.data.type === "BIRTHDAY") && b.data.meta?.for === slug
  ).sort((a, b) => +new Date(b.data.timestamp) - +new Date(a.data.timestamp));
  const displayName = fam?.data.name ?? slug;
  const noun = fam?.data.permanentNoun ?? blocks[0]?.data.noun;
  const relationship = fam?.data.relationship;
  const birthday = fam?.data.birthday;
  function todayPT() {
    const ptStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(/* @__PURE__ */ new Date());
    return /* @__PURE__ */ new Date(ptStr + "T00:00:00");
  }
  function nextOccurrence(mmdd, from) {
    const [mm, dd] = mmdd.split("-").map(Number);
    const yr = from.getFullYear();
    let candidate = new Date(yr, mm - 1, dd);
    if (candidate < from) candidate = new Date(yr + 1, mm - 1, dd);
    return candidate;
  }
  const today = todayPT();
  const next = birthday ? nextOccurrence(birthday, today) : null;
  const isToday = next && +next === +today;
  const daysAway = next ? Math.round((+next - +today) / 864e5) : null;
  const longDate = next ? new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Los_Angeles"
  }).format(next) : null;
  const blockYear = (b) => new Date(b.data.timestamp).getUTCFullYear();
  const title = `${displayName} · /cake — birthday timeline`;
  const description = `Every birthday block PointCast has published for ${displayName}${noun != null ? `, Noun ${noun}` : ""}. ${blocks.length} block${blocks.length === 1 ? "" : "s"} on file. ${birthday ? `Next birthday: ${birthday} (MM-DD).` : "No birthday in registry yet."}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `https://pointcast.xyz/cake/${slug}`,
    name: title,
    description,
    url: `https://pointcast.xyz/cake/${slug}`,
    about: {
      "@type": "Person",
      name: displayName,
      identifier: slug
    },
    numberOfItems: blocks.length,
    hasPart: blocks.map((b) => ({
      "@type": "CreativeWork",
      "@id": `https://pointcast.xyz/b/${b.data.id}`,
      name: b.data.title,
      url: `https://pointcast.xyz/b/${b.data.id}`,
      dateCreated: b.data.timestamp
    }))
  };
  return renderTemplate`${renderComponent($$result, "BlockLayout", $$BlockLayout, { "title": title, "description": description, "jsonLd": jsonLd, "data-astro-cid-3ajzbodl": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="page"${addAttribute(`--ch-600: ${ch.color600}; --ch-800: ${ch.color800}; --ch-50: ${ch.color50};`, "style")} data-astro-cid-3ajzbodl> <nav class="crumb mono" aria-label="Breadcrumb" data-astro-cid-3ajzbodl> <a href="/" data-astro-cid-3ajzbodl>← All blocks</a> <span aria-hidden="true" data-astro-cid-3ajzbodl>/</span> <a href="/cake"${addAttribute(`color: var(--ch-800);`, "style")} data-astro-cid-3ajzbodl>/cake</a> <span aria-hidden="true" data-astro-cid-3ajzbodl>/</span> <span data-astro-cid-3ajzbodl>${slug}</span> </nav> <header class="head" data-astro-cid-3ajzbodl> <div class="head__row" data-astro-cid-3ajzbodl> ${noun != null && renderTemplate`<img class="head__noun"${addAttribute(`https://noun.pics/${noun}.svg`, "src")}${addAttribute(`Noun ${noun}`, "alt")} width="120" height="120" data-astro-cid-3ajzbodl>`} <div class="head__copy" data-astro-cid-3ajzbodl> <p class="head__kicker mono" data-astro-cid-3ajzbodl>CH.BDY · /CAKE/${slug.toUpperCase()}</p> <h1 class="head__title" data-astro-cid-3ajzbodl>${displayName}</h1> ${relationship && renderTemplate`<p class="head__rel" data-astro-cid-3ajzbodl>${relationship}</p>`} <p class="head__sub mono" data-astro-cid-3ajzbodl> ${noun != null ? `PERMANENT NOUN ${noun}` : "NO PERMANENT NOUN YET"} <span class="head__sep" data-astro-cid-3ajzbodl>·</span> ${blocks.length} ${blocks.length === 1 ? "BLOCK" : "BLOCKS"} ON FILE
${birthday && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-3ajzbodl": true }, { "default": async ($$result3) => renderTemplate` <span class="head__sep" data-astro-cid-3ajzbodl>·</span>
BIRTHDAY ${birthday} (MM-DD)
` })}`} </p> </div> </div> ${next && renderTemplate`<div${addAttribute(`countdown mono${isToday ? " countdown--today" : ""}`, "class")} data-astro-cid-3ajzbodl> ${isToday ? renderTemplate`<span data-astro-cid-3ajzbodl><strong data-astro-cid-3ajzbodl>TODAY.</strong> Happy birthday, ${displayName}.</span>` : daysAway === 1 ? renderTemplate`<span data-astro-cid-3ajzbodl><strong data-astro-cid-3ajzbodl>TOMORROW</strong> · next birthday — ${longDate}</span>` : renderTemplate`<span data-astro-cid-3ajzbodl><strong data-astro-cid-3ajzbodl>IN ${daysAway} DAYS</strong> · next birthday — ${longDate}</span>`} </div>`} </header> ${blocks.length > 0 ? renderTemplate`<section class="timeline" data-astro-cid-3ajzbodl> <h2 class="section__title mono" data-astro-cid-3ajzbodl>Timeline · most recent first</h2> <ul class="timeline__list" data-astro-cid-3ajzbodl> ${blocks.map((b) => renderTemplate`<li class="t-item" data-astro-cid-3ajzbodl> <a class="t-link"${addAttribute(`/b/${b.data.id}`, "href")} data-astro-cid-3ajzbodl> <span class="t-year mono" data-astro-cid-3ajzbodl>${blockYear(b)}</span> <div class="t-body" data-astro-cid-3ajzbodl> <p class="t-id mono" data-astro-cid-3ajzbodl>№${b.data.id}</p> <p class="t-title" data-astro-cid-3ajzbodl>${b.data.title}</p> ${b.data.dek && renderTemplate`<p class="t-dek" data-astro-cid-3ajzbodl>${b.data.dek}</p>`} <p class="t-meta mono" data-astro-cid-3ajzbodl> ${b.data.noun != null ? `NOUN ${b.data.noun}` : "NO NOUN"} <span class="t-sep" data-astro-cid-3ajzbodl>·</span>
CLAIMED ${b.data.edition?.minted ?? 0}/∞
</p> </div> </a> </li>`)} </ul> </section>` : renderTemplate`<section class="empty-section" data-astro-cid-3ajzbodl> <p class="empty mono" data-astro-cid-3ajzbodl>
no birthday blocks for <strong data-astro-cid-3ajzbodl>${displayName}</strong> yet.
${birthday && next && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-3ajzbodl": true }, { "default": async ($$result3) => renderTemplate` <br data-astro-cid-3ajzbodl>Next birthday is ${longDate}.
` })}`} </p> </section>`} <footer class="foot mono" data-astro-cid-3ajzbodl> <a href="/cake" data-astro-cid-3ajzbodl>← back to /cake</a> <span aria-hidden="true" data-astro-cid-3ajzbodl>·</span> <a${addAttribute(`/cake/${slug}.json`, "href")} data-astro-cid-3ajzbodl>/cake/${slug}.json (coming soon)</a> ${fam && renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "data-astro-cid-3ajzbodl": true }, { "default": async ($$result3) => renderTemplate` <span aria-hidden="true" data-astro-cid-3ajzbodl>·</span> <a href="/family" data-astro-cid-3ajzbodl>/family entry ↗</a> ` })}`} </footer> </div> ` })}`;
}, "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cake/[slug].astro", void 0);

const $$file = "/Users/michaelhoydich/Documents/join us yee/pointcast-shipping/src/pages/cake/[slug].astro";
const $$url = "/cake/[slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$slug,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
